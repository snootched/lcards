/**
 * Filter Value Params Schemas
 *
 * One schema per registered filter `type`, describing the shape of that
 * filter's `value:` field — types, enums, bounds, defaults. Mirrors the
 * structure of background-animation-params-schemas.js and follows the same
 * pattern established by animation-preset-params-schemas.js, wired into
 * `filterSchema.properties.value`'s `discriminatedBy` in common-schemas.js
 * (discriminator field: `type`, not `mode` — every type name is unique
 * across both CSS and SVG filters, confirmed via
 * lcards-filter-editor.js:1360's own `svgFilterTypes` membership check).
 *
 * Every bound below matches the real, independently-maintained hardcoded
 * bounds already used by the live in-app filter editor
 * (lcards-filter-editor.js) — opacity/grayscale/sepia/invert clamped 0-1
 * (CSS-spec-mandated), brightness/contrast/saturate practical max 3,
 * hue-rotate 0-360. This schema and the editor stay independently
 * maintained (same approach as the background-animation phase) — a future
 * DRY pass could point the editor at this schema instead, but that's a
 * separate initiative.
 *
 * Filters do not support reactive values (template strings / map_range) —
 * confirmed zero TemplateDetector/LCARdSCardTemplateEvaluator/map_range
 * references anywhere in the filter application path
 * (src/msd/utils/BaseSvgFilters.js, CardModel.js, and both real call sites
 * in lcards-button.js/PipelineCore.js) — so unlike the background-animation
 * and animation schemas, no `_reactiveAware()` wrapping is needed here.
 *
 * @module cards/schemas/filter-params-schemas
 */

// ============================================================================
// CSS FILTERS — simple string/number `value`
// ============================================================================

export const blurParamsSchema = {
  type: 'string',
  default: '0px',
  pattern: '^\\d+(\\.\\d+)?px$',
  description: 'Gaussian blur radius, a CSS length in px.',
  'x-ui-hints': { label: 'Blur Radius', selector: { number: { min: 0, max: 50, step: 0.5, mode: 'slider' } }, unit: 'px' }
};

export const brightnessParamsSchema = {
  type: 'number', minimum: 0, default: 1,
  description: '0 = black, 1 = normal, 2+ = brighter. No hard ceiling in code — 3 is a practical UI limit.',
  'x-ui-hints': { label: 'Brightness', selector: { number: { min: 0, max: 3, step: 0.1, mode: 'slider' } } }
};

export const contrastParamsSchema = {
  type: 'number', minimum: 0, default: 1,
  description: '0 = gray, 1 = normal, 2+ = higher contrast. No hard ceiling in code — 3 is a practical UI limit.',
  'x-ui-hints': { label: 'Contrast', selector: { number: { min: 0, max: 3, step: 0.1, mode: 'slider' } } }
};

export const saturateParamsSchema = {
  type: 'number', minimum: 0, default: 1,
  description: '0 = grayscale, 1 = normal, 2+ = oversaturated. No hard ceiling in code — 3 is a practical UI limit.',
  'x-ui-hints': { label: 'Saturation', selector: { number: { min: 0, max: 3, step: 0.1, mode: 'slider' } } }
};

export const hueRotateParamsSchema = {
  type: 'string',
  default: '0deg',
  pattern: '^-?\\d+(\\.\\d+)?deg$',
  description: 'Angle to rotate hue by, a CSS angle in deg (0-360 is the meaningful range; it wraps beyond that).',
  'x-ui-hints': { label: 'Hue Rotation', selector: { number: { min: 0, max: 360, step: 1, mode: 'slider' } }, unit: 'deg' }
};

export const grayscaleParamsSchema = {
  type: 'number', minimum: 0, maximum: 1, default: 0,
  description: '0 = full color, 1 = complete grayscale. CSS-spec-clamped to 0-1.',
  'x-ui-hints': { label: 'Grayscale Amount', selector: { number: { min: 0, max: 1, step: 0.1, mode: 'slider' } } }
};

export const sepiaParamsSchema = {
  type: 'number', minimum: 0, maximum: 1, default: 0,
  description: '0 = normal, 1 = full sepia tone. CSS-spec-clamped to 0-1.',
  'x-ui-hints': { label: 'Sepia Amount', selector: { number: { min: 0, max: 1, step: 0.1, mode: 'slider' } } }
};

export const invertParamsSchema = {
  type: 'number', minimum: 0, maximum: 1, default: 0,
  description: '0 = normal, 1 = fully inverted. CSS-spec-clamped to 0-1.',
  'x-ui-hints': { label: 'Invert Amount', selector: { number: { min: 0, max: 1, step: 0.1, mode: 'slider' } } }
};

export const opacityParamsSchema = {
  type: 'number', minimum: 0, maximum: 1, default: 1,
  description: '0 = fully transparent, 1 = fully opaque. CSS-spec-clamped to 0-1 — values above 1 have no additional effect.',
  'x-ui-hints': { label: 'Opacity', selector: { number: { min: 0, max: 1, step: 0.1, mode: 'slider' } } }
};

