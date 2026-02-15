import { BaseEffect } from './BaseEffect.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';
import { ColorUtils } from '../../../themes/ColorUtils.js';

/**
 * GridEffect - Highly configurable scrolling LCARS-style grid background effect
 *
 * Supports:
 * - Major/minor line styling (different widths for grid divisions)
 * - Pattern control (horizontal, vertical, both, diagonal lines)
 * - Cell-based or spacing-based sizing
 * - Border line control
 * - Independent scroll speeds per direction (via scrollSpeedX/Y)
 * - Full anime.js integration for parameter animation
 *
 * Animatable properties (via anime.js):
 * - scrollSpeedX, scrollSpeedY: scroll velocity
 * - lineWidthMinor, lineWidthMajor: line thickness
 * - opacity: transparency
 * - color: line color (with color interpolation)
 * - lineSpacing: cell size
 *
 * @class GridEffect
 * @extends BaseEffect
 */
export class GridEffect extends BaseEffect {
  /**
   * @param {Object} config - Effect configuration
   *
   * Sizing (choose one approach):
   * @param {number} [config.lineSpacing=40] - Space between grid lines in pixels (simple mode)
   * @param {number} [config.numRows] - Number of rows (cell-based mode)
   * @param {number} [config.numCols] - Number of columns (cell-based mode)
   *
   * Line styling:
   * @param {number} [config.lineWidthMinor=1] - Width of minor grid lines
   * @param {number} [config.lineWidthMajor=2] - Width of major grid lines
   * @param {string} [config.color='rgba(255, 153, 102, 0.3)'] - Line color (LCARS orange)
   * @param {string} [config.colorMajor] - Optional separate color for major lines
   *
   * Major/minor grid divisions:
   * @param {number} [config.majorRowInterval=3] - Draw major line every N rows
   * @param {number} [config.majorColInterval=3] - Draw major line every N columns
   *
   * Pattern control:
 * @param {string} [config.pattern='both'] - Which lines to draw: 'both', 'horizontal', 'vertical', 'diagonal', 'hexagonal'
 * @param {boolean} [config.showBorderLines=true] - Draw lines on canvas edges
 * @param {string} [config.direction] - Legacy alias for pattern (deprecated)
 * @param {string} [config.fillColor='transparent'] - Fill color for cell backgrounds
 *
 * Hexagonal pattern (when pattern='hexagonal'):
 * @param {number} [config.hexRadius=40] - Radius of hexagonal cells
   *
   * Scrolling:
   * @param {number} [config.scrollSpeedX=20] - Horizontal scroll speed (pixels/second)
   * @param {number} [config.scrollSpeedY=20] - Vertical scroll speed (pixels/second)
   * @param {number} [config.scrollX=0] - Initial horizontal scroll offset
   * @param {number} [config.scrollY=0] - Initial vertical scroll offset
   */
  constructor(config = {}) {
    super(config);

    // Sizing: cell-based or spacing-based
    this.numRows = config.numRows;
    this.numCols = config.numCols;
    this.lineSpacing = config.lineSpacing ?? 40;

    // Line styling (resolve CSS colors using ColorUtils)
    this.lineWidthMinor = config.lineWidthMinor ?? config.line_width ?? 1; // Support legacy naming
    this.lineWidthMajor = config.lineWidthMajor ?? config.lineWidthMinor ?? 2;
    this.color = ColorUtils.resolveCssVariable(config.color ?? 'rgba(255, 153, 102, 0.3)'); // LCARS orange
    this.colorMajor = config.colorMajor ? ColorUtils.resolveCssVariable(config.colorMajor) : this.color;

    // Fill color for cell backgrounds (in addition to line strokes)
    this.fillColor = config.fillColor ? ColorUtils.resolveCssVariable(config.fillColor) : 'transparent';

    // Major/minor intervals
    this.majorRowInterval = config.majorRowInterval ?? 3;
    this.majorColInterval = config.majorColInterval ?? 3;

    // Pattern control (which lines to draw)
    this.pattern = config.pattern ?? config.direction ?? 'both'; // Support legacy 'direction' naming
    this.showBorderLines = config.showBorderLines ?? true;

    // Hexagonal pattern config
    this.hexRadius = config.hexRadius ?? 40;

    // Scrolling state
    this.scrollX = config.scrollX ?? 0;
    this.scrollY = config.scrollY ?? 0;
    this.scrollSpeedX = config.scrollSpeedX ?? config.scroll_speed_x ?? 20; // Support legacy naming
    this.scrollSpeedY = config.scrollSpeedY ?? config.scroll_speed_y ?? 20;

    // Computed properties (will be set during first draw)
    this._rowHeight = null;
    this._colWidth = null;
    this._totalRows = null;
    this._totalCols = null;

    // Track total scroll distance (never wraps) for infinite grid positioning
    this._totalScrollX = 0;
    this._totalScrollY = 0;

    lcardsLog.debug('[GridEffect] Created enhanced grid effect', {
      mode: this.numRows ? 'cell-based' : 'spacing-based',
      pattern: this.pattern,
      majorIntervals: { row: this.majorRowInterval, col: this.majorColInterval },
      scrollSpeeds: { x: this.scrollSpeedX, y: this.scrollSpeedY },
      lineWidths: { minor: this.lineWidthMinor, major: this.lineWidthMajor },
      colors: { minor: this.color, major: this.colorMajor, fill: this.fillColor }
    });
  }

