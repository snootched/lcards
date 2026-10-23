/**
 * EffectHandle: the stable anime.js target for one `background_animation`
 * entry.
 *
 * The effect objects themselves are short-lived: an alert-mode palette change
 * rebuilds them (BackgroundAnimationRenderer.refreshColors), and a zoomed
 * entry is several objects (one per layer). The handle outlives both: the
 * renderer re-attaches the new objects to the same handle, so an animation or
 * a binding glide running on it carries on across red alert.
 *
 * Properties are the YAML config keys an effect class declares in
 * `static animatableProps`, plus the transform keys every effect has
 * (`x`, `y` in px, `rotate` in degrees, `scale`), which Canvas2DRenderer
 * applies around the drawn object.
 *
 * @module core/packs/backgrounds/effect-handle
 */

/** Transform keys and their identity values */
export const TRANSFORM_PROPS = Object.freeze({ x: 0, y: 0, rotate: 0, scale: 1 });

/**
 * @param {any} target
 * @returns {target is EffectHandle}
 */
export function isEffectHandle(target) {
  return target?.__lcardsEffect === true;
}

export class EffectHandle {
  /**
   * @param {number} index - Position of the entry in `background_animation`
   * @param {string} presetId
   * @param {{ renderer?: { requestFrame?: () => void } | null }} owner - The BackgroundAnimationRenderer
   */
  constructor(index, presetId, owner) {
    /** Marks the object for the effect adapter */
    this.__lcardsEffect = true;
    this.index = index;
    this.presetId = presetId;
    this.owner = owner;
    /** @type {any[]} the effect instances (one, or one per zoom layer) */
    this.effects = [];
    /** @type {any[]} what the canvas draws: the ZoomEffect wrappers, or the effects */
    this.drawn = [];
    /** @type {Record<string, any>} last value set per key */
    this.values = {};
    this._alive = true;
  }

  /**
   * True while the background renderer lives. AnimationManager's target
   * filters and re-render carry-over read `isConnected`, so a handle counts
   * as connected the same way a DOM element does.
   */
  get isConnected() {
    return this._alive;
  }

  /**
   * Attach freshly built effect objects (first load or a rebuild) and give
   * them the numeric values set so far. Colours are not re-applied: the
   * rebuild exists to pick up a new palette, and a running colour tween
   * writes again on its next frame anyway.
   * @param {any[]} effects
   * @param {any[]} drawn
   */
  attach(effects, drawn) {
    this.effects = effects;
    this.drawn = drawn;
    for (const [name, value] of Object.entries(this.values)) {
      if (typeof value === 'number') this.setProp(name, value);
      else delete this.values[name];
    }
  }

  /** Forget the effect objects (the renderer is being rebuilt) */
  detach() {
    this.effects = [];
    this.drawn = [];
  }

  /** The renderer is gone for good */
  kill() {
    this._alive = false;
    this.detach();
  }

  /**
   * @param {string} name
   * @returns {import('./effects/animatable-props.js').AnimatableProp | undefined}
   * @private
   */
  _decl(name) {
    const props = this.effects[0]?.constructor?.animatableProps;
    return props && Object.prototype.hasOwnProperty.call(props, name) ? props[name] : undefined;
  }

  /**
   * Whether `name` can be animated on this entry.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return name in TRANSFORM_PROPS || !!this._decl(name);
  }

  /**
   * Every key this entry can animate.
   * @returns {string[]}
   */
  keys() {
    const props = this.effects[0]?.constructor?.animatableProps ?? {};
    return [...Object.keys(TRANSFORM_PROPS), ...Object.keys(props)];
  }

  /**
   * @param {string} name
   * @returns {any} a number or a concrete colour string
   */
  getProp(name) {
    if (name in TRANSFORM_PROPS) return this.values[name] ?? TRANSFORM_PROPS[/** @type {keyof typeof TRANSFORM_PROPS} */ (name)];
    const decl = this._decl(name);
    const effect = this.effects[0];
    const value = decl && effect ? decl.get(effect) : undefined;
    return value ?? this.values[name];
  }

  /**
   * Apply a value to every effect object of the entry.
   * @param {string} name
   * @param {any} value - A number, or a concrete colour string for colour keys
   */
  setProp(name, value) {
    this.values[name] = value;
    if (name in TRANSFORM_PROPS) {
      const key = /** @type {keyof typeof TRANSFORM_PROPS} */ (name);
      const n = Number(value);
      for (const d of this.drawn) {
        const xf = (d._xform ??= { ...TRANSFORM_PROPS });
        xf[key] = Number.isFinite(n) ? n : TRANSFORM_PROPS[key];
      }
    } else {
      const decl = this._decl(name);
      if (!decl) return;
      for (const effect of this.effects) decl.set(effect, value);
      // A zoomed entry: `speed` also runs the zoom cycle faster (warp)
      if (name === 'speed') {
        for (const d of this.drawn) if (d.baseEffect) d.speed = Math.max(0, Number(value) || 0);
      }
    }
    this.owner?.renderer?.requestFrame?.();
  }
}
