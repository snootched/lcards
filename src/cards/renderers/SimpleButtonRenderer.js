/**
 * @fileoverview Simple Button Renderer for SimpleCards
 *
 * Standalone button renderer designed specifically for SimpleCard architecture.
 * Does NOT extend MSD renderers to avoid conflicts with existing MSD functionality.
 *
 * @module cards/renderers/SimpleButtonRenderer
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Standalone button renderer for SimpleCards
 *
 * This is a clean, minimal implementation that doesn't depend on MSD renderers.
 * It directly uses the singleton core systems for theme and preset management.
 *
 * @class SimpleButtonRenderer
 */
export class SimpleButtonRenderer {
  constructor() {
    this.rendererName = 'SimpleButtonRenderer';

    // Will resolve singletons lazily when needed
    this._themeManager = null;
    this._stylePresetManager = null;
    this._initialized = false;
  }

  /**
   * Initialize singleton connections
   * @private
   */
  _initializeSingletons() {
    if (this._initialized) return true;

    // Resolve ThemeManager from core singletons
    if (window.lcards?.core?.getThemeManager) {
      this._themeManager = window.lcards.core.getThemeManager();
      lcardsLog.debug(`[${this.rendererName}] ✅ Found ThemeManager in core singletons`);
    } else {
      lcardsLog.debug(`[${this.rendererName}] ⚠️ ThemeManager not ready yet`);
    }

    // Resolve StylePresetManager from core singletons
    if (window.lcards?.core?.getStylePresetManager) {
      this._stylePresetManager = window.lcards.core.getStylePresetManager();
      lcardsLog.debug(`[${this.rendererName}] ✅ Found StylePresetManager in core singletons`);
    } else {
      lcardsLog.debug(`[${this.rendererName}] ⚠️ StylePresetManager not ready yet`);
    }

    // Only mark as initialized if we have the core singletons
    const isReady = !!this._themeManager && !!this._stylePresetManager;
    if (isReady) {
      this._initialized = true;
      lcardsLog.debug(`[${this.rendererName}] ✅ Fully initialized with singleton support`, {
        hasThemeManager: !!this._themeManager,
        hasStylePresetManager: !!this._stylePresetManager
      });
    } else {
      lcardsLog.debug(`[${this.rendererName}] ⏳ Waiting for singletons to be ready`, {
        hasThemeManager: !!this._themeManager,
        hasStylePresetManager: !!this._stylePresetManager
      });
    }

    return isReady;
  }

  /**
   * Check if singletons are ready and wait if needed
   * @private
   */
  async _waitForSingletons() {
    const maxAttempts = 50; // 5 seconds max
    const delay = 100; // 100ms between attempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this._initializeSingletons()) {
        return true; // Singletons are ready
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    lcardsLog.warn(`[${this.rendererName}] ⚠️ Timeout waiting for singletons - proceeding with fallbacks`);
    return false;
  }    /**
   * Render a simple button with the given configuration
   * @param {HTMLElement} element - The DOM element to render into
   * @param {Object} config - The button configuration
   * @returns {Promise<void>}
   */
  async renderButton(element, config) {
    if (!element || !config) {
      lcardsLog.error(`[${this.rendererName}] Missing required parameters`);
      return;
    }

    lcardsLog.debug(`[${this.rendererName}] Rendering button`, config);

    // Wait for singletons to be ready
    await this._waitForSingletons();

    // Store element for action handling
    this.element = element;
    this.config = config;

    // Resolve button style
    const buttonStyle = await this._resolveButtonStyle(config);

    // Prepare text configuration
    const textConfig = this._prepareTextConfiguration(config, buttonStyle);

    // Generate button markup
    const markup = this._generateButtonMarkup(buttonStyle, textConfig);

    // Apply to element
    element.innerHTML = markup;

    lcardsLog.debug(`[${this.rendererName}] Button rendered successfully`);
  }  /**
   * Resolve button style with preset support
   * @private
   */
  _resolveButtonStyle(baseStyle = {}, presetName = null) {
    let resolvedStyle = { ...baseStyle };

    // Apply preset if available and StylePresetManager is ready
    if (presetName && this._stylePresetManager) {
      const preset = this._stylePresetManager.getPreset('button', presetName);
      if (preset && preset.style) {
        resolvedStyle = {
          ...preset.style,
          ...resolvedStyle // base style overrides preset
        };
        lcardsLog.debug(`[${this.rendererName}] ✅ Applied preset '${presetName}': ${Object.keys(preset.style).join(', ')}`);
      } else {
        lcardsLog.warn(`[${this.rendererName}] ⚠️ Preset '${presetName}' not found in StylePresetManager`);
        // Add fallback preset logic for common presets
        resolvedStyle = {
          ...this._getFallbackPresetStyle(presetName),
          ...resolvedStyle
        };
      }
    } else if (presetName) {
      lcardsLog.debug(`[${this.rendererName}] Using fallback preset for '${presetName}' (StylePresetManager not ready)`);
      resolvedStyle = {
        ...this._getFallbackPresetStyle(presetName),
        ...resolvedStyle
      };
    }

    // Apply theme tokens
    resolvedStyle = this._resolveThemeTokens(resolvedStyle);

    return resolvedStyle;
  }

