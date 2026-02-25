/**
 * Animation Performance Monitor
 * Tracks FPS and emits performance events for auto-degradation
 *
 * @module core/animation/PerformanceMonitor
 */
export class AnimationPerformanceMonitor {
  constructor() {
    this.frames = [];
    this.lastTime = performance.now();
    this.isMonitoring = false;
    this.currentFPS = 60;
    this._startTime = null;
    this._settleMs = 3000;       // Ignore readings for first 3s (startup jank)
    this._consecutiveLow = 0;   // Consecutive checks below disable3D threshold
    this._lowRequiredCount = 3; // Require 3 consecutive low-FPS checks before triggering disable
    this.thresholds = {
      disable3D: 20,      // Disable WebGL if FPS < 20
      reduceEffects: 40   // Reduce particle count if FPS < 40
    };
  }

  /**
   * Start monitoring performance
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this._startTime = performance.now();
    this._consecutiveLow = 0;
    this._measure();
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    this.isMonitoring = false;
  }

  /**
   * Internal measurement loop
   * @private
   */
  _measure() {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.frames.push(delta);
    if (this.frames.length > 60) this.frames.shift(); // Keep last 60 frames

    // Calculate FPS every 60 frames
    if (this.frames.length === 60) {
      const avg = this.frames.reduce((a, b) => a + b) / 60;
      this.currentFPS = Math.round(1000 / avg);

      // Only check thresholds after settle period
      const elapsed = performance.now() - this._startTime;
      if (elapsed >= this._settleMs) {
        this._checkPerformance();
      }
    }

    requestAnimationFrame(() => this._measure());
  }

  /**
   * Check performance thresholds and emit event
   * @private
   */
  _checkPerformance() {
    const belowDisable = this.currentFPS < this.thresholds.disable3D;

    // Require multiple consecutive low readings before triggering disable
    if (belowDisable) {
      this._consecutiveLow++;
    } else {
      this._consecutiveLow = 0;
    }

    const event = new CustomEvent('lcards:performance-check', {
      detail: {
        fps: this.currentFPS,
        shouldDisable3D: this._consecutiveLow >= this._lowRequiredCount,
        shouldReduceEffects: this.currentFPS < this.thresholds.reduceEffects
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current FPS
   * @returns {number} Current frames per second
   */
  getFPS() {
    return this.currentFPS;
  }

  /**
   * Update performance thresholds
   * @param {Object} thresholds - New threshold values
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}
