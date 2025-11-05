/**
 * LCARdS Unified API - Main Entry Point
 *
 * Orchestrates all API tiers and provides single attachment point.
 * This is the foundation of the standardized API structure:
 *
 * - Runtime API (window.lcards.msd) - User-facing stable API
 * - Debug API (window.lcards.debug.msd) - Developer introspection
 * - Dev API (window.lcards.dev) - Internal development tools
 * - Animation API (window.lcards.anim) - Already set up in cb-lcars.js
 *
 * Phase 0: Foundation & Runtime API
 * Phase 1-3: Debug API, CLI features, cleanup
 *
 * @module LCARdSUnifiedAPI
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { MsdRuntimeAPI } from './MsdRuntimeAPI.js';
import { MsdDebugAPI } from './MsdDebugAPI.js';

export class LCARdSUnifiedAPI {
  /**
   * Attach all API tiers to window.lcards
   *
   * This method is called once during initialization to set up the
   * entire API structure. It ensures clean namespace organization
   * and prevents conflicts.
   */
  static attach() {
    if (typeof window === 'undefined') {
      lcardsLog.warn('[UnifiedAPI] Window not available, skipping API attach');
      return;
    }

    try {
      // Ensure namespace exists
      window.lcards = window.lcards || {};

      lcardsLog.debug('[UnifiedAPI] 🚀 Attaching unified API structure...');

      // ==========================================
      // PHASE 0: Runtime API
      // ==========================================
      window.lcards.msd = MsdRuntimeAPI.create();
      lcardsLog.debug('[UnifiedAPI] Runtime API attached');

      // ==========================================
      // PHASE 1: Debug API
      // ==========================================
      window.lcards.debug = window.lcards.debug || {};
      // CRITICAL: Preserve existing debug.msd properties (e.g., MsdInstanceManager from index.js)
      // by merging DebugAPI instead of replacing
      window.lcards.debug.msd = window.lcards.debug.msd || {};

      // Debug logging to trace API attachment
      const debugAPIMethods = MsdDebugAPI.create();
      lcardsLog.debug('[UnifiedAPI] Debug API methods to merge:', Object.keys(debugAPIMethods));
      lcardsLog.debug('[UnifiedAPI] Existing debug.msd keys before merge:', Object.keys(window.lcards.debug.msd));

      // CRITICAL: Delete deprecated properties that would block Object.assign()

      // Delete 'pipeline' getter (read-only property can't be overwritten)
      if ('pipeline' in window.lcards.debug.msd) {
        const descriptor = Object.getOwnPropertyDescriptor(window.lcards.debug.msd, 'pipeline');
        if (descriptor && descriptor.get && !descriptor.set) {
          delete window.lcards.debug.msd.pipeline;
          lcardsLog.debug('[UnifiedAPI] Deleted read-only pipeline getter to allow merge');
        }
      }

      // Delete legacy 'perf' function (needs to become an object namespace)
      if ('perf' in window.lcards.debug.msd && typeof window.lcards.debug.msd.perf === 'function') {
        delete window.lcards.debug.msd.perf;
        lcardsLog.debug('[UnifiedAPI] Deleted legacy perf function to allow namespace merge');
      }

      Object.assign(window.lcards.debug.msd, debugAPIMethods);

      lcardsLog.debug('[UnifiedAPI] Existing debug.msd keys after merge:', Object.keys(window.lcards.debug.msd));
      lcardsLog.debug('[UnifiedAPI] Debug API attached');



      // ==========================================
      // PHASE 0: Dev API (placeholder stub)
      // ==========================================
      window.lcards.dev = {
        _placeholder: true,
        _version: 'phase0-stub',
        _status: 'Dev API will be implemented in Phase 3'
      };

      // ==========================================
      // Animation API (window.lcards.anim)
      // ==========================================
      // Already set up in cb-lcars.js - we'll refactor in Phase 3
      // Just log that it exists
      if (window.lcards.anim) {
        lcardsLog.debug('[UnifiedAPI] Animation API already initialized');
      }

      lcardsLog.debug('[UnifiedAPI] ✅ Unified API structure attached successfully');
      lcardsLog.debug('[UnifiedAPI] Available namespaces:', {
        runtime: !!window.lcards.msd,
        debug: !!window.lcards.debug?.msd,
        dev: !!window.lcards.dev,
        animation: !!window.lcards.anim
      });

    } catch (error) {
      lcardsLog.error('[UnifiedAPI] ❌ Failed to attach API:', error);
    }
  }

  /**
   * Detach APIs (for testing/cleanup)
   *
   * Removes all API namespaces. Useful for testing or if you need
   * to reinitialize the API structure.
   */
  static detach() {
    if (typeof window === 'undefined') return;

    try {
      delete window.lcards?.msd;
      delete window.lcards?.debug?.msd;
      delete window.lcards?.dev;

      lcardsLog.info('[UnifiedAPI] API detached');
    } catch (error) {
      lcardsLog.error('[UnifiedAPI] Error during detach:', error);
    }
  }

  /**
   * Get API version and status information
   *
   * Useful for debugging to see which API tiers are loaded
   * and what version/phase they're at.
   *
   * @returns {Object} Version info for all API tiers
   */
  static getVersion() {
    if (typeof window === 'undefined') {
      return { error: 'Window not available' };
    }

    return {
      phase: 0,
      runtime: {
        version: window.lcards?.msd?._version || 'not-loaded',
        placeholder: window.lcards?.msd?._placeholder || false
      },
      debug: {
        version: window.lcards?.debug?.msd?._version || 'not-loaded',
        placeholder: window.lcards?.debug?.msd?._placeholder || false
      },
      dev: {
        version: window.lcards?.dev?._version || 'not-loaded',
        placeholder: window.lcards?.dev?._placeholder || false
      },
      animation: {
        loaded: !!window.lcards?.anim,
        hasAnimejs: !!window.lcards?.anim?.animejs
      }
    };
  }

  /**
   * Get current API status for debugging
   *
   * @returns {Object} Status information
   */
  static getStatus() {
    if (typeof window === 'undefined') {
      return { available: false };
    }

    return {
      available: true,
      namespaces: {
        runtime: !!window.lcards?.msd,
        debug: !!window.lcards?.debug?.msd,
        dev: !!window.lcards?.dev,
        animation: !!window.lcards?.anim
      },
      versions: LCARdSUnifiedAPI.getVersion()
    };
  }
}

// ALWAYS attach when module loads - no conditionals
if (typeof window !== 'undefined') {
  // Expose class first so DebugInterface can call attach() again if needed
  window.LCARdSUnifiedAPI = LCARdSUnifiedAPI;

  // Force attach immediately
  LCARdSUnifiedAPI.attach();
  lcardsLog.debug('[UnifiedAPI] ✅ Auto-attached at module load');
}
