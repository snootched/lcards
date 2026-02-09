/**
 * Background Animation Mixin
 * Adds background rendering layer to LCARdS cards
 * 
 * @module base/mixins/BackgroundAnimationMixin
 */
import { html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { WebGLBackgroundRenderer } from '../../components/backgrounds/WebGLBackgroundRenderer.js';
import { CanvasBackgroundRenderer } from '../../components/backgrounds/CanvasBackgroundRenderer.js';

export const BackgroundAnimationMixin = (superClass) => class extends superClass {
  static get properties() {
    return {
      ...super.properties,
      backgroundAnimation: { type: Object }
    };
  }

  static get styles() {
    return [
      super.styles || [],
      css`
        .lcards-background-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .lcards-card-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .lcards-card-content {
          position: relative;
          z-index: 1;
        }
      `
    ];
  }

  constructor() {
    super();
    this._backgroundRenderer = null;
    this._backgroundContainer = null;
    this._resizeObserver = null;
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Listen for WebGL fallback events
    this._handleWebGLFallback = this._handleWebGLFallback.bind(this);
    window.addEventListener('lcards:webgl-fallback-required', this._handleWebGLFallback);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Cleanup
    this._destroyBackgroundRenderer();
    window.removeEventListener('lcards:webgl-fallback-required', this._handleWebGLFallback);
  }

  /**
   * Handle WebGL fallback event
   * @private
   */
  _handleWebGLFallback(e) {
    if (!this._backgroundRenderer || !(this._backgroundRenderer instanceof WebGLBackgroundRenderer)) {
      return; // Not our renderer
    }

    lcardsLog.info('[BackgroundMixin] Switching to canvas renderer:', e.detail.reason);
    this._destroyBackgroundRenderer();
    this._initializeBackgroundRenderer('canvas');
  }

  /**
   * Render background animation layer
   * @returns {TemplateResult}
   */
  _renderBackgroundAnimation() {
    if (!this.backgroundAnimation?.type) return html``;

    return html`
      <div class="lcards-background-layer">
        <div class="lcards-background-container"></div>
      </div>
    `;
  }

  /**
   * Initialize background renderer after first render
   * @private
   */
  firstUpdated(changedProps) {
    super.firstUpdated?.(changedProps);

    if (this.backgroundAnimation?.type) {
      this._initializeBackgroundRenderer();
    }
  }

  /**
   * Initialize the appropriate background renderer
   * @param {string} forceMode - Force 'webgl' or 'canvas' mode
   * @private
   */
  _initializeBackgroundRenderer(forceMode = null) {
    const container = this.renderRoot.querySelector('.lcards-background-container');
    if (!container) {
      lcardsLog.warn('[BackgroundMixin] Container not found, delaying initialization');
      requestAnimationFrame(() => this._initializeBackgroundRenderer(forceMode));
      return;
    }

    this._backgroundContainer = container;

    const bgType = this.backgroundAnimation.type;
    const rendererMode = forceMode || this.backgroundAnimation.renderer || 'auto';

    // Select renderer based on mode and support
    let renderer = null;

    if (bgType === 'bg-grid-3d') {
      if (rendererMode === 'webgl' || 
          (rendererMode === 'auto' && WebGLBackgroundRenderer.isSupported())) {
        renderer = new WebGLBackgroundRenderer(container, this.backgroundAnimation);
        if (!renderer.init()) {
          // WebGL failed, fallback to canvas
          lcardsLog.warn('[BackgroundMixin] WebGL init failed, using canvas');
          renderer = new CanvasBackgroundRenderer(container, this.backgroundAnimation);
          renderer.init();
        }
      } else {
        // Use canvas renderer
        renderer = new CanvasBackgroundRenderer(container, this.backgroundAnimation);
        renderer.init();
      }
    }

    this._backgroundRenderer = renderer;

    // Setup resize observer
    this._setupResizeObserver();
  }

  /**
   * Setup resize observer for background container
   * @private
   */
  _setupResizeObserver() {
    if (!this._backgroundContainer) return;

    this._resizeObserver = new ResizeObserver(() => {
      if (this._backgroundRenderer?.handleResize) {
        this._backgroundRenderer.handleResize();
      }
    });

    this._resizeObserver.observe(this._backgroundContainer);
  }

  /**
   * Destroy background renderer and cleanup
   * @private
   */
  _destroyBackgroundRenderer() {
    if (this._backgroundRenderer) {
      this._backgroundRenderer.destroy();
      this._backgroundRenderer = null;
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  /**
   * Override render to include background layer
   */
  render() {
    return html`
      <div class="lcards-card-container">
        ${this._renderBackgroundAnimation()}
        <div class="lcards-card-content">
          ${super.render()}
        </div>
      </div>
    `;
  }
};
