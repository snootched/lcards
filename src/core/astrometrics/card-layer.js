/**
 * Lovelace cards pinned to scene points (a point's `card:`), over the canvas
 * beside the labels. Positions come from the label pass (`layoutLabels`):
 * a card shows where its point's label would, hidden when the point is off
 * screen, behind an object or out of its distance range. A label culled by
 * a collision does not hide its card.
 *
 *   card:
 *     show: tap | always     tap (default): opens on a tap on the point, one at a time
 *     position: center-right where the card sits round the point (LABEL_POSITIONS)
 *     offset: [x, y]         px from the point
 *     width: 280             px; the height follows the card
 *     card: { type: tile, entity: light.bridge }
 *
 * Free of Home Assistant: the scene's owner mounts the card elements
 * (`mount`) and gives them hass (`setHass`). Elements are kept across scene
 * rebuilds while their config is the same, so a theme change or an edit to
 * another point does not recreate them.
 *
 * @module core/astrometrics/card-layer
 */
import { LABEL_POSITIONS } from './label-text.js';
import { num } from './objects/common.js';

/** Space (CSS px) a card keeps from the point and from the scene's edges */
const GAP = 12;
const EDGE = 4;
const DEFAULT_WIDTH = 280;

/** The text system's position aliases, for `card.position` */
const ALIASES = /** @type {Record<string, string>} */ ({
  top: 'top-center', bottom: 'bottom-center', left: 'center-left', right: 'center-right',
  'left-center': 'center-left', 'right-center': 'center-right', middle: 'center'
});

/**
 * A point's card settings, or null when it has no card to show.
 * @typedef {Object} PointCard
 * @property {string} id - the point's
 * @property {'tap' | 'always'} show
 * @property {string} position - a LABEL_POSITIONS name
 * @property {[number, number]} offset
 * @property {number} width
 * @property {Record<string, any>} card - the Lovelace card config
 * @property {string} key - what the element is built from (a change rebuilds it)
 */

/**
 * @param {any} def - a point config
 * @returns {PointCard | null}
 */
export function pointCard(def) {
  const c = def?.card;
  if (!c || typeof c !== 'object' || !c.card || typeof c.card !== 'object' || typeof c.card.type !== 'string') return null;
  const pos = ALIASES[c.position] ?? c.position;
  const off = Array.isArray(c.offset) ? c.offset : [];
  return {
    id: String(def.id),
    show: c.show === 'always' ? 'always' : 'tap',
    position: LABEL_POSITIONS[pos] ? pos : 'center-right',
    offset: [num(off[0], 0), num(off[1], 0)],
    width: Math.max(80, num(c.width, DEFAULT_WIDTH)),
    card: c.card,
    key: JSON.stringify(c.card)
  };
}

/**
 * Where a card's box goes for a point at (sx, sy): beside it on the
 * position's side, kept inside the scene. Pure, for tests.
 * @param {{ position: string, offset: [number, number] }} pc
 * @param {number} sx - the point, CSS px
 * @param {number} sy
 * @param {number} w - the card's box
 * @param {number} h
 * @param {number} width - the scene
 * @param {number} height
 * @returns {[number, number]} left, top
 */
export function cardBox(pc, sx, sy, w, h, width, height) {
  const [row, col] = LABEL_POSITIONS[pc.position] ?? LABEL_POSITIONS['center-right'];
  let x = col === 1 ? sx - GAP - w : col === 3 ? sx + GAP : sx - w / 2;
  let y = row === 1 ? sy - GAP - h : row === 3 ? sy + GAP : sy - h / 2;
  x += pc.offset[0];
  y += pc.offset[1];
  x = Math.min(Math.max(EDGE, x), Math.max(EDGE, width - EDGE - w));
  y = Math.min(Math.max(EDGE, y), Math.max(EDGE, height - EDGE - h));
  return [x, y];
}

const CSS = `
.astro-pins { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.astro-pin { position: absolute; left: 0; top: 0; will-change: transform; opacity: 0; pointer-events: none;
  transition: opacity var(--ha-animation-duration-fast, 150ms); }
.astro-pin.shown { pointer-events: auto; }
.astro-pin > * { display: block; }
`;

/**
 * @typedef {Object} CardEls
 * @property {PointCard} pc
 * @property {HTMLElement} el - the positioned box
 * @property {HTMLElement | null} card - the mounted card element
 * @property {number} w - measured box
 * @property {number} h
 * @property {number} x
 * @property {number} y
 * @property {number} op
 */

