import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Canvas2DRenderer - Manages multiple Canvas2D effects with additive composition
 *
 * Coordinates multiple effects rendered to a single canvas with one animation loop.
 * Effects are rendered in order (first added = bottom layer, last added = top layer).
 *
 * @class Canvas2DRenderer
 */
export class Canvas2DRenderer {
  /**
   * @param {HTMLCanvasElement} canvas  - Canvas element to render to
   * @param {Object}            options
   * @param {boolean}           [options.monitorPerformance=true]
   *   Set to false to opt out of the shared PerformanceMonitor.  Use this for
   *   lightweight Canvas2D effects (e.g. shape textures) that should never be
   *   paused by the WebGL/3D performance threshold.
   * @param {number}            [options.targetFps=30]
   *   Maximum frames per second the render loop will produce.  The RAF loop
   *   still runs at the browser's native rate (usually 60fps) but render work
   *   is skipped when the elapsed time since the last drawn frame is less than
   *   1000/targetFps ms.  Defaults to 30 to conserve CPU on low-end devices
   *   such as Android tablets.  Set to 60 (or 0 to disable) for high-refresh
   *   displays where smoother animation is preferred.
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effects = []; // Array of BaseEffect instances
    this._animationId = null;
    this._lastFrameTime = performance.now();
    this._isRunning = false;
    this._shouldReduceEffects = false;
    this._frameSkipCounter = 0;
    this._perfCheckHandler = null;
    this._monitorPerformance = options.monitorPerformance !== false; // default true
    this._visibilityHandler = null;   // document visibilitychange handler
    this._pausedForVisibility = false; // true when RAF paused because tab is hidden
    this._isSuspended = false;         // true when externally suspended (e.g. IntersectionObserver)
    this._pmPaused = false;            // true when we have decremented the PerformanceMonitor ref count

    // Performance recovery state
    this._disabledByPerformance = false; // true when stopped by PerformanceMonitor (not deliberately)
    this._recoveryAttempts = 0;          // backoff counter — increments on each kill, resets on clean start
    this._recoveryTimer = null;          // setTimeout handle for the next recovery probe

    // FPS cap: compute the minimum interval between rendered frames.
    // targetFps=0 disables the cap (render at the native browser rate).
    this._targetFps = options.targetFps ?? 30;
    this._minFrameInterval = this._targetFps > 0 ? 1000 / this._targetFps : 0;

    lcardsLog.info('[Canvas2DRenderer] Initialized', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      targetFps: this._targetFps
    });
  }

  /**
   * Add an effect to the renderer
   * Effects are rendered in the order they are added (first = bottom layer)
   *
   * @param {BaseEffect} effect - Effect instance to add
   */
  addEffect(effect) {
    this.effects.push(effect);

    lcardsLog.debug('[Canvas2DRenderer] Added effect', {
      effectType: effect.constructor.name,
      totalEffects: this.effects.length
    });
  }

