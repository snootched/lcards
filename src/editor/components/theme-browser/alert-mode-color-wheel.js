/**
 * @fileoverview Alert Mode Color Wheel Visualization
 *
 * Interactive SVG visualization showing HSL color transformations for alert modes.
 * Displays original colors, transformed colors, hue shift targets, and anchor ranges.
 *
 * @element alert-mode-color-wheel
 */

import { LitElement, html, css, svg } from 'lit';
import { ColorUtils } from '../../../core/themes/ColorUtils.js';

export class AlertModeColorWheel extends LitElement {
  static properties = {
    originalColors: { type: Array }, // [{color, name, varName}, ...]
    transformedColors: { type: Array }, // [{color, name}, ...]
    anchorConfig: { type: Object }, // {centerHue, range, strength}
    hueShift: { type: Number },
    showLabels: { type: Boolean },
    showArrows: { type: Boolean },
    hiddenVariables: { type: Set, state: true } // Track which variables are hidden
  };

  constructor() {
    super();
        /** @type {any} */
        this.anchorConfig = undefined;
        /** @type {any} */
        this.hueShift = undefined;
        /** @type {any} */
        this.originalColors = undefined;
        /** @type {any} */
        this.showArrows = undefined;
        /** @type {any} */
        this.transformedColors = undefined;
    this.hiddenVariables = new Set();
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .color-wheel-container {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      aspect-ratio: 1;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .hsl-wheel-segment {
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .hsl-wheel-segment:hover {
      opacity: 1;
      filter: brightness(1.1);
    }

    .anchor-range {
      fill: rgba(255, 255, 255, 0.15);
      stroke: rgba(255, 255, 255, 0.4);
      stroke-width: 2;
      stroke-dasharray: 5, 5;
    }

    .hue-shift-indicator {
      stroke: rgba(255, 255, 255, 0.8);
      stroke-width: 3;
      fill: none;
      marker-end: url(#arrowhead);
    }

    .original-dot {
      stroke: rgba(0, 0, 0, 0.8);
      stroke-width: 1;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .original-dot:hover {
      stroke-width: 2;
      filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
      transform-origin: center;
    }

    .transformed-dot {
      stroke: rgba(255, 255, 255, 0.9);
      stroke-width: 1;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .transformed-dot:hover {
      stroke-width: 2;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
    }

    .transform-arrow {
      stroke: rgba(255, 255, 255, 0.5);
      stroke-width: 1.5;
      fill: none;
      marker-end: url(#transform-arrowhead);
    }

    .wheel-label {
      font-size: 8px;
      fill: var(--primary-text-color);
      text-anchor: middle;
      pointer-events: none;
    }

    .legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px 12px;
      margin-top: 16px;
      font-size: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
      border: 1px solid transparent;
    }

    .legend-item:hover {
      background: var(--secondary-background-color);
      border-color: var(--divider-color);
    }

    .legend-item.hidden {
      opacity: 0.4;
      text-decoration: line-through;
    }

    .legend-shapes {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .legend-circle {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.8);
      flex-shrink: 0;
    }

    .legend-square {
      width: 8px;
      height: 8px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  render() {
    return html`
      <div class="color-wheel-container">
        <svg viewBox="-130 -130 260 260" xmlns="http://www.w3.org/2000/svg">
          <!-- Define arrow markers -->
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 255, 255, 0.8)" />
            </marker>
            <marker
              id="transform-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="2.5"
              orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill="rgba(255, 255, 255, 0.5)" />
            </marker>
          </defs>

          <!-- Background HSL wheel -->
          ${this._renderHSLWheel()}

          <!-- Anchor range (if configured) -->
          // @ts-ignore - TS2339: auto-suppressed
          ${this.anchorConfig ? this._renderAnchorRange() : ''}

          <!-- Hue shift target indicator -->
          // @ts-ignore - TS2339: auto-suppressed
          ${this.hueShift !== null && this.hueShift !== undefined ? this._renderHueShiftTarget() : ''}

          <!-- Transformation arrows -->
          // @ts-ignore - TS2339: auto-suppressed
          ${this.showArrows ? this._renderTransformationArrows() : ''}

          <!-- Original color positions -->
          ${this._renderOriginalDots()}

          <!-- Transformed color positions -->
          ${this._renderTransformedDots()}

          <!-- Center circle for reference -->
          <circle cx="0" cy="0" r="20" fill="none" stroke="var(--divider-color)" stroke-width="1" />
        </svg>
      </div>

      ${this._renderInteractiveLegend()}
    `;
  }

  /**
   * Render interactive legend with clickable variable names
   */
  _renderInteractiveLegend() {
    // @ts-ignore - TS2339: auto-suppressed
    if (!this.originalColors || this.originalColors.length === 0) {
      return html``;
    }

    return html`
      <div class="legend">
        // @ts-ignore - TS2339: auto-suppressed
        ${this.originalColors.map((colorData, index) => {
          const isHidden = this.hiddenVariables.has(colorData.varName);
          // @ts-ignore - TS2339: auto-suppressed
          const transformedColor = this.transformedColors[index];

          return html`
            <div
              class="legend-item ${isHidden ? 'hidden' : ''}"
              @click="${() => this._toggleVariable(colorData.varName)}"
              title="${isHidden ? 'Click to show' : 'Click to hide'}"
            >
              <div class="legend-shapes">
                <div class="legend-circle" style="background-color: ${colorData.color};"></div>
                <div class="legend-square" style="background-color: ${transformedColor?.color || colorData.color};"></div>
              </div>
              <span class="legend-label" title="${colorData.varName}">${colorData.name}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * Toggle variable visibility
   */
  _toggleVariable(varName) {
    if (this.hiddenVariables.has(varName)) {
      this.hiddenVariables.delete(varName);
    } else {
      this.hiddenVariables.add(varName);
    }
    // Create new Set to trigger reactivity
    this.hiddenVariables = new Set(this.hiddenVariables);
    this.requestUpdate();
  }

  /**
   * Render the background HSL color wheel
   */
  _renderHSLWheel() {
    const segments = 36; // 10° per segment
    const innerRadius = 25;
    const outerRadius = 100;

    return svg`
      <g class="hsl-wheel">
        ${Array.from({ length: segments }).map((_, i) => {
          const startHue = (i * 360) / segments;
          const endHue = ((i + 1) * 360) / segments;
          const midHue = (startHue + endHue) / 2;
          const color = this._hslToRgb(midHue, 70, 60);

          return svg`
            <path
              class="hsl-wheel-segment"
              d="${this._createArcPath(innerRadius, outerRadius, startHue, endHue)}"
              fill="${color}"
            />
          `;
        })}
      </g>
    `;
  }

  /**
   * Render the anchor range visualization
   */
  _renderAnchorRange() {
    // @ts-ignore - TS2339: auto-suppressed
    const { centerHue, range } = this.anchorConfig;
    const startHue = (centerHue - range + 360) % 360;
    const endHue = (centerHue + range) % 360;
    const innerRadius = 95;
    const outerRadius = 115;

    return svg`
      <path
        class="anchor-range"
        d="${this._createArcPath(innerRadius, outerRadius, startHue, endHue)}"
      />
      <text
        x="0"
        y="-110"
        class="wheel-label"
        style="font-weight: 600;">
        Anchor Range
      </text>
    `;
  }

  /**
   * Render hue shift target indicator
   */
  _renderHueShiftTarget() {
    // @ts-ignore - TS2339: auto-suppressed
    const angle = (this.hueShift * Math.PI) / 180;
    const innerR = 105;
    const outerR = 125;
    const x1 = Math.cos(angle - Math.PI / 2) * innerR;
    const y1 = Math.sin(angle - Math.PI / 2) * innerR;
    const x2 = Math.cos(angle - Math.PI / 2) * outerR;
    const y2 = Math.sin(angle - Math.PI / 2) * outerR;

    return svg`
      <line
        class="hue-shift-indicator"
        x1="${x1}"
        y1="${y1}"
        x2="${x2}"
        y2="${y2}"
      />
      <text
        x="${x2 * 1.1}"
        y="${y2 * 1.1}"
        class="wheel-label"
        style="font-weight: 600;">
        // @ts-ignore - TS2339: auto-suppressed
        Target Hue: ${this.hueShift}°
      </text>
    `;
  }

  /**
   * Render transformation arrows from original to transformed
   */
  _renderTransformationArrows() {
    // @ts-ignore - TS2339: auto-suppressed
    if (this.originalColors.length !== this.transformedColors.length) {
      return '';
    }

    return svg`
      <g class="transform-arrows">
        // @ts-ignore - TS2339: auto-suppressed
        ${this.originalColors
          .filter(orig => !this.hiddenVariables.has(orig.varName))
          .map((orig, filteredIndex) => {
            // Find the actual index in the original array
            // @ts-ignore - TS2339: auto-suppressed
            const actualIndex = this.originalColors.indexOf(orig);
            // @ts-ignore - TS2339: auto-suppressed
            const transformed = this.transformedColors[actualIndex];
            const origPos = this._colorToPosition(orig.color);
            const transPos = this._colorToPosition(transformed.color);

            // Only draw arrow if there's a meaningful transformation
            const distance = Math.sqrt(
              Math.pow(transPos.x - origPos.x, 2) +
              Math.pow(transPos.y - origPos.y, 2)
            );

            if (distance < 2) return ''; // Skip if colors are too close

            return svg`
              <line
                class="transform-arrow"
                x1="${origPos.x}"
                y1="${origPos.y}"
                x2="${transPos.x}"
                y2="${transPos.y}"
              />
            `;
          })}
      </g>
    `;
  }

  /**
   * Render original color dots (circles with actual colors + black border)
   */
  _renderOriginalDots() {
    return svg`
      <g class="original-dots">
        // @ts-ignore - TS2339: auto-suppressed
        ${this.originalColors
          .filter(colorData => !this.hiddenVariables.has(colorData.varName))
          .map(colorData => {
            const pos = this._colorToPosition(colorData.color);
            return svg`
              <circle
                class="original-dot"
                cx="${pos.x}"
                cy="${pos.y}"
                r="5"
                fill="${colorData.color}"
                stroke="#000000"
                stroke-width="1"
                @mouseenter="${(e) => this._handleDotHover(e, true)}"
                @mouseleave="${(e) => this._handleDotHover(e, false)}"
              >
                <title>Original: ${colorData.name || colorData.varName || 'Color'}
${colorData.color}</title>
              </circle>
            `;
          })}
      </g>
    `;
  }

  /**
   * Render transformed color dots (squares with actual colors + white border)
   */
  _renderTransformedDots() {
    return svg`
      <g class="transformed-dots">
        // @ts-ignore - TS2339: auto-suppressed
        ${this.transformedColors
          // @ts-ignore - TS2339: auto-suppressed
          .filter((_, index) => !this.hiddenVariables.has(this.originalColors[index]?.varName))
          .map(colorData => {
            const pos = this._colorToPosition(colorData.color);
            const size = 9; // 9x9 square
            return svg`
              <rect
                class="transformed-dot"
                x="${pos.x - size/2}"
                y="${pos.y - size/2}"
                width="${size}"
                height="${size}"
                fill="${colorData.color}"
                stroke="#ffffff"
                stroke-width="1"
                @mouseenter="${(e) => this._handleDotHover(e, true)}"
                @mouseleave="${(e) => this._handleDotHover(e, false)}"
              >
                <title>Transformed: ${colorData.name || 'Color'}
${colorData.color}</title>
              </rect>
            `;
          })}
      </g>
    `;
  }

  /**
   * Handle hover effect for dots - zoom and enhance
   */
  _handleDotHover(event, isHovering) {
    const element = event.target;
    if (isHovering) {
      // Zoom effect
      const isCircle = element.tagName === 'circle';
      if (isCircle) {
        element.setAttribute('r', '7');
      } else {
        // Square - increase size
        const currentX = parseFloat(element.getAttribute('x'));
        const currentY = parseFloat(element.getAttribute('y'));
        const currentWidth = parseFloat(element.getAttribute('width'));
        const newSize = 13;
        const offset = (newSize - currentWidth) / 2;
        element.setAttribute('x', currentX - offset);
        element.setAttribute('y', currentY - offset);
        element.setAttribute('width', newSize);
        element.setAttribute('height', newSize);
      }
      element.setAttribute('stroke-width', '2');
    } else {
      // Reset
      const isCircle = element.tagName === 'circle';
      if (isCircle) {
        element.setAttribute('r', '5');
      } else {
        // Square - reset size
        const currentX = parseFloat(element.getAttribute('x'));
        const currentY = parseFloat(element.getAttribute('y'));
        const currentWidth = parseFloat(element.getAttribute('width'));
        const originalSize = 9;
        const offset = (currentWidth - originalSize) / 2;
        element.setAttribute('x', currentX + offset);
        element.setAttribute('y', currentY + offset);
        element.setAttribute('width', originalSize);
        element.setAttribute('height', originalSize);
      }
      element.setAttribute('stroke-width', '1');
    }
  }

  /**
   * Convert color to position on wheel (based on HSL)
   */
  _colorToPosition(color) {
    const hsl = this._parseHSL(color);
    if (!hsl) return { x: 0, y: 0 };

    const { hue, saturation } = hsl;
    const angle = (hue * Math.PI) / 180 - Math.PI / 2; // -90° to start at top
    const radius = 25 + (saturation / 100) * 75; // 25-100 radius range

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }

  /**
   * Create SVG arc path
   */
  _createArcPath(innerR, outerR, startAngle, endAngle) {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = Math.cos(startRad) * innerR;
    const y1 = Math.sin(startRad) * innerR;
    const x2 = Math.cos(endRad) * innerR;
    const y2 = Math.sin(endRad) * innerR;
    const x3 = Math.cos(endRad) * outerR;
    const y3 = Math.sin(endRad) * outerR;
    const x4 = Math.cos(startRad) * outerR;
    const y4 = Math.sin(startRad) * outerR;

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${outerR} ${outerR} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;
  }

  /**
   * Parse HSL from various color formats
   */
  _parseHSL(color) {
    if (!color) return null;

    // If already HSL format
    if (color.startsWith('hsl')) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        return {
          hue: parseInt(match[1]),
          saturation: parseInt(match[2]),
          lightness: parseInt(match[3])
        };
      }
    }

    // Convert from hex or rgb
    const rgb = this._parseRGB(color);
    if (!rgb) return null;

    return this._rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Parse RGB from hex or rgb() format
   */
  _parseRGB(color) {
    const rgb = ColorUtils.parseColor(color);
    if (!rgb) return null;
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
  }

  /**
   * Convert RGB to HSL
   */
  _rgbToHsl(r, g, b) {
    const [h, s, l] = ColorUtils.rgbToHsl(r, g, b);
    return { hue: Math.round(h), saturation: Math.round(s), lightness: Math.round(l) };
  }

  /**
   * Convert HSL to RGB hex
   */
  _hslToRgb(h, s, l) {
    return ColorUtils.hslToRgb(h, s, l);
  }
}

customElements.define('alert-mode-color-wheel', AlertModeColorWheel);
