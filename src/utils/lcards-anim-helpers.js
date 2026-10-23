/**
 * @fileoverview Animation helper utilities for LCARdS cards.
 *
 * Wrappers and utilities for anime.js v4 (via `window.lcards.anim`): target
 * resolution, preset application, timeline building, easing resolution, and
 * CSS variable interpolation.
 *
 * @module utils/lcards-anim-helpers
 */

import { lcardsLog } from './lcards-logging.js';
import { getAnimationPreset } from '../core/animation/presets.js';
import { resolveColor } from '../core/themes/resolve-color.js';
import { isEffectHandle } from '../core/packs/backgrounds/effect-handle.js';
import { EFFECT_TIMING_KEYS } from '../core/packs/backgrounds/effect-adapter.js';

/**
 * LCARdS-internal animation meta-params that must NOT be passed to anime.animate().
 * These are consumed by the preset builder or AnimationManager, not by anime.js itself.
 * Passing them to anime.js causes it to attempt to tween non-existent element properties.
 */
const _LCARDS_META_PARAMS = new Set([
  'params',       // Preset-config wrapper (e.g. { max_scale, max_brightness }) — fully
                  // consumed by the preset factory (`def.params || def`) before this
                  // point; the raw object must never reach anime.js itself, which
                  // would otherwise tween its sub-keys as bogus element attributes.
  'from_value',   // Preset: start color/value used to build the tween property array
  'to_value',     // Preset: end color/value used to build the tween property array
  'property',     // Preset: which SVG/CSS property to animate (used to build [property]:[] entry)
  'from',         // Stagger: position param consumed by stagger() — not an anime.js anim param
  'grid',         // Stagger: grid dimensions consumed by stagger() — not an anime.js anim param
  'trigger',      // AnimationManager: when to fire (on_load, on_tap…) — not anime.js
  // Trigger and AnimationManager metadata from the animation definition: anime.js
  // writes any unknown key onto a DOM target as an attribute (entity="light.x",
  // while="[object Object]"), so these must never reach it.
  'entity',
  'attribute',
  'from_state',
  'to_state',
  'check_on_load',
  'essential_motion',
  'while',
  'enabled',
  'datasource',
  'state_resolver',
  'morph_to_selector',
  'precision',
  'effect',       // target: background: which background_animation entry (AnimationManager)
  'animejs',      // editor "custom" mode payload, not run by anything (see reports/animejs-4.5-opportunities.md E10)
  'easing',       // v3 alias: anime.js v4 uses 'ease' not 'easing'
  'ease_params',  // LCARdS: parametric ease config (merged into ease object before animateElement)
  'amplitude',    // stagger-wave preset meta-param (converted to property value by preset)
  // stagger-flash meta-params — consumed by preset / WAAPI setup, not anime.js
  'lead_color',
  'trail_color',
  'lead_pct',
  'with_opacity',
  'trail_opacity',
]);

/** Background keys already reported as not animatable, `preset.key` */
const _warnedEffectKeys = new Set();

/**
 * Animate background effect parameters (`target: background`). The preset
 * builds its anime.js tween as usual; only the keys the effects declare
 * (`static animatableProps`, plus x/y/rotate/scale) and the timing keys
 * reach anime.js, through the effect adapter. No DOM work: no waiting for
 * elements, styles, setup() or transform migration.
 *
 * @param {any[]} handles - EffectHandles
 * @param {any} type - Preset name
 * @param {Record<string, any>} animOptions
 * @param {((instance: any) => void)|null} onInstanceCreated
 * @private
 */
function _animateEffectHandles(handles, type, animOptions, onInstanceCreated) {
  const presetFn = getAnimationPreset(String(type).toLowerCase());
  if (!presetFn) {
    lcardsLog.warn(`[animateElement] target: background: unknown preset "${type}"`);
    return;
  }
  const params = /** @type {Record<string, any>} */ ({ duration: 1000, ease: 'inOutQuad', ...animOptions });
  if (params.ease) params.ease = resolveEasing(params.ease);
  let result;
  try {
    result = presetFn(params);
  } catch (error) {
    lcardsLog.error(`[animateElement] target: background: preset ${type} failed`, error);
    return;
  }
  if (!result?.anime || result._timeline || result.setup) {
    lcardsLog.warn(`[animateElement] target: background: preset "${type}" animates elements and cannot drive a background; use preset: custom with the effect keys in params`);
    return;
  }
  Object.assign(params, result.anime);

  const out = /** @type {Record<string, any>} */ ({});
  for (const [key, value] of Object.entries(_cleanAnimeParams(params))) {
    if (EFFECT_TIMING_KEYS.has(key)) {
      out[key] = value;
    } else if (handles.some((h) => h.has(key))) {
      // Colour keys: theme:/var()/computed values become concrete for interpolation
      const isColor = handles.some((h) => typeof h.getProp(key) === 'string');
      const toConcrete = (/** @type {any} */ v) => (typeof v === 'string' ? resolveColor(v, { concrete: true }) : v);
      out[key] = isColor ? (Array.isArray(value) ? value.map(toConcrete) : toConcrete(value)) : value;
    } else if (key in result.anime) {
      const id = `${handles[0]?.presetId}.${key}`;
      if (!_warnedEffectKeys.has(id)) {
        _warnedEffectKeys.add(id);
        lcardsLog.warn(`[animateElement] target: background: "${key}" is not animatable on ${handles[0]?.presetId}. Animatable: ${handles[0]?.keys().join(', ')}`);
      }
    }
  }
  if (!Object.keys(out).some((k) => !EFFECT_TIMING_KEYS.has(k))) return;

  const instance = window.lcards.anim.anime(handles, out);
  if (typeof onInstanceCreated === 'function') onInstanceCreated(instance);
}

/**
 * Strip LCARdS-internal meta-params from an anime.js parameter object.
 * Call this immediately before passing params to anime.animate() / window.lcards.anim.anime().
 *
 * @param {Object} params - Raw animation parameters (may include LCARdS meta-params)
 * @returns {Object} Cleaned parameters safe for anime.js
 */