  /**
   * Remove an effect from the renderer
   *
   * @param {BaseEffect} effect - Effect instance to remove
   */
  removeEffect(effect) {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
      effect.destroy();
      lcardsLog.debug('[Canvas2DRenderer] Removed effect', {
        effectType: effect.constructor.name,
        totalEffects: this.effects.length
      });
    }
  }

  /**
   * Remove all effects and stop animation
   */
  clear() {
    lcardsLog.debug('[Canvas2DRenderer] Clearing all effects');
    this.effects.forEach(effect => effect.destroy());
    this.effects = [];
    // Cancel any pending performance-recovery probe so a destroyed renderer
    // cannot be accidentally restarted by its own timer.
    if (this._recoveryTimer) {
      clearTimeout(this._recoveryTimer);
      this._recoveryTimer = null;
    }
    this._disabledByPerformance = false;
    this._recoveryAttempts = 0;
    this.stop();
  }

  /**
   * Start animation loop
   */
  start() {
    // Clear the performance-stop flag on any explicit start() so that a
    // deliberate restart is treated as a clean start.
    // _recoveryAttempts is intentionally NOT reset here — it persists across
    // recovery probes so the exponential backoff grows correctly.
    this._disabledByPerformance = false;

    if (this._isRunning) {
      lcardsLog.warn('[Canvas2DRenderer] Already running, ignoring start()');
      return;
    }

    this._isRunning = true;
    this._lastFrameTime = performance.now();

    // Wire up PerformanceMonitor for adaptive quality (opt-out via constructor option)
    if (this._monitorPerformance && window.lcards?.core?.performanceMonitor) {
      window.lcards.core.performanceMonitor.start();
      this._perfCheckHandler = (e) => this._onPerfCheck(e.detail);
      window.addEventListener('lcards:performance-check', this._perfCheckHandler);
    }

    // Pause the RAF loop when the browser tab is hidden; resume on visibility restore.
    this._visibilityHandler = () => {
      if (document.hidden) {
        if (this._isRunning && !this._pausedForVisibility) {
          this._pausedForVisibility = true;
          if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
          }
          // Pause the PM so it does not measure FPS while we are not rendering
          // and then fire shouldDisable3D when the tab comes back.
          this._pausePerformanceMonitor();
          lcardsLog.debug('[Canvas2DRenderer] Paused — tab hidden');
        }
      } else if (this._pausedForVisibility) {
        this._pausedForVisibility = false;
        this._lastFrameTime = performance.now();
        // Only restart if the element is not genuinely off-screen.
        // _isSuspended is set by IntersectionObserver only when the tab is visible
        // (the IO callback is guarded by document.hidden in BackgroundAnimationRenderer),
        // so if it is true here the element really is scrolled out of the viewport.
        if (!this._isSuspended) {
          this._resumePerformanceMonitor();
          lcardsLog.debug('[Canvas2DRenderer] Resumed — tab visible');
          this._animate();
        }
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    this._animate();

    lcardsLog.info('[Canvas2DRenderer] Animation started', {
      effectCount: this.effects.length
    });
  }

  /**
   * Stop animation loop
   */
  stop() {
    if (!this._isRunning) {
      return;
    }

    this._isRunning = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }

    // Clean up PerformanceMonitor listener
    if (this._perfCheckHandler) {
      window.removeEventListener('lcards:performance-check', this._perfCheckHandler);
      this._perfCheckHandler = null;
    }
    // Only decrement PM ref count if we haven't already done so via _pausePerformanceMonitor()
    if (!this._pmPaused && this._monitorPerformance && window.lcards?.core?.performanceMonitor) {
      window.lcards.core.performanceMonitor.stop();
    }
    this._pmPaused = false;

    // Clean up visibilitychange listener
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    this._pausedForVisibility = false;

    // If this is a deliberate stop (not triggered by the PerformanceMonitor),
    // cancel any pending recovery probe and reset the backoff counter so the
    // renderer starts fresh if it is ever restarted.
    if (!this._disabledByPerformance) {
      if (this._recoveryTimer) {
        clearTimeout(this._recoveryTimer);
        this._recoveryTimer = null;
      }
      this._recoveryAttempts = 0;
    }

    lcardsLog.info('[Canvas2DRenderer] Animation stopped');
  }

  /**
   * Handle performance check events from PerformanceMonitor
   * Adapts rendering quality based on measured FPS
   * @private
   */
  _onPerfCheck({ fps, shouldDisable3D, shouldReduceEffects }) {
    // Ignore performance checks while the animation is intentionally paused.
    // The PerformanceMonitor's own RAF loop continues running when we suspend,
    // but with no frames being drawn it measures near-zero FPS.  Acting on those
    // readings would permanently kill the renderer via stop().
    if (this._pausedForVisibility || this._isSuspended) return;

    this._shouldReduceEffects = shouldReduceEffects;

    if (shouldDisable3D && this._isRunning) {
      lcardsLog.warn(`[Canvas2DRenderer] FPS too low (${fps.toFixed(1)}fps), pausing animation`);
      this._disabledByPerformance = true;
      this._recoveryAttempts++;
      this.stop(); // stop() skips recovery cleanup because _disabledByPerformance is true
      this._scheduleRecovery();
    } else if (shouldReduceEffects) {
      lcardsLog.debug(`[Canvas2DRenderer] Reduced quality mode (${fps.toFixed(1)}fps)`);
    }
  }

  /**
   * Schedule a performance-recovery probe after an exponential backoff delay.
   * On success the renderer restarts with a fresh PM settle window; if FPS is
   * still too low the PM will fire shouldDisable3D again and another probe is
   * scheduled (with a longer backoff).
   *
   * Backoff schedule: 5 min → 10 min → 20 min, capped at 30 min.
   * @private
   */
  _scheduleRecovery() {
    if (this._recoveryTimer) return; // already scheduled

    const delayMin = Math.min(5 * Math.pow(2, this._recoveryAttempts - 1), 30);
    const delayMs = delayMin * 60_000;

    lcardsLog.info(`[Canvas2DRenderer] Performance recovery probe in ${delayMin}min (attempt ${this._recoveryAttempts})`);

    this._recoveryTimer = setTimeout(() => {
      this._recoveryTimer = null;

      if (document.hidden || this._isSuspended) {
        // Tab is hidden or card is off-screen — defer without consuming the
        // backoff budget so the full delay is applied next time.
        lcardsLog.debug('[Canvas2DRenderer] Recovery deferred — tab hidden or card off-screen');
        this._recoveryAttempts = Math.max(1, this._recoveryAttempts - 1);
        this._scheduleRecovery();
        return;
      }

      lcardsLog.info(`[Canvas2DRenderer] Attempting performance recovery (attempt ${this._recoveryAttempts})`);
      this._disabledByPerformance = false; // allow stop() to do full cleanup if needed
      this.start(); // PM settle window resets — fresh FPS evaluation after 5s
    }, delayMs);
  }

  /**
   * Detach the PerformanceMonitor subscription so its RAF loop does not
   * accumulate bad FPS readings while our animation is intentionally paused.
   * Idempotent — safe to call multiple times.
   * @private
   */
  _pausePerformanceMonitor() {
    if (this._pmPaused) return; // already paused, don't double-decrement PM ref count
    this._pmPaused = true;
    if (this._perfCheckHandler) {
      window.removeEventListener('lcards:performance-check', this._perfCheckHandler);
    }
    if (this._monitorPerformance && window.lcards?.core?.performanceMonitor) {
      window.lcards.core.performanceMonitor.stop();
    }
  }

  /**
   * Re-attach the PerformanceMonitor subscription with a fresh settle window
   * so stale low-FPS readings from the paused period are discarded.
   * Idempotent — safe to call multiple times.
   * @private
   */
  _resumePerformanceMonitor() {
    if (!this._pmPaused) return; // not paused by us, don't double-increment PM ref count
    this._pmPaused = false;
    if (this._monitorPerformance && window.lcards?.core?.performanceMonitor) {
      window.lcards.core.performanceMonitor.start(); // resets settle window
    }
    if (this._perfCheckHandler) {
      window.addEventListener('lcards:performance-check', this._perfCheckHandler);
    }
  }

  /**
   * Suspend the animation loop without fully stopping the renderer.
   * Used by IntersectionObserver when the card scrolls off-screen.
   * Has no effect if the renderer is not running or already suspended.
   */
  suspendAnimation() {
    if (!this._isRunning || this._isSuspended) return;
    this._isSuspended = true;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    this._pausePerformanceMonitor();
    lcardsLog.debug('[Canvas2DRenderer] Suspended — off-screen');
  }

  /**
   * Resume a previously suspended animation loop.
   * Has no effect if the renderer is not running, not suspended, or the tab
   * is currently hidden (visibility handler will resume when tab comes back).
   */
  resumeAnimation() {
    if (!this._isRunning || !this._isSuspended) return;
    this._isSuspended = false;
    if (!this._pausedForVisibility) {
      this._lastFrameTime = performance.now();
      this._resumePerformanceMonitor();
      lcardsLog.debug('[Canvas2DRenderer] Resumed — back on-screen');
      this._animate();
    }
  }

  /**
   * Animation loop - updates and renders all effects
   * @private
   */
  _animate() {
    if (!this._isRunning || this._isSuspended || this._pausedForVisibility) {
      return;
    }

    // Adaptive quality: skip every other frame when FPS is low
    if (this._shouldReduceEffects) {
      this._frameSkipCounter++;
      if (this._frameSkipCounter % 2 === 0) {
        this._animationId = requestAnimationFrame(() => this._animate());
        return;
      }
    }

    const currentTime = performance.now();

    // FPS cap: if not enough time has elapsed since the last rendered frame,
    // skip this tick but keep the RAF loop alive for the next check.
    if (this._minFrameInterval > 0 && currentTime - this._lastFrameTime < this._minFrameInterval) {
      this._animationId = requestAnimationFrame(() => this._animate());
      return;
    }

    const deltaTime = currentTime - this._lastFrameTime;
    this._lastFrameTime = currentTime;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw each effect
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];

      // Remove inactive effects
      if (!effect.isActive()) {
        this.removeEffect(effect);
        continue;
      }

      // Update effect state
      effect.update(deltaTime, this.canvas.width, this.canvas.height);

      // Draw effect
      effect.draw(this.ctx, this.canvas.width, this.canvas.height);
    }

    // Request next frame
    this._animationId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Resize canvas (call when container size changes)
   *
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;

    lcardsLog.debug('[Canvas2DRenderer] Resized canvas', {
      width,
      height
    });
  }

  /**
   * Cleanup renderer and all effects
   */
  destroy() {
    lcardsLog.info('[Canvas2DRenderer] Destroying renderer');
    this.clear();
  }
}
