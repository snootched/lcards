/**
 * Colour changes in place: an object whose colours change (an alert mode, a
 * theme, a colour bound to an entity) crossfades to them instead of being
 * built again, so nothing flashes and its motion carries on.
 *
 * Works for any object type without code of its own. Each object keeps a
 * snapshot of what it looked like as it was built (`colorBase`). On a colour
 * change it is built once more off the scene (`fresh`), and whatever differs
 * from the snapshot is driven by a colour: a material colour, a shader
 * uniform, a geometry attribute (`tint`, `color`, an instanced mesh's
 * colours). Builds are seeded, so nothing else differs. Those values on the
 * live object fade to the fresh build's, and the fresh build is thrown away.
 * Values a colour does not drive (positions, the time a shader runs at) are
 * left alone.
 *
 * When the fresh build does not line up with the live object (a different tree, a
 * colour that changes more than a value, such as `transparent` hiding a
 * part), `colorSlots` returns null and the caller builds the object again
 * as before.
 *
 * @module core/astrometrics/recolor
 */

/** How long a colour change crossfades, ms (wall time: a held scene clock does not stop it) */
export const RECOLOR_MS = 800;


/** Material properties that are colours */
const MATERIAL_COLORS = ['color', 'emissive', 'specular', 'sheenColor', 'attenuationColor'];

/** Material settings a colour can change that cannot fade: when they differ, build again */
const MATERIAL_FLAGS = ['visible', 'transparent', 'blending', 'depthWrite', 'side'];


/**
 * @typedef {Object} ColorSlot
 * @property {any} target - the live material, uniform or attribute
 * @property {string} key - its property that holds the value (`array` for an attribute)
 * @property {any} to - the fresh build's value (a copy)
 * @property {any} [from] - the live value when the fade starts (a copy)
 * @property {any} [attribute] - the attribute to flag for upload
 * @property {(v: any) => void} [set] - hands each step's value on (a line's setColor: its vertex colours follow)
 */

/**
 * What colorSlots compares: a built object's node, the materials it keeps
 * off the tree and its lines.
 * @typedef {{ node: any, materials?: any[], lines?: any[] }} Recolorable
 */

/**
 * Which value a slot changes: its target object and key (a number has no identity of its own).
 */
class SlotSet {
  constructor() {
    /** @type {Map<any, Set<string>>} */
    this.map = new Map();
  }
  /** @param {any} target @param {string} key */
  has(target, key) {
    return this.map.get(target)?.has(key) === true;
  }
  /** @param {any} target @param {string} key */
  add(target, key) {
    const keys = this.map.get(target) ?? new Set();
    keys.add(key);
    this.map.set(target, keys);
  }
}

/** @param {any} root @returns {any[]} */
function nodes(root) {
  /** @type {any[]} */
  const out = [];
  root.traverse((/** @type {any} */ o) => out.push(o));
  return out;
}

/** @param {any} o @returns {any[]} */
const materials = (o) => (!o.material ? [] : Array.isArray(o.material) ? o.material : [o.material]);

/** @param {any} v */
const isVec = (v) => !!v && (v.isColor || v.isVector2 || v.isVector3 || v.isVector4);

/** Whether a value can fade: a number, a colour or vector, or a list of them @param {any} v */
function fadeable(v) {
  if (typeof v === 'number') return true;
  if (isVec(v)) return true;
  if (ArrayBuffer.isView(v)) return !(v instanceof DataView);
  if (Array.isArray(v)) return v.length > 0 && v.every(fadeable);
  return false;
}

/** @param {any} a @param {any} b @returns {boolean} */
function same(a, b) {
  if (typeof a === 'number' || typeof b === 'number') return a === b;
  if (isVec(a) || isVec(b)) return !!a && !!b && a.constructor === b.constructor && a.equals(b);
  if ((Array.isArray(a) || ArrayBuffer.isView(a)) && (Array.isArray(b) || ArrayBuffer.isView(b))) {
    const x = /** @type {ArrayLike<any>} */ (a), y = /** @type {ArrayLike<any>} */ (b);
    if (x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) if (!same(x[i], y[i])) return false;
    return true;
  }
  return a === b;
}

/** Whether a live value can take a fresh one: the same kind and length @param {any} a @param {any} b */
function fits(a, b) {
  if (typeof b === 'number') return typeof a === 'number';
  if (isVec(b)) return !!a && a.constructor === b.constructor;
  if (Array.isArray(b) || ArrayBuffer.isView(b)) {
    if (!(Array.isArray(a) || ArrayBuffer.isView(a))) return false;
    const x = /** @type {ArrayLike<any>} */ (a), y = /** @type {ArrayLike<any>} */ (b);
    if (x.length !== y.length) return false;
    for (let i = 0; i < y.length; i++) if (!fits(x[i], y[i])) return false;
    return true;
  }
  return false;
}

