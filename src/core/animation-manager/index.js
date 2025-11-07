/**
 * @fileoverview CoreAnimationManager - Central animation system for LCARdS core infrastructure
 *
 * Simplified version of MSD AnimationManager focused on:
 * - Basic animation scope management
 * - Animation registration and coordination
 * - Integration with anime.js via window.lcards.anim
 * - Cross-card animation capabilities
 *
 * Note: This is a streamlined version. For full MSD animation features,
 * the MSD-specific AnimationManager continues to provide advanced capabilities.
 *
 * @module core/animation-manager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Simplified animation registry for core usage
 * Provides basic caching without heavy performance tracking
 */
class CoreAnimationRegistry {
  constructor() {
    this.cache = new Map(); // animationId -> cached animation definition
  }

  /**
   * Get cached animation or create new entry
   * @param {string} animationId - Animation identifier
   * @param {Function} createFn - Function to create animation if not cached
   * @returns {*} Cached or newly created animation
   */
  get(animationId, createFn) {
    if (this.cache.has(animationId)) {
      return this.cache.get(animationId);
    }

    const animation = createFn();
    this.cache.set(animationId, animation);
    return animation;
  }

  /**
   * Clear animation cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size for debugging
   * @returns {number} Number of cached animations
   */
  size() {
    return this.cache.size;
  }
}

/**
 * CoreAnimationManager - Central animation coordinator for shared core infrastructure
 *
 * Manages animations across all LCARdS card types with simplified but effective
 * animation scope management and coordination.
 */
export class CoreAnimationManager {
  constructor() {
    // Core components
    this.registry = new CoreAnimationRegistry();
    this.scopes = new Map(); // cardId -> { animations, activeAnimations }
    this.presets = new Map(); // presetId -> preset definition

    // Animation tracking
    this.activeAnimations = new Map(); // cardId -> Set<animation instances>
    this.registeredAnimations = new Map(); // cardId -> animation definitions[]

    // State
    this.initialized = false;

    lcardsLog.debug('[CoreAnimationManager] 🎬 Core animation manager created');
  }

