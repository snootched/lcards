/**
 * StandaloneOverlayCard - Base class for lightweight LCARS overlay cards
 *
 * This class provides the foundation for standalone overlay cards that leverage
 * the extracted core systems without requiring the full MSD infrastructure.
 *
 * Features:
 * - Integration with all 6 core systems
 * - Lifecycle management (init, render, update, destroy)
 * - HASS integration and entity state management
 * - Event handling and user interaction
 * - CSS class management and LCARS styling
 * - Animation coordination
 *
 * @author LCARdS Development Team
 * @version 2.0.0
 * @since Phase 2b
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Base configuration schema for all standalone overlay cards
 */
export const BASE_OVERLAY_SCHEMA = {
  type: 'object',
  required: ['type'],
  properties: {
    type: {
      type: 'string',
      description: 'Card type identifier'
    },
    entity: {
      type: 'string',
      description: 'Primary entity ID for the card'
    },
    entities: {
      type: 'array',
      items: { type: 'string' },
      description: 'Multiple entity IDs for multi-entity cards'
    },
    name: {
      type: 'string',
      description: 'Display name for the card'
    },
    theme: {
      type: 'string',
      description: 'Theme override for this card'
    },
    animations: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        preset: { type: 'string', default: 'fade-in' },
        duration: { type: 'number', default: 300 }
      }
    },
    style: {
      type: 'object',
      description: 'Custom styling overrides'
    },
    update_interval: {
      type: 'number',
      minimum: 100,
      default: 1000,
      description: 'Update interval in milliseconds'
    }
  }
};

/**
 * Base class for all standalone overlay cards
 * Provides core system integration and common functionality
 */
