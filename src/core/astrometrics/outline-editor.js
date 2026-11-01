/**
 * Astrometrics outline editor (the Studio's Edit on preview for a prism
 * volume): the outline's corners as handles on the prism's base, drag one
 * to move it (snapped to `snap` unless Shift is held), tap a + between two
 * corners to add one there, select a corner and press Delete to drop it.
 * Draw mode taps corners in order on the ground and closes on the first one.
 *
 * The handles are HTML over the canvas (as the labels are), placed by the
 * runtime each frame through `project`; `ground` turns a spot on screen
 * into [x, z] on the prism's base. The pure helpers are exported for tests.
 *
 * @module core/astrometrics/outline-editor
 */

/** @typedef {[number, number]} Corner */

/** A drawn outline closes on its first corner, and needs this many */
export const MIN_CORNERS = 3;

/**
 * @param {number} v
 * @param {number} step - 0 or less: no snapping
 */
export function snapValue(v, step) {
  if (!(step > 0)) return v;
  return Number((Math.round(v / step) * step).toPrecision(12));
}

/**
 * A corner snapped to the step, both axes.
 * @param {Corner} p
 * @param {number} step
 * @returns {Corner}
 */
export function snapCorner(p, step) {
  return [snapValue(p[0], step), snapValue(p[1], step)];
}

/**
 * The outline with a corner at the middle of the edge from corner `i` to the next.
 * @param {Corner[]} outline
 * @param {number} i
 * @returns {Corner[]}
 */
export function insertCorner(outline, i) {
  const a = outline[i];
  const b = outline[(i + 1) % outline.length];
  if (!a || !b) return outline;
  const mid = /** @type {Corner} */ ([Number(((a[0] + b[0]) / 2).toPrecision(12)), Number(((a[1] + b[1]) / 2).toPrecision(12))]);
  return [...outline.slice(0, i + 1), mid, ...outline.slice(i + 1)];
}

/**
 * The outline without corner `i` (never under MIN_CORNERS).
 * @param {Corner[]} outline
 * @param {number} i
 * @returns {Corner[]}
 */
export function removeCorner(outline, i) {
  if (outline.length <= MIN_CORNERS || i < 0 || i >= outline.length) return outline;
  return outline.filter((_, k) => k !== i);
}

/**
 * The outline with corner `i` at `p`.
 * @param {Corner[]} outline
 * @param {number} i
 * @param {Corner} p
 * @returns {Corner[]}
 */
export function moveCorner(outline, i, p) {
  return outline.map((c, k) => (k === i ? /** @type {Corner} */ ([p[0], p[1]]) : c));
}

/**
 * The middle of each edge (corner i to the next), for the + handles.
 * @param {Corner[]} outline
 * @returns {Corner[]}
 */
