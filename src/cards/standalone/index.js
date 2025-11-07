/**
 * LCARdS Standalone Overlay Cards - Main Export
 *
 * This module provides the complete standalone overlay card system that leverages
 * the extracted core infrastructure. These cards are lightweight, modern, and can
 * be used independently without the full MSD system.
 *
 * Features:
 * - Standalone overlay cards with core system integration
 * - LCARS-authentic styling and animations
 * - Lightweight architecture without MSD dependencies
 * - Modern ES6+ module structure
 * - Full Home Assistant integration
 *
 * @author LCARdS Development Team
 * @version 2.0.0
 * @since Phase 2b
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

// Base classes and utilities
export { StandaloneOverlayCard, BASE_OVERLAY_SCHEMA } from './base/StandaloneOverlayCard.js';

// Component implementations
export { StatusOverlay, STATUS_OVERLAY_SCHEMA } from './components/StatusOverlay.js';

/**
 * Standalone overlay card registry
 * Maps card type names to their implementation classes
 */
export const STANDALONE_CARD_REGISTRY = {
  'status-overlay': {
    class: null, // Will be loaded dynamically
    schema: null,
    description: 'LCARS-style entity status indicator overlay',
    version: '2.0.0'
  }
  // Additional cards will be added here as they are implemented
};

/**
 * Initialize the standalone overlay card system
 *
 * @param {Object} options - Initialization options
 * @param {boolean} options.autoRegister - Auto-register with Home Assistant
 * @param {Object} options.customCards - Additional custom card definitions
 * @returns {Promise<void>}
 */
export async function initializeStandaloneCards(options = {}) {
  const { autoRegister = true, customCards = {} } = options;

  try {
    lcardsLog.info('[StandaloneCards] 🚀 Initializing standalone overlay card system...');

    // Verify core systems are available
    if (!window.lcards?.core) {
      throw new Error('LCARdS core not available - ensure core systems are loaded first');
    }

    if (!window.lcards.core._coreInitialized) {
      throw new Error('LCARdS core not initialized - call core.initialize() first');
    }

    // Register base overlay card schema with ValidationService
    const { BASE_OVERLAY_SCHEMA } = await import('./base/StandaloneOverlayCard.js');
    window.lcards.core.validationService.schemaRegistry.registerSchema('overlay-card', BASE_OVERLAY_SCHEMA);
    lcardsLog.debug('[StandaloneCards] Registered base overlay schema with ValidationService');

    // Dynamically load card implementations
    await loadCardImplementations();

    // Register custom cards if provided
    if (Object.keys(customCards).length > 0) {
      registerCustomCards(customCards);
    }

    // Auto-register with Home Assistant if requested
    if (autoRegister && window.customCards) {
      await registerWithHomeAssistant();
    }

    lcardsLog.info('[StandaloneCards] ✅ Standalone overlay card system initialized', {
      registeredCards: Object.keys(STANDALONE_CARD_REGISTRY).length,
      coreSystemsAvailable: !!window.lcards.core,
      autoRegistered: autoRegister
    });

  } catch (error) {
    lcardsLog.error('[StandaloneCards] ❌ Failed to initialize standalone card system:', error);
    throw error;
  }
}

/**
 * Load card implementations dynamically
 * @private
 */
async function loadCardImplementations() {
  try {
    // Load StatusOverlay
    const { StatusOverlay, STATUS_OVERLAY_SCHEMA } = await import('./components/StatusOverlay.js');
    STANDALONE_CARD_REGISTRY['status-overlay'].class = StatusOverlay;
    STANDALONE_CARD_REGISTRY['status-overlay'].schema = STATUS_OVERLAY_SCHEMA;

    // Register StatusOverlay schema with ValidationService
    window.lcards.core.validationService.schemaRegistry.registerSchema('status-overlay', STATUS_OVERLAY_SCHEMA);
    lcardsLog.debug('[StandaloneCards] Registered status-overlay schema with ValidationService');

    // Additional cards will be loaded here as they are implemented

    lcardsLog.debug('[StandaloneCards] Card implementations loaded successfully');

  } catch (error) {
    lcardsLog.error('[StandaloneCards] Failed to load card implementations:', error);
    throw error;
  }
}

/**
 * Register custom card definitions
 * @private
 */
function registerCustomCards(customCards) {
  Object.entries(customCards).forEach(([cardType, cardDef]) => {
    if (cardDef.class && typeof cardDef.class === 'function') {
      STANDALONE_CARD_REGISTRY[cardType] = {
        class: cardDef.class,
        schema: cardDef.schema || {},
        description: cardDef.description || 'Custom standalone overlay card',
        version: cardDef.version || '1.0.0'
      };
      lcardsLog.debug(`[StandaloneCards] Registered custom card: ${cardType}`);
    } else {
      lcardsLog.warn(`[StandaloneCards] Invalid custom card definition: ${cardType}`);
    }
  });
}

/**
 * Register standalone cards with Home Assistant
 * @private
 */
