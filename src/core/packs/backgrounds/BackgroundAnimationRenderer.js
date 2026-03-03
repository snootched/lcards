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
    if (Array.isArray(config)) {
      this.inset = { top: 0, right: 0, bottom: 0, left: 0 };
      this._rawInset = null;
      this.effectConfigs = config;
    } else if (config && typeof config === 'object' && 'effects' in config) {
      this.effectConfigs = config.effects ?? [];
      this._rawInset = config.inset ?? null;
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

      // Create renderer
      this.renderer = new Canvas2DRenderer(this.canvas);

      // Load effects from preset or config
      const success = this._loadEffects();
      if (!success) {
        return false;
      }

      // Start animation
      this.renderer.start();

      lcardsLog.info('[BackgroundAnimation] Renderer initialized and started');
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
          // Pass nested config object to preset factory
          const config = effectConfig.config || {};

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

    lcardsLog.info(`[BackgroundAnimation] Loaded ${loadedEffects} effect(s)`);
    return true;
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
