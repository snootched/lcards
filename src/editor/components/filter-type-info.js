/**
 * @fileoverview Per-filter-type descriptive content for the filter editor's
 * "How this filter works" info guide.
 *
 * Filters have no per-type validation schema the way animation presets do
 * (`filterSchema` in `src/cards/schemas/common-schemas.js` is one generic
 * `{mode, type, value}` shape shared by all 19 types) — so unlike the
 * animation editor, this content can't be sourced from a schema. It's kept
 * in this sibling data module instead of inline in the editor component, to
 * isolate content from render logic and give future edits one place to
 * check rather than a map buried in an already-large render file.
 *
 * @module editor/components/filter-type-info
 */

export const FILTER_TYPE_INFO = {
  // ── CSS Filters ──────────────────────────────────────────────────────
  'blur': {
    description: 'Applies Gaussian blur to soften edges and create depth effects.',
    params: [
      { key: 'value', default: '0px', description: 'CSS length — e.g. 2px, 5px, 10px.' }
    ],
    example: "filters:\n  - { mode: css, type: blur, value: '3px' }"
  },
  'brightness': {
    description: 'Adjusts the brightness level. 1 = normal, less than 1 = darker, greater than 1 = brighter.',
    params: [
      { key: 'value', default: 1, description: '0 = black, 1 = normal, 2+ = brighter.' }
    ],
    example: 'filters:\n  - { mode: css, type: brightness, value: 1.2 }'
  },
  'contrast': {
    description: 'Adjusts the contrast. 1 = normal, less than 1 = less contrast, greater than 1 = more contrast.',
    params: [
      { key: 'value', default: 1, description: '0 = gray, 1 = normal, 2+ = higher contrast.' }
    ],
    example: 'filters:\n  - { mode: css, type: contrast, value: 1.3 }'
  },
  'saturate': {
    description: 'Adjusts color saturation. 0 = grayscale, 1 = normal, greater than 1 = oversaturated.',
    params: [
      { key: 'value', default: 1, description: '0 = grayscale, 1 = normal, 2+ = oversaturated.' }
    ],
    example: 'filters:\n  - { mode: css, type: saturate, value: 0.8 }'
  },
  'hue-rotate': {
    description: 'Rotates colors around the color wheel (0-360 degrees).',
    params: [
      { key: 'value', default: '0deg', description: 'Angle to rotate hue by.' }
    ],
    example: "filters:\n  - { mode: css, type: hue-rotate, value: '90deg' }"
  },
  'grayscale': {
    description: 'Converts to grayscale. 0 = full color, 1 = complete grayscale.',
    params: [
      { key: 'value', default: 0, description: '0 = color, 1 = fully grayscale.' }
    ],
    example: 'filters:\n  - { mode: css, type: grayscale, value: 0.5 }'
  },
  'sepia': {
    description: 'Applies sepia tone effect. 0 = normal, 1 = full sepia (vintage look).',
    params: [
      { key: 'value', default: 0, description: '0 = normal, 1 = full sepia tone.' }
    ],
    example: 'filters:\n  - { mode: css, type: sepia, value: 0.3 }'
  },
  'invert': {
    description: 'Inverts colors. 0 = normal, 1 = fully inverted (negative).',
    params: [
      { key: 'value', default: 0, description: '0 = normal, 1 = fully inverted.' }
    ],
    example: 'filters:\n  - { mode: css, type: invert, value: 0.2 }'
  },
  'opacity': {
    description: 'Adjusts transparency. 0 = fully transparent, 1 = fully opaque.',
    params: [
      { key: 'value', default: 1, description: '0 = transparent, 1 = fully opaque.' }
    ],
    example: 'filters:\n  - { mode: css, type: opacity, value: 0.5 }'
  },
  'drop-shadow': {
    description: 'Creates a drop shadow behind the element.',
    params: [
      { key: 'x', default: 0, description: 'Horizontal offset in px.' },
      { key: 'y', default: 0, description: 'Vertical offset in px.' },
      { key: 'blur', default: '0px', description: 'Shadow blur radius (CSS length).' },
      { key: 'color', default: '#000000', description: 'Shadow color.' }
    ],
    example: "filters:\n  - { mode: css, type: drop-shadow, value: { x: 2, y: 2, blur: '4px', color: '#000000' } }"
  },

  // ── SVG Filter Primitives ────────────────────────────────────────────
  'feGaussianBlur': {
    description: 'SVG blur filter — smoother than CSS blur, chains with other SVG filters.',
    params: [
      { key: 'stdDeviation', default: 0, description: 'Amount of blur — 0 = none, higher = more blur.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feGaussianBlur, value: { stdDeviation: 4 } }'
  },
  'feColorMatrix': {
    description: 'Powerful color transformation using matrix operations. Supports hue rotation, saturation, luminance-to-alpha, and custom 4x5 color mapping matrices.',
    params: [
      { key: 'type', default: 'saturate', description: "'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha'." },
      { key: 'values', description: 'Meaning depends on type: a saturation multiplier, a hue-rotate angle, or 20 space-separated matrix numbers.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feColorMatrix, value: { type: saturate, values: 1.5 } }'
  },
  'feOffset': {
    description: 'Shifts the filter result by dx/dy pixels. Essential for creating shadow effects when combined with blur.',
    params: [
      { key: 'dx', default: 0, description: 'Horizontal offset — positive = right, negative = left.' },
      { key: 'dy', default: 0, description: 'Vertical offset — positive = down, negative = up.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feOffset, value: { dx: 3, dy: 3 } }'
  },
  'feBlend': {
    description: 'Blends the current filter result with another input (defaults to SourceGraphic) using any of the 16 standard CSS blend modes (multiply, screen, overlay, etc.).',
    params: [
      { key: 'mode', default: 'normal', description: 'Blend mode — try screen/lighten after a blur for glow effects.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feBlend, value: { mode: screen } }'
  },
  'feComposite': {
    description: 'Combines two inputs (the previous filter result and SourceGraphic by default) using Porter-Duff compositing operators, or a custom arithmetic formula.',
    params: [
      { key: 'operator', default: 'over', description: "'over' | 'in' | 'out' | 'atop' | 'xor' | 'arithmetic'." },
      { key: 'k1', default: 0, description: 'Arithmetic coefficient (only used when operator is arithmetic).' },
      { key: 'k2', default: 0, description: 'Arithmetic coefficient.' },
      { key: 'k3', default: 0, description: 'Arithmetic coefficient.' },
      { key: 'k4', default: 0, description: 'Arithmetic coefficient — result = k1·i1·i2 + k2·i1 + k3·i2 + k4.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feComposite, value: { operator: over } }'
  },
  'feMorphology': {
    description: 'Erodes (thins) or dilates (fattens) shapes. Useful for creating outline effects or adjusting edge thickness.',
    params: [
      { key: 'operator', default: 'erode', description: "'erode' (thins shapes) | 'dilate' (fattens shapes)." },
      { key: 'radius', default: 1, description: 'How far to erode/dilate, in filter units.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feMorphology, value: { operator: dilate, radius: 2 } }'
  },
  'feTurbulence': {
    description: 'Generates Perlin noise patterns for organic textures. Commonly used with feDisplacementMap for distortion/warping effects.',
    params: [
      { key: 'type', default: 'turbulence', description: "'turbulence' (cloudy) | 'fractalNoise' (softer)." },
      { key: 'baseFrequency', default: 0.05, description: 'Noise detail — lower = larger features.' },
      { key: 'numOctaves', default: 1, description: 'Layers of noise detail.' },
      { key: 'seed', default: 0, description: 'Randomization seed — change for a different pattern.' }
    ],
    example: 'filters:\n  - { mode: svg, type: feTurbulence, value: { baseFrequency: 0.02, numOctaves: 3 } }'
  },
  'feDisplacementMap': {
    description: 'Warps/distorts the image based on color values from another source. Perfect for wavy, liquid, or turbulent effects.',
    params: [
      { key: 'scale', default: 10, description: 'Displacement strength — higher = more distortion.' },
      { key: 'xChannelSelector', default: 'R', description: "Color channel driving horizontal displacement — 'R' | 'G' | 'B' | 'A'." },
      { key: 'yChannelSelector', default: 'G', description: "Color channel driving vertical displacement — 'R' | 'G' | 'B' | 'A'." }
    ],
    example: 'filters:\n  - { mode: svg, type: feTurbulence, value: { baseFrequency: 0.02, numOctaves: 3 } }\n  - { mode: svg, type: feDisplacementMap, value: { scale: 20 } }',
    tip: 'Add a Turbulence filter right before this one — Turbulence generates the displacement map this filter distorts by.'
  },
  'tint': {
    description: 'Composites a flat color wash over the content — a cheap way to apply an alert/status tint. Requires an SVG root (not supported on data-grid).',
    params: [
      { key: 'color', default: 'rgba(0,0,0,0.4)', description: 'Tint color — the alpha channel controls how much content shows through.' }
    ],
    example: "filters:\n  - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }"
  }
};