  /**
   * Get fallback preset styles when StylePresetManager isn't available
   * @private
   */
  _getFallbackPresetStyle(presetName) {
    const fallbackPresets = {
      'lozenge': {
        cornerRadius: 30,
        primary: 'var(--lcars-orange, #FF9900)',
        secondary: 'var(--lcars-color-secondary, #000000)',
        textColor: 'var(--lcars-color-text, #FFFFFF)',
        strokeWidth: 2,
        fontSize: 16,
        fontWeight: 'bold'
      },
      'pill': {
        cornerRadius: 50,
        primary: 'var(--lcars-blue, #0099FF)',
        secondary: 'var(--lcars-color-secondary, #000000)',
        textColor: 'var(--lcars-color-text, #FFFFFF)',
        strokeWidth: 1,
        fontSize: 14
      },
      'rectangle': {
        cornerRadius: 5,
        primary: 'var(--lcars-red, #FF0000)',
        secondary: 'var(--lcars-color-secondary, #000000)',
        textColor: 'var(--lcars-color-text, #FFFFFF)',
        strokeWidth: 2,
        fontSize: 14
      }
    };

    return fallbackPresets[presetName] || {
      primary: 'var(--lcars-orange, #FF9900)',
      textColor: 'var(--lcars-color-text, #FFFFFF)'
    };
  }

