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
import { ContourFieldEffect } from '../effects/ContourFieldEffect.js';
import { CascadeEffect } from '../effects/CascadeEffect.js';
import { LevelTextureEffect }    from '../../textures/effects/LevelTextureEffect.js';
import { FluidTextureEffect }    from '../../textures/effects/FluidTextureEffect.js';
import { PlasmaTextureEffect }   from '../../textures/effects/PlasmaTextureEffect.js';
import { FlowTextureEffect }     from '../../textures/effects/FlowTextureEffect.js';
import { ShimmerTextureEffect }  from '../../textures/effects/ShimmerTextureEffect.js';
import { ScanlineTextureEffect } from '../../textures/effects/ScanlineTextureEffect.js';
import { ImageEffect }            from '../effects/ImageEffect.js';
import { SolidEffect }            from '../effects/SolidEffect.js';
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
    guide: {
      summary: 'Orthogonal grid of scrolling lines, with optional emphasised "major" lines every N rows/columns. Supports both spacing-based sizing (line_spacing) and explicit cell counts (num_rows/num_cols), plus an optional cell fill color.',
      params: [
        { key: 'line_spacing', default: 40, description: 'Pixel spacing between minor lines.' },
        { key: 'line_width_minor', default: 1, description: 'Minor line thickness in px.' },
        { key: 'line_width_major', default: 2, description: 'Major (emphasised) line thickness in px.' },
        { key: 'color', default: 'rgba(255, 153, 102, 0.3)', description: 'Minor line color.' },
        { key: 'color_major', description: 'Major line color — falls back to color if unset.' },
        { key: 'major_row_interval', default: 0, description: 'Draw a major line every N rows (0 = disabled).' },
        { key: 'major_col_interval', default: 0, description: 'Draw a major line every N columns (0 = disabled).' },
        { key: 'scroll_speed_x', default: 20, description: 'Horizontal scroll speed in px/s.' },
        { key: 'scroll_speed_y', default: 20, description: 'Vertical scroll speed in px/s.' },
        { key: 'pattern', default: 'both', description: "Line pattern: 'both' | 'horizontal' | 'vertical' | 'diagonal' | 'hexagonal' | 'dots'. The diagonal/hexagonal presets below hardcode this — set it directly here if you want it combined with grid's other options (num_rows/num_cols, major/minor intervals)." },
        { key: 'dot_radius', default: 2, description: "Dot radius in px — only used when pattern is 'dots'." },
        { key: 'hex_radius', default: 40, description: "Hexagon size in px — only used when pattern is 'hexagonal'." },
        { key: 'fill_color', default: 'transparent', description: 'Solid fill painted behind each cell.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: grid\n    config:\n      line_spacing: 40\n      color: 'rgba(255,153,102,0.3)'\n      major_row_interval: 5\n      major_col_interval: 5"
    },

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
        dotRadius: config.dot_radius,
        hexRadius: config.hex_radius ?? resolveToken('components.backgroundAnimation.grid.spacing.hexRadius', 40),

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
    guide: {
      summary: 'A 45-degree hatched variant of the grid effect — same scrolling-line mechanism as Grid, fixed to a diagonal pattern.',
      params: [
        { key: 'line_spacing', default: 30, description: 'Pixel spacing between lines.' },
        { key: 'line_width', default: 1, description: 'Line thickness in px.' },
        { key: 'color', default: 'rgba(255, 153, 102, 0.25)', description: 'Line color.' },
        { key: 'scroll_speed_x', default: 15, description: 'Horizontal scroll speed in px/s.' },
        { key: 'scroll_speed_y', default: 15, description: 'Vertical scroll speed in px/s.' },
        { key: 'fill_color', default: 'transparent', description: 'Solid fill painted behind each cell.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: grid-diagonal\n    config:\n      line_spacing: 30\n      color: 'rgba(255,153,102,0.25)'"
    },

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
    guide: {
      summary: 'A honeycomb hex-grid variant of the grid effect, with the same major/minor emphasis and scrolling mechanism, sized by hex radius instead of line spacing.',
      params: [
        { key: 'hex_radius', default: 40, description: 'Hexagon size in px.' },
        { key: 'line_width_minor', default: 1, description: 'Minor line thickness in px.' },
        { key: 'line_width_major', default: 2, description: 'Major line thickness in px.' },
        { key: 'color', default: 'rgba(255, 153, 102, 0.3)', description: 'Minor line color.' },
        { key: 'color_major', default: 'rgba(255, 153, 102, 0.6)', description: 'Major line color.' },
        { key: 'major_row_interval', default: 3, description: 'Draw a major line every N rows.' },
        { key: 'major_col_interval', default: 3, description: 'Draw a major line every N columns.' },
        { key: 'scroll_speed_x', default: 20, description: 'Horizontal scroll speed in px/s.' },
        { key: 'scroll_speed_y', default: 20, description: 'Vertical scroll speed in px/s.' },
        { key: 'fill_color', default: 'transparent', description: 'Solid fill painted behind each cell.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: grid-hexagonal\n    config:\n      hex_radius: 40\n      color: 'rgba(255,153,102,0.3)'"
    },

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
    guide: {
      summary: 'Randomly-placed stars that scroll across the canvas, split into parallax layers so nearer "layers" drift faster than farther ones for a sense of depth.',
      params: [
        { key: 'seed', description: 'Random seed — same seed always generates the same star layout.' },
        { key: 'count', default: 150, description: 'Number of stars.' },
        { key: 'min_radius', default: 0.5, description: 'Smallest star radius in px.' },
        { key: 'max_radius', default: 2, description: 'Largest star radius in px.' },
        { key: 'min_opacity', default: 0.3, description: 'Dimmest star opacity.' },
        { key: 'max_opacity', default: 1.0, description: 'Brightest star opacity.' },
        { key: 'colors', default: ['#ffffff'], description: 'Star color(s) — also accepts a single color.' },
        { key: 'scroll_speed_x', default: 30, description: 'Horizontal scroll speed in px/s.' },
        { key: 'scroll_speed_y', default: 0, description: 'Vertical scroll speed in px/s.' },
        { key: 'parallax_layers', default: 3, description: 'Number of depth layers — more layers = more depth.' },
        { key: 'depth_factor', default: 0.5, description: 'Speed variation between layers.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: 'background_animation:\n  - preset: starfield\n    config:\n      count: 200\n      scroll_speed_x: 30'
    },

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
    guide: {
      summary: 'Soft, drifting cloud blobs built from Perlin-noise turbulence, layered and scrolled to give an organic nebula look.',
      params: [
        { key: 'seed', description: 'Random seed — same seed always generates the same cloud layout.' },
        { key: 'cloud_count', default: 4, description: 'Number of cloud blobs.' },
        { key: 'min_radius', default: 0.15, description: 'Smallest cloud radius, as a fraction of canvas size (0-1).' },
        { key: 'max_radius', default: 0.4, description: 'Largest cloud radius, as a fraction of canvas size (0-1).' },
        { key: 'min_opacity', default: 0.3, description: 'Dimmest cloud opacity.' },
        { key: 'max_opacity', default: 0.8, description: 'Brightest cloud opacity.' },
        { key: 'colors', default: ['#FF00FF'], description: 'Cloud color(s) — also accepts a single color.' },
        { key: 'turbulence', default: 0.5, description: 'How ragged/organic the cloud edges are.' },
        { key: 'noise_scale', default: 0.003, description: 'Noise detail — lower = larger, smoother features.' },
        { key: 'scroll_speed_x', default: 5, description: 'Horizontal scroll speed in px/s.' },
        { key: 'scroll_speed_y', default: 5, description: 'Vertical scroll speed in px/s.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: nebula\n    config:\n      colors: ['#8000ff', '#ff0080']\n      cloud_count: 5"
    },

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
   * Topographic-style banded noise field (LCARS star-chart contour look)
   */
  'contour-field': {
    name: 'Contour Field',
    description: 'Topographic-style banded noise field (LCARS star-chart contour look)',
    guide: {
      summary: 'Paints a drifting noise field, then slices it into color bands — like a topographic map. Noise shapes the raw terrain (how big and rough the features are). Contour Bands controls how that terrain is sliced into rings — the full peaks-and-valleys range, always present underneath. Fill floods/drains a waterline over that terrain without changing it, for empty "space" between blobs. Colour sets what fills each ring.',
      params: [
        { key: 'seed', description: 'Random seed — same seed + settings always generates the same field.' },
        { key: 'noise_scale', default: 0.005, description: 'Smaller = a few large drifting blobs; larger = many small, busy ripples.' },
        { key: 'num_octaves', default: 2, description: 'Layers of fine detail — 1 = smooth blobs, 8 = rough, cloud-like fuzz.' },
        { key: 'num_bands', default: 5, description: 'Low = bold stepped contour rings; high = a smooth, near-continuous gradient.' },
        { key: 'cell_size', default: 1, description: 'Sample resolution — larger is blockier/cheaper, smaller is crisper/costlier.' },
        { key: 'fill_level', default: 0.45, description: '0 = no water, full terrain visible; raise it to flood the lowest rings.' },
        { key: 'fill_color', description: 'Color painted over flooded rings — leave empty for literal transparency.' },
        { key: 'blend_colors', default: true, description: 'On = colors fade smoothly between rings; off = hard-cutoff flat rings.' },
        { key: 'colors', description: 'One color, or several stops spread across the full contour range.' },
        { key: 'scroll_speed_x', default: -3, description: 'Horizontal scroll speed in px/s.' },
        { key: 'scroll_speed_y', default: 0.45, description: 'Vertical scroll speed in px/s.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: contour-field\n    config:\n      num_bands: 8\n      colors: ['#130b81']",
      tip: 'Lower Band Count + Cell Size for a blocky, retro-LCARS look; raise them for a smooth, photographic nebula look.'
    },

    createEffects(config, cardInstance = null) {
      lcardsLog.debug('[Preset:contour-field] Creating contour field effect');

      const resolveToken = (tokenPath, fallback) => {
        if (cardInstance && cardInstance.getThemeToken) {
          return cardInstance.getThemeToken(tokenPath, fallback);
        }
        return fallback;
      };

      const contourConfig = {
        seed: config.seed ?? Math.floor(Math.random() * 1e9), // Random seed by default
        noiseScale: config.noise_scale ?? resolveToken('components.backgroundAnimation.contourField.noise.scale', 0.005),
        numOctaves: config.num_octaves ?? resolveToken('components.backgroundAnimation.contourField.noise.octaves', 2),
        numBands: config.num_bands ?? resolveToken('components.backgroundAnimation.contourField.bands.count', 5),
        cellSize: config.cell_size ?? resolveToken('components.backgroundAnimation.contourField.bands.cellSize', 1),
        fillLevel: config.fill_level ?? resolveToken('components.backgroundAnimation.contourField.bands.fillLevel', 0.45),
        fillColor: config.fill_color ?? resolveToken('components.backgroundAnimation.contourField.bands.fillColor', 'alpha(var(--lcars-midnight-blue), 0.30)'),
        blendColors: config.blend_colors ?? resolveToken('components.backgroundAnimation.contourField.bands.blendColors', true),

        // Support both 'colors' (array) and 'color' (single)
        colors: config.colors ?? (config.color ? [config.color] : resolveToken('components.backgroundAnimation.contourField.colors', [
          'alpha(#130b81, 0.08)',
          'alpha(#130b81, 0.25)',
          'alpha(#130b81, 0.42)',
          'alpha(#130b81, 0.62)',
          'alpha(#130b81, 0.80)',
        ])),

        scrollSpeedX: config.scroll_speed_x ?? resolveToken('components.backgroundAnimation.contourField.scroll.speedX', -3),
        scrollSpeedY: config.scroll_speed_y ?? resolveToken('components.backgroundAnimation.contourField.scroll.speedY', 0.45),

        opacity: config.opacity ?? 1
      };

      return [new ContourFieldEffect(contourConfig)];
    }
  },

  /**
   * LCARS waterfall colour-cycling data grid (decorative)
   */
  'cascade': {
    name: 'Data Cascade',
    description: 'LCARS waterfall colour-cycling data grid (decorative)',
    guide: {
      summary: 'A grid of characters that color-cycle from a start color through to an end color, evoking a Matrix-style/LCARS data waterfall. Purely decorative — the characters themselves are randomized, not meaningful data.',
      params: [
        { key: 'format', default: 'hex', description: "Character set: 'digit' | 'float' | 'alpha' | 'hex' | 'mixed'." },
        { key: 'pattern', default: 'default', description: "Row timing pattern: 'default' (authentic LCARS rhythm) | 'niagara' (uniform waterfall) | 'fast' | 'custom' (use the timing param below)." },
        { key: 'timing', description: "Only used when pattern is 'custom' — an array of { duration, delay } objects, one per row, applied round-robin if there are more rows than entries. duration is in milliseconds; delay is in SECONDS (converted ×1000 internally) — easy to mix up since duration is not." },
        { key: 'speed_multiplier', default: 1.0, description: 'Overall cycling speed multiplier.' },
        { key: 'colors.start', default: 'var(--lcards-blue-light)', description: 'Color a cell starts at.' },
        { key: 'colors.text', default: 'var(--lcards-blue-darkest)', description: 'Color a cell settles at mid-cycle.' },
        { key: 'colors.end', default: 'var(--lcards-moonlight)', description: 'Color a cell ends at.' },
        { key: 'font_size', default: 10, description: 'Character font size in px.' },
        { key: 'gap', default: 4, description: 'Spacing between cells in px.' },
        { key: 'refresh_interval', default: 0, description: 'How often cells re-randomize (0 = continuous).' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: cascade\n    config:\n      format: hex\n      speed_multiplier: 1.5"
    },

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
    guide: {
      summary: 'An animated tank/gauge-style fill bar — the fill level rises to fill_pct, with an optional gradient, a wavy top edge (up to two overlapping waves), sloshing physics, and an edge glow.',
      params: [
        { key: 'color_a', default: 'rgba(0,200,100,0.7)', description: 'Primary fill color (or gradient start).' },
        { key: 'color_b', description: 'Gradient end color — omit for a flat fill.' },
        { key: 'gradient_crossover', default: 80, description: 'Percent of fill height where the gradient crosses over.' },
        { key: 'fill_pct', default: 50, description: 'Fill level, 0-100.' },
        { key: 'direction', default: 'up', description: "Fill direction — 'up' | 'down' | 'left' | 'right'." },
        { key: 'edge_glow', default: true, description: 'Whether to draw a glow along the fill edge.' },
        { key: 'wave_height', default: 4, description: 'Primary wave amplitude in px.' },
        { key: 'wave_speed', default: 20, description: 'Primary wave speed.' },
        { key: 'wave_count', default: 4, description: 'Primary wave count across the width.' },
        { key: 'wave2_height', default: 0, description: 'Secondary wave amplitude in px (0 = disabled).' },
        { key: 'slosh_amount', default: 0, description: 'Sloshing displacement amount (0 = disabled).' },
        { key: 'slosh_period', default: 3, description: 'Sloshing cycle period in seconds.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: level\n    config:\n      fill_pct: 65\n      color_a: 'rgba(0,200,100,0.7)'"
    },

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
    guide: {
      summary: 'A single-color noise-driven wash that continuously swirls and morphs, like flowing liquid or smoke.',
      params: [
        { key: 'color', default: 'rgba(100,180,255,0.8)', description: 'Wash color.' },
        { key: 'base_frequency', default: 0.010, description: 'Noise detail — lower = larger features.' },
        { key: 'num_octaves', default: 4, description: 'Layers of noise detail.' },
        { key: 'scroll_speed_x', default: 7, description: 'Horizontal drift speed.' },
        { key: 'scroll_speed_y', default: 10, description: 'Vertical drift speed.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: fluid\n    config:\n      color: 'rgba(100,180,255,0.8)'"
    },
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
    guide: {
      summary: 'A classic two-color "plasma" noise field, alternating vividly between Color A and Color B as it drifts.',
      params: [
        { key: 'color_a', default: 'rgba(80,0,255,0.9)', description: 'First plasma color.' },
        { key: 'color_b', default: 'rgba(255,40,120,0.9)', description: 'Second plasma color.' },
        { key: 'base_frequency', default: 0.012, description: 'Noise detail — lower = larger features.' },
        { key: 'scroll_speed_x', default: 8, description: 'Horizontal drift speed.' },
        { key: 'scroll_speed_y', default: 5, description: 'Vertical drift speed.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: plasma\n    config:\n      color_a: 'rgba(80,0,255,0.9)'\n      color_b: 'rgba(255,40,120,0.9)'"
    },
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
    guide: {
      summary: 'Noise-driven streaks that stream in one direction, like flowing energy conduits or data streams.',
      params: [
        { key: 'color', default: 'rgba(0,200,255,0.7)', description: 'Streak color.' },
        { key: 'base_frequency', default: 0.012, description: 'Noise detail — lower = larger features.' },
        { key: 'wave_scale', default: 8, description: 'Streak waviness.' },
        { key: 'scroll_speed_x', default: 50, description: 'Horizontal stream speed.' },
        { key: 'scroll_speed_y', default: 0, description: 'Vertical stream speed.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: flow\n    config:\n      color: 'rgba(0,200,255,0.7)'\n      scroll_speed_x: 60"
    },
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
    guide: {
      summary: 'A single highlight band that periodically sweeps across the canvas at an angle, like light catching a metallic surface.',
      params: [
        { key: 'color', default: 'rgba(255,255,255,0.55)', description: 'Highlight color.' },
        { key: 'highlight_width', default: 0.35, description: 'Band width as a fraction of canvas size.' },
        { key: 'speed', default: 2.5, description: 'Sweep speed.' },
        { key: 'angle', default: 30, description: 'Sweep angle in degrees.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: shimmer\n    config:\n      color: 'rgba(255,255,255,0.55)'\n      speed: 2.5"
    },
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
    guide: {
      summary: 'A static CRT-style scanline pattern — evenly spaced horizontal or vertical lines overlaid on the canvas.',
      params: [
        { key: 'color', default: 'rgba(0,0,0,0.25)', description: 'Scanline color.' },
        { key: 'line_spacing', default: 4, description: 'Pixel spacing between lines.' },
        { key: 'line_width', default: 1.5, description: 'Line thickness in px.' },
        { key: 'direction', default: 'horizontal', description: "'horizontal' | 'vertical'." },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: scanlines\n    config:\n      line_spacing: 4\n      direction: horizontal"
    },
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

  /**
   * Static (or entity-reactive) image rendered behind the full card area.
   * Supports /local/ paths, external HTTPS URLs, and builtin:key references.
   * source supports template syntax for entity-reactive images, e.g.
   *   '{entity.attributes.entity_picture}'
   */
  'image': {
    name: 'Background Image',
    description: 'User-supplied image rendered behind the entire card',
    guide: {
      summary: 'Renders a static or entity-reactive image behind the whole card. Accepts /local/ paths, builtin:key references, and external https:// URLs — source also supports template syntax for entity-reactive images (e.g. an entity_picture).',
      params: [
        { key: 'source', description: '/local/ path, builtin:key, https:// URL, or a template string.' },
        { key: 'size', default: 'cover', description: "'cover' | 'contain' | 'stretch'." },
        { key: 'position', default: 'center', description: 'CSS background-position keyword.' },
        { key: 'repeat', default: false, description: 'Tile the image instead of scaling it.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity.' }
      ],
      example: "background_animation:\n  - preset: image\n    config:\n      source: '/local/images/bridge.jpg'\n      size: cover"
    },

    createEffects(config) {
      return [new ImageEffect({
        source:   config.source   ?? '',
        size:     config.size     ?? 'cover',
        position: config.position ?? 'center',
        repeat:   config.repeat   ?? false,
        opacity:  config.opacity  ?? 1,
      })];
    }
  },

  /**
   * Flat, single-colour fill rendered behind the card SVG.
   * Tints the layer behind base_svg without touching base_svg's own artwork.
   */
  'solid': {
    name: 'Solid Colour',
    description: 'Flat colour fill rendered behind the card SVG',
    guide: {
      summary: 'A single flat color, filling the whole background canvas. Renders behind base_svg — the tint shows through any transparent regions of the SVG artwork on top, without touching the artwork itself. The cheapest, simplest background_animation preset — a single fill per frame, no procedural noise.',
      params: [
        { key: 'color', default: 'rgba(0, 0, 0, 0.4)', description: 'Fill color — the alpha channel controls how much shows through base_svg.' },
        { key: 'opacity', default: 1, description: 'Overall effect opacity, multiplies with any alpha already in color.' }
      ],
      example: "background_animation:\n  - preset: solid\n    config:\n      color: 'rgba(180, 0, 0, 0.35)'"
    },

    createEffects(config = {}) {
      lcardsLog.debug('[Preset:solid] Creating solid fill effect');

      return [new SolidEffect({
        color:   config.color   ?? 'rgba(0, 0, 0, 0.4)',
        opacity: config.opacity ?? 1,
      })];
    }
  },
};
