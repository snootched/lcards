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
import { LCARdSCardTemplateEvaluator } from '../../templates/LCARdSCardTemplateEvaluator.js';
import { TemplateDetector } from '../../templates/TemplateDetector.js';
import { linearMap } from '../../../utils/linearMap.js';

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
    this.renderer = null;
    this.canvas = null;
    /** @type {{ top: number, right: number, bottom: number, left: number }} */
    this.inset = { top: 0, right: 0, bottom: 0, left: 0 };
    /** @type {Array} */
    this.effectConfigs = [];
    /** @type {Object|string|null} */
    this._rawInset = null;
    /**
     * Pairs of { rawConfig, effects[] } for effects whose config may contain
     * templates — populated during _loadEffects() so updateHass() can
     * re-evaluate and push hot-updates via effect.updateConfig().
     * @type {Array<{ rawConfig: Object, presetId: string, effects: Array }>}
     */
    this._reactiveEffects = [];
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
      if (typeof IntersectionObserver !== 'undefined') {
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
   *     entity_id: light.tv      # optional — defaults to card's config.entity
   *     attribute: brightness    # optional — defaults to entity state
   *     input:  [0, 255]         # input range
   *     output: [-200, 200]      # output range (numbers or hex color strings)
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
    const entityId = cfg.entity_id || cardConfig?.entity || null;
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
    const [outMin, outMax] = cfg.output;
    const clamp = cfg.clamp !== false; // default true

    if (typeof outMin === 'number' && typeof outMax === 'number') {
      return linearMap(numVal, inMin, inMax, outMin, outMax, clamp);
    }

    // Color string interpolation not needed for animation params but keep consistent
    lcardsLog.warn('[BackgroundAnimation] map_range: "output" must be [number, number]', cfg);
    return undefined;
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
   * Resolve any CSS custom property strings (var(--token)) and computed colour
   * expressions (lighten/darken/alpha/saturate/desaturate) in a config object to
   * concrete colour values so Canvas2D APIs (gradients, fillStyle) receive valid
   * input.  Recurses into nested plain objects so sub-configs like
   * `{ colors: { start, text, end } }` are also fully resolved.
   *
   * @private
   * @param {Object} config - Raw effect config
   * @returns {Object} New config object with var() strings and computed expressions resolved
   */
  _resolveConfigColors(config) {
    if (!config || typeof config !== 'object') return config;

    const resolved = { ...config };
    for (const [key, val] of Object.entries(resolved)) {
      // Recurse into nested plain objects (e.g. config.colors = { start, text, end })
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        resolved[key] = this._resolveConfigColors(val);
        continue;
      }

      // Resolve string elements in arrays (e.g. colors: ['darken(var(--x), 0.3)', '#ff0'])
      if (Array.isArray(val)) {
        resolved[key] = val.map(item => (typeof item === 'string' ? this._resolveConfigColors({ _: item })._ : item));
        continue;
      }

      if (typeof val !== 'string') continue;

      // Plain CSS variable — resolve directly
      if (val.includes('var(') && !BackgroundAnimationRenderer._COMPUTED_COLOR_RE.test(val)) {
        resolved[key] = ColorUtils.resolveCssVariable(val, val);
        continue;
      }

      // Computed color function: lighten/darken/alpha/etc. — resolve any inner var() first,
      // then evaluate the function against the concrete colour value.
      // e.g. "lighten(var(--lcars-green), 0.5)" → ColorUtils.lighten('#23c45e', 0.5)
      if (BackgroundAnimationRenderer._COMPUTED_COLOR_RE.test(val)) {
        const concreteExpr = val.replace(/var\([^)]+\)/g, match =>
          /** @type {string} */ (ColorUtils.resolveCssVariable(match, match))
        );
        const m = concreteExpr.match(/^(\w+)\((.+),\s*([\d.]+)\s*\)$/);
        if (m) {
          const [, fn, colorArg, numArg] = m;
          const num = parseFloat(numArg);
          switch (fn) {
            case 'lighten':    resolved[key] = ColorUtils.lighten(colorArg.trim(), num); break;
            case 'darken':     resolved[key] = ColorUtils.darken(colorArg.trim(), num); break;
            case 'alpha':      resolved[key] = ColorUtils.alpha(colorArg.trim(), num); break;
            case 'saturate':   resolved[key] = ColorUtils.saturate?.(colorArg.trim(), num) ?? val; break;
            case 'desaturate': resolved[key] = ColorUtils.desaturate?.(colorArg.trim(), num) ?? val; break;
            default:           resolved[key] = val;
          }
        } else {
          resolved[key] = val;
        }
      }
    }
    return resolved;
  }

  // Regex matching the supported computed colour functions
  static _COMPUTED_COLOR_RE = /^(lighten|darken|alpha|saturate|desaturate|mix)\s*\(/;

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
    // Use resolved effectConfigs (set by _resolveConfig)
    const effectConfigs = Array.isArray(this.effectConfigs) ? this.effectConfigs : [this.effectConfigs];

    let loadedEffects = 0;

    for (const effectConfig of effectConfigs) {
      // Skip if disabled
      if (effectConfig.enabled === false) {
        continue;
      }

      const presetId = effectConfig.preset;

      // If preset specified, load it
      if (presetId) {
        const preset = BACKGROUND_PRESETS[presetId];
        if (!preset) {
          lcardsLog.error(`[BackgroundAnimation] Unknown preset: ${presetId}`);
          continue;
        }

        lcardsLog.debug('[BackgroundAnimation] Loading preset', { presetId });

        // Preset will provide effect factory functions
        if (preset.createEffects) {
          // Pass nested config object to preset factory:
          // 1. Resolve theme tokens and computed colour functions (lighten/darken/alpha/etc.)
          // 2. Resolve remaining CSS var() strings to concrete colour values
          // 3. Strip template-valued keys so constructors receive only concrete
          //    values; updateHass() will push evaluated values on first hass tick.
          const themeManager = this.cardInstance?._singletons?.themeManager
            ?? window.lcards?.core?.themeManager
            ?? null;
          const rawEffectConfig = effectConfig.config || {};
          // Resolve theme: token strings to concrete values using themeManager.getToken()
          // (avoids resolveThemeTokensRecursive which produces color-mix() CSS that Canvas2D can't use)
          const themeResolved = themeManager
            ? Object.fromEntries(Object.entries(rawEffectConfig).map(([k, v]) => [
                k,
                (typeof v === 'string' && v.startsWith('theme:'))
                  ? (themeManager.getToken(v.slice(6)) ?? v)
                  : v
              ]))
            : rawEffectConfig;
          const config = this._stripTemplateValues(
            this._resolveConfigColors(themeResolved)
          );

          // Check if zoom wrapper should be applied
          if (effectConfig.zoom) {
            lcardsLog.debug('[BackgroundAnimation] Applying zoom wrapper to preset', { presetId });

            // Special handling for starfield: create multiple instances with unique seeds
            if (presetId === 'starfield') {
              const layers = effectConfig.zoom.layers ?? 4;
              const baseSeed = config.seed ?? Math.floor(Math.random() * 1e9);

              lcardsLog.debug('[BackgroundAnimation] Creating starfield layers with unique seeds', {
                layers,
                baseSeed
              });

              // Create one starfield instance per zoom layer with incremented seeds
              for (let layerIndex = 0; layerIndex < layers; layerIndex++) {
                // Create unique config for this layer
                const layerConfig = {
                  ...config,
                  seed: baseSeed + layerIndex // Increment seed for each layer
                };

                // Create effect instance for this layer
                const layerEffects = preset.createEffects(layerConfig, this.cardInstance);

                // Wrap with zoom effect configured for this specific layer
                layerEffects.forEach(baseEffect => {
                  const zoomConfig = {
                    baseEffect: baseEffect,
                    layers: 1, // Single layer - we're creating multiple ZoomEffects
                    layerIndex: layerIndex, // Pass layer index for offset
                    totalLayers: layers,
                    scaleFrom: effectConfig.zoom.scale_from ?? 0.5,
                    scaleTo: effectConfig.zoom.scale_to ?? 2.0,
                    duration: effectConfig.zoom.duration ?? 15,
                    opacityFadeIn: effectConfig.zoom.opacity_fade_in ?? 15,
                    opacityFadeOut: effectConfig.zoom.opacity_fade_out ?? 75
                  };

                  const zoomEffect = new ZoomEffect(zoomConfig);
                  this.renderer.addEffect(zoomEffect);
                  loadedEffects++;
                });
              }
            } else {
              // Standard zoom handling for other effects (single instance, multiple renders)
              const effects = preset.createEffects(config, this.cardInstance);
              this._reactiveEffects.push({ rawConfig: effectConfig.config || {}, presetId, effects });

              effects.forEach(baseEffect => {
                const zoomConfig = {
                  baseEffect: baseEffect,
                  layers: effectConfig.zoom.layers ?? 4,
                  scaleFrom: effectConfig.zoom.scale_from ?? 0.5,
                  scaleTo: effectConfig.zoom.scale_to ?? 2.0,
                  duration: effectConfig.zoom.duration ?? 15,
                  opacityFadeIn: effectConfig.zoom.opacity_fade_in ?? 15,
                  opacityFadeOut: effectConfig.zoom.opacity_fade_out ?? 75
                };

                const zoomEffect = new ZoomEffect(zoomConfig);
                this.renderer.addEffect(zoomEffect);
                loadedEffects++;
              });
            }
          } else {
            // No zoom - add effects directly
            const effects = preset.createEffects(config, this.cardInstance);
            this._reactiveEffects.push({ rawConfig: effectConfig.config || {}, presetId, effects });
            effects.forEach(effect => this.renderer.addEffect(effect));
            loadedEffects += effects.length;
          }
        }
      } else {
        lcardsLog.warn('[BackgroundAnimation] Effect config missing preset', { effectConfig });
      }
    }

    if (loadedEffects === 0) {
      lcardsLog.warn('[BackgroundAnimation] No effects were loaded');
      return false;
    }

    lcardsLog.debug(`[BackgroundAnimation] Loaded ${loadedEffects} effect(s)`);
    return true;
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

    for (const { rawConfig, presetId, effects } of this._reactiveEffects) {
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
          // Form 3: { map_range: { entity_id?, attribute?, input, output } }
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
        for (const effect of effects) {
          if (typeof effect.updateConfig === 'function') {
            effect.updateConfig(finalConfig);
            lcardsLog.trace(`[BackgroundAnimation] updateHass pushed config to ${presetId} effect`, finalConfig);
          }
        }
      }
    }
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
   * Handle container resize — accounts for current inset values.
   */
  handleResize() {
    if (!this.canvas || !this.renderer) {
      return;
    }

    const inset  = this.inset;
    const width  = Math.max(1, (this.container.offsetWidth  || 400) - inset.left - inset.right);
    const height = Math.max(1, (this.container.offsetHeight || 300) - inset.top  - inset.bottom);

    this.renderer.resize(width, height);

    this.canvas.style.top    = `${inset.top}px`;
    this.canvas.style.left   = `${inset.left}px`;
    this.canvas.style.width  = `calc(100% - ${inset.left + inset.right}px)`;
    this.canvas.style.height = `calc(100% - ${inset.top  + inset.bottom}px)`;

    lcardsLog.debug('[BackgroundAnimation] Resized', { width, height, inset });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }

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
