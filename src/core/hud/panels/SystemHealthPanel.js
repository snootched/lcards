import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * SystemHealthPanel - System health and singleton status panel
 * 
 * Displays health status of core LCARdS singletons and system metrics:
 * - Singleton service status
 * - Resource counts (cards, dataSources, rules, themes)
 * - Uptime tracking
 * - Memory and performance indicators
 * 
 * @module core/hud/panels/SystemHealthPanel
 */
export class SystemHealthPanel {
  constructor() {
    this.startTime = Date.now();
    lcardsLog.debug('[SystemHealthPanel] 🚀 System health panel initialized');
  }

  /**
   * Capture system health data
   * @returns {Object} System health metrics
   */
  captureData() {
    const data = {
      singletons: {},
      stats: {},
      uptime: Date.now() - this.startTime,
      coreReady: false
    };

    const core = window.lcards?.core;
    
    if (!core) {
      data.error = 'Core not available';
      return data;
    }

    data.coreReady = core._coreInitialized || false;

    // Check singleton health
    data.singletons = {
      systemsManager: {
        available: !!core.systemsManager,
        healthy: !!core.systemsManager?._hass
      },
      dataSourceManager: {
        available: !!core.dataSourceManager,
        healthy: !!core.dataSourceManager?.sources
      },
      rulesManager: {
        available: !!core.rulesManager,
        healthy: !!core.rulesManager?.rules
      },
      themeManager: {
        available: !!core.themeManager,
        healthy: !!core.themeManager?.themes
      },
      animationManager: {
        available: !!core.animationManager,
        healthy: true // Simple check
      },
      validationService: {
        available: !!core.validationService,
        healthy: !!core.validationService?.config
      },
      stylePresetManager: {
        available: !!core.stylePresetManager,
        healthy: !!core.stylePresetManager?.presets
      },
      animationRegistry: {
        available: !!core.animationRegistry,
        healthy: !!core.animationRegistry?.animations
      },
      configManager: {
        available: !!core.configManager,
        healthy: !!core.configManager?.schemas
      },
      hudManager: {
        available: !!core.hudManager,
        healthy: !!core.hudManager?.panels
      }
    };

    // Get resource counts
    try {
      data.stats.cards = core._cardInstances?.size || 0;
      data.stats.dataSources = core.dataSourceManager?.sources?.size || 0;
      data.stats.rules = core.rulesManager?.rules?.length || 0;
      data.stats.themes = Object.keys(core.themeManager?.themes || {}).length;
      data.stats.stylePresets = core.stylePresetManager?.presets?.size || 0;
      data.stats.animations = core.animationRegistry?.animations?.size || 0;
      data.stats.hudPanels = core.hudManager?.panels?.size || 0;
      data.stats.hudCards = core.hudManager?.cards?.size || 0;
    } catch (error) {
      lcardsLog.warn('[SystemHealthPanel] ⚠️ Error collecting stats:', error);
    }

    // Get pending cards count
    try {
      data.stats.pendingCards = core._pendingCards?.length || 0;
    } catch (error) {
      // Ignore
    }

    return data;
  }