export function edgeMiddles(outline) {
  return outline.map((a, i) => {
    const b = outline[(i + 1) % outline.length];
    return /** @type {Corner} */ ([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  });
}

/**
 * A snap step for an outline: a round length about a twentieth of its span
 * (1, 2 or 5 times a power of ten).
 * @param {Corner[]} outline
 */
export function outlineStep(outline) {
  if (!outline.length) return 1;
  const xs = outline.map((p) => p[0]);
  const zs = outline.map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  if (!(span > 0)) return 1;
  const n = span / 20;
  const exp = Math.floor(Math.log10(n));
  const base = n / 10 ** exp;
  return Number(((base >= 5 ? 5 : base >= 2 ? 2 : 1) * 10 ** exp).toPrecision(1));
}

export const OUTLINE_EDITOR_CSS = `
.astro-scene .astro-outline { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
.astro-scene .astro-outline.drawing { pointer-events: auto; cursor: crosshair; }
.astro-scene .astro-outline svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.astro-scene .astro-outline polyline { fill: none; stroke: var(--lcards-moonlight); stroke-width: 1.5; stroke-dasharray: 4 3; opacity: 0.8; }
.astro-scene .astro-outline button { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; padding: 0; margin: 0;
  border: var(--ha-border-width-md) solid var(--lcards-moonlight); border-radius: var(--ha-border-radius-circle, 50%); touch-action: none; }
.astro-scene .astro-outline button.corner { width: 14px; height: 14px; background: var(--lcards-gray-medium-dark); cursor: grab; }
.astro-scene .astro-outline button.corner.selected { background: var(--lcards-moonlight); }
.astro-scene .astro-outline button.corner.first { width: 18px; height: 18px; }
.astro-scene .astro-outline button.middle { width: 12px; height: 12px; background: transparent; opacity: 0.7; cursor: copy;
  font: 10px/1 sans-serif; color: var(--lcards-moonlight); display: flex; align-items: center; justify-content: center; }
.astro-scene .astro-outline button.middle::before { content: '+'; }
.astro-scene .astro-outline button[hidden] { display: none; }
.astro-scene .astro-outline button:focus-visible { outline: var(--ha-border-width-md) solid var(--primary-color); outline-offset: 2px; }
`;

/**
 * @typedef {Object} OutlineEditorOptions
 * @property {HTMLElement} wrap - the scene's element
 * @property {(p: Corner) => ({ x: number, y: number } | null)} project - a corner on the prism's base to CSS px (null behind the camera)
 * @property {(x: number, y: number) => (Corner | null)} ground - CSS px to [x, z] on the prism's base, or null
 * @property {(outline: Corner[], done: boolean) => void} onChange - live while dragging (done false), once more when a change is made
 * @property {() => void} [onExit] - Escape
 * @property {(index: number) => void} [onSelectCorner]
 */

/**
 * @param {OutlineEditorOptions} o
 */
export function createOutlineEditor(o) {
  const el = document.createElement('div');
  el.className = 'astro-outline';
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS(ns, 'polyline');
  svg.append(line);
  el.append(svg);
  o.wrap.append(el);

  /** @type {Corner[]} */
  let outline = [];
  let step = 0;
  let mode = /** @type {'edit' | 'draw'} */ ('edit');
  let selected = -1;
  /** @type {HTMLButtonElement[]} */
  let corners = [];
  /** @type {HTMLButtonElement[]} */
  let middles = [];
  /** @type {{ i: number, id: number, moved: boolean, start: Corner } | null} */
  let drag = null;

  const setSelected = (/** @type {number} */ i) => {
    selected = i;
    corners.forEach((c, k) => c.classList.toggle('selected', k === i));
    o.onSelectCorner?.(i);
  };

  const change = (/** @type {Corner[]} */ next, /** @type {boolean} */ done) => {
    outline = next;
    o.onChange(outline, done);
  };

  /** @param {number} i */
  const removeAt = (i) => {
    const next = removeCorner(outline, i);
    if (next === outline) return;
    change(next, true);
    rebuild();
    setSelected(Math.min(i, outline.length - 1));
  };

  /** @param {KeyboardEvent} e @param {number} i */
  const onCornerKey = (e, i) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      removeAt(i);
      corners[selected]?.focus();
    } else if (e.key === 'Escape') {
      // not the dialog's Escape: it ends the outline editing only
      e.preventDefault();
      e.stopPropagation();
      o.onExit?.();
    }
  };

  /** @param {PointerEvent} e @param {number} i */
  const onCornerDown = (e, i) => {
    if (e.button > 0) return;
    e.stopPropagation();
    e.preventDefault();
    // draw mode: the first corner closes the outline
    if (mode === 'draw') {
      if (i === 0 && outline.length >= MIN_CORNERS) finishDraw();
      return;
    }
    setSelected(i);
    const b = /** @type {HTMLButtonElement} */ (e.currentTarget);
    b.setPointerCapture?.(e.pointerId);
    b.focus();
    drag = { i, id: e.pointerId, moved: false, start: outline[i] };
  };
  /** @param {PointerEvent} e */
  const onCornerMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const r = o.wrap.getBoundingClientRect();
    const p = o.ground(e.clientX - r.left, e.clientY - r.top);
    if (!p) return;
    const q = e.shiftKey ? p : snapCorner(p, step);
    if (q[0] === outline[drag.i][0] && q[1] === outline[drag.i][1]) return;
    drag.moved = true;
    change(moveCorner(outline, drag.i, q), false);
    update();
  };
  /** @param {PointerEvent} e */
  const onCornerUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.moved) change(outline, true);
  };

  /** @param {PointerEvent} e @param {number} i */
  const onMiddleDown = (e, i) => {
    if (e.button > 0 || mode !== 'edit') return;
    e.stopPropagation();
    e.preventDefault();
    change(insertCorner(outline, i), true);
    rebuild();
    setSelected(i + 1);
    corners[i + 1]?.focus();
  };

  /** @param {PointerEvent} e */
  const onDrawDown = (e) => {
    // a tap anywhere on the layer (its line's svg too); the corner buttons stop their own
    if (mode !== 'draw' || e.button > 0) return;
    e.preventDefault();
    const r = o.wrap.getBoundingClientRect();
    const p = o.ground(e.clientX - r.left, e.clientY - r.top);
    if (!p) return;
    outline = [...outline, e.shiftKey ? p : snapCorner(p, step)];
    rebuild();
  };
  el.addEventListener('pointerdown', onDrawDown);

  function finishDraw() {
    if (outline.length < MIN_CORNERS) return false;
    mode = 'edit';
    el.classList.remove('drawing');
    change(outline, true);
    rebuild();
    return true;
  }

  /** @param {string} cls @param {string} label */
  const handle = (cls, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.title = label;
    el.append(b);
    return b;
  };

  function rebuild() {
    for (const b of [...corners, ...middles]) b.remove();
    corners = outline.map((_, i) => {
      const b = handle(i === 0 && mode === 'draw' ? 'corner first' : 'corner', mode === 'draw' && i === 0 ? 'Close the outline' : `Corner ${i + 1}: drag to move (Shift: no snapping), Delete to remove`);
      b.addEventListener('pointerdown', (e) => onCornerDown(e, i));
      b.addEventListener('pointermove', onCornerMove);
      b.addEventListener('pointerup', onCornerUp);
      b.addEventListener('pointercancel', onCornerUp);
      b.addEventListener('keydown', (e) => onCornerKey(e, i));
      return b;
    });
    middles = mode === 'edit' ? outline.map((_, i) => {
      const b = handle('middle', `Add a corner between ${i + 1} and ${((i + 1) % outline.length) + 1}`);
      b.addEventListener('pointerdown', (e) => onMiddleDown(e, i));
      return b;
    }) : [];
    corners.forEach((c, k) => c.classList.toggle('selected', k === selected));
    update();
  }

  /** Place the handles and the line on screen (each frame the camera or the outline moves) */
  function update() {
    /** @param {HTMLElement} b @param {Corner} p */
    const place = (b, p) => {
      const s = o.project(p);
      b.hidden = !s;
      if (s) {
        b.style.left = `${s.x}px`;
        b.style.top = `${s.y}px`;
      }
      return s;
    };
    const pts = outline.map((p, i) => place(corners[i], p));
    edgeMiddles(outline).forEach((p, i) => { if (middles[i]) place(middles[i], p); });
    const shown = pts.filter((s) => !!s).map((s) => `${/** @type {any} */ (s).x},${/** @type {any} */ (s).y}`);
    if (mode === 'edit' && shown.length === outline.length && shown.length) shown.push(shown[0]);
    line.setAttribute('points', shown.join(' '));
  }

  return {
    /**
     * Start editing this outline, or drawing a new one (`draw`).
     * @param {Corner[]} next
     * @param {{ snap?: number, draw?: boolean }} [opts]
     */
    set(next, opts = {}) {
      if (drag) return;
      outline = next.map((p) => /** @type {Corner} */ ([p[0], p[1]]));
      step = opts.snap ?? outlineStep(outline);
      mode = opts.draw ? 'draw' : 'edit';
      if (mode === 'draw') outline = [];
      el.classList.toggle('drawing', mode === 'draw');
      if (selected >= outline.length) selected = -1;
      rebuild();
    },
    /** The outline as the Studio's form changed it (no rebuild while dragging) */
    /** @param {Corner[]} next */
    sync(next) {
      if (drag || mode === 'draw') return;
      const same = next.length === outline.length && next.every((p, i) => p[0] === outline[i][0] && p[1] === outline[i][1]);
      if (same) return;
      outline = next.map((p) => /** @type {Corner} */ ([p[0], p[1]]));
      if (selected >= outline.length) selected = -1;
      rebuild();
    },
    update,
    /** Draw mode: close the outline (Done), false with too few corners */
    finish: () => (mode === 'draw' ? finishDraw() : true),
    removeSelected: () => { if (selected >= 0) removeAt(selected); },
    state: () => ({ mode, selected, outline: outline.map((p) => [...p]), step }),
    dispose() {
      el.removeEventListener('pointerdown', onDrawDown);
      el.remove();
    }
  };
}
