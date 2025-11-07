/**
 * StatusOverlay - LCARS-style entity status indicator overlay
 *
 * A lightweight standalone overlay card that displays entity status with
 * authentic LCARS styling. Shows real-time status updates with color-coded
 * indicators and smooth animations.
 *
 * Features:
 * - Real-time entity status display
 * - Color-coded status indicators
 * - Compact, non-intrusive design
 * - Support for multiple entity types
 * - Animated state transitions
 * - LCARS-authentic styling
 *
 * @author LCARdS Development Team
 * @version 2.0.0
 * @since Phase 2b
 */

import { StandaloneOverlayCard, BASE_OVERLAY_SCHEMA } from '../base/StandaloneOverlayCard.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Configuration schema for StatusOverlay
 */
export const STATUS_OVERLAY_SCHEMA = {
  ...BASE_OVERLAY_SCHEMA,
  required: [...BASE_OVERLAY_SCHEMA.required, 'entity'],
  properties: {
    ...BASE_OVERLAY_SCHEMA.properties,

    // StatusOverlay specific properties
    display_mode: {
      type: 'string',
      enum: ['compact', 'detailed', 'minimal'],
      default: 'compact',
      description: 'Display mode for the status indicator'
    },

    show_name: {
      type: 'boolean',
      default: true,
      description: 'Show entity friendly name'
    },

    show_icon: {
      type: 'boolean',
      default: true,
      description: 'Show entity icon'
    },

    show_state: {
      type: 'boolean',
      default: true,
      description: 'Show entity state'
    },

    show_last_changed: {
      type: 'boolean',
      default: false,
      description: 'Show last changed timestamp'
    },

    status_colors: {
      type: 'object',
      properties: {
        on: { type: 'string', default: '#00ff00' },
        off: { type: 'string', default: '#666666' },
        unavailable: { type: 'string', default: '#ff0000' },
        unknown: { type: 'string', default: '#ffaa00' }
      },
      description: 'Custom colors for different states'
    },

    compact_size: {
      type: 'string',
      enum: ['small', 'medium', 'large'],
      default: 'medium',
      description: 'Size when in compact mode'
    },

    pulse_animation: {
      type: 'boolean',
      default: false,
      description: 'Enable pulsing animation for active states'
    }
  }
};

/**
 * StatusOverlay component - LCARS entity status display
 */
export class StatusOverlay extends StandaloneOverlayCard {
  constructor() {
    super();

    // StatusOverlay specific state
    this.currentState = null;
    this.statusColor = '#666666';
    this.entityIcon = 'mdi:help-circle';
    this.lastUpdateTime = null;

    lcardsLog.debug(`[StatusOverlay] Created status overlay: ${this.cardId}`);
  }

