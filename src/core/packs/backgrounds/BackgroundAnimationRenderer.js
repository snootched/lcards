/**
 * Background Animation Coordinator
 * Manages Canvas2D renderer and effect composition
 *
 * Accepts two config forms:
 * - Bare array: `[{ preset, config, zoom }, ...]`
 * - Envelope object: `{ inset: { top, right, bottom, left } | 'auto', effects: [...] }`
 *
 * @module core/packs/backgrounds/BackgroundAnimationRenderer
 */
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { Canvas2DRenderer } from './renderers/Canvas2DRenderer.js';
import { BACKGROUND_PRESETS } from './presets/index.js';
import { ZoomEffect } from './effects/ZoomEffect.js';
import { ColorUtils } from '../../themes/ColorUtils.js';
import { resolveColor } from '../../themes/resolve-color.js';
import { isComputedColor } from '../../themes/color-syntax.js';
import { isTemplateString } from '../../../utils/template-string.js';
import { LCARdSCardTemplateEvaluator } from '../../templates/LCARdSCardTemplateEvaluator.js';
import { TemplateDetector } from '../../templates/TemplateDetector.js';
import { mapRangeOutput } from '../../../utils/linearMap.js';
import { prefersReducedMotion } from '../../../utils/reduced-motion.js';
import { animate, utils } from 'animejs';
import { EffectHandle } from './effect-handle.js';
import { webglAvailable } from './webgl/webgl-support.js';

/** Default glide for an entity-bound value, in ms (`background_animation[].transition`) */
export const DEFAULT_BINDING_TRANSITION = 500;

/** @param {string} key - snake_case config key */
const camelKey = (key) => key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Clock and pan fields a rebuilt effect takes over from the one it replaces */
const CLOCK_FIELDS = ['_elapsedTime', '_scrollOffsetX', '_scrollOffsetY', '_offsetX', '_offsetY', '_angle', '_sweepOffset', 'scrollX', 'scrollY'];

/**
 * @param {any} from
 * @param {any} to
 */
function carryClock(from, to) {
  if (!from || !to || from.constructor !== to.constructor) return;
  for (const f of CLOCK_FIELDS) if (typeof from[f] === 'number' && typeof to[f] === 'number') to[f] = from[f];
}

/**
 * Orchestrates background animation rendering using Canvas2D with modular effects
 */
export class BackgroundAnimationRenderer {
  /**
   * @param {HTMLElement} container - Container element for the canvas
   * @param {Array|Object} config - Bare effects array or envelope object `{ inset, effects }`
   * @param {*} [cardInstance=null] - Card instance for theme token resolution
   */
  constructor(container, config, cardInstance = null) {
    this.container = container;
    this.config = config;
    this.cardInstance = cardInstance; // Reference to card for theme token resolution
    /** @type {import('./renderers/Canvas2DRenderer.js').Canvas2DRenderer | null} */
    this.renderer = null;
    /** @type {ResizeObserver | null} keeps the canvas buffer at the container's size */
    this._resizeObserver = null;
    this._resizeFrame = 0;
    this.canvas = null;
    /** @type {{ top: number, right: number, bottom: number, left: number }} */
    this.inset = { top: 0, right: 0, bottom: 0, left: 0 };
    /** @type {Array} */
    this.effectConfigs = [];
    /** @type {Object|string|null} */
    this._rawInset = null;
    /**
     * One entry per loaded `background_animation` entry, populated during
     * _loadEffects() so updateHass() can re-evaluate templated / map_range
     * values and apply them to the entry's EffectHandle.
     * @type {Array<{ effectConfig: Object, rawConfig: Object, presetId: string, handle: EffectHandle, transition: number }>}
     */
    this._reactiveEffects = [];
    /**
     * One EffectHandle per `background_animation` entry, by its index (null for
     * a disabled or unknown entry). Kept across refreshColors() rebuilds.
     * @type {Array<EffectHandle|null>}
     */
    this.handles = [];
    /** @type {Set<string>} binding keys already reported as not applicable */
    this._warnedKeys = new Set();
  }

