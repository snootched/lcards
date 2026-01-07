import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * DebugFlagsPanel - Global debug feature toggle panel
 * 
 * Provides UI for enabling/disabling debug features like:
 * - Visual overlays (bounding boxes, routing, etc.)
 * - Verbose logging
 * - Performance monitoring
 * - Animation debugging
 * 
 * @module core/hud/panels/DebugFlagsPanel
 */
export class DebugFlagsPanel {
  constructor() {
    this.features = {
      // Global debug features
      verboseLogging: {
        label: 'Verbose Logging',
        enabled: false,
        description: 'Enable debug-level logging to console'
      },
      boundingBoxes: {
        label: 'Bounding Boxes',
        enabled: false,
        description: 'Show element bounding boxes (MSD cards)'
      },
      anchors: {
        label: 'Anchor Points',
        enabled: false,
        description: 'Show anchor points (MSD cards)'
      },
      routing: {
        label: 'Routing Paths',
        enabled: false,
        description: 'Show line routing paths (MSD cards)'
      },
      performance: {
        label: 'Performance Markers',
        enabled: false,
        description: 'Show performance timing markers'
      },
      animations: {
        label: 'Animation Debug',
        enabled: false,
        description: 'Log animation lifecycle events'
      }
    };

    lcardsLog.debug('[DebugFlagsPanel] 🚀 Debug flags panel initialized');
  }

  /**
   * Capture current debug flag state
   * @returns {Object} Debug flags state
   */
  captureData() {
    const data = {
      features: {},
      msdAvailable: false,
      logLevel: 'info'
    };

    // Check current log level
    if (window.lcards?.getGlobalLogLevel) {
      data.logLevel = window.lcards.getGlobalLogLevel();
    }

    // Update verbose logging state based on log level
    this.features.verboseLogging.enabled = data.logLevel === 'debug' || data.logLevel === 'trace';

    // Check MSD debug status if available
    const hudManager = window.lcards?.core?.hudManager;
    const activeCardGuid = hudManager?.state?.activeCard;
    const msdInstance = activeCardGuid ? window.lcards.cards.msd.getInstance(activeCardGuid) : null;
    
    if (msdInstance?.pipelineInstance?.coordinator?.debugManager) {
      data.msdAvailable = true;
      const msdSnapshot = msdInstance.pipelineInstance.coordinator.debugManager.getSnapshot?.() || {};
      
      // Update feature states from MSD
      if (msdSnapshot.bounding_boxes !== undefined) {
        this.features.boundingBoxes.enabled = msdSnapshot.bounding_boxes;
      }
      if (msdSnapshot.anchors !== undefined) {
        this.features.anchors.enabled = msdSnapshot.anchors;
      }
      if (msdSnapshot.routing !== undefined) {
        this.features.routing.enabled = msdSnapshot.routing;
      }
      if (msdSnapshot.performance !== undefined) {
        this.features.performance.enabled = msdSnapshot.performance;
      }
    }

    // Copy current feature states
    Object.keys(this.features).forEach(key => {
      data.features[key] = {
        ...this.features[key]
      };
    });

    return data;
  }

  /**
   * Toggle a debug feature
   * @param {string} featureKey - Feature identifier
   */
  toggleFeature(featureKey) {
    if (!this.features[featureKey]) {
      lcardsLog.warn(`[DebugFlagsPanel] ⚠️ Unknown feature: ${featureKey}`);
      return;
    }

    const feature = this.features[featureKey];
    const newState = !feature.enabled;

    lcardsLog.info(`[DebugFlagsPanel] 🔄 Toggling ${featureKey}: ${feature.enabled} → ${newState}`);

    // Handle special features
    switch (featureKey) {
      case 'verboseLogging':
        this._toggleVerboseLogging(newState);
        break;
      
      case 'boundingBoxes':
      case 'anchors':
      case 'routing':
      case 'performance':
        this._toggleMsdFeature(featureKey, newState);
        break;
      
      case 'animations':
        this._toggleAnimationDebug(newState);
        break;
      
      default:
        feature.enabled = newState;
    }
  }

  /**
   * Toggle verbose logging
   * @private
   */
  _toggleVerboseLogging(enabled) {
    if (window.lcards?.setGlobalLogLevel) {
      window.lcards.setGlobalLogLevel(enabled ? 'debug' : 'info');
      this.features.verboseLogging.enabled = enabled;
      lcardsLog.info(`[DebugFlagsPanel] 📝 Log level: ${enabled ? 'debug' : 'info'}`);
    }
  }

  /**
   * Toggle MSD debug feature
   * @private
   */
  _toggleMsdFeature(featureKey, enabled) {
    const msdFeatureMap = {
      boundingBoxes: 'bounding_boxes',
      anchors: 'anchors',
      routing: 'routing',
      performance: 'performance'
    };

    const msdFeature = msdFeatureMap[featureKey];
    if (!msdFeature) return;

    const hudManager = window.lcards?.core?.hudManager;
    const activeCardGuid = hudManager?.state?.activeCard;
    const msdInstance = activeCardGuid ? window.lcards.cards.msd.getInstance(activeCardGuid) : null;
    const debugManager = msdInstance?.pipelineInstance?.coordinator?.debugManager;

    if (debugManager) {
      if (enabled) {
        debugManager.enable?.(msdFeature);
      } else {
        debugManager.disable?.(msdFeature);
      }

      this.features[featureKey].enabled = enabled;

      // Trigger re-render if available
      setTimeout(() => {
        const pipeline = msdInstance?.pipelineInstance;
        if (pipeline?.reRender) {
          pipeline.reRender();
        }
      }, 50);
    } else {
      lcardsLog.warn(`[DebugFlagsPanel] ⚠️ MSD debug interface not available for ${featureKey}`);
    }
  }

