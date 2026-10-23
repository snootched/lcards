/**
 * Animation Preset Params Schemas
 *
 * One schema per registered animation preset, describing the shape of that
 * preset's `params:` object. Consumed by CoreValidationService's
 * `discriminatedBy` mechanism (see `animationSchema.properties.params` in
 * `common-schemas.js`) to validate `params` against the correct shape based
 * on the sibling `preset` field, and (later) by the animation editor UI to
 * render structured form fields.
 *
 * Mirrors the structure of
 * src/core/packs/animations/presets/{index,stagger-presets,text-presets,
 * timeline-presets}.js — keep in sync when adding/changing preset fields
 * there. Each preset factory carries a one-line pointer comment back here.
 *
 * @module cards/schemas/animation-preset-params-schemas
 */

import { COLOR_VALUE_PATTERN } from '../../core/themes/color-syntax.js';

/**
 * Local copy of common-schemas.js's simpleColorSchema: it cannot be imported
 * from there, because common-schemas.js imports ANIMATION_PRESET_PARAMS_SCHEMAS
 * from this file (for animationSchema's discriminatedBy). The pattern itself is
 * shared via core/themes/color-syntax.js.
 */
const simpleColorSchema = {
  type: 'string',
  pattern: COLOR_VALUE_PATTERN,
  description: 'Colour value (hex, rgb, named colour, theme token, or CSS variable)',
  'x-ui-hints': { widget: 'lcards-color-picker' }
};

/**
 * Canonical top-level animation fields (duration/ease/loop/alternate/delay),
 * redeclared here so they validate correctly wherever a preset's `params:`
 * also contains them — both placements are legal (see resolvePresetParams()
 * in lcards-anim-helpers.js: top-level wins on conflict, params is otherwise
 * merged in). Presets that repurpose one of these names with a different
 * meaning override the relevant key in their own schema below.
 */
export const _CANONICAL_REDECLARED = {
  duration: {
    type: ['number', 'object'], minimum: 0, maximum: 10000,
    description: 'Also accepted nested here (top-level wins if both set). Also accepts a map_range descriptor for entity-driven, live-adjusting duration on looping animations.'
  },
  ease: {
    type: ['string', 'object'],
    description: 'Also accepted nested here (top-level wins if both set).'
  },
  loop: {
    oneOf: [{ type: 'boolean' }, { type: 'integer', minimum: 1 }],
    description: 'Also accepted nested here (top-level wins if both set).'
  },
  alternate: {
    type: 'boolean',
    description: 'Also accepted nested here (top-level wins if both set).'
  },
  delay: {
    type: ['number', 'object'], minimum: 0,
    description: 'Also accepted nested here (top-level wins if both set). Also accepts a map_range descriptor.'
  }
};

// ============================================================================
// CORE PRESETS (mirrors src/core/packs/animations/presets/index.js)
// ============================================================================

export const pulseParamsSchema = {
  type: 'object',
  description: 'Params for the "pulse" preset: breathing scale/brightness effect.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_scale: {
      type: 'number', minimum: 0.5, maximum: 3, default: 1.15,
      description: 'How much to grow. Falls back to `scale` if set, else 1.15.',
      'x-ui-hints': { label: 'Max Scale', selector: { number: { min: 0.5, max: 3, step: 0.05, mode: 'slider' } } }
    },
    scale: {
      type: 'number', minimum: 0.5, maximum: 3,
      description: 'Legacy alias for max_scale (max_scale wins if both set).'
    },
    max_brightness: {
      type: 'number', minimum: 1, maximum: 3, default: 1.4,
      description: 'How much to brighten (1.0 = normal).',
      'x-ui-hints': { label: 'Max Brightness', selector: { number: { min: 1, max: 3, step: 0.1, mode: 'slider' } } }
    }
  },
  additionalProperties: 'warn'
};

export const fadeParamsSchema = {
  type: 'object',
  description: 'Params for the "fade" preset: simple opacity transition.',
  properties: {
    ..._CANONICAL_REDECLARED,
    from: { type: 'number', minimum: 0, maximum: 1, default: 1, description: 'Starting opacity.' },
    to: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Target opacity.' }
  },
  additionalProperties: 'warn'
};

export const glowParamsSchema = {
  type: 'object',
  description: 'Params for the "glow" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color: { ...simpleColorSchema, default: 'var(--lcars-blue, #66ccff)', description: 'Glow colour. Falls back to `glow_color` if set.' },
    glow_color: { ...simpleColorSchema, description: 'Legacy alias for color, lower precedence.' },
    blur_min: { type: 'number', minimum: 0, maximum: 50, default: 0 },
    blur_max: { type: 'number', minimum: 0, maximum: 50, default: 10 }
  },
  additionalProperties: 'warn'
};

export const drawParamsSchema = {
  type: 'object',
  description: 'Params for the "draw" preset: SVG stroke reveal via anime.js createDrawable.',
  properties: {
    ..._CANONICAL_REDECLARED,
    reverse: {
      type: 'boolean', default: false,
      description: 'If true, draws from end to start. Only affects the default `draw` value: ignored if `draw` is explicitly supplied.'
    },
    draw: {
      oneOf: [
        { type: 'array', items: { type: 'string' }, description: "e.g. ['0 0', '0 1']" },
        { type: 'object', properties: { values: { type: 'array', items: { type: 'string' }, required: true } } }
      ],
      description: "Draw values or {values: [...]}. Defaults to ['0 0','0 1'] (or reversed) based on `reverse`.",
      // A oneOf with an array branch hits a known, separately-tracked bug in
      // FormField's oneOf/choose handling (_prepareValueForSelector has no
      // Array.isArray branch, so an array value always resets to the first
      // choice) — bypass via the code editor rather than ship a broken toggle.
      'x-ui-hints': { widget: 'json', label: 'Draw Values' }
    }
  },
  additionalProperties: 'warn'
};

