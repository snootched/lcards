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
  }

  /**
   * Initialize background renderer with effects from preset/config
   * @returns {boolean} True if initialization succeeded
   */
  init() {
    try {
      // Create canvas element
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.container.offsetWidth || 400;
      this.canvas.height = this.container.offsetHeight || 300;
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
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

    const width = this.container.offsetWidth || 400;
    const height = this.container.offsetHeight || 300;

    this.renderer.resize(width, height);

    lcardsLog.debug('[BackgroundAnimation] Resized', { width, height });
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
