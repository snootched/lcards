/**
 * Background Animation Preset Params Schemas
 *
 * One schema per registered background-animation preset, describing the shape
 * of that preset's `config:` object — types, enums, bounds, defaults. Mirrors
 * the structure of src/core/packs/backgrounds/presets/index.js (each preset's
 * factory carries a one-line pointer comment back here) and follows the exact
 * pattern established by animation-preset-params-schemas.js.
 *
 * Every type/enum/bound below was confirmed against the real backing effect
 * class source (src/core/packs/backgrounds/effects/*.js and
 * src/core/packs/textures/effects/*.js), not guessed from the informal
 * `guide.params` prose metadata in presets/index.js — that metadata stays
 * untouched (it also feeds the in-app editor's own info-guide panel) and can
 * drift from this file; keep both in sync when adding/changing preset fields.
 *
 * @module cards/schemas/background-animation-params-schemas
 */

/**
 * Local copy of common-schemas.js's simpleColorSchema, extended with the
 * computed-color-expression forms (`alpha(...)`, `lighten(...)`, `darken(...)`)
 * that BackgroundAnimationRenderer._resolveConfigColors() resolves and which
 * several presets' real shipped defaults actually use (e.g. contour-field's
 * default `colors` array) — the animation system's copy doesn't need these.
 * Cannot import the original directly: common-schemas.js needs to import
 * BACKGROUND_ANIMATION_PARAMS_SCHEMAS_REACTIVE_AWARE from this file, which
 * would create a circular import.
 */
