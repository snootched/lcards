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

/**
 * Local copy of common-schemas.js's simpleColorSchema — cannot import it
 * directly: common-schemas.js needs to import ANIMATION_PRESET_PARAMS_SCHEMAS
 * from this file (for animationSchema's discriminatedBy), which would create
 * a circular import. Keep this pattern in sync with simpleColorSchema if that
 * one changes.
 */
const simpleColorSchema = {
  type: 'string',
  pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|match-light|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
  description: 'Colour value (hex, rgb, theme token, or CSS variable)',
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
const _CANONICAL_REDECLARED = {
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
  description: 'Params for the "pulse" preset — breathing scale/brightness effect.',
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
  description: 'Params for the "fade" preset — simple opacity transition.',
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
  description: 'Params for the "draw" preset — SVG stroke reveal via anime.js createDrawable.',
  properties: {
    ..._CANONICAL_REDECLARED,
    reverse: {
      type: 'boolean', default: false,
      description: 'If true, draws from end to start. Only affects the default `draw` value — ignored if `draw` is explicitly supplied.'
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
  description: 'Params for the "march" preset — CSS-based marching dashed line (bypasses anime.js).',
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
    speed: { type: 'number', minimum: 0, description: 'Seconds per cycle. Takes precedence over `duration` if present.', 'x-ui-hints': { label: 'Speed (sec/cycle — lower = faster)' } },
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
    duration: { ..._CANONICAL_REDECLARED.duration, default: 100, description: 'Unusually short vs. most presets — strobe is fast by design.' },
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0 }
  },
  additionalProperties: 'warn'
};

export const flickerParamsSchema = {
  type: 'object',
  description: 'Params for the "flicker" preset. Randomized keyframes are generated once at setup time (not re-randomized per loop cycle). `alternate` has no effect.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3 }
  },
  additionalProperties: 'warn'
};

export const cascadeParamsSchema = {
  type: 'object',
  description: 'Params for the "cascade" preset — staggered fade/property tween across multiple targets.',
  properties: {
    ..._CANONICAL_REDECLARED,
    loop: { ..._CANONICAL_REDECLARED.loop, default: false },
    stagger: { type: 'number', minimum: 0, default: 100, description: 'Per-element delay (ms). NOT the canonical `delay` field, which is unused here.' },
    property: { type: 'string', default: 'opacity', description: 'Arbitrary anime/CSS property name — unvalidated passthrough.' },
    from: { type: 'number', default: 0 },
    to: { type: 'number', default: 1 }
  },
  additionalProperties: 'warn'
};