  /**
   * Resolve the config into `this.effectConfigs` and `this.inset`.
   *
   * Accepts:
   * - Bare array `[{ preset, config, zoom }, ...]`
   * - Envelope object `{ inset: {...} | 'auto', effects: [...] }`
   *
   * The `'auto'` sentinel is stored in `this._rawInset` and resolved later by
   * the card via `updateInset()`.
   *
   * @private
   */
  _resolveConfig(config) {
    // Default — overridden below when the envelope-object form is used.
    this._targetFps = 30;

    if (Array.isArray(config)) {
      this.inset = { top: 0, right: 0, bottom: 0, left: 0 };
      this._rawInset = null;
      this.effectConfigs = config;
    } else if (config && typeof config === 'object' && 'effects' in config) {
      this.effectConfigs = config.effects ?? [];
      this._rawInset = config.inset ?? null;
      this._targetFps  = config.fps ?? 30;
      // 'auto' is resolved later via updateInset(); default to zero until then
      if (this._rawInset === 'auto' || !this._rawInset) {
        this.inset = { top: 0, right: 0, bottom: 0, left: 0 };
      } else {
        this.inset = {
          top:    this._rawInset.top    ?? 0,
          right:  this._rawInset.right  ?? 0,
          bottom: this._rawInset.bottom ?? 0,
          left:   this._rawInset.left   ?? 0
        };
      }
    } else {
      // Fallback: treat as single-effect object
      this.inset = { top: 0, right: 0, bottom: 0, left: 0 };
      this._rawInset = null;
      this.effectConfigs = config ? [config] : [];
    }
  }

  /**
   * Initialize background renderer with effects from preset/config
   * @returns {boolean} True if initialization succeeded
   */
  init() {
    try {
      // Resolve config into effectConfigs + inset
      this._resolveConfig(this.config);

      const inset = this.inset;

      // Create canvas element
      this.canvas = document.createElement('canvas');
      this.canvas.width  = Math.max(1, (this.container.offsetWidth  || 400) - inset.left - inset.right);
      this.canvas.height = Math.max(1, (this.container.offsetHeight || 300) - inset.top  - inset.bottom);
      this.canvas.style.position = 'absolute';
      this.canvas.style.top    = `${inset.top}px`;
      this.canvas.style.left   = `${inset.left}px`;
      this.canvas.style.width  = `calc(100% - ${inset.left + inset.right}px)`;
      this.canvas.style.height = `calc(100% - ${inset.top  + inset.bottom}px)`;
      this.canvas.style.pointerEvents = 'none';

      this.container.appendChild(this.canvas);

      lcardsLog.debug('[BackgroundAnimation] Canvas created', {
        width: this.canvas.width,
        height: this.canvas.height,
        inset,
        containerWidth: this.container.offsetWidth,
        containerHeight: this.container.offsetHeight
      });

      // Create renderer — forward the per-card FPS cap from config.
      this.renderer = new Canvas2DRenderer(this.canvas, { targetFps: this._targetFps });

      // Load effects from preset or config
      const success = this._loadEffects();
      if (!success) {
        return false;
      }

      // Start animation
      this.renderer.start();

      // Suspend animation when the card is scrolled off-screen, resume when it returns.
      // Falls back gracefully if IntersectionObserver is unavailable (SSR, old browsers).
      // Skip in editor preview mode — the card is always visible there, and the IO
      // fires immediately with isIntersecting:false inside the editor's shadow DOM
      // context (the backgroundLayer div is clipped by the dialog's overflow boundary
      // before layout settles), permanently suspending the loop before any frame renders.
      const _isPreview = typeof this.cardInstance?.isPreviewMode === 'function'
        ? this.cardInstance.isPreviewMode()
        : false;
      if (!_isPreview && typeof IntersectionObserver !== 'undefined') {
        this._intersectionObserver = new IntersectionObserver(
          (entries) => {
            // Ignore IO callbacks that fire as a side-effect of the browser tab being
            // hidden or restored.  When the tab is hidden the browser marks all elements
            // as non-intersecting; when the tab is restored those notifications may
            // arrive late and race with the visibilitychange handler.  We let
            // visibilitychange own the tab-hide/restore lifecycle exclusively and give
            // IntersectionObserver responsibility only for genuine viewport transitions
            // (scrolling, HA view switches) while the tab is actually visible.
            if (document.hidden) return;
            if (entries[0]?.isIntersecting) {
              this.renderer?.resumeAnimation();
            } else {
              this.renderer?.suspendAnimation();
            }
          },
          { threshold: 0 }
        );
        this._intersectionObserver.observe(this.container);
        lcardsLog.debug('[BackgroundAnimation] IntersectionObserver attached');
      }

      // Follow the container's size: the canvas buffer is sized in px, so a
      // card that changes width after init (sections grid settling, sidebar,
      // window resize) would otherwise draw squashed (CSS stretches the
      // buffer). The canvas is absolutely positioned, so resizing it never
      // feeds back into the container size.
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => {
          if (this._resizeFrame) return;
          this._resizeFrame = requestAnimationFrame(() => {
            this._resizeFrame = 0;
            if (!this.canvas || !this.renderer) return;
            const { width, height } = this._canvasSize();
            if (width === this.canvas.width && height === this.canvas.height) return;
            this.handleResize();
            this.renderer.requestFrame();
          });
        });
        this._resizeObserver.observe(this.container);
      }

