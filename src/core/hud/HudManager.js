import { lcardsLog } from '../../utils/lcards-logging.js';
import { HudEventBus, SelectionManager } from './HudEventBus.js';

/**
 * HudManager - Global HUD coordination singleton
 * 
 * Manages the global HUD overlay system for runtime debugging across all LCARdS cards.
 * Provides panel registration, card registration, and rendering coordination.
 * 
 * Features:
 * - Global panel registry (core + card-specific panels)
 * - Card registration with context
 * - Multi-card dashboard support
 * - Panel selection UI
 * - Event bus for panel coordination
 * 
 * @module core/hud/HudManager
 */
export class HudManager {
  constructor() {
    // Event system
    this.bus = new HudEventBus();
    this.selection = new SelectionManager(this.bus);

    // Registries
    this.panels = new Map();  // panelId → panelInstance
    this.cards = new Map();   // cardGuid → cardContext

    // HUD state
    this.state = {
      visible: false,
      activeCard: null,      // Which card is being inspected (for multi-card dashboards)
      activePanel: null,     // Which panel is currently displayed
      position: { x: 20, y: 20 },
      size: { width: 420, height: 600 },
      fontSize: 14,
      fontFamily: '"Antonio", monospace',
      scale: 1.0
    };

    // UI state
    this.hudElement = null;
    this.refreshInterval = null;
    this.refreshRate = 2000; // ms

    // Bind methods
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.toggle = this.toggle.bind(this);
    this.refresh = this.refresh.bind(this);

    // Setup global helper (backward compatibility with MSD panels)
    window.__msdHudBus = (evt, payload) => this.bus.emit(evt, payload || {});

    lcardsLog.debug('[HudManager] 🚀 Global HUD Manager initialized');
  }

  /**
   * Register a panel with the HUD
   * @param {string} panelId - Unique panel identifier
   * @param {Object} panelInstance - Panel instance with required methods
   */
  registerPanel(panelId, panelInstance) {
    if (!panelInstance) {
      lcardsLog.warn(`[HudManager] ⚠️ Cannot register null panel: ${panelId}`);
      return;
    }

    // Validate panel interface
    if (typeof panelInstance.renderHtml !== 'function') {
      lcardsLog.warn(`[HudManager] ⚠️ Panel ${panelId} missing renderHtml() method`);
    }

    this.panels.set(panelId, panelInstance);
    
    // Provide bus reference to panel (optional)
    if (panelInstance && typeof panelInstance === 'object') {
      panelInstance.bus = this.bus;
    }

    lcardsLog.debug(`[HudManager] 📊 Registered panel: ${panelId}`);

    // Set as active panel if first registration
    if (!this.state.activePanel && this.panels.size === 1) {
      this.state.activePanel = panelId;
    }
  }