export const cascadeColorParamsSchema = {
  type: 'object',
  description: 'Params for the "cascade-color" preset — staggered color cascade across a grid/row of targets. NOTE: the default `property` ("color") is correct for its primary intended use (data-grid cells, plain HTML/CSS-rendered) but won\'t visibly work on an SVG-shape target (LCARdS\'s own button/elbow/slider/MSD cards) — set `property` to `fill` or `stroke` for those.',
  properties: {
    ..._CANONICAL_REDECLARED,
    colors: {
      type: 'array', minItems: 3, items: { ...simpleColorSchema },
      description: 'Only indices [0],[1],[2] are used; defaults to 3 theme tokens if omitted.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    property: { type: 'string', default: 'color', description: "Passthrough key used inside keyframe objects. 'fill'/'stroke' for SVG shapes, 'color'/'background-color' only for plain HTML/CSS-rendered targets." },
    mode: {
      type: 'string', enum: ['css', 'animejs'],
      description: "Both modes actually run through anime.js — despite the naming, this isn't a CSS-vs-anime.js engine choice. 'animejs' mode adds per-cell stagger (interactive/stagger_from/axis) on top of the base cascade; 'css' mode is the plain synchronized version. Auto-computed from interactive/stagger_from/axis when unset, and force-upgraded to 'animejs' whenever any of those are set even if `mode` was also set explicitly — those fields have no effect at all in 'css' mode, so silently ignoring them would be more surprising than the override."
    },
    interactive: { type: 'boolean', default: false, description: "Only wired up (mouseenter/mouseleave pause/play) when mode==='animejs'." },
    stagger_from: { type: 'string', enum: ['first', 'last', 'center', 'random'], description: 'Not validated in code today — documented values only.' },
    stagger_delay: { type: 'number', minimum: 0, default: 100, description: 'Only relevant in animejs mode.' },
    axis: { type: 'string', enum: ['row', 'column'], default: 'row', description: 'Not validated in code today — documented values only.' },
    delay: { type: 'number', minimum: 0, default: 0, description: 'Row-level start delay — a legitimate use of the canonical start-offset meaning (unlike the stagger-* presets).' }
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
  description: 'Params for the "scale-reset" preset. `loop`/`alternate` are hardcoded false in code today and have no effect even if set — see Phase 13.6.',
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
      description: "Falls back to `direction`. Actual code default is 'right' (doc previously said 'up' — corrected here, see Phase 13.6)."
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
  description: 'Params for the "shake" preset. `alternate` has no effect — keyframes always return to 0 regardless.',
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
  description: 'Params for the "color-shift" preset. NOTE: the default `property` ("color") only visibly works on plain HTML/CSS-rendered targets — LCARdS\'s own cards (button/elbow/slider/MSD) draw their shapes as SVG paths, which don\'t respond to the CSS `color` property at all. Set `property` to `fill` or `stroke` when targeting an SVG shape.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color_from: { ...simpleColorSchema, description: 'Required — omitting either color_from or color_to makes the preset a no-op with a warning.' },
    color_to: { ...simpleColorSchema, description: 'Required, see color_from.' },
    property: { type: 'string', default: 'color', description: "'fill'/'stroke' for SVG shapes (LCARdS's own cards), 'color'/'background-color' only for plain HTML/CSS-rendered targets." }
  },
  additionalProperties: 'warn'
};

export const skewParamsSchema = {
  type: 'object',
  description: 'Params for the "skew" preset. Presence of EITHER from_skewX or from_skewY switches skewX/skewY into "to" targets instead of direct targets from 0 — a genuine conditional shape (kept as hardcoded editor UI, not schema-driven form, per Phase 13.5).',
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
  description: "Params for the \"glitch\" preset. `ease` is hardcoded to 'linear' — ignored. `alternate` has no effect.",
  properties: {
    ..._CANONICAL_REDECLARED,
    intensity: { type: 'number', minimum: 0, default: 5, description: 'Max px displacement, symmetric around 0.' },
    frequency: { type: 'number', minimum: 1, default: 10, description: 'Number of random keyframes generated.' }
  },
  additionalProperties: 'warn'
};

export const setParamsSchema = {
  type: 'object',
  description: 'Params for the "set" preset — direct property assignment (duration/ease/loop/alternate/delay are all ignored; duration is hardcoded 0).',
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
  description: 'Params for the "motionpath" preset — animates an element (or, with `shape` set, a self-created tracer shape) along an SVG path.',
  properties: {
    ..._CANONICAL_REDECLARED,
    path: { type: 'string', description: 'Required. CSS selector (#id or .class) for the motion-path SVG element.' },
    rotate: { type: 'boolean', default: true, description: 'Auto-rotate along path (different meaning from the top-level "rotate" preset\'s numeric from/to). A sibling of `shape` below, not a field inside it — controls the motion itself, applies whether or not `shape` is set.' },
    anchor: { type: 'string', default: '50% 50%', description: 'CSS transform-origin syntax, unvalidated. A sibling of `shape` below, not a field inside it.' },
    shape: {
      type: 'object',
      description: 'Opt-in: motionpath creates and animates its own shape (a "tracer") instead of moving target/targets — e.g. a traveling dot suggesting energy flow along a line. Mutually exclusive with target/targets (shape wins, with a console warning, if both are set). Field names deliberately mirror line markers\' (marker_start/marker_end) styling options. Appearance only — `rotate`/`anchor` (motion behavior) are separate, sibling `params` fields, not part of this object.',
      properties: {
        type: { type: 'string', enum: ['circle', 'rect', 'diamond'], default: 'circle' },
        size: { type: 'number', minimum: 1, default: 10, description: 'Diameter (circle/diamond) or width/height fallback (rect) in px.' },
        width: { type: 'number', minimum: 1, description: 'rect only — overrides size for width.' },
        height: { type: 'number', minimum: 1, description: 'rect only — overrides size for height.' },
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

export const sequenceParamsSchema = {
  type: 'object',
  description: "Params for the \"sequence\" preset — timeline of steps. Each step may set its own duration/ease (falling back to this preset's own duration/ease as per-step defaults). Step positioning uses `offset`; the preset factory also accepts the older `at` name as a fallback (translated to `offset` internally) — `offset` wins if a step sets both.",
  properties: {
    duration: { type: 'number', minimum: 0, maximum: 10000, default: 2000, description: 'Fallback duration for steps missing their own duration.' },
    ease: { type: ['string', 'object'], description: "Fallback easing for steps missing their own ease. Default 'outQuad'." },
    loop: { ..._CANONICAL_REDECLARED.loop, default: false },
    steps: {
      type: 'array', minItems: 1,
      items: {
        type: 'object',
        additionalProperties: true,
        description: 'Arbitrary anime.js tween properties at the top level, plus optional duration/ease/offset (or legacy at) overrides.'
      },
      description: 'Required, at least one step.',
      'x-ui-hints': { widget: 'json', label: 'Steps' }
    }
  },
  additionalProperties: 'warn'
};

export const chaosParamsSchema = {
  type: 'object',
  description: 'Params for the "chaos" preset — randomized multi-property glitch motion. Does not use the top-level `duration` field at all.',
  properties: {
    ..._CANONICAL_REDECLARED,
    loop: { ..._CANONICAL_REDECLARED.loop, default: true },
    properties: {
      type: 'array',
      items: { type: 'string' },
      default: ['x', 'y', 'rotate'],
      description: "'x'/'y' tokens are remapped to translateX/translateY; other tokens (e.g. 'rotate','opacity') used verbatim as the anime property name. Not validated as an array in code today — a non-array truthy value will throw.",
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
    composition: { type: 'string', enum: ['blend', 'replace'], default: 'blend', description: 'Not validated in code today — documented values only.' }
  },
  additionalProperties: 'warn'
};

export const physicsSpringParamsSchema = {
  type: 'object',
  description: 'Params for the "physics-spring" preset. `ease`, `duration`, and `alternate` (canonical) are entirely bypassed — spring dynamics determine the effective duration internally. `loop`, however, genuinely is read and respected. Has its own parallel spring-config system separate from the generic `ease: {type:"spring", params:{...}}` path — see Phase 13.6.',
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
  description: 'Params for the "stagger-grid" preset — stagger across a [cols, rows] grid of targets.',
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
      description: 'Validated in code — warns and no-ops if provided with the wrong shape.',
      'x-ui-hints': { widget: 'json', label: 'Grid [cols, rows]' }
    },
    from: {
      oneOf: [
        { type: 'string', enum: ['start', 'end', 'center', 'edges'] },
        { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' } }
      ],
      default: 'start',
      description: 'Not validated in code today.',
      // A oneOf with an array branch hits a known, separately-tracked bug in
      // FormField's oneOf/choose handling (_prepareValueForSelector has no
      // Array.isArray branch, so an array value always resets to the first
      // choice) — bypass via the code editor rather than ship a broken toggle.
      'x-ui-hints': { widget: 'json', label: 'From' }
    },
    property: { type: 'string', default: 'scale' },
    from_value: { type: 'number', default: 0.8 },
    to_value: { type: 'number', default: 1 }
  },
  additionalProperties: 'warn'
};

export const staggerWaveParamsSchema = {
  type: 'object',
  description: "Params for the \"stagger-wave\" preset — wave effect across a linear sequence of targets. Actual code default for `alternate` is false (doc previously said true — corrected here, see Phase 13.6).",
  properties: {
    ..._CANONICAL_REDECLARED,
    alternate: { ..._CANONICAL_REDECLARED.alternate, default: false },
    delay: {
      ..._CANONICAL_REDECLARED.delay, default: 100,
      description: 'Repurposed as per-element stagger step (ms), NOT the canonical single start-offset.'
    },
    direction: {
      type: 'string', enum: ['normal', 'reverse'], default: 'normal',
      description: "Any value other than 'reverse' collapses to 'normal' in code."
    },
    property: { type: 'string', default: 'translateY' },
    amplitude: { type: 'number', default: -20, description: 'Used in a 3-point path [0, amplitude, 0].' }
  },
  additionalProperties: 'warn'
};

export const staggerRadialParamsSchema = {
  type: 'object',
  description: 'Params for the "stagger-radial" preset — stagger radiating from a point. `alternate` is not read at all by this preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    delay: {
      ..._CANONICAL_REDECLARED.delay, default: 50,
      description: 'Repurposed as per-element stagger step (ms), NOT the canonical single start-offset.'
    },
    from: {
      oneOf: [
        { type: 'string', enum: ['center'] },
        { type: 'array', minItems: 2, maxItems: 2, items: { type: 'number' } }
      ],
      default: 'center',
      description: "'center' or an [x,y] pixel position. Unvalidated.",
      // See stagger-grid.from's comment — same known oneOf/array selector bug.
      'x-ui-hints': { widget: 'json', label: 'From' }
    },
    property: { type: 'string', default: 'scale' },
    from_value: { type: 'number', default: 0 },
    to_value: { type: 'number', default: 1 }
  },
  additionalProperties: 'warn'
};

export const staggerFlashParamsSchema = {
  type: 'object',
  description: 'Params for the "stagger-flash" preset — WAAPI-driven flash sweep, bypassing anime.js entirely for the real visual effect.',
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
    property: { type: 'string', default: 'stroke', description: 'Used as a Web Animations API keyframe property name — must be WAAPI-animatable.' },
    with_opacity: { type: 'boolean', default: true },
    trail_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.25 },
    loop: { type: 'boolean', default: true, description: 'Maps to WAAPI iterations: Infinity vs 1 — not the generic anime.js loop mechanism.' }
  },
  additionalProperties: 'warn'
};

// ============================================================================
// TEXT PRESETS (mirrors src/core/packs/animations/presets/text-presets.js)
// ============================================================================

export const textRevealParamsSchema = {
  type: 'object',
  description: 'Params for the "text-reveal" preset — character/word/line reveal.',
  properties: {
    ..._CANONICAL_REDECLARED,
    split: { type: 'string', enum: ['chars', 'words', 'lines'], default: 'chars', description: 'Not a strict whitelist in code — anything not exactly "lines"/"words" falls back to chars.' },
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

export const textScrambleParamsSchema = {
  type: 'object',
  description: 'Params for the "text-scramble" preset — self-managed per-character scramble, bypassing the normal preset-level anime dispatch. `ease`/`alternate` (canonical) are accepted but ignored.',
  properties: {
    duration: { type: 'number', minimum: 0, default: 800, description: 'ms each character spends scrambling before settling.' },
    stagger: { type: 'number', minimum: 0, default: 40, description: 'ms between each character starting.' },
    delay: { type: 'number', minimum: 0, default: 0, description: 'A legitimate use of the canonical meaning: ms before the first character begins.' },
    loop: { type: 'boolean', default: false },
    settle_at: { type: 'number', minimum: 0, maximum: 1, default: 0.85, description: 'Fraction of duration. Not clamped in code today — values outside 0-1 produce nonsensical results.' },
    characters: { type: 'string', default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*', description: 'Character pool. An empty string is an unguarded edge case in code today.' }
  },
  additionalProperties: 'warn'
};

export const textGlitchParamsSchema = {
  type: 'object',
  description: "Params for the \"text-glitch\" preset. `ease` (canonical) is hardcoded to 'inOutQuad' — ignored.",
  properties: {
    intensity: { type: 'number', minimum: 0, default: 5, description: 'Max px/SVG-unit displacement.' },
    duration: { type: 'number', minimum: 0, default: 300, description: 'ms per glitch cycle.' },
    stagger: { type: 'number', minimum: 0, default: 50, description: 'ms offset between characters. Canonical `delay` is unused here.' },
    color_shift: { type: 'boolean', default: false, description: 'HTML target path only — silently ignored for SVG elements.' },
    loop: { type: 'boolean', default: false }
  },
  additionalProperties: 'warn'
};

export const textTypewriterParamsSchema = {
  type: 'object',
  description: "Params for the \"text-typewriter\" preset. `duration` (canonical) is hardcoded to 1 — ignored. `ease` hardcoded 'linear'. `alternate`/`delay` (canonical) never read.",
  properties: {
    speed: { type: 'number', minimum: 0, default: 100, description: 'ms per character.' },
    loop: { type: 'boolean', default: false }
  },
  additionalProperties: 'warn'
};

// ============================================================================
// TIMELINE PRESETS (mirrors src/core/packs/animations/presets/timeline-presets.js)
// ============================================================================

export const timelineCascadeParamsSchema = {
  type: 'object',
  description: 'Params for the "timeline-cascade" preset — multi-step timeline. Timing/easing for each step lives in that step\'s own config; the top-level canonical `duration`/`ease` are genuinely inert (confirmed against anime.js\'s own source: Timeline recomputes its own duration from its children regardless, and `ease` isn\'t read by the underlying Timer class at all — only a separate `playbackEase` is). `loop`/`alternate`/`delay`, however, do still apply — they govern the whole timeline\'s repeat/reverse/start-delay behavior, since Timeline extends Timer and inherits those from the same top-level params.',
  properties: {
    loop: { type: 'boolean', default: false },
    steps: {
      type: 'array', minItems: 1,
      items: {
        type: 'object',
        properties: {
          targets: { type: 'string', description: 'CSS selector. Falls back to the element being animated if absent.' },
          params: { type: 'object', additionalProperties: true, description: 'Arbitrary anime.js props, e.g. scale/opacity.' },
          duration: { type: 'number', minimum: 0 },
          offset: {
            oneOf: [{ type: 'number' }, { type: 'string' }],
            description: "'+=' relative, '<' overlap-with-previous, or an absolute ms number."
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
  description: 'Params for the "timeline-attention" preset — 3-phase scale/shake/settle sequence. The top-level canonical `duration`/`ease` are genuinely inert (durations are hardcoded to the duration_* fields below, and each phase\'s easing is hardcoded in source with no override — confirmed via anime.js\'s own source that Timeline discards a top-level duration and never reads `ease` at all). Of the remaining canonical fields, only `loop` is actually forwarded by the preset factory (repeats the whole 3-phase sequence) — `alternate`/`delay` are never read by this preset\'s code despite being generically available on the Timeline class, so they were deliberately left out of this schema.',
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
  sequence: sequenceParamsSchema,
  chaos: chaosParamsSchema,
  'physics-spring': physicsSpringParamsSchema,
  'stagger-grid': staggerGridParamsSchema,
  'stagger-wave': staggerWaveParamsSchema,
  'stagger-radial': staggerRadialParamsSchema,
  'stagger-flash': staggerFlashParamsSchema,
  'text-reveal': textRevealParamsSchema,
  'text-scramble': textScrambleParamsSchema,
  'text-glitch': textGlitchParamsSchema,
  'text-typewriter': textTypewriterParamsSchema,
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
