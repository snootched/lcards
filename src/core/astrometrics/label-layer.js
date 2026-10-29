/**
 * DOM labels pinned to scene points, over the canvas, on the LCARdS text
 * system (`label-text.js`): each label is a 3 x 3 grid round the point (the
 * marker in the centre cell) holding its text fields, each styled by the
 * text-field keys (font, size, weight, transform, spacing, colour,
 * background). Colours are CSS values (CSS variables stay live, so alert
 * modes recolour them); one absolutely positioned element per label, moved
 * with `translate3d`.
 *
 * Per frame (`layoutLabels`, pure): project, hide what is behind a sphere
 * (an analytic ray test, no GPU readback), fade by distance, apply the
 * `min_distance` / `max_distance` range, then cull collisions (higher
 * priority first, then nearer). `LabelLayer.update` writes only the
 * transforms and opacities that changed; text and colour changes come
 * through `style()` and re-measure only that label. Positions are sub-pixel
 * by default (smoother for fast motion); `snap` rounds them to whole px.
 *
 * @module core/astrometrics/label-layer
 */
import { Vector3 } from 'three';
import { markerSvg } from './markers.js';
import { viewDepth, depthNear } from './depth-occlusion.js';
import { distanceAlpha, HIDDEN_ALPHA } from './distance-fade.js';
import { BUILTIN_LABEL_STYLES, LABEL_POSITIONS, fieldCss } from './label-text.js';

/** Built-in label styles: font size (px) and default priority */
export const LABEL_STYLES = /** @type {Record<'title' | 'major' | 'minor' | 'tiny', { size: number, priority: number }>} */ (
  Object.fromEntries(Object.entries(BUILTIN_LABEL_STYLES).map(([k, v]) => [k, { size: v.font_size, priority: v.priority }]))
);

/**
 * One text field of a label, as drawn.
 * @typedef {Object} LabelItemField
 * @property {string} name
 * @property {string} position - one of LABEL_POSITIONS
 * @property {string} css - fixed inline style (fieldCss)
 * @property {string} text
 * @property {string} color - CSS value
 * @property {string} selectedColor - CSS value, when the point is selected
 * @property {string} [background] - CSS value
 */

/**
 * @typedef {Object} LabelItem
 * @property {string} id
 * @property {LabelItemField[]} fields
 * @property {string} style - the point's style name
 * @property {number} priority
 * @property {string} marker
 * @property {[number, number] | null} fade - distance where it starts fading, and where it is gone
 * @property {number} minDistance
 * @property {number} maxDistance
 * @property {string | null} occluderSkip - the sphere this point belongs to (never hides it)
 * @property {string | null} host - the object the point stands on (`object:`): a depth occluder lets it sit a little inside, a box occluder never hides it
 * @property {boolean} pickable
 * @property {number} w - measured box, CSS px
 * @property {number} h
 * @property {number} ax - the point inside the box (the marker's centre, or the centre cell's), CSS px
 * @property {number} ay
 * @property {boolean} empty - no marker and no text to show
 * @property {boolean} anchor - laid out even when empty (a card is pinned to the point); an empty anchor takes no room from other labels
 * @property {boolean} overlap - never hidden by a collision (shown where it is when no side is free)
 * @property {number} flip - placement this frame: 0 as configured, 1 mirrored left-right, 2 up-down, 3 both (to dodge another label)
 * @property {Vector3 | null} world - position this frame
 * @property {number} alphaScale - 0 to 1 (a sky point below the horizon dims, a rule's opacity)
 * @property {boolean} selected
 * @property {number} sx - projected position, CSS px
 * @property {number} sy
 * @property {number} depth
 * @property {number} alpha
 * @property {boolean} visible
 * @property {'ok' | 'off' | 'occluded' | 'range' | 'culled'} reason
 */

/**
 * What hides labels behind it: a sphere (globes), an oriented box (`inverse`:
 * world to box space, the box centred there with half sizes `half`), or a
 * depth image of meshes (models; `bias(host, dist)`: how far, scene units, a point
 * may sit behind the image and still show, for points on that object).
 * @typedef {{ kind?: 'sphere', center: Vector3, radius: number, id: string }
 *   | { kind: 'box', inverse: import('three').Matrix4, half: number[], id: string }
 *   | { kind: 'depth', snapshot: import('./depth-occlusion.js').DepthSnapshot, bias: (host: string | null, dist: number) => number, id: string }} Occluder
 */