  /**
   * Unregister a panel
   * @param {string} panelId - Panel identifier
   */
  unregisterPanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel && typeof panel.destroy === 'function') {
      panel.destroy();
    }
    
    this.panels.delete(panelId);
    lcardsLog.debug(`[HudManager] 🗑️ Unregistered panel: ${panelId}`);

    // Switch to another panel if this was active
    if (this.state.activePanel === panelId) {
      const firstPanel = this.panels.keys().next().value;
      this.state.activePanel = firstPanel || null;
    }
  }

  /**
   * Register a card with the HUD
   * @param {string} cardGuid - Unique card identifier
   * @param {Object} cardContext - Card context object
   */
  registerCard(cardGuid, cardContext) {
    if (!cardGuid) {
      lcardsLog.warn('[HudManager] ⚠️ Cannot register card without GUID');
      return;
    }

    this.cards.set(cardGuid, cardContext);
    lcardsLog.debug(`[HudManager] 🃏 Registered card: ${cardGuid} (${cardContext.type || 'unknown'})`);

    // Register card-specific panels
    if (cardContext.panels && cardContext.panels instanceof Map) {
      cardContext.panels.forEach((panel, panelId) => {
        const fullPanelId = `${cardGuid}:${panelId}`;
        this.registerPanel(fullPanelId, panel);
      });
    }

    // Set as active card if first registration
    if (!this.state.activeCard && this.cards.size === 1) {
      this.state.activeCard = cardGuid;
    }

    // Refresh HUD if visible
    if (this.state.visible) {
      this.refresh();
    }
  }

  /**
   * Unregister a card and its panels
   * @param {string} cardGuid - Card identifier
   */
  unregisterCard(cardGuid) {
    const cardContext = this.cards.get(cardGuid);
    
    // Unregister card-specific panels
    if (cardContext?.panels) {
      cardContext.panels.forEach((_, panelId) => {
        this.unregisterPanel(`${cardGuid}:${panelId}`);
      });
    }

    this.cards.delete(cardGuid);
    lcardsLog.debug(`[HudManager] 🗑️ Unregistered card: ${cardGuid}`);

    // Switch to another card if this was active
    if (this.state.activeCard === cardGuid) {
      const firstCard = this.cards.keys().next().value;
      this.state.activeCard = firstCard || null;
    }

    // Refresh HUD if visible
    if (this.state.visible) {
      this.refresh();
    }
  }

  /**
   * Set active panel
   * @param {string} panelId - Panel identifier
   */
  setActivePanel(panelId) {
    if (!this.panels.has(panelId)) {
      lcardsLog.warn(`[HudManager] ⚠️ Panel not found: ${panelId}`);
      return;
    }

    this.state.activePanel = panelId;
    lcardsLog.debug(`[HudManager] 🎯 Active panel: ${panelId}`);

    if (this.state.visible) {
      this.refresh();
    }
  }

  /**
   * Set active card
   * @param {string} cardGuid - Card identifier
   */
  setActiveCard(cardGuid) {
    if (!this.cards.has(cardGuid)) {
      lcardsLog.warn(`[HudManager] ⚠️ Card not found: ${cardGuid}`);
      return;
    }

    this.state.activeCard = cardGuid;
    lcardsLog.debug(`[HudManager] 🃏 Active card: ${cardGuid}`);

    // Switch to appropriate panel for this card
    // If current panel is card-specific and doesn't belong to new card, switch to first global panel
    if (this.state.activePanel?.includes(':')) {
      const [panelCardGuid] = this.state.activePanel.split(':');
      if (panelCardGuid !== cardGuid) {
        // Find first global panel or first panel for this card
        for (const [panelId] of this.panels) {
          if (!panelId.includes(':') || panelId.startsWith(`${cardGuid}:`)) {
            this.state.activePanel = panelId;
            break;
          }
        }
      }
    }

    if (this.state.visible) {
      this.refresh();
    }
  }

  /**
   * Show the HUD
   */
  show() {
    if (this.state.visible) return;

    this.state.visible = true;
    lcardsLog.debug('[HudManager] 👁️ HUD shown');

    this.render();
    this.startAutoRefresh();
  }

  /**
   * Hide the HUD
   */
  hide() {
    if (!this.state.visible) return;

    this.state.visible = false;
    lcardsLog.debug('[HudManager] 🙈 HUD hidden');

    this.stopAutoRefresh();

    if (this.hudElement) {
      this.hudElement.remove();
      this.hudElement = null;
    }
  }

  /**
   * Toggle HUD visibility
   */
  toggle() {
    if (this.state.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Refresh HUD content
   */
  refresh() {
    if (!this.state.visible) return;
    this.render();
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, this.refreshRate);
    lcardsLog.debug(`[HudManager] ⏱️ Auto-refresh started (${this.refreshRate}ms)`);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      lcardsLog.debug('[HudManager] ⏸️ Auto-refresh stopped');
    }
  }

  /**
   * Set refresh rate
   * @param {number} ms - Refresh interval in milliseconds
   */
  setRefreshRate(ms) {
    this.refreshRate = Math.max(500, Math.min(10000, ms));
    lcardsLog.debug(`[HudManager] ⏱️ Refresh rate: ${this.refreshRate}ms`);
    
    if (this.state.visible) {
      this.startAutoRefresh();
    }
  }

  /**
   * Render the HUD
   */
  render() {
    // Get or create HUD container
    if (!this.hudElement) {
      this.hudElement = this._createHudElement();
      document.body.appendChild(this.hudElement);
    }

    // Build HUD content
    const html = this._buildHudHtml();
    this.hudElement.innerHTML = html;

    // Attach event listeners
    this._attachEventListeners();
  }

  /**
   * Create HUD DOM element
   * @private
   */
  _createHudElement() {
    const el = document.createElement('div');
    el.id = 'lcards-hud';
    el.style.cssText = `
      position: fixed;
      top: ${this.state.position.y}px;
      left: ${this.state.position.x}px;
      width: ${this.state.size.width}px;
      max-height: ${this.state.size.height}px;
      background: rgba(0, 0, 0, 0.95);
      color: #00ffff;
      font-family: ${this.state.fontFamily};
      font-size: ${this.state.fontSize}px;
      border: 2px solid #00ffff;
      border-radius: 8px;
      z-index: 100000;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      transform: scale(${this.state.scale});
      transform-origin: top left;
    `;
    return el;
  }

  /**
   * Build HUD HTML content
   * @private
   */
  _buildHudHtml() {
    let html = '<div class="lcards-hud-container">';

    // Header
    html += this._buildHeader();

    // Card selector (if multiple cards)
    if (this.cards.size > 1) {
      html += this._buildCardSelector();
    }

    // Panel tabs
    html += this._buildPanelTabs();

    // Active panel content
    html += this._buildPanelContent();

    // Footer
    html += this._buildFooter();

    html += '</div>';

    // Add styles
    html += this._buildStyles();

    return html;
  }

  /**
   * Build header HTML
   * @private
   */
  _buildHeader() {
    return `
      <div class="lcards-hud-header">
        <div class="lcards-hud-title">🛠️ LCARdS Debug HUD</div>
        <div class="lcards-hud-controls">
          <button onclick="window.lcards.core.hudManager.hide()">✖</button>
        </div>
      </div>
    `;
  }

  /**
   * Build card selector HTML
   * @private
   */
  _buildCardSelector() {
    return `
      <div class="lcards-hud-card-selector">
        <label>Card:</label>
        <select onchange="window.lcards.core.hudManager.setActiveCard(this.value)">
          ${Array.from(this.cards.entries()).map(([guid, ctx]) => `
            <option value="${guid}" ${this.state.activeCard === guid ? 'selected' : ''}>
              ${ctx.type || 'unknown'} (${guid.substring(0, 8)}...)
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Build panel tabs HTML
   * @private
   */
  _buildPanelTabs() {
    // Get available panels
    const globalPanels = Array.from(this.panels.entries())
      .filter(([id]) => !id.includes(':'));
    
    const cardSpecificPanels = this.state.activeCard
      ? Array.from(this.panels.entries())
          .filter(([id]) => id.startsWith(`${this.state.activeCard}:`))
      : [];

    let html = '<div class="lcards-hud-tabs">';

    // Global panels
    if (globalPanels.length > 0) {
      html += '<div class="lcards-hud-tab-group">';
      globalPanels.forEach(([panelId]) => {
        const label = this._getPanelLabel(panelId);
        const active = this.state.activePanel === panelId ? 'active' : '';
        html += `
          <button 
            class="lcards-hud-tab ${active}"
            onclick="window.lcards.core.hudManager.setActivePanel('${panelId}')">
            ${label}
          </button>
        `;
      });
      html += '</div>';
    }

    // Card-specific panels
    if (cardSpecificPanels.length > 0) {
      html += '<div class="lcards-hud-tab-group card-specific">';
      html += '<div class="lcards-hud-tab-group-label">Card Panels:</div>';
      cardSpecificPanels.forEach(([panelId]) => {
        const label = this._getPanelLabel(panelId);
        const active = this.state.activePanel === panelId ? 'active' : '';
        html += `
          <button 
            class="lcards-hud-tab ${active}"
            onclick="window.lcards.core.hudManager.setActivePanel('${panelId}')">
            ${label}
          </button>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Build panel content HTML
   * @private
   */
  _buildPanelContent() {
    if (!this.state.activePanel) {
      return '<div class="lcards-hud-content">No panel selected</div>';
    }

    const panel = this.panels.get(this.state.activePanel);
    if (!panel) {
      return '<div class="lcards-hud-content">Panel not found</div>';
    }

    let html = '<div class="lcards-hud-content">';

    try {
      // Capture panel data
      const data = panel.captureData ? panel.captureData() : {};

      // Render panel HTML
      const panelHtml = panel.renderHtml ? panel.renderHtml(data) : '<p>Panel has no renderHtml() method</p>';
      html += panelHtml;
    } catch (error) {
      lcardsLog.error(`[HudManager] ❌ Error rendering panel ${this.state.activePanel}:`, error);
      html += `<div class="lcards-hud-error">Panel render error: ${error.message}</div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Build footer HTML
   * @private
   */
  _buildFooter() {
    return `
      <div class="lcards-hud-footer">
        <div class="lcards-hud-stats">
          Cards: ${this.cards.size} | Panels: ${this.panels.size}
        </div>
      </div>
    `;
  }

  /**
   * Build styles HTML
   * @private
   */
  _buildStyles() {
    return `
      <style>
        .lcards-hud-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 12px;
        }
        .lcards-hud-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #00ffff;
        }
        .lcards-hud-title {
          font-size: 1.2em;
          font-weight: bold;
        }
        .lcards-hud-controls button {
          background: transparent;
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 4px 8px;
          cursor: pointer;
          font-family: inherit;
        }
        .lcards-hud-controls button:hover {
          background: rgba(0, 255, 255, 0.2);
        }
        .lcards-hud-card-selector {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lcards-hud-card-selector select {
          flex: 1;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 4px;
          font-family: inherit;
        }
        .lcards-hud-tabs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .lcards-hud-tab-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .lcards-hud-tab-group-label {
          width: 100%;
          font-size: 0.85em;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .lcards-hud-tab {
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 6px 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9em;
        }
        .lcards-hud-tab:hover {
          background: rgba(0, 255, 255, 0.2);
        }
        .lcards-hud-tab.active {
          background: rgba(0, 255, 255, 0.3);
          border-width: 2px;
        }
        .lcards-hud-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 4px;
        }
        .lcards-hud-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(0, 255, 255, 0.3);
          font-size: 0.85em;
          opacity: 0.7;
        }
        .lcards-hud-error {
          color: #ff6b6b;
          padding: 8px;
          border: 1px solid #ff6b6b;
          border-radius: 4px;
        }
      </style>
    `;
  }

  /**
   * Get display label for panel
   * @private
   */
  _getPanelLabel(panelId) {
    // Strip card GUID prefix if present
    const shortId = panelId.includes(':') 
      ? panelId.split(':')[1] 
      : panelId;

    // Convert to title case
    return shortId
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    // Dragging support could be added here
    // For now, keep it simple
  }

  /**
   * Destroy HUD manager and cleanup resources
   */
  destroy() {
    this.hide();
    this.bus.clear();
    
    // Cleanup all panels
    this.panels.forEach((panel, panelId) => {
      if (typeof panel.destroy === 'function') {
        panel.destroy();
      }
    });
    
    this.panels.clear();
    this.cards.clear();
    
    lcardsLog.debug('[HudManager] 🗑️ HUD Manager destroyed');
  }
}