  /**
   * Compute grid dimensions based on canvas size
   * @private
   */
  _computeGridDimensions(canvasWidth, canvasHeight) {
    if (this.numRows && this.numCols) {
      // Cell-based mode: divide canvas into fixed number of cells
      this._totalRows = this.numRows;
      this._totalCols = this.numCols;
      this._rowHeight = canvasHeight / this.numRows;
      this._colWidth = canvasWidth / this.numCols;
    } else {
      // Spacing-based mode: use fixed spacing between lines
      this._rowHeight = this.lineSpacing;
      this._colWidth = this.lineSpacing;
      this._totalRows = Math.ceil(canvasHeight / this.lineSpacing) + 1;
      this._totalCols = Math.ceil(canvasWidth / this.lineSpacing) + 1;
    }
  }

  /**
   * Update grid scroll position based on speed and deltaTime
   *
   * @param {number} deltaTime - Time since last update in milliseconds
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    super.update(deltaTime, canvasWidth, canvasHeight);

    // Recompute dimensions if canvas size changed
    if (!this._rowHeight || !this._colWidth) {
      this._computeGridDimensions(canvasWidth, canvasHeight);
    }

    // Convert deltaTime from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;

    // Update scroll position (no modulo - let it accumulate infinitely)
    // Pattern tiling in draw() handles the infinite repeat
    this.scrollX += this.scrollSpeedX * this.speed * deltaSeconds;
    this.scrollY += this.scrollSpeedY * this.speed * deltaSeconds;
  }

  /**
   * Draw grid to canvas
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  draw(ctx, canvasWidth, canvasHeight) {
    ctx.save();

    // Apply base transforms (opacity, rotation, scale)
    this.applyTransforms(ctx);

    // Ensure dimensions are computed
    if (!this._rowHeight || !this._colWidth) {
      this._computeGridDimensions(canvasWidth, canvasHeight);
    }

    // Apply scroll offset via translate (unbounded - no wrapping)
    ctx.translate(this.scrollX, this.scrollY);

    // Calculate pattern dimensions (one full grid cycle)
    // For hexagonal patterns, use geometry-based tiling dimensions
    let patternWidth, patternHeight;
    if (this.pattern === 'hexagonal') {
      const hexRadius = this.hexRadius;
      const hexHeight = Math.sqrt(3) * hexRadius;
      // Hexagonal tiling: 2 columns wide (3 * hexRadius), 2 rows tall (2 * hexHeight)
      patternWidth = 3 * hexRadius;
      patternHeight = 2 * hexHeight;
    } else {
      patternWidth = this._totalCols * this._colWidth;
      patternHeight = this._totalRows * this._rowHeight;
    }

    // Calculate starting tile position based on current scroll
    // Use floor division to find which tile the viewport starts in
    const startTileX = Math.floor(-this.scrollX / patternWidth) - 1;
    const startTileY = Math.floor(-this.scrollY / patternHeight) - 1;

    // Calculate how many tiles needed to cover viewport
    const tilesX = Math.ceil(canvasWidth / patternWidth) + 3;
    const tilesY = Math.ceil(canvasHeight / patternHeight) + 3;

    // Draw tiled pattern
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const offsetX = (startTileX + tx) * patternWidth;
        const offsetY = (startTileY + ty) * patternHeight;
        this._drawPattern(ctx, offsetX, offsetY, patternWidth, patternHeight);
      }
    }

    ctx.restore();
  }

  /**
   * Draw the fixed grid pattern at a specific offset position
   * Major/minor lines are determined by row/col position in pattern (not scroll position)
   * @private
   */
  _drawPattern(ctx, offsetX, offsetY, patternWidth, patternHeight) {
    const shouldDrawHorizontal = this.pattern === 'both' || this.pattern === 'horizontal';
    const shouldDrawVertical = this.pattern === 'both' || this.pattern === 'vertical';
    const shouldDrawDiagonal = this.pattern === 'diagonal';
    const shouldDrawHexagonal = this.pattern === 'hexagonal';

    if (shouldDrawDiagonal) {
      this._drawDiagonalPattern(ctx, offsetX, offsetY, patternWidth, patternHeight);
      return;
    }

    if (shouldDrawHexagonal) {
      this._drawHexagonalPattern(ctx, offsetX, offsetY, patternWidth, patternHeight);
      return;
    }

    // Draw cell fills if fillColor is set
    if (this.fillColor && this.fillColor !== 'transparent') {
      ctx.fillStyle = this.fillColor;
      for (let row = 0; row < this._totalRows; row++) {
        for (let col = 0; col < this._totalCols; col++) {
          const x = offsetX + (col * this._colWidth);
          const y = offsetY + (row * this._rowHeight);
          ctx.fillRect(x, y, this._colWidth, this._rowHeight);
        }
      }
    }

    // Draw horizontal lines - major/minor based on fixed row position
    if (shouldDrawHorizontal) {
      for (let row = 0; row <= this._totalRows; row++) {
        const y = offsetY + (row * this._rowHeight);

        // Skip border lines if disabled
        if (!this.showBorderLines && (row === 0 || row === this._totalRows)) {
          continue;
        }

        // Major line determination based on row index in pattern
        const isMajor = this.majorRowInterval > 0 && row % this.majorRowInterval === 0;
        ctx.strokeStyle = isMajor ? this.colorMajor : this.color;
        ctx.lineWidth = isMajor ? this.lineWidthMajor : this.lineWidthMinor;

        ctx.beginPath();
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + patternWidth, y);
        ctx.stroke();
      }
    }