/** A copy of a fadeable value @param {any} v @returns {any} */
function copy(v) {
  if (typeof v === 'number') return v;
  if (isVec(v)) return v.clone();
  if (ArrayBuffer.isView(v)) return /** @type {any} */ (v).slice();
  if (Array.isArray(v)) return v.map(copy);
  return v;
}

/** A line's colours as one value: [color, colorTo] @param {any} st */
const linePair = (st) => [st.color ?? [], st.colorTo ?? st.color ?? []];

/** An object's nodes, then its off-tree materials as stand-in leaves @param {Recolorable} b */
const allNodes = (b) => [...nodes(b.node), ...(b.materials ?? []).map((material) => ({ type: 'materials', material }))];

/** The attributes of a node that can hold colours: its geometry's, then an instanced mesh's own @param {any} o @returns {[string, any][]} */
function attributes(o) {
  /** @type {[string, any][]} */
  const out = Object.entries(o.geometry?.attributes ?? {});
  if (o.instanceColor) out.push(['instanceColor', o.instanceColor]);
  return out;
}

/** FNV-1a over a typed array's bytes: tells two attribute arrays apart without keeping a copy @param {any} a */
function hashArray(a) {
  const bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 16777619);
  return `${a.length}:${h >>> 0}`;
}

/**
 * @typedef {Object} ColorBase
 * @property {{ type: string, mats: { type: string, flags: any[], colors: any[], opacity: any, uniforms: Record<string, any> }[], attrs: [string, string][] }[]} nodes
 * @property {any[][]} lines
 */

/**
 * What an object looked like as it was built: every value a colour could
 * drive (material colours and settings, shader uniforms, a hash of each
 * attribute, each line's colours). Taken right after a build, before any
 * motion, so comparing it with a fresh build of the same config shows
 * exactly the values a colour drives (everything else comes out the same:
 * builds are seeded).
 * @param {Recolorable} b
 * @returns {ColorBase}
 */
export function colorBase(b) {
  return {
    nodes: allNodes(b).map((o) => ({
      type: o.type,
      mats: materials(o).map((m) => ({
        type: m.type,
        flags: MATERIAL_FLAGS.map((k) => m[k]),
        colors: MATERIAL_COLORS.map((k) => (m[k]?.isColor ? m[k].clone() : undefined)),
        opacity: m.opacity,
        uniforms: Object.fromEntries(Object.entries(m.uniforms ?? {}).filter(([, u]) => fadeable(/** @type {any} */ (u)?.value)).map(([k, u]) => [k, copy(/** @type {any} */ (u).value)]))
      })),
      attrs: attributes(o).map(([name, a]) => [name, hashArray(a.array)])
    })),
    lines: (b.lines ?? []).map((l) => copy(linePair(l.style)))
  };
}

/**
 * The values on the live object a colour drives, each with the value it
 * goes to; null when the fresh build does not line up with it (build it
 * again). The fresh build is the same object with its new colours; what it
 * changed is where it differs from the live object's own `colorBase` (its
 * build before any motion). Each object's node tree is walked, and its
 * `materials` (ones kept off the tree, such as a volume nebula's gas pass).
 * Lines (`lines`, FatLine) fade through their style, so a line whose
 * colours run along it (a trail, a gradient) redraws them each step.
 * @param {Recolorable & { colorBase?: ColorBase }} live - the live object
 * @param {Recolorable} fresh - built apart with its new colours
 * @returns {ColorSlot[] | null}
 */