/**
 * A label item with defaults (the per-frame fields cleared).
 * @param {Partial<LabelItem> & { id: string }} o
 * @returns {LabelItem}
 */
export function labelItem(o) {
  const style = o.style ?? 'minor';
  return {
    fields: [],
    priority: (BUILTIN_LABEL_STYLES[style] ?? BUILTIN_LABEL_STYLES.minor).priority,
    marker: 'none',
    fade: null,
    minDistance: 0,
    maxDistance: Infinity,
    occluderSkip: null,
    host: null,
    pickable: false,
    w: 0,
    h: 0,
    ax: NaN,
    ay: NaN,
    empty: false,
    anchor: false,
    overlap: false,
    flip: 0,
    world: null,
    alphaScale: 1,
    selected: false,
    ...o,
    style,
    sx: 0,
    sy: 0,
    depth: 0,
    alpha: 0,
    visible: false,
    reason: 'off'
  };
}

/** The point's offset inside the box (centre when not measured) @param {LabelItem} it */
const anchorX = (it) => (Number.isFinite(it.ax) ? it.ax : it.w / 2);
/** @param {LabelItem} it */
const anchorY = (it) => (Number.isFinite(it.ay) ? it.ay : it.h / 2);

/** Placements tried before a label is culled: 0 as configured, 1 mirrored left-right, 2 up-down, 3 both */
const FLIPS = [0, 1, 2, 3];
/** Room (CSS px) a mirrored label needs round its configured place before it goes back */
const BACK_MARGIN = 8;

/**
 * Whether mirroring changes anything: the fields sit off the point that way.
 * @param {LabelItem} it
 * @param {number} flip
 */
function canFlip(it, flip) {
  const off = (/** @type {number} */ i) => it.fields.some((f) => (LABEL_POSITIONS[f.position] ?? [2, 2])[i] !== 2);
  if (flip & 1 && !off(1)) return false;
  if (flip & 2 && !off(0)) return false;
  return true;
}

/**
 * The label's box in CSS px for a placement: a mirrored label keeps the
 * point where it was, so the box mirrors round the anchor.
 * @param {LabelItem} it
 * @param {number} flip
 * @returns {number[]}
 */
export function labelBox(it, flip = 0) {
  const ax = flip & 1 ? it.w - anchorX(it) : anchorX(it);
  const ay = flip & 2 ? it.h - anchorY(it) : anchorY(it);
  const x0 = it.sx - ax;
  const y0 = it.sy - ay;
  return [x0, y0, x0 + it.w, y0 + it.h];
}

const _o = new Vector3();
const _d = new Vector3();
const _e = new Vector3();
/**
 * Whether the segment from p along dir (unit, world) for `reach` passes
 * through an oriented box (slab test in box space; the box shrunk 2 % so a
 * point on its face is not hidden by it).
 * @param {Vector3} p
 * @param {Vector3} dir
 * @param {number} reach - Infinity for an orthographic camera
 * @param {import('three').Matrix4} inverse - world to box space
 * @param {number[]} half
 */
