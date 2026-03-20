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
    this._settleMs = 5000;       // Ignore readings for first 5s (startup jank + page load)
    this._consecutiveLow = 0;   // Consecutive checks below disable3D threshold
    this._lowRequiredCount = 3; // Require 3 consecutive low-FPS checks before triggering disable
    this._refCount = 0;          // Number of active subscribers (Canvas2DRenderer instances)
    this.thresholds = {
      disable3D: 12,      // Stop renderer entirely if FPS < 12 (3 consecutive checks required)
      reduceEffects: 24   // Skip every other frame if FPS < 24 (below the default 30fps cap)
    };
  }

  /**
   * Register a subscriber and start the measurement loop if not already running.
   * Safe to call multiple times from different Canvas2DRenderer instances — the
   * internal loop starts only once and stops only when all subscribers have
   * called stop().
   *
   * Every call resets the settle window so that late-joining renderers (e.g.
   * background animations that start after initial page load) always get a
   * fresh stabilization period rather than inheriting one started by the very
   * first 1×1 texture renderer.
   */
  start() {
    this._refCount++;
    // Reset settle window on every join — prevents late subscribers from
    // inheriting an already-expired settle period measured during page load.
    this._startTime = performance.now();
    this._consecutiveLow = 0;
    if (this.isMonitoring) return; // loop already running, settle was just reset
    this.isMonitoring = true;
    this._measure();
  }

  /**
   * Unregister a subscriber.  The measurement loop is stopped only when the
   * last subscriber calls stop(), preventing one renderer from silently killing
   * monitoring for all other active renderers.
   */
  stop() {
    this._refCount = Math.max(0, this._refCount - 1);
    if (this._refCount > 0) return; // other subscribers still active
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
   * Get debug information about the performance monitor state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      type: 'AnimationPerformanceMonitor',
      isMonitoring: this.isMonitoring || false,
      currentFPS: this.currentFPS || 0,
      refCount: this._refCount || 0,
      thresholds: this.thresholds || {}
    };
  }

  /**
   * Update performance thresholds
   * @param {Object} thresholds - New threshold values
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}
