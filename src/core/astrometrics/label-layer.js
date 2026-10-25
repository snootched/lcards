/**
 * DOM labels pinned to scene points, over the canvas: the LCARS font, colours
 * as CSS values (CSS variables stay live, so alert modes recolour them), one
 * absolutely positioned element per label moved with `translate3d`.
 *
 * Per frame (`layoutLabels`, pure): project, hide what is behind a sphere
 * (an analytic ray test, no GPU readback), fade by distance, apply the
 * `min_distance` / `max_distance` range, then cull collisions (higher
 * priority first, then nearer). `LabelLayer.update` writes only the values
 * that changed. Positions are sub-pixel by default (smoother for fast
 * motion); `snap` rounds them to whole px.
 *
 * @module core/astrometrics/label-layer
 */
import { Vector3 } from 'three';
import { markerSvg, MARKER_SIZE } from './markers.js';

/** Label styles: font size (px) and default priority */
export const LABEL_STYLES = {
  title: { size: 34, priority: 100 },
  major: { size: 20, priority: 80 },
  minor: { size: 13, priority: 40 },
  tiny: { size: 10, priority: 10 }
};

/**
 * @typedef {Object} LabelItem
 * @property {string} id
 * @property {string} text
 * @property {keyof typeof LABEL_STYLES} style
 * @property {number} priority
 * @property {string} marker
 * @property {'center' | 'right' | 'left'} anchor
 * @property {[number, number] | null} fade - distance where it starts fading, and where it is gone
 * @property {number} minDistance
 * @property {number} maxDistance
 * @property {string | null} occluderSkip - the sphere this point belongs to (never hides it)
 * @property {boolean} pickable
 * @property {number} w - measured box, CSS px
 * @property {number} h
 * @property {Vector3 | null} world - position this frame
 * @property {number} alphaScale - 0 to 1 (a sky point below the horizon dims)
 * @property {boolean} selected
 * @property {number} sx - projected position, CSS px
 * @property {number} sy
 * @property {number} depth
 * @property {number} alpha
 * @property {boolean} visible
 * @property {'ok' | 'off' | 'occluded' | 'range' | 'culled'} reason
 */

/** @typedef {{ center: Vector3, radius: number, id: string }} Occluder */

/**
 * A label item with defaults (the per-frame fields cleared).
 * @param {Partial<LabelItem> & { id: string }} o
 * @returns {LabelItem}
 */
export function labelItem(o) {
  const style = o.style && LABEL_STYLES[o.style] ? o.style : 'minor';
  const marker = o.marker ?? 'none';
  return {
    text: '',
    priority: LABEL_STYLES[style].priority,
    anchor: marker !== 'none' ? 'right' : 'center',
    fade: null,
    minDistance: 0,
    maxDistance: Infinity,
    occluderSkip: null,
    pickable: false,
    w: 0,
    h: 0,
    world: null,
    alphaScale: 1,
    selected: false,
    ...o,
    style,
    marker,
    sx: 0,
    sy: 0,
    depth: 0,
    alpha: 0,
    visible: false,
    reason: 'off'
  };
}

/** Px of the label box left of the point, by anchor */
function boxLeft(/** @type {LabelItem} */ it) {
  const mk = MARKER_SIZE[/** @type {keyof typeof MARKER_SIZE} */ (it.marker)] ?? 0;
  if (it.anchor === 'center') return it.w / 2;
  if (it.anchor === 'left') return it.w - mk / 2;
  return mk / 2;
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
    if (!p || it.alphaScale <= 0) continue;
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
      oc.copy(s.center).sub(p);
      const tc = oc.dot(dir);
      if (tc <= 0 || tc >= reach) continue;
      const r = s.radius * 0.98;
      if (oc.lengthSq() - tc * tc < r * r) { hidden = true; break; }
    }
    if (hidden) { occluded++; it.reason = 'occluded'; continue; }
    let a = it.alphaScale;
    if (it.fade) {
      const [f0, f1] = it.fade;
      a *= 1 - Math.min(1, Math.max(0, (dist - f0) / Math.max(1e-6, f1 - f0)));
    }
    // The range edges fade over 10 % instead of popping
    if (Number.isFinite(it.maxDistance)) a *= Math.min(1, Math.max(0, (it.maxDistance * 1.1 - dist) / (it.maxDistance * 0.1)));
    if (it.minDistance > 0) a *= Math.min(1, Math.max(0, (dist - it.minDistance * 0.9) / (it.minDistance * 0.1)));
    it.alpha = a;
    if (a <= 0.02) { it.reason = 'range'; continue; }
    live.push(it);
  }
  // Collision: selected first, then priority, then nearer; boxes in CSS px
  live.sort((a, b) => Number(b.selected) - Number(a.selected) || b.priority - a.priority || a.depth - b.depth);
  /** @type {number[][]} */
  const placed = [];
  let culled = 0;
  for (const it of live) {
    const x0 = it.sx - boxLeft(it);
    const y0 = it.sy - it.h / 2;
    const box = [x0, y0, x0 + it.w, y0 + it.h];
    let clash = false;
    for (const b of placed) if (box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]) { clash = true; break; }
    if (clash) { culled++; it.reason = 'culled'; continue; }
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
.astro-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  font-family: var(--lcars-font, 'Antonio'), 'Antonio', sans-serif; text-transform: none; }
.astro-label { position: absolute; left: 0; top: 0; white-space: nowrap; display: flex; align-items: center;
  gap: var(--ha-space-1); line-height: 1; will-change: transform; opacity: 0;
  transition: opacity var(--ha-animation-duration-fast, 150ms); }