      lcardsLog.debug('[BackgroundAnimation] Renderer initialized and started');
      return true;

    } catch (error) {
      lcardsLog.error('[BackgroundAnimation] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Update the canvas inset and resize immediately.
   * Safe to call with all-zero inset (no-op in practice).
   *
   * @param {{ top?: number, right?: number, bottom?: number, left?: number }} inset
   */
  updateInset(inset) {
    this.inset = {
      top:    inset.top    ?? 0,
      right:  inset.right  ?? 0,
      bottom: inset.bottom ?? 0,
      left:   inset.left   ?? 0
    };
    this.handleResize();
  }

  /**
   * Resolve a map_range descriptor to a concrete value using hass entity state.
   *
   * Descriptor shape:
   *   map_range:
   *     entity: light.tv         # optional, defaults to card's config.entity (entity_id: the older name, still read)
   *     attribute: brightness    # optional — defaults to entity state
   *     input:  [0, 255]         # input range
   *     output: [-200, 200]      # output range (two numbers or two colours, any colour form)
   *     clamp: true              # optional, default true
   *
   * @private
   * @param {Object} descriptor - The full { map_range: {...} } object
   * @param {Object} hass
   * @param {Object|null} entity - Card-bound entity state object (fallback)
   * @param {Object} cardConfig  - Card config (for config.entity fallback)
   * @returns {number|string|undefined} Resolved value, or undefined on failure
   */
  _resolveMapRange(descriptor, hass, entity, cardConfig) {
    const cfg = descriptor.map_range;
    if (!cfg) return undefined;

    // Resolve the entity to read from
    // `entity`, as map_range everywhere else in LCARdS; `entity_id` is the name this used first
    const entityId = cfg.entity || cfg.entity_id || cardConfig?.entity || null;
    let entityObj;
    if (entityId) {
      entityObj = hass?.states?.[entityId] ?? null;
    } else {
      entityObj = entity ?? null;
    }

    if (!entityObj) {
      lcardsLog.warn('[BackgroundAnimation] map_range: entity not found', { entityId, cfg });
      return undefined;
    }

    const rawValue = cfg.attribute
      ? entityObj.attributes?.[cfg.attribute]
      : entityObj.state;

    const numVal = Number(rawValue);
    if (!Number.isFinite(numVal)) {
      lcardsLog.warn(`[BackgroundAnimation] map_range: value "${rawValue}" is not numeric`, cfg);
      return undefined;
    }

    if (!Array.isArray(cfg.input) || cfg.input.length !== 2) {
      lcardsLog.warn('[BackgroundAnimation] map_range: "input" must be a 2-element array', cfg);
      return undefined;
    }
    if (!Array.isArray(cfg.output) || cfg.output.length !== 2) {
      lcardsLog.warn('[BackgroundAnimation] map_range: "output" must be a 2-element array', cfg);
      return undefined;
    }

    const [inMin, inMax]   = cfg.input.map(Number);
    const clamp = cfg.clamp !== false; // default true
    const element = this.cardInstance instanceof Element ? this.cardInstance : null;

    const result = mapRangeOutput(numVal, inMin, inMax, cfg.output, clamp, { element });
    if (result === undefined) {
      lcardsLog.warn('[BackgroundAnimation] map_range: "output" must be two numbers or two colours', cfg);
    }
    return result;
  }

  /**
   * Strip config keys whose values are templates (form 1: template string;
   * form 2: object with a `.template` key) so that effect constructors receive
   * only concrete values and fall back to their built-in defaults for reactive
   * params.  updateHass() re-evaluates and pushes the real values on the first
   * hass update, so there is at most one frame at the preset default.
   *
   * @private
   * @param {Object} config - Effect config potentially containing template values
   * @returns {Object} New config with template-valued keys removed
   */
  _stripTemplateValues(config) {
    if (!config || typeof config !== 'object') return config;
    const stripped = {};
    for (const [key, val] of Object.entries(config)) {
      if (typeof val === 'string' && (TemplateDetector.hasJavaScript(val) || TemplateDetector.hasTokens(val))) {
        // Form 1: direct template string — omit so preset uses its default
        continue;
      }
      if (val && typeof val === 'object' && val.template !== undefined &&
          (TemplateDetector.hasJavaScript(val.template) || TemplateDetector.hasTokens(val.template))) {
        // Form 2: { template: '...', default: X } — omit key, will be resolved by updateHass()
        continue;
      }
      if (val && typeof val === 'object' && val.map_range !== undefined) {
        // Form 3: { map_range: { attribute, input, output, ... } } — omit, resolved by updateHass()
        continue;
      }
      stripped[key] = val;
    }
    return stripped;
  }

  /**
   * Resolve every colour-like string in a config object (`theme:` tokens,
   * computed expressions, var() references) to a concrete value via
   * resolveColor(), so Canvas2D APIs (gradients, fillStyle) receive valid
   * input. Recurses into nested objects and arrays (e.g. `colors: [...]`,
   * `{ colors: { start, text, end } }`); other strings pass through.
   *
   * @private
   * @param {Object} config - Raw effect config
   * @returns {Object} New config object with colour values resolved
   */
  _resolveConfigColors(config) {
    if (!config || typeof config !== 'object') return config;
    const element = this.cardInstance instanceof Element ? this.cardInstance : null;

    const resolveValue = (val) => {
      if (Array.isArray(val)) return val.map(resolveValue);
      if (val && typeof val === 'object') return this._resolveConfigColors(val);
      if (typeof val !== 'string' || isTemplateString(val)) return val;
      if (!(val.startsWith('theme:') || isComputedColor(val) || val.includes('var('))) return val;
      const color = resolveColor(val, { concrete: true, element, fallback: null });
      if (color !== null) return color;
      // Not a colour (a var() font stack, say): materialise its variables only
      return val.includes('var(') ? ColorUtils.resolveCssVariable(val, val, element) : val;
    };

    return Object.fromEntries(Object.entries(config).map(([key, val]) => [key, resolveValue(val)]));
  }

  /**
   * Load effects from preset or direct config
   * Supports both single effect and array of effects for stacking
   *
   * Schema formats:
   * 1. Single effect: { preset: 'grid-basic', config: { ... } }
   * 2. Array of effects: [{ preset: 'grid-basic', config: { ... } }, { preset: 'starfield', config: { ... } }]
   * 3. With zoom wrapper: { preset: 'grid-basic', config: { ... }, zoom: { layers: 5, ... } }
   *
   * @private
   * @returns {boolean} True if at least one effect was loaded
   */
  _loadEffects() {
    const renderer = this.renderer;
    if (!renderer) return false; // created in _init() before effects load
    // Use resolved effectConfigs (set by _resolveConfig)
    const effectConfigs = Array.isArray(this.effectConfigs) ? this.effectConfigs : [this.effectConfigs];

    let loadedEffects = 0;
    // Rebuilt on every load: a refreshColors() rebuild must not stack entries
    this._reactiveEffects = [];

    effectConfigs.forEach((effectConfig, index) => {
      // Skip if disabled
      if (!effectConfig || effectConfig.enabled === false) {
        this.handles[index] ??= null;
        return;
      }

      const presetId = effectConfig.preset;
      if (!presetId) {
        lcardsLog.warn('[BackgroundAnimation] Effect config missing preset', { effectConfig });
        return;
      }
      if (!BACKGROUND_PRESETS[presetId]) {
        lcardsLog.error(`[BackgroundAnimation] Unknown preset: ${presetId}`);
        return;
      }

      let handle = this.handles[index];
      if (!handle || handle.presetId !== presetId) {
        handle = new EffectHandle(index, presetId, this);
        this.handles[index] = handle;
      }

      const built = this._buildEntry(effectConfig, handle);
      if (!built) return;
      built.drawn.forEach((effect) => renderer.addEffect(effect));
      loadedEffects += built.drawn.length;
      handle.attach(built.baseEffects, built.drawn);

      const transition = Number(effectConfig.transition ?? DEFAULT_BINDING_TRANSITION);
      this._reactiveEffects.push({
        effectConfig,
        rawConfig: effectConfig.config || {},
        presetId,
        handle,
        transition: Number.isFinite(transition) ? Math.max(0, transition) : DEFAULT_BINDING_TRANSITION
      });
    });

    if (loadedEffects === 0) {
      lcardsLog.warn('[BackgroundAnimation] No effects were loaded');
      return false;
    }

    lcardsLog.debug(`[BackgroundAnimation] Loaded ${loadedEffects} effect(s)`);
    return true;
  }

  /**
   * Build the effect objects for one `background_animation` entry with the
   * current palette. Presets with a `seed` param get the handle's seed when
   * the config sets none, chosen once per entry, so a rebuild keeps the layout.
   *
   * @private
   * @param {Object} effectConfig - The entry (`{ preset, config, zoom }`)
   * @param {EffectHandle} handle
   * @returns {{ baseEffects: any[], drawn: any[] } | null} the effect instances,
   *   and what the canvas draws (ZoomEffect wrappers, or the effects)
   */
  _buildEntry(effectConfig, handle) {
    let presetId = effectConfig.preset;
    /** @type {any} */
    let preset = BACKGROUND_PRESETS[presetId];
    // WebGL presets draw Canvas2D when the entry asks for canvas, without
    // WebGL, or after a failure: a `fallback` preset, or the preset's own
    // createEffects next to its createWebGLEffects
    const canvasOnly = effectConfig.renderer === 'canvas' || handle.forceFallback || !webglAvailable();
    if (preset?.renderer === 'webgl' && canvasOnly && preset.fallback) {
      lcardsLog.debug(`[BackgroundAnimation] ${presetId}: drawing ${preset.fallback} (Canvas2D)`);
      presetId = preset.fallback;
      preset = BACKGROUND_PRESETS[presetId];
    }
    if (!preset?.createEffects) return null;
    /** @type {(config: any, card: any) => any[]} */
    const create = preset.renderer === 'webgl' && !canvasOnly && preset.createWebGLEffects
      // null: this config has no WebGL version (nebula without volumetric)
      ? (c, card) => preset.createWebGLEffects(c, card) ?? preset.createEffects(c, card)
      : (c, card) => preset.createEffects(c, card);

    lcardsLog.debug('[BackgroundAnimation] Loading preset', { presetId });

    // Pass nested config object to preset factory:
    // 1. Resolve colours (theme tokens, computed functions, CSS vars) to concrete values
    // 2. Strip template-valued keys so constructors receive only concrete
    //    values; updateHass() will push evaluated values on first hass tick.
    const config = this._stripTemplateValues(
      this._resolveConfigColors(effectConfig.config || {})
    );
    if (config.seed === undefined && preset.guide?.params?.some((p) => p.key === 'seed')) {
      config.seed = (handle.seed ??= Math.floor(Math.random() * 1e9));
    }
    // `speed` is a time multiplier every effect honours; presets don't pass it
    const applySpeed = (effects) => {
      if (typeof config.speed === 'number') effects.forEach((e) => { e.speed = Math.max(0, config.speed); });
      return effects;
    };

    /** @type {any[]} */
    let baseEffects = [];
    /** @type {any[]} */
    let drawn = [];
    const zoom = effectConfig.zoom;
    const zoomConfig = (baseEffect, extra = {}) => ({
      baseEffect,
      layers: zoom.layers ?? 4,
      scaleFrom: zoom.scale_from ?? 0.5,
      scaleTo: zoom.scale_to ?? 2.0,
      duration: zoom.duration ?? 15,
      opacityFadeIn: zoom.opacity_fade_in ?? 15,
      opacityFadeOut: zoom.opacity_fade_out ?? 75,
      ...extra
    });

    if (zoom && presetId === 'starfield') {
      // One starfield instance per zoom layer, each with its own seed
      const layers = zoom.layers ?? 4;
      const baseSeed = config.seed;
      lcardsLog.debug('[BackgroundAnimation] Creating starfield layers with unique seeds', { layers, baseSeed });
      for (let layerIndex = 0; layerIndex < layers; layerIndex++) {
        const layerEffects = applySpeed(create({ ...config, seed: baseSeed + layerIndex }, this.cardInstance));
        layerEffects.forEach((baseEffect) => {
          baseEffects.push(baseEffect);
          // Single layer each: we're creating one ZoomEffect per starfield
          drawn.push(new ZoomEffect(zoomConfig(baseEffect, { layers: 1, layerIndex, totalLayers: layers })));
        });
      }
    } else {
      baseEffects = applySpeed(create(config, this.cardInstance));
      // Standard zoom: single instance, multiple renders
      drawn = zoom ? baseEffects.map((baseEffect) => new ZoomEffect(zoomConfig(baseEffect))) : baseEffects;
    }
    // A fixed `speed` runs the zoom cycle faster too, as an animated one does (effect-handle.js)
    if (zoom && typeof config.speed === 'number') {
      for (const d of drawn) if (d.baseEffect) d.speed = Math.max(0, config.speed);
    }
    // three.js scenes: redraw when ready (held reduced-motion frame), fall back on failure
    for (const effect of baseEffects) {
      if ('host' in effect) {
        effect.host = {
          requestFrame: () => this.renderer?.requestFrame(),
          fail: () => this._fallbackEntry(handle)
        };
      }
    }
    return { baseEffects, drawn };
  }

  /**
   * Re-evaluate any template strings in stored effect configs and hot-update
   * the running effect instances via updateConfig().  Call this from the card's
   * _handleHassUpdate so reactive params (fill_pct, wave_speed, scroll_speed_x,
   * etc.) track entity state / attributes in real time.
   *
   * Supports the same two forms as _resolveShapeTextureConfig():
   *   - Direct template string:  scroll_speed_x: "[[[return entity.attributes.brightness / 2.55]]]"
   *   - Object form:             fill_pct: { template: "[[[ ... ]]]", default: 50 }
   *
   * @param {Object} hass
   * @param {Object|null} entity - Primary card entity state object
   * @param {Object} cardConfig  - Full card config (for variables, etc.)
   */
  updateHass(hass, entity, cardConfig) {
    if (!this._reactiveEffects || this._reactiveEffects.length === 0) return;

    const evalContext = {
      entity,
      config: cardConfig,
      hass,
      variables: cardConfig?.variables || {},
    };
    const templateEvaluator = new LCARdSCardTemplateEvaluator(evalContext);

    for (const { rawConfig, presetId, handle, transition } of this._reactiveEffects) {
      const resolvedConfig = {};
      let hasTemplates = false;

      for (const [key, val] of Object.entries(rawConfig)) {
        if (typeof val === 'string' && (TemplateDetector.hasJavaScript(val) || TemplateDetector.hasTokens(val))) {
          // Form 1: direct template string
          try {
            const raw = templateEvaluator.evaluate(val);
            // Coerce to number when the result looks numeric (e.g. fill_pct, speeds)
            const num = Number(String(raw).trim());
            resolvedConfig[key] = (String(raw).trim() !== '' && Number.isFinite(num)) ? num : raw;
          } catch (e) {
            lcardsLog.warn(`[BackgroundAnimation] Template eval failed for ${presetId}.config.${key}:`, e);
            resolvedConfig[key] = val;
          }
          hasTemplates = true;
        } else if (val && typeof val === 'object' && val.template !== undefined &&
                   (TemplateDetector.hasJavaScript(val.template) || TemplateDetector.hasTokens(val.template))) {
          // Form 2: { template: "...", default: X }
          let evaluated = val.default ?? 0;
          try {
            const raw = templateEvaluator.evaluate(val.template);
            const num = parseFloat(raw);
            evaluated = Number.isFinite(num) ? num : (val.default ?? 0);
          } catch (e) {
            lcardsLog.warn(`[BackgroundAnimation] Template eval failed for ${presetId}.config.${key}.template:`, e);
          }
          resolvedConfig[key] = evaluated;
          hasTemplates = true;
        } else if (val && typeof val === 'object' && val.map_range !== undefined) {
          // Form 3: { map_range: { entity?, attribute?, input, output } }
          const resolved = this._resolveMapRange(val, hass, entity, cardConfig);
          if (resolved !== undefined) {
            resolvedConfig[key] = resolved;
          }
          hasTemplates = true;
        }
      }

      if (hasTemplates) {
        // Resolve any CSS var() tokens that may have been produced by the templates
        const finalConfig = this._resolveConfigColors(resolvedConfig);
        /** @type {Record<string, any>} */
        const rest = {};
        for (const [key, value] of Object.entries(finalConfig)) {
          if (!this._applyBoundValue(handle, key, value, transition)) rest[key] = value;
        }
        if (Object.keys(rest).length > 0) this._applyViaUpdateConfig(handle, presetId, rest);
      }
    }
  }

  /**
   * Apply one entity-bound value to a declared (animatable) key: glide to it
   * over `transition` ms, or snap on the first value, with `transition: 0`,
   * under reduced motion, or when nothing is attached yet.
   *
   * @private
   * @param {EffectHandle} handle
   * @param {string} key
   * @param {any} value
   * @param {number} transition
   * @returns {boolean} false when the key is not animatable with this value
   *   (the caller falls back to updateConfig())
   */
  _applyBoundValue(handle, key, value, transition) {
    if (!handle.has(key)) return false;
    const current = handle.getProp(key);
    const isNumber = typeof value === 'number' && Number.isFinite(value);
    const isColor = typeof value === 'string' && typeof current === 'string';
    if (!isNumber && !isColor) return false;

    const bound = (/** @type {any} */ (handle)._bound ??= {});
    const glides = (/** @type {any} */ (handle)._glides ??= {});
    const first = !(key in bound);
    if (!first && bound[key] === value) return true;
    bound[key] = value;

    glides[key]?.cancel();
    glides[key] = null;
    if (first || transition <= 0 || prefersReducedMotion() || handle.effects.length === 0) {
      handle.setProp(key, value);
      return true;
    }
    glides[key] = animate(handle, { [key]: value, duration: transition, ease: 'outQuad' });
    return true;
  }

  /**
   * Push bound values an effect does not declare as animatable through its
   * updateConfig(), with camelCase copies for effects that read camelCase
   * fields (contour-field). Keys no path can apply are logged once.
   *
   * @private
   * @param {EffectHandle} handle
   * @param {string} presetId
   * @param {Record<string, any>} values
   */
  _applyViaUpdateConfig(handle, presetId, values) {
    const effects = handle.effects;
    const withUpdate = effects.filter((e) => typeof e.updateConfig === 'function');
    if (withUpdate.length > 0) {
      const cfg = { ...values };
      for (const [key, value] of Object.entries(values)) cfg[camelKey(key)] ??= value;
      withUpdate.forEach((e) => e.updateConfig(cfg));
      lcardsLog.trace(`[BackgroundAnimation] updateHass pushed config to ${presetId} effect`, values);
      return;
    }
    for (const key of Object.keys(values)) {
      const id = `${presetId}.${key}`;
      if (this._warnedKeys.has(id)) continue;
      this._warnedKeys.add(id);
      lcardsLog.warn(`[BackgroundAnimation] ${presetId}: "${key}" cannot follow an entity (it is fixed when the effect is created). Bindable keys: ${handle.keys().join(', ')}`);
    }
  }

  /**
   * The handles an animation targets: every live entry, or the one at `index`.
   *
   * @param {number|string|null} [index] - Entry index in `background_animation`
   * @returns {EffectHandle[]}
   */
  getHandles(index) {
    if (index === undefined || index === null || index === '') {
      return /** @type {EffectHandle[]} */ (this.handles.filter((h) => h && h.effects.length > 0));
    }
    const h = this.handles[Number(index)];
    return h && h.effects.length > 0 ? [h] : [];
  }

  /**
   * Stop the animation loop without destroying the renderer, canvas, or effects.
   *
   * Call this when the card's custom element is temporarily removed from the live
   * DOM (e.g., HA view switch).  The canvas element and all effect state survive
   * inside the shadow DOM so that resume() can restart exactly where it left off.
   *
   * Do NOT call this for permanent card removal — call destroy() instead.
   */
  suspend() {
    if (this.renderer) {
      this.renderer.stop();
    }
    // three.js scenes give the shared WebGL context back while the card is away
    for (const handle of this.handles) handle?.effects.forEach((e) => e.releaseGPU?.());
    lcardsLog.debug('[BackgroundAnimation] Suspended — card disconnected from DOM');
  }

  /**
   * Restart the animation loop after a suspend() caused by a disconnect/reconnect
   * cycle (e.g., HA view switch).
   *
   * Re-attaches the PerformanceMonitor subscription and visibilitychange handler
   * via Canvas2DRenderer.start(), which is a no-op if the renderer is already running.
   */
  resume() {
    if (!this.renderer) return;
    this.renderer.start();
    lcardsLog.debug('[BackgroundAnimation] Resumed — card reconnected to DOM');
  }

  /**
   * The canvas buffer size for the container's current size, minus the inset.
   * @private
   * @returns {{ width: number, height: number }}
   */
  _canvasSize() {
    const inset = this.inset;
    return {
      width: Math.max(1, (this.container.offsetWidth || 400) - inset.left - inset.right),
      height: Math.max(1, (this.container.offsetHeight || 300) - inset.top - inset.bottom)
    };
  }

  /**
   * Handle container resize — accounts for current inset values.
   */
  handleResize() {
    if (!this.canvas || !this.renderer) {
      return;
    }

    const inset  = this.inset;
    const { width, height } = this._canvasSize();

    this.renderer.resize(width, height);

    this.canvas.style.top    = `${inset.top}px`;
    this.canvas.style.left   = `${inset.left}px`;
    this.canvas.style.width  = `calc(100% - ${inset.left + inset.right}px)`;
    this.canvas.style.height = `calc(100% - ${inset.top  + inset.bottom}px)`;

    lcardsLog.debug('[BackgroundAnimation] Resized', { width, height, inset });
  }

  /**
   * Follow a palette change (alert mode) without resetting any motion. Each
   * entry is built again with the new palette and the live effects copy
   * their colours from that fresh copy (`recolorFrom()`), so star layouts,
   * scroll offsets and zoom cycles carry on. An entry whose effects cannot
   * (they bake colours into images) is swapped for the fresh copy in place,
   * keeping its seed, clocks and animated values.
   *
   * @param {Object} [hass] - Pushed again so templated params are re-applied
   * @param {Object} [entity]
   * @param {Object} [cardConfig]
   * @returns {boolean} True when the background was refreshed
   */
  refreshColors(hass, entity, cardConfig) {
    if (!this.canvas || !this.renderer) return false;
    for (const entry of this._reactiveEffects) this._recolorEntry(entry);
    if (hass) {
      // Bound colours resolve against the new palette on the next push
      for (const { handle } of this._reactiveEffects) {
        const bound = /** @type {any} */ (handle)._bound;
        if (bound) for (const key of Object.keys(bound)) if (typeof bound[key] === 'string') delete bound[key];
      }
      this.updateHass(hass, entity, cardConfig);
    }
    this.renderer.requestFrame();
    return true;
  }

  /**
   * @private
   * @param {{ effectConfig: Object, handle: EffectHandle }} entry
   */
  _recolorEntry({ effectConfig, handle }) {
    const renderer = this.renderer;
    if (!renderer || handle.effects.length === 0) return;
    const fresh = this._buildEntry(effectConfig, handle);
    if (!fresh) return;
    const live = handle.effects;
    const inPlace = live.length === fresh.baseEffects.length &&
      live.every((e, i) => typeof e.recolorFrom === 'function' && e.recolorFrom(fresh.baseEffects[i]) === true);
    if (inPlace) {
      fresh.drawn.forEach((d) => d.destroy());
      lcardsLog.debug(`[BackgroundAnimation] Recoloured ${handle.presetId} in place`);
      return;
    }
    this._swapEntry(handle, fresh);
    lcardsLog.debug(`[BackgroundAnimation] Rebuilt ${handle.presetId} for the new palette`);
  }

  /**
   * Put freshly built effects in place of an entry's live ones, at the same
   * place in the stack, carrying the clocks so the motion does not restart.
   * @private
   * @param {EffectHandle} handle
   * @param {{ baseEffects: any[], drawn: any[] }} fresh
   */
  _swapEntry(handle, fresh) {
    const renderer = this.renderer;
    if (!renderer) return;
    fresh.drawn.forEach((d, i) => carryClock(handle.drawn[i], d));
    if (fresh.drawn !== fresh.baseEffects) fresh.baseEffects.forEach((e, i) => carryClock(handle.effects[i], e));
    renderer.replaceEffects(handle.drawn, fresh.drawn);
    handle.attach(fresh.baseEffects, fresh.drawn);
  }

  /**
   * A three.js scene could not start or lost its context: draw the preset's
   * Canvas2D fallback in its place from now on.
   * @private
   * @param {EffectHandle} handle
   */
  _fallbackEntry(handle) {
    if (handle.forceFallback) return;
    handle.forceFallback = true;
    // Not inside the draw loop that reported it
    queueMicrotask(() => {
      const entry = this._reactiveEffects.find((e) => e.handle === handle);
      if (!entry || !this.renderer || handle.effects.length === 0) return;
      const fresh = this._buildEntry(entry.effectConfig, handle);
      if (fresh) this._swapEntry(handle, fresh);
      lcardsLog.info(`[BackgroundAnimation] ${handle.presetId}: drawing its Canvas2D fallback`);
    });
  }

  /**
   * Permanent removal: also stops whatever animates the handles.
   */
  destroy() {
    this._teardown();
    for (const handle of this.handles) {
      if (!handle) continue;
      Object.values(/** @type {any} */ (handle)._glides ?? {}).forEach((g) => g?.cancel());
      utils.remove(handle);
      handle.kill();
    }
    this.handles = [];
  }

  /**
   * Remove the canvas and effects but keep the handles (a rebuild re-attaches).
   * @private
   */
  _teardown() {
    this.handles.forEach((h) => h?.detach());
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame);
    this._resizeFrame = 0;

    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }

    lcardsLog.debug('[BackgroundAnimation] Destroyed');
  }
}