  /**
   * Toggle animation debugging
   * @private
   */
  _toggleAnimationDebug(enabled) {
    this.features.animations.enabled = enabled;
    
    if (window.lcards?.core?.animationManager) {
      // Could add animation manager debug mode here
      lcardsLog.info(`[DebugFlagsPanel] 🎬 Animation debug: ${enabled}`);
    }
  }

  /**
   * Render panel HTML
   * @param {Object} data - Panel data from captureData()
   * @returns {string} HTML string
   */
  renderHtml(data) {
    let html = '<div class="debug-flags-panel">';
    html += '<h4>🚩 Debug Features</h4>';

    // Log level indicator
    html += '<div class="flags-section">';
    html += '<div class="log-level-indicator">';
    html += `<span>Current Log Level:</span>`;
    html += `<span class="log-level-value">${data.logLevel.toUpperCase()}</span>`;
    html += '</div>';
    html += '</div>';

    // Feature toggles
    html += '<div class="flags-section">';
    
    Object.entries(data.features).forEach(([key, feature]) => {
      const disabled = !data.msdAvailable && ['boundingBoxes', 'anchors', 'routing', 'performance'].includes(key);
      
      html += '<div class="flag-item">';
      html += '<div class="flag-header">';
      html += `<label class="flag-label ${disabled ? 'disabled' : ''}">`;
      html += `<input type="checkbox" 
                      ${feature.enabled ? 'checked' : ''} 
                      ${disabled ? 'disabled' : ''}
                      onchange="window.lcards.core.hudManager.panels.get('debug-flags').toggleFeature('${key}'); 
                               window.lcards.core.hudManager.refresh();">`;
      html += `<span>${feature.label}</span>`;
      html += `</label>`;
      
      if (feature.enabled) {
        html += '<span class="flag-status active">ON</span>';
      }
      
      html += '</div>';
      html += `<div class="flag-description">${feature.description}</div>`;
      html += '</div>';
    });
    
    html += '</div>';

    // MSD availability notice
    if (!data.msdAvailable) {
      html += '<div class="flags-notice">';
      html += '<p><strong>ℹ️ Note:</strong> Some debug features require an MSD card to be present.</p>';
      html += '</div>';
    }

    // Help section
    html += '<div class="flags-help">';
    html += '<p><strong>💡 Debug Tips:</strong></p>';
    html += '<ul>';
    html += '<li>Enable verbose logging for detailed console output</li>';
    html += '<li>Use browser dev tools (F12) for deeper inspection</li>';
    html += '<li>Check browser console for log messages</li>';
    html += '</ul>';
    html += '</div>';

    html += '</div>'; // debug-flags-panel

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
        .debug-flags-panel h4 {
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        }
        .flags-section {
          margin-bottom: 16px;
        }
        .log-level-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0, 255, 255, 0.08);
          border-radius: 4px;
          font-size: 0.9em;
        }
        .log-level-value {
          font-weight: bold;
          color: #ffcc66;
          font-family: 'Courier New', monospace;
        }
        .flag-item {
          margin: 8px 0;
          padding: 10px;
          background: rgba(0, 255, 255, 0.05);
          border-radius: 4px;
          border-left: 3px solid rgba(0, 255, 255, 0.3);
        }
        .flag-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .flag-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        .flag-label.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .flag-label input[type="checkbox"] {
          cursor: pointer;
        }
        .flag-label input[type="checkbox"]:disabled {
          cursor: not-allowed;
        }
        .flag-status {
          font-size: 0.75em;
          padding: 2px 8px;
          border-radius: 8px;
          font-weight: bold;
        }
        .flag-status.active {
          background: rgba(102, 255, 153, 0.2);
          color: #66ff99;
          border: 1px solid #66ff99;
        }
        .flag-description {
          font-size: 0.8em;
          opacity: 0.7;
          margin-top: 4px;
          padding-left: 24px;
        }
        .flags-notice {
          margin: 16px 0;
          padding: 12px;
          background: rgba(255, 204, 102, 0.1);
          border-left: 3px solid rgba(255, 204, 102, 0.5);
          border-radius: 4px;
          font-size: 0.85em;
        }
        .flags-notice p {
          margin: 0;
        }
        .flags-help {
          margin-top: 16px;
          padding: 12px;
          background: rgba(0, 255, 255, 0.08);
          border-left: 3px solid rgba(0, 255, 255, 0.4);
          border-radius: 4px;
          font-size: 0.85em;
        }
        .flags-help p {
          margin: 0 0 8px 0;
        }
        .flags-help ul {
          margin: 0;
          padding-left: 20px;
        }
        .flags-help li {
          margin: 4px 0;
          line-height: 1.4;
        }
      </style>
    `;
  }

  /**
   * Cleanup panel resources
   */
  destroy() {
    lcardsLog.debug('[DebugFlagsPanel] 🗑️ Panel cleanup completed');
  }
}