export const marchParamsSchema = {
  type: 'object',
  description: 'Params for the "march" preset: CSS-based marching dashed line (bypasses anime.js).',
  properties: {
    ..._CANONICAL_REDECLARED,
    duration: {
      ..._CANONICAL_REDECLARED.duration,
      description: 'Used only if `speed` is absent (converted to seconds for a CSS animation-duration). `speed` takes precedence if both are set.'
    },
    loop: {
      ..._CANONICAL_REDECLARED.loop, default: true,
      description: 'Maps to CSS animation-iteration-count: true→infinite, false/0→1, N→N. Uses CSS keyframes, not the generic anime.js loop mechanism.'
    },
    speed: { type: 'number', minimum: 0, description: 'Seconds per cycle. Takes precedence over `duration` if present.', 'x-ui-hints': { label: 'Speed (sec/cycle, lower = faster)' } },
    direction: { type: 'string', enum: ['forward', 'reverse'], default: 'forward' },
    dash_length: { type: 'number', minimum: 0, description: 'Auto-detected from the element\'s stroke-dasharray if absent; fallback 10.' },
    gap_length: { type: 'number', minimum: 0, description: 'Auto-detected from the element\'s stroke-dasharray if absent; fallback 5.' }
  },
  additionalProperties: 'warn'
};

export const blinkParamsSchema = {
  type: 'object',
  description: 'Params for the "blink" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3 }
  },
  additionalProperties: 'warn'
};

export const shimmerParamsSchema = {
  type: 'object',
  description: 'Params for the "shimmer" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color_from: { ...simpleColorSchema, description: 'Must be paired with color_to, else color animation is skipped (opacity still animates).' },
    color_to: { ...simpleColorSchema, description: 'Falls back to `shimmer_color`. Must be paired with color_from.' },
    shimmer_color: { ...simpleColorSchema, description: 'Legacy alias for color_to, lower precedence.' },
    opacity_from: { type: 'number', minimum: 0, maximum: 1, default: 1 },
    opacity_to: { type: 'number', minimum: 0, maximum: 1, default: 0.5 }
  },
  additionalProperties: 'warn'
};

export const strobeParamsSchema = {
  type: 'object',
  description: 'Params for the "strobe" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    duration: { ..._CANONICAL_REDECLARED.duration, default: 100, description: 'Unusually short vs. most presets; strobe is fast by design.' },
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0 }
  },
  additionalProperties: 'warn'
};

export const flickerParamsSchema = {
  type: 'object',
  description: 'Params for the "flicker" preset: random opacity keyframes, a new pattern on each loop. `alternate` has no effect.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
    seed: { type: 'number', description: 'Any number: the same random pattern on every load. Leave unset for a new pattern each time. Targets with the same seed share the pattern.' }
  },
  additionalProperties: 'warn'
};

export const cascadeParamsSchema = {
  type: 'object',
  description: 'Params for the "cascade" preset: staggered fade/property tween across multiple targets.',
  properties: {
    ..._CANONICAL_REDECLARED,
    loop: { ..._CANONICAL_REDECLARED.loop, default: false },
    stagger: { type: 'number', minimum: 0, default: 100, description: 'Per-element delay (ms). NOT the canonical `delay` field, which is unused here.' },
    property: { type: 'string', default: 'opacity', description: 'Arbitrary anime/CSS property name: unvalidated passthrough.' },
    from: { type: 'number', default: 0 },
    to: { type: 'number', default: 1 }
  },
  additionalProperties: 'warn'
};

export const cascadeColorParamsSchema = {
  type: 'object',
  description: 'Params for the "cascade-color" preset: staggered color cascade across a grid/row of targets. NOTE: the default `property` ("color") is correct for its primary intended use (data-grid cells, plain HTML/CSS-rendered) but won\'t visibly work on an SVG-shape target (LCARdS\'s own button/elbow/slider/MSD cards). Set `property` to `fill` or `stroke` for those.',
  properties: {
    ..._CANONICAL_REDECLARED,
    colors: {
      anyOf: [
        { type: 'array', minItems: 3, items: { ...simpleColorSchema } },
        {
          type: 'object',
          description: 'Data grid form: { start, text, end }',
          properties: { start: { ...simpleColorSchema }, text: { ...simpleColorSchema }, end: { ...simpleColorSchema } }
        }
      ],
      description: 'Only indices [0],[1],[2] are used; defaults to 3 theme tokens if omitted.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    // Read by lcards-data-grid, which runs one cascade per row (buildCascadeRowTimings).
    pattern: { type: 'string', enum: ['default', 'niagara', 'fast', 'custom'], description: 'Data grid: per-row timing pattern.' },
    speed_multiplier: { type: 'number', exclusiveMinimum: 0, description: 'Data grid: 2 = twice as fast. Ignored when duration is set.' },
    timing: {
      type: 'array',
      description: 'Data grid: per-row timing for pattern: custom (repeats for further rows).',
      items: {
        type: 'object',
        properties: {
          duration: { type: 'number', minimum: 0, description: 'Colour cycle length in ms' },
          delay: { type: 'number', minimum: 0, description: 'Row start delay in seconds' }
        }
      }
    },
    property: { type: 'string', default: 'color', description: "Passthrough key used inside keyframe objects. 'fill'/'stroke' for SVG shapes, 'color'/'background-color' only for plain HTML/CSS-rendered targets." },
    mode: {
      type: 'string', enum: ['css', 'animejs'],
      description: "Both modes actually run through anime.js. Despite the naming, this isn't a CSS-vs-anime.js engine choice. 'animejs' mode adds per-cell stagger (interactive/stagger_from/axis) on top of the base cascade; 'css' mode is the plain synchronized version. Auto-computed from interactive/stagger_from/axis when unset, and force-upgraded to 'animejs' whenever any of those are set even if `mode` was also set explicitly: those fields have no effect at all in 'css' mode, so silently ignoring them would be more surprising than the override."
    },
    interactive: { type: 'boolean', default: false, description: "Only wired up (mouseenter/mouseleave pause/play) when mode==='animejs'. With stagger_from set, hovering any target pauses the whole cascade." },
    stagger_from: {
      type: 'string', enum: ['first', 'last', 'center', 'random'],
      description: "Stagger the targets from this end instead of starting them together (forces mode 'animejs')."
    },
    stagger_delay: { type: 'number', minimum: 0, default: 100, description: 'Per-target stagger step in ms, with stagger_from.' },
    axis: {
      type: 'string', enum: ['row', 'column'], default: 'row',
      description: "With stagger_from: 'row' follows target order; 'column' staggers by layout position, row by row downward (forces mode 'animejs')."
    },
    delay: { type: 'number', minimum: 0, default: 0, description: 'Row-level start delay: a legitimate use of the canonical start-offset meaning (unlike the stagger-* presets).' }
  },
  additionalProperties: 'warn'
};

export const rippleParamsSchema = {
  type: 'object',
  description: 'Params for the "ripple" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    scale_max: { type: 'number', minimum: 1, maximum: 5, default: 1.5 },
    opacity_min: { type: 'number', minimum: 0, maximum: 1, default: 0 }
  },
  additionalProperties: 'warn'
};

