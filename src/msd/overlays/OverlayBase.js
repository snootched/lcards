/**
 * OverlayBase - Base class for all MSD overlay renderers
 *
 * Provides instance-based lifecycle management for overlays:
 * - initialize: Store the mount element
 * - render: Generate SVG markup (a data change re-renders the card)
 * - computeAttachmentPoints: For line anchoring
 * - destroy: Cleanup resources
 *
 * Extends BaseRenderer to inherit:
 * - Theme management
 * - Style resolution
 * - Default value handling
 * - Provenance tracking
 *
 * @module msd/overlays/OverlayBase
 */

import { BaseRenderer } from '../renderer/BaseRenderer.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Base class for all overlay instances
 * @extends BaseRenderer
 */
export class OverlayBase extends BaseRenderer {
  /**
   * Create an overlay instance
   *
   * @param {Object} overlay - Overlay configuration
   * @param {Object} coordinator - Reference to MsdCardCoordinator for accessing subsystems
   */
  constructor(overlay, coordinator) {
    super();

    // Set renderer name for logging
    this.rendererName = this.constructor.name || 'OverlayBase';

    // Core properties
    this.overlay = overlay;
    this.systems = coordinator;
    this.element = null;
    this.mountEl = null;

    // Lifecycle state
    this._initialized = false;
    this._destroyed = false;

    // Resource management
    this._subscriptions = [];
    this._timers = [];

    // Performance tracking
    this._stats = {
      renderCount: 0,
      lastRender: null
    };

    lcardsLog.trace(`[${this.rendererName}] Instance created for overlay:`, overlay.id);
  }

  /**
   * Initialize overlay instance
   * Called once when overlay is first created
   *
   * Stores the mount element. Overlays have no data subscriptions of their own:
   * a change re-renders the card (rules, HASS), controls update their cards.
   *
   * @param {Element} mountEl - Mount element (shadowRoot or container)
   * @returns {Promise<void>}
   */
  async initialize(mountEl) {
    if (this._initialized) {
      lcardsLog.warn(`[${this.rendererName}] Already initialized:`, this.overlay.id);
      return;
    }

    this.mountEl = mountEl;

    lcardsLog.trace(`[${this.rendererName}] Initializing overlay:`, this.overlay.id);

    this._initialized = true;
    lcardsLog.trace(`[${this.rendererName}] Initialization complete:`, this.overlay.id);
  }

  /**
   * Render overlay (returns markup string)
   *
   * Must be implemented by subclasses
   *
   * @abstract
   * @param {Object} overlay - Overlay configuration
   * @param {Object} anchors - Available anchors
   * @param {Array} viewBox - ViewBox dimensions [x, y, width, height]
   * @param {Element} svgContainer - SVG container element
   * @param {Object} cardInstance - Card instance for actions
   * @returns {string} SVG markup
   * @throws {Error} If not implemented by subclass
   */
  render(overlay, anchors, viewBox, svgContainer, cardInstance = null) {
    throw new Error(`${this.rendererName}.render() must be implemented by subclass`);
  }

  /**
   * Compute attachment points for line anchoring
   *
   * Override in subclasses that support line attachment
   *
   * @param {Object} overlay - Overlay config
   * @param {Object} anchors - Available anchors
   * @param {Element} container - Container element
   * @param {Array} viewBox - ViewBox dimensions
   * @returns {Object|null} Attachment points or null
   */
  computeAttachmentPoints(overlay, anchors, container, viewBox) {
    // Default: no attachment points
    return null;
  }

  /**
   * Cleanup overlay resources
   *
   * Cleans up:
   * - Registered subscriptions
   * - Animation scopes
   * - Timers
   * - Event listeners
   */
  destroy() {
    if (this._destroyed) {
      lcardsLog.warn(`[${this.rendererName}] Already destroyed:`, this.overlay.id);
      return;
    }

    lcardsLog.trace(`[${this.rendererName}] Destroying overlay:`, this.overlay.id);

    // Cleanup subscriptions
    this._cleanupSubscriptions();

    // Cleanup timers
    this._cleanupTimers();

    // Clear element reference
    this.element = null;
    this.mountEl = null;

    this._destroyed = true;

    lcardsLog.trace(`[${this.rendererName}] Destruction complete:`, this.overlay.id);
  }

  // ============================================================
  // Protected Methods (for subclass use)
  // ============================================================

  /**
   * Register subscription for cleanup
   * @protected
   */
  _registerSubscription(unsubscribe) {
    if (typeof unsubscribe === 'function') {
      this._subscriptions.push(unsubscribe);
    }
  }

  /**
   * Register timer for cleanup
   * @protected
   */
  _registerTimer(timerId) {
    this._timers.push(timerId);
  }

  /**
   * Cleanup all subscriptions
   * @protected
   */
  _cleanupSubscriptions() {
    if (this._subscriptions.length > 0) {
      lcardsLog.trace(`[${this.rendererName}] Cleaning up ${this._subscriptions.length} subscriptions`);

      this._subscriptions.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          lcardsLog.warn(`[${this.rendererName}] Subscription cleanup error:`, error);
        }
      });

      this._subscriptions = [];
    }
  }

  /**
   * Cleanup timers
   * @protected
   */
  _cleanupTimers() {
    if (this._timers.length > 0) {
      lcardsLog.trace(`[${this.rendererName}] Cleaning up ${this._timers.length} timers`);

      this._timers.forEach(timerId => {
        try {
          clearTimeout(timerId);
          clearInterval(timerId);
        } catch (error) {
          lcardsLog.warn(`[${this.rendererName}] Timer cleanup error:`, error);
        }
      });

      this._timers = [];
    }
  }

  /**
   * Get overlay statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this._stats,
      initialized: this._initialized,
      destroyed: this._destroyed,
      subscriptions: this._subscriptions.length,
      timers: this._timers.length
    };
  }

  /**
   * Get the default animation target for this overlay type
   * Subclasses should override to provide smart defaults
   *
   * Examples:
   * - TextOverlay: Returns the <text> element (not the wrapper)
   * - ButtonOverlay: Returns the entire button group
   * - LineOverlay: Returns the <line> or <path> element
   *
   * @returns {Element|null} The element to animate by default (null before render)
   */
  getDefaultAnimationTarget() {
    // Base implementation: return the root element
    return this.element;
  }

  /**
   * Get a specific animation target within this overlay
   *
   * Supports:
   * - 'overlay' or 'self' - The root overlay element
   * - 'label', 'content', etc. - Named sub-elements (overlay-specific)
   * - 'texts[n]' - Array index syntax (overlay-specific)
   * - CSS selector - Any valid selector (queried within overlay)
   *
   * @param {string} targetSpec - Target specification
   * @returns {Element|null} The target element or null if not found
   */
  getAnimationTarget(targetSpec) {
    // No spec or explicit self-reference = root element
    if (!targetSpec || targetSpec === 'overlay' || targetSpec === 'self') {
      return this.element;
    }

    // Try CSS selector within this overlay's element
    if (this.element) {
      try {
        return this.element.querySelector(targetSpec);
      } catch (error) {
        lcardsLog.warn(
          `[${this.rendererName}] Invalid target selector "${targetSpec}":`,
          error
        );
        return null;
      }
    }

    return null;
  }
}

// Export for use by overlay subclasses
export default OverlayBase;
