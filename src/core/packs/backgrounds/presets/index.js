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
import { LevelTextureEffect }    from '../../textures/effects/LevelTextureEffect.js';
import { FluidTextureEffect }    from '../../textures/effects/FluidTextureEffect.js';
import { PlasmaTextureEffect }   from '../../textures/effects/PlasmaTextureEffect.js';
import { FlowTextureEffect }     from '../../textures/effects/FlowTextureEffect.js';
import { ShimmerTextureEffect }  from '../../textures/effects/ShimmerTextureEffect.js';
import { ScanlineTextureEffect } from '../../textures/effects/ScanlineTextureEffect.js';
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
        fillColor: config.fill_color ?? 'transparent',

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
        fillColor: config.fill_color ?? 'transparent',
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
        fillColor: config.fill_color ?? 'transparent',
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
   * LCARS waterfall colour-cycling data grid (decorative)
   */
  'cascade': {
    name: 'Data Cascade',
    description: 'LCARS waterfall colour-cycling data grid (decorative)',

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
          start: config.colors?.start ?? resolveToken('colors.grid.cascadeStart', 'var(--lcards-blue-light, #93e1ff)'),
          text:  config.colors?.text  ?? resolveToken('colors.grid.cascadeMid',   'var(--lcards-blue-darkest, #002241)'),
          end:   config.colors?.end   ?? resolveToken('colors.grid.cascadeEnd',   'var(--lcards-moonlight, #dfe1e8)')
        },
        fontSize:        config.font_size    ?? resolveToken('components.backgroundAnimation.cascade.font.size', 10),
        fontFamily:      config.font_family  ?? resolveToken('components.backgroundAnimation.cascade.font.family', "'Antonio', monospace"),
        gap:             config.gap          ?? 4,
        refreshInterval: config.refresh_interval ?? 0,
        opacity:         config.opacity      ?? 1
      };

      return [new CascadeEffect(cascadeConfig)];
    }
  },

  // Future presets will be added here:
  // 'geometric-array': { ... },
  // etc.

  'level': {
    name: 'Level',
    description: 'Animated fill-bar with gradient, dual wave, sloshing physics and bloom glow',

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:level] Creating level effect');

      return [new LevelTextureEffect({
        color:              config.color              ?? 'rgba(0,200,100,0.7)',
        color_a:            config.color_a            ?? config.color ?? 'rgba(0,200,100,0.7)',
        color_b:            config.color_b            ?? null,
        gradient_crossover: config.gradient_crossover ?? 80,
        fill_pct:           config.fill_pct           ?? 50,
        direction:          config.direction          ?? 'up',
        edge_glow:          config.edge_glow          ?? true,
        edge_glow_color:    config.edge_glow_color    ?? 'rgba(255,255,255,0.7)',
        edge_glow_width:    config.edge_glow_width    ?? 6,
        wave_height:        config.wave_height        ?? 4,
        wave_speed:         config.wave_speed         ?? 20,
        wave_count:         config.wave_count         ?? 4,
        wave2_height:       config.wave2_height       ?? 0,
        wave2_count:        config.wave2_count        ?? 5,
        wave2_speed:        config.wave2_speed        ?? -15,
        slosh_amount:       config.slosh_amount       ?? 0,
        slosh_period:       config.slosh_period       ?? 3,
        opacity:            config.opacity            ?? 1,
      })];
    }
  },

  'fluid': {
    name: 'Fluid',
    description: 'Swirling noise field — organic, continuously morphing colour wash',
    createEffects(config) {
      return [new FluidTextureEffect({
        color:          config.color          ?? 'rgba(100,180,255,0.8)',
        base_frequency: config.base_frequency ?? 0.010,
        num_octaves:    config.num_octaves    ?? 4,
        scroll_speed_x: config.scroll_speed_x ?? 7,
        scroll_speed_y: config.scroll_speed_y ?? 10,
        opacity:        config.opacity        ?? 1,
      })];
    }
  },

  'plasma': {
    name: 'Plasma',
    description: 'Two-colour plasma bands — vivid alternating colour field',
    createEffects(config) {
      return [new PlasmaTextureEffect({
        color_a:        config.color_a        ?? 'rgba(80,0,255,0.9)',
        color_b:        config.color_b        ?? 'rgba(255,40,120,0.9)',
        base_frequency: config.base_frequency ?? 0.012,
        scroll_speed_x: config.scroll_speed_x ?? 8,
        scroll_speed_y: config.scroll_speed_y ?? 5,
        opacity:        config.opacity        ?? 1,
      })];
    }
  },

  'flow': {
    name: 'Flow',
    description: 'Directional streaming streaks',
    createEffects(config) {
      return [new FlowTextureEffect({
        color:          config.color          ?? 'rgba(0,200,255,0.7)',
        base_frequency: config.base_frequency ?? 0.012,
        wave_scale:     config.wave_scale     ?? 8,
        scroll_speed_x: config.scroll_speed_x ?? 50,
        scroll_speed_y: config.scroll_speed_y ?? 0,
        opacity:        config.opacity        ?? 1,
      })];
    }
  },

  'shimmer': {
    name: 'Shimmer',
    description: 'Sweeping highlight band across the full background',
    createEffects(config) {
      return [new ShimmerTextureEffect({
        color:           config.color           ?? 'rgba(255,255,255,0.55)',
        highlight_width: config.highlight_width ?? 0.35,
        speed:           config.speed           ?? 2.5,
        angle:           config.angle           ?? 30,
        opacity:         config.opacity         ?? 1,
      })];
    }
  },

  'scanlines': {
    name: 'Scanlines',
    description: 'CRT-style scanline overlay',
    createEffects(config) {
      return [new ScanlineTextureEffect({
        color:          config.color          ?? 'rgba(0,0,0,0.25)',
        line_spacing:   config.line_spacing   ?? 4,
        line_width:     config.line_width     ?? 1.5,
        direction:      config.direction      ?? 'horizontal',
        scroll_speed_x: config.scroll_speed_x ?? 0,
        scroll_speed_y: config.scroll_speed_y ?? 0,
        opacity:        config.opacity        ?? 1,
      })];
    }
  },
};