export class CardLayer {
  /**
   * @param {HTMLElement} host - positioned container over the canvas
   * @param {{ mount?: (card: Record<string, any>) => HTMLElement | null, setHass?: (el: HTMLElement, hass: any) => void, onResize?: () => void }} [opts]
   */
  constructor(host, { mount, setHass, onResize } = {}) {
    this.root = document.createElement('div');
    this.root.className = 'astro-pins';
    const style = document.createElement('style');
    style.textContent = CSS;
    this.root.append(style);
    host.append(this.root);
    this.mount = mount ?? null;
    this.setHassFn = setHass ?? null;
    this.onResize = onResize ?? null;
    /** @type {Map<string, CardEls>} */
    this.cards = new Map();
    /** @type {string | null} the tap card that is open */
    this.openId = null;
    this.hass = null;
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver((entries) => {
      for (const e of entries) {
        const c = [...this.cards.values()].find((x) => x.el === e.target);
        if (!c) continue;
        c.w = /** @type {HTMLElement} */ (e.target).offsetWidth;
        c.h = /** @type {HTMLElement} */ (e.target).offsetHeight;
      }
      this.onResize?.();
    }) : null;
  }

  /**
   * The points' cards: kept where id and card config are the same, built
   * where new or changed, removed where gone. Tap cards are built when first
   * opened.
   * @param {PointCard[]} list
   */
  setCards(list) {
    const next = new Map(list.map((pc) => [pc.id, pc]));
    for (const [id, c] of this.cards) {
      const pc = next.get(id);
      if (!pc || pc.key !== c.pc.key) this._remove(id);
      else c.pc = pc;
    }
    for (const pc of list) {
      const c = this.cards.get(pc.id);
      if (!c) {
        if (pc.show === 'always') this._create(pc);
        else this.cards.set(pc.id, this._shell(pc));
      }
      const e = this.cards.get(pc.id);
      if (e) e.el.style.width = `${pc.width}px`;
    }
    if (this.openId && next.get(this.openId)?.show !== 'tap') this.openId = null;
  }

  /** @param {PointCard} pc @returns {CardEls} */
  _shell(pc) {
    const el = document.createElement('div');
    el.className = 'astro-pin';
    el.dataset.id = pc.id;
    el.style.width = `${pc.width}px`;
    el.inert = true;
    return { pc, el, card: null, w: 0, h: 0, x: NaN, y: NaN, op: -1 };
  }

  /** @param {PointCard} pc */
  _create(pc) {
    const c = this.cards.get(pc.id) ?? this._shell(pc);
    this.cards.set(pc.id, c);
    if (c.card || !this.mount) return c;
    const card = this.mount(pc.card);
    if (!card) return c;
    c.card = card;
    c.el.append(card);
    this.root.append(c.el);
    if (this.hass) this.setHassFn?.(card, this.hass);
    this.ro?.observe(c.el);
    return c;
  }

  /** @param {string} id */
  _remove(id) {
    const c = this.cards.get(id);
    if (!c) return;
    this.ro?.unobserve(c.el);
    c.el.remove();
    this.cards.delete(id);
    if (this.openId === id) this.openId = null;
  }

  /**
   * Open a point's tap card (closing another), or close it when it is the open one.
   * @param {string} id
   * @returns {boolean} true when a card opened
   */
  toggle(id) {
    if (this.openId === id) { this.close(); return false; }
    const c = this.cards.get(id);
    if (!c || c.pc.show !== 'tap') return false;
    this._create(c.pc);
    this.openId = id;
    return true;
  }

  /** Close the open tap card */
  close() {
    this.openId = null;
  }

  /** @param {string} id */
  has(id) {
    return this.cards.has(id);
  }

  /** @param {string} id */
  showsOnTap(id) {
    return this.cards.get(id)?.pc.show === 'tap';
  }

  /** @param {any} hass */
  setHass(hass) {
    this.hass = hass;
    if (!hass || !this.setHassFn) return;
    for (const c of this.cards.values()) if (c.card) this.setHassFn(c.card, hass);
  }

  /**
   * Whether an event happened on a card (keys typed into a card's input are
   * not camera keys).
   * @param {Event} e
   */
  contains(e) {
    return e.composedPath().includes(this.root);
  }

  /**
   * Place the cards for this frame from the laid-out labels.
   * @param {(id: string) => import('./label-layer.js').LabelItem | undefined} item - a point's laid-out label
   * @param {number} width - CSS px
   * @param {number} height
   */
  update(item, width, height) {
    for (const [id, c] of this.cards) {
      if (!c.card) continue;
      const it = item(id);
      const want = c.pc.show === 'always' || this.openId === id;
      const placed = it && (it.reason === 'ok' || it.reason === 'culled');
      const op = want && placed ? Math.round(it.alpha * 100) / 100 : 0;
      if (op !== c.op) {
        c.el.style.opacity = String(op);
        c.el.classList.toggle('shown', op > 0.05);
        c.el.inert = op <= 0.05;
        c.op = op;
      }
      if (!op || !it) continue;
      const [rx, ry] = cardBox(c.pc, it.sx, it.sy, c.w, c.h, width, height);
      const x = Math.round(rx);
      const y = Math.round(ry);
      if (x !== c.x || y !== c.y) { c.el.style.transform = `translate3d(${x}px, ${y}px, 0)`; c.x = x; c.y = y; }
    }
  }

  dispose() {
    this.ro?.disconnect();
    this.root.remove();
    this.cards.clear();
  }
}