export const dropShadowParamsSchema = {
  type: 'object',
  description: 'Drop shadow behind the element.',
  properties: {
    x: { type: 'number', default: 0, description: 'Horizontal offset in px.', 'x-ui-hints': { label: 'X Offset', selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } }, unit: 'px' } },
    y: { type: 'number', default: 0, description: 'Vertical offset in px.', 'x-ui-hints': { label: 'Y Offset', selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } }, unit: 'px' } },
    blur: { type: 'string', default: '0px', pattern: '^\\d+(\\.\\d+)?px$', description: 'Shadow blur radius, a CSS length in px.', 'x-ui-hints': { label: 'Blur Radius', selector: { number: { min: 0, max: 50, step: 0.5, mode: 'slider' } }, unit: 'px' } },
    color: { type: 'string', default: '#000000', description: 'Shadow color.', 'x-ui-hints': { widget: 'lcards-color-picker', label: 'Shadow Color' } }
  },
  additionalProperties: false
};

// ============================================================================
// SVG FILTER PRIMITIVES — object `value`, mirrors BaseSvgFilters.js
// ============================================================================

export const feGaussianBlurParamsSchema = {
  type: 'object',
  description: 'SVG Gaussian blur — smoother than CSS blur, chains with other SVG filters.',
  properties: {
    stdDeviation: { type: 'number', minimum: 0, default: 0, description: 'Amount of blur — 0 = none, higher = more blur.', 'x-ui-hints': { label: 'Standard Deviation', selector: { number: { min: 0, max: 50, step: 0.5, mode: 'slider' } } } }
  },
  additionalProperties: false
};

export const feColorMatrixParamsSchema = {
  type: 'object',
  description: 'Color transformation via matrix operations — hue rotation, saturation, luminance-to-alpha, or a custom 4x5 matrix.',
  properties: {
    type: {
      type: 'string', default: 'saturate',
      enum: ['matrix', 'saturate', 'hueRotate', 'luminanceToAlpha'],
      description: 'Matrix operation type.',
      'x-ui-hints': { label: 'Matrix Type' }
    },
    values: {
      default: 1,
      oneOf: [
        { type: 'number', description: 'Saturation multiplier (type: saturate) or hue-rotate angle in degrees (type: hueRotate).' },
        { type: 'string', description: 'Space-separated 4x5 matrix — 20 numbers (type: matrix).' },
        { type: 'array', items: { type: 'number' }, description: '4x5 matrix as an array — 20 numbers (type: matrix).' }
      ],
      description: 'Meaning depends on `type`. Not used when type is luminanceToAlpha.'
    }
  },
  additionalProperties: false
};

export const feOffsetParamsSchema = {
  type: 'object',
  description: 'Shifts the filter result by dx/dy pixels — combine with blur for shadow effects.',
  properties: {
    dx: { type: 'number', default: 0, description: 'Horizontal offset — positive = right, negative = left.', 'x-ui-hints': { label: 'dx (horizontal offset)', selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } },
    dy: { type: 'number', default: 0, description: 'Vertical offset — positive = down, negative = up.', 'x-ui-hints': { label: 'dy (vertical offset)', selector: { number: { min: -50, max: 50, step: 1, mode: 'slider' } } } }
  },
  additionalProperties: false
};

