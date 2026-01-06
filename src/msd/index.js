import { initMsdPipeline } from './pipeline/PipelineCore.js';
import { processMsdConfig } from './pipeline/ConfigProcessor.js';
import { buildCardModel } from './model/CardModel.js';
import { MsdInstanceManager } from './pipeline/MsdInstanceManager.js';
import { mergePacks } from '../core/packs/mergePacks.js';

import "./hud/MsdHudUtilities.js";

// Main exports
export { initMsdPipeline, processMsdConfig };

// Debug exposure - IMMEDIATE execution at module load time
(function attachDebug() {
  if (typeof window === 'undefined') return;

  // Safely create nested namespace structure
  window.lcards = window.lcards || {};
  window.lcards.debug = window.lcards.debug || {};
  window.lcards.debug.msd = window.lcards.debug.msd || {};

  // CRITICAL: Attach MsdInstanceManager FIRST before anything else
  window.lcards.debug.msd.MsdInstanceManager = MsdInstanceManager;

  // NEW: Multi-instance support - Map of card instances by GUID
  window.lcards.debug.msd.instances = window.lcards.debug.msd.instances || new Map();

  console.log('[MSD index.js] ✅ MsdInstanceManager attached to window.lcards.debug.msd:', !!window.lcards.debug.msd.MsdInstanceManager);
  console.log('[MSD index.js] ✅ Multi-instance map initialized');

  // CRITICAL FIX: Single Object.assign to preserve MsdInstanceManager
  // Previous bug: Two Object.assign calls caused the second to overwrite the first
  Object.assign(window.lcards.debug.msd, {
    // Core functions (preserve from first Object.assign)
    mergePacks,
    buildCardModel,
    initMsdPipeline,

    // Authoritative pipeline instance
    pipelineInstance: null,

    // Initialize MSD pipeline (overrides imported function with enhanced version)
    async initMsdPipeline(mergedConfig, mount, hass) {
      try {
        const pipelineApi = await initMsdPipeline(mergedConfig, mount, hass);

        // Set the authoritative pipelineInstance property
        this.pipelineInstance = pipelineApi;

        return pipelineApi;
      } catch (error) {
        console.error('[MSD Debug] Pipeline initialization failed:', error);
        throw error;
      }
    },

    // ✅ NEW: Enhanced provenance debug helpers

    /**
     * Get theme provenance information
     * Shows which theme is active, where it came from, and what was requested
     *
     * @returns {Object|null} Theme provenance data
     */
    getThemeProvenance() {
      const config = this.pipelineInstance?.config;
      if (!config) {
        console.warn('[MSD Debug] No pipeline instance available');
        return null;
      }

      const provenance = config.__provenance?.theme;
      if (!provenance) {
        console.warn('[MSD Debug] No theme provenance available');
        return null;
      }

      console.group('🎨 Theme Provenance');
      console.log('Active Theme:', provenance.active_theme);
      console.log('Requested Theme:', provenance.requested_theme || '(none - using default)');
      console.log('Default Theme:', provenance.default_theme);
      console.log('Source Pack:', provenance.source_pack);
      console.log('Fallback Used:', provenance.fallback_used);
      console.log('Available Themes:', provenance.themes_available);
      console.log('Theme Pack Loaded:', provenance.theme_pack_loaded);
      console.groupEnd();

      return provenance;
    },

    /**
     * Get pack loading information
     * Shows which packs were loaded and their capabilities
     *
     * @returns {Object|null} Pack information
     */
    getPackInfo() {
      const config = this.pipelineInstance?.config;
      if (!config) {
        console.warn('[MSD Debug] No pipeline instance available');
        return null;
      }

      const packInfo = config.__provenance?.packs;
      if (!packInfo) {
        console.warn('[MSD Debug] No pack provenance available');
        return null;
      }

      console.group('📦 Pack Information');
      console.log('Builtin Packs:', packInfo.builtin);
      console.log('External Packs:', packInfo.external);
      if (packInfo.failed && packInfo.failed.length > 0) {
        console.warn('Failed Packs:', packInfo.failed);
      }
      console.groupEnd();

      return packInfo;
    },

    /**
     * Get style resolution provenance for an overlay
     * (Will be populated by renderers in future update)
     *
     * @param {string} overlayId - Overlay ID to get style provenance for
     * @returns {Object|null} Style resolution provenance
     */
    getStyleProvenance(overlayId) {
      const config = this.pipelineInstance?.config;
      if (!config) {
        console.warn('[MSD Debug] No pipeline instance available');
        return null;
      }

      const styleRes = config.__provenance?.style_resolution?.[overlayId];
      if (!styleRes) {
        console.warn(`[MSD Debug] No style provenance for overlay: ${overlayId}`);
        console.log('Available overlays:', Object.keys(config.__provenance?.style_resolution || {}));
        return null;
      }

      console.group(`🎨 Style Provenance: ${overlayId}`);
      console.log('Component Type:', styleRes.componentType);
      console.log('Theme Defaults Used:', styleRes.theme_defaults);
      console.log('Preset Applied:', styleRes.preset_applied || '(none)');
      console.log('Preset Properties:', styleRes.preset_properties || []);
      console.log('User Overrides:', styleRes.user_overrides || []);
      console.log('Token Resolutions:', styleRes.token_resolutions || {});
      console.groupEnd();

      return styleRes;
    },

    /**
     * Get renderer information for an overlay
     * (Will be populated by renderers in future update)
     *
     * @param {string} overlayId - Overlay ID to get renderer info for
     * @returns {Object|null} Renderer information
     */
    getRendererInfo(overlayId) {
      const config = this.pipelineInstance?.config;
      if (!config) {
        console.warn('[MSD Debug] No pipeline instance available');
        return null;
      }

      const rendererInfo = config.__provenance?.renderers?.[overlayId];
      if (!rendererInfo) {
        console.warn(`[MSD Debug] No renderer info for overlay: ${overlayId}`);
        console.log('Available overlays:', Object.keys(config.__provenance?.renderers || {}));
        return null;
      }

      console.group(`🔧 Renderer Info: ${overlayId}`);
      console.log('Renderer:', rendererInfo.renderer);
      console.log('Extends BaseRenderer:', rendererInfo.extends_base);
      console.log('ThemeManager Resolved:', rendererInfo.theme_manager_resolved);
      console.log('Defaults Used:', rendererInfo.defaults_used);
      console.groupEnd();

      return rendererInfo;
    },

    /**
     * Get complete provenance for an overlay
     * Shows all tracked information for a single overlay
     *
     * @param {string} overlayId - Overlay ID to get complete provenance for
     * @returns {Object|null} Complete provenance data
     */
    getOverlayProvenance(overlayId) {
      const config = this.pipelineInstance?.config;
      if (!config) {
        console.warn('[MSD Debug] No pipeline instance available');
        return null;
      }

      console.group(`📊 Complete Provenance: ${overlayId}`);

      // Overlay definition provenance
      const overlayProv = config.__provenance?.overlays?.[overlayId];
      if (overlayProv) {
        console.log('Origin Pack:', overlayProv.origin_pack);
        console.log('Overridden:', overlayProv.overridden);
        if (overlayProv.overridden) {
          console.log('Override Layer:', overlayProv.override_layer);
        }
      }

      // Style provenance
      const styleProv = config.__provenance?.style_resolution?.[overlayId];
      if (styleProv) {
        console.log('Style Resolution:', styleProv);
      }

      // Renderer provenance
      const rendererProv = config.__provenance?.renderers?.[overlayId];
      if (rendererProv) {
        console.log('Renderer Info:', rendererProv);
      }

      console.groupEnd();

      return {
        overlay: overlayProv,
        style: styleProv,
        renderer: rendererProv
      };
    },

    /**
     * List all tracked overlays with provenance
     *
     * @returns {Array<string>|null} Array of overlay IDs
     */
    listTrackedOverlays() {
      const config = this.pipelineInstance?.config;
      if (!config) {
        console.warn('[MSD Debug] No pipeline instance available');
        return null;
      }

      const overlayIds = Object.keys(config.__provenance?.overlays || {});

      console.group(`📋 Tracked Overlays (${overlayIds.length})`);
      overlayIds.forEach(id => {
        const prov = config.__provenance.overlays[id];
        console.log(`${id}:`, {
          pack: prov.origin_pack,
          overridden: prov.overridden,
          hasStyle: !!config.__provenance.style_resolution?.[id],
          hasRenderer: !!config.__provenance.renderers?.[id]
        });
      });
      console.groupEnd();

      return overlayIds;
    },

    // NEW: Multi-instance support methods

    /**
     * Register a new MSD card instance
     * @param {string} guid - Card instance GUID
     * @param {Object} cardInstance - Card element reference
     * @param {Object} pipelineInstance - Pipeline API reference
     */
    registerInstance(guid, cardInstance, pipelineInstance) {
      if (!guid) {
        console.warn('[MSD Debug] Cannot register instance without GUID');
        return;
      }

      window.lcards.debug.msd.instances.set(guid, {
        guid,
        cardInstance,
        pipelineInstance,
        registeredAt: new Date().toISOString()
      });

      console.log(`[MSD Debug] ✅ Registered instance: ${guid}`);
      console.log(`[MSD Debug] Total instances: ${window.lcards.debug.msd.instances.size}`);
    },

    /**
     * Unregister an MSD card instance
     * @param {string} guid - Card instance GUID
     */
    unregisterInstance(guid) {
      const removed = window.lcards.debug.msd.instances.delete(guid);
      if (removed) {
        console.log(`[MSD Debug] 🗑️ Unregistered instance: ${guid}`);
        console.log(`[MSD Debug] Remaining instances: ${window.lcards.debug.msd.instances.size}`);
      }
    },

    /**
     * Get instance data by GUID
     * @param {string} guid - Card instance GUID
     * @returns {Object|null} Instance data
     */
    getInstance(guid) {
      return window.lcards.debug.msd.instances.get(guid) || null;
    },

    /**
     * List all registered instances
     * @returns {Array} Array of instance data
     */
    listInstances() {
      const instances = Array.from(window.lcards.debug.msd.instances.values());
      console.group(`📊 MSD Instances (${instances.length})`);
      instances.forEach(inst => {
        console.log(`${inst.guid}:`, {
          hasCard: !!inst.cardInstance,
          hasPipeline: !!inst.pipelineInstance,
          registeredAt: inst.registeredAt
        });
      });
      console.groupEnd();
      return instances;
    }
  });

  // DataSourceManager property with getter (backward compatibility - uses last registered instance)
  Object.defineProperty(window.lcards.debug.msd, 'dataSourceManager', {
    get() {
      // Try to get from pipelineInstance (legacy single-instance reference)
      if (window.lcards.debug.msd.pipelineInstance?.dataSourceManager) {
        return window.lcards.debug.msd.pipelineInstance.dataSourceManager;
      }
      if (window.lcards.debug.msd.pipelineInstance?.systemsManager?.dataSourceManager) {
        return window.lcards.debug.msd.pipelineInstance.systemsManager.dataSourceManager;
      }
      
      // Fallback: Get from any registered instance
      const instances = Array.from(window.lcards.debug.msd.instances.values());
      if (instances.length > 0) {
        return instances[0].pipelineInstance?.systemsManager?.dataSourceManager;
      }
      
      return null;
    },
    configurable: true  // Allow it to be redefined if needed
  });

  // Backward compatibility: cardInstance property (uses last set value or first registered instance)
  Object.defineProperty(window.lcards.debug.msd, 'cardInstance', {
    get() {
      // If explicitly set, use that
      if (window.lcards.debug.msd._explicitCardInstance) {
        return window.lcards.debug.msd._explicitCardInstance;
      }
      
      // Otherwise, return first registered instance
      const instances = Array.from(window.lcards.debug.msd.instances.values());
      if (instances.length > 0) {
        return instances[0].cardInstance;
      }
      
      return null;
    },
    set(value) {
      window.lcards.debug.msd._explicitCardInstance = value;
    },
    configurable: true
  });
})();