const simpleColorSchema = {
  type: 'string',
  pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--|alpha\\(|lighten\\(|darken\\()',
  description: 'Colour value (hex, rgb, theme token, CSS variable, or a computed alpha()/lighten()/darken() expression).',
  'x-ui-hints': { widget: 'lcards-color-picker' }
};

/**
 * Every preset has an identical `opacity` field — unlike the animation
 * system's canonical fields (duration/ease/etc.), whose meaning varies per
 * preset, this one is genuinely the same everywhere (confirmed: every effect
 * class clamps it 0-1 at draw time).
 */
const _opacitySchema = {
  type: 'number', minimum: 0, maximum: 1, default: 1,
  description: 'Overall effect opacity.',
  'x-ui-hints': { label: 'Opacity', selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } }
};

// ============================================================================
// GRID FAMILY (mirrors GridEffect.js — backs grid / grid-diagonal / grid-hexagonal)
// ============================================================================

export const gridParamsSchema = {
  type: 'object',
  description: 'Params for the "grid" preset — orthogonal scrolling grid with optional major/minor divisions.',
  properties: {
    line_spacing: {
      type: 'number', minimum: 1, default: 40,
      description: 'Pixel spacing between minor lines. Confirmed unclamped in code — 0 or unset-with-falsy hangs the tile loop (Infinity tiles), hence the minimum.',
      'x-ui-hints': { selector: { number: { min: 1, max: 200, step: 1, mode: 'slider' } } }
    },
    num_rows: { type: 'integer', minimum: 1, maximum: 100, description: 'Cell-based sizing alternative to line_spacing — exact row count.' },
    num_cols: { type: 'integer', minimum: 1, maximum: 100, description: 'Cell-based sizing alternative to line_spacing — exact column count.' },
    line_width_minor: { type: 'number', minimum: 0, default: 1, description: 'Minor line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    line_width_major: { type: 'number', minimum: 0, default: 2, description: 'Major (emphasised) line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    color: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.3)', description: 'Minor line color.' },
    color_major: { ...simpleColorSchema, description: 'Major line color — falls back to color if unset.' },
    major_row_interval: { type: 'integer', minimum: 0, default: 0, description: 'Draw a major line every N rows (0 = disabled).', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    major_col_interval: { type: 'integer', minimum: 0, default: 0, description: 'Draw a major line every N columns (0 = disabled).', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 20, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 20, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    pattern: {
      type: 'string', enum: ['both', 'horizontal', 'vertical', 'diagonal', 'hexagonal', 'dots'], default: 'both',
      description: 'Grid line pattern — all 6 values are fully working (GridEffect.js\'s _drawDotsPattern etc.), and all 6 are exposed in the editor\'s Pattern dropdown.'
    },
    dot_radius: { type: 'number', minimum: 0, default: 2, description: 'Dot radius in px — only used when pattern is "dots".', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    hex_radius: { type: 'number', minimum: 1, default: 40, description: 'Hexagon size in px — only used when pattern is "hexagonal". Unclamped in code — 0 collapses the hex tiling, hence the minimum.', 'x-ui-hints': { selector: { number: { min: 1, max: 150, step: 1, mode: 'slider' } } } },
    show_border_lines: { type: 'boolean', default: true, description: 'Draw lines at canvas edges.' },
    fill_color: { ...simpleColorSchema, default: 'transparent', description: 'Solid fill painted behind each cell.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const gridDiagonalParamsSchema = {
  type: 'object',
  description: 'Params for the "grid-diagonal" preset — 45° hatched variant of grid. Pattern is hardcoded to diagonal, not user-overridable.',
  properties: {
    line_spacing: { type: 'number', minimum: 1, default: 30, description: 'Pixel spacing between lines. Unclamped in code — 0 hangs the tile loop, hence the minimum.', 'x-ui-hints': { selector: { number: { min: 1, max: 200, step: 1, mode: 'slider' } } } },
    line_width: { type: 'number', minimum: 0, default: 1, description: 'Line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    color: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.25)', description: 'Line color.' },
    scroll_speed_x: { type: 'number', default: 15, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 15, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    fill_color: { ...simpleColorSchema, default: 'transparent', description: 'Solid fill painted behind each cell.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const gridHexagonalParamsSchema = {
  type: 'object',
  description: 'Params for the "grid-hexagonal" preset — honeycomb hex-grid variant of grid. Pattern is hardcoded to hexagonal, not user-overridable.',
  properties: {
    hex_radius: { type: 'number', minimum: 1, default: 40, description: 'Hexagon size in px. Unclamped in code — 0 hangs the tile loop (patternWidth=0), hence the minimum.', 'x-ui-hints': { selector: { number: { min: 1, max: 150, step: 1, mode: 'slider' } } } },
    line_width_minor: { type: 'number', minimum: 0, default: 1, description: 'Minor line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    line_width_major: { type: 'number', minimum: 0, default: 2, description: 'Major line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    color: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.3)', description: 'Minor line color.' },
    color_major: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.6)', description: 'Major line color.' },
    major_row_interval: { type: 'integer', minimum: 0, default: 3, description: 'Draw a major line every N rows.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    major_col_interval: { type: 'integer', minimum: 0, default: 3, description: 'Draw a major line every N columns.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 20, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 20, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    fill_color: { ...simpleColorSchema, default: 'transparent', description: 'Solid fill painted behind each cell.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

// ============================================================================
// STARFIELD / NEBULA / CONTOUR-FIELD (noise + particle presets)
// ============================================================================

export const starfieldParamsSchema = {
  type: 'object',
  description: 'Params for the "starfield" preset — scrolling parallax star field.',
  properties: {
    seed: { type: 'integer', description: 'Random seed — same seed always generates the same star layout. Random by default when unset.' },
    count: { type: 'integer', minimum: 0, default: 150, description: 'Number of stars.', 'x-ui-hints': { selector: { number: { min: 0, max: 500, step: 10, mode: 'slider' } } } },
    min_radius: { type: 'number', minimum: 0, default: 0.5, description: 'Smallest star radius in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    max_radius: { type: 'number', minimum: 0, default: 2, description: 'Largest star radius in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Dimmest star opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1.0, description: 'Brightest star opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    colors: {
      type: 'array', items: simpleColorSchema, default: ['#ffffff'],
      description: 'Star color(s) — also accepts a single color via the legacy `color` field.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    scroll_speed_x: { type: 'number', default: 30, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 0, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    parallax_layers: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Number of depth layers — more layers = more depth. Clamped in code to 1-5.', 'x-ui-hints': { selector: { number: { min: 1, max: 5, step: 1, mode: 'slider' } } } },
    depth_factor: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'Speed variation between layers. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const nebulaParamsSchema = {
  type: 'object',
  description: 'Params for the "nebula" preset — layered Perlin-noise cloud blobs.',
  properties: {
    seed: { type: 'integer', description: 'Random seed — same seed always generates the same cloud layout. Random by default when unset.' },
    cloud_count: { type: 'integer', minimum: 1, maximum: 10, default: 4, description: 'Number of cloud blobs. Clamped in code to 1-10.', 'x-ui-hints': { selector: { number: { min: 1, max: 10, step: 1, mode: 'slider' } } } },
    min_radius: { type: 'number', minimum: 0, maximum: 1, default: 0.15, description: 'Smallest cloud radius, as a fraction of canvas size. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    max_radius: { type: 'number', minimum: 0, maximum: 1, default: 0.4, description: 'Largest cloud radius, as a fraction of canvas size. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Dimmest cloud opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.8, description: 'Brightest cloud opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    colors: {
      type: 'array', items: simpleColorSchema, default: ['#FF00FF'],
      description: 'Cloud color(s) — also accepts a single color via the legacy `color` field.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    turbulence: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'How ragged/organic the cloud edges are. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    noise_scale: { type: 'number', minimum: 0.0001, default: 0.003, description: 'Noise detail — lower = larger, smoother features.', 'x-ui-hints': { selector: { number: { min: 0.0005, max: 0.02, step: 0.0005, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 5, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 5, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const contourFieldParamsSchema = {
  type: 'object',
  description: 'Params for the "contour-field" preset — topographic-style banded noise field. Defaults below are the REAL zero-config resolved values (verified against ContourFieldEffect.js/presets/index.js), not the sparser set previously shown in guide.params — the shipped default is a visible tinted fill with a 5-stop gradient, not transparent/single-color.',
  properties: {
    seed: { type: 'integer', description: 'Random seed — same seed + settings always generates the same field. Random by default when unset.' },
    noise_scale: { type: 'number', minimum: 0.0001, default: 0.005, description: 'Smaller = a few large drifting blobs; larger = many small, busy ripples.', 'x-ui-hints': { selector: { number: { min: 0.0005, max: 0.02, step: 0.0005, mode: 'slider' } } } },
    num_octaves: { type: 'integer', minimum: 1, maximum: 8, default: 2, description: 'Layers of fine detail — 1 = smooth blobs, 8 = rough, cloud-like fuzz. Clamped in code to 1-8.', 'x-ui-hints': { selector: { number: { min: 1, max: 8, step: 1, mode: 'slider' } } } },
    num_bands: { type: 'integer', minimum: 2, maximum: 64, default: 5, description: 'Low = bold stepped contour rings; high = a smooth, near-continuous gradient. Clamped in code to 2-64 — this floor is load-bearing (num_bands=1 divides by zero internally).', 'x-ui-hints': { selector: { number: { min: 2, max: 64, step: 1, mode: 'slider' } } } },
    cell_size: { type: 'integer', minimum: 1, maximum: 16, default: 1, description: 'Sample resolution — larger is blockier/cheaper, smaller is crisper/costlier. Clamped in code to 1-16.', 'x-ui-hints': { selector: { number: { min: 1, max: 16, step: 1, mode: 'slider' } } } },
    fill_level: { type: 'number', minimum: 0, maximum: 0.95, default: 0.45, description: '0 = no water, full terrain visible; raise it to flood the lowest rings. Clamped in code to 0-0.95.', 'x-ui-hints': { selector: { number: { min: 0, max: 0.95, step: 0.05, mode: 'slider' } } } },
    fill_color: { ...simpleColorSchema, default: 'rgba(19, 11, 129, 0.3)', description: 'Color painted over flooded rings. Real zero-config default resolves to this (the var()-token fallback\'s literal hex/alpha equivalent) — leave unset only if you actually want it, "leave empty for transparency" in older docs was misleading since fill_level defaults to a non-zero 0.45.' },
    blend_colors: { type: 'boolean', default: true, description: 'On = colors fade smoothly between rings; off = hard-cutoff flat rings.' },
    colors: {
      type: 'array', items: simpleColorSchema,
      default: ['alpha(#130b81, 0.08)', 'alpha(#130b81, 0.25)', 'alpha(#130b81, 0.42)', 'alpha(#130b81, 0.62)', 'alpha(#130b81, 0.80)'],
      description: 'One color, or several stops spread across the full contour range. Default shown here is the exact shipped default (5 alpha-graded stops of the same base hue).',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    scroll_speed_x: { type: 'number', default: -3, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -20, max: 20, step: 0.5, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 0.45, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -20, max: 20, step: 0.5, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

// ============================================================================
// CASCADE (mirrors CascadeEffect.js)
// ============================================================================

export const cascadeParamsSchema = {
  type: 'object',
  description: 'Params for the "cascade" preset — LCARS waterfall colour-cycling data grid. A single instance changes every matched cell in sync (mode: css\'s delay is one flat value) — the row-by-row "waterfall" look (including the niagara timing pattern) requires declaring multiple separate instances, one per row; see lcards-data-grid\'s animation.pattern option, which automates that.',
  properties: {
    num_rows: { type: 'integer', minimum: 1, description: 'Explicit row count. Unclamped in code — 0 or negative throws a RangeError, hence the minimum.' },
    num_cols: { type: 'integer', minimum: 1, description: 'Explicit column count. Unclamped in code — 0 or negative throws a RangeError, hence the minimum.' },
    format: {
      type: 'string', enum: ['digit', 'float', 'alpha', 'hex', 'mixed'], default: 'hex',
      description: 'Character set. Confirmed real enum from code — guide.params only vaguely said "hex digits" without enumerating the other 4.'
    },
    pattern: {
      type: 'string', enum: ['default', 'niagara', 'fast', 'custom'], default: 'default',
      description: '"default" = authentic LCARS rhythm, "niagara" = uniform waterfall, "fast", or "custom" (requires a hand-authored `timing` array, YAML only). Unrecognized values silently fall back to "default".'
    },
    speed_multiplier: { type: 'number', minimum: 0.1, default: 1.0, description: 'Overall cycling speed multiplier. Unclamped in code — 0 makes the cycle duration Infinity (frozen), hence the practical floor.', 'x-ui-hints': { selector: { number: { min: 0.1, max: 5, step: 0.1, mode: 'slider' } } } },
    colors: {
      type: 'object',
      description: 'The three-stop color cycle. Real runtime shape is a genuinely nested object (config.colors.start/text/end), not flattened keys.',
      properties: {
        start: { ...simpleColorSchema, default: '#93e1ff', description: 'Color a cell starts at. Shown here as the concrete hex equivalent of the real fallback (var(--lcards-blue-light, #93e1ff)).' },
        text: { ...simpleColorSchema, default: '#002241', description: 'Color a cell settles at mid-cycle. Concrete equivalent of var(--lcards-blue-darkest, #002241).' },
        end: { ...simpleColorSchema, default: '#dfe1e8', description: 'Color a cell ends at. Concrete equivalent of var(--lcards-moonlight, #dfe1e8).' }
      },
      additionalProperties: false,
      'x-ui-hints': { label: 'Colors' }
    },
    font_size: { type: 'number', minimum: 1, default: 10, description: 'Character font size in px. Unclamped — 0 combined with gap:0 throws a RangeError, hence the minimum.', 'x-ui-hints': { selector: { number: { min: 4, max: 40, step: 1, mode: 'slider' } } } },
    gap: { type: 'number', minimum: 0, default: 4, description: 'Spacing between cells in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    refresh_interval: { type: 'integer', minimum: 0, default: 0, description: 'How often cells re-randomize, in ms (0 = continuous).', 'x-ui-hints': { selector: { number: { min: 0, max: 5000, step: 100, mode: 'slider' } } } },
    duration: { type: 'integer', minimum: 1, description: 'Explicit cycle duration override in ms.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

// ============================================================================
// LEVEL (mirrors LevelTextureEffect.js)
// ============================================================================

export const levelParamsSchema = {
  type: 'object',
  description: 'Params for the "level" preset — animated tank/gauge fill bar.',
  properties: {
    color_a: { ...simpleColorSchema, default: 'rgba(0,200,100,0.7)', description: 'Primary fill color (or gradient start).' },
    color_b: { ...simpleColorSchema, description: 'Gradient end color — omit for a flat fill.' },
    gradient_crossover: { type: 'number', minimum: 0, maximum: 100, default: 80, description: 'Percent of fill height where the gradient crosses over. Clamped in code to 0-100.', 'x-ui-hints': { selector: { number: { min: 0, max: 100, step: 1, mode: 'slider' } } } },
    fill_pct: { type: 'number', minimum: 0, maximum: 100, default: 50, description: 'Fill level, 0-100. Clamped in code.', 'x-ui-hints': { selector: { number: { min: 0, max: 100, step: 1, mode: 'slider' } } } },
    direction: {
      type: 'string', enum: ['up', 'down', 'left', 'right'], default: 'up',
      description: 'Fill direction — all 4 values render correctly (\'down\'/\'left\' are implemented as a Canvas2D mirror of the \'up\'/\'right\' geometry).'
    },
    edge_glow: { type: 'boolean', default: true, description: 'Whether to draw a glow along the fill edge.' },
    edge_glow_color: { ...simpleColorSchema, default: 'rgba(255,255,255,0.7)', description: 'Edge glow color.' },
    edge_glow_width: { type: 'number', minimum: 0, default: 6, description: 'Edge glow width in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    wave_height: { type: 'number', minimum: 0, default: 4, description: 'Primary wave amplitude in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    wave_speed: { type: 'number', default: 20, description: 'Primary wave speed.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    wave_count: { type: 'integer', minimum: 1, default: 4, description: 'Primary wave count across the width. Not rounded in code if fractional — a non-integer produces a visible seam at the wrap edge, hence typed integer here.', 'x-ui-hints': { selector: { number: { min: 1, max: 20, step: 1, mode: 'slider' } } } },
    wave2_height: { type: 'number', minimum: 0, default: 0, description: 'Secondary wave amplitude in px (0 = disabled).', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    wave2_count: { type: 'integer', minimum: 1, default: 5, description: 'Secondary wave count. Same integer-only reasoning as wave_count.', 'x-ui-hints': { selector: { number: { min: 1, max: 20, step: 1, mode: 'slider' } } } },
    wave2_speed: { type: 'number', default: -15, description: 'Secondary wave speed.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    slosh_amount: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'Sloshing displacement amount (0 = disabled). Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    slosh_period: { type: 'number', minimum: 0.5, default: 3, description: 'Sloshing cycle period in seconds. Code enforces an effective 0.5 floor (Math.max(0.5, ...)).', 'x-ui-hints': { selector: { number: { min: 0.5, max: 10, step: 0.5, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

// ============================================================================
// TEXTURE-FAMILY PRESETS (fluid/plasma/flow/shimmer/scanlines — shared classes
// with the shape_texture system, mirrors src/core/packs/textures/effects/*.js)
// ============================================================================

export const fluidParamsSchema = {
  type: 'object',
  description: 'Params for the "fluid" preset — swirling single-colour noise wash.',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(100,180,255,0.8)', description: 'Wash color.' },
    base_frequency: { type: 'number', minimum: 0.0001, default: 0.010, description: 'Noise detail — lower = larger features.', 'x-ui-hints': { selector: { number: { min: 0.001, max: 0.05, step: 0.001, mode: 'slider' } } } },
    num_octaves: { type: 'integer', minimum: 1, maximum: 8, default: 4, description: 'Layers of noise detail — perf cost scales with this, practical max ~8.', 'x-ui-hints': { selector: { number: { min: 1, max: 8, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 7, description: 'Horizontal drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 10, description: 'Vertical drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const plasmaParamsSchema = {
  type: 'object',
  description: 'Params for the "plasma" preset — two-colour plasma noise bands.',
  properties: {
    color_a: { ...simpleColorSchema, default: 'rgba(80,0,255,0.9)', description: 'First plasma color.' },
    color_b: { ...simpleColorSchema, default: 'rgba(255,40,120,0.9)', description: 'Second plasma color.' },
    base_frequency: { type: 'number', minimum: 0.0001, default: 0.012, description: 'Noise detail — lower = larger features.', 'x-ui-hints': { selector: { number: { min: 0.001, max: 0.05, step: 0.001, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 8, description: 'Horizontal drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 5, description: 'Vertical drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const flowParamsSchema = {
  type: 'object',
  description: 'Params for the "flow" preset — directional streaming noise streaks.',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(0,200,255,0.7)', description: 'Streak color.' },
    base_frequency: { type: 'number', minimum: 0.0001, default: 0.012, description: 'Noise detail — lower = larger features.', 'x-ui-hints': { selector: { number: { min: 0.001, max: 0.05, step: 0.001, mode: 'slider' } } } },
    wave_scale: { type: 'number', minimum: 0, default: 8, description: 'Streak waviness.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 50, description: 'Horizontal stream speed.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 0, description: 'Vertical stream speed.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const shimmerParamsSchema = {
  type: 'object',
  description: 'Params for the "shimmer" preset — sweeping highlight band.',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(255,255,255,0.55)', description: 'Highlight color.' },
    highlight_width: { type: 'number', minimum: 0, default: 0.35, description: 'Band width as a fraction of canvas size.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    speed: { type: 'number', default: 2.5, description: 'Sweep speed.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    angle: { type: 'number', minimum: 0, maximum: 360, default: 30, description: 'Sweep angle in degrees. Unbounded in code (raw sin/cos of the angle) but periodic, so 0-360 is the sensible UI range.', 'x-ui-hints': { selector: { number: { min: 0, max: 360, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const scanlinesParamsSchema = {
  type: 'object',
  description: 'Params for the "scanlines" preset — static CRT-style scanline overlay.',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(0,0,0,0.25)', description: 'Scanline color.' },
    line_spacing: { type: 'number', minimum: 1, default: 4, description: 'Pixel spacing between lines.', 'x-ui-hints': { selector: { number: { min: 1, max: 30, step: 1, mode: 'slider' } } } },
    line_width: { type: 'number', minimum: 0, default: 1.5, description: 'Line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    direction: { type: 'string', enum: ['horizontal', 'vertical'], default: 'horizontal', description: 'Both values confirmed correctly implemented in code.' },
    scroll_speed_x: { type: 'number', default: 0, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 0, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

// ============================================================================
// IMAGE / SOLID
// ============================================================================

export const imageParamsSchema = {
  type: 'object',
  description: 'Params for the "image" preset — user-supplied image rendered behind the full card area. Field is `source` (not `url` — a page of docs previously used `url` throughout, which never worked; fixed).',
  properties: {
    source: { type: 'string', default: '', description: '/local/ path, https:// URL, builtin:<key> reference, media-source://… content ID, or a template string (e.g. entity_picture).' },
    size: {
      oneOf: [
        { type: 'string', enum: ['cover', 'contain', 'fill'] },
        { type: 'string', pattern: '^\\d+px$' }
      ],
      default: 'cover',
      description: '"cover"/"contain"/"fill", or an explicit "<n>px" size for the shorter axis. Any other string silently falls back to "cover".'
    },
    position: { type: 'string', default: 'center', description: 'CSS background-position string. Not enum-validated in code — free-form.' },
    repeat: { type: 'boolean', default: false, description: 'Tile the image instead of scaling it.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const solidParamsSchema = {
  type: 'object',
  description: 'Params for the "solid" preset — flat single-colour fill, the cheapest background preset (no procedural noise).',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(0, 0, 0, 0.4)', description: 'Fill color — the alpha channel controls how much shows through base_svg.' },
    opacity: { ..._opacitySchema, description: 'Multiplies with any alpha already present in color.' }
  },
  additionalProperties: 'warn'
};

/**
 * Name → schema map, keyed by the exact string passed as `preset:` in a
 * background_animation effect entry.
 */
export const BACKGROUND_ANIMATION_PARAMS_SCHEMAS = {
  grid: gridParamsSchema,
  'grid-diagonal': gridDiagonalParamsSchema,
  'grid-hexagonal': gridHexagonalParamsSchema,
  starfield: starfieldParamsSchema,
  nebula: nebulaParamsSchema,
  'contour-field': contourFieldParamsSchema,
  cascade: cascadeParamsSchema,
  level: levelParamsSchema,
  fluid: fluidParamsSchema,
  plasma: plasmaParamsSchema,
  flow: flowParamsSchema,
  shimmer: shimmerParamsSchema,
  scanlines: scanlinesParamsSchema,
  image: imageParamsSchema,
  solid: solidParamsSchema
};

/**
 * Wraps a single field schema so it also accepts a raw template string
 * (`"[[[...]]]"` / `"{{...}}"`), a `{ template: '...', default: X }` object,
 * or a `{ map_range: {...} }` descriptor, in place of a plain value.
 * BackgroundAnimationRenderer.updateHash() resolves all three forms
 * generically for ANY config field (confirmed in
 * src/core/packs/backgrounds/BackgroundAnimationRenderer.js) — a broader
 * reactive-value contract than the animation system's `_mapRangeAware()`
 * (map_range only; confirmed the animation pipeline never evaluates
 * arbitrary template strings in `params`, so that narrower helper is correct
 * for its own system and not reused here).
 * @private
 */
function _reactiveAware(fieldSchema) {
  return {
    oneOf: [
      fieldSchema,
      { type: 'string', description: 'Template string, evaluated on every HASS update.' },
      {
        type: 'object',
        properties: {
          template: { type: 'string', required: true },
          default: {}
        },
        additionalProperties: false
      },
      {
        type: 'object',
        properties: { map_range: { type: 'object', additionalProperties: true, required: true } },
        additionalProperties: false
      }
    ]
  };
}

function _reactiveAwareVariant(paramsSchema) {
  if (!paramsSchema || !paramsSchema.properties) return paramsSchema;
  const wrappedProperties = {};
  for (const [key, fieldSchema] of Object.entries(paramsSchema.properties)) {
    wrappedProperties[key] = _reactiveAware(fieldSchema);
  }
  return { ...paramsSchema, properties: wrappedProperties };
}

/**
 * Reactive-value-aware view of BACKGROUND_ANIMATION_PARAMS_SCHEMAS, for
 * common-schemas.js's backgroundAnimationEffectSchema.config discriminatedBy.
 * Derived once from the same canonical per-preset schemas above, so the two
 * views can't drift apart on preset/param shape.
 */
export const BACKGROUND_ANIMATION_PARAMS_SCHEMAS_REACTIVE_AWARE = Object.fromEntries(
  Object.entries(BACKGROUND_ANIMATION_PARAMS_SCHEMAS).map(([name, schema]) => [name, _reactiveAwareVariant(schema)])
);