    // Draw vertical lines - major/minor based on fixed col position
    if (shouldDrawVertical) {
      for (let col = 0; col <= this._totalCols; col++) {
        const x = offsetX + (col * this._colWidth);

        // Skip border lines if disabled
        if (!this.showBorderLines && (col === 0 || col === this._totalCols)) {
          continue;
        }

        // Major line determination based on col index in pattern
        const isMajor = this.majorColInterval > 0 && col % this.majorColInterval === 0;
        ctx.strokeStyle = isMajor ? this.colorMajor : this.color;
        ctx.lineWidth = isMajor ? this.lineWidthMajor : this.lineWidthMinor;

        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + patternHeight);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw diagonal hatched pattern
   * @private
   */
  _drawDiagonalPattern(ctx, offsetX, offsetY, patternWidth, patternHeight) {
    const spacing = Math.max(this._colWidth, this._rowHeight);

    // Draw fill first if specified
    if (this.fillColor && this.fillColor !== 'transparent') {
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(offsetX, offsetY, patternWidth, patternHeight);
    }

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidthMinor;

    // Diagonal lines (bottom-left to top-right)
    for (let x = -patternHeight; x < patternWidth; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x, offsetY);
      ctx.lineTo(offsetX + x + patternHeight, offsetY + patternHeight);
      ctx.stroke();
    }

    // Diagonal lines (top-left to bottom-right)
    for (let x = 0; x < patternWidth + patternHeight; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x, offsetY);
      ctx.lineTo(offsetX + x - patternHeight, offsetY + patternHeight);
      ctx.stroke();
    }
  }

  /**
   * Draw hexagonal grid pattern
   * Based on legacy CB-LCARS implementation with major/minor hex support
   * Pattern size is exactly 2 columns x 2 rows for seamless tiling
   * @private
   */
  _drawHexagonalPattern(ctx, offsetX, offsetY, patternWidth, patternHeight) {
    const hexRadius = this.hexRadius;
    const hexHeight = Math.sqrt(3) * hexRadius;

    // Draw fill background if specified
    if (this.fillColor && this.fillColor !== 'transparent') {
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(offsetX, offsetY, patternWidth, patternHeight);
    }

    // Calculate which tile we're in (for major/minor determination)
    const tileCol = Math.floor(offsetX / patternWidth);
    const tileRow = Math.floor(offsetY / patternHeight);

    // Draw exactly 2 columns x 3 rows to ensure coverage with stagger
    // This creates a seamlessly tileable pattern
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        // Offset every other column vertically by half a hex
        const x = offsetX + (col * 1.5 * hexRadius);
        const y = offsetY + (row * hexHeight) + (col % 2 === 1 ? hexHeight / 2 : 0);

        // Calculate global column/row for major/minor determination
        const globalCol = (tileCol * 2) + col;
        const globalRow = (tileRow * 2) + row;

        // Determine if this is a major hex (based on global column/row intervals)
        const isMajor =
          this.majorColInterval > 0 && this.majorRowInterval > 0 &&
          (globalCol % this.majorColInterval === 0) &&
          (globalRow % this.majorRowInterval === 0);

        const lineWidth = isMajor ? this.lineWidthMajor : this.lineWidthMinor;
        const strokeColor = isMajor ? this.colorMajor : this.color;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;

        // Draw hexagon as path
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const px = x + hexRadius * Math.cos(angle);
          const py = y + hexRadius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
}
