import { lcardsLog } from '../../utils/lcards-logging.js';
import { initMsdPipeline } from './PipelineCore.js';

/**
 * MSD Instance Manager - Preview detection and utilities for MSD system
 *
 * UPDATED: Now supports multiple MSD card instances on the same dashboard.
 * This manager provides:
 * - Preview mode detection for card editor
 * - Preview content generation
 * - Utility functions for MSD initialization
 *
 * NOTE: Single-instance restriction removed - multiple MSD cards can now coexist.
 */
export class MsdInstanceManager {
  /**
   * Generate a unique GUID for MSD instance identification
   * Format: msd_[timestamp]_[random]
   * Example: msd_1697302742156_a3f9c2b1
   *
   * @returns {string} Unique GUID string
   */
  static generateGuid() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `msd_${timestamp}_${random}`;
  }

  /**
   * Request MSD instance initialization (supports multiple instances)
   * @param {Object} userMsdConfig - MSD configuration
   * @param {HTMLElement} mountEl - Mount element
   * @param {Object} hass - Home Assistant instance
   * @param {boolean} isPreview - Whether this is a preview render
   * @returns {Promise<Object>} Pipeline API or preview content
   */
  static async requestInstance(userMsdConfig, mountEl, hass, isPreview = false) {
    lcardsLog.debug('[MsdInstanceManager] 🚀 requestInstance called:', {
      isPreview,
      mountElTag: mountEl?.tagName,
      timestamp: new Date().toISOString()
    });

    // Handle preview mode specially
    if (isPreview) {
      lcardsLog.debug('[MsdInstanceManager] 🔍 Preview mode detected - returning preview content');
      return MsdInstanceManager._createPreviewContent(userMsdConfig, mountEl);
    }

    // CHANGED: No blocking logic - directly initialize pipeline
    lcardsLog.debug('[MsdInstanceManager] 🔧 Initializing MSD pipeline (multi-instance mode)');

    try {
      const pipelineApi = await initMsdPipeline(userMsdConfig, mountEl, hass);

      // Support setCardInstance for compatibility
      if (pipelineApi.setCardInstance && typeof pipelineApi.setCardInstance === 'function') {
        const cardInstance = window.lcards.debug.msd?.cardInstance;
        if (cardInstance) {
          lcardsLog.debug('[MsdInstanceManager] 🔧 Setting card instance via pipeline setCardInstance');
          pipelineApi.setCardInstance(cardInstance);
        }
      }

      lcardsLog.debug('[MsdInstanceManager] ✅ MSD instance created');
      return pipelineApi;

    } catch (error) {
      lcardsLog.error('[MsdInstanceManager] ❌ Pipeline initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect if we're in preview mode
   * @param {HTMLElement} mountEl - Mount element to check context
   * @returns {boolean} True if in preview mode
   */
  static detectPreviewMode(mountEl) {
    // Get the card element that contains this mount (traverse up through shadow DOM)
    const cardElement = MsdInstanceManager._findCardElement(mountEl);

    // Extended traversal up the DOM tree to find preview indicators
    const extendedPath = MsdInstanceManager._getExtendedElementPath(cardElement, 10);

    // Check various indicators of preview mode from both mount and card level
    const indicators = [
      // PRIORITY 1: Reliable card editor/preview indicators
      { name: 'element-preview-div', detected: MsdInstanceManager._checkInPath(cardElement, '.element-preview', 15) },
      { name: 'element-editor-context', detected: MsdInstanceManager._checkInPath(cardElement, '.element-editor', 15) },

      // PRIORITY 2: Additional card editor indicators (for robustness)
      { name: 'ha-card-editor', detected: !!document.querySelector('ha-card-editor') },
      { name: 'hui-dialog-edit-card', detected: !!document.querySelector('hui-dialog-edit-card') },
      { name: 'card-editor', detected: !!(mountEl?.closest?.('hui-card-element-editor') || cardElement?.closest?.('hui-card-element-editor')) },
      { name: 'hui-card-preview', detected: !!(mountEl?.closest?.('hui-card-preview') || cardElement?.closest?.('hui-card-preview')) },

      // PRIORITY 3: Fallback indicators (only used if primary indicators fail)
      { name: 'url-config-path', detected: window.location.pathname.includes('/config/'), priority: 'fallback' },
      { name: 'ui-editor', detected: !!document.querySelector('hui-card-options, hui-entity-picker-table, ha-yaml-editor'), priority: 'fallback' },

      // DEPRIORITIZED: General edit mode indicators (for debugging only)
      { name: 'hui-card-edit-mode', detected: MsdInstanceManager._checkInPath(cardElement, 'hui-card-edit-mode', 5), priority: 'debug' },
      { name: 'ha-sortable-parent', detected: MsdInstanceManager._checkInPath(cardElement, 'ha-sortable', 15), priority: 'debug' },
      { name: 'hui-grid-section-pattern', detected: MsdInstanceManager._checkInPath(cardElement, 'hui-grid-section', 15), priority: 'debug' }
    ];

    // Determine if we're in preview mode
    const primaryIndicators = indicators.filter(i => i.detected && !i.priority);
    const fallbackIndicators = indicators.filter(i => i.detected && i.priority === 'fallback');
    const debugIndicators = indicators.filter(i => i.detected && i.priority === 'debug');

    // Preview mode if we have primary indicators, or fallback indicators when no primary ones exist
    const isPreview = primaryIndicators.length > 0 || (primaryIndicators.length === 0 && fallbackIndicators.length > 0);

    lcardsLog.debug('[MsdInstanceManager] 🔍 Preview mode detection:', {
      isPreview,
      primaryIndicators: primaryIndicators.map(i => i.name),
      fallbackIndicators: fallbackIndicators.map(i => i.name),
      debugIndicators: debugIndicators.map(i => i.name),
      logic: primaryIndicators.length > 0 ? 'primary' : fallbackIndicators.length > 0 ? 'fallback' : 'none'
    });

    return isPreview;
  }

  /**
   * Check if a selector exists in the path up to maxLevels parent elements
   * INCLUDING traversal through shadow DOM boundaries
   * @private
   */
  static _checkInPath(element, selector, maxLevels = 15) {
    if (!element) return false;

    let current = element;
    for (let i = 0; i < maxLevels && current; i++) {
      // Check if current element matches
      try {
        if (current.matches && current.matches(selector)) {
          return true;
        }
        // Also check with querySelector to find children
        if (current.querySelector && current.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        // Invalid selector, skip
      }

      // Move to parent
      current = current.parentElement;

      // If we hit null but we're in a shadow DOM, try to traverse OUT to the host
      if (!current && element.getRootNode && element.getRootNode() !== document) {
        const shadowRoot = element.getRootNode();
        if (shadowRoot.host) {
          current = shadowRoot.host;
          element = current; // Update element for next getRootNode check
        }
      }
    }

    return false;
  }

  /**
   * Get extended element path for debugging
   * @private
   */
  static _getExtendedElementPath(element, maxLevels = 15) {
    if (!element) return 'null';

    const path = [];
    let current = element;

    for (let i = 0; i < maxLevels && current; i++) {
      const tagName = current.tagName?.toLowerCase() || 'unknown';
      const id = current.id ? `#${current.id}` : '';
      const className = current.className ? `.${Array.from(current.classList).slice(0, 3).join('.')}` : '';
      const preview = current.hasAttribute?.('preview') ? '[preview]' : '';

      path.push(`${tagName}${id}${className}${preview}`);
      current = current.parentElement;
    }

    return path.join(' → ');
  }

  /**
   * Find the card element that contains the mount element (traverse through shadow DOM)
   * @private
   */
  static _findCardElement(mountEl) {
    // Try to get the card instance from global reference
    const cardInstance = window.lcards.debug.msd?.cardInstance;

    if (cardInstance) {
      return cardInstance; // This should be the lcards-msd-card element
    }

    // Fallback: try to traverse up from mount element
    // The mount is typically inside shadow DOM, so we need to go through the host
    let current = mountEl;

    while (current) {
      // Check if we hit a shadow root boundary
      if (current.getRootNode && current.getRootNode() !== document) {
        const shadowRoot = current.getRootNode();
        if (shadowRoot.host) {
          current = shadowRoot.host; // Jump to shadow host

          // Check if this is our card element
          if (current.tagName && current.tagName.toLowerCase().includes('lcards-msd-card')) {
            return current;
          }

          continue;
        }
      }

      // Regular DOM traversal
      if (current.tagName && current.tagName.toLowerCase().includes('lcards-msd-card')) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  /**
   * Create preview content for Home Assistant editor
   * @private
   */
  static _createPreviewContent(userMsdConfig, mountEl) {
    lcardsLog.debug('[MsdInstanceManager] 🎨 Generating MSD preview content', userMsdConfig);

    // userMsdConfig is already at the MSD level, not wrapped in .msd
    const msdConfig = userMsdConfig || {};

    // Check for configuration issues
    let configIssues = [];
    let baseSvg = 'Not configured';

    if (!msdConfig.base_svg?.source) {
      configIssues.push({
        type: 'warning',
        title: 'No Base SVG',
        message: 'Add base_svg.source to your configuration',
        suggestion: 'base_svg:\n  source: builtin:ncc-1701-a-blue'
      });
    } else {
      const source = msdConfig.base_svg.source;

      // Handle special "none" value for overlay-only cards
      if (source === 'none') {
        baseSvg = 'none (overlay-only)';
      } else {
        // Try to validate the SVG source
        try {
          if (typeof window !== 'undefined' && window.lcards?.getSvgContent) {
            const svgContent = window.lcards.getSvgContent(source);
            if (!svgContent) {
              const isBuiltin = source.startsWith('builtin:');
              const isUrl = source.startsWith('http');
              const isLocal = source.startsWith('/') || source.startsWith('./');

              let errorMsg = 'SVG not found or failed to load';
              let suggestion = 'Check your source path';

              if (isBuiltin) {
                const svgName = source.replace('builtin:', '');
                errorMsg = `Builtin SVG "${svgName}" not found`;

                // Get actual available SVG templates
                const availableTemplates = MsdInstanceManager._getAvailableSvgTemplates();
                suggestion = availableTemplates.length > 0
                  ? `Available: ${availableTemplates.join(', ')}`
                  : 'Available: ncc-1701-a-blue, ncc-1701-d, nx-01';
              } else if (isUrl) {
                errorMsg = 'Failed to load SVG from URL';
                suggestion = 'Check URL accessibility and content type';
              } else if (isLocal) {
                errorMsg = 'Failed to load local SVG file';
                suggestion = 'Check file exists in /local/ directory';
              }

              configIssues.push({
                type: 'error',
                title: 'SVG Loading Failed',
                message: errorMsg,
                suggestion: suggestion,
                source: source
              });
              baseSvg = `<span style="color: #ff6666;">${source} (failed)</span>`;
            } else {
              baseSvg = source.startsWith('builtin:') ? source.replace('builtin:', '') : source;
            }
          } else {
            baseSvg = source.startsWith('builtin:') ? source.replace('builtin:', '') : source;
          }
        } catch (error) {
          configIssues.push({
            type: 'error',
            title: 'SVG Error',
            message: error.message || error.toString(),
            source: source
          });
          baseSvg = `<span style="color: #ff6666;">${source} (error)</span>`;
        }
      }
    }

    // Extract real configuration information
    const baseSvgSource = msdConfig.base_svg?.source;

    if (!baseSvgSource) {
      baseSvg = '<span style="color: var(--lcars-orange, #ff9900);">Not configured</span>';
    } else if (baseSvgSource.startsWith('builtin:')) {
      baseSvg = baseSvgSource.replace('builtin:', '');
    } else {
      baseSvg = baseSvgSource;
    }

    const overlayCount = (msdConfig.overlays || []).length;
    const dataSourceCount = Object.keys(msdConfig.data_sources || {}).length;
    const rulesCount = (msdConfig.rules || []).length;
    const anchorCount = Object.keys(msdConfig.anchors || {}).length;
    const routeCount = (msdConfig.routes || []).length;

    // Additional useful config info
    const hasAnimations = !!(msdConfig.animations && Object.keys(msdConfig.animations).length > 0);
    const hasPalettes = !!(msdConfig.palettes && Object.keys(msdConfig.palettes).length > 0);
    const debugMode = !!(msdConfig.debug && msdConfig.debug.enabled);
    const version = msdConfig.version || 'unknown';

    // Generate issues HTML if any
    let issuesHtml = '';
    if (configIssues.length > 0) {
      issuesHtml = `
        <div style="
          margin: 16px 0;
          padding: 12px;
          background: rgba(0,0,0,0.4);
          border-radius: 6px;
          border-left: 4px solid ${configIssues.some(i => i.type === 'error') ? '#ff6666' : '#ff9900'};
        ">
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: ${configIssues.some(i => i.type === 'error') ? '#ff6666' : '#ff9900'};">
            ${configIssues.some(i => i.type === 'error') ? '❌' : '⚠️'} Configuration ${configIssues.some(i => i.type === 'error') ? 'Errors' : 'Warnings'}
          </div>
          ${configIssues.map(issue => `
            <div style="margin-bottom: 8px; font-size: 10px;">
              <div style="font-weight: bold; color: ${issue.type === 'error' ? '#ffcccc' : '#ffcc99'};">
                ${issue.title}
              </div>
              <div style="margin: 2px 0; opacity: 0.9;">
                ${issue.message}
              </div>
              ${issue.source ? `<div style="font-family: monospace; font-size: 9px; opacity: 0.7;">Source: ${issue.source}</div>` : ''}
              ${issue.suggestion ? `<div style="margin-top: 4px; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px; font-family: monospace; font-size: 9px; color: #cccccc;">${issue.suggestion.replace(/\n/g, '<br/>')}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    return {
      enabled: true,
      preview: true,
      html: `
        <div style="
          width: 99%;
          height: 400px;
          background: linear-gradient(135deg, #001122 0%, #000611 100%);
          border: 2px solid var(--lcars-cyan, #00ffff);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--lcars-cyan, #00ffff);
          font-family: 'Antonio', monospace;
          position: relative;
          overflow: hidden;
        ">
          <!-- Background pattern -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
              radial-gradient(circle at 20% 20%, rgba(0,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,170,0,0.1) 0%, transparent 50%);
            z-index: 0;
          "></div>

          <!-- Content -->
          <div style="z-index: 1; text-align: center; width: 90%; max-height: 100%; overflow-y: auto;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: var(--lcars-orange, #ff9900);">
              LCARdS MSD Preview
            </div>

            <div style="font-size: 14px; margin-bottom: 8px;">
              Master Systems Display Configuration
            </div>

            <div style="font-size: 11px; margin-bottom: 16px; opacity: 0.7;">
              Version ${version}
            </div>

            ${issuesHtml}

            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin: 20px 0;
              font-size: 12px;
              color: var(--lcars-white, #ffffff);
            ">
              <div style="text-align: right;">
                <div>Base SVG:</div>
                <div>Overlays:</div>
                <div>Data Sources:</div>
                <div>Rules:</div>
                <div>Anchors:</div>
                <div>Routes:</div>
              </div>
              <div style="text-align: left; color: var(--lcars-yellow, #ffcc00);">
                <div>${baseSvg.replace('builtin:', '')}</div>
                <div>${overlayCount}</div>
                <div>${dataSourceCount}</div>
                <div>${rulesCount}</div>
                <div>${anchorCount}</div>
                <div>${routeCount}</div>
              </div>
            </div>

            <!-- Additional features -->
            <div style="
              display: flex;
              justify-content: center;
              gap: 12px;
              margin: 16px 0;
              font-size: 10px;
            ">
              <span style="
                padding: 2px 6px;
                background: ${hasAnimations ? 'var(--lcars-green, #00ff00)' : 'var(--lcars-gray, #666666)'};
                color: black;
                border-radius: 3px;
                font-weight: bold;
              ">ANIMATIONS</span>
              <span style="
                padding: 2px 6px;
                background: ${hasPalettes ? 'var(--lcars-green, #00ff00)' : 'var(--lcars-gray, #666666)'};
                color: black;
                border-radius: 3px;
                font-weight: bold;
              ">PALETTES</span>
              <span style="
                padding: 2px 6px;
                background: ${debugMode ? 'var(--lcars-orange, #ff9900)' : 'var(--lcars-gray, #666666)'};
                color: black;
                border-radius: 3px;
                font-weight: bold;
              ">DEBUG</span>
            </div>

            <div style="
              font-size: 11px;
              opacity: 0.8;
              margin-top: 20px;
              padding: 8px;
              background: rgba(0,0,0,0.3);
              border-radius: 4px;
              border-left: 3px solid var(--lcars-orange, #ff9900);
            ">
              ✨ Multi-Instance Support: Multiple MSD cards can now be used simultaneously on the same dashboard
            </div>
          </div>

          <!-- Corner accents -->
          <div style="
            position: absolute;
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            border-top: 3px solid var(--lcars-orange, #ff9900);
            border-right: 3px solid var(--lcars-orange, #ff9900);
            border-radius: 0 8px 0 0;
          "></div>
          <div style="
            position: absolute;
            bottom: 10px;
            left: 10px;
            width: 40px;
            height: 40px;
            border-bottom: 3px solid var(--lcars-cyan, #00ffff);
            border-left: 3px solid var(--lcars-cyan, #00ffff);
            border-radius: 0 0 0 8px;
          "></div>
        </div>
      `
    };
  }

  /**
   * Get list of available SVG templates from the global registry
   * @private
   */
  static _getAvailableSvgTemplates() {
    try {
      // Access the SVG templates from window.lcards.assets.svg_templates
      const svgTemplates = window?.lcards?.assets?.svg_templates;
      if (svgTemplates && typeof svgTemplates === 'object') {
        return Object.keys(svgTemplates).sort();
      }

      // Fallback to known templates if registry not available
      return ['ncc-1701-a-blue', 'ncc-1701-d', 'nx-01'];
    } catch (error) {
      lcardsLog.debug('[MsdInstanceManager] Could not access SVG templates registry:', error);
      return ['ncc-1701-a-blue', 'ncc-1701-d', 'nx-01'];
    }
  }

  /**
   * Destroy instance cleanup (for backward compatibility)
   * Note: With multi-instance support, this is mainly for individual card cleanup
   */
  static async destroyInstance() {
    lcardsLog.debug('[MsdInstanceManager] 🧹 Destroy instance called (no-op in multi-instance mode)');
    // No-op: Cleanup is now handled per-card by the card's disconnectedCallback
  }
}

// Set up global debugging helpers (updated for multi-instance support)
if (typeof window !== 'undefined') {
  window.__msdStatus = () => {
    const status = {
      'Multi-Instance Mode': 'Enabled',
      'Timestamp': new Date().toISOString(),
      'Info': 'Multiple MSD cards can now coexist. Use browser DevTools to inspect individual card instances.'
    };

    console.table(status);
    console.log('💡 To debug a specific card, inspect it in the Elements tab and access its properties');
    return status;
  };
}
