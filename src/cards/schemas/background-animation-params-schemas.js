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

import { COLOR_VALUE_PATTERN } from '../../core/themes/color-syntax.js';

/**
 * Local copy of common-schemas.js's simpleColorSchema: it cannot be imported
 * from there, because common-schemas.js imports
 * BACKGROUND_ANIMATION_PARAMS_SCHEMAS_REACTIVE_AWARE from this file. The
 * pattern is shared via core/themes/color-syntax.js and covers the alpha()/lighten()/
 * darken() forms that several presets' shipped defaults use (e.g.
 * contour-field's default `colors` array).
 */
const simpleColorSchema = {
  type: 'string',
  pattern: COLOR_VALUE_PATTERN,
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

/**
 * Time multiplier every background effect honours (BaseEffect.speed). The
 * shimmer preset declares its own `speed` (its sweep speed) instead.
 * @private
 */
const _speedSchema = {
  type: 'number',
  minimum: 0,
  default: 1,
  description: 'Time multiplier for the whole effect: 2 runs it twice as fast, 0 freezes it. A zoom wrapper cycles faster too. Animatable (target: background).',
  'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } }
};

// ============================================================================
// GRID FAMILY (mirrors GridEffect.js — backs grid / grid-diagonal / grid-hexagonal)
// ============================================================================

/** View, camera, scan and surface keys every grid preset takes (WebGL) */
const gridViewProperties = {
    view: { type: 'string', enum: ['flat', 'floor'], default: 'flat', description: 'flat: the grid face-on. floor: a perspective floor streaming toward the viewer, fading to a horizon. Drawn with WebGL; without it (or with renderer: canvas) the flat grid is drawn.', enumDescriptions: { flat: 'Face-on grid', floor: 'Perspective floor to a horizon' } },
    camera_tilt: { type: 'number', minimum: 0, maximum: 90, description: 'How far the camera looks down, in degrees: 90 is straight down (the flat view), low values look along a floor toward the horizon. Default 90 in flat view, 10 in floor view. On a curved surface: the height above its equator seen from outside (default 15, 35 on a well), the pitch above horizontal from inside (default 0); the plane takes at least 1. WebGL only. Animatable: animate from 90 to 10 to tip a flat grid into a floor.', 'x-ui-hints': { selector: { number: { min: 0, max: 90, step: 1, mode: 'slider' } } } },
    camera_yaw: { type: 'number', default: 0, description: 'Turns the camera around the grid, in degrees. WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: -180, max: 180, step: 1, mode: 'slider' } } } },
    camera_roll: { type: 'number', default: 0, description: 'Turns the camera round its line of sight, in degrees (positive: the picture turns clockwise), after camera_tilt and camera_yaw: with them the camera can look from any direction. WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: -180, max: 180, step: 1, mode: 'slider' } } } },
    camera_distance: { type: 'number', minimum: 0.05, default: 1, description: 'Zoom: at 1, line_spacing is true px at the middle of the card; 2 is twice as far (the grid looks half the size). WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: 0.2, max: 5, step: 0.05, mode: 'slider' } } } },
    fov: { type: 'number', minimum: 5, maximum: 150, default: 60, description: 'Camera field of view in degrees: wider exaggerates the floor perspective (the flat view looks the same at any value). WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: 20, max: 120, step: 1, mode: 'slider' } } } },
    scan_period: { type: 'number', minimum: 0, description: 'Seconds per scan line sweep, from the far side of the grid to the near side, including a short rest; 0 turns it off. Default 0 in flat view, 7 in floor view. WebGL only.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 0.5, mode: 'slider' } } } },
    scan_color: { ...simpleColorSchema, default: 'var(--lcards-moonlight)', description: 'Scan line color. The default follows the alert palette. WebGL only. Animatable.' },
    surface: { type: 'string', enum: ['plane', 'cylinder', 'dome', 'sphere', 'well'], default: 'plane', description: 'What the grid is drawn on. plane: the flat grid or floor (view). cylinder, dome (a half sphere), sphere and well (a funnel of any profile: well_shape, well_profile): a wireframe surface for astrometrics displays, spun by the scroll speed that runs round it. On a dome or sphere the diagonal and hexagonal patterns draw rows and columns. Tile seams (show_border_lines) belong to the plane. Drawn with WebGL; without it (or with renderer: canvas) the flat grid is drawn.', enumDescriptions: { plane: 'Flat grid or floor', cylinder: 'Cylinder wireframe', dome: 'Half sphere', sphere: 'Full sphere', well: 'Funnel (gravity well)' } },
    surface_size: { type: 'number', minimum: 0.05, maximum: 4, default: 0.8, description: "Diameter of a curved surface, as a fraction of the card's shorter side. line_spacing is true px at the front of the surface. WebGL only. Animatable.", 'x-ui-hints': { selector: { number: { min: 0.1, max: 2, step: 0.05, mode: 'slider' } } } },
    surface_length: { type: 'number', minimum: 0, default: 1, description: "Length of a cylinder along its axis, or the depth of a well (rim to throat), as a fraction of the card's size that way (height when vertical, width when horizontal); 0 runs a cylinder off the card and into the distance (a well keeps at least 0.1). WebGL only. Animatable.", 'x-ui-hints': { selector: { number: { min: 0, max: 4, step: 0.05, mode: 'slider' } } } },
    well_shape: { type: 'string', enum: ['trumpet', 'cone', 'bowl', 'wormhole'], default: 'trumpet', description: 'Profile of a well from its rim down to its throat. trumpet: the gravity well, nearly flat at the rim and plunging to the throat. cone: straight sides. bowl: rounded toward the bottom. wormhole: two trumpets throat to throat (an hourglass, the throat halfway down). well_profile replaces it. WebGL only.', enumDescriptions: { trumpet: 'Gravity well: flat rim, plunging throat', cone: 'Straight sides', bowl: 'Rounded bottom', wormhole: 'Hourglass: two trumpets throat to throat' } },
    well_throat: { type: 'number', minimum: 0.02, maximum: 1, default: 0.15, description: "Throat diameter of a well_shape, as a fraction of its rim (surface_size): small for a deep, narrow throat, 1 for a cylinder. Not used with well_profile. WebGL only. Animatable.", 'x-ui-hints': { selector: { number: { min: 0.02, max: 1, step: 0.01, mode: 'slider' } } } },
    well_profile: { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2, maxItems: 32, description: 'Any well shape: diameters as fractions of surface_size, from the rim down to the bottom, evenly spaced along the depth; a smooth curve passes through every one. [1, 0.4, 0.2, 0.15] is a trumpet, [1, 0.2, 1] an hourglass (a wormhole), [1, 0.9, 0.5, 0] a closed bowl. Replaces well_shape and well_throat. The rings are evenly spaced along the surface (line_spacing px apart), however steep it is. WebGL only.' },
    well_profile_to: { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2, maxItems: 32, description: 'A second well profile (the same form as well_profile) to morph toward: well_morph blends from the well\'s shape (0) to this one (1). Animate well_morph to morph the funnel. WebGL only.' },
    well_morph: { type: 'number', minimum: 0, maximum: 1, default: 0, description: 'How far the well has morphed from its shape (0) to well_profile_to (1). WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    well_ripple: { type: 'number', minimum: 0, maximum: 0.9, default: 0, description: 'Ripples running down the well: their height as a fraction of the local radius (0 = none, 0.1 a gentle swell). The grid rings stay where they are and the waves pass through them. WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 0.5, step: 0.01, mode: 'slider' } } } },
    well_ripple_waves: { type: 'number', minimum: 0, maximum: 12, default: 3, description: 'Ripple wavelengths along the depth of the well. WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 12, step: 0.5, mode: 'slider' } } } },
    well_ripple_speed: { type: 'number', default: 0.5, description: 'Ripple speed in waves per second: positive runs down toward the throat, negative up toward the rim, 0 holds them still. WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: -3, max: 3, step: 0.05, mode: 'slider' } } } },
    surface_axis: { type: 'string', enum: ['vertical', 'horizontal'], default: 'vertical', description: 'Which way a cylinder, dome or well points. vertical: an upright cylinder, a dome over the floor, a well opening upward. horizontal: a cylinder lying across the card (scroll_speed_y rolls it), a dome facing you with its pole in the middle (rings and spokes), a well opening toward you. The sphere always has its poles up; turn it with the camera. WebGL only.', enumDescriptions: { vertical: 'Upright cylinder, dome over the floor, well opening up', horizontal: 'Cylinder across the card, dome or well facing you' } },
    surface_side: { type: 'string', enum: ['outside', 'inside'], default: 'outside', description: 'Where the camera is. outside: it looks at the surface from camera_distance. inside: it sits at the centre (slid back by camera_distance above 1) and looks out: down a horizontal cylinder as a tunnel at camera_yaw 0, up into a dome as a planetarium with camera_tilt. A well is always seen from outside. WebGL only.', enumDescriptions: { outside: 'Look at the surface', inside: 'Look out from its centre' } },
    back_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.25, description: 'Opacity of the far side of a curved surface seen from outside (0 hides it). WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    surface_rotate_x: { type: 'number', default: 0, description: 'Turns a curved surface itself about the card\'s horizontal axis, in degrees: positive tips its top toward you. With surface_rotate_y and surface_rotate_z (applied x, then y, then z) it can face any way, and the camera keys still orbit it. Not used on the plane (turn the camera instead). WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: -180, max: 180, step: 1, mode: 'slider' } } } },
    surface_rotate_y: { type: 'number', default: 0, description: 'Turns a curved surface itself about the card\'s vertical axis, in degrees: positive turns its front to the right. WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: -180, max: 180, step: 1, mode: 'slider' } } } },
    surface_rotate_z: { type: 'number', default: 0, description: 'Turns a curved surface itself about the axis toward you, in degrees: positive leans its top to the left (counter-clockwise). WebGL only. Animatable.', 'x-ui-hints': { selector: { number: { min: -180, max: 180, step: 1, mode: 'slider' } } } },
};

export const gridParamsSchema = {
  type: 'object',
  description: 'Params for the "grid" preset: orthogonal scrolling grid with optional major/minor divisions.',
  properties: {
    speed: _speedSchema,
    line_spacing: {
      type: 'number', minimum: 1, default: 40,
      description: 'Pixel spacing between minor lines. Confirmed unclamped in code: 0 or unset-with-falsy hangs the tile loop (Infinity tiles), hence the minimum.',
      'x-ui-hints': { selector: { number: { min: 1, max: 200, step: 1, mode: 'slider' } } }
    },
    num_rows: { type: 'integer', minimum: 1, maximum: 100, description: 'Cell-based sizing alternative to line_spacing: exact row count.' },
    num_cols: { type: 'integer', minimum: 1, maximum: 100, description: 'Cell-based sizing alternative to line_spacing: exact column count.' },
    line_width: { type: 'number', minimum: 0, default: 1, description: 'Line thickness in px (the minor lines; the same as line_width_minor, which wins when both are set). Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    line_width_minor: { type: 'number', minimum: 0, default: 1, description: 'Minor line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    line_width_major: { type: 'number', minimum: 0, default: 2, description: 'Major (emphasised) line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    color: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.3)', description: 'Minor line color.' },
    color_major: { ...simpleColorSchema, description: 'Major line color: falls back to color if unset.' },
    major_row_interval: { type: 'integer', minimum: 0, default: 0, description: 'Draw a major line every N rows (0 = disabled).', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    major_col_interval: { type: 'integer', minimum: 0, default: 0, description: 'Draw a major line every N columns (0 = disabled).', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 20, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 20, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    pattern: {
      type: 'string', enum: ['both', 'horizontal', 'vertical', 'diagonal', 'hexagonal', 'dots', 'polar'], default: 'both',
      description: 'Grid line pattern. polar: rings every line_spacing px round a centre (polar_x, polar_y) and spoke_count spokes, majors every major_row_interval rings and major_col_interval spokes; scroll_speed_y moves the rings outward, scroll_speed_x turns the spokes (line_spacing px per spoke), and it holds still unless they are set. On a curved surface polar draws rings along the axis and spoke_count meridians round it.',
      enumDescriptions: { both: 'Rows and columns', horizontal: 'Rows', vertical: 'Columns', diagonal: 'Diagonal hatching', hexagonal: 'Hexagons', dots: 'Dots', polar: 'Rings and spokes' }
    },
    spoke_count: { type: 'integer', minimum: 0, maximum: 360, default: 12, description: 'Spokes round the centre when pattern is polar (meridians on a curved surface); 0 draws rings only. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 72, step: 1, mode: 'slider' } } } },
    polar_x: { type: 'number', default: 0.5, description: 'Centre of the polar pattern across the card: 0 the left edge, 1 the right (values outside move it off the card). Not used on curved surfaces. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    polar_y: { type: 'number', default: 0.5, description: 'Centre of the polar pattern down the card: 0 the top edge, 1 the bottom. Not used on curved surfaces. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    dot_radius: { type: 'number', minimum: 0, default: 2, description: 'Dot radius in px: only used when pattern is "dots".', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    hex_radius: { type: 'number', minimum: 1, default: 40, description: 'Hexagon size in px: only used when pattern is "hexagonal". Unclamped in code: 0 collapses the hex tiling, hence the minimum.', 'x-ui-hints': { selector: { number: { min: 1, max: 150, step: 1, mode: 'slider' } } } },
    show_border_lines: { type: 'boolean', default: true, description: 'Draw lines at canvas edges.' },
    fill_color: { ...simpleColorSchema, default: 'transparent', description: 'Solid fill painted behind each cell.' },
    ...gridViewProperties,
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const gridDiagonalParamsSchema = {
  type: 'object',
  description: 'Params for the "grid-diagonal" preset: 45° hatched variant of grid. Pattern is hardcoded to diagonal, not user-overridable.',
  properties: {
    speed: _speedSchema,
    line_spacing: { type: 'number', minimum: 1, default: 30, description: 'Pixel spacing between lines. Unclamped in code: 0 hangs the tile loop, hence the minimum.', 'x-ui-hints': { selector: { number: { min: 1, max: 200, step: 1, mode: 'slider' } } } },
    line_width: { type: 'number', minimum: 0, default: 1, description: 'Line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    color: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.25)', description: 'Line color.' },
    scroll_speed_x: { type: 'number', default: 15, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 15, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    fill_color: { ...simpleColorSchema, default: 'transparent', description: 'Solid fill painted behind each cell.' },
    ...gridViewProperties,
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const gridHexagonalParamsSchema = {
  type: 'object',
  description: 'Params for the "grid-hexagonal" preset: honeycomb hex-grid variant of grid. Pattern is hardcoded to hexagonal, not user-overridable.',
  properties: {
    speed: _speedSchema,
    hex_radius: { type: 'number', minimum: 1, default: 40, description: 'Hexagon size in px. Unclamped in code: 0 hangs the tile loop (patternWidth=0), hence the minimum.', 'x-ui-hints': { selector: { number: { min: 1, max: 150, step: 1, mode: 'slider' } } } },
    line_width_minor: { type: 'number', minimum: 0, default: 1, description: 'Minor line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    line_width_major: { type: 'number', minimum: 0, default: 2, description: 'Major line thickness in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.5, mode: 'slider' } } } },
    color: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.3)', description: 'Minor line color.' },
    color_major: { ...simpleColorSchema, default: 'rgba(255, 153, 102, 0.6)', description: 'Major line color.' },
    major_row_interval: { type: 'integer', minimum: 0, default: 3, description: 'Draw a major line every N rows.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    major_col_interval: { type: 'integer', minimum: 0, default: 3, description: 'Draw a major line every N columns.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 20, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 20, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    fill_color: { ...simpleColorSchema, default: 'transparent', description: 'Solid fill painted behind each cell.' },
    ...gridViewProperties,
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

// ============================================================================
// STARFIELD / NEBULA / CONTOUR-FIELD (noise + particle presets)
// ============================================================================

export const starfieldParamsSchema = {
  type: 'object',
  description: 'Params for the "starfield" preset: scrolling parallax star field.',
  properties: {
    speed: _speedSchema,
    seed: { type: 'integer', description: 'Random seed: same seed always generates the same star layout. Random by default when unset.' },
    count: { type: 'integer', minimum: 0, default: 150, description: 'Number of stars.', 'x-ui-hints': { selector: { number: { min: 0, max: 500, step: 10, mode: 'slider' } } } },
    min_radius: { type: 'number', minimum: 0, default: 0.5, description: 'Smallest star radius in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    max_radius: { type: 'number', minimum: 0, default: 2, description: 'Largest star radius in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Dimmest star opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 1.0, description: 'Brightest star opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    colors: {
      type: 'array', items: simpleColorSchema, default: ['#ffffff'],
      description: 'Star color(s); also accepts a single color via the legacy `color` field.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    color: { ...simpleColorSchema, description: 'One color for every star, in place of colors. This is the key to animate (target: background) or bind to recolor the stars.' },
    scroll_speed_x: { type: 'number', default: 30, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 0, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    parallax_layers: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Number of depth layers: more layers = more depth. Clamped in code to 1-5.', 'x-ui-hints': { selector: { number: { min: 1, max: 5, step: 1, mode: 'slider' } } } },
    depth_factor: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'Speed variation between layers. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const nebulaParamsSchema = {
  type: 'object',
  description: 'Params for the "nebula" preset: layered Perlin-noise cloud blobs.',
  properties: {
    speed: _speedSchema,
    seed: { type: 'integer', description: 'Random seed: same seed always generates the same cloud layout. Random by default when unset.' },
    cloud_count: { type: 'integer', minimum: 1, maximum: 10, default: 4, description: 'Number of cloud blobs. Clamped in code to 1-10.', 'x-ui-hints': { selector: { number: { min: 1, max: 10, step: 1, mode: 'slider' } } } },
    min_radius: { type: 'number', minimum: 0, maximum: 1, default: 0.15, description: 'Smallest cloud radius, as a fraction of canvas size. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    max_radius: { type: 'number', minimum: 0, maximum: 1, default: 0.4, description: 'Largest cloud radius, as a fraction of canvas size. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    min_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.3, description: 'Dimmest cloud opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    max_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.8, description: 'Brightest cloud opacity.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    colors: {
      type: 'array', items: simpleColorSchema, default: ['#FF00FF'],
      description: 'Cloud color(s); also accepts a single color via the legacy `color` field.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    color: { ...simpleColorSchema, description: 'One color for every cloud, in place of colors (colors wins when both are set).' },
    turbulence: { type: 'number', minimum: 0, maximum: 1, default: 0.5, description: 'How ragged/organic the cloud edges are. Clamped in code to 0-1.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    noise_scale: { type: 'number', minimum: 0.0001, default: 0.003, description: 'Noise detail: lower = larger, smoother features.', 'x-ui-hints': { selector: { number: { min: 0.0005, max: 0.02, step: 0.0005, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 5, description: 'Horizontal scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 5, description: 'Vertical scroll speed in px/s.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    volumetric: { type: 'boolean', default: false, description: 'On: the same clouds shaded with drifting noise on the GPU (wisps and a turbulent edge) instead of smooth gradients. Needs WebGL; without it, or with renderer: canvas, the plain clouds are drawn.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const contourFieldParamsSchema = {
  type: 'object',
  description: 'Params for the "contour-field" preset: topographic-style banded noise field. Defaults below are the REAL zero-config resolved values (verified against ContourFieldEffect.js/presets/index.js), not the sparser set previously shown in guide.params; the shipped default is a visible tinted fill with a 5-stop gradient, not transparent/single-color.',
  properties: {
    speed: _speedSchema,
    seed: { type: 'integer', description: 'Random seed: same seed + settings always generates the same field. Random by default when unset.' },
    noise_scale: { type: 'number', minimum: 0.0001, default: 0.005, description: 'Smaller = a few large drifting blobs; larger = many small, busy ripples.', 'x-ui-hints': { selector: { number: { min: 0.0005, max: 0.02, step: 0.0005, mode: 'slider' } } } },
    num_octaves: { type: 'integer', minimum: 1, maximum: 8, default: 2, description: 'Layers of fine detail: 1 = smooth blobs, 8 = rough, cloud-like fuzz. Clamped in code to 1-8.', 'x-ui-hints': { selector: { number: { min: 1, max: 8, step: 1, mode: 'slider' } } } },
    num_bands: { type: 'integer', minimum: 2, maximum: 64, default: 5, description: 'Low = bold stepped contour rings; high = a smooth, near-continuous gradient. Clamped in code to 2-64; this floor is load-bearing (num_bands=1 divides by zero internally).', 'x-ui-hints': { selector: { number: { min: 2, max: 64, step: 1, mode: 'slider' } } } },
    cell_size: { type: 'integer', minimum: 1, maximum: 16, default: 1, description: 'Sample resolution: larger is blockier/cheaper, smaller is crisper/costlier. Clamped in code to 1-16.', 'x-ui-hints': { selector: { number: { min: 1, max: 16, step: 1, mode: 'slider' } } } },
    fill_level: { type: 'number', minimum: 0, maximum: 0.95, default: 0.45, description: '0 = no water, full terrain visible; raise it to flood the lowest rings. Clamped in code to 0-0.95.', 'x-ui-hints': { selector: { number: { min: 0, max: 0.95, step: 0.05, mode: 'slider' } } } },
    fill_color: { ...simpleColorSchema, default: 'rgba(19, 11, 129, 0.3)', description: 'Color painted over flooded rings. Real zero-config default resolves to this (the var()-token fallback\'s literal hex/alpha equivalent); leave unset only if you actually want it, "leave empty for transparency" in older docs was misleading since fill_level defaults to a non-zero 0.45.' },
    blend_colors: { type: 'boolean', default: true, description: 'On = colors fade smoothly between rings; off = hard-cutoff flat rings.' },
    colors: {
      type: 'array', items: simpleColorSchema,
      default: ['alpha(#130b81, 0.08)', 'alpha(#130b81, 0.25)', 'alpha(#130b81, 0.42)', 'alpha(#130b81, 0.62)', 'alpha(#130b81, 0.80)'],
      description: 'One color, or several stops spread across the full contour range. Default shown here is the exact shipped default (5 alpha-graded stops of the same base hue).',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    color: { ...simpleColorSchema, description: 'One color for every contour band, in place of colors (colors wins when both are set).' },
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
  description: 'Params for the "cascade" preset: LCARS waterfall colour-cycling data grid. A single instance changes every matched cell in sync (mode: css\'s delay is one flat value); the row-by-row "waterfall" look (including the niagara timing pattern) requires declaring multiple separate instances, one per row; see lcards-data-grid\'s animation.pattern option, which automates that.',
  properties: {
    speed: _speedSchema,
    num_rows: { type: 'integer', minimum: 1, description: 'Explicit row count. Unclamped in code: 0 or negative throws a RangeError, hence the minimum.' },
    num_cols: { type: 'integer', minimum: 1, description: 'Explicit column count. Unclamped in code: 0 or negative throws a RangeError, hence the minimum.' },
    format: {
      type: 'string', enum: ['digit', 'float', 'alpha', 'hex', 'mixed'], default: 'hex',
      description: 'Character set. Confirmed real enum from code; guide.params only vaguely said "hex digits" without enumerating the other 4.'
    },
    pattern: {
      type: 'string', enum: ['default', 'niagara', 'fast', 'custom'], default: 'default',
      description: '"default" = authentic LCARS rhythm, "niagara" = uniform waterfall, "fast", or "custom" (requires a hand-authored `timing` array, YAML only). Unrecognized values silently fall back to "default".'
    },
    speed_multiplier: { type: 'number', minimum: 0.1, default: 1.0, description: 'Overall cycling speed multiplier. Unclamped in code: 0 makes the cycle duration Infinity (frozen), hence the practical floor.', 'x-ui-hints': { selector: { number: { min: 0.1, max: 5, step: 0.1, mode: 'slider' } } } },
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
    font_size: { type: 'number', minimum: 1, default: 10, description: 'Character font size in px. Unclamped: 0 combined with gap:0 throws a RangeError, hence the minimum.', 'x-ui-hints': { selector: { number: { min: 4, max: 40, step: 1, mode: 'slider' } } } },
    gap: { type: 'number', minimum: 0, default: 4, description: 'Spacing between cells in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 1, mode: 'slider' } } } },
    font_family: { type: 'string', description: 'Character font. Default: the theme\'s cascade font (Antonio).' },
    timing: {
      type: 'array',
      description: 'With pattern: custom, the timing of each row in turn (repeating): duration in ms, delay in seconds.',
      items: {
        type: 'object',
        properties: {
          duration: { type: 'number', minimum: 1, description: 'One cycle of the row, ms (at least 100).' },
          delay: { type: 'number', minimum: 0, description: 'How far into its cycle the row starts, seconds.' }
        },
        additionalProperties: false
      }
    },
    refresh_interval: { type: 'integer', minimum: 0, default: 0, description: 'How often cells re-randomize, in ms (0 = never: the characters stay put).', 'x-ui-hints': { selector: { number: { min: 0, max: 5000, step: 100, mode: 'slider' } } } },
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
  description: 'Params for the "level" preset: animated tank/gauge fill bar.',
  properties: {
    speed: _speedSchema,
    color_a: { ...simpleColorSchema, default: 'rgba(0,200,100,0.7)', description: 'Primary fill color (or gradient start).' },
    color_b: { ...simpleColorSchema, description: 'Gradient end color: omit for a flat fill.' },
    color: { ...simpleColorSchema, description: 'Fill color: the older name for color_a (color_a wins when both are set).' },
    gradient_crossover: { type: 'number', minimum: 0, maximum: 100, default: 80, description: 'Percent of fill height where the gradient crosses over. Clamped in code to 0-100.', 'x-ui-hints': { selector: { number: { min: 0, max: 100, step: 1, mode: 'slider' } } } },
    fill_pct: { type: 'number', minimum: 0, maximum: 100, default: 50, description: 'Fill level, 0-100. Clamped in code.', 'x-ui-hints': { selector: { number: { min: 0, max: 100, step: 1, mode: 'slider' } } } },
    direction: {
      type: 'string', enum: ['up', 'down', 'left', 'right'], default: 'up',
      description: 'Fill direction: all 4 values render correctly (\'down\'/\'left\' are implemented as a Canvas2D mirror of the \'up\'/\'right\' geometry).'
    },
    edge_glow: { type: 'boolean', default: true, description: 'Whether to draw a glow along the fill edge.' },
    edge_glow_color: { ...simpleColorSchema, default: 'rgba(255,255,255,0.7)', description: 'Edge glow color.' },
    edge_glow_width: { type: 'number', minimum: 0, default: 6, description: 'Edge glow width in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    wave_height: { type: 'number', minimum: 0, default: 4, description: 'Primary wave amplitude in px.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    wave_speed: { type: 'number', default: 20, description: 'Primary wave speed.', 'x-ui-hints': { selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    wave_count: { type: 'integer', minimum: 1, default: 4, description: 'Primary wave count across the width. Not rounded in code if fractional; a non-integer produces a visible seam at the wrap edge, hence typed integer here.', 'x-ui-hints': { selector: { number: { min: 1, max: 20, step: 1, mode: 'slider' } } } },
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
  description: 'Params for the "fluid" preset: swirling single-colour noise wash.',
  properties: {
    speed: _speedSchema,
    color: { ...simpleColorSchema, default: 'rgba(100,180,255,0.8)', description: 'Wash color.' },
    base_frequency: { type: 'number', minimum: 0.0001, default: 0.010, description: 'Noise detail: lower = larger features.', 'x-ui-hints': { selector: { number: { min: 0.001, max: 0.05, step: 0.001, mode: 'slider' } } } },
    num_octaves: { type: 'integer', minimum: 1, maximum: 8, default: 4, description: 'Layers of noise detail: perf cost scales with this, practical max ~8.', 'x-ui-hints': { selector: { number: { min: 1, max: 8, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 7, description: 'Horizontal drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 10, description: 'Vertical drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const plasmaParamsSchema = {
  type: 'object',
  description: 'Params for the "plasma" preset: two-colour plasma noise bands.',
  properties: {
    speed: _speedSchema,
    color_a: { ...simpleColorSchema, default: 'rgba(80,0,255,0.9)', description: 'First plasma color.' },
    color_b: { ...simpleColorSchema, default: 'rgba(255,40,120,0.9)', description: 'Second plasma color.' },
    base_frequency: { type: 'number', minimum: 0.0001, default: 0.012, description: 'Noise detail: lower = larger features.', 'x-ui-hints': { selector: { number: { min: 0.001, max: 0.05, step: 0.001, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 8, description: 'Horizontal drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 5, description: 'Vertical drift speed.', 'x-ui-hints': { selector: { number: { min: -30, max: 30, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const flowParamsSchema = {
  type: 'object',
  description: 'Params for the "flow" preset: directional streaming noise streaks.',
  properties: {
    speed: _speedSchema,
    color: { ...simpleColorSchema, default: 'rgba(0,200,255,0.7)', description: 'Streak color.' },
    base_frequency: { type: 'number', minimum: 0.0001, default: 0.012, description: 'Noise detail: lower = larger features.', 'x-ui-hints': { selector: { number: { min: 0.001, max: 0.05, step: 0.001, mode: 'slider' } } } },
    wave_scale: { type: 'number', minimum: 0, default: 8, description: 'Streak waviness.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 1, mode: 'slider' } } } },
    scroll_speed_x: { type: 'number', default: 50, description: 'Horizontal stream speed.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    scroll_speed_y: { type: 'number', default: 0, description: 'Vertical stream speed.', 'x-ui-hints': { selector: { number: { min: -100, max: 100, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const shimmerParamsSchema = {
  type: 'object',
  description: 'Params for the "shimmer" preset: sweeping highlight band.',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(255,255,255,0.55)', description: 'Highlight color.' },
    highlight_width: { type: 'number', minimum: 0, default: 0.35, description: 'Band width as a fraction of canvas size.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    speed: { type: 'number', default: 6, description: 'Sweep speed, px per second along the diagonal.', 'x-ui-hints': { selector: { number: { min: 0, max: 20, step: 0.5, mode: 'slider' } } } },
    angle: { type: 'number', minimum: 0, maximum: 360, default: 30, description: 'Sweep angle in degrees. Unbounded in code (raw sin/cos of the angle) but periodic, so 0-360 is the sensible UI range.', 'x-ui-hints': { selector: { number: { min: 0, max: 360, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const scanlinesParamsSchema = {
  type: 'object',
  description: 'Params for the "scanlines" preset: static CRT-style scanline overlay.',
  properties: {
    speed: _speedSchema,
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
  description: 'Params for the "image" preset: user-supplied image rendered behind the full card area. Field is `source` (not `url`; a page of docs previously used `url` throughout, which never worked; fixed).',
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
    position: { type: 'string', default: 'center', description: 'CSS background-position string. Not enum-validated in code: free-form.' },
    repeat: { type: 'boolean', default: false, description: 'Tile the image instead of scaling it.' },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const solidParamsSchema = {
  type: 'object',
  description: 'Params for the "solid" preset: flat single-colour fill, the cheapest background preset (no procedural noise).',
  properties: {
    color: { ...simpleColorSchema, default: 'rgba(0, 0, 0, 0.4)', description: 'Fill color: the alpha channel controls how much shows through base_svg.' },
    opacity: { ..._opacitySchema, description: 'Multiplies with any alpha already present in color.' }
  },
  additionalProperties: 'warn'
};

export const warpStarfieldParamsSchema = {
  type: 'object',
  description: 'Params for the "warp-starfield" preset: stars flying at the viewer in 3D (three.js, WebGL), stretching into streaks as speed rises above 1. Without WebGL the starfield preset is drawn with the same config.',
  properties: {
    speed: { ..._speedSchema, description: 'Time multiplier: how fast the stars fly. Above 1 they stretch into streaks (warp). Animatable.' },
    seed: { type: 'integer', description: 'Random seed: same seed always generates the same star layout. Random by default when unset.' },
    count: { type: 'integer', minimum: 1, maximum: 20000, default: 600, description: 'Number of stars.', 'x-ui-hints': { selector: { number: { min: 50, max: 3000, step: 50, mode: 'slider' } } } },
    min_radius: { type: 'number', minimum: 0, default: 0.5, description: 'Smallest star size (about px at mid depth).', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    max_radius: { type: 'number', minimum: 0, default: 2, description: 'Largest star size (about px at mid depth).', 'x-ui-hints': { selector: { number: { min: 0, max: 10, step: 0.1, mode: 'slider' } } } },
    colors: {
      type: 'array', items: simpleColorSchema, default: ['var(--lcards-moonlight)'],
      description: 'Star color(s); each star takes one of them. The default (moonlight) follows the alert palette.',
      'x-ui-hints': { widget: 'json', label: 'Colors' }
    },
    color: { ...simpleColorSchema, description: 'One color for every star, in place of colors. This is the key to animate (target: background) or bind to recolor the stars.' },
    streak: { type: 'number', minimum: 0, default: 1, description: 'How long the streaks grow per unit of speed above 1. 0 keeps the stars as dots at any speed. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 4, step: 0.1, mode: 'slider' } } } },
    spectrum: { type: 'boolean', default: false, description: 'Streaks split into colour along their length (the TNG warp look): a Doppler shift of each star\'s own colour, violet toward the tail (nearer the direction of travel) and red toward the head. White stars show the whole rainbow; a blue star streaks green to violet, its tail fading past violet. Fades in as the dots stretch; dots keep their colour.' },
    spectrum_direction: { type: 'string', enum: ['doppler', 'reverse'], default: 'doppler', description: 'doppler: violet toward the tail, as a real Doppler shift. reverse: violet toward the head.' },
    camera_tilt: { type: 'number', minimum: -40, maximum: 40, default: 0, description: 'Looks down (positive) or up from the direction of travel, in degrees: the stars stream from a point higher or lower on the card. Same meaning as the grid camera_tilt (degrees below straight ahead). Animatable.', 'x-ui-hints': { selector: { number: { min: -40, max: 40, step: 1, mode: 'slider' } } } },
    camera_yaw: { type: 'number', minimum: -40, maximum: 40, default: 0, description: 'Looks right (positive) or left of the direction of travel, in degrees, as when a ship turns at warp. Animatable.', 'x-ui-hints': { selector: { number: { min: -40, max: 40, step: 1, mode: 'slider' } } } },
    camera_roll: { type: 'number', default: 0, description: 'Banks the view round its line of sight, in degrees (positive: clockwise), as when a ship rolls at warp. Animatable.', 'x-ui-hints': { selector: { number: { min: -180, max: 180, step: 1, mode: 'slider' } } } },
    fov: { type: 'number', minimum: 20, maximum: 120, default: 70, description: 'Camera field of view in degrees: wider makes a deeper tunnel of streaks (star sizes stay in px). Animatable.', 'x-ui-hints': { selector: { number: { min: 20, max: 120, step: 1, mode: 'slider' } } } },
    opacity: _opacitySchema
  },
  additionalProperties: 'warn'
};

export const holoSphereParamsSchema = {
  type: 'object',
  description: 'Params for the "holo-sphere" preset: a rotating latitude/longitude wireframe planet with a scan band (three.js where WebGL is available, the same look on Canvas2D otherwise).',
  properties: {
    speed: _speedSchema,
    color: { ...simpleColorSchema, default: 'var(--lcards-blue-light)', description: 'Wireframe color. The default follows the alert palette. Animatable.' },
    scan_color: { ...simpleColorSchema, default: 'var(--lcards-moonlight)', description: 'Scan band color. The default follows the alert palette. Animatable.' },
    rotate_speed: { type: 'number', default: 1, description: 'Revolutions per minute; negative turns the other way. Animatable (a change never jumps the rotation).', 'x-ui-hints': { selector: { number: { min: -10, max: 10, step: 0.1, mode: 'slider' } } } },
    tilt: { type: 'number', minimum: -90, maximum: 90, default: 20, description: 'Axis tilt in degrees: positive leans the north pole toward the viewer. Animatable.', 'x-ui-hints': { selector: { number: { min: -90, max: 90, step: 1, mode: 'slider' } } } },
    latitude_lines: { type: 'integer', minimum: 0, maximum: 64, default: 7, description: 'Rings between the poles.', 'x-ui-hints': { selector: { number: { min: 0, max: 24, step: 1, mode: 'slider' } } } },
    longitude_lines: { type: 'integer', minimum: 0, maximum: 128, default: 12, description: 'Meridians around the sphere.', 'x-ui-hints': { selector: { number: { min: 0, max: 48, step: 1, mode: 'slider' } } } },
    size: { type: 'number', minimum: 0, default: 0.8, description: "Diameter as a fraction of the card's shorter side (above 1 overflows the card). Animatable.", 'x-ui-hints': { selector: { number: { min: 0.1, max: 3, step: 0.05, mode: 'slider' } } } },
    position_x: { type: 'number', default: 0.5, description: 'Centre across the card: 0 is the left edge, 1 the right. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    position_y: { type: 'number', default: 0.5, description: 'Centre down the card: 0 is the top edge, 1 the bottom. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    back_opacity: { type: 'number', minimum: 0, maximum: 1, default: 0.2, description: 'Brightness of the far side: 0 hides it, 1 draws it like the front. Animatable.', 'x-ui-hints': { selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } } },
    line_width: { type: 'number', minimum: 0.1, default: 1, description: 'Wireframe line width in px (the scan band draws 1.5 times as wide). Animatable.', 'x-ui-hints': { selector: { number: { min: 0.5, max: 8, step: 0.5, mode: 'slider' } } } },
    scan_period: { type: 'number', minimum: 0, default: 6, description: 'Seconds per scan sweep, including a short rest; 0 turns the band off.', 'x-ui-hints': { selector: { number: { min: 0, max: 30, step: 0.5, mode: 'slider' } } } },
    opacity: _opacitySchema
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
  solid: solidParamsSchema,
  'warp-starfield': warpStarfieldParamsSchema,
  'holo-sphere': holoSphereParamsSchema
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
/**
 * The strings BackgroundAnimationRenderer evaluates (TemplateDetector.hasJavaScript or
 * hasTokens): any other string in place of a number or a colour reaches the effect as is,
 * so the template branch only takes these.
 * @private
 */
const BACKGROUND_TEMPLATE_PATTERN = '\\[\\[\\[[\\s\\S]*\\]\\]\\]|\\{[a-zA-Z_][\\w.:-]*\\}';

function _reactiveAware(fieldSchema) {
  return {
    oneOf: [
      fieldSchema,
      { type: 'string', pattern: BACKGROUND_TEMPLATE_PATTERN, description: 'Template string ([[[ JavaScript ]]] or a {token}), evaluated on every Home Assistant update.' },
      {
        type: 'object',
        properties: {
          template: { type: 'string', required: true },
          // the value while the template gives none (a number, a colour, ...)
          default: { type: ['number', 'string', 'boolean'] }
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
