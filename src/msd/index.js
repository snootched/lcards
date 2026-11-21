/**
 * @fileoverview MSD module entry point.
 *
 * Re-exports the public pipeline API and wires up the
 * `window.lcards.cards.msd.*` production namespace and
 * `window.lcards.debug.msd.*` debug namespace.
 */

import { initMsdPipeline as initMsdPipelineCore } from './pipeline/PipelineCore.js';
import { processMsdConfig } from './pipeline/ConfigProcessor.js';
import { MsdDebugAPI } from '../api/MsdDebugAPI.js';
import { lcardsLog } from '../utils/lcards-logging.js';

// Main exports
export { initMsdPipelineCore as initMsdPipeline, processMsdConfig };

/**
 * MSD Production Namespace & Debug Interface Setup
 *
 * Namespace layout:
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
        return document.querySelector(`lcards-msd-card[id="${id}"]`);
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
   */

  window.lcards.debug = window.lcards.debug || {};

  // Create and assign MsdDebugAPI instance
  const msdDebugAPI = MsdDebugAPI.create();
  window.lcards.debug.msd = msdDebugAPI;

  lcardsLog.trace('[MSD index.js] Debug namespace initialized with MsdDebugAPI');

})();