  /**
   * Resolve theme tokens in style values
   * @private
   */
  _resolveThemeTokens(style) {
    if (!this._themeManager) return style;

    const resolved = {};
    for (const [key, value] of Object.entries(style)) {
      if (typeof value === 'string' && value.startsWith('var(--')) {
        // Extract CSS variable name
        const tokenMatch = value.match(/var\(--([^,)]+)/);
        if (tokenMatch) {
          const tokenPath = tokenMatch[1].replace(/-/g, '.');
          const tokenValue = this._themeManager.getToken(tokenPath);
          resolved[key] = tokenValue || value; // fallback to original
        } else {
          resolved[key] = value;
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Generate SVG markup for button with advanced text support
   * @private
   */
  _generateButtonMarkup({ textConfig, style, width, height, cornerRadius }) {
    const {
      primary = '#FF9900',
      secondary = '#000000',
      strokeWidth = 2
    } = style;

    // Resolve actual color values (not CSS variables for SVG)
    const resolvedPrimary = this._resolveCSSValue(primary) || '#FF9900';
    const resolvedSecondary = this._resolveCSSValue(secondary) || '#000000';

    // Generate styles for each text element
    const textStyles = textConfig.map((text, index) => `
          .button-text-${index} {
            fill: ${text.color};
            font-family: 'LCARS', 'Antonio', sans-serif;
            font-size: ${text.fontSize}px;
            font-weight: ${text.fontWeight};
            text-anchor: ${text.coordinates.anchor};
            dominant-baseline: ${text.coordinates.baseline};
          }`).join('');

    // Generate text elements
    const textElements = textConfig.map((text, index) => `
        <text
          class="button-text button-text-${index}"
          id="${text.id}"
          x="${text.coordinates.x}"
          y="${text.coordinates.y}">
          ${this._escapeXML(text.text)}
        </text>`).join('');

    return `
      <defs>
        <style>
          .button-bg {
            fill: ${resolvedPrimary};
            stroke: ${resolvedSecondary};
            stroke-width: ${strokeWidth};
          }${textStyles}
        </style>
      </defs>

      <!-- Button background -->
      <g data-button-id="simple-button" class="button-group">
        <rect
          class="button-bg button-clickable"
          x="${strokeWidth/2}"
          y="${strokeWidth/2}"
          width="${width - strokeWidth}"
          height="${height - strokeWidth}"
          rx="${cornerRadius}"
          ry="${cornerRadius}"
        />

        <!-- Button texts -->${textElements}
      </g>
    `.trim();
  }  /**
   * Prepare text configuration from various input formats
   * @private
   */
  _prepareTextConfiguration({ label, texts, content, width, height, style }) {
    const textConfig = [];

    if (texts && Array.isArray(texts)) {
      // Use MSD-style texts array
      texts.forEach((textItem, index) => {
        const config = {
          id: `text-${index}`,
          text: textItem.text || textItem.value || '',
          position: this._normalizeTextPosition(textItem.position || 'center'),
          fontSize: textItem.fontSize || style.fontSize || 14,
          fontWeight: textItem.fontWeight || style.fontWeight || 'normal',
          color: this._resolveCSSValue(textItem.color || style.textColor || '#FFFFFF'),
          anchor: textItem.anchor || 'middle'
        };

        // Calculate position coordinates
        config.coordinates = this._calculateTextPosition(config.position, width, height, config.fontSize);
        textConfig.push(config);
      });
    } else {
      // Use simple label or content
      const text = label || content || 'Button';
      const config = {
        id: 'text-main',
        text: text,
        position: 'center',
        fontSize: style.fontSize || 14,
        fontWeight: style.fontWeight || 'bold',
        color: this._resolveCSSValue(style.textColor || '#FFFFFF'),
        anchor: 'middle'
      };

      config.coordinates = this._calculateTextPosition('center', width, height, config.fontSize);
      textConfig.push(config);
    }

    return textConfig;
  }

  /**
   * Normalize text position to standard format
   * @private
   */
  _normalizeTextPosition(position) {
    const positionMap = {
      'top': 'center-top',
      'bottom': 'center-bottom',
      'center': 'center-center',
      'left': 'left-center',
      'right': 'right-center',
      'top-left': 'left-top',
      'top-right': 'right-top',
      'bottom-left': 'left-bottom',
      'bottom-right': 'right-bottom'
    };

    return positionMap[position] || position || 'center-center';
  }

  /**
   * Calculate text position coordinates
   * @private
   */
  _calculateTextPosition(position, width, height, fontSize) {
    const padding = 8; // Base padding from edges

    const positions = {
      'center-top': { x: width / 2, y: padding + fontSize, anchor: 'middle', baseline: 'hanging' },
      'center-center': { x: width / 2, y: height / 2 + fontSize / 3, anchor: 'middle', baseline: 'central' },
      'center-bottom': { x: width / 2, y: height - padding, anchor: 'middle', baseline: 'alphabetic' },
      'left-top': { x: padding, y: padding + fontSize, anchor: 'start', baseline: 'hanging' },
      'left-center': { x: padding, y: height / 2 + fontSize / 3, anchor: 'start', baseline: 'central' },
      'left-bottom': { x: padding, y: height - padding, anchor: 'start', baseline: 'alphabetic' },
      'right-top': { x: width - padding, y: padding + fontSize, anchor: 'end', baseline: 'hanging' },
      'right-center': { x: width - padding, y: height / 2 + fontSize / 3, anchor: 'end', baseline: 'central' },
      'right-bottom': { x: width - padding, y: height - padding, anchor: 'end', baseline: 'alphabetic' }
    };

    return positions[position] || positions['center-center'];
  }

  /**
   * Resolve CSS variables to actual color values
   * @private
   */
  _resolveCSSValue(cssValue) {
    if (!cssValue || typeof cssValue !== 'string') return cssValue;

    // Handle CSS variables like var(--lcars-orange, #FF9900)
    const varMatch = cssValue.match(/var\(--([^,)]+)(?:,\s*([^)]+))?\)/);
    if (varMatch) {
      const varName = varMatch[1];
      const fallback = varMatch[2];

      // Try to get value from theme manager
      if (this._themeManager) {
        const tokenPath = varName.replace(/-/g, '.');
        const resolvedValue = this._themeManager.getToken(tokenPath);
        if (resolvedValue) return resolvedValue;
      }

      // Use fallback value
      return fallback || cssValue;
    }

    return cssValue;
  }

  /**
   * Escape XML characters for safe SVG rendering
   * @private
   */
  _escapeXML(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get renderer statistics (for debugging)
   * @returns {Object} Renderer stats
   */
  getStats() {
    return {
      rendererName: this.rendererName,
      initialized: this._initialized,
      hasThemeManager: !!this._themeManager,
      hasStylePresetManager: !!this._stylePresetManager
    };
  }
}

/**
 * Static render method for easy access
 */
SimpleButtonRenderer.render = function(buttonConfig, buttonStyle, dimensions, position, context) {
  const renderer = new SimpleButtonRenderer();
  return renderer.render(buttonConfig, buttonStyle, dimensions, position, context);
};