export function rayHitsBox(p, dir, reach, inverse, half) {
  _o.copy(p).applyMatrix4(inverse);
  // the direction in box space (no translation; scale kept so t stays in world units)
  _e.copy(p).add(dir).applyMatrix4(inverse);
  _d.copy(_e).sub(_o);
  let t0 = 1e-6;
  let t1 = reach;
  for (let a = 0; a < 3; a++) {
    const o = _o.getComponent(a);
    const d = _d.getComponent(a);
    const h = half[a] * 0.98;
    if (Math.abs(d) < 1e-12) {
      if (o < -h || o > h) return false;
      continue;
    }
    let ta = (-h - o) / d;
    let tb = (h - o) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

/**
 * Lay out the labels for one frame (in place): which show, where, how opaque.
 * @param {LabelItem[]} items
 * @param {import('three').Camera} camera - matrices up to date
 * @param {number} width - CSS px
 * @param {number} height
 * @param {Occluder[]} [occluders]
 * @returns {{ visible: number, culled: number, occluded: number }}
 */
export function layoutLabels(items, camera, width, height, occluders = []) {
  const v = new Vector3();
  const dir = new Vector3();
  const oc = new Vector3();
  const cam = new Vector3().setFromMatrixPosition(camera.matrixWorld);
  const ortho = /** @type {any} */ (camera).isOrthographicCamera === true;
  const back = ortho ? new Vector3(0, 0, 1).transformDirection(camera.matrixWorld) : null;
  /** @type {LabelItem[]} */
  const live = [];
  let occluded = 0;
  for (const it of items) {
    it.visible = false;
    it.reason = 'off';
    const p = it.world;
    if (!p || it.alphaScale <= 0 || (it.empty && !it.anchor)) continue;
    v.copy(p).project(camera);
    if (v.z > 1 || v.z < -1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) continue;
    it.sx = (v.x * 0.5 + 0.5) * width;
    it.sy = (-v.y * 0.5 + 0.5) * height;
    const dist = cam.distanceTo(p);
    it.depth = dist;
    // Behind a sphere: the ray from the point toward the camera passes inside it
    if (back) dir.copy(back);
    else dir.copy(cam).sub(p).divideScalar(Math.max(dist, 1e-9));
    const reach = back ? Infinity : dist;
    let hidden = false;
    for (const s of occluders) {
      if (s.id === it.occluderSkip) continue;
      if (s.kind === 'depth') {
        const behind = viewDepth(p, camera, oc) - depthNear(s.snapshot, it.sx / width, it.sy / height, it.host === null ? 1 : 0);
        if (behind > s.bias(it.host, dist)) { hidden = true; break; }
        continue;
      }
      if (s.kind === 'box') {
        if (s.id === it.host) continue;
        if (rayHitsBox(p, dir, reach, s.inverse, s.half)) { hidden = true; break; }
        continue;
      }
      oc.copy(s.center).sub(p);
      const tc = oc.dot(dir);
      if (tc <= 0 || tc >= reach) continue;
      const r = s.radius * 0.98;
      if (oc.lengthSq() - tc * tc < r * r) { hidden = true; break; }
    }
    if (hidden) { occluded++; it.reason = 'occluded'; continue; }
    const a = it.alphaScale * distanceAlpha(it, dist);
    it.alpha = a;
    if (a <= HIDDEN_ALPHA) { it.reason = 'range'; continue; }
    // Nothing drawn (only a card on the point): placed, but no box to collide
    if (it.empty) { it.visible = true; it.reason = 'ok'; continue; }
    live.push(it);
  }
  // Collision: selected first, then priority, then nearer; boxes in CSS px
  live.sort((a, b) => Number(b.selected) - Number(a.selected) || b.priority - a.priority || a.depth - b.depth);
  /** @type {number[][]} */
  const placed = [];
  let culled = 0;
  for (const it of live) {
    // As configured when it fits (a mirrored label goes back only with room to
    // spare, so it does not flicker at the edge), else where it was last frame,
    // else mirrored left-right, up-down, both
    // The card's edges count too: a placement that stays on the card wins
    // over one cut off by the edge (which is still better than none)
    const clashes = (/** @type {number[]} */ b, m = 0) => placed.some((p) => b[0] - m < p[2] && b[2] + m > p[0] && b[1] - m < p[3] && b[3] + m > p[1]);
    const inside = (/** @type {number[]} */ b, m = 0) => b[0] >= m && b[1] >= m && b[2] <= width - m && b[3] <= height - m;
    const order = [0, it.flip, ...FLIPS].filter((f, i, all) => all.indexOf(f) === i && (f === 0 || canFlip(it, f)));
    /** @type {[number, number[]] | null} */
    let pick = null;
    for (const strict of [true, false]) {
      for (const flip of order) {
        const b = labelBox(it, flip);
        // back to as configured only with room to spare (no flicker at the edge)
        const m = flip === 0 && it.flip !== 0 ? BACK_MARGIN : 0;
        if (clashes(b, m) || (strict && !inside(b, m))) continue;
        pick = [flip, b];
        break;
      }
      if (pick) break;
    }
    // overlap: shown anyway, where it was (or as configured)
    if (!pick && it.overlap) pick = [canFlip(it, it.flip) || it.flip === 0 ? it.flip : 0, labelBox(it, it.flip)];
    const box = pick ? pick[1] : null;
    if (pick) it.flip = pick[0];
    if (!box) { culled++; it.reason = 'culled'; continue; }
    placed.push(box);
    it.visible = true;
    it.reason = 'ok';
  }
  return { visible: placed.length, culled, occluded };
}

/**
 * Nearest visible pickable label within r px of (x, y).
 * @param {LabelItem[]} items
 * @param {number} x
 * @param {number} y
 * @param {number} [r]
 * @returns {LabelItem | null}
 */
export function pickLabel(items, x, y, r = 18) {
  let best = null;
  let bd = r * r;
  for (const it of items) {
    if (!it.visible || !it.pickable) continue;
    const d = (it.sx - x) ** 2 + (it.sy - y) ** 2;
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

const CSS = `
.astro-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.astro-label { position: absolute; left: 0; top: 0; white-space: nowrap; display: grid;
  grid-template-columns: auto auto auto; grid-template-rows: auto auto auto; column-gap: var(--ha-space-1); row-gap: 1px;
  line-height: 1; will-change: transform; opacity: 0; transition: opacity var(--ha-animation-duration-fast, 150ms); }
.astro-label .cell { display: flex; flex-direction: column; justify-content: center; gap: 1px; }
.astro-label .cell.c1 { align-items: flex-end; text-align: right; }
.astro-label .cell.c2 { align-items: center; text-align: center; }
.astro-label .cell.c3 { align-items: flex-start; text-align: left; }
.astro-label .cell.r1 { justify-content: flex-end; }
.astro-label .cell.r3 { justify-content: flex-start; }
.astro-label.fx .cell.c1 { grid-column: 3 !important; align-items: flex-start; text-align: left; }
.astro-label.fx .cell.c3 { grid-column: 1 !important; align-items: flex-end; text-align: right; }
.astro-label.fy .cell.r1 { grid-row: 3 !important; justify-content: flex-start; }
.astro-label.fy .cell.r3 { grid-row: 1 !important; justify-content: flex-end; }
.astro-label .mk { display: inline-flex; }
.astro-label .f { display: inline-block; }
`;

/**
 * @typedef {Object} LabelEls
 * @property {HTMLElement} el
 * @property {HTMLElement | null} mk
 * @property {HTMLElement} center - the centre cell
 * @property {Map<string, { el: HTMLElement, text: string, color: string, background: string }>} fields
 * @property {number} x
 * @property {number} y
 * @property {number} op
 * @property {number} flip - the placement classes on the element
 * @property {string} color
 * @property {string} svg
 */

/**
 * The DOM side: one element per item, measured in one batch (only labels
 * whose text, font or marker changed), written only when a value changes.
 */
export class LabelLayer {
  /**
   * @param {HTMLElement} host - positioned container over the canvas
   * @param {{ snap?: boolean }} [opts]
   */
  constructor(host, { snap = false } = {}) {
    this.root = document.createElement('div');
    this.root.className = 'astro-labels';
    const style = document.createElement('style');
    style.textContent = CSS;
    this.root.append(style);
    host.append(this.root);
    this.snap = snap;
    /** @type {LabelItem[]} */
    this.items = [];
    /** @type {Map<string, LabelItem>} */
    this._byId = new Map();
    /** @type {Map<string, LabelEls>} */
    this._els = new Map();
    /** @type {Set<string>} */
    this._dirty = new Set();
    this._dirtyAll = true;
    this.stats = { visible: 0, culled: 0, occluded: 0, measured: 0 };
  }

  /**
   * Replace the labels.
   * @param {(LabelItem & { color?: string, selectedColor?: string })[]} items
   */
  setItems(items) {
    for (const { el } of this._els.values()) el.remove();
    this._els.clear();
    this._byId.clear();
    this.items = items;
    for (const it of items) this._create(it);
    this._dirtyAll = true;
  }

  /**
   * Replace one label (a rule changed its fields or style).
   * @param {LabelItem & { color?: string, selectedColor?: string }} item
   */
  replaceItem(item) {
    const i = this.items.findIndex((x) => x.id === item.id);
    if (i < 0) return;
    const old = this.items[i];
    Object.assign(item, { world: old.world, selected: old.selected, alphaScale: old.alphaScale });
    this._els.get(item.id)?.el.remove();
    this.items[i] = item;
    this._create(item);
    this._dirty.add(item.id);
  }

  /**
   * Add or replace one label.
   * @param {LabelItem & { color?: string, selectedColor?: string }} item
   */
  upsertItem(item) {
    if (this._byId.has(item.id)) this.replaceItem(item);
    else {
      this.items.push(item);
      this._create(item);
      this._dirty.add(item.id);
    }
  }

  /** @param {string} id */
  removeItem(id) {
    this._els.get(id)?.el.remove();
    this._els.delete(id);
    this._byId.delete(id);
    this.items = this.items.filter((it) => it.id !== id);
  }

  /** @param {LabelItem & { color?: string, selectedColor?: string }} it */
  _create(it) {
    const el = document.createElement('div');
    el.className = 'astro-label';
    el.dataset.id = it.id;
    el.dataset.style = it.style;
    /** @type {Map<string, HTMLElement>} */
    const cells = new Map();
    const cell = (/** @type {string} */ pos) => {
      let c = cells.get(pos);
      if (c) return c;
      const [r, col] = LABEL_POSITIONS[pos] ?? LABEL_POSITIONS.center;
      c = document.createElement('div');
      c.className = `cell r${r} c${col}`;
      c.style.gridRow = String(r);
      c.style.gridColumn = String(col);
      el.append(c);
      cells.set(pos, c);
      return c;
    };
    const center = cell('center');
    const mk = it.marker !== 'none' ? document.createElement('span') : null;
    if (mk) {
      mk.className = 'mk';
      center.append(mk);
    }
    /** @type {LabelEls['fields']} */
    const fields = new Map();
    for (const f of it.fields) {
      const span = document.createElement('span');
      span.className = 'f';
      span.dataset.field = f.name;
      span.style.cssText = f.css;
      span.textContent = f.text;
      if (f.background) span.style.background = f.background;
      cell(f.position).append(span);
      fields.set(f.name, { el: span, text: f.text, color: '', background: f.background ?? '' });
    }
    this.root.append(el);
    this._byId.set(it.id, it);
    this._els.set(it.id, { el, mk, center, fields, x: NaN, y: NaN, op: -1, flip: 0, color: '', svg: '' });
    it.empty = !mk && it.fields.every((f) => !f.text);
    this._applyColors(it);
  }

  /**
   * Write the label's colours (selected or not) where they changed.
   * @param {LabelItem & { color?: string, selectedColor?: string }} it
   */
  _applyColors(it) {
    const e = this._els.get(it.id);
    if (!e) return;
    const sel = it.selected;
    const main = (sel ? it.selectedColor : it.color) ?? '';
    if (main !== e.color) { e.el.style.color = main; e.color = main; }
    for (const f of it.fields) {
      const fe = e.fields.get(f.name);
      if (!fe) continue;
      const c = sel ? f.selectedColor : f.color;
      if (c !== fe.color) { fe.el.style.color = c; fe.color = c; }
    }
  }

  /**
   * Change a label at run time; each value is written only when it differs.
   * `color` is the point's colour (the marker), `fields` the text, colour and
   * background per field name, `svg` the marker markup.
   * @param {string} id
   * @param {{ color?: string, selectedColor?: string, svg?: string, fields?: Record<string, { text?: string, color?: string, selectedColor?: string, background?: string }> }} v
   */
  style(id, { color, selectedColor, svg, fields }) {
    const e = this._els.get(id);
    const it = /** @type {(LabelItem & { color?: string, selectedColor?: string }) | undefined} */ (this._byId.get(id));
    if (!e || !it) return;
    if (color !== undefined) it.color = color;
    if (selectedColor !== undefined) it.selectedColor = selectedColor;
    if (svg !== undefined && e.mk && svg !== e.svg) { e.mk.innerHTML = svg; e.svg = svg; this._dirty.add(id); }
    if (fields) {
      for (const [name, v] of Object.entries(fields)) {
        const f = it.fields.find((x) => x.name === name);
        const fe = e.fields.get(name);
        if (!f || !fe) continue;
        if (v.color !== undefined) f.color = v.color;
        if (v.selectedColor !== undefined) f.selectedColor = v.selectedColor;
        if (v.text !== undefined && v.text !== fe.text) {
          f.text = v.text;
          fe.text = v.text;
          fe.el.textContent = v.text;
          this._dirty.add(id);
        }
        if (v.background !== undefined && v.background !== fe.background) {
          f.background = v.background;
          fe.background = v.background;
          fe.el.style.background = v.background;
        }
      }
      it.empty = !e.mk && it.fields.every((f) => !f.text);
    }
    this._applyColors(it);
  }

  /** Measure the boxes (one forced layout for the batch): all after fonts load or a resize, else the changed ones */
  measure() {
    const all = this._dirtyAll;
    let n = 0;
    for (const it of this.items) {
      if (!all && !this._dirty.has(it.id)) continue;
      const e = this._els.get(it.id);
      if (!e) continue;
      it.w = e.el.offsetWidth;
      it.h = e.el.offsetHeight;
      const a = e.mk ?? e.center;
      // offsets are relative to the label (the absolutely positioned offsetParent)
      let x = a.offsetLeft;
      let y = a.offsetTop;
      if (a !== e.center && a.offsetParent !== e.el) { x += e.center.offsetLeft; y += e.center.offsetTop; }
      // Anchors are kept for the configured layout; a mirrored element measures mirrored
      const mx = x + a.offsetWidth / 2;
      const my = y + a.offsetHeight / 2;
      it.ax = e.flip & 1 ? it.w - mx : mx;
      it.ay = e.flip & 2 ? it.h - my : my;
      n++;
    }
    this._dirty.clear();
    // New sizes for every label (fonts loaded, a resize): placements start
    // again as configured, not from mirrors chosen with the old sizes
    if (all) for (const it of this.items) it.flip = 0;
    this._dirtyAll = false;
    this.stats.measured = n;
  }

  /** A font or size change needs every box measured again */
  invalidateSizes() {
    this._dirtyAll = true;
  }

  /**
   * @param {import('three').Camera} camera
   * @param {number} width - CSS px
   * @param {number} height
   * @param {Occluder[]} occluders
   */
  update(camera, width, height, occluders) {
    if (this._dirtyAll || this._dirty.size) this.measure();
    const measured = this.stats.measured;
    this.stats = { ...layoutLabels(this.items, camera, width, height, occluders), measured };
    for (const it of this.items) {
      const e = this._els.get(it.id);
      if (!e) continue;
      const op = it.visible ? Math.round(it.alpha * 100) / 100 : 0;
      if (op !== e.op) { e.el.style.opacity = String(op); e.op = op; }
      if (!it.visible) continue;
      if (it.flip !== e.flip) {
        e.el.classList.toggle('fx', (it.flip & 1) !== 0);
        e.el.classList.toggle('fy', (it.flip & 2) !== 0);
        e.flip = it.flip;
      }
      const [rx, ry] = labelBox(it, it.flip);
      const x = this.snap ? Math.round(rx) : Math.round(rx * 100) / 100;
      const y = this.snap ? Math.round(ry) : Math.round(ry * 100) / 100;
      if (x !== e.x || y !== e.y) { e.el.style.transform = `translate3d(${x}px, ${y}px, 0)`; e.x = x; e.y = y; }
    }
  }

  /** @param {string} id */
  item(id) {
    return this._byId.get(id);
  }

  /** @param {number} x @param {number} y */
  pick(x, y) {
    return pickLabel(this.items, x, y);
  }

  /** @param {string | null} id */
  select(id) {
    for (const it of this.items) {
      const was = it.selected;
      it.selected = it.id === id;
      if (was !== it.selected) this._applyColors(it);
    }
  }

  dispose() {
    this.root.remove();
    this._els.clear();
    this._byId.clear();
    this.items = [];
  }
}

export { markerSvg };
