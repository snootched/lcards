/**
 * Helpers for the `static animatableProps` map each background effect class
 * declares: which config keys anime.js (through the effect adapter) and
 * entity bindings may change on a live effect, and how.
 *
 * Keys are the YAML config keys (`scroll_speed_x`, `color`), the names users
 * write in `config:` and in an animation's `params:`. Declare only what is
 * cheap to change every frame; a key that needs a re-bake or a regeneration
 * stays out, and a binding on it falls back to the effect's updateConfig().
 *
 * @module core/packs/backgrounds/effects/animatable-props
 */

/**
 * @typedef {Object} AnimatableProp
 * @property {(effect: any) => any} get - Current value (a number, or a concrete colour string)
 * @property {(effect: any, value: any) => void} set - Apply a value, invalidating any cache it feeds
 * @property {boolean} [color] - A colour: anime.js interpolates it, the setter receives an `rgba()` string
 */

/**
 * A numeric field.
 * @param {string} field - Property name on the effect
 * @param {{ min?: number, max?: number, after?: (effect: any) => void }} [opts]
 *   clamp bounds, and a hook run after the value changes (cache invalidation)
 * @returns {AnimatableProp}
 */
export function numProp(field, { min = -Infinity, max = Infinity, after } = {}) {
  return {
    get: (e) => e[field],
    set: (e, v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      e[field] = Math.max(min, Math.min(max, n));
      after?.(e);
    }
  };
}

/**
 * A colour field holding a concrete CSS colour string.
 * @param {string} field
 * @param {(effect: any) => void} [after]
 * @returns {AnimatableProp}
 */
export function colorProp(field, after) {
  return {
    color: true,
    get: (e) => e[field],
    set: (e, v) => {
      e[field] = v;
      after?.(e);
    }
  };
}

/**
 * A numeric key applied through the effect's own updateConfig() (texture
 * effects), read back from `field`.
 * @param {string} key - The config key updateConfig() reads
 * @param {string} field - Where the effect keeps it
 * @returns {AnimatableProp}
 */
export function configProp(key, field) {
  return {
    get: (e) => e[field],
    set: (e, v) => {
      const n = Number(v);
      if (Number.isFinite(n)) e.updateConfig({ [key]: n });
    }
  };
}