export const scaleParamsSchema = {
  type: 'object',
  description: 'Params for the "scale" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    scale: { type: 'number', minimum: 0.1, maximum: 10, default: 1.1, description: 'Target scale.' },
    from: { type: 'number', minimum: 0.1, maximum: 10, default: 1, description: 'Starting scale.' }
  },
  additionalProperties: 'warn'
};

export const scaleResetParamsSchema = {
  type: 'object',
  description: 'Params for the "scale-reset" preset. `loop`/`alternate` are hardcoded false in code today and have no effect even if set; see Phase 13.6.',
  properties: {
    ..._CANONICAL_REDECLARED
  },
  additionalProperties: 'warn'
};

export const slideParamsSchema = {
  type: 'object',
  description: 'Params for the "slide" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    from: {
      type: 'string', enum: ['right', 'left', 'top', 'bottom', 'up', 'down'], default: 'right',
      description: "Falls back to `direction`. Actual code default is 'right' (doc previously said 'up'; corrected here, see Phase 13.6)."
    },
    direction: {
      type: 'string', enum: ['right', 'left', 'top', 'bottom', 'up', 'down'],
      description: 'Legacy alias for `from`, lower precedence.'
    },
    distance: {
      oneOf: [{ type: 'number' }, { type: 'string' }],
      default: 100,
      description: "Number → px. String containing '%' → treated as a percentage."
    }
  },
  additionalProperties: 'warn'
};

export const rotateParamsSchema = {
  type: 'object',
  description: 'Params for the "rotate" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    direction: {
      type: 'string', enum: ['clockwise', 'counterclockwise'],
      description: 'If present, entirely overrides from/to: clockwise → [0,360], counterclockwise → [0,-360].'
    },
    from: { type: 'number', default: 0, description: 'Only used if `direction` is absent.' },
    to: { type: 'number', default: 360, description: 'Only used if `direction` is absent.' }
  },
  additionalProperties: 'warn'
};

export const shakeParamsSchema = {
  type: 'object',
  description: 'Params for the "shake" preset. `alternate` has no effect: keyframes always return to 0 regardless.',
  properties: {
    ..._CANONICAL_REDECLARED,
    intensity: { type: 'number', minimum: 0, default: 10, description: 'Max px displacement.' },
    frequency: { type: 'number', minimum: 1, default: 4, description: 'Number of alternating keyframes generated.' }
  },
  additionalProperties: 'warn'
};

export const bounceParamsSchema = {
  type: 'object',
  description: 'Params for the "bounce" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    scale_max: { type: 'number', minimum: 1, maximum: 3, default: 1.2 },
    bounces: {
      type: 'number', minimum: 1, default: 3,
      description: "If > 1, `ease` is force-overridden to 'outQuad' and `duration` is multiplied by `bounces` (see Phase 13.6 re: whether ease should stay overridable here). If <= 1, the user's ease/duration are used unmodified."
    }
  },
  additionalProperties: 'warn'
};

export const colorShiftParamsSchema = {
  type: 'object',
  description: 'Params for the "color-shift" preset. NOTE: the default `property` ("color") only visibly works on plain HTML/CSS-rendered targets; LCARdS\'s own cards (button/elbow/slider/MSD) draw their shapes as SVG paths, which don\'t respond to the CSS `color` property at all. Set `property` to `fill` or `stroke` when targeting an SVG shape.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color_from: { ...simpleColorSchema, description: 'Required: omitting either color_from or color_to makes the preset a no-op with a warning.' },
    color_to: { ...simpleColorSchema, description: 'Required, see color_from.' },
    property: { type: 'string', default: 'color', description: "'fill'/'stroke' for SVG shapes (LCARdS's own cards), 'color'/'background-color' only for plain HTML/CSS-rendered targets." }
  },
  additionalProperties: 'warn'
};

export const skewParamsSchema = {
  type: 'object',
  description: 'Params for the "skew" preset. Presence of EITHER from_skewX or from_skewY switches skewX/skewY into "to" targets instead of direct targets from 0: a genuine conditional shape (kept as hardcoded editor UI, not schema-driven form, per Phase 13.5).',
  properties: {
    ..._CANONICAL_REDECLARED,
    skewX: { type: 'number', default: 0, description: 'Degrees.' },
    skewY: { type: 'number', default: 0, description: 'Degrees.' },
    from_skewX: { type: 'number', default: 0 },
    from_skewY: { type: 'number', default: 0 }
  },
  additionalProperties: 'warn'
};

export const glitchParamsSchema = {
  type: 'object',
  description: "Params for the \"glitch\" preset. `ease` is hardcoded to 'linear', ignored. `alternate` has no effect.",
  properties: {
    ..._CANONICAL_REDECLARED,
    intensity: { type: 'number', minimum: 0, default: 5, description: 'Max px displacement, symmetric around 0.' },
    frequency: { type: 'number', minimum: 1, default: 10, description: 'Number of random keyframes per loop (a new pattern on each loop).' },
    seed: { type: 'number', description: 'Any number: the same random pattern on every load. Leave unset for a new pattern each time. Targets with the same seed share the pattern.' }
  },
  additionalProperties: 'warn'
};

export const setParamsSchema = {
  type: 'object',
  description: 'Params for the "set" preset: direct property assignment (duration/ease/loop/alternate/delay are all ignored; duration is hardcoded 0).',
  properties: {
    properties: {
      type: 'object', additionalProperties: true, default: {},
      description: "Free-form key→value map spread directly into anime params, e.g. {opacity: 0.5, fill: 'red'}. Completely unvalidated shape.",
      'x-ui-hints': { widget: 'json', label: 'Properties' }
    }
  },
  additionalProperties: 'warn'
};

