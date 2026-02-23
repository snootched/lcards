import { initMsdPipeline as initMsdPipelineCore } from './pipeline/PipelineCore.js';
import { processMsdConfig } from './pipeline/ConfigProcessor.js';
import { buildCardModel } from './model/CardModel.js';
import { mergePacks } from '../core/packs/mergePacks.js';
import { MsdDebugAPI } from '../api/MsdDebugAPI.js';
import { lcardsLog } from '../utils/lcards-logging.js';

// Main exports
export { initMsdPipelineCore as initMsdPipeline, processMsdConfig };

/**
 * MSD Production Namespace & Debug Interface Setup
 *
 * ARCHITECTURE CHANGE:
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
     * Uses SystemsManager for reliable card discovery across shadow DOM boundaries
     * @returns {Array<Element>} MSD card elements
     */
    getAll() {
      const core = window.lcards?.core;
      if (!core?.systemsManager) {
        // Fallback to DOM query if SystemsManager not available
        lcardsLog.warn('[MSD Production] ⚠️ SystemsManager not available, using fallback');
        return Array.from(document.querySelectorAll('lcards-msd-card'));
      }

      const cards = [];
      core.systemsManager._registeredCards.forEach((cardData) => {
        if (cardData.card?.tagName === 'LCARDS-MSD-CARD') {
          cards.push(cardData.card);
        }
      });
      return cards;
    },

    /**
     * Get MSD card by config ID
     * Uses SystemsManager for reliable card lookup
     * @param {string} id - Card config ID attribute
     * @returns {Element|null} MSD card element
     */
    getById(id) {
      const core = window.lcards?.core;
      if (!core?.systemsManager) {
        // Fallback to DOM query if SystemsManager not available
        lcardsLog.warn('[MSD Production] ⚠️ SystemsManager not available, using fallback');
        return document.querySelector(`lcards-msd[id="${id}"]`);
      }

      let found = null;
      core.systemsManager._registeredCards.forEach((cardData) => {
        if (cardData.card?.tagName === 'LCARDS-MSD-CARD' && cardData.config?.id === id) {
          found = cardData.card;
        }
      });
      return found;
    }
  };

  lcardsLog.trace('[MSD index.js] Production namespace initialized: window.lcards.cards.msd');

  // ============================================================================
  // DEBUG NAMESPACE: window.lcards.debug.msd.*
  // ============================================================================

  /**
   * MSD Debug Namespace
   *
   * Instantiate MsdDebugAPI for comprehensive debugging tools.
   * Also preserve legacy utilities for backwards compatibility.
   */

  window.lcards.debug = window.lcards.debug || {};

  // Create and assign MsdDebugAPI instance
  const msdDebugAPI = MsdDebugAPI.create();
  window.lcards.debug.msd = msdDebugAPI;

  // Preserve legacy utilities for backwards compatibility
  window.lcards.debug.msd.mergePacks = mergePacks;
  window.lcards.debug.msd.buildCardModel = buildCardModel;
  window.lcards.debug.msd.initMsdPipeline = initMsdPipelineCore;

  // Preserve legacy DOM-based helpers (will be replaced by SystemsManager internally)
  window.lcards.debug.msd.getProvenance = function(selector = 'lcards-msd') {
    const card = document.querySelector(selector);
    if (!card?.getProvenance) {
      lcardsLog.warn(`[MSD Debug] ⚠️ Card not found or no provenance: ${selector}`);
      return null;
    }
    return card.getProvenance();
  };

  window.lcards.debug.msd.debugProvenance = function(selector = 'lcards-msd') {
    const card = document.querySelector(selector);
    if (!card?.debugProvenance) {
      lcardsLog.warn(`[MSD Debug] ⚠️ Card not found: ${selector}`);
      return;
    }
    card.debugProvenance();
  };

  lcardsLog.trace('[MSD index.js] Debug namespace initialized with MsdDebugAPI');

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

      // Keep console.table for this debug helper - it's a user-facing debug function
      console.table(status);
      console.log('💡 Get all cards: window.lcards.cards.msd.getAll()');
      console.log('💡 Get card by ID: window.lcards.cards.msd.getById("bridge")');
      console.log('💡 Get provenance: window.lcards.debug.msd.getProvenance()');
      console.log('💡 Debug provenance: window.lcards.debug.msd.debugProvenance()');
      console.log('💡 Inspect cards: Use browser DevTools Elements tab');
      return status;
    };
  }

  lcardsLog.trace('[MSD index.js] Global debug helpers initialized');
})();