  /**
   * Format uptime as human-readable string
   * @private
   */
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Render panel HTML
   * @param {Object} data - Panel data from captureData()
   * @returns {string} HTML string
   */
  renderHtml(data) {
    let html = '<div class="system-health-panel">';
    html += '<h4>💊 System Health</h4>';

    if (data.error) {
      html += `<div class="health-error">${data.error}</div>`;
      html += '</div>';
      return html;
    }

    // Core status
    html += '<div class="health-section">';
    html += '<div class="core-status">';
    html += '<span>Core Status:</span>';
    if (data.coreReady) {
      html += '<span class="status-badge ready">✅ Ready</span>';
    } else {
      html += '<span class="status-badge initializing">⏳ Initializing</span>';
    }
    html += '</div>';
    html += `<div class="uptime">Uptime: ${this._formatUptime(data.uptime)}</div>`;
    html += '</div>';

    // Singleton services
    html += '<div class="health-section">';
    html += '<h5>🔧 Singleton Services</h5>';
    
    const singletonOrder = [
      'systemsManager',
      'dataSourceManager',
      'rulesManager',
      'themeManager',
      'animationManager',
      'validationService',
      'stylePresetManager',
      'animationRegistry',
      'configManager',
      'hudManager'
    ];

    singletonOrder.forEach(key => {
      const singleton = data.singletons[key];
      if (!singleton) return;

      const label = key
        .replace(/Manager$/, '')
        .replace(/Service$/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      html += '<div class="singleton-row">';
      html += `<span class="singleton-name">${label}</span>`;
      html += '<span class="singleton-status">';
      
      if (!singleton.available) {
        html += '<span class="status-icon unavailable">❌</span>';
      } else if (singleton.healthy) {
        html += '<span class="status-icon healthy">✅</span>';
      } else {
        html += '<span class="status-icon warning">⚠️</span>';
      }
      
      html += '</span>';
      html += '</div>';
    });
    
    html += '</div>';

    // Resource counts
    html += '<div class="health-section">';
    html += '<h5>📊 Resource Counts</h5>';
    
    const stats = [
      { label: 'Registered Cards', key: 'cards' },
      { label: 'Data Sources', key: 'dataSources' },
      { label: 'Active Rules', key: 'rules' },
      { label: 'Loaded Themes', key: 'themes' },
      { label: 'Style Presets', key: 'stylePresets' },
      { label: 'Animations', key: 'animations' },
      { label: 'HUD Panels', key: 'hudPanels' },
      { label: 'HUD Cards', key: 'hudCards' }
    ];

    stats.forEach(stat => {
      const value = data.stats[stat.key];
      if (value !== undefined) {
        html += '<div class="stat-row">';
        html += `<span class="stat-label">${stat.label}</span>`;
        html += `<span class="stat-value">${value}</span>`;
        html += '</div>';
      }
    });

    // Pending cards (if any)
    if (data.stats.pendingCards > 0) {
      html += '<div class="stat-row warning">';
      html += '<span class="stat-label">⏳ Pending Cards</span>';
      html += `<span class="stat-value">${data.stats.pendingCards}</span>`;
      html += '</div>';
    }
    
    html += '</div>';

    // Health summary
    const healthyCount = Object.values(data.singletons)
      .filter(s => s.available && s.healthy).length;
    const totalCount = Object.values(data.singletons)
      .filter(s => s.available).length;
    const healthPercent = totalCount > 0 
      ? Math.round((healthyCount / totalCount) * 100) 
      : 0;

    html += '<div class="health-summary">';
    html += '<div class="health-score">';
    const scoreClass = healthPercent === 100 ? 'excellent' 
      : healthPercent >= 80 ? 'good' 
      : healthPercent >= 60 ? 'fair' 
      : 'poor';
    html += `<div class="score-value ${scoreClass}">${healthPercent}%</div>`;
    html += '<div class="score-label">System Health</div>';
    html += '</div>';
    html += `<div class="health-detail">${healthyCount} of ${totalCount} services healthy</div>`;
    html += '</div>';

    html += '</div>'; // system-health-panel

    // Add inline styles
    html += this._getStyles();

    return html;
  }

  /**
   * Get panel styles
   * @private
   */
  _getStyles() {
    return `
      <style>
        .system-health-panel h4 {
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        }
        .system-health-panel h5 {
          margin: 8px 0 6px 0;
          font-size: 0.95em;
          opacity: 0.9;
        }
        .health-error {
          color: #ff6666;
          padding: 12px;
          background: rgba(255, 102, 102, 0.1);
          border: 1px solid #ff6666;
          border-radius: 4px;
          text-align: center;
        }
        .health-section {
          margin-bottom: 16px;
          padding: 10px;
          background: rgba(0, 255, 255, 0.05);
          border-radius: 4px;
        }
        .core-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 1em;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85em;
          font-weight: bold;
        }
        .status-badge.ready {
          background: rgba(102, 255, 153, 0.2);
          color: #66ff99;
          border: 1px solid #66ff99;
        }
        .status-badge.initializing {
          background: rgba(255, 204, 102, 0.2);
          color: #ffcc66;
          border: 1px solid #ffcc66;
        }
        .uptime {
          font-size: 0.85em;
          opacity: 0.7;
        }
        .singleton-row, .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          margin: 4px 0;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .singleton-row:hover, .stat-row:hover {
          background: rgba(0, 255, 255, 0.08);
        }
        .stat-row.warning {
          background: rgba(255, 204, 102, 0.1);
          border-left: 3px solid #ffcc66;
        }
        .singleton-name, .stat-label {
          font-size: 0.85em;
        }
        .singleton-status {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .status-icon {
          font-size: 1em;
        }
        .status-icon.healthy {
          color: #66ff99;
        }
        .status-icon.warning {
          color: #ffcc66;
        }
        .status-icon.unavailable {
          color: #ff6666;
        }
        .stat-value {
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #00ffff;
        }
        .health-summary {
          margin-top: 16px;
          padding: 16px;
          background: rgba(0, 255, 255, 0.08);
          border-radius: 4px;
          text-align: center;
        }
        .health-score {
          margin-bottom: 8px;
        }
        .score-value {
          font-size: 2.5em;
          font-weight: bold;
          line-height: 1;
        }
        .score-value.excellent {
          color: #66ff99;
        }
        .score-value.good {
          color: #99ff99;
        }
        .score-value.fair {
          color: #ffcc66;
        }
        .score-value.poor {
          color: #ff6666;
        }
        .score-label {
          font-size: 0.85em;
          opacity: 0.7;
          margin-top: 4px;
        }
        .health-detail {
          font-size: 0.9em;
          opacity: 0.8;
        }
      </style>
    `;
  }

  /**
   * Cleanup panel resources
   */
  destroy() {
    lcardsLog.debug('[SystemHealthPanel] 🗑️ Panel cleanup completed');
  }
}
