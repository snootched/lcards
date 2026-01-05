import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * PerformancePanel - Global performance monitoring panel
 * 
 * Monitors runtime performance metrics including FPS, memory usage,
 * and basic timing data. For deeper analysis, users should use
 * browser dev tools (F12) and Home Assistant developer stats.
 * 
 * @module core/hud/panels/PerformancePanel
 */
export class PerformancePanel {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this._startFpsCounter();

    lcardsLog.debug('[PerformancePanel] 🚀 Performance panel initialized');
  }

  /**
   * Start FPS counter
   * @private
   */
  _startFpsCounter() {
    const update = () => {
      const now = performance.now();
      this.frameCount++;

      if (now >= this.lastTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
        this.frameCount = 0;
        this.lastTime = now;
      }

      this._animationFrame = requestAnimationFrame(update);
    };
    
    this._animationFrame = requestAnimationFrame(update);
  }

  /**
   * Capture performance data
   * @returns {Object} Performance metrics
   */
  captureData() {
    const data = {
      fps: this.fps,
      memory: null,
      timing: {}
    };

    // Memory info (Chrome only)
    if (performance.memory) {
      data.memory = {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
      };
    }

    // Get MSD performance data if available
    if (window.lcards?.debug?.msd?.getPerf) {
      try {
        const msdPerf = window.lcards.debug.msd.getPerf();
        if (msdPerf && msdPerf.timers) {
          // Take top 5 slowest timers
          const timers = Object.entries(msdPerf.timers)
            .map(([key, value]) => ({
              key,
              avg: value.count > 0 ? value.total / value.count : 0,
              count: value.count,
              max: value.max || 0
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5);

          timers.forEach(timer => {
            data.timing[timer.key] = {
              avg: timer.avg,
              count: timer.count,
              max: timer.max
            };
          });
        }
      } catch (error) {
        lcardsLog.warn('[PerformancePanel] ⚠️ Failed to get MSD performance data:', error);
      }
    }

    // Navigation timing (page load metrics)
    if (performance.timing && performance.timing.loadEventEnd) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      if (loadTime > 0) {
        data.pageLoadTime = (loadTime / 1000).toFixed(2);
      }
    }

    return data;
  }

  /**
   * Render panel HTML
   * @param {Object} data - Panel data from captureData()
   * @returns {string} HTML string
   */
  renderHtml(data) {
    let html = '<div class="performance-panel">';
    html += '<h4>⏱️ Performance Monitor</h4>';

    // FPS metric
    html += '<div class="perf-section">';
    html += '<div class="perf-metric">';
    html += '<label>FPS:</label>';
    const fpsClass = data.fps < 30 ? 'warning' : data.fps < 50 ? 'medium' : 'good';
    html += `<span class="perf-value ${fpsClass}">${data.fps}</span>`;
    html += '</div>';

    // Memory metrics (if available)
    if (data.memory) {
      html += '<div class="perf-metric">';
      html += '<label>Memory:</label>';
      html += `<span class="perf-value">${data.memory.used} MB / ${data.memory.total} MB</span>`;
      html += '</div>';

      const usagePercent = ((parseFloat(data.memory.used) / parseFloat(data.memory.total)) * 100).toFixed(0);
      const memClass = usagePercent > 80 ? 'warning' : usagePercent > 60 ? 'medium' : 'good';
      html += '<div class="perf-metric">';
      html += '<label>Usage:</label>';
      html += `<span class="perf-value ${memClass}">${usagePercent}%</span>`;
      html += '</div>';
    }

    // Page load time (if available)
    if (data.pageLoadTime) {
      html += '<div class="perf-metric">';
      html += '<label>Page Load:</label>';
      html += `<span class="perf-value">${data.pageLoadTime}s</span>`;
      html += '</div>';
    }

    html += '</div>'; // perf-section

    // Timing data (if available)
    const timingEntries = Object.entries(data.timing);
    if (timingEntries.length > 0) {
      html += '<div class="perf-section">';
      html += '<h5>Top Timings</h5>';
      
      timingEntries.forEach(([key, timing]) => {
        const avgClass = timing.avg > 50 ? 'warning' : timing.avg > 20 ? 'medium' : 'good';
        html += '<div class="perf-metric-row">';
        html += `<span class="perf-metric-name">${key}</span>`;
        html += `<span class="perf-value ${avgClass}">${timing.avg.toFixed(2)}ms</span>`;
        html += '</div>';
        html += `<div class="perf-metric-detail">Count: ${timing.count} • Max: ${timing.max.toFixed(1)}ms</div>`;
      });
      
      html += '</div>';
    }

    // Help text
    html += '<div class="perf-help">';
    html += '<p><strong>💡 For deeper analysis:</strong></p>';
    html += '<ul>';
    html += '<li>Use browser dev tools (F12) → Performance tab</li>';
    html += '<li>Check Home Assistant Developer Tools → Stats</li>';
    html += '<li>Enable verbose logging: <code>window.lcards.setGlobalLogLevel("debug")</code></li>';
    html += '</ul>';
    html += '</div>';

    html += '</div>'; // performance-panel

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
        .performance-panel h4 {
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        }
        .performance-panel h5 {
          margin: 8px 0 6px 0;
          font-size: 0.95em;
          opacity: 0.9;
        }
        .perf-section {
          margin-bottom: 16px;
          padding: 8px;
          background: rgba(0, 255, 255, 0.05);
          border-radius: 4px;
        }
        .perf-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }
        .perf-metric label {
          font-size: 0.9em;
          opacity: 0.8;
        }
        .perf-value {
          font-weight: bold;
          font-size: 1.1em;
        }
        .perf-value.good {
          color: #66ff99;
        }
        .perf-value.medium {
          color: #ffcc66;
        }
        .perf-value.warning {
          color: #ff6666;
        }
        .perf-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }
        .perf-metric-name {
          font-size: 0.85em;
          opacity: 0.9;
        }
        .perf-metric-detail {
          font-size: 0.75em;
          opacity: 0.6;
          padding-left: 8px;
          margin-bottom: 4px;
        }
        .perf-help {
          margin-top: 16px;
          padding: 8px;
          background: rgba(0, 255, 255, 0.08);
          border-left: 3px solid rgba(0, 255, 255, 0.4);
          border-radius: 4px;
          font-size: 0.85em;
        }
        .perf-help p {
          margin: 0 0 8px 0;
        }
        .perf-help ul {
          margin: 0;
          padding-left: 20px;
        }
        .perf-help li {
          margin: 4px 0;
          line-height: 1.4;
        }
        .perf-help code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
      </style>
    `;
  }

  /**
   * Cleanup panel resources
   */
  destroy() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    lcardsLog.debug('[PerformancePanel] 🗑️ Panel cleanup completed');
  }
}
