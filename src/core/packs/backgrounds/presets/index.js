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

    createEffects(config) {
      lcardsLog.debug('[Preset:grid] Creating grid effect');

      const gridConfig = {
        // Sizing - supports both cell-based and spacing-based
        numRows: config.num_rows,
        numCols: config.num_cols,
        lineSpacing: config.line_spacing ?? 40,

        // Line styling
        lineWidthMinor: config.line_width_minor ?? config.line_width ?? 1,
        lineWidthMajor: config.line_width_major ?? 2,
        color: config.color ?? 'rgba(255, 153, 102, 0.3)',
        colorMajor: config.color_major ?? config.color,

        // Major line intervals (0 = no major lines)
        majorRowInterval: config.major_row_interval ?? 0,
        majorColInterval: config.major_col_interval ?? 0,

        // Scrolling
        scrollSpeedX: config.scroll_speed_x ?? 20,
        scrollSpeedY: config.scroll_speed_y ?? 20,
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

    createEffects(config) {
      lcardsLog.debug('[Preset:grid-diagonal] Creating diagonal grid effect');

      const gridConfig = {
        lineSpacing: config.line_spacing ?? 30,
        lineWidthMinor: config.line_width ?? 1,
        color: config.color ?? 'rgba(255, 153, 102, 0.25)',
        scrollSpeedX: config.scroll_speed_x ?? 15,
        scrollSpeedY: config.scroll_speed_y ?? 15,
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

    createEffects(config) {
      lcardsLog.debug('[Preset:grid-hexagonal] Creating hexagonal grid effect');

      const gridConfig = {
        hexRadius: config.hex_radius ?? 40,
        lineWidthMinor: config.line_width_minor ?? 1,
        lineWidthMajor: config.line_width_major ?? 2,
        color: config.color ?? 'rgba(255, 153, 102, 0.3)',
        colorMajor: config.color_major ?? 'rgba(255, 153, 102, 0.6)',
        majorRowInterval: config.major_row_interval ?? 3,
        majorColInterval: config.major_col_interval ?? 3,
        scrollSpeedX: config.scroll_speed_x ?? 20,
        scrollSpeedY: config.scroll_speed_y ?? 20,
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

    createEffects(config) {
      lcardsLog.debug('[Preset:grid-filled] Creating filled grid effect');

      const gridConfig = {
        lineSpacing: config.line_spacing ?? 50,
        lineWidthMinor: config.line_width ?? 2,
        color: config.color ?? 'rgba(255, 153, 102, 0.4)',
        fillColor: config.fill_color ?? 'rgba(255, 153, 102, 0.05)',
        scrollSpeedX: config.scroll_speed_x ?? 25,
        scrollSpeedY: config.scroll_speed_y ?? 25,
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
