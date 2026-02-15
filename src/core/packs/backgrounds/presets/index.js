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
import { ZoomEffect } from '../effects/ZoomEffect.js';
import { lcardsLog } from '../../../../utils/lcards-logging.js';

/**
 * Built-in background animation presets
 */
export const BACKGROUND_PRESETS = {
  /**
   * Simple scrolling grid effect (basic, no animation)
   */
  'grid-basic': {
    name: 'Basic Grid',
    description: 'Simple scrolling LCARS grid with uniform lines',

    createEffects(config) {
      lcardsLog.debug('[Preset:grid-basic] Creating basic grid effect');

      const gridConfig = {
        lineSpacing: config.line_spacing ?? 40,
        lineWidthMinor: config.line_width ?? 1,
        color: config.color ?? 'rgba(255, 153, 102, 0.3)',
        scrollSpeedX: config.scroll_speed_x ?? 20,
        scrollSpeedY: config.scroll_speed_y ?? 20,
        pattern: config.pattern ?? 'both',  // Which lines to draw
        showBorderLines: config.show_border_lines ?? true,
        opacity: config.opacity ?? 1
      };

      return [new GridEffect(gridConfig)];
    }
  },

  /**
   * Enhanced grid with major/minor lines
   */
  'grid-enhanced': {
    name: 'Enhanced Grid',
    description: 'Grid with major/minor line divisions',

    createEffects(config) {
      lcardsLog.debug('[Preset:grid-enhanced] Creating enhanced grid effect');

      const gridConfig = {
        // Cell-based sizing
        numRows: config.num_rows ?? 10,
        numCols: config.num_cols ?? 10,

        // Line styling
        lineWidthMinor: config.line_width_minor ?? 1,
        lineWidthMajor: config.line_width_major ?? 3,
        color: config.color ?? 'rgba(255, 153, 102, 0.25)',
        colorMajor: config.color_major ?? 'rgba(255, 153, 102, 0.5)',

        // Major line intervals
        majorRowInterval: config.major_row_interval ?? 5,
        majorColInterval: config.major_col_interval ?? 5,

        // Scrolling
        scrollSpeedX: config.scroll_speed_x ?? 30,
        scrollSpeedY: config.scroll_speed_y ?? 30,
        pattern: config.pattern ?? 'both',  // Which lines to draw
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
  },

  /**
   * Zooming grid effect (pseudo-3D depth)
   */
  'grid-zoom': {
    name: 'Zooming Grid',
    description: 'Infinite zoom grid effect with layered scaling',

    createEffects(config) {
      lcardsLog.debug('[Preset:grid-zoom] Creating zooming grid effect');

      // Create base grid effect
      const gridConfig = {
        lineSpacing: config.line_spacing ?? 60,
        lineWidthMinor: config.line_width ?? 1,
        color: config.color ?? 'rgba(255, 153, 102, 0.4)',
        scrollSpeedX: 0, // No scroll, zoom handles movement
        scrollSpeedY: 0,
        pattern: config.pattern ?? 'both',
        showBorderLines: config.show_border_lines ?? true
      };

      const baseGrid = new GridEffect(gridConfig);

      // Wrap in zoom effect
      const zoomConfig = {
        baseEffect: baseGrid,
        layers: config.zoom_layers ?? 4,
        scaleFrom: config.scale_from ?? 0.5,
        scaleTo: config.scale_to ?? 2.0,
        duration: config.zoom_duration ?? 15,
        opacityFadeIn: config.opacity_fade_in ?? 15,
        opacityFadeOut: config.opacity_fade_out ?? 75
      };

      return [new ZoomEffect(zoomConfig)];
    }
  }

  // Future presets will be added here:
  // 'starfield': { ... },
  // 'nebula': { ... },
  // 'geometric-array': { ... },
  // etc.
};