  /**
   * Initialize animation system
   * @returns {Promise<void>}
   */
  async initialize() {
    lcardsLog.debug('[CoreAnimationManager] 🚀 Initializing core animation system');

    try {
      // Initialize anime.js integration if available
      await this._initializeAnimeJS();

      // Load core animation presets
      this._loadCorePresets();

      this.initialized = true;

      lcardsLog.info('[CoreAnimationManager] ✅ Core animation system initialized:', {
        hasAnimeJS: !!window.lcards?.anim,
        presetCount: this.presets.size,
        cacheSize: this.registry.size()
      });

    } catch (error) {
      lcardsLog.error('[CoreAnimationManager] ❌ Animation system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize anime.js integration
   * @private
   */
  async _initializeAnimeJS() {
    // Check if anime.js is available via window.lcards.anim
    if (typeof window !== 'undefined' && window.lcards?.anim) {
      lcardsLog.debug('[CoreAnimationManager] anime.js integration available');
      return;
    }

    lcardsLog.warn('[CoreAnimationManager] anime.js not available - animations will be limited');
  }

  /**
   * Load core animation presets
   * @private
   */
  _loadCorePresets() {
    // Basic fade preset
    this.presets.set('fade-in', {
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuart'
    });

    this.presets.set('fade-out', {
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInQuart'
    });

    // Basic slide preset
    this.presets.set('slide-in-right', {
      translateX: [100, 0],
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutExpo'
    });

    this.presets.set('slide-out-left', {
      translateX: [0, -100],
      opacity: [1, 0],
      duration: 400,
      easing: 'easeInExpo'
    });

    // Basic scale preset
    this.presets.set('scale-in', {
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 350,
      easing: 'easeOutBack'
    });

    lcardsLog.debug(`[CoreAnimationManager] Loaded ${this.presets.size} core presets`);
  }

  /**
   * Register a card with animation capabilities
   * @param {string} cardId - Card identifier
   * @param {Object} config - Animation configuration
   * @returns {Object} Animation context for the card
   */
  registerCard(cardId, config = {}) {
    if (this.scopes.has(cardId)) {
      lcardsLog.warn('[CoreAnimationManager] Card already registered:', cardId);
      return this.scopes.get(cardId);
    }

    const animationContext = {
      cardId,
      animations: new Map(), // animationId -> definition
      activeAnimations: new Set(),
      config,
      registeredAt: Date.now()
    };

    this.scopes.set(cardId, animationContext);
    this.activeAnimations.set(cardId, new Set());
    this.registeredAnimations.set(cardId, []);

    lcardsLog.debug('[CoreAnimationManager] Card registered for animations:', cardId);
    return animationContext;
  }

  /**
   * Unregister a card and cleanup its animations
   * @param {string} cardId - Card identifier
   */
  unregisterCard(cardId) {
    // Stop any active animations for this card
    this.stopAllAnimations(cardId);

    // Clean up card data
    this.scopes.delete(cardId);
    this.activeAnimations.delete(cardId);
    this.registeredAnimations.delete(cardId);

    lcardsLog.debug('[CoreAnimationManager] Card unregistered from animations:', cardId);
  }

  /**
   * Play animation for a specific card/element
   * @param {string} cardId - Card identifier
   * @param {string|Object} animationDef - Animation definition or preset name
   * @param {Element} targetElement - Target DOM element
   * @param {Object} options - Animation options
   * @returns {Promise} Animation promise
   */
  async playAnimation(cardId, animationDef, targetElement, options = {}) {
    if (!this.initialized) {
      lcardsLog.warn('[CoreAnimationManager] Animation system not initialized');
      return Promise.resolve();
    }

    if (!this.scopes.has(cardId)) {
      lcardsLog.warn('[CoreAnimationManager] Card not registered:', cardId);
      return Promise.resolve();
    }

    try {
      // Resolve animation definition
      const resolved = this._resolveAnimationDefinition(animationDef);
      if (!resolved) {
        lcardsLog.warn('[CoreAnimationManager] Could not resolve animation:', animationDef);
        return Promise.resolve();
      }

      // Create animation ID for tracking
      const animationId = `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Execute animation
      const animationPromise = this._executeAnimation(animationId, resolved, targetElement, options);

      // Track active animation
      const activeSet = this.activeAnimations.get(cardId);
      activeSet.add(animationId);

      // Clean up when animation completes
      animationPromise.finally(() => {
        activeSet.delete(animationId);
      });

      lcardsLog.debug('[CoreAnimationManager] Animation started:', {
        cardId,
        animationId,
        targetElement: targetElement?.tagName
      });

      return animationPromise;

    } catch (error) {
      lcardsLog.error('[CoreAnimationManager] Animation failed:', error);
      return Promise.resolve();
    }
  }

  /**
   * Resolve animation definition (preset name or direct definition)
   * @private
   */
  _resolveAnimationDefinition(animationDef) {
    if (typeof animationDef === 'string') {
      // Try to resolve as preset
      return this.presets.get(animationDef);
    }

    if (typeof animationDef === 'object' && animationDef !== null) {
      // Direct animation definition
      return animationDef;
    }

    return null;
  }

  /**
   * Execute animation using anime.js if available
   * @private
   */
  _executeAnimation(animationId, definition, targetElement, options) {
    // Check if anime.js is available
    if (!window.lcards?.anim) {
      lcardsLog.debug('[CoreAnimationManager] anime.js not available, skipping animation');
      return Promise.resolve();
    }

    const anime = window.lcards.anim;

    // Combine definition with options and target
    const animationConfig = {
      targets: targetElement,
      ...definition,
      ...options
    };

    try {
      const animation = anime(animationConfig);

      // Return promise that resolves when animation completes
      return new Promise((resolve) => {
        animation.complete = resolve;
        if (animation.finished) {
          animation.finished.then(resolve);
        } else {
          // Fallback timeout
          setTimeout(resolve, animationConfig.duration || 1000);
        }
      });

    } catch (error) {
      lcardsLog.warn('[CoreAnimationManager] anime.js execution failed:', error);
      return Promise.resolve();
    }
  }

  /**
   * Stop all animations for a card
   * @param {string} cardId - Card identifier
   */
  stopAllAnimations(cardId) {
    const activeSet = this.activeAnimations.get(cardId);
    if (activeSet) {
      lcardsLog.debug(`[CoreAnimationManager] Stopping ${activeSet.size} animations for card:`, cardId);
      activeSet.clear();
    }
  }

  /**
   * Add custom animation preset
   * @param {string} presetName - Preset identifier
   * @param {Object} definition - Animation definition
   */
  addPreset(presetName, definition) {
    this.presets.set(presetName, definition);
    lcardsLog.debug('[CoreAnimationManager] Added custom preset:', presetName);
  }

  /**
   * Get available presets
   * @returns {Array<string>} Array of preset names
   */
  listPresets() {
    return Array.from(this.presets.keys());
  }

  /**
   * Get animation statistics for a card
   * @param {string} cardId - Card identifier
   * @returns {Object} Animation statistics
   */
  getCardAnimationStats(cardId) {
    const scope = this.scopes.get(cardId);
    const activeCount = this.activeAnimations.get(cardId)?.size || 0;

    return {
      cardId,
      isRegistered: !!scope,
      activeAnimations: activeCount,
      registeredAnimations: this.registeredAnimations.get(cardId)?.length || 0,
      registeredAt: scope?.registeredAt
    };
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    const totalActiveAnimations = Array.from(this.activeAnimations.values())
      .reduce((sum, set) => sum + set.size, 0);

    return {
      initialized: this.initialized,
      registeredCards: Array.from(this.scopes.keys()),
      totalActiveAnimations,
      presetCount: this.presets.size,
      cacheSize: this.registry.size(),
      hasAnimeJS: !!window.lcards?.anim
    };
  }

  /**
   * Update HASS instance (for consistency with other core managers)
   * @param {Object} hass - Home Assistant instance
   */
  updateHass(hass) {
    // Animation manager doesn't need HASS directly, but keep for API consistency
    lcardsLog.debug('[CoreAnimationManager] 🔄 HASS updated (no-op for animations)');
  }

  /**
   * Destroy animation manager and clean up resources
   */
  destroy() {
    // Stop all animations
    Array.from(this.scopes.keys()).forEach(cardId => {
      this.stopAllAnimations(cardId);
    });

    // Clear all data
    this.scopes.clear();
    this.activeAnimations.clear();
    this.registeredAnimations.clear();
    this.presets.clear();
    this.registry.clear();

    this.initialized = false;

    lcardsLog.debug('[CoreAnimationManager] Destroyed');
  }
}