.astro-label.left { flex-direction: row-reverse; }
.astro-label .mk { display: inline-flex; }
.astro-label.title { font-size: ${LABEL_STYLES.title.size}px; letter-spacing: 1px; }
.astro-label.major { font-size: ${LABEL_STYLES.major.size}px; }
.astro-label.minor { font-size: ${LABEL_STYLES.minor.size}px; }
.astro-label.tiny { font-size: ${LABEL_STYLES.tiny.size}px; }
`;

/**
 * The DOM side: one element per item, measured in one batch, written only
 * when a value changes.
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
    /** @type {Map<string, { el: HTMLElement, tx: HTMLElement, mk: HTMLElement | null, x: number, y: number, op: number, color: string, svg: string }>} */
    this._els = new Map();
    this._dirtySize = true;
    this.stats = { visible: 0, culled: 0, occluded: 0 };
  }

  /**
   * Replace the labels.
   * @param {(LabelItem & { color?: string, selectedColor?: string })[]} items
   */
  setItems(items) {
    for (const { el } of this._els.values()) el.remove();
    this._els.clear();
    this.items = items;
    for (const it of items) {
      const el = document.createElement('div');
      el.className = `astro-label ${it.style} ${it.anchor}`;
      el.dataset.id = it.id;
      const mk = it.marker !== 'none' ? document.createElement('span') : null;
      if (mk) {
        mk.className = 'mk';
        el.append(mk);
      }
      const tx = document.createElement('span');
      tx.className = 'tx';
      tx.textContent = it.text;
      if (it.text) el.append(tx);
      this.root.append(el);
      this._els.set(it.id, { el, tx, mk, x: NaN, y: NaN, op: -1, color: '', svg: '' });
    }
    this._dirtySize = true;
  }

  /**
   * Per-item colour (CSS value) and marker markup; written when changed.
   * @param {string} id
   * @param {{ color?: string, svg?: string, text?: string }} v
   */
  style(id, { color, svg, text }) {
    const e = this._els.get(id);
    if (!e) return;
    if (color !== undefined && color !== e.color) { e.el.style.color = color; e.color = color; }
    if (svg !== undefined && e.mk && svg !== e.svg) { e.mk.innerHTML = svg; e.svg = svg; this._dirtySize = true; }
    const it = this.items.find((i) => i.id === id);
    if (text !== undefined && it && text !== it.text) {
      it.text = text;
      e.tx.textContent = text;
      if (text && !e.tx.isConnected) e.el.append(e.tx);
      this._dirtySize = true;
    }
  }

  /** Measure every box (one forced layout for the batch); after fonts load or a text change */
  measure() {
    for (const it of this.items) {
      const e = this._els.get(it.id);
      if (!e) continue;
      it.w = e.el.offsetWidth;
      it.h = e.el.offsetHeight;
    }
    this._dirtySize = false;
  }

  /** A text, marker or font change needs a fresh measure */
  invalidateSizes() {
    this._dirtySize = true;
  }

  /**
   * @param {import('three').Camera} camera
   * @param {number} width - CSS px
   * @param {number} height
   * @param {Occluder[]} occluders
   */
  update(camera, width, height, occluders) {
    if (this._dirtySize) this.measure();
    this.stats = layoutLabels(this.items, camera, width, height, occluders);
    for (const it of this.items) {
      const e = this._els.get(it.id);
      if (!e) continue;
      const op = it.visible ? Math.round(it.alpha * 100) / 100 : 0;
      if (op !== e.op) { e.el.style.opacity = String(op); e.op = op; }
      if (!it.visible) continue;
      const rx = it.sx - boxLeft(it);
      const ry = it.sy - it.h / 2;
      const x = this.snap ? Math.round(rx) : Math.round(rx * 100) / 100;
      const y = this.snap ? Math.round(ry) : Math.round(ry * 100) / 100;
      if (x !== e.x || y !== e.y) { e.el.style.transform = `translate3d(${x}px, ${y}px, 0)`; e.x = x; e.y = y; }
    }
  }

  /** @param {number} x @param {number} y */
  pick(x, y) {
    return pickLabel(this.items, x, y);
  }

  /** @param {string | null} id */
  select(id) {
    for (const it of this.items) it.selected = it.id === id;
  }

  dispose() {
    this.root.remove();
    this._els.clear();
    this.items = [];
  }
}

export { markerSvg };