export class StandaloneOverlayCard {
  constructor() {
    this.cardId = `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initialized = false;
    this.destroyed = false;
    this.hass = null;
    this.config = null;

    // Core system references
    this.core = null;
    this.context = null;
    this.animContext = null;

    // Component state
    this.element = null;
    this.shadowRoot = null;
    this.entities = new Map();
    this.subscriptions = new Set();

    // Lifecycle callbacks
    this.onStateChange = this.onStateChange.bind(this);
    this.onConfigUpdate = this.onConfigUpdate.bind(this);

    lcardsLog.debug(`[StandaloneOverlayCard] Created card: ${this.cardId}`);
  }

  /**
   * Initialize the standalone overlay card
   *
   * @param {Object} hass - Home Assistant instance
   * @param {Object} config - Card configuration
   * @param {HTMLElement} element - DOM element to render into
   * @returns {Promise<void>}
   */
  async initialize(hass, config, element) {
    if (this.initialized) {
      lcardsLog.warn(`[StandaloneOverlayCard] Card ${this.cardId} already initialized`);
      return;
    }

    try {
      // Validate core system availability
      this.core = window.lcards?.core;
      if (!this.core) {
        throw new Error('LCARdS core not available - ensure core systems are loaded');
      }

      if (!this.core._coreInitialized) {
        throw new Error('LCARdS core not initialized - call core.initialize() first');
      }

      // Store references
      this.hass = hass;
      this.config = { ...config };
      this.element = element;

      // Validate configuration
      const validation = await this.validateConfiguration(config);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(error =>
          typeof error === 'string' ? error : error.message || error.type || 'Unknown error'
        );
        throw new Error(`Configuration validation failed: ${errorMessages.join(', ')}`);
      }

      // Register with core systems
      await this.registerWithCoreSystems();

      // Setup entity subscriptions
      await this.setupEntitySubscriptions();

      // Initialize rendering
      await this.initializeRenderer();

      // Apply initial styling
      await this.applyInitialStyling();

      // Perform initial render
      await this.performInitialRender();

      this.initialized = true;

      lcardsLog.info(`[StandaloneOverlayCard] ✅ Initialized card: ${this.cardId}`, {
        type: this.config.type,
        entities: this.getEntityIds(),
        theme: this.config.theme
      });

      // Trigger post-initialization hook
      await this.onInitialized();

    } catch (error) {
      lcardsLog.error(`[StandaloneOverlayCard] ❌ Failed to initialize card: ${this.cardId}`, error);
      await this.destroy();
      throw error;
    }
  }

  /**
   * Register with all core systems
   * @private
   */
  async registerWithCoreSystems() {
    // Register with SystemsManager
    this.context = this.core.systemsManager.registerCard(this.cardId, this, this.config);
    if (!this.context) {
      throw new Error('Failed to register with SystemsManager');
    }

    // Register with AnimationManager
    this.animContext = this.core.animationManager.registerCard(this.cardId, {
      enableAnimations: this.config.animations?.enabled !== false
    });

    lcardsLog.debug(`[StandaloneOverlayCard] Registered with core systems: ${this.cardId}`);
  }

  /**
   * Validate card configuration
   * @private
   */
  async validateConfiguration(config) {
    // Use core ValidationService
    const baseValidation = this.core.validationService.validate(config, 'overlay-card', BASE_OVERLAY_SCHEMA);

    // Allow subclasses to add additional validation
    const customValidation = await this.validateCustomConfiguration(config);

    return {
      valid: baseValidation.valid && customValidation.valid,
      errors: [...(baseValidation.errors || []), ...(customValidation.errors || [])],
      warnings: [...(baseValidation.warnings || []), ...(customValidation.warnings || [])]
    };
  }

  /**
   * Override in subclasses for custom validation
   * @protected
   */
  async validateCustomConfiguration(config) {
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Setup entity state subscriptions
   * @private
   */
  async setupEntitySubscriptions() {
    const entityIds = this.getEntityIds();

    for (const entityId of entityIds) {
      // Subscribe to entity state changes
      this.core.systemsManager.subscribeToEntity(entityId, this.onStateChange);
      this.subscriptions.add(entityId);

      // Store initial entity state
      const state = this.core.systemsManager.getEntityState(entityId);
      if (state) {
        this.entities.set(entityId, state);
      } else {
        lcardsLog.warn(`[StandaloneOverlayCard] Entity not found: ${entityId}`);
      }
    }

    lcardsLog.debug(`[StandaloneOverlayCard] Setup subscriptions for ${entityIds.length} entities`);
  }

  /**
   * Initialize renderer (shadow DOM, etc.)
   * @private
   */
  async initializeRenderer() {
    if (!this.element) {
      throw new Error('No DOM element provided for rendering');
    }

    // Create shadow root for style isolation
    this.shadowRoot = this.element.attachShadow({ mode: 'open' });

    // Add base styles
    const baseStyles = await this.getBaseStyles();
    const styleSheet = document.createElement('style');
    styleSheet.textContent = baseStyles;
    this.shadowRoot.appendChild(styleSheet);

    lcardsLog.debug(`[StandaloneOverlayCard] Initialized renderer: ${this.cardId}`);
  }

  /**
   * Apply initial styling using core systems
   * @private
   */
  async applyInitialStyling() {
    // Apply theme tokens
    const theme = this.config.theme || 'lcars-classic';

    // Get theme tokens from ThemeManager
    const primaryColor = this.core.themeManager.getToken('colors.primary', '#ff6600');
    const secondaryColor = this.core.themeManager.getToken('colors.secondary', '#ffcc00');

    // Apply CSS custom properties
    this.element.style.setProperty('--overlay-primary-color', primaryColor);
    this.element.style.setProperty('--overlay-secondary-color', secondaryColor);

    // Apply base overlay preset from StyleLibrary
    this.core.styleLibrary.applyPreset(this.element, 'overlay-base');

    lcardsLog.debug(`[StandaloneOverlayCard] Applied initial styling: ${this.cardId}`);
  }

  /**
   * Perform initial render
   * @private
   */
  async performInitialRender() {
    const content = await this.render();
    if (content) {
      this.shadowRoot.innerHTML = '';

      // Re-add styles
      const baseStyles = await this.getBaseStyles();
      const styleSheet = document.createElement('style');
      styleSheet.textContent = baseStyles;
      this.shadowRoot.appendChild(styleSheet);

      // Add content
      if (typeof content === 'string') {
        this.shadowRoot.innerHTML += content;
      } else {
        this.shadowRoot.appendChild(content);
      }
    }

    // Apply entrance animation
    if (this.config.animations?.enabled !== false) {
      const preset = this.config.animations?.preset || 'fade-in';
      const duration = this.config.animations?.duration || 300;

      try {
        await this.core.animationManager.playAnimation(
          this.cardId,
          preset,
          this.element,
          { duration }
        );
      } catch (animError) {
        lcardsLog.warn(`[StandaloneOverlayCard] Animation failed: ${animError.message}`);
      }
    }
  }

  /**
   * Handle entity state changes
   * @private
   */
  async onStateChange(entityId, newState, oldState) {
    if (!this.initialized || this.destroyed) return;

    // Update entity cache
    this.entities.set(entityId, newState);

    lcardsLog.debug(`[StandaloneOverlayCard] Entity state changed: ${entityId}`, {
      old: oldState?.state,
      new: newState?.state
    });

    // Trigger update
    await this.update(entityId, newState, oldState);
  }

  /**
   * Handle configuration updates
   * @private
   */
  async onConfigUpdate(newConfig) {
    if (!this.initialized || this.destroyed) return;

    const oldConfig = { ...this.config };
    this.config = { ...newConfig };

    lcardsLog.debug(`[StandaloneOverlayCard] Configuration updated: ${this.cardId}`);

    // Trigger config update
    await this.updateConfig(newConfig, oldConfig);
  }

  /**
   * Update the card (override in subclasses)
   * @protected
   */
  async update(entityId, newState, oldState) {
    // Default implementation - re-render
    await this.performInitialRender();
  }

  /**
   * Update configuration (override in subclasses)
   * @protected
   */
  async updateConfig(newConfig, oldConfig) {
    // Default implementation - re-initialize
    await this.destroy();
    await this.initialize(this.hass, newConfig, this.element);
  }

  /**
   * Render the card content (override in subclasses)
   * @protected
   * @returns {string|HTMLElement} Rendered content
   */
  async render() {
    return `
      <div class="overlay-card">
        <div class="overlay-header">
          <h3>${this.config.name || 'Overlay Card'}</h3>
        </div>
        <div class="overlay-content">
          <p>Base overlay card - override render() method</p>
        </div>
      </div>
    `;
  }

  /**
   * Get base styles for the card
   * @protected
   */
  async getBaseStyles() {
    return `
      :host {
        display: block;
        position: relative;
        font-family: 'LCARS', 'Arial Narrow', monospace;
        color: var(--overlay-primary-color, #ff6600);
        background: transparent;
      }

      .overlay-card {
        background: rgba(0, 20, 40, 0.9);
        border: 2px solid var(--overlay-primary-color, #ff6600);
        border-radius: 8px;
        padding: 12px;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 16px rgba(255, 102, 0, 0.3);
      }

      .overlay-header {
        border-bottom: 1px solid var(--overlay-secondary-color, #ffcc00);
        padding-bottom: 8px;
        margin-bottom: 12px;
      }

      .overlay-header h3 {
        margin: 0;
        font-size: 1.1em;
        color: var(--overlay-secondary-color, #ffcc00);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .overlay-content {
        line-height: 1.4;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .overlay-card {
          padding: 8px;
        }

        .overlay-header h3 {
          font-size: 1em;
        }
      }
    `;
  }

  /**
   * Get entity IDs for this card
   * @returns {string[]} Array of entity IDs
   */
  getEntityIds() {
    const ids = [];

    if (this.config.entity) {
      ids.push(this.config.entity);
    }

    if (this.config.entities) {
      ids.push(...this.config.entities);
    }

    return ids;
  }

  /**
   * Get current state for an entity
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Entity state
   */
  getEntityState(entityId) {
    return this.entities.get(entityId) || this.core.systemsManager.getEntityState(entityId);
  }

  /**
   * Call a service
   * @param {string} domain - Service domain
   * @param {string} service - Service name
   * @param {Object} serviceData - Service data
   * @returns {Promise<void>}
   */
  async callService(domain, service, serviceData = {}) {
    if (!this.hass) {
      throw new Error('HASS not available');
    }

    try {
      await this.hass.callService(domain, service, serviceData);
      lcardsLog.debug(`[StandaloneOverlayCard] Service called: ${domain}.${service}`, serviceData);
    } catch (error) {
      lcardsLog.error(`[StandaloneOverlayCard] Service call failed: ${domain}.${service}`, error);
      throw error;
    }
  }

  /**
   * Post-initialization hook (override in subclasses)
   * @protected
   */
  async onInitialized() {
    // Override in subclasses
  }

  /**
   * Pre-destruction hook (override in subclasses)
   * @protected
   */
  async onDestroy() {
    // Override in subclasses
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      cardId: this.cardId,
      initialized: this.initialized,
      destroyed: this.destroyed,
      type: this.config?.type,
      entityCount: this.entities.size,
      subscriptionCount: this.subscriptions.size,
      hasElement: !!this.element,
      hasShadowRoot: !!this.shadowRoot,
      coreAvailable: !!this.core,
      contextRegistered: !!this.context,
      animContextRegistered: !!this.animContext
    };
  }

  /**
   * Destroy the card and cleanup resources
   */
  async destroy() {
    if (this.destroyed) return;

    lcardsLog.debug(`[StandaloneOverlayCard] Destroying card: ${this.cardId}`);

    try {
      // Call pre-destruction hook
      await this.onDestroy();

      // Cleanup entity subscriptions
      for (const entityId of this.subscriptions) {
        // Note: In a full implementation, we'd need unsubscribe methods
        // For now, we'll just clear our local tracking
      }
      this.subscriptions.clear();

      // Unregister from core systems
      if (this.core) {
        if (this.context) {
          this.core.systemsManager.unregisterCard(this.cardId);
        }
        if (this.animContext) {
          this.core.animationManager.unregisterCard(this.cardId);
        }
      }

      // Clear DOM
      if (this.shadowRoot) {
        this.shadowRoot.innerHTML = '';
      }
      if (this.element) {
        this.element.innerHTML = '';
      }

      // Clear references
      this.entities.clear();
      this.context = null;
      this.animContext = null;
      this.core = null;
      this.hass = null;
      this.config = null;
      this.element = null;
      this.shadowRoot = null;

      this.destroyed = true;
      this.initialized = false;

      lcardsLog.info(`[StandaloneOverlayCard] ✅ Destroyed card: ${this.cardId}`);

    } catch (error) {
      lcardsLog.error(`[StandaloneOverlayCard] ❌ Error during destruction: ${this.cardId}`, error);
      throw error;
    }
  }
}