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
import { StarfieldEffect } from '../effects/StarfieldEffect.js';
import { NebulaEffect } from '../effects/NebulaEffect.js';
import { CascadeEffect } from '../effects/CascadeEffect.js';
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
  },

  /**
   * Starfield effect with parallax scrolling
   */
  'starfield': {
    name: 'Starfield',
    description: 'Scrolling starfield with parallax depth layers',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:starfield] Creating starfield effect');

      // Helper function to resolve theme token or use fallback
      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const starfieldConfig = {
        // Star generation
        seed: config.seed ?? Math.floor(Math.random() * 1e9), // Random seed by default
        count: config.count ?? resolveToken('components.backgroundAnimation.starfield.star.count', 150),
        minRadius: config.min_radius ?? resolveToken('components.backgroundAnimation.starfield.star.minRadius', 0.5),
        maxRadius: config.max_radius ?? resolveToken('components.backgroundAnimation.starfield.star.maxRadius', 2),
        minOpacity: config.min_opacity ?? resolveToken('components.backgroundAnimation.starfield.star.minOpacity', 0.3),
        maxOpacity: config.max_opacity ?? resolveToken('components.backgroundAnimation.starfield.star.maxOpacity', 1.0),

        // Support both 'colors' (array) and 'color' (single) - prefer colors if present
        colors: config.colors ?? (config.color ? [config.color] : [resolveToken('components.backgroundAnimation.starfield.star.color', '#ffffff')]),

        // Scrolling
        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.starfield.scroll.speedX', 30),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.starfield.scroll.speedY', 0),

        // Parallax
        parallaxLayers: config.parallax_layers ?? resolveToken('components.backgroundAnimation.starfield.parallax.layers', 3),
        depthFactor: config.depth_factor ?? resolveToken('components.backgroundAnimation.starfield.parallax.depthFactor', 0.5),

        opacity: config.opacity ?? 1
      };

      return [new StarfieldEffect(starfieldConfig)];
    }
  },

  /**
   * Nebula clouds with Perlin noise turbulence
   */
  'nebula': {
    name: 'Nebula',
    description: 'Layered nebula clouds with organic turbulence',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:nebula] Creating nebula effect');

      // Helper function to resolve theme token or use fallback
      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const nebulaConfig = {
        // Cloud generation
        seed: config.seed ?? Math.floor(Math.random() * 1e9), // Random seed by default
        cloudCount: config.cloud_count ?? resolveToken('components.backgroundAnimation.nebula.cloud.count', 4),
        minRadius: config.min_radius ?? resolveToken('components.backgroundAnimation.nebula.cloud.minRadius', 0.15),
        maxRadius: config.max_radius ?? resolveToken('components.backgroundAnimation.nebula.cloud.maxRadius', 0.4),
        minOpacity: config.min_opacity ?? resolveToken('components.backgroundAnimation.nebula.cloud.minOpacity', 0.3),
        maxOpacity: config.max_opacity ?? resolveToken('components.backgroundAnimation.nebula.cloud.maxOpacity', 0.8),

        // Support both 'colors' (array) and 'color' (single)
        colors: config.colors ?? (config.color ? [config.color] : resolveToken('components.backgroundAnimation.nebula.cloud.colors', ['#FF00FF'])),

        // Turbulence
        turbulence: config.turbulence ?? resolveToken('components.backgroundAnimation.nebula.turbulence.intensity', 0.5),
        noiseScale: config.noise_scale ?? resolveToken('components.backgroundAnimation.nebula.turbulence.noiseScale', 0.003),
        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.nebula.scroll.speedX', 5),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.nebula.scroll.speedY', 5),

        opacity: config.opacity ?? 1
      };

      return [new NebulaEffect(nebulaConfig)];
    }
  },

  /**
   * LCARS waterfall color-cycling data grid (decorative)
   */
  'cascade': {
    name: 'Data Cascade',
    description: 'LCARS waterfall color-cycling data grid (decorative)',

    createEffects(config = {}, cardInstance = null) {
      lcardsLog.debug('[Preset:cascade] Creating cascade effect');

      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance?.getThemeToken) return cardInstance.getThemeToken(tokenPath, fallback);
        return fallback;
      };

      const cascadeConfig = {
        numRows:          config.num_rows        ?? null,
        numCols:          config.num_cols        ?? null,
        format:           config.format          ?? 'hex',
        pattern:          config.pattern         ?? 'default',
        timing:           config.timing,
        duration:         config.duration        ?? null,
        speedMultiplier:  config.speed_multiplier ?? 1.0,
        colors: {
          start: config.colors?.start ?? resolveToken('colors.grid.cascadeStart', 'var(--lcars-blue, #2266ff)'),
          text:  config.colors?.text  ?? resolveToken('colors.grid.cascadeMid',   'var(--lcards-blue-darkest, #112244)'),
          end:   config.colors?.end   ?? resolveToken('colors.grid.cascadeEnd',   'var(--lcars-moonlight, #e7f3f7)')
        },
        fontSize:        config.font_size    ?? resolveToken('components.backgroundAnimation.cascade.font.size', 10),
        fontFamily:      config.font_family  ?? resolveToken('components.backgroundAnimation.cascade.font.family', "'Antonio', monospace"),
        gap:             config.gap          ?? 4,
        refreshInterval: config.refresh_interval ?? 0,
        opacity:         config.opacity      ?? 1
      };

      return [new CascadeEffect(cascadeConfig)];
    }
  }

  // Future presets will be added here:
  // 'geometric-array': { ... },
  // etc.
};