  /**
   * Custom validation for StatusOverlay
   * @protected
   */
  async validateCustomConfiguration(config) {
    const errors = [];
    const warnings = [];

    // Validate required entity
    if (!config.entity) {
      errors.push('StatusOverlay requires an entity property');
    }

    // Validate display mode
    if (config.display_mode && !['compact', 'detailed', 'minimal'].includes(config.display_mode)) {
      errors.push('display_mode must be one of: compact, detailed, minimal');
    }

    // Validate status colors
    if (config.status_colors) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.entries(config.status_colors).forEach(([state, color]) => {
        if (typeof color === 'string' && !colorRegex.test(color)) {
          warnings.push(`Invalid color format for state '${state}': ${color}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Post-initialization setup
   * @protected
   */
  async onInitialized() {
    // Get initial entity state and update status
    const entityState = this.getEntityState(this.config.entity);
    if (entityState) {
      await this.updateStatus(entityState);
    }

    // Setup periodic refresh if needed
    if (this.config.update_interval && this.config.update_interval > 0) {
      setInterval(() => {
        this.refreshStatus();
      }, this.config.update_interval);
    }

    lcardsLog.debug(`[StatusOverlay] Initialized with entity: ${this.config.entity}`);
  }

  /**
   * Handle entity state updates
   * @protected
   */
  async update(entityId, newState, oldState) {
    if (entityId === this.config.entity) {
      await this.updateStatus(newState);

      // Animate state change if enabled
      if (this.config.animations?.enabled !== false && oldState && oldState.state !== newState.state) {
        await this.animateStateChange();
      }

      // Re-render with new state
      await this.performInitialRender();
    }
  }

  /**
   * Update status information from entity state
   * @private
   */
  async updateStatus(entityState) {
    if (!entityState) return;

    this.currentState = entityState;
    this.lastUpdateTime = new Date();

    // Determine status color based on state
    this.statusColor = this.getStatusColor(entityState.state);

    // Get entity icon
    this.entityIcon = this.getEntityIcon(entityState);

    lcardsLog.debug(`[StatusOverlay] Status updated: ${this.config.entity} -> ${entityState.state}`);
  }

  /**
   * Get status color for a given state
   * @private
   */
  getStatusColor(state) {
    const colors = {
      on: '#00ff00',
      off: '#666666',
      unavailable: '#ff0000',
      unknown: '#ffaa00',
      ...this.config.status_colors
    };

    // Map common states
    const stateMap = {
      'on': 'on',
      'off': 'off',
      'home': 'on',
      'not_home': 'off',
      'open': 'on',
      'closed': 'off',
      'available': 'on',
      'unavailable': 'unavailable',
      'unknown': 'unknown'
    };

    const mappedState = stateMap[state?.toLowerCase()] || 'unknown';
    return colors[mappedState] || colors.unknown;
  }

  /**
   * Get entity icon from state or config
   * @private
   */
  getEntityIcon(entityState) {
    // Use entity attributes icon if available
    if (entityState.attributes?.icon) {
      return entityState.attributes.icon;
    }

    // Fallback based on entity domain
    const domain = entityState.entity_id?.split('.')[0];
    const iconMap = {
      light: 'mdi:lightbulb',
      switch: 'mdi:toggle-switch',
      sensor: 'mdi:gauge',
      binary_sensor: 'mdi:checkbox-marked-circle',
      device_tracker: 'mdi:account',
      person: 'mdi:account',
      lock: 'mdi:lock',
      cover: 'mdi:window-shutter',
      climate: 'mdi:thermostat',
      fan: 'mdi:fan',
      camera: 'mdi:camera'
    };

    return iconMap[domain] || 'mdi:help-circle';
  }

  /**
   * Animate state change
   * @private
   */
  async animateStateChange() {
    try {
      // Flash effect for state changes
      await this.core.animationManager.playAnimation(
        this.cardId,
        'flash',
        this.element,
        {
          duration: 200,
          easing: 'easeOutQuad'
        }
      );
    } catch (error) {
      lcardsLog.warn(`[StatusOverlay] Animation failed: ${error.message}`);
    }
  }

  /**
   * Refresh status from current entity state
   * @private
   */
  refreshStatus() {
    const entityState = this.getEntityState(this.config.entity);
    if (entityState) {
      this.updateStatus(entityState);
      this.performInitialRender();
    }
  }

  /**
   * Render the StatusOverlay content
   * @protected
   */
  async render() {
    const displayMode = this.config.display_mode || 'compact';

    switch (displayMode) {
      case 'minimal':
        return this.renderMinimal();
      case 'detailed':
        return this.renderDetailed();
      case 'compact':
      default:
        return this.renderCompact();
    }
  }

  /**
   * Render minimal mode
   * @private
   */
  renderMinimal() {
    const state = this.currentState?.state || 'unknown';

    return `
      <div class="status-overlay status-minimal">
        <div class="status-indicator" style="background-color: ${this.statusColor}">
          <span class="status-state">${state}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render compact mode
   * @private
   */
  renderCompact() {
    const entityName = this.config.name ||
                     this.currentState?.attributes?.friendly_name ||
                     this.config.entity;
    const state = this.currentState?.state || 'unknown';
    const showIcon = this.config.show_icon !== false;
    const showName = this.config.show_name !== false;
    const showState = this.config.show_state !== false;

    return `
      <div class="status-overlay status-compact ${this.config.compact_size || 'medium'}">
        <div class="status-indicator" style="border-left-color: ${this.statusColor}">
          ${showIcon ? `<i class="status-icon ${this.entityIcon}"></i>` : ''}
          <div class="status-content">
            ${showName ? `<div class="status-name">${entityName}</div>` : ''}
            ${showState ? `<div class="status-state">${state}</div>` : ''}
          </div>
          <div class="status-pulse ${this.config.pulse_animation && (state === 'on' || state === 'home') ? 'active' : ''}"
               style="background-color: ${this.statusColor}"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render detailed mode
   * @private
   */
  renderDetailed() {
    const entityName = this.config.name ||
                     this.currentState?.attributes?.friendly_name ||
                     this.config.entity;
    const state = this.currentState?.state || 'unknown';
    const lastChanged = this.config.show_last_changed && this.currentState?.last_changed;
    const attributes = this.currentState?.attributes || {};

    // Format last changed time
    const lastChangedText = lastChanged ?
      new Date(lastChanged).toLocaleString() : '';

    return `
      <div class="status-overlay status-detailed">
        <div class="status-header">
          <i class="status-icon ${this.entityIcon}"></i>
          <div class="status-title">
            <div class="status-name">${entityName}</div>
            <div class="status-entity-id">${this.config.entity}</div>
          </div>
          <div class="status-indicator-dot" style="background-color: ${this.statusColor}"></div>
        </div>

        <div class="status-body">
          <div class="status-main">
            <span class="status-label">State:</span>
            <span class="status-value" style="color: ${this.statusColor}">${state}</span>
          </div>

          ${Object.keys(attributes).length > 0 ? `
            <div class="status-attributes">
              ${Object.entries(attributes)
                .filter(([key]) => !key.startsWith('_') && key !== 'friendly_name' && key !== 'icon')
                .slice(0, 3)
                .map(([key, value]) => `
                  <div class="status-attribute">
                    <span class="attribute-key">${key}:</span>
                    <span class="attribute-value">${value}</span>
                  </div>
                `).join('')}
            </div>
          ` : ''}

          ${lastChangedText ? `
            <div class="status-timestamp">
              <span class="timestamp-label">Updated:</span>
              <span class="timestamp-value">${lastChangedText}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get custom styles for StatusOverlay
   * @protected
   */
  async getBaseStyles() {
    const baseStyles = await super.getBaseStyles();

    return baseStyles + `
      /* StatusOverlay Specific Styles */
      .status-overlay {
        font-family: 'LCARS', 'Arial Narrow', monospace;
        color: var(--overlay-primary-color, #ff6600);
      }

      /* Minimal Mode */
      .status-minimal {
        display: inline-block;
      }

      .status-minimal .status-indicator {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.9em;
        font-weight: bold;
        text-transform: uppercase;
        color: #000;
        min-width: 60px;
        text-align: center;
      }

      /* Compact Mode */
      .status-compact .status-indicator {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: rgba(0, 20, 40, 0.9);
        border: 1px solid var(--overlay-primary-color, #ff6600);
        border-left: 4px solid;
        border-radius: 0 8px 8px 0;
        position: relative;
        backdrop-filter: blur(4px);
        transition: all 0.3s ease;
      }

      .status-compact:hover .status-indicator {
        background: rgba(0, 30, 60, 0.95);
        transform: translateX(2px);
      }

      .status-compact .status-icon {
        font-size: 1.2em;
        margin-right: 8px;
        opacity: 0.8;
      }

      .status-compact .status-content {
        flex: 1;
      }

      .status-compact .status-name {
        font-size: 0.9em;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }

      .status-compact .status-state {
        font-size: 0.8em;
        opacity: 0.8;
        text-transform: capitalize;
      }

      .status-compact .status-pulse {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .status-compact .status-pulse.active {
        opacity: 1;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
        50% { opacity: 0.5; transform: translateY(-50%) scale(1.2); }
      }

      /* Size Variations */
      .status-compact.small {
        font-size: 0.8em;
      }

      .status-compact.small .status-indicator {
        padding: 6px 8px;
      }

      .status-compact.large {
        font-size: 1.1em;
      }

      .status-compact.large .status-indicator {
        padding: 10px 16px;
      }

      /* Detailed Mode */
      .status-detailed {
        background: rgba(0, 20, 40, 0.95);
        border: 2px solid var(--overlay-primary-color, #ff6600);
        border-radius: 8px;
        padding: 16px;
        backdrop-filter: blur(6px);
        box-shadow: 0 6px 20px rgba(255, 102, 0, 0.2);
      }

      .status-detailed .status-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--overlay-secondary-color, #ffcc00);
      }

      .status-detailed .status-icon {
        font-size: 1.5em;
        margin-right: 12px;
        color: var(--overlay-secondary-color, #ffcc00);
      }

      .status-detailed .status-title {
        flex: 1;
      }

      .status-detailed .status-name {
        font-size: 1.1em;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--overlay-secondary-color, #ffcc00);
      }

      .status-detailed .status-entity-id {
        font-size: 0.8em;
        opacity: 0.7;
        font-family: monospace;
      }

      .status-detailed .status-indicator-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--overlay-primary-color, #ff6600);
        animation: pulse 2s infinite;
      }

      .status-detailed .status-body {
        line-height: 1.6;
      }

      .status-detailed .status-main {
        margin-bottom: 12px;
        font-size: 1.1em;
      }

      .status-detailed .status-label {
        font-weight: bold;
        margin-right: 8px;
      }

      .status-detailed .status-value {
        text-transform: capitalize;
        font-weight: bold;
      }

      .status-detailed .status-attributes {
        background: rgba(0, 10, 20, 0.5);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 12px;
      }

      .status-detailed .status-attribute {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 0.9em;
      }

      .status-detailed .attribute-key {
        opacity: 0.8;
        text-transform: capitalize;
      }

      .status-detailed .attribute-value {
        font-weight: bold;
      }

      .status-detailed .status-timestamp {
        font-size: 0.8em;
        opacity: 0.7;
        text-align: right;
      }

      .status-detailed .timestamp-label {
        margin-right: 4px;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .status-compact .status-indicator {
          padding: 6px 10px;
        }

        .status-detailed {
          padding: 12px;
        }

        .status-detailed .status-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .status-detailed .status-icon {
          margin-bottom: 8px;
        }
      }
    `;
  }
}

// Export for module loading
export default StatusOverlay;