import { initMsdPipeline as initMsdPipelineCore } from './pipeline/PipelineCore.js';
import { processMsdConfig } from './pipeline/ConfigProcessor.js';
import { buildCardModel } from './model/CardModel.js';
import { mergePacks } from '../core/packs/mergePacks.js';

import "./hud/MsdHudUtilities.js";

// Main exports
export { initMsdPipelineCore as initMsdPipeline, processMsdConfig };

/**
 * MSD Production Namespace & Debug Interface Setup
 * 
 * ARCHITECTURE CHANGE (v1.17.0+):
 * - Production APIs: window.lcards.cards.msd.*
 * - Debug tools: window.lcards.debug.msd.*
 * 
 * This matches the core architecture pattern where production
 * systems live under window.lcards.core.* and MSD is a card
 * system under window.lcards.cards.*
 */
(function attachMsdNamespaces() {
  if (typeof window === 'undefined') return;

  // ============================================================================
  // PRODUCTION NAMESPACE: window.lcards.cards.msd.*
  // ============================================================================
  
  window.lcards = window.lcards || {};
  window.lcards.cards = window.lcards.cards || {};
  window.lcards.cards.msd = {
    /**
     * Get all MSD cards on the page
     * @returns {NodeList} MSD card elements
     */
    getAll() {
      return document.querySelectorAll('lcards-msd');
    },

    /**
     * Get MSD card by ID
     * @param {string} id - Card ID attribute
     * @returns {Element|null} MSD card element
     */
    getById(id) {
      return document.querySelector(`lcards-msd[id="${id}"]`);
    }
  };

  console.log('[MSD index.js] ✅ Production namespace initialized: window.lcards.cards.msd');

  // ============================================================================
  // DEBUG NAMESPACE: window.lcards.debug.msd.*
  // ============================================================================
  
  /**
   * MSD Debug Namespace
   * 
   * Stable utilities (safe to use):
   * - mergePacks, buildCardModel, initMsdPipeline
   * 
   * Debug-only helpers (may change):
   * - getProvenance, debugProvenance
   */
  
  window.lcards.debug = window.lcards.debug || {};
  window.lcards.debug.msd = {
    // Utility functions for testing/development
    mergePacks,
    buildCardModel,
    initMsdPipeline: initMsdPipelineCore,

    /**
     * Get provenance from MSD card element
     * @param {string} selector - CSS selector (default: 'lcards-msd')
     * @returns {Object|null} Provenance data
     */
    getProvenance(selector = 'lcards-msd') {
      const card = document.querySelector(selector);
      if (!card?.getProvenance) {
        console.warn(`[MSD Debug] Card not found or no provenance: ${selector}`);
        return null;
      }
      return card.getProvenance();
    },

    /**
     * Print provenance for MSD card
     * @param {string} selector - CSS selector (default: 'lcards-msd')
     */
    debugProvenance(selector = 'lcards-msd') {
      const card = document.querySelector(selector);
      if (!card?.debugProvenance) {
        console.warn(`[MSD Debug] Card not found: ${selector}`);
        return;
      }
      card.debugProvenance();
    }
  };

  console.log('[MSD index.js] ✅ Debug namespace initialized');

  // ============================================================================
  // GLOBAL DEBUG HELPERS
  // ============================================================================

  if (!window.__msdStatus) {
    window.__msdStatus = () => {
      const cards = document.querySelectorAll('lcards-msd');
      const status = {
        'Multi-Instance Mode': 'Enabled',
        'Active MSD Cards': cards.length,
        'Production API': 'window.lcards.cards.msd',
        'Debug API': 'window.lcards.debug.msd',
        'Timestamp': new Date().toISOString()
      };

      console.table(status);
      console.log('💡 Get all cards: window.lcards.cards.msd.getAll()');
      console.log('💡 Get card by ID: window.lcards.cards.msd.getById("bridge")');
      console.log('💡 Get provenance: window.lcards.debug.msd.getProvenance()');
      console.log('💡 Debug provenance: window.lcards.debug.msd.debugProvenance()');
      console.log('💡 Inspect cards: Use browser DevTools Elements tab');
      return status;
    };
  }

  console.log('[MSD index.js] ✅ Global debug helpers initialized');
})();
