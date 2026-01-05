import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * ValidationPanel - Global validation error and warning panel
 * 
 * Aggregates validation errors and warnings from all registered cards
 * using the core ValidationService singleton.
 * 
 * @module core/hud/panels/ValidationPanel
 */
export class ValidationPanel {
  constructor() {
    lcardsLog.debug('[ValidationPanel] 🚀 Validation panel initialized');
  }

  /**
   * Capture validation data from core service
   * @returns {Object} Validation errors and warnings by card
   */
  captureData() {
    const data = {
      errors: [],
      warnings: [],
      byCard: {}
    };

    try {
      // Get validation service
      const validationService = window.lcards?.core?.validationService;
      if (!validationService) {
        lcardsLog.debug('[ValidationPanel] ⚠️ ValidationService not available');
        return data;
      }

      // Get all validation results if available
      // Note: ValidationService needs to expose getAll() or similar method
      if (typeof validationService.getAllResults === 'function') {
        const results = validationService.getAllResults();
        
        results.forEach(result => {
          const cardId = result.cardId || 'unknown';
          
          if (!data.byCard[cardId]) {
            data.byCard[cardId] = {
              errors: [],
              warnings: [],
              cardType: result.cardType || 'unknown'
            };
          }

          if (result.errors) {
            result.errors.forEach(error => {
              const errorObj = {
                cardId,
                code: error.code || 'unknown',
                message: error.message || error.msg || 'Unknown error',
                path: error.path || error.field,
                severity: 'error'
              };
              data.errors.push(errorObj);
              data.byCard[cardId].errors.push(errorObj);
            });
          }

          if (result.warnings) {
            result.warnings.forEach(warning => {
              const warningObj = {
                cardId,
                code: warning.code || 'unknown',
                message: warning.message || warning.msg || 'Unknown warning',
                path: warning.path || warning.field,
                severity: 'warning'
              };
              data.warnings.push(warningObj);
              data.byCard[cardId].warnings.push(warningObj);
            });
          }
        });
      }

      // Fallback: Get MSD validation if available
      if (data.errors.length === 0 && window.lcards?.debug?.msd?.validation) {
        const msdValidation = window.lcards.debug.msd.validation.issues?.() || {};
        
        if (msdValidation.errors) {
          msdValidation.errors.forEach(error => {
            data.errors.push({
              cardId: 'msd',
              code: error.code || 'unknown',
              message: error.msg || error.message || 'Unknown error',
              overlay: error.overlay,
              anchor: error.anchor,
              severity: 'error'
            });
          });
        }

        if (msdValidation.warnings) {
          msdValidation.warnings.forEach(warning => {
            data.warnings.push({
              cardId: 'msd',
              code: warning.code || 'unknown',
              message: warning.msg || warning.message || 'Unknown warning',
              overlay: warning.overlay,
              anchor: warning.anchor,
              severity: 'warning'
            });
          });
        }
      }

    } catch (error) {
      lcardsLog.warn('[ValidationPanel] ⚠️ Error capturing validation data:', error);
    }

    return data;
  }

