/**
 * Frames for scenes at true scale across a nesting step: a galaxy in light
 * years with a star system inside it in km. Doubles hold a galaxy to about
 * 30 km at 26,000 ly, so a 1.5 km station cannot sit in galaxy units; inside
 * its system's own units it is exact.
 *
 * Every frame (the scene, `root`, and each `type: system`) has a group in
 * the three.js scene holding its objects. The camera works in one frame at
 * a time, the current one: scene (world) coordinates are that frame's own
 * units, its group sits at the origin unscaled, and every other frame's
 * group is placed and scaled relative to it (`place`). Changing frame
 * re-bases the scene once (the runtime converts the camera with `convert`);
 * the picture does not move.
 *
 * A system is not rotated: its axes are its parent's, so yaw and tilt mean
 * the same in every frame. The runtime is written for any depth; the schema
 * allows one level.
 *
 * @module core/astrometrics/frames
 */
import { Group } from 'three';

export const ROOT = 'root';
/** The camera enters a system nearer than this many times its radius, and leaves past LEAVE (hysteresis) */
export const ENTER = 4;
export const LEAVE = 6;

/**
 * @typedef {Object} Frame
 * @property {string} id
 * @property {string | null} parent
 * @property {number} scale - parent units per unit of this frame
 * @property {[number, number, number]} origin - where it sits, parent units
 * @property {number} radius - how far its contents reach from its origin, own units
 * @property {Group} node - holds its objects
 */

export class Frames {
  constructor() {
    /** @type {Map<string, Frame>} */
    this.frames = new Map();
    this.current = ROOT;
    this.add(ROOT, null, 1);
  }

  /**
   * @param {string} id
   * @param {string | null} parent
   * @param {number} scale - parent units per unit
   * @returns {Frame}
   */
  add(id, parent, scale) {
    const node = new Group();
    node.name = `frame:${id}`;
    /** @type {Frame} */
    const f = { id, parent, scale, origin: [0, 0, 0], radius: 0, node };
    this.frames.set(id, f);
    return f;
  }

  /** @param {string | undefined | null} id */
  get(id) {
    return this.frames.get(id ?? ROOT) ?? /** @type {Frame} */ (this.frames.get(ROOT));
  }

  /** Whether there is more than the scene's own frame */
  get nested() {
    return this.frames.size > 1;
  }

  /**
   * A frame and its ancestors, the frame first, the root last.
   * @param {string} id
   * @returns {Frame[]}
   */
  chain(id) {
    const out = [];
    for (let f = this.frames.get(id); f; f = f.parent === null ? undefined : this.frames.get(f.parent)) out.push(f);
    return out;
  }

  /**
   * How many units of frame `to` one unit of frame `from` is.
   * @param {string} from
   * @param {string} to
   */
  ratio(from, to) {
    if (from === to) return 1;
    const a = this.chain(from);
    const b = this.chain(to);
    let k = 1;
    // up from `from` to the common ancestor, then down to `to`
    const common = a.find((f) => b.includes(f));
    for (const f of a) { if (f === common) break; k *= f.scale; }
    for (const f of b) { if (f === common) break; k /= f.scale; }
    return k;
  }

  /**
   * World units (the current frame's) per unit of frame `id`.
   * @param {string | undefined | null} id
   */
  unit(id) {
    return this.ratio(id ?? ROOT, this.current);
  }

  /**
   * A position in frame `from` as one in frame `to`, through their nearest
   * common frame (so a point inside a system stays exact in its own units).
   * @param {number[]} p
   * @param {string} from
   * @param {string} to
   * @returns {[number, number, number]}
   */
  convert(p, from, to) {
    let x = +p[0], y = +p[1], z = +p[2];
    if (from === to) return [x, y, z];
    const a = this.chain(from);
    const b = this.chain(to);
    const common = a.find((f) => b.includes(f));
    for (const f of a) {
      if (f === common) break;
      x = f.origin[0] + x * f.scale;
      y = f.origin[1] + y * f.scale;
      z = f.origin[2] + z * f.scale;
    }
    const down = [];
    for (const f of b) { if (f === common) break; down.push(f); }
    for (let i = down.length - 1; i >= 0; i--) {
      const f = down[i];
      x = (x - f.origin[0]) / f.scale;
      y = (y - f.origin[1]) / f.scale;
      z = (z - f.origin[2]) / f.scale;
    }
    return [x, y, z];
  }

  /** Put every frame's group where it is seen from the current frame (call after a change) */
  place() {
    for (const f of this.frames.values()) {
      const [x, y, z] = this.convert([0, 0, 0], f.id, this.current);
      f.node.position.set(x, y, z);
      f.node.scale.setScalar(this.unit(f.id));
    }
  }

  /**
   * The frame the camera should work in: the deepest system it is inside
   * (ENTER times the radius to come in, LEAVE to stay).
   * @param {number[]} camera - its position, current frame
   * @returns {string}
   */
  pick(camera) {
    const inChain = new Set(this.chain(this.current).map((f) => f.id));
    /** @param {Frame} f */
    const inside = (f) => {
      if (f.parent === null) return true;
      if (!(f.radius > 0)) return false;
      const p = this.convert(camera, this.current, f.id);
      return Math.hypot(p[0], p[1], p[2]) < f.radius * (inChain.has(f.id) ? LEAVE : ENTER);
    };
    let best = ROOT;
    let depth = 0;
    for (const f of this.frames.values()) {
      const chain = this.chain(f.id);
      if (chain.length - 1 > depth && chain.every(inside)) {
        best = f.id;
        depth = chain.length - 1;
      }
    }
    return best;
  }
}
