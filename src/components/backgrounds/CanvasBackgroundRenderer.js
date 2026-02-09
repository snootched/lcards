/**
 * Canvas Background Renderer
 * 2D fallback renderer for devices without WebGL support
 * 
 * @module components/backgrounds/CanvasBackgroundRenderer
 */
import { lcardsLog } from '../../utils/lcards-logging.js';

export class CanvasBackgroundRenderer {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.offset = { x: 0, y: 0 };
  }

  /**
   * Initialize canvas renderer
   * @returns {boolean} True if initialization succeeded
   */
  init() {
    try {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.container.clientWidth;
      this.canvas.height = this.container.clientHeight;
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      
      this.ctx = this.canvas.getContext('2d');
      this.container.appendChild(this.canvas);

      // Start render loop
      this.animate();
      
      lcardsLog.info('[Canvas] Background renderer initialized');
      return true;
    } catch (error) {
      lcardsLog.error('[Canvas] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Draw 2D grid
   * @private
   */
  _drawGrid() {
    const { width, height } = this.canvas;
    const spacing = 50;
    
    this.ctx.strokeStyle = 'rgba(51, 51, 51, 0.5)';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = (this.offset.x % spacing); x < width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = (this.offset.y % spacing); y < height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this._drawGrid();

    // Auto-scroll
    this.offset.x += 0.5;
    this.offset.y += 0.5;
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.canvas) return;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