async function registerWithHomeAssistant() {
  if (!window.customCards) {
    lcardsLog.warn('[StandaloneCards] customCards not available - cannot register with Home Assistant');
    return;
  }

  try {
    // Register each card type with Home Assistant
    Object.entries(STANDALONE_CARD_REGISTRY).forEach(([cardType, cardDef]) => {
      if (cardDef.class) {
        // Create Home Assistant card wrapper
        const HACardWrapper = createHACardWrapper(cardType, cardDef.class);

        // Register with customCards
        window.customCards = window.customCards || [];
        window.customCards.push({
          type: cardType,
          name: `LCARdS ${cardDef.description}`,
          description: cardDef.description,
          version: cardDef.version,
          documentationURL: 'https://lcards.io/docs/standalone-cards'
        });

        // Define the custom element
        if (!customElements.get(cardType)) {
          customElements.define(cardType, HACardWrapper);
          lcardsLog.debug(`[StandaloneCards] Registered HA card: ${cardType}`);
        }
      }
    });

    lcardsLog.info('[StandaloneCards] ✅ Registered with Home Assistant');

  } catch (error) {
    lcardsLog.error('[StandaloneCards] Failed to register with Home Assistant:', error);
    throw error;
  }
}

/**
 * Create Home Assistant card wrapper for a standalone card
 * @private
 */
function createHACardWrapper(cardType, CardClass) {
  return class extends HTMLElement {
    constructor() {
      super();
      this.cardInstance = null;
      this._hass = null;
      this._config = null;
    }

    set hass(hass) {
      this._hass = hass;
      if (this.cardInstance && this.cardInstance.initialized) {
        // Update existing card
        this.cardInstance.hass = hass;
      }
    }

    get hass() {
      return this._hass;
    }

    setConfig(config) {
      if (!config || !config.type) {
        throw new Error('Invalid configuration');
      }

      this._config = { ...config };
      this.initializeCard();
    }

    async initializeCard() {
      if (!this._config || !this._hass) return;

      try {
        // Destroy existing card if any
        if (this.cardInstance) {
          await this.cardInstance.destroy();
        }

        // Create new card instance
        this.cardInstance = new CardClass();

        // Initialize the card
        await this.cardInstance.initialize(this._hass, this._config, this);

        lcardsLog.debug(`[HACardWrapper] Initialized ${cardType} card`);

      } catch (error) {
        lcardsLog.error(`[HACardWrapper] Failed to initialize ${cardType} card:`, error);

        // Show error in card
        this.innerHTML = `
          <div style="
            background: #ff4444;
            color: white;
            padding: 16px;
            border-radius: 4px;
            font-family: monospace;
          ">
            <strong>Card Error:</strong><br>
            ${error.message}
          </div>
        `;
      }
    }

    connectedCallback() {
      if (this._config && this._hass) {
        this.initializeCard();
      }
    }

    disconnectedCallback() {
      if (this.cardInstance) {
        this.cardInstance.destroy();
        this.cardInstance = null;
      }
    }

    getCardSize() {
      // Return estimated card size for Home Assistant layout
      const mode = this._config?.display_mode || 'compact';
      return mode === 'detailed' ? 3 : mode === 'minimal' ? 1 : 2;
    }
  };
}

/**
 * Create a standalone overlay card instance
 *
 * @param {string} cardType - Type of card to create
 * @param {Object} config - Card configuration
 * @param {Object} hass - Home Assistant instance
 * @param {HTMLElement} element - DOM element to render into
 * @returns {Promise<StandaloneOverlayCard>} Card instance
 */
export async function createStandaloneCard(cardType, config, hass, element) {
  const cardDef = STANDALONE_CARD_REGISTRY[cardType];

  if (!cardDef || !cardDef.class) {
    throw new Error(`Unknown standalone card type: ${cardType}`);
  }

  try {
    // Create card instance
    const cardInstance = new cardDef.class();

    // Initialize the card
    await cardInstance.initialize(hass, config, element);

    lcardsLog.info(`[StandaloneCards] ✅ Created ${cardType} card:`, cardInstance.cardId);

    return cardInstance;

  } catch (error) {
    lcardsLog.error(`[StandaloneCards] ❌ Failed to create ${cardType} card:`, error);
    throw error;
  }
}

/**
 * Get available standalone card types
 *
 * @returns {Object} Registry of available card types
 */
export function getAvailableCardTypes() {
  return Object.fromEntries(
    Object.entries(STANDALONE_CARD_REGISTRY).map(([type, def]) => [
      type,
      {
        description: def.description,
        version: def.version,
        available: !!def.class
      }
    ])
  );
}

/**
 * Validate configuration for a card type
 *
 * @param {string} cardType - Type of card
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateCardConfig(cardType, config) {
  const cardDef = STANDALONE_CARD_REGISTRY[cardType];

  if (!cardDef) {
    return {
      valid: false,
      errors: [`Unknown card type: ${cardType}`],
      warnings: []
    };
  }

  if (!cardDef.schema) {
    return {
      valid: true,
      errors: [],
      warnings: ['No schema available for validation']
    };
  }

  // Use core ValidationService if available
  if (window.lcards?.core?.validationService) {
    return window.lcards.core.validationService.validate(config, cardType, cardDef.schema);
  }

  // Fallback basic validation
  const errors = [];
  if (!config.type) {
    errors.push('Missing required property: type');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}

// Log initialization
lcardsLog.info('[StandaloneCards] 📦 Standalone overlay card module loaded');

// Export default initialization function
export default initializeStandaloneCards;