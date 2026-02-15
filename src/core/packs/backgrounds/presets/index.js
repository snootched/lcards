/**
 * Background Animation Preset Registry
 *
 * Presets define collections of effects that work together to create
 * background animations. Each preset provides a factory function that
 * creates and configures effect instances.
 *
 * Supports anime.js parameter animation for dynamic effects.
 *
 * @module core/packs/backgrounds/presets
 */
import { GridEffect } from '../effects/GridEffect.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Built-in background animation presets
 */
export const BACKGROUND_PRESETS = {
  /**
   * Grid effect with major/minor line divisions
   * Unified preset combining basic and enhanced grid functionality
   */
  'grid': {
    name: 'Grid',
    description: 'Configurable grid with major/minor line divisions',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:grid] Creating grid effect');

      // Helper function to resolve theme token or use fallback
      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const gridConfig = {
        // Sizing - supports both cell-based and spacing-based
        numRows: config.num_rows,
        numCols: config.num_cols,
        lineSpacing: config.line_spacing ?? resolveToken('components.backgroundAnimation.grid.spacing.default', 40),

        // Line styling - resolve from theme tokens
        lineWidthMinor: config.line_width_minor ?? config.line_width ?? resolveToken('components.backgroundAnimation.grid.line.width', 1),
        lineWidthMajor: config.line_width_major ?? resolveToken('components.backgroundAnimation.grid.line.widthMajor', 2),
        color: config.color ?? resolveToken('components.backgroundAnimation.grid.line.color', 'rgba(255, 153, 102, 0.3)'),
        colorMajor: config.color_major ?? config.color ?? resolveToken('components.backgroundAnimation.grid.line.colorMajor', null),

        // Major line intervals (0 = no major lines)
        majorRowInterval: config.major_row_interval ?? resolveToken('components.backgroundAnimation.grid.intervals.majorRow', 0),
        majorColInterval: config.major_col_interval ?? resolveToken('components.backgroundAnimation.grid.intervals.majorCol', 0),

        // Scrolling
        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.grid.scroll.speedX', 20),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.grid.scroll.speedY', 20),
        pattern: config.pattern ?? 'both',
        showBorderLines: config.show_border_lines ?? true,

        opacity: config.opacity ?? 1
      };

      return [new GridEffect(gridConfig)];
    }
  },

  /**
   * Diagonal hatched grid
   */
  'grid-diagonal': {
    name: 'Diagonal Grid',
    description: 'Diagonal hatched grid pattern',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:grid-diagonal] Creating diagonal grid effect');

      // Helper function to resolve theme token or use fallback
      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const gridConfig = {
        lineSpacing: config.line_spacing ?? resolveToken('components.backgroundAnimation.grid.spacing.diagonal', 30),
        lineWidthMinor: config.line_width ?? resolveToken('components.backgroundAnimation.grid.line.width', 1),
        color: config.color ?? resolveToken('components.backgroundAnimation.grid.line.color', 'rgba(255, 153, 102, 0.25)'),
        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.grid.scroll.speedDiagonal', 15),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.grid.scroll.speedDiagonal', 15),
        pattern: 'diagonal',
        opacity: config.opacity ?? 1
      };

      return [new GridEffect(gridConfig)];
    }
  },

  /**
   * Hexagonal grid pattern
   */
  'grid-hexagonal': {
    name: 'Hexagonal Grid',
    description: 'Honeycomb hexagonal grid with major/minor divisions',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:grid-hexagonal] Creating hexagonal grid effect');

      // Helper function to resolve theme token or use fallback
      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const gridConfig = {
        hexRadius: config.hex_radius ?? resolveToken('components.backgroundAnimation.grid.spacing.hexRadius', 40),
        lineWidthMinor: config.line_width_minor ?? resolveToken('components.backgroundAnimation.grid.line.width', 1),
        lineWidthMajor: config.line_width_major ?? resolveToken('components.backgroundAnimation.grid.line.widthMajor', 2),
        color: config.color ?? resolveToken('components.backgroundAnimation.grid.line.color', 'rgba(255, 153, 102, 0.3)'),
        colorMajor: config.color_major ?? resolveToken('components.backgroundAnimation.grid.line.colorMajor', 'rgba(255, 153, 102, 0.6)'),
        majorRowInterval: config.major_row_interval ?? resolveToken('components.backgroundAnimation.grid.intervals.majorRow', 3),
        majorColInterval: config.major_col_interval ?? resolveToken('components.backgroundAnimation.grid.intervals.majorCol', 3),
        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.grid.scroll.speedX', 20),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.grid.scroll.speedY', 20),
        pattern: 'hexagonal',
        opacity: config.opacity ?? 1
      };

      return [new GridEffect(gridConfig)];
    }
  },

  /**
   * Grid with filled cells
   */
  'grid-filled': {
    name: 'Filled Grid',
    description: 'Grid with colored cell backgrounds',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:grid-filled] Creating filled grid effect');

      // Helper function to resolve theme token or use fallback
      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const gridConfig = {
        lineSpacing: config.line_spacing ?? resolveToken('components.backgroundAnimation.grid.spacing.filled', 50),
        lineWidthMinor: config.line_width ?? resolveToken('components.backgroundAnimation.grid.line.widthMajor', 2),
        color: config.color ?? resolveToken('components.backgroundAnimation.grid.line.color', 'rgba(255, 153, 102, 0.4)'),
        fillColor: config.fill_color ?? resolveToken('components.backgroundAnimation.grid.fill.color', 'rgba(255, 153, 102, 0.05)'),
        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.grid.scroll.speedFilled', 25),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.grid.scroll.speedFilled', 25),
        pattern: config.pattern ?? 'both',
        showBorderLines: config.show_border_lines ?? true,
        opacity: config.opacity ?? 1
      };

      return [new GridEffect(gridConfig)];
    }
  }

  // Future presets will be added here:
  // 'starfield': { ... },
  // 'nebula': { ... },
  // 'geometric-array': { ... },
  // etc.
};