export const feBlendParamsSchema = {
  type: 'object',
  description: 'Blends the current filter result with SourceGraphic using a standard CSS blend mode.',
  properties: {
    mode: {
      type: 'string', default: 'normal',
      enum: ['normal', 'multiply', 'screen', 'darken', 'lighten', 'overlay', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'],
      description: 'Blend mode — try screen/lighten after a blur for glow effects.',
      'x-ui-hints': { label: 'Blend Mode' }
    }
  },
  additionalProperties: false
};

export const feCompositeParamsSchema = {
  type: 'object',
  description: 'Combines the previous filter result and SourceGraphic using a Porter-Duff operator, or a custom arithmetic formula.',
  properties: {
    operator: {
      type: 'string', default: 'over',
      enum: ['over', 'in', 'out', 'atop', 'xor', 'arithmetic'],
      description: 'Compositing operator.',
      'x-ui-hints': { label: 'Composite Operator' }
    },
    k1: { type: 'number', default: 0, description: 'Arithmetic coefficient — only used when operator is arithmetic. result = k1*i1*i2 + k2*i1 + k3*i2 + k4.', 'x-ui-hints': { label: 'k1', selector: { number: { min: -2, max: 2, step: 0.1, mode: 'slider' } } } },
    k2: { type: 'number', default: 0, description: 'Arithmetic coefficient — only used when operator is arithmetic.', 'x-ui-hints': { label: 'k2', selector: { number: { min: -2, max: 2, step: 0.1, mode: 'slider' } } } },
    k3: { type: 'number', default: 0, description: 'Arithmetic coefficient — only used when operator is arithmetic.', 'x-ui-hints': { label: 'k3', selector: { number: { min: -2, max: 2, step: 0.1, mode: 'slider' } } } },
    k4: { type: 'number', default: 0, description: 'Arithmetic coefficient — only used when operator is arithmetic.', 'x-ui-hints': { label: 'k4', selector: { number: { min: -2, max: 2, step: 0.1, mode: 'slider' } } } }
  },
  additionalProperties: false
};

export const feMorphologyParamsSchema = {
  type: 'object',
  description: 'Erodes (thins) or dilates (fattens) shapes — useful for outlines or edge-thickness adjustment.',
  properties: {
    operator: {
      type: 'string', default: 'erode',
      enum: ['erode', 'dilate'],
      description: "'erode' thins shapes, 'dilate' fattens them.",
      'x-ui-hints': { label: 'Operator' }
    },
    radius: { type: 'number', minimum: 0, default: 1, description: 'How far to erode/dilate, in filter units.', 'x-ui-hints': { label: 'Radius', selector: { number: { min: 0, max: 20, step: 0.5, mode: 'slider' } } } }
  },
  additionalProperties: false
};

export const feTurbulenceParamsSchema = {
  type: 'object',
  description: 'Generates Perlin noise for organic textures — commonly paired with feDisplacementMap.',
  properties: {
    type: {
      type: 'string', default: 'turbulence',
      enum: ['turbulence', 'fractalNoise'],
      description: "'turbulence' (cloudy) | 'fractalNoise' (softer).",
      'x-ui-hints': { label: 'Noise Type' }
    },
    baseFrequency: { type: 'number', minimum: 0, maximum: 1, default: 0.05, description: 'Noise detail — lower = larger features.', 'x-ui-hints': { label: 'Base Frequency', selector: { number: { min: 0, max: 1, step: 0.01, mode: 'slider' } } } },
    numOctaves: { type: 'integer', minimum: 1, maximum: 10, default: 1, description: 'Layers of noise detail.', 'x-ui-hints': { label: 'Octaves (Detail Level)', selector: { number: { min: 1, max: 10, step: 1, mode: 'slider' } } } },
    seed: { type: 'number', default: 0, description: 'Randomization seed — change for a different pattern.', 'x-ui-hints': { label: 'Seed', selector: { number: { min: 0, max: 100, step: 1, mode: 'slider' } } } }
  },
  additionalProperties: false
};

export const feDisplacementMapParamsSchema = {
  type: 'object',
  description: 'Warps the image based on color values from a preceding source (typically feTurbulence) — wavy/liquid/turbulent distortion.',
  properties: {
    scale: { type: 'number', minimum: 0, default: 10, description: 'Displacement strength — higher = more distortion.', 'x-ui-hints': { label: 'Displacement Scale', selector: { number: { min: 0, max: 200, step: 5, mode: 'slider' } } } },
    xChannelSelector: { type: 'string', default: 'R', enum: ['R', 'G', 'B', 'A'], description: 'Color channel driving horizontal displacement.', 'x-ui-hints': { label: 'X Channel' } },
    yChannelSelector: { type: 'string', default: 'G', enum: ['R', 'G', 'B', 'A'], description: 'Color channel driving vertical displacement.', 'x-ui-hints': { label: 'Y Channel' } }
  },
  additionalProperties: false
};

export const tintParamsSchema = {
  type: 'object',
  description: 'Composites a flat color wash over the content — a cheap alert/status tint. Requires an SVG root (not supported on data-grid).',
  properties: {
    color: {
      type: 'string', default: 'rgba(0,0,0,0.4)',
      pattern: '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8}|transparent|theme:|rgb\\(|rgba\\(|hsl\\(|var\\(--)',
      description: 'Tint color — the alpha channel controls how much content shows through.',
      'x-ui-hints': { widget: 'lcards-color-picker', label: 'Tint Color' }
    }
  },
  additionalProperties: false
};

// ============================================================================
// REGISTRY — keyed by filter `type` (unique across both CSS and SVG modes)
// ============================================================================

export const FILTER_PARAMS_SCHEMAS = {
  // CSS
  blur: blurParamsSchema,
  brightness: brightnessParamsSchema,
  contrast: contrastParamsSchema,
  saturate: saturateParamsSchema,
  'hue-rotate': hueRotateParamsSchema,
  grayscale: grayscaleParamsSchema,
  sepia: sepiaParamsSchema,
  invert: invertParamsSchema,
  opacity: opacityParamsSchema,
  'drop-shadow': dropShadowParamsSchema,
  // SVG
  feGaussianBlur: feGaussianBlurParamsSchema,
  feColorMatrix: feColorMatrixParamsSchema,
  feOffset: feOffsetParamsSchema,
  feBlend: feBlendParamsSchema,
  feComposite: feCompositeParamsSchema,
  feMorphology: feMorphologyParamsSchema,
  feTurbulence: feTurbulenceParamsSchema,
  feDisplacementMap: feDisplacementMapParamsSchema,
  tint: tintParamsSchema
};