export const motionpathParamsSchema = {
  type: 'object',
  description: 'Params for the "motionpath" preset: animates an element (or, with `shape` set, a self-created tracer shape) along an SVG path.',
  properties: {
    ..._CANONICAL_REDECLARED,
    path: { type: 'string', description: 'Required. CSS selector (#id or .class) for the motion-path SVG element.' },
    rotate: { type: 'boolean', default: true, description: 'Auto-rotate along path (different meaning from the top-level "rotate" preset\'s numeric from/to). A sibling of `shape` below, not a field inside it; controls the motion itself, applies whether or not `shape` is set.' },
    anchor: { type: 'string', default: '50% 50%', description: 'CSS transform-origin syntax, unvalidated. A sibling of `shape` below, not a field inside it.' },
    shape: {
      type: 'object',
      description: 'Opt-in: motionpath creates and animates its own shape (a "tracer") instead of moving target/targets, e.g. a traveling dot suggesting energy flow along a line. Mutually exclusive with target/targets (shape wins, with a console warning, if both are set). Field names deliberately mirror line markers\' (marker_start/marker_end) styling options. Appearance only; `rotate`/`anchor` (motion behavior) are separate, sibling `params` fields, not part of this object.',
      properties: {
        type: { type: 'string', enum: ['circle', 'rect', 'diamond'], default: 'circle' },
        size: { type: 'number', minimum: 1, default: 10, description: 'Diameter (circle/diamond) or width/height fallback (rect) in px.' },
        width: { type: 'number', minimum: 1, description: 'rect only: overrides size for width.' },
        height: { type: 'number', minimum: 1, description: 'rect only: overrides size for height.' },
        fill: { type: 'string', default: 'currentColor', 'x-ui-hints': { widget: 'lcards-color-picker' } },
        stroke: { type: 'string', default: 'none', 'x-ui-hints': { widget: 'lcards-color-picker' } },
        stroke_width: { type: 'number', minimum: 0, default: 0 }
      },
      additionalProperties: 'warn',
      // Fixed, known set of sub-properties — rendered as a structured sub-form
      // (_renderNestedObjectField() in lcards-animation-editor.js), not JSON text.
      'x-ui-hints': { label: 'Tracer Shape' }
    }
  },
  additionalProperties: 'warn'
};

export const morphParamsSchema = {
  type: 'object',
  description: 'Params for the "morph" preset: the target shape (a path, polygon or polyline, or the first one inside the target) takes the geometry of the `to` shape. Stopping puts the original back; loop with alternate flips between the two.',
  properties: {
    ..._CANONICAL_REDECLARED,
    duration: { ..._CANONICAL_REDECLARED.duration, default: 800 },
    to: { type: 'string', description: 'Required. CSS selector of the shape to morph into, found in the same card, e.g. #warn_shape or [data-overlay-id="warn_shape"]. It can be hidden (display: none or inside defs).' },
    precision: { type: 'number', minimum: 0, default: 0.33, description: 'Points sampled per SVG unit of path length (anime.js morphTo). Higher is smoother and slower. 0 interpolates the raw geometry, which only works when both shapes use the same path commands.' },
    morph_to_selector: { type: 'string', deprecated: true, 'x-replacement': 'params.to', description: 'Old name for to.' }
  },
  additionalProperties: 'warn'
};

export const sequenceParamsSchema = {
  type: 'object',
  description: "Params for the \"sequence\" preset: timeline of steps. Each step may set its own duration/ease (falling back to this preset's own duration/ease as per-step defaults). Step positioning uses `offset`; the preset factory also accepts the older `at` name as a fallback (translated to `offset` internally); `offset` wins if a step sets both.",
  properties: {
    duration: { type: 'number', minimum: 0, maximum: 10000, default: 2000, description: 'Fallback duration for steps missing their own duration.' },
    ease: { type: ['string', 'object'], description: "Fallback easing for steps missing their own ease. Default 'outQuad'." },
    loop: { ..._CANONICAL_REDECLARED.loop, default: false },
    steps: {
      type: 'array', minItems: 1,
      items: {
        type: 'object',
        properties: {
          target: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], description: "CSS selector (or list of selectors) for this step, resolved inside the card: in an MSD card any overlay of that card, e.g. [data-overlay-id=\"line_1\"]. Without it the step animates the animation's own target(s)." },
          targets: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], description: 'Same as target.' },
          offset: { oneOf: [{ type: 'number' }, { type: 'string' }], description: "Position in the timeline: an absolute ms number, '+=N' / '-=N' relative to the end of the previous step, '<' at the end of the previous step, '<<' together with the previous step." }
        },
        additionalProperties: true,
        description: 'Arbitrary anime.js tween properties at the top level, plus optional target, duration, ease and offset (or legacy at).'
      },
      description: 'Required, at least one step.',
      'x-ui-hints': { widget: 'json', label: 'Steps' }
    }
  },
  additionalProperties: 'warn'
};

export const customParamsSchema = {
  type: 'object',
  description: 'Params for the "custom" preset: raw anime.js v4 animation properties passed through to animate(), for example opacity, scale, translateX, keyframes, loop, alternate, ease. The target comes from the animation\'s own target/targets.',
  properties: {
    ..._CANONICAL_REDECLARED
  },
  additionalProperties: true
};

export const chaosParamsSchema = {
  type: 'object',
  description: 'Params for the "chaos" preset: randomized multi-property glitch motion, new random values on each loop. Does not use the top-level `duration` field at all.',
  properties: {
    ..._CANONICAL_REDECLARED,
    loop: { ..._CANONICAL_REDECLARED.loop, default: true },
    properties: {
      type: 'array',
      items: { type: 'string' },
      default: ['x', 'y', 'rotate'],
      description: "'x'/'y' tokens are remapped to translateX/translateY; other tokens (e.g. 'rotate','opacity') used verbatim as the anime property name. Not validated as an array in code today; a non-array truthy value will throw.",
      'x-ui-hints': { widget: 'json', label: 'Properties' }
    },
    range: {
      type: 'object',
      additionalProperties: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' } },
      default: { x: [-50, 50], y: [-50, 50], rotate: [-15, 15] },
      description: 'Min/max range per property. Keys should match `properties`. Each value must be a 2-element array or that property\'s animation is silently skipped.',
      'x-ui-hints': { widget: 'json', label: 'Range' }
    },
    duration_min: { type: 'number', minimum: 0, default: 200, description: 'Replaces the canonical `duration` entirely for this preset.' },
    duration_max: { type: 'number', minimum: 0, default: 800 },
    composition: { type: 'string', enum: ['blend', 'replace'], default: 'blend', description: 'Not validated in code today: documented values only.' },
    seed: { type: 'number', description: 'Any number: the same random pattern on every load. Leave unset for a new pattern each time. Targets with the same seed share the pattern.' }
  },
  additionalProperties: 'warn'
};