export function colorSlots(live, fresh) {
  const base = live.colorBase;
  if (!base) return null;
  /** @type {ColorSlot[]} */
  const slots = [];
  // lines first: their materials are theirs to set
  const lineMats = new Set();
  const ll = live.lines ?? [], fl = fresh.lines ?? [];
  if (ll.length !== fl.length || fl.length !== base.lines.length) return null;
  for (let i = 0; i < fl.length; i++) {
    const line = ll[i];
    lineMats.add(line.material);
    const to = linePair(fl[i].style);
    if (same(to, base.lines[i])) continue;
    const now = linePair(line.style);
    if (!fits(now, to)) return null;
    const holder = { v: copy(now) };
    slots.push({ target: holder, key: 'v', to: copy(to), set: (v) => line.setColor(v[0].slice(), line.style.colorTo ? v[1].slice() : undefined) });
  }
  const L = allNodes(live), F = allNodes(fresh), B = base.nodes;
  if (L.length !== F.length || F.length !== B.length) return null;
  const seen = new SlotSet();
  /** @param {any} target @param {string} key @param {any} to @param {any} [attribute] */
  const add = (target, key, to, attribute) => {
    // a uniform or colour shared by several materials fades once
    if (seen.has(target, key)) return;
    seen.add(target, key);
    slots.push({ target, key, to: copy(to), ...(attribute ? { attribute } : {}) });
  };
  for (let i = 0; i < F.length; i++) {
    const l = L[i], f = F[i], c = B[i];
    if (l.type !== f.type || f.type !== c.type) return null;
    const lm = materials(l), fm = materials(f);
    if (lm.length !== fm.length || fm.length !== c.mats.length) return null;
    for (let j = 0; j < fm.length; j++) {
      const a = lm[j], b = fm[j], cm = c.mats[j];
      if (a.type !== b.type || b.type !== cm.type) return null;
      if (lineMats.has(a)) continue;
      // a colour that changes how a material draws (transparent, hidden) cannot fade
      if (MATERIAL_FLAGS.some((k, n) => b[k] !== cm.flags[n] && b[k] !== a[k])) return null;
      for (let n = 0; n < MATERIAL_COLORS.length; n++) {
        const k = MATERIAL_COLORS[n];
        if (b[k]?.isColor && !same(b[k], cm.colors[n])) {
          if (!a[k]?.isColor) return null;
          add(a, k, b[k]);
        }
      }
      // opacity folds a colour's alpha in
      if (typeof b.opacity === 'number' && b.opacity !== cm.opacity) add(a, 'opacity', b.opacity);
      for (const [k, u] of Object.entries(b.uniforms ?? {})) {
        const v = /** @type {any} */ (u)?.value;
        if (!fadeable(v) || same(v, cm.uniforms[k])) continue;
        const lu = a.uniforms?.[k];
        if (!lu || !fits(lu.value, v)) return null;
        add(lu, 'value', v);
      }
    }
    const fa = attributes(f), la = new Map(attributes(l)), ca = new Map(c.attrs);
    for (const [name, a] of fa) {
      if (ca.get(name) === hashArray(a.array)) continue;
      const target = la.get(name);
      if (!target || target.array.length !== a.array.length) return null;
      add(target, 'array', a.array, target);
    }
  }
  return slots;
}

/**
 * Put a value part way from `a` to `b` into `out` (in place for colours,
 * vectors and lists); returns the value for a number.
 * @param {any} out @param {any} a @param {any} b @param {number} e
 * @returns {any}
 */
function mix(out, a, b, e) {
  if (typeof b === 'number') return a + (b - a) * e;
  if (b.isColor) return out.lerpColors(a, b, e);
  if (isVec(b)) return out.lerpVectors(a, b, e);
  for (let i = 0; i < b.length; i++) {
    if (typeof b[i] === 'number') out[i] = a[i] + (b[i] - a[i]) * e;
    else mix(out[i], a[i], b[i], e);
  }
  return out;
}

/**
 * Crossfades of colour slots, stepped each frame on wall time.
 */
export class ColorFades {
  constructor() {
    /** @type {{ slots: ColorSlot[], start: number | null }[]} */
    this.runs = [];
  }

  /** Whether a fade is running */
  get active() {
    return this.runs.length > 0;
  }

  /**
   * Fade these slots from their live values; `now` (snap) sets them at once.
   * A slot already fading starts again from where it is.
   * @param {ColorSlot[]} slots
   * @param {{ now?: boolean }} [opts]
   */
  start(slots, { now = false } = {}) {
    if (!slots.length) return;
    const targets = new SlotSet();
    for (const s of slots) targets.add(s.target, s.key);
    // the latest change wins: a running fade lets go of the values this one takes
    for (const r of this.runs) r.slots = r.slots.filter((s) => !targets.has(s.target, s.key));
    this.runs = this.runs.filter((r) => r.slots.length);
    for (const s of slots) s.from = copy(s.target[s.key]);
    if (now) {
      ColorFades.apply(slots, 1);
      return;
    }
    this.runs.push({ slots, start: null });
  }

  /**
   * One frame: true while a fade runs (draw another).
   * @param {number} now - performance.now()
   * @returns {boolean}
   */
  step(now) {
    if (!this.runs.length) return false;
    for (const r of this.runs) {
      if (r.start === null) r.start = now;
      const k = Math.min(1, (now - r.start) / RECOLOR_MS);
      ColorFades.apply(r.slots, k * k * (3 - 2 * k));
    }
    this.runs = this.runs.filter((r) => r.start !== null && now - r.start < RECOLOR_MS);
    return true;
  }

  /** Every fade to its end at once (reduced motion turned on, the scene going away) */
  finish() {
    for (const r of this.runs) ColorFades.apply(r.slots, 1);
    this.runs = [];
  }

  /** Drop the fades without finishing them (the objects they change are gone) */
  clear() {
    this.runs = [];
  }

  /** @param {ColorSlot[]} slots @param {number} e - eased 0..1 */
  static apply(slots, e) {
    for (const s of slots) {
      const v = mix(s.target[s.key], s.from, s.to, e);
      if (typeof s.to === 'number') s.target[s.key] = v;
      if (s.attribute) s.attribute.needsUpdate = true;
      s.set?.(s.target[s.key]);
    }
  }
}