function _cleanAnimeParams(params) {
  const cleaned = {};
  for (const [key, val] of Object.entries(params)) {
    if (!_LCARDS_META_PARAMS.has(key) && val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Resolve CSS variables in animation parameters
 * Converts var(--lcards-*) to computed color values that anime.js can interpolate
 *
 * @param {Object} params - Animation parameters (may contain CSS variables)
 * @returns {Object} Parameters with CSS variables resolved to actual colors
 *
 * @example
 * // Before: { fill: ['var(--lcards-blue-light)', 'var(--lcards-gray-dark)'] }
 * // After:  { fill: ['#6688cc', '#445566'] }
 */
function resolveAnimationCssVariables(params) {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const resolved = { ...params };

  // Properties that commonly contain color values for anime.js
  const colorProperties = ['fill', 'stroke', 'background', 'backgroundColor', 'color', 'borderColor'];

  // anime.js interpolates numbers, so colours must be concrete
  const resolveColorValue = (value) => resolveColor(value, { concrete: true });

  colorProperties.forEach(prop => {
    if (resolved[prop]) {
      // Handle arrays (e.g., fill: [from, to])
      if (Array.isArray(resolved[prop])) {
        resolved[prop] = resolved[prop].map(value => {
          const out = resolveColorValue(value);
          if (out !== value) lcardsLog.trace(`[resolveAnimationCssVariables] ${prop}[]: ${value} → ${out}`);
          return out;
        });
      }
      // Handle single values
      else if (typeof resolved[prop] === 'string') {
        const original = resolved[prop];
        resolved[prop] = resolveColorValue(original);
        if (resolved[prop] !== original) lcardsLog.trace(`[resolveAnimationCssVariables] ${prop}: ${original} → ${resolved[prop]}`);
      }
    }
  });

  // Recurse into keyframes array so presets like stagger-flash (which embed colors
  // directly in per-keyframe objects) also have their theme: tokens and CSS vars resolved.
  if (Array.isArray(resolved.keyframes)) {
    resolved.keyframes = resolved.keyframes.map(kf => {
      if (!kf || typeof kf !== 'object') return kf;
      const resolvedKf = { ...kf };
      colorProperties.forEach(prop => {
        if (resolvedKf[prop] !== undefined) {
          if (Array.isArray(resolvedKf[prop])) {
            resolvedKf[prop] = resolvedKf[prop].map(v => resolveColorValue(v));
          } else if (typeof resolvedKf[prop] === 'string') {
            resolvedKf[prop] = resolveColorValue(resolvedKf[prop]);
          }
        }
      });
      return resolvedKf;
    });
  }

  return resolved;
}

// Easing types that are generator calls, not named curves: a bare string naming
// one of these (an editor pick left on its default parameters) is resolved with
// default params rather than handed to anime.js, which rejects it. 'linear' is
// absent on purpose: as a string it is the plain linear curve.
const EASE_GENERATOR_TYPES = new Set(['cubicBezier', 'spring', 'steps', 'irregular', 'custom']);

/**
 * Resolve easing configuration to anime.js easing value
 *
 * Supports multiple input formats:
 * - String: 'inOutQuad', 'linear', etc. (passed through as-is)
 * - Object with type and params: { type: 'inBack', params: { overshoot: 2.0 } }
 * - Advanced easing objects for cubicBezier, spring, steps, linear, irregular, custom
 * - A bare generator name ('cubicBezier', 'steps', ...) resolves with default params
 * - A generator call written as a string ('steps(4)') is evaluated like `custom`
 *
 * @param {string|Object} easingConfig - Easing configuration from animation definition
 * @returns {string|Function} - anime.js easing (string or function)
 *
 * @example
 * // Simple string
 * resolveEasing('inOutQuad')  // → 'inOutQuad'
 *
 * // Parametric Back with custom overshoot
 * resolveEasing({ type: 'inBack', params: { overshoot: 2.5 } })  // → inBack(2.5) function
 *
 * // Spring physics
 * resolveEasing({ type: 'spring', params: { stiffness: 150, damping: 15 } })  // → spring() function
 */
export function resolveEasing(easingConfig) {
  if (typeof easingConfig === 'string' && EASE_GENERATOR_TYPES.has(easingConfig)) {
    easingConfig = { type: easingConfig, params: {} };
  }
  // A call written as a string ('steps(4)', 'cubicBezier(.4, 0, .2, 1)'): anime.js
  // dropped string parametric eases in 4.3, so evaluate it like a custom easing.
  if (typeof easingConfig === 'string' && /^\s*(cubicBezier|spring|steps|linear|irregular)\s*\(/.test(easingConfig)) {
    easingConfig = { type: 'custom', params: { customString: easingConfig } };
  }

  // Simple string - use as-is (default case)
  if (typeof easingConfig === 'string' || !easingConfig) {
    return easingConfig || 'linear';
  }

  // Object configuration
  if (typeof easingConfig === 'object' && easingConfig.type) {
    const type = easingConfig.type;
    const params = easingConfig.params || {};
    const anim = window.lcards?.anim;

    if (!anim) {
      lcardsLog.warn('[resolveEasing] Animation namespace not available, falling back to string');
      return type; // Fallback to string (may still work if it's a built-in name)
    }

    try {
      switch (type) {
        // Parametric Power easings (default power = 1.675)
        case 'in':
        case 'powerIn':
          return anim.eases.in(params.power ?? 1.675);
        case 'out':
        case 'powerOut':
          return anim.eases.out(params.power ?? 1.675);
        case 'inOut':
        case 'powerInOut':
          return anim.eases.inOut(params.power ?? 1.675);
        case 'outIn':
        case 'powerOutIn':
          return anim.eases.outIn(params.power ?? 1.675);

        // Parametric Back easings (default overshoot = 1.70158)
        case 'inBack':
          return anim.eases.inBack(params.overshoot ?? 1.70158);
        case 'outBack':
          return anim.eases.outBack(params.overshoot ?? 1.70158);
        case 'inOutBack':
          return anim.eases.inOutBack(params.overshoot ?? 1.70158);
        case 'outInBack':
          return anim.eases.outInBack(params.overshoot ?? 1.70158);

        // Parametric Elastic easings (default amplitude = 1, period = 0.3)
        case 'inElastic':
          return anim.eases.inElastic(params.amplitude ?? 1, params.period ?? 0.3);
        case 'outElastic':
          return anim.eases.outElastic(params.amplitude ?? 1, params.period ?? 0.3);
        case 'inOutElastic':
          return anim.eases.inOutElastic(params.amplitude ?? 1, params.period ?? 0.3);
        case 'outInElastic':
          return anim.eases.outInElastic(params.amplitude ?? 1, params.period ?? 0.3);

        // Generators: top-level animejs exports, exposed on window.lcards.anim
        // (anim.eases.linear is the plain curve, not the points generator)
        case 'cubicBezier':
          return anim.cubicBezier(
            params.x1 ?? 0.25,
            params.y1 ?? 0.1,
            params.x2 ?? 0.25,
            params.y2 ?? 1
          );

        case 'spring':
          // Returns a Spring, which anime.js accepts as an ease (and which sets the duration)
          return anim.spring({
            mass: params.mass ?? 1,
            stiffness: params.stiffness ?? 100,
            damping: params.damping ?? 10,
            velocity: params.velocity ?? 0
          });

        case 'steps':
          return anim.steps(params.steps ?? 10, params.fromStart ?? false);

        case 'linear':
          // Expects array of value points (or value/percentage string pairs)
          return anim.linear(...(params.points ?? [0, 1]));

        case 'irregular':
          return anim.irregular(params.steps ?? 10, params.randomness ?? 1);

        case 'custom':
          return _resolveCustomEasing(params.customString, anim);

        default:
          lcardsLog.warn(`[resolveEasing] Unknown easing type: ${type}, using as string`);
          return type; // Fallback to string
      }
    } catch (error) {
      lcardsLog.error(`[resolveEasing] Failed to create easing function:`, error);
      return 'linear'; // Safe fallback
    }
  }

  // Fallback for unexpected input
  lcardsLog.warn('[resolveEasing] Invalid easing config, using linear', easingConfig);
  return 'linear';
}

/**
 * Evaluate a custom easing expression as pasted from the anime.js easing editor,
 * e.g. `spring({ bounce: 0.4, duration: 500 })`, `cubicBezier(0.4, 0, 0.2, 1)`,
 * `steps(5)`, or a named curve such as `outExpo`. Surrounding quotes are dropped.
 * @param {string|undefined} customString
 * @param {any} anim - window.lcards.anim
 * @returns {string|Function|object} anime.js ease, or 'linear' when it cannot be used
 * @private
 */
function _resolveCustomEasing(customString, anim) {
  if (typeof customString !== 'string' || !customString.trim()) {
    lcardsLog.warn(`[resolveEasing] Custom easing specified but no customString provided`);
    return 'linear';
  }
  let expr = customString.trim();
  if (/^(['"`]).*\1$/s.test(expr)) expr = expr.slice(1, -1).trim();

  // A bare name is a named curve ('outExpo'); anime.js validates it
  if (/^[A-Za-z]+$/.test(expr)) return expr;

  const evalContext = {
    spring: anim.spring,
    cubicBezier: anim.cubicBezier,
    steps: anim.steps,
    linear: anim.linear,
    irregular: anim.irregular
  };
  try {
    // spring({ bounce: 0.4 }) -> evalContext.spring({ bounce: 0.4 })
    const rewritten = expr.replace(
      /\b(spring|cubicBezier|steps|linear|irregular)\s*\(/g,
      'evalContext.$1('
    );
    const result = new Function('evalContext', `return (${rewritten});`)(evalContext);
    // Generators return a function; spring() returns a Spring object anime.js accepts
    if (typeof result === 'function' || (result && typeof result === 'object' && typeof result.ease === 'function')) {
      return result;
    }
    lcardsLog.warn(`[resolveEasing] Custom easing did not produce an easing function, using linear`, { customString });
  } catch (error) {
    lcardsLog.error(`[resolveEasing] Failed to parse custom easing string:`, error);
  }
  return 'linear';
}

/**
 * Resolves a preset factory's param object, replacing the unsafe
 * `const p = def.params || def;` idiom every preset factory used to read its
 * fields with (still present pre-migration in some preset files).
 *
 * That idiom assumed `def.params`, whenever non-empty (including `{}` — which
 * is truthy!), was a COMPLETE substitute for `def` — but per the animation
 * schema, canonical fields (duration/loop/alternate/ease/delay) always live
 * at the top level of `def`, and `params:` is reserved for preset-specific
 * extras only (e.g. pulse's max_scale/max_brightness). Nothing enforced that
 * boundary, so a stale/leftover non-empty `params:` block (e.g. from
 * switching presets without cleaning up config) silently dropped the user's
 * top-level fields in favor of the preset's own hardcoded defaults.
 *
 * Precedence here is structural, not spread-order-dependent: `def`'s own
 * top-level fields always win over same-named `def.params` fields, because
 * `def` is what the call site already resolved (defaults, resolveEasing(),
 * map_range) and `def.params` is the raw, potentially-stale, user-authored
 * extras blob.
 *
 * @param {Object} def - The object a preset factory receives
 * @returns {Object} Merged params object, safe for a preset to read fields from
 */
export function resolvePresetParams(def) {
  if (!def || typeof def !== 'object') return {};
  const extras = (def.params && typeof def.params === 'object') ? def.params : {};
  return { ...extras, ...def };
}

/**
 * Resolves easing configuration for a preset factory's params object.
 * Handles both string easings and object-based parametric easings
 * (ease + ease_params from the params object).
 *
 * @param {Object} params - Params object (from resolvePresetParams()) or ease string/config with {ease, ease_params}
 * @returns {string|Function} Resolved easing value for anime.js
 */
export function getResolvedEasing(params) {
  // animateElement() has usually resolved `ease` already (a function or Spring);
  // only a still-unresolved name is combined with ease_params here.
  if (params.ease_params && (typeof params.ease === 'string' || params.ease === undefined)) {
    return resolveEasing({ type: params.ease, params: params.ease_params });
  }
  return params.ease;
}

/**
 * Waits for an element to be present in the DOM.
 * @param {string} selector - The CSS selector for the element.
 * @param {Element|Document} root - The root element to search within.
 * @param {number} timeout - The maximum time to wait in milliseconds.
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, root = document, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const found = root.querySelector(selector);
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        try { observer.disconnect(); } catch(_) {}
        clearTimeout(to);
        resolve(el);
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    const to = setTimeout(() => {
      try { observer.disconnect(); } catch(_) {}
      reject(new Error(`[LCARdS] Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * Resolves one or many targets into an array of Elements.
 * Enhancements:
 * - Supports comma-separated selector strings: "#a, .b, svg path"
 * - Expands NodeList/HTMLCollection into elements
 * - For selector strings, resolves first match by waiting, and also includes any currently matching additional elements
 * @param {string|Element|Array<string|Element>|NodeList|HTMLCollection} targets
 * @param {Element|Document} root
 * @param {number} timeout
 * @returns {Promise<Element[]>}
 */
export async function waitForElements(targets, root = document, timeout = 2000) {
  const toArray = (v) => Array.isArray(v)
    ? v
    : (v && typeof v.length === 'number' && typeof v.item === 'function')
      ? Array.from(v) // NodeList/HTMLCollection
      : [v];

  const items = toArray(targets).filter(Boolean);
  const results = [];

  for (const item of items) {
    try {
      if (item instanceof Element) {
        results.push(item);
        continue;
      }

      if (typeof item === 'string') {
        // Split comma-separated selector lists
        const selectors = item.split(',').map(s => s.trim()).filter(Boolean);
        for (const sel of selectors) {
          // Wait for first appearance of this selector
          const first = await waitForElement(sel, root, timeout);
          if (first) results.push(first);
          // Also include any additional matches that are already present
          const allNow = root.querySelectorAll(sel);
          for (const el of Array.from(allNow)) {
            if (!results.includes(el)) results.push(el);
          }
        }
        continue;
      }

      lcardsLog.warn('[waitForElements] Unsupported target type, skipping.', { item });
    } catch (e) {
      lcardsLog.error('[waitForElements] Failed to resolve target:', { item, error: e });
    }
  }
  return results;
}

/**
 * Hand the instances a preset's setup() created itself (text presets that drive a
 * proxy, WAAPI-backed presets) to the caller's onInstanceCreated, so AnimationManager
 * tracks, stops and gates them like any other. setup() pushes them to
 * `element._presetInstances`; each needs the instance surface the manager uses
 * (`completed`, `revert()`, and for settling `complete()` + `iterationCount`).
 * @param {Element} element
 * @param {((instance: any) => void)|null} onInstanceCreated
 */
function _reportPresetInstances(element, onInstanceCreated) {
  const instances = /** @type {any} */ (element)?._presetInstances;
  if (!Array.isArray(instances)) return;
  delete /** @type {any} */ (element)._presetInstances;
  if (typeof onInstanceCreated === 'function') instances.forEach(instance => onInstanceCreated(instance));
}

/**
 * Wrap an anime.js instance so `fn` runs once when it is reverted or cancelled
 * (stopAnimations, a card re-render) or when a finite one completes. The wrapper
 * has the instance's own surface (methods bound to it), for AnimationManager to track.
 * Text presets use it to put their split text back.
 * @param {any} instance
 * @param {() => void} fn
 * @returns {any}
 */
export function withRevertHook(instance, fn) {
  if (!instance || typeof fn !== 'function') return instance;
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    try { fn(); } catch (error) { lcardsLog.warn('[withRevertHook] Hook failed:', error); }
  };
  if (typeof instance.then === 'function') instance.then(run);
  return new Proxy(instance, {
    get(target, key) {
      if (key === 'revert' || key === 'cancel') {
        return (/** @type {any[]} */ ...args) => { const result = target[key](...args); run(); return result; };
      }
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key, value) { return Reflect.set(target, key, value, target); },
  });
}

/**
 * Tie a preset's cleanup(element) to the instance animating that element
 * (see withRevertHook). `_presetCleanup` is set after the preset's setup().
 * @param {any} instance
 * @param {Element} element
 * @returns {any}
 */
function _withPresetCleanup(instance, element) {
  const cleanup = /** @type {any} */ (element)?._presetCleanup;
  if (typeof cleanup !== 'function') return instance;
  delete /** @type {any} */ (element)._presetCleanup;
  return withRevertHook(instance, () => cleanup(element));
}

/** `from` aliases kept from the LCARdS docs, mapped to anime.js v4 names. */
const _STAGGER_FROM_ALIASES = { start: 'first', end: 'last' };
const _STAGGER_FROM_VALUES = new Set(['first', 'center', 'last', 'random']);

/**
 * The tap point as an anime.js grid `from: [x, y]`: anime.js measures that pair
 * against the box spanned by the targets' CENTRES (stagger.js, `grid: true`), so the
 * point is normalised to that box, not to the union of the targets. A tap outside it
 * gives a value below 0 or above 1, which anime.js extrapolates correctly. An axis
 * with no extent (one row, one column) gets 0.5.
 *
 * @param {{ clientX: number, clientY: number }|null} pointer - viewport coordinates
 * @param {Array<{ left: number, top: number, width: number, height: number }>} rects - the targets' client rects
 * @returns {[number, number]|null} null without a usable pointer or targets
 */
export function pointerFrom(pointer, rects) {
  if (!pointer || !Number.isFinite(pointer.clientX) || !Number.isFinite(pointer.clientY) || !rects?.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy;
    if (cy > maxY) maxY = cy;
  }
  const axis = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => (hi - lo > 0 ? (v - lo) / (hi - lo) : 0.5);
  return [axis(pointer.clientX, minX, maxX), axis(pointer.clientY, minY, maxY)];
}
/** `axis` aliases: a row runs along x, a column along y. */
const _STAGGER_AXIS_ALIASES = { row: 'x', column: 'y' };

/**
 * Map an LCARdS `_stagger` marker onto anime.js v4 stagger() arguments.
 *
 * Accepts the v4 options (`from`, `reversed`, `grid` as `[cols, rows]` or `true` for
 * positions read from the layout, `axis`, `ease`, `jitter`, `seed`, `start`, `total`,
 * a `[start, end]` range as `value`) plus the LCARdS aliases: `from: 'start' | 'end'`,
 * `from: 'edges'` (centre, reversed: edges first), `axis: 'row' | 'column'` and the
 * legacy `direction: 'reverse'`. An unknown `from` string falls back to 'first'.
 *
 * `from: 'pointer'` starts at the tap that triggered the animation (`context.pointer`
 * plus the targets' client rects, see pointerFrom()) and turns `grid` on (positions
 * read from the layout). Without a pointer (on_load, a preview) it starts at the centre.
 *
 * @param {Object} marker - `{ _stagger: true, value, from, grid, ... }`
 * @param {{ pointer?: { clientX: number, clientY: number }|null, rects?: Array<{ left: number, top: number, width: number, height: number }> }} [context]
 * @returns {{ value: number|number[], options: Object }}
 */
export function staggerArgs(marker, context = {}) {
  const value = marker.value ?? 100;
  /** @type {Record<string, any>} */
  const options = {};

  let from = marker.from;
  let reversed = marker.reversed === true || marker.direction === 'reverse';
  if (from === 'pointer') {
    from = pointerFrom(context.pointer ?? null, context.rects ?? []) ?? 'center';
    if (marker.grid === undefined) options.grid = true;
  }
  if (typeof from === 'string') {
    from = _STAGGER_FROM_ALIASES[from] ?? from;
    if (from === 'edges') {
      from = 'center';
      reversed = !reversed;
    } else if (!_STAGGER_FROM_VALUES.has(from)) {
      lcardsLog.warn(`[staggerArgs] Unknown stagger from "${from}", using 'first'`);
      from = 'first';
    }
  }
  if (from !== undefined) options.from = from;
  if (reversed) options.reversed = true;

  if (marker.grid !== undefined) options.grid = marker.grid;
  if (marker.axis !== undefined) options.axis = _STAGGER_AXIS_ALIASES[marker.axis] ?? marker.axis;
  if (marker.ease !== undefined) options.ease = resolveEasing(marker.ease);
  for (const key of ['jitter', 'seed', 'start', 'total']) {
    if (marker[key] !== undefined) options[key] = marker[key];
  }
  return { value, options };
}

/**
 * Random source for a preset: a seeded generator when `seed` is a number (the same
 * seed gives the same sequence, on every load), otherwise Math.random.
 *
 * mulberry32, kept here rather than anime.js's utils.createSeededRandom so this
 * module stays importable without a DOM (the build's config validator loads it).
 *
 * @param {unknown} seed
 * @returns {() => number} values from 0 (inclusive) to 1 (exclusive)
 */
export function presetRandom(seed) {
  if (typeof seed !== 'number' || !Number.isFinite(seed)) return Math.random;
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Timeline-level anime.js params a timeline preset may set (the rest belong to steps). */
const _TIMELINE_PARAMS = ['loop', 'alternate', 'loopDelay', 'reversed', 'playbackRate', 'playbackEase'];

/**
 * Elements a timeline step animates: its own `target`/`targets` selector(s), resolved
 * inside `root`, or the animation's own targets when the step names none.
 * @param {any} spec - selector string, Element, array of either, or undefined
 * @param {Element|Document|ShadowRoot} root
 * @param {Element[]} fallback
 * @returns {Element[]}
 */
function _resolveStepTargets(spec, root, fallback) {
  if (spec === undefined || spec === null) return fallback;
  if (spec instanceof Element) return [spec];
  if (Array.isArray(spec)) return spec.flatMap(s => _resolveStepTargets(s, root, []));
  if (typeof spec === 'string' && root && 'querySelectorAll' in root) return [...root.querySelectorAll(spec)];
  return [];
}

/**
 * Build one anime.js timeline from a timeline preset's params (`_timeline` marker).
 *
 * Each step is `{ target | targets, offset, params?, ...tween props }`. A step selector is
 * resolved inside `root` (the card's shadow root; in an MSD card that reaches every
 * overlay of the card, e.g. `[data-overlay-id="line_1"]`), so one timeline can move
 * between parts of a card. Offsets are anime.js v4 positions: a number (ms), '+=N' /
 * '-=N' relative to the end of the previous step, '<' at the end of the previous step,
 * '<<' together with it, or a label.
 *
 * @param {Record<string, any>} params - merged preset output (`steps`, `loop`, ...)
 * @param {Element[]} targets - the animation's own targets (steps without a selector)
 * @param {Element|Document|ShadowRoot} root
 * @returns {any} the timeline
 */
function _buildTimeline(params, targets, root) {
  /** @type {Record<string, any>} */
  const timelineParams = {};
  for (const key of _TIMELINE_PARAMS) {
    if (params[key] !== undefined) timelineParams[key] = params[key];
  }
  if (typeof params.delay === 'number') timelineParams.delay = params.delay;
  const timeline = window.lcards.anim.animejs.createTimeline(timelineParams);

  (Array.isArray(params.steps) ? params.steps : []).forEach((step, index) => {
    const { target, targets: stepSelector, offset, params: stepParams, ...stepProps } = step;
    const stepTargets = _resolveStepTargets(stepSelector ?? target, root, targets);
    if (stepTargets.length === 0) {
      lcardsLog.warn(`[animateElement] Timeline step ${index}: no element matches`, { target: stepSelector ?? target });
      return;
    }
    stepTargets.forEach(el => _migrateTransformAttrToStyle(el));
    const props = _cleanAnimeParams(resolveAnimationCssVariables(stepParams ? { ...stepProps, ...stepParams } : stepProps));
    if (props.ease !== undefined) props.ease = resolveEasing(props.ease);
    timeline.add(stepTargets, props, offset);
  });
  return timeline;
}

/**
 * Process special animation markers (_timeline, _stagger)
 * These are inserted by presets to signal special handling
 *
 * Marker Types:
 *
 * 1. _timeline: true
 *    - Creates an anime.js timeline instead of a single animation
 *    - Input: { _timeline: true, steps: [{targets, params, offset}], loop, ... }
 *    - Output: Timeline instance that can have multiple steps added
 *    - Example: timeline-cascade preset creates sequential reveals
 *
 * 2. _stagger: true (in delay object)
 *    - Converts delay config object to anime.js stagger() function
 *    - Input: delay: { _stagger: true, value: 100, grid: [6,2], from: 'center' }
 *    - Output: delay: stagger(100, { grid: [6,2], from: 'center' })
 *    - Example: stagger-grid preset animates grid elements with progressive delay
 *
 *    Options are mapped by staggerArgs() (aliases, v4 option names).
 *
 * @param {Object} params - Animation parameters from preset
 * @param {Element} element - Target element for animation
 * @param {Element|Document|ShadowRoot} root - Where step selectors of a timeline are resolved (the card's root)
 * @param {{ clientX: number, clientY: number }|null} [pointer] - the tap that triggered it (stagger `from: 'pointer'`)
 * @param {Element[]} [elements] - every target of a batch stagger (for `from: 'pointer'`)
 * @returns {Object} { isTimeline: boolean, timelineInstance: object|null, processedParams: object }
 * @private
 */
function _processAnimationMarkers(params, element, root, pointer = null, elements = [element]) {
  // 1. Handle _timeline marker - create timeline instead of single animation
  if (params._timeline === true) {
    if (!window.lcards?.anim?.animejs?.createTimeline) {
      lcardsLog.error('[animateElement] createTimeline not available for _timeline marker');
      return { isTimeline: false, timelineInstance: null, processedParams: params };
    }
    return { isTimeline: true, timelineInstance: _buildTimeline(params, [element], root), processedParams: params };
  }

  // Make a copy to avoid mutating original
  const processedParams = { ...params };

  // 2. Handle _stagger marker - convert to stagger function
  if (processedParams.delay?._stagger === true) {
    if (!window.lcards?.anim?.animejs?.stagger) {
      lcardsLog.warn('[animateElement] stagger() not available for _stagger marker');
    } else {
      const rects = processedParams.delay.from === 'pointer' ? elements.map(el => el.getBoundingClientRect()) : [];
      const { value, options } = staggerArgs(processedParams.delay, { pointer, rects });
      processedParams.delay = window.lcards.anim.animejs.stagger(value, options);
      lcardsLog.debug('[animateElement] Converted _stagger to stagger function', { value, options });
    }
  }

  return {
    isTimeline: false,
    timelineInstance: null,
    processedParams
  };
}

/**
 * Lightweight handle for a CSS-driven preset (e.g. `march`, which sets a plain
 * `element.style.animation` shorthand instead of creating an anime.js instance,
 * for performance on continuous animations — see presets/index.js). Duck-types
 * the same `.speed`/`.completed`/`.revert()` surface AnimationManager already
 * expects from a real anime.js `JSAnimation`/`Timer` instance (Phase 10's live
 * map_range speed-adjust, and the existing stopAnimations() cleanup path), so
 * neither of those need to know or care whether a given animation is CSS- or
 * anime.js-backed.
 * @param {HTMLElement|SVGElement} element - Element the CSS animation runs on
 * @param {number} baseDurationMs - The duration (ms) baked into element.style.animation at setup time
 * @returns {{completed: boolean, _speed: number, speed: number, revert: function, pause: function}}
 */
function createCssAnimationHandle(element, baseDurationMs) {
  return {
    completed: false,
    _speed: 1,
    get speed() { return this._speed; },
    set speed(ratio) {
      this._speed = ratio;
      // CSS's animation-duration is an absolute duration, not a rate multiplier
      // like anime.js's .speed — dividing baseDurationMs by ratio converts the
      // multiplier back into the equivalent absolute duration. Setting this
      // longhand property directly updates just the duration, leaving the
      // animation-name/timing-function/iteration-count set by the `animation`
      // shorthand at setup time intact, and applies live without restarting.
      if (element && ratio > 0) {
        element.style.animationDuration = `${baseDurationMs / ratio}ms`;
      }
    },
    revert() {
      this.completed = true;
      if (element) element.style.animation = '';
    },
    pause() {
      if (element) element.style.animationPlayState = 'paused';
    }
  };
}

/**
 * Migrate an element's SVG `transform` XML attribute into an inline CSS
 * `transform` style, if present and no inline style already exists.
 *
 * anime.js only ever reads/writes the CSS `transform` property (see
 * parseInlineTransforms() in node_modules/animejs/dist/modules/core/transforms.js,
 * which parses target.style.transform and has no knowledge of the SVG
 * `transform` XML attribute at all). Animating an element that carries an
 * authoring-tool `transform="translate(...)"` attribute (extremely common —
 * Inkscape/Illustrator position nearly every layer group this way) causes
 * anime.js's CSS transform to fully override the attribute per SVG2/CSS
 * Transforms precedence rules, silently discarding the original position —
 * even at a loop's rest point (e.g. scale(1) is still a CSS transform
 * declaration that replaces the attribute-based translate entirely).
 *
 * Deliberately scoped to only the element(s) actually being animated, applied
 * just-in-time right before anime.js touches them — NOT proactively across an
 * entire SVG at load time. An earlier attempt at the latter (in
 * LCARdSMSDCard._wrapSvgContentForRender()) caused an unrelated static-rendering
 * regression (the base SVG losing its overall centering with zero animations
 * active) that wasn't tracked down; limiting the blast radius to only the
 * handful of elements an animation targets avoids whatever that interaction
 * was, while still fixing the original problem for the elements that need it.
 *
 * The attribute is consolidated into one matrix and written as `matrix(..)`,
 * compensated for the transform-origin the preset sets (see _writeAuthoredMatrix),
 * so the element draws exactly as before. Call it after the preset's styles and
 * setup() have run, so that origin is known. (Before 2026-10 only translate()
 * survived, rewritten as translateX/translateY: rotate/scale forms were dropped and
 * the element jumped to its untransformed position.)
 * @param {Element} element
 */
function _migrateTransformAttrToStyle(element) {
  const el = /** @type {any} */ (element);
  const style = el?.style;
  if (!el || !style) return;
  if (style.transform) {
    // Migrated by us earlier: re-fit the compensation to the current transform-origin
    // (a later preset may have set another one). Any other inline transform is the
    // card's or an animation's own and is left alone.
    if (el._lcardsAuthoredMatrix && style.transform === el._lcardsMigratedTransform) _writeAuthoredMatrix(el);
    return;
  }
  const transformValue = el.getAttribute?.('transform');
  if (!transformValue) return;
  // Every SVG transform form (translate with spaces or commas, rotate(a cx cy), scale,
  // skew, matrix, lists of them) consolidates to one matrix: unitless and valid CSS
  // (a bare translate(10 5) is not), and anime.js keeps an inline matrix() beside the
  // transforms it animates.
  const consolidated = el.transform?.baseVal?.consolidate?.();
  if (!consolidated) return;
  const m = consolidated.matrix;
  el._lcardsAuthoredMatrix = [m.a, m.b, m.c, m.d, m.e, m.f];
  _writeAuthoredMatrix(el);
  el.removeAttribute('transform');
  lcardsLog.debug('[_migrateTransformAttrToStyle] Migrated attribute to style', {
    id: el.id, from: transformValue, to: style.transform
  });
}

/**
 * Write an element's authored SVG matrix M into style.transform so it draws exactly as
 * the attribute did. The attribute transforms about the user-space origin; a CSS
 * transform turns about transform-origin O (presets set center + fill-box), so the
 * written matrix is T(-O) M T(O). anime.js renders its own transforms before this
 * matrix, so a scale/rotate preset on a rotated or scaled group pivots in the parent's
 * space rather than around the group's own centre (a documented limitation).
 * @param {any} el - carries _lcardsAuthoredMatrix
 */
function _writeAuthoredMatrix(el) {
  const [a, b, c, d, e, f] = el._lcardsAuthoredMatrix;
  const computed = getComputedStyle(el);
  const [ox = 0, oy = 0] = String(computed.transformOrigin || '0 0').split(' ').map(parseFloat);
  let bx = 0;
  let by = 0;
  if (computed.transformBox === 'fill-box' && typeof el.getBBox === 'function') {
    try { const box = el.getBBox(); bx = box.x; by = box.y; } catch (_e) { /* not rendered */ }
  }
  const origin = { x: bx + ox, y: by + oy };
  const matrix = new DOMMatrix().translate(-origin.x, -origin.y)
    .multiply(new DOMMatrix([a, b, c, d, e, f]))
    .translate(origin.x, origin.y);
  el.style.transform = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.e}, ${matrix.f})`;
  el._lcardsMigratedTransform = el.style.transform;
}

/**
 * Animates element(s) using anime.js with special handling for SVG animations.
 * Unchanged behavior, v4-native through window.lcards.anim.anime
 *
 * @param {object} scope - animation scope (root element, card id, ...)
 * @param {object} options - animation definition
 * @param {object|null} [hass]
 * @param {((instance: any) => void)|null} [onInstanceCreated] - receives each created anime.js instance or CSS handle
 */
export async function animateElement(scope, options, hass = null, onInstanceCreated = null) {
  const { type, targets, root = document, pointer = null, ...animOptions } = options;
  if (!type || !targets || !scope) {
    lcardsLog.warn('[animateElement] Animation missing type, targets, or scope.', { options, scope });
    return;
  }
  lcardsLog.debug('[animateElement] Received options:', { options });

  // target: background resolves to EffectHandles, not elements
  if (Array.isArray(targets) && targets.length > 0 && targets.every(isEffectHandle)) {
    // After an await, like the element path below: created synchronously inside
    // AnimationManager's scope.add(), the instance joined the anime.js scope, and
    // a re-render's scope.revert() then killed it even though the carry-over had
    // kept it (a warp ramp cut short by the alert-mode re-render)
    await Promise.resolve();
    _animateEffectHandles(targets, type, animOptions, onInstanceCreated);
    return;
  }

  // Runs inline, not inside scope.add(): anime.js only registers instances created
  // while a scope callback runs synchronously, and everything here is created after
  // an await, so the scope never tracked them. Callers track instances through
  // onInstanceCreated, and awaiting this function means they all exist on return.
  try {
    const elements = await waitForElements(targets, root);
    if (!elements || elements.length === 0) {
      lcardsLog.error('[animateElement] Target element(s) not found:', { targets });
      return;
    }

    lcardsLog.debug('[animateElement] Elements resolved:', {
      selector: targets,
      elementsFound: elements.length,
      elementDetails: elements.map(el => ({
        tag: el.tagName,
        id: el.id,
        classes: el.className
      }))
    });

    // Log cascade animation targeting for debugging
    if (type === 'cascade-color') {
      lcardsLog.debug('[animateElement] Cascade-color targeting:', {
        selector: targets,
        elementsFound: elements.length,
        elementTags: elements.map(el => `${el.tagName}[data-row=${/** @type {any} */ (el).dataset.row},data-col=${/** @type {any} */ (el).dataset.col}]`)
      });
    }

    // ── Timeline short-circuit ───────────────────────────────────────────────
    // A timeline preset (sequence, timeline-*) builds ONE timeline for the whole
    // animation: steps without their own selector animate all targets together,
    // steps with one animate those elements. (One timeline per target would run
    // N copies of the same sequence.)
    if (!Array.isArray(type)) {
      const _tlPresetFn = getAnimationPreset(String(type).toLowerCase());
      if (_tlPresetFn) {
        const _tlParams = { duration: 1000, ease: 'inOutQuad', ...animOptions };
        if (_tlParams.ease) _tlParams.ease = resolveEasing(_tlParams.ease);
        const _tlResult = _tlPresetFn(_tlParams);
        if (_tlResult?._timeline || _tlResult?.anime?._timeline) {
          elements.forEach(el => {
            if (_tlResult.styles) Object.assign(/** @type {any} */ (el).style, _tlResult.styles);
            if (_tlResult.setup) { try { _tlResult.setup(el); } catch (_se) {} }
            _migrateTransformAttrToStyle(el); // after styles: needs the transform-origin
            _reportPresetInstances(el, onInstanceCreated);
          });
          if (!window.lcards?.anim?.animejs?.createTimeline) {
            lcardsLog.error('[animateElement] createTimeline not available for timeline preset', { type });
            return;
          }
          const _timeline = _buildTimeline({ ..._tlParams, ..._tlResult.anime }, elements, root);
          if (onInstanceCreated) onInstanceCreated(_timeline);
          return;
        }
      }
    }

    // ── Stagger-batch short-circuit ──────────────────────────────────────────
    // Stagger presets (stagger-grid, stagger-wave, stagger-radial) require a
    // SINGLE anime() call across ALL elements so that the stagger delay
    // function receives the correct per-element index.  Calling anime() once
    // per element (as the loop below does) gives every element index 0.
    // Detect this case by pre-running the preset and checking delay._stagger.
    if (elements.length > 1 && !Array.isArray(type)) {
      const _batchPresetFn = getAnimationPreset(String(type).toLowerCase());
      if (_batchPresetFn) {
        try {
          const _batchProbeParams = { duration: 1000, ease: 'inOutQuad', ...animOptions };
          if (_batchProbeParams.ease) _batchProbeParams.ease = resolveEasing(_batchProbeParams.ease);
          // _batchProbeParams already IS a valid def for the preset factory (see
          // the per-element call site above for why) — passing it directly avoids
          // reproducing the same def-vs-def.params precedence bug this file's
          // other call site already had fixed (this one previously had the
          // spread order reversed, so a non-empty options.params — which
          // stagger-grid/wave/radial ALWAYS have, since grid/delay are their
          // entire reason to exist — would silently win over the correctly
          // resolved duration/ease/loop/alternate here, every time).
          const _batchProbeResult = _batchPresetFn(_batchProbeParams);

          lcardsLog.debug('[animateElement] Stagger-batch probe result:', {
            type,
            elementsFound: elements.length,
            hasStaggerMarker: _batchProbeResult?.anime?.delay?._stagger === true,
            probeAnimeKeys: _batchProbeResult?.anime ? Object.keys(_batchProbeResult.anime) : null,
            probeDelay: _batchProbeResult?.anime?.delay
          });

          // `batch: false`: the preset animates per-element targets of its own (text
          // presets stagger the split characters of each element), not the elements
          if (_batchProbeResult?.anime?.delay?._stagger === true && _batchProbeResult.batch !== false) {
            // Build final batch params by merging preset anime output.
            // Start from probe params then let the preset output overwrite — this
            // ensures the preset's [property]:[from,to] tween wins over anything
            // the probe params might have for the same key.
            const _batchParams = { ..._batchProbeParams };
            Object.assign(_batchParams, _batchProbeResult.anime);

            // Apply per-element CSS styles from preset
            if (_batchProbeResult.styles) {
              elements.forEach(el => Object.assign(/** @type {any} */ (el).style, _batchProbeResult.styles));
            }
            // Run preset setup callbacks
            if (_batchProbeResult.setup) {
              elements.forEach(el => { try { _batchProbeResult.setup(el); } catch (_se) {} });
            }
            // Migrate any SVG transform attributes before anime.js touches these
            // elements, after the styles (it needs the transform-origin)
            elements.forEach(el => _migrateTransformAttrToStyle(el));
            elements.forEach(el => _reportPresetInstances(el, onInstanceCreated));

            // Convert the _stagger marker to an anime.js stagger() function
            const _batchMarkerResult = _processAnimationMarkers(_batchParams, elements[0], root, pointer, elements);
            if (!_batchMarkerResult.isTimeline) {
              // Resolve CSS variables (var(--...)) in color properties so anime.js
              // can interpolate them correctly (it can't parse var() references).
              const _batchResolvedParams = resolveAnimationCssVariables(_batchMarkerResult.processedParams);

              // Strip LCARdS-internal meta-params that must not be passed to anime.js.
              // e.g. 'from', 'grid', 'property', 'from_value', 'to_value', 'trigger'
              // are consumed by the preset/AnimationManager and are not valid anime.js params.
              const _batchFinalParams = _cleanAnimeParams(_batchResolvedParams);
              lcardsLog.debug('[animateElement] Calling batch anime() with:', {
                elementCount: elements.length,
                finalParamKeys: Object.keys(_batchFinalParams),
                delayIsFunction: typeof _batchFinalParams.delay === 'function'
              });
              const _batchInstance = window.lcards.anim.anime(elements, _batchFinalParams);
              // Same _pendingInstanceSetup hand-off as the per-element path below
              // (cascade-color's interactive pause/resume), here with the shared instance
              elements.forEach(el => {
                const pending = /** @type {any} */ (el)._pendingInstanceSetup;
                if (typeof pending !== 'function') return;
                delete /** @type {any} */ (el)._pendingInstanceSetup;
                try { pending(_batchInstance); } catch (setupError) {
                  lcardsLog.error('[animateElement] Error in pending instance setup:', setupError);
                }
              });
              if (onInstanceCreated) onInstanceCreated(_batchInstance);
            }
            return; // bypass per-element loop
          }
        } catch (_batchErr) {
          lcardsLog.warn('[animateElement] ⚠️ Stagger-batch probe failed — falling back to per-element loop', {
            error: _batchErr?.message,
            type,
            stack: _batchErr?.stack?.split('\n')[1]
          });
        }
      }
    }

    for (const element of elements) {
      const params = {
        duration: 1000,
        ease: 'inOutQuad',  // Default to v4 naming
        ...animOptions,
      };

      // ✨ Resolve ease configuration (string or parametric object)
      if (params.ease) {
        params.ease = resolveEasing(params.ease);
      }

      // state_resolver hook (left as-is)
      if (options.state_resolver && options.entity && window.lcards.styleHelpers?.resolveStateStyles) {
        const resolvedStyles = window.lcards.styleHelpers.resolveStateStyles(
          options.state_resolver,
          hass,
          options.entity
        );
        Object.assign(params, resolvedStyles);
      }

      // Apply preset(s)
      if (Array.isArray(type)) {
        applyPresets(type, params, element, options);
      } else {
        // Try new MSD preset system first
        const msdPresetFn = getAnimationPreset(String(type).toLowerCase());

        if (msdPresetFn) {
          // Use new MSD preset system
          lcardsLog.debug(`[animateElement] Using MSD preset: ${type}`);

          try {
            // `params` already has every field a preset could need — defaults,
            // resolved ease, and everything from animOptions (including its own
            // `params:` extras, nested at `params.params`) — so it IS a valid
            // `def` for the preset factory as-is. No merge needed here; presets
            // read their fields via resolvePresetParams(def), which handles the
            // def-vs-def.params precedence correctly and consistently for both
            // call sites (see resolvePresetParams() in this file for why the
            // old `def.params || def` idiom was unsafe).
            const presetResult = msdPresetFn(params);

            // Apply anime.js parameters
            if (presetResult.anime) {
              Object.assign(params, presetResult.anime);
            }

            // `_timeline` is a top-level sibling of `.anime` on presetResult (see
            // sequence/timeline-cascade/timeline-attention), not nested inside it —
            // the Object.assign above only ever copies `.anime`'s own keys, so this
            // marker needs its own explicit copy. Without it, _processAnimationMarkers()
            // never sees params._timeline === true and every timeline-based preset
            // silently falls through to a plain anime.animate() call instead, with a
            // raw `steps` array passed through as a bogus, non-animatable property —
            // an instance gets created but nothing visible ever happens.
            if (presetResult._timeline) {
              params._timeline = true;
            }

            // Resolve CSS variables in animation params (for theme reactivity)
            const resolvedParams = resolveAnimationCssVariables(params);
            Object.assign(params, resolvedParams);

            // Call setup function if provided (for CSS keyframe injection, etc.)
            if (presetResult.setup && typeof presetResult.setup === 'function') {
              presetResult.setup(element);
            }
            if (typeof presetResult.cleanup === 'function') /** @type {any} */ (element)._presetCleanup = presetResult.cleanup;
            _reportPresetInstances(element, onInstanceCreated);

            // Apply CSS styles to target element
            if (presetResult.styles && element) {
              Object.assign(/** @type {HTMLElement} */ (element).style, presetResult.styles);
            }
          } catch (error) {
            lcardsLog.error(`[animateElement] Error applying MSD preset ${type}:`, error);
          }
        }

      }

      // After the preset's styles and setup(): the migration needs the transform-origin
      _migrateTransformAttrToStyle(element);

      // CSS-driven preset (e.g. march): no anime.js instance exists, but still
      // report a lightweight handle so AnimationManager can track/live-adjust
      // it (Phase 10) and stopAnimations() can revert it, the same as it would
      // for a real anime.js instance.
      if (params._cssAnimation) {
        if (onInstanceCreated && typeof onInstanceCreated === 'function' && typeof params.duration === 'number') {
          onInstanceCreated(createCssAnimationHandle(/** @type {HTMLElement | SVGElement} */ (element), params.duration));
        }
        continue;
      }

      // Skip if targets were explicitly nulled (preset self-manages, e.g. scramble)
      if (params.targets === null) {
        continue;
      }

      // Process special animation markers (_timeline, _stagger)
      const markerResult = _processAnimationMarkers(params, element, root, pointer);

      // If timeline marker was processed, track the timeline instance and skip anime() call
      if (markerResult.isTimeline && markerResult.timelineInstance) {
        lcardsLog.debug(`[animateElement] Timeline created for ${type}`, {
          scopeId: scope.id || 'no-id',
          element: element.id || element.tagName
        });

        // Call callback with the timeline instance (for tracking)
        if (onInstanceCreated && typeof onInstanceCreated === 'function') {
          onInstanceCreated(markerResult.timelineInstance);
        }

        continue; // Skip anime() call for timelines
      }

      // Use processed params (with stagger/radial converted if needed)
      const processedParams = markerResult.processedParams;

      // Check if preset created a drawable (for draw animations)
      // or overrode the target element
      let targetElement = element;
      let animeParams = { ...processedParams };

      if (/** @type {any} */ (element)._drawable) {
        // Use drawable created by preset setup (e.g., draw animation)
        targetElement = /** @type {any} */ (element)._drawable;
        lcardsLog.debug(`[animateElement] Using drawable for ${type}`, { element: element.tagName });
      } else if (processedParams.targets && processedParams.targets instanceof Element) {
        // Preset wants to animate a different element (e.g., text child of group)
        targetElement = processedParams.targets;
        // Remove targets from params since it's passed as first argument
        const { targets: _, ...rest } = processedParams;
        animeParams = rest;
      } else if (/** @type {any} */ (element)._animTargets !== undefined) {
        // Text/split animations: setup() stored per-character targets on the element.
        // null signals that setup() self-managed the animation entirely (e.g. scramble).
        const animTargets = /** @type {any} */ (element)._animTargets;
        delete /** @type {any} */ (element)._animTargets;
        if (animTargets === null) {
          // A self-managed preset ties its own cleanup to the instances it reported
          delete /** @type {any} */ (element)._presetCleanup;
          lcardsLog.debug(`[animateElement] Preset setup() self-managed animation for ${type}, skipping main anime call`);
          continue;
        }
        targetElement = animTargets;
        // Strip the CSS-selector placeholder 'targets' from params (no longer needed)
        const { targets: _, ...rest } = animeParams;
        animeParams = rest;
      }

      if (/** @type {any} */ (element)._motionPath) {
        // motionpath preset: merge in the real translateX/translateY/(rotate)
        // anime.js v4 tween properties computed by setup() from the resolved
        // path element (see presets/index.js's `motionpath` factory) — these
        // aren't known until the actual DOM element/path exist, so they can't
        // be part of the preset factory's own returned `anime` object.
        animeParams = { ...animeParams, ...(/** @type {any} */ (element)._motionPath) };
      }
      if (/** @type {any} */ (element)._presetTweens) {
        // Tween values setup() could only build once the element exists (morph's morphTo)
        animeParams = { ...animeParams, ...(/** @type {any} */ (element)._presetTweens) };
        delete /** @type {any} */ (element)._presetTweens;
      }

      // Strip LCARdS-internal meta-params before calling anime.animate()
      const cleanedAnimeParams = _cleanAnimeParams(animeParams);

      lcardsLog.debug('[animateElement] Calling anime() with:', {
        id: /** @type {any} */ (targetElement)?.id,
        styleTransformBeforeCall: /** @type {any} */ (targetElement)?.style?.transform,
        cleanedAnimeParamKeys: Object.keys(cleanedAnimeParams)
      });

      const animeInstance = window.lcards.anim.anime(targetElement, cleanedAnimeParams);
      lcardsLog.debug(`[animateElement] Animation instance created:`, {
        scopeId: scope.id || 'no-id',
        element: element.id || element.tagName,
        targetElement: targetElement?.id || targetElement?.tagName || typeof targetElement,
        animeInstance: !!animeInstance,
        params: cleanedAnimeParams
      });

      // Some presets (e.g. cascade-color's interactive mode) need the real
      // anime.js instance to wire up behavior — setup() runs before the
      // instance exists, so it can't do this itself. It stashes a callback
      // on the element for us to invoke now that the instance is real (see
      // the _drawable/_animTargets/_motionPath convention above).
      if (typeof (/** @type {any} */ (element)._pendingInstanceSetup) === 'function') {
        const pendingInstanceSetup = /** @type {any} */ (element)._pendingInstanceSetup;
        delete /** @type {any} */ (element)._pendingInstanceSetup;
        try {
          pendingInstanceSetup(animeInstance);
        } catch (setupError) {
          lcardsLog.error('[animateElement] Error in pending instance setup:', setupError);
        }
      }

      // Call callback with the created instance (for tracking)
      if (onInstanceCreated && typeof onInstanceCreated === 'function') {
        onInstanceCreated(_withPresetCleanup(animeInstance, element));
      }
    }
  } catch (error) {
    lcardsLog.error('[animateElement] Failed to animate element(s):', { targets, type, error });
  }
}


/**
 * Applies one or more animation presets to the anime.js params object.
 * @deprecated All presets now come from the pack system. Use {@link getAnimationPreset} instead.
 */
export function applyPresets(types, params, element, options) {
  lcardsLog.warn('[applyPresets] Legacy function called - use pack-based presets instead');
}


