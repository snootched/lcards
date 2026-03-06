/**
 * Canvas Texture Preset Registry
 *
 * Canvas2D-native texture/animation presets rendered inside button/elbow shape
 * boundaries via CanvasTextureRenderer.  Replaces the former SVG/SMIL system.
 *
 * Each preset entry provides:
 *   name        — Human-readable display name
 *   description — Short description for editors / pack explorer
 *   effectClass — BaseTextureEffect subclass to instantiate
 *   defaults    — Default config values merged with user config
 *
 * @module core/packs/textures/presets
 */

import { GridTextureEffect }     from '../effects/GridTextureEffect.js';
import { ShimmerTextureEffect }  from '../effects/ShimmerTextureEffect.js';
import { FluidTextureEffect }    from '../effects/FluidTextureEffect.js';
import { PlasmaTextureEffect }   from '../effects/PlasmaTextureEffect.js';
import { FlowTextureEffect }     from '../effects/FlowTextureEffect.js';
import { ScanlineTextureEffect } from '../effects/ScanlineTextureEffect.js';
import { LevelTextureEffect }    from '../effects/LevelTextureEffect.js';

/**
 * Built-in canvas texture presets
 * @type {Object.<string, {name: string, description: string, effectClass: Function, defaults: Object}>}
 */
export const CANVAS_TEXTURE_PRESETS = {

    'grid': {
        name:        'Grid',
        description: 'Scrolling orthogonal grid lines',
        effectClass: GridTextureEffect,
        defaults: {
            color:          'rgba(255,255,255,0.3)',
            line_width:     1,
            line_spacing:   40,
            scroll_speed_x: 20,
            scroll_speed_y: 0,
            pattern:        'both',
        },
    },

    'diagonal': {
        name:        'Diagonal',
        description: 'Scrolling diagonal hatched lines',
        effectClass: GridTextureEffect,
        defaults: {
            color:          'rgba(255,255,255,0.3)',
            line_width:     1,
            line_spacing:   40,
            scroll_speed_x: 20,
            scroll_speed_y: 20,
            pattern:        'diagonal',
        },
    },

    'hexagonal': {
        name:        'Hexagonal',
        description: 'Scrolling hexagonal cell grid',
        effectClass: GridTextureEffect,
        defaults: {
            color:          'rgba(255,255,255,0.3)',
            line_width:     1,
            hex_radius:     20,
            scroll_speed_x: 15,
            scroll_speed_y: 0,
            pattern:        'hexagonal',
        },
    },

    'dots': {
        name:        'Dots',
        description: 'Scrolling dot grid',
        effectClass: GridTextureEffect,
        defaults: {
            color:          'rgba(255,255,255,0.4)',
            dot_radius:     2,
            spacing:        20,
            scroll_speed_x: 15,
            scroll_speed_y: 0,
            pattern:        'dots',
        },
    },

    'shimmer': {
        name:        'Shimmer',
        description: 'Sweeping highlight band',
        effectClass: ShimmerTextureEffect,
        defaults: {
            color:           'rgba(255,255,255,0.55)',
            highlight_width: 0.35,
            speed:           2.5,
            angle:           30,
        },
    },

    'fluid': {
        name:        'Fluid',
        description: 'Swirling noise field — organic, continuously morphing colour wash',
        effectClass: FluidTextureEffect,
        defaults: {
            color:          'rgba(100,180,255,0.8)',
            base_frequency: 0.010,
            num_octaves:    4,
            scroll_speed_x: 7,
            scroll_speed_y: 10,
        },
    },

    'plasma': {
        name:        'Plasma',
        description: 'Two-colour plasma bands — vivid alternating colour field',
        effectClass: PlasmaTextureEffect,
        defaults: {
            color_a:        'rgba(80,0,255,0.9)',
            color_b:        'rgba(255,40,120,0.9)',
            base_frequency: 0.012,
            scroll_speed_x: 8,
            scroll_speed_y: 5,
        },
    },

    'flow': {
        name:        'Flow',
        description: 'Directional streaming streaks',
        effectClass: FlowTextureEffect,
        defaults: {
            color:          'rgba(0,200,255,0.7)',
            base_frequency: 0.012,
            wave_scale:     8,
            scroll_speed_x: 50,
            scroll_speed_y: 0,
        },
    },

    'scanlines': {
        name:        'Scanlines',
        description: 'CRT-style scanline overlay',
        effectClass: ScanlineTextureEffect,
        defaults: {
            color:          'rgba(0,0,0,0.25)',
            line_spacing:   4,
            line_width:     1.5,
            direction:      'horizontal',
            scroll_speed_y: 0,
            scroll_speed_x: 0,
        },
    },

    'level': {
        name:        'Level',
        description: 'Animated fluid fill-bar with gradient, secondary wave, and sloshing physics',
        effectClass: LevelTextureEffect,
        defaults: {
            color:             'rgba(0,200,100,0.7)',
            color_a:           'rgba(0,200,100,0.7)',
            color_b:           null,
            gradient_crossover: 80,
            fill_pct:          50,
            direction:         'up',
            edge_glow:         true,
            edge_glow_color:   'rgba(255,255,255,0.7)',
            edge_glow_width:   6,
            wave_height:       4,
            wave_speed:        20,
            wave_count:        4,
            wave2_height:      0,
            wave2_count:       5,
            wave2_speed:       -15,
            slosh_amount:      0,
            slosh_period:      3,
        },
    },

};

/**
 * Backward-compat alias — existing imports of SHAPE_TEXTURE_PRESETS continue to work.
 * @type {typeof CANVAS_TEXTURE_PRESETS}
 */
export const SHAPE_TEXTURE_PRESETS = CANVAS_TEXTURE_PRESETS;