  /**
   * Render panel HTML
   * @param {Object} data - Panel data from captureData()
   * @returns {string} HTML string
   */
  renderHtml(data) {
    let html = '<div class="validation-panel">';
    html += '<h4>✅ Validation Status</h4>';

    const totalErrors = data.errors.length;
    const totalWarnings = data.warnings.length;

    // Summary
    html += '<div class="validation-summary">';
    if (totalErrors === 0 && totalWarnings === 0) {
      html += '<div class="validation-status success">';
      html += '✅ No validation issues detected';
      html += '</div>';
    } else {
      html += '<div class="validation-status">';
      if (totalErrors > 0) {
        html += `<span class="error-badge">${totalErrors} Error${totalErrors > 1 ? 's' : ''}</span>`;
      }
      if (totalWarnings > 0) {
        html += `<span class="warning-badge">${totalWarnings} Warning${totalWarnings > 1 ? 's' : ''}</span>`;
      }
      html += '</div>';
    }
    html += '</div>';

    // Errors section
    if (totalErrors > 0) {
      html += '<div class="validation-section error-section">';
      html += '<h5>❌ Errors</h5>';
      
      data.errors.slice(0, 10).forEach(error => {
        html += '<div class="validation-issue error">';
        html += `<div class="issue-header">`;
        html += `<span class="issue-code">${error.code}</span>`;
        html += `<span class="issue-card">${error.cardId}</span>`;
        html += `</div>`;
        html += `<div class="issue-message">${this._escapeHtml(error.message)}</div>`;
        if (error.path) {
          html += `<div class="issue-path">Path: ${error.path}</div>`;
        }
        if (error.overlay) {
          html += `<div class="issue-detail">Overlay: ${error.overlay}</div>`;
        }
        if (error.anchor) {
          html += `<div class="issue-detail">Anchor: ${error.anchor}</div>`;
        }
        html += '</div>';
      });

      if (totalErrors > 10) {
        html += `<div class="validation-more">+ ${totalErrors - 10} more errors...</div>`;
      }
      
      html += '</div>';
    }

    // Warnings section
    if (totalWarnings > 0) {
      html += '<div class="validation-section warning-section">';
      html += '<h5>⚠️ Warnings</h5>';
      
      data.warnings.slice(0, 10).forEach(warning => {
        html += '<div class="validation-issue warning">';
        html += `<div class="issue-header">`;
        html += `<span class="issue-code">${warning.code}</span>`;
        html += `<span class="issue-card">${warning.cardId}</span>`;
        html += `</div>`;
        html += `<div class="issue-message">${this._escapeHtml(warning.message)}</div>`;
        if (warning.path) {
          html += `<div class="issue-path">Path: ${warning.path}</div>`;
        }
        if (warning.overlay) {
          html += `<div class="issue-detail">Overlay: ${warning.overlay}</div>`;
        }
        if (warning.anchor) {
          html += `<div class="issue-detail">Anchor: ${warning.anchor}</div>`;
        }
        html += '</div>';
      });

      if (totalWarnings > 10) {
        html += `<div class="validation-more">+ ${totalWarnings - 10} more warnings...</div>`;
      }
      
      html += '</div>';
    }

    // By card breakdown (if multiple cards)
    const cardCount = Object.keys(data.byCard).length;
    if (cardCount > 1) {
      html += '<div class="validation-section">';
      html += '<h5>📊 By Card</h5>';
      
      Object.entries(data.byCard).forEach(([cardId, issues]) => {
        const cardErrors = issues.errors.length;
        const cardWarnings = issues.warnings.length;
        
        html += '<div class="card-summary">';
        html += `<span class="card-name">${cardId.substring(0, 16)}...</span>`;
        html += '<span class="card-issues">';
        if (cardErrors > 0) {
          html += `<span class="error-count">${cardErrors}E</span>`;
        }
        if (cardWarnings > 0) {
          html += `<span class="warning-count">${cardWarnings}W</span>`;
        }
        html += '</span>';
        html += '</div>';
      });
      
      html += '</div>';
    }

    html += '</div>'; // validation-panel

    // Add inline styles
    html += this._getStyles();

    return html;
  }

  /**
   * Escape HTML special characters
   * @private
   */
  _escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get panel styles
   * @private
   */
  _getStyles() {
    return `
      <style>
        .validation-panel h4 {
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        }
        .validation-panel h5 {
          margin: 8px 0 6px 0;
          font-size: 0.95em;
          opacity: 0.9;
        }
        .validation-summary {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(0, 255, 255, 0.05);
          border-radius: 4px;
          text-align: center;
        }
        .validation-status.success {
          color: #66ff99;
          font-weight: bold;
        }
        .error-badge, .warning-badge {
          display: inline-block;
          padding: 4px 12px;
          margin: 0 4px;
          border-radius: 12px;
          font-size: 0.9em;
          font-weight: bold;
        }
        .error-badge {
          background: rgba(255, 102, 102, 0.2);
          color: #ff6666;
          border: 1px solid #ff6666;
        }
        .warning-badge {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
          border: 1px solid #ffaa00;
        }
        .validation-section {
          margin-bottom: 16px;
        }
        .validation-issue {
          margin: 8px 0;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid;
        }
        .validation-issue.error {
          background: rgba(255, 102, 102, 0.1);
          border-left-color: #ff6666;
        }
        .validation-issue.warning {
          background: rgba(255, 170, 0, 0.1);
          border-left-color: #ffaa00;
        }
        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .issue-code {
          font-family: 'Courier New', monospace;
          font-size: 0.85em;
          font-weight: bold;
        }
        .issue-card {
          font-size: 0.75em;
          opacity: 0.7;
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .issue-message {
          margin: 4px 0;
          font-size: 0.9em;
        }
        .issue-path, .issue-detail {
          font-size: 0.75em;
          opacity: 0.6;
          margin-top: 2px;
        }
        .validation-more {
          margin: 8px 0;
          font-size: 0.85em;
          opacity: 0.6;
          text-align: center;
        }
        .card-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          margin: 4px 0;
          background: rgba(0, 255, 255, 0.05);
          border-radius: 4px;
        }
        .card-name {
          font-size: 0.85em;
          font-family: 'Courier New', monospace;
        }
        .card-issues {
          display: flex;
          gap: 4px;
        }
        .error-count, .warning-count {
          font-size: 0.75em;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: bold;
        }
        .error-count {
          background: rgba(255, 102, 102, 0.2);
          color: #ff6666;
        }
        .warning-count {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
        }
      </style>
    `;
  }

  /**
   * Cleanup panel resources
   */
  destroy() {
    lcardsLog.debug('[ValidationPanel] 🗑️ Panel cleanup completed');
  }
}