export const physicsSpringParamsSchema = {
  type: 'object',
  description: 'Params for the "physics-spring" preset. `ease`, `duration`, and `alternate` (canonical) are entirely bypassed; spring dynamics determine the effective duration internally. `loop`, however, genuinely is read and respected. Has its own parallel spring-config system separate from the generic `ease: {type:"spring", params:{...}}` path: see Phase 13.6.',
  properties: {
    property: { type: 'string', default: 'scale', description: 'Passthrough anime property name.' },
    from: { type: ['number', 'string'], description: 'Required (typically a number; a color string is also valid for color-like properties).' },
    to: { type: ['number', 'string'], description: 'Required, see from.' },
    stiffness: { type: 'number', minimum: 0, default: 100 },
    damping: { type: 'number', minimum: 0, default: 10 },
    mass: { type: 'number', minimum: 0, default: 1 },
    velocity: { type: 'number', default: 0 },
    loop: { ..._CANONICAL_REDECLARED.loop, default: false }
  },
  additionalProperties: 'warn'
};

// ============================================================================
// STAGGER PRESETS (mirrors src/core/packs/animations/presets/stagger-presets.js)
// ============================================================================

export const staggerGridParamsSchema = {
  type: 'object',
  description: 'Params for the "stagger-grid" preset: stagger across a [cols, rows] grid of targets.',
  properties: {
    ..._CANONICAL_REDECLARED,
    ease: { ..._CANONICAL_REDECLARED.ease, description: "Default 'outQuad'." },
    alternate: { ..._CANONICAL_REDECLARED.alternate, default: false },
    delay: {
      ..._CANONICAL_REDECLARED.delay, default: 100,
      description: 'Repurposed as per-element stagger step (ms), NOT the canonical single start-offset.'
    },
    grid: {
      type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' }, default: [1, 1],
      description: 'Validated in code: warns and no-ops if provided with the wrong shape.',
      'x-ui-hints': { widget: 'json', label: 'Grid [cols, rows]' }
    },
    from: {
      oneOf: [
        { type: 'string', enum: ['first', 'last', 'center', 'edges', 'random', 'start', 'end', 'pointer'] },
        { type: 'array', minItems: 2, maxItems: 2, items: { type: 'integer', minimum: 0 } }
      ],
      default: 'first',
      description: "Where the wave starts: 'first' (top-left), 'last', 'center' (outward), 'edges' (inward), 'random', or a [col, row] cell (0-indexed). 'start' and 'end' are aliases of 'first' and 'last'. 'pointer' starts where the card was tapped (on_tap, on_hold, on_double_tap; the centre for other triggers).",
      // A oneOf with an array branch hits a known, separately-tracked bug in
      // FormField's oneOf/choose handling (_prepareValueForSelector has no
      // Array.isArray branch, so an array value always resets to the first
      // choice) — bypass via the code editor rather than ship a broken toggle.
      'x-ui-hints': { widget: 'json', label: 'From' }
    },
    axis: {
      type: 'string', enum: ['x', 'y', 'row', 'column'],
      description: "Stagger along one axis only: 'x' (or 'row') delays by column, 'y' (or 'column') by row."
    },
    reversed: { type: 'boolean', default: false, description: 'Run the stagger in the opposite order.' },
    jitter: {
      anyOf: [{ type: 'number', minimum: 0 }, { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', minimum: 0 } }],
      description: 'Random offset in ms added to each target\'s delay (plus or minus). A [start, end] pair ramps it along the stagger order.',
      'x-ui-hints': { widget: 'json', label: 'Jitter (ms)' }
    },
    seed: { type: 'number', description: 'Any number: the same jitter and random order on every load.' },
    property: { type: 'string', default: 'scale' },
    from_value: { type: 'number', default: 0.8 },
    to_value: { type: 'number', default: 1 }
  },
  additionalProperties: 'warn'
};

export const tapRippleParamsSchema = {
  type: 'object',
  description: 'Params for the "tap-ripple" preset: a pulse that spreads across the targets from where the card was tapped (positions read from the layout). Use with on_tap, on_hold or on_double_tap and several targets, e.g. target: .grid-cell in a data-grid.',
  properties: {
    duration: { ..._CANONICAL_REDECLARED.duration, default: 500, description: "One target's pulse, ms." },
    ease: { ..._CANONICAL_REDECLARED.ease, description: "Default 'outQuad'." },
    spread: { type: 'number', minimum: 0, default: 400, description: 'ms for the wave to travel from the tap point to the farthest target, whatever the layout.' },
    scale: { type: 'number', minimum: 0, default: 1.08, description: 'Peak scale of each target.' },
    opacity_min: { type: 'number', minimum: 0, maximum: 1, default: 0.4, description: 'Lowest opacity of each target during its pulse.' },
    color: { ...simpleColorSchema, description: 'Optional flash colour at the peak of each pulse (theme token, CSS variable or colour).' },
    property: { type: 'string', enum: ['color', 'fill', 'stroke'], default: 'color', description: "What color sets: 'color' for HTML text such as data-grid cells, 'fill' or 'stroke' for SVG shapes." },
    from: {
      type: 'string', enum: ['pointer', 'center', 'first', 'last', 'random'], default: 'pointer',
      description: "Where the wave starts: 'pointer' is the tap point (the centre when another trigger fires it)."
    },
    reversed: { type: 'boolean', default: false, description: 'Run the wave inward, ending at the tap point.' },
    jitter: {
      anyOf: [{ type: 'number', minimum: 0 }, { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', minimum: 0 } }],
      description: 'Random extra delay per target (ms, or a [start, end] ramp) for a less even wave.',
      'x-ui-hints': { widget: 'json', label: 'Jitter (ms)' }
    },
    seed: { type: 'number', description: 'Any number: the same jitter on every load.' }
  },
  additionalProperties: 'warn'
};

export const staggerWaveParamsSchema = {
  type: 'object',
  description: "Params for the \"stagger-wave\" preset: wave effect across a linear sequence of targets. Actual code default for `alternate` is false (doc previously said true; corrected here, see Phase 13.6).",
  properties: {
    ..._CANONICAL_REDECLARED,
    alternate: { ..._CANONICAL_REDECLARED.alternate, default: false },
    delay: {
      ..._CANONICAL_REDECLARED.delay, default: 100,
      description: 'Repurposed as per-element stagger step (ms), NOT the canonical single start-offset.'
    },
    direction: {
      type: 'string', enum: ['normal', 'reverse'], default: 'normal',
      description: "'reverse' runs the wave from the last target (the same as reversed: true)."
    },
    reversed: { type: 'boolean', default: false, description: 'Run the wave from the last target.' },
    jitter: {
      anyOf: [{ type: 'number', minimum: 0 }, { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', minimum: 0 } }],
      description: 'Random offset in ms added to each target\'s delay (plus or minus). A [start, end] pair ramps it along the stagger order.',
      'x-ui-hints': { widget: 'json', label: 'Jitter (ms)' }
    },
    seed: { type: 'number', description: 'Any number: the same jitter and random order on every load.' },

    property: { type: 'string', default: 'translateY' },
    amplitude: { type: 'number', default: -20, description: 'Used in a 3-point path [0, amplitude, 0].' }
  },
  additionalProperties: 'warn'
};

export const staggerRadialParamsSchema = {
  type: 'object',
  description: 'Params for the "stagger-radial" preset: stagger radiating from a point. `alternate` is not read at all by this preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    delay: {
      ..._CANONICAL_REDECLARED.delay, default: 50,
      description: 'Repurposed as per-element stagger step (ms), NOT the canonical single start-offset.'
    },
    from: {
      oneOf: [
        { type: 'string', enum: ['center', 'first', 'last', 'random', 'pointer'] },
        { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', minimum: 0, maximum: 1 } }
      ],
      default: 'center',
      description: "Where the ripple starts, measured on the targets' real positions: 'center', 'first', 'last', 'random', or an [x, y] point as fractions of the group (0 to 1, [0, 0] is top-left).",
      // See stagger-grid.from's comment — same known oneOf/array selector bug.
      'x-ui-hints': { widget: 'json', label: 'From' }
    },
    property: { type: 'string', default: 'scale' },
    from_value: { type: 'number', default: 0 },
    to_value: { type: 'number', default: 1 },
    reversed: { type: 'boolean', default: false, description: 'Run the stagger in the opposite order.' },
    jitter: {
      anyOf: [{ type: 'number', minimum: 0 }, { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', minimum: 0 } }],
      description: 'Random offset in ms added to each target\'s delay (plus or minus). A [start, end] pair ramps it along the stagger order.',
      'x-ui-hints': { widget: 'json', label: 'Jitter (ms)' }
    },
    seed: { type: 'number', description: 'Any number: the same jitter and random order on every load.' }
  },
  additionalProperties: 'warn'
};

export const staggerFlashParamsSchema = {
  type: 'object',
  description: 'Params for the "stagger-flash" preset: WAAPI-driven flash sweep, bypassing anime.js entirely for the real visual effect.',
  properties: {
    lead_color: { ...simpleColorSchema, default: 'var(--primary-color)' },
    trail_color: { ...simpleColorSchema, default: '#444444' },
    lead_pct: { type: 'number', minimum: 1, maximum: 50, default: 20, description: 'Clamped in code to [1, 50].' },
    duration: { type: 'number', minimum: 0, default: 2000, description: 'Total WAAPI cycle duration.' },
    delay: {
      type: 'number', minimum: 0,
      description: 'Per-element stagger step (ms). Dynamic default: round(duration / 12). NOT the canonical single start-offset.'
    },
    grid: {
      type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' },
      description: 'No length validation. Only forwarded into the (mostly inert) anime stagger config.',
      'x-ui-hints': { widget: 'json', label: 'Grid [cols, rows]' }
    },
    from: { type: 'string', enum: ['first', 'last', 'center'], default: 'first' },
    property: { type: 'string', default: 'stroke', description: 'Used as a Web Animations API keyframe property name; must be WAAPI-animatable.' },
    with_opacity: { type: 'boolean', default: true },
    trail_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.25 },
    loop: { type: 'boolean', default: true, description: 'Maps to WAAPI iterations: Infinity vs 1, not the generic anime.js loop mechanism.' }
  },
  additionalProperties: 'warn'
};

// ============================================================================
// TEXT PRESETS (mirrors src/core/packs/animations/presets/text-presets.js)
// ============================================================================

export const textRevealParamsSchema = {
  type: 'object',
  description: 'Params for the "text-reveal" preset: character/word/line reveal.',
  properties: {
    ..._CANONICAL_REDECLARED,
    split: { type: 'string', enum: ['chars', 'words', 'lines'], default: 'chars', description: 'Not a strict whitelist in code: anything not exactly "lines"/"words" falls back to chars.' },
    direction: {
      type: 'string', default: 'first',
      description: 'Stagger origin (same family as anime\'s stagger() `from`: first/last/center/random/numeric index). Unvalidated.'
    },
    stagger: { type: 'number', minimum: 0, default: 50, description: 'Per-unit delay step. Canonical `delay` is unused here.' },
    from_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0 },
    from_y: { type: 'number', default: 20, description: 'px, used in translateY.' }
  },
  additionalProperties: 'warn'
};

/** Params text-decode and text-scramble share (anime.js scrambleText options). */
const _DECODE_PARAMS = {
  from: {
    type: 'string', enum: ['left', 'right', 'center', 'random'], default: 'left',
    description: 'Where the reveal starts.'
  },
  reversed: { type: 'boolean', default: false, description: "Reveal in the opposite order: from: center then reveals the edges first." },
  cursor: {
    type: ['boolean', 'string'], default: false,
    description: "Characters shown at the reveal edge: true for '_', or a string. Best seen on slower decodes (a longer duration)."
  },
  perturbation: { type: 'number', minimum: 0, maximum: 1, description: 'Random timing per character (0 to 1) for a less even reveal.' },
  reveal_rate: { type: 'number', exclusiveMinimum: 0, description: 'Characters per second entering the reveal (anime.js default 60).' },
  seed: { type: 'number', description: 'Any number: the same scramble on every load. Each text line gets the next seed.' },
  loop: { type: 'boolean', default: false, description: 'Decode again on every loop.' },
  delay: { type: 'number', minimum: 0, default: 0, description: 'ms before the decode starts.' }
};

export const textDecodeParamsSchema = {
  type: 'object',
  description: 'Params for the "text-decode" preset: an LCARS readout decode (anime.js scrambleText). Each text line starts as glyph noise and resolves character by character; stopping restores the text. `ease`/`alternate` are not used.',
  properties: {
    duration: { type: 'number', minimum: 0, default: 1000, description: 'ms for the whole decode of a line.' },
    chars: {
      type: 'string', default: 'A-Z0-9',
      description: 'Scramble glyphs: a named set (uppercase, lowercase, numbers, symbols, blocks, shades, braille) or characters and ranges such as A-Z0-9. Put a literal - first or last.'
    },
    ..._DECODE_PARAMS
  },
  additionalProperties: 'warn'
};

export const textScrambleParamsSchema = {
  type: 'object',
  description: 'Params for the "text-scramble" preset: the decode of text-decode under its original name, with its original timing params. A line takes duration + (characters - 1) x stagger ms. Any text-decode param works too.',
  properties: {
    duration: { type: 'number', minimum: 0, default: 800, description: 'ms each character spends scrambling.' },
    stagger: { type: 'number', minimum: 0, default: 40, description: 'ms between each character starting.' },
    characters: {
      type: 'string', default: 'A-Z0-9!@#$%^&*',
      description: 'Scramble glyphs, as text-decode chars (named sets and ranges such as A-Z work; put a literal - first or last).'
    },
    chars: { type: 'string', description: 'Same as characters.' },
    settle_at: {
      type: 'number', minimum: 0, maximum: 1, deprecated: true,
      description: 'No longer used: the decode settles each character itself.'
    },
    ..._DECODE_PARAMS
  },
  additionalProperties: 'warn'
};

export const textGlitchParamsSchema = {
  type: 'object',
  description: "Params for the \"text-glitch\" preset. `ease` (canonical) is hardcoded to 'inOutQuad', ignored.",
  properties: {
    intensity: { type: 'number', minimum: 0, default: 5, description: 'Max px/SVG-unit displacement.' },
    duration: { type: 'number', minimum: 0, default: 300, description: 'ms per glitch cycle.' },
    stagger: { type: 'number', minimum: 0, default: 50, description: 'ms offset between characters. Canonical `delay` is unused here.' },
    color_shift: { type: 'boolean', default: false, description: 'HTML target path only: silently ignored for SVG elements.' },
    loop: { type: 'boolean', default: false }
  },
  additionalProperties: 'warn'
};

export const textTypewriterParamsSchema = {
  type: 'object',
  description: "Params for the \"text-typewriter\" preset. `duration` (canonical) is hardcoded to 1, ignored. `ease` hardcoded 'linear'. `alternate`/`delay` (canonical) never read.",
  properties: {
    speed: { type: 'number', minimum: 0, default: 100, description: 'ms per character.' },
    loop: { type: 'boolean', default: false }
  },
  additionalProperties: 'warn'
};

// ============================================================================
// EFFECT PRESETS (mirrors src/core/packs/animations/presets/effect-presets.js)
// ============================================================================

export const bootSequenceParamsSchema = {
  type: 'object',
  description: 'Params for the "boot-sequence" preset: the target powers up. Stroked shapes draw in, filled shapes come on, then the text decodes, all on one timeline. Parts the card does not have are skipped. Best on on_show or on_load.',
  properties: {
    duration: { ..._CANONICAL_REDECLARED.duration, default: 1200, description: 'ms for the whole sequence.' },
    delay: { ..._CANONICAL_REDECLARED.delay, description: 'ms before the sequence starts.' },
    fill: { type: 'string', enum: ['flicker', 'sweep', 'fade'], default: 'flicker', description: "How filled shapes come on: 'flicker' (a panel powering up), 'sweep' (wipes in from the from side) or 'fade'." },
    from: { type: 'string', enum: ['left', 'right', 'top', 'bottom'], default: 'left', description: 'The side a sweep starts from.' },
    draw: { type: 'boolean', default: true, description: 'Draw stroked shapes (borders, lines, rings) in.' },
    decode: { type: 'boolean', default: true, description: 'Decode the text from glyph noise. Off: the text just appears.' },
    chars: { type: 'string', default: 'A-Z0-9', description: 'Decode glyphs, as in text-decode: a named set (uppercase, numbers, blocks, ...) or ranges.' },
    stagger: { type: 'number', minimum: 0, default: 60, description: 'ms between one shape coming on and the next.' },
    seed: { type: 'number', description: 'Any number: the same decode on every load.' }
  },
  additionalProperties: 'warn'
};

export const sensorSweepParamsSchema = {
  type: 'object',
  description: 'Params for the "sensor-sweep" preset: a rotating scanner wedge with a ring that pings outward each turn. It draws its own shapes, centred on the target, and removes them when stopped.',
  properties: {
    duration: { ..._CANONICAL_REDECLARED.duration, default: 3000, description: 'ms per revolution (and per ping).' },
    delay: { ..._CANONICAL_REDECLARED.delay, description: 'ms before it starts.' },
    loop: { ..._CANONICAL_REDECLARED.loop, default: true },
    radius: { type: 'number', exclusiveMinimum: 0, description: "SVG units. Default: half the shorter side of the target's box." },
    center: {
      type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' },
      description: "[x, y] in the target's SVG units, e.g. an elbow corner or a spot on an MSD. Default: the centre of the target's box.",
      'x-ui-hints': { widget: 'json', label: 'Center [x, y]' }
    },
    angle: { type: 'number', minimum: 1, maximum: 359, default: 40, description: 'Wedge width, degrees.' },
    direction: { type: 'string', enum: ['cw', 'ccw'], default: 'cw', description: 'Clockwise or counter-clockwise.' },
    color: { ...simpleColorSchema, default: 'theme:colors.ui.primary', description: 'Wedge colour.' },
    ring_color: { ...simpleColorSchema, description: 'Ping ring colour. Default: color.' },
    opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.35, description: 'Wedge opacity. The ring starts at 2.5 times this (at most 1) and fades out.' },
    ring: { type: 'boolean', default: true, description: 'Show the ping ring.' },
    ring_width: { type: 'number', minimum: 0, default: 2, description: 'Ring stroke width, SVG units.' }
  },
  additionalProperties: 'warn'
};

// ============================================================================
// TIMELINE PRESETS (mirrors src/core/packs/animations/presets/timeline-presets.js)
// ============================================================================

export const timelineCascadeParamsSchema = {
  type: 'object',
  description: 'Params for the "timeline-cascade" preset: multi-step timeline. Timing/easing for each step lives in that step\'s own config; the top-level canonical `duration`/`ease` are genuinely inert (confirmed against anime.js\'s own source: Timeline recomputes its own duration from its children regardless, and `ease` isn\'t read by the underlying Timer class at all; only a separate `playbackEase` is). `loop`/`alternate`/`delay`, however, do still apply: they govern the whole timeline\'s repeat/reverse/start-delay behavior, since Timeline extends Timer and inherits those from the same top-level params.',
  properties: {
    loop: { type: 'boolean', default: false },
    steps: {
      type: 'array', minItems: 1,
      items: {
        type: 'object',
        properties: {
          targets: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], description: "CSS selector (or list of selectors) for this step, resolved inside the card: in an MSD card any overlay of that card, e.g. [data-overlay-id=\"line_1\"]. Without it the step animates the animation's own target(s)." },
          params: { type: 'object', additionalProperties: true, description: 'Arbitrary anime.js props, e.g. scale/opacity.' },
          duration: { type: 'number', minimum: 0 },
          offset: {
            oneOf: [{ type: 'number' }, { type: 'string' }],
            description: "Position in the timeline: an absolute ms number, '+=N' / '-=N' relative to the end of the previous step, '<' at the end of the previous step, '<<' together with the previous step."
          }
        },
        additionalProperties: true
      },
      'x-ui-hints': { widget: 'json', label: 'Steps' }
    }
  },
  additionalProperties: 'warn'
};

export const timelineAttentionParamsSchema = {
  type: 'object',
  description: 'Params for the "timeline-attention" preset: 3-phase scale/shake/settle sequence. The top-level canonical `duration`/`ease` are genuinely inert (durations are hardcoded to the duration_* fields below, and each phase\'s easing is hardcoded in source with no override; confirmed via anime.js\'s own source that Timeline discards a top-level duration and never reads `ease` at all). Of the remaining canonical fields, only `loop` is actually forwarded by the preset factory (repeats the whole 3-phase sequence); `alternate`/`delay` are never read by this preset\'s code despite being generically available on the Timeline class, so they were deliberately left out of this schema.',
  properties: {
    loop: { type: 'boolean', default: false, description: 'Repeats the whole 3-phase sequence.' },
    scale_max: { type: 'number', minimum: 1, default: 1.15 },
    shake_intensity: { type: 'number', minimum: 0, default: 5, description: 'Used to build a fixed 5-point translateX keyframe array.' },
    duration_scale: { type: 'number', minimum: 0, default: 200, description: 'Duration of phase 1 (scale up).' },
    duration_shake: { type: 'number', minimum: 0, default: 300, description: 'Duration of phase 2 (shake).' },
    duration_settle: { type: 'number', minimum: 0, default: 400, description: 'Duration of phase 3 (settle back).' }
  },
  additionalProperties: 'warn'
};

/**
 * Name → schema map, keyed by the exact string passed to
 * registerAnimationPreset(). Consumed by `animationSchema.properties.params`'s
 * `discriminatedBy` (common-schemas.js) and, later, by the schema-driven
 * editor UI (Phase 13.5).
 */
export const ANIMATION_PRESET_PARAMS_SCHEMAS = {
  pulse: pulseParamsSchema,
  fade: fadeParamsSchema,
  glow: glowParamsSchema,
  draw: drawParamsSchema,
  march: marchParamsSchema,
  blink: blinkParamsSchema,
  shimmer: shimmerParamsSchema,
  strobe: strobeParamsSchema,
  flicker: flickerParamsSchema,
  cascade: cascadeParamsSchema,
  'cascade-color': cascadeColorParamsSchema,
  ripple: rippleParamsSchema,
  scale: scaleParamsSchema,
  'scale-reset': scaleResetParamsSchema,
  slide: slideParamsSchema,
  rotate: rotateParamsSchema,
  shake: shakeParamsSchema,
  bounce: bounceParamsSchema,
  'color-shift': colorShiftParamsSchema,
  skew: skewParamsSchema,
  glitch: glitchParamsSchema,
  set: setParamsSchema,
  motionpath: motionpathParamsSchema,
  morph: morphParamsSchema,
  sequence: sequenceParamsSchema,
  custom: customParamsSchema,
  chaos: chaosParamsSchema,
  'physics-spring': physicsSpringParamsSchema,
  'stagger-grid': staggerGridParamsSchema,
  'stagger-wave': staggerWaveParamsSchema,
  'stagger-radial': staggerRadialParamsSchema,
  'stagger-flash': staggerFlashParamsSchema,
  'tap-ripple': tapRippleParamsSchema,
  'text-reveal': textRevealParamsSchema,
  'text-scramble': textScrambleParamsSchema,
  'text-decode': textDecodeParamsSchema,
  'text-glitch': textGlitchParamsSchema,
  'text-typewriter': textTypewriterParamsSchema,
  'boot-sequence': bootSequenceParamsSchema,
  'sensor-sweep': sensorSweepParamsSchema,
  'timeline-cascade': timelineCascadeParamsSchema,
  'timeline-attention': timelineAttentionParamsSchema
};

/**
 * Wraps a single field schema so it also accepts a `map_range` descriptor
 * (`{ map_range: { entity, input, output, clamp } }`) in place of a plain
 * value — RulesEngine's `apply.animations[].params` resolves these via
 * `resolveAnimCommandParams()` before a preset factory ever sees them, so a
 * leaf field like `chaosParamsSchema.properties.duration_min` (`type:
 * 'number'`) would otherwise reject a map_range object outright.
 * @private
 */
function _mapRangeAware(fieldSchema) {
  return {
    oneOf: [
      fieldSchema,
      {
        type: 'object',
        properties: { map_range: { type: 'object', additionalProperties: true, required: true } },
        additionalProperties: false
      }
    ]
  };
}

function _mapRangeAwareVariant(paramsSchema) {
  if (!paramsSchema || !paramsSchema.properties) return paramsSchema;
  const wrappedProperties = {};
  for (const [key, fieldSchema] of Object.entries(paramsSchema.properties)) {
    wrappedProperties[key] = _mapRangeAware(fieldSchema);
  }
  return { ...paramsSchema, properties: wrappedProperties };
}

/**
 * map_range-aware view of ANIMATION_PRESET_PARAMS_SCHEMAS, for RulesEngine's
 * `apply.animations[].params` (common-schemas.js's rulesSchema) — every leaf
 * field additionally accepts a map_range descriptor. Derived once from the
 * same canonical per-preset schemas above, so the two schemas can't drift
 * apart on preset/params shape the way animationSchema and rulesSchema
 * already had before this file existed.
 */
export const ANIMATION_PRESET_PARAMS_SCHEMAS_MAPRANGE_AWARE = Object.fromEntries(
  Object.entries(ANIMATION_PRESET_PARAMS_SCHEMAS).map(([name, schema]) => [name, _mapRangeAwareVariant(schema)])
);
