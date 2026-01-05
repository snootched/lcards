import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * HudService - Keyboard shortcut and UI service for HUD
 * 
 * Manages keyboard shortcuts for HUD toggling and provides
 * UI utilities for HUD rendering and interaction.
 * 
 * Default shortcut: Alt+Shift+U (configurable via localStorage)
 * 
 * @module core/hud/HudService
 */
export class HudService {
  constructor(hudManager) {
    this.hudManager = hudManager;
    this.shortcut = this._loadShortcut();
    this.keyboardListenerAttached = false;

    lcardsLog.debug('[HudService] 🚀 HUD Service initialized');
  }

  /**
   * Initialize service (setup keyboard listeners)
   */
  initialize() {
    this._setupKeyboardListener();
    lcardsLog.debug('[HudService] ✅ HUD Service ready');
  }

  /**
   * Load shortcut configuration from localStorage
   * @private
   */
  _loadShortcut() {
    try {
      const stored = localStorage.getItem('lcards.hud.shortcut');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      lcardsLog.warn('[HudService] ⚠️ Failed to load shortcut config:', error);
    }

    // Default: Alt+Shift+U
    return { 
      alt: true, 
      shift: true, 
      ctrl: false,
      meta: false,
      key: 'u' 
    };
  }

  /**
   * Save shortcut configuration to localStorage
   * @private
   */
  _saveShortcut() {
    try {
      localStorage.setItem('lcards.hud.shortcut', JSON.stringify(this.shortcut));
      lcardsLog.debug('[HudService] 💾 Shortcut config saved:', this.shortcut);
    } catch (error) {
      lcardsLog.warn('[HudService] ⚠️ Failed to save shortcut config:', error);
    }
  }

  /**
   * Setup keyboard event listener
   * @private
   */
  _setupKeyboardListener() {
    if (this.keyboardListenerAttached) {
      lcardsLog.debug('[HudService] ⚠️ Keyboard listener already attached');
      return;
    }

    const handler = (e) => {
      const { alt, shift, ctrl, meta, key } = this.shortcut;

      // Check if keyboard shortcut matches
      if (
        e.altKey === (alt || false) &&
        e.shiftKey === (shift || false) &&
        e.ctrlKey === (ctrl || false) &&
        e.metaKey === (meta || false) &&
        e.key.toLowerCase() === key.toLowerCase()
      ) {
        e.preventDefault();
        e.stopPropagation();

        lcardsLog.debug('[HudService] ⌨️ HUD shortcut triggered');
        this.hudManager.toggle();
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    this.keyboardListenerAttached = true;

    lcardsLog.debug(
      '[HudService] ⌨️ Keyboard shortcut registered:',
      this._getShortcutDescription()
    );
  }

  /**
   * Get human-readable shortcut description
   * @private
   */
  _getShortcutDescription() {
    const parts = [];
    if (this.shortcut.ctrl) parts.push('Ctrl');
    if (this.shortcut.alt) parts.push('Alt');
    if (this.shortcut.shift) parts.push('Shift');
    if (this.shortcut.meta) parts.push('Meta');
    parts.push(this.shortcut.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * Set custom keyboard shortcut
   * @param {Object} config - Shortcut configuration
   * @param {boolean} config.alt - Alt key
   * @param {boolean} config.shift - Shift key
   * @param {boolean} config.ctrl - Ctrl key
   * @param {boolean} config.meta - Meta/Command key
   * @param {string} config.key - Key character
   */
  setShortcut(config) {
    if (!config || typeof config !== 'object') {
      lcardsLog.warn('[HudService] ⚠️ Invalid shortcut config:', config);
      return;
    }

    const { alt, shift, ctrl, meta, key } = config;

    // Validate key
    if (!key || typeof key !== 'string' || key.length === 0) {
      lcardsLog.warn('[HudService] ⚠️ Invalid key:', key);
      return;
    }

    // Update shortcut
    this.shortcut = {
      alt: !!alt,
      shift: !!shift,
      ctrl: !!ctrl,
      meta: !!meta,
      key: key.toLowerCase()
    };

    // Save to localStorage
    this._saveShortcut();

    lcardsLog.info(
      '[HudService] ✅ Shortcut updated:',
      this._getShortcutDescription()
    );
  }

  /**
   * Get current shortcut configuration
   * @returns {Object} Shortcut config
   */
  getShortcut() {
    return { ...this.shortcut };
  }

  /**
   * Get shortcut description
   * @returns {string} Human-readable shortcut
   */
  getShortcutDescription() {
    return this._getShortcutDescription();
  }

  /**
   * Cleanup service resources
   */
  destroy() {
    // Note: We don't remove the keyboard listener as it's global
    // and should persist for the session
    lcardsLog.debug('[HudService] 🗑️ HUD Service destroyed');
  }
}
