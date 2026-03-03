/**
 * Background Animation Coordinator
 * Manages Canvas2D renderer and effect composition
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
  constructor(container, config, cardInstance = null) {
    this.container = container;
    this.config = config;
    this.cardInstance = cardInstance; // Reference to card for theme token resolution
    this.renderer = null;
    this.canvas = null;
    this.inset = this._resolveInset(config);
  }

  /**
   * Resolve inset from config.
   * Reads `inset` from the first non-array item in the normalised config array,
   * or from a root-level `inset` if config is a plain object.
   * All sides default to 0.
   * @param {Object|Array} config - Raw background_animation config
   * @returns {{ top: number, right: number, bottom: number, left: number }}
   * @private
   */
  _resolveInset(config) {
    let raw = null;
    if (Array.isArray(config)) {
      const first = config.find(item => item && !Array.isArray(item));
      raw = first?.inset ?? null;
    } else if (config && typeof config === 'object') {
      raw = config.inset ?? null;
    }

    if (!raw || typeof raw !== 'object') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    return {
      top:    Number(raw.top    ?? 0),
      right:  Number(raw.right  ?? 0),
      bottom: Number(raw.bottom ?? 0),
      left:   Number(raw.left   ?? 0)
    };
  }

  /**
   * Initialize background renderer with effects from preset/config
   * @returns {boolean} True if initialization succeeded
   */
  init() {
    try {
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
    // Normalize config to array format
    const effectConfigs = Array.isArray(this.config) ? this.config : [this.config];

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
   * Handle window resize
   */
  handleResize() {
    if (!this.canvas || !this.renderer) {
      return;
    }

    const width  = Math.max(1, (this.container.offsetWidth  || 400) - this.inset.left - this.inset.right);
    const height = Math.max(1, (this.container.offsetHeight || 300) - this.inset.top  - this.inset.bottom);

    this.renderer.resize(width, height);

    // Keep CSS position in sync with current inset
    this.canvas.style.top    = `${this.inset.top}px`;
    this.canvas.style.left   = `${this.inset.left}px`;
    this.canvas.style.width  = `calc(100% - ${this.inset.left + this.inset.right}px)`;
    this.canvas.style.height = `calc(100% - ${this.inset.top  + this.inset.bottom}px)`;

    lcardsLog.debug('[BackgroundAnimation] Resized', { width, height });
  }

  /**
   * Update the canvas inset and re-apply dimensions.
   * Used by cards that need to adjust the inset dynamically (e.g. elbow cards
   * when bar geometry changes due to theme entity updates).
   * @param {{ top: number, right: number, bottom: number, left: number }} inset
   */
  updateInset(inset) {
    this.inset = {
      top:    Number(inset.top    ?? 0),
      right:  Number(inset.right  ?? 0),
      bottom: Number(inset.bottom ?? 0),
      left:   Number(inset.left   ?? 0)
    };
    this.handleResize();
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
