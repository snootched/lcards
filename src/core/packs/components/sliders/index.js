/**
 * Slider Component Registry
 *
 * SVG components for LCARdS Slider cards with data-zone attributes
 * for dynamic content injection. Each component defines:
 * - Static visual structure (borders, masks, elbows)
 * - Zone markers (data-zone="track", "control", "text") with bounds
 *
 * @module core/packs/components/sliders
 */

/**
 * Simple Horizontal Slider
 * Basic horizontal slider with track zone
 * No borders - just the track area
 * ViewBox: 400x56 (matches HA 1 row height, standard card width)
 */
const sliderHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 400 56" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Horizontal Slider Component</title>
    <description>Simple horizontal slider track for pill/gauge content</description>
  </metadata>

  <!-- Track zone: where pills/gauge content is injected -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="10,8,380,40">
    <!-- Card injects pills/gauge here -->
  </g>

  <!-- Control zone: where the invisible range input is positioned -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,400,56"
        x="0" y="0"
        width="400" height="56"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Simple Vertical Slider
 * Basic vertical slider with track zone
 * ViewBox: 56x300 (matches HA 1 row width, tall for vertical orientation)
 * preserveAspectRatio="none" allows stretching to fill container height
 */
const sliderVerticalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 56 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Vertical Slider Component</title>
    <description>Simple vertical slider track for pill/gauge content</description>
  </metadata>

  <!-- Track zone: where pills/gauge content is injected -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="8,10,40,280">
    <!-- Card injects pills/gauge here -->
  </g>

  <!-- Control zone: where the invisible range input is positioned -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,56,300"
        x="0" y="0"
        width="56" height="300"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Bordered Horizontal Slider
 * Horizontal slider with CSS borders (L-shaped elbow)
 * Borders applied via CSS, SVG defines only track zone with insets
 */
const sliderBorderedHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Bordered Horizontal Slider</title>
    <description>Horizontal slider with CSS border (left cap + top bar)</description>
  </metadata>

  <!-- Track zone: inset for track content with margins -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="5,5,95,40">
    <!-- Card injects pills/gauge here -->
    <!-- Margins: top=5, left=5, right=0, bottom=0 (from track edge) -->
  </g>

  <!-- Control zone: covers the track interaction area -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,100,50"
        x="0" y="0"
        width="100" height="50"
        fill="none"
        stroke="none"
        pointer-events="none" />

  <!-- Text zone not needed - text positioned via CSS overlay -->
</svg>`;

/**
 * Picard-style Vertical Slider
 * Vertical slider with segmented elbow borders (TNG aesthetic)
 */
const sliderPicardVerticalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 80 300" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Picard Vertical Slider</title>
    <description>Vertical slider with segmented elbow borders in TNG Picard style</description>
  </metadata>

  <!-- Outer elbow - top -->
  <path id="elbow-top-outer"
        d="M 0,0 L 50,0 L 50,30 A 30,30 0 0 0 20,60 L 0,60 Z"
        fill="{{BORDER_COLOR}}" />

  <!-- Inner elbow - top -->
  <path id="elbow-top-inner"
        d="M 0,65 L 15,65 L 15,80 A 15,15 0 0 0 30,95 L 50,95 L 50,100 L 0,100 Z"
        fill="{{BORDER_COLOR}}" />

  <!-- Outer elbow - bottom -->
  <path id="elbow-bottom-outer"
        d="M 0,300 L 50,300 L 50,270 A 30,30 0 0 1 20,240 L 0,240 Z"
        fill="{{BORDER_COLOR}}" />

  <!-- Inner elbow - bottom -->
  <path id="elbow-bottom-inner"
        d="M 0,235 L 15,235 L 15,220 A 15,15 0 0 1 30,205 L 50,205 L 50,200 L 0,200 Z"
        fill="{{BORDER_COLOR}}" />

  <!-- Track zone: center vertical strip -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="55,105,20,90">
    <!-- Card injects pills/gauge here -->
  </g>

  <!-- Control zone: full height for interaction -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="50,100,25,100"
        x="50" y="100"
        width="25" height="100"
        fill="none"
        stroke="none"
        pointer-events="none" />

  <!-- Text zone: right side for labels -->
  <g id="text-zone"
     data-zone="text"
     data-bounds="55,5,20,50"
     transform="translate(55, 5)">
    <!-- Card injects text here -->
  </g>
</svg>`;

/**
 * Minimal Slider
 * Just the track zone with no visual chrome
 * Useful for custom-styled containers
 */
const sliderMinimalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Minimal Slider</title>
    <description>Minimal slider with just track zone - no borders</description>
  </metadata>

  <!-- Track zone: full width -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="0,2,100,16">
    <!-- Card injects pills/gauge here -->
  </g>

  <!-- Control zone: same as track -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,100,20"
        x="0" y="0"
        width="100" height="20"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Gauge with Scale
 * Horizontal gauge with tick marks and labels zone
 * Zero margins for seamless ruler design
 */
const gaugeHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Horizontal Gauge</title>
    <description>Horizontal gauge with scale zone for tick marks</description>
  </metadata>

  <!-- Border/frame (hidden for seamless ruler design) -->
  <rect id="frame"
        x="0" y="0"
        width="300" height="60"
        rx="8" ry="8"
        fill="none"
        stroke="none"
        stroke-width="0" />

  <!-- Track zone: main gauge area (zero margins for seamless design) -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="0,0,300,46">
    <!-- Card injects gauge content here -->
  </g>

  <!-- Scale zone: for tick marks below track (currently unused) -->
  <g id="scale-zone"
     data-zone="scale"
     data-bounds="0,46,300,14"
     transform="translate(0, 46)">
    <!-- Card injects tick marks here -->
  </g>

  <!-- Text zone: value display -->
  <g id="text-zone"
     data-zone="text"
     data-bounds="240,5,55,40"
     transform="translate(240, 5)">
    <!-- Card injects value text here -->
  </g>

  <!-- Control zone: for potential interactive mode -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,300,60"
        x="0" y="0"
        width="300" height="60"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Slider component registry with metadata
 * Each component defines:
 * - svg: The SVG markup
 * - orientation: 'horizontal' or 'vertical'
 * - supportsMode: Array of supported modes ['slider', 'gauge']
 * - features: Array of feature flags ['bordered', 'segmented', etc.]
 *
 * @type {Object.<string, {svg: string, orientation: string, supportsMode: string[], features: string[]}>}
 */
export const sliderComponents = {
    'slider-horizontal': {
        svg: sliderHorizontalSvg,
        orientation: 'horizontal',
        supportsMode: ['slider', 'gauge'],
        features: ['minimal']
    },
    'slider-vertical': {
        svg: sliderVerticalSvg,
        orientation: 'vertical',
        supportsMode: ['slider', 'gauge'],
        features: ['minimal']
    },
    'slider-bordered-horizontal': {
        svg: sliderBorderedHorizontalSvg,
        orientation: 'horizontal',
        supportsMode: ['slider', 'gauge'],
        features: ['bordered', 'text-zone']
    },
    'slider-picard-vertical': {
        svg: sliderPicardVerticalSvg,
        orientation: 'vertical',
        supportsMode: ['slider', 'gauge'],
        features: ['bordered', 'segmented', 'text-zone']
    },
    'slider-minimal': {
        svg: sliderMinimalSvg,
        orientation: 'horizontal',
        supportsMode: ['slider', 'gauge'],
        features: ['minimal']
    },
    'gauge-horizontal': {
        svg: gaugeHorizontalSvg,
        orientation: 'horizontal',
        supportsMode: ['gauge'],
        features: ['bordered', 'text-zone', 'scale-marks']
    },
    // Aliases for convenience - reference existing definitions
    'horizontal': {
        svg: sliderHorizontalSvg,
        orientation: 'horizontal',
        supportsMode: ['slider', 'gauge'],
        features: ['minimal']
    },
    'vertical': {
        svg: sliderVerticalSvg,
        orientation: 'vertical',
        supportsMode: ['slider', 'gauge'],
        features: ['minimal']
    },
    'minimal': {
        svg: sliderMinimalSvg,
        orientation: 'horizontal',
        supportsMode: ['slider', 'gauge'],
        features: ['minimal']
    },
    'picard-vertical': {
        svg: sliderPicardVerticalSvg,
        orientation: 'vertical',
        supportsMode: ['slider', 'gauge'],
        features: ['bordered', 'segmented', 'text-zone']
    },
    'picard': {
        svg: sliderPicardVerticalSvg,
        orientation: 'vertical',
        supportsMode: ['slider', 'gauge'],
        features: ['bordered', 'segmented', 'text-zone']
    }
};

/**
 * Get a slider component by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component object with svg, orientation, supportsMode, and features, or undefined if not found
 */
export function getSliderComponent(name) {
    return sliderComponents[name];
}

/**
 * Check if a slider component exists
 * @param {string} name - Component name
 * @returns {boolean} True if component exists
 */
export function hasSliderComponent(name) {
    return name in sliderComponents;
}

/**
 * Get all available slider component names
 * @returns {string[]} Array of component names
 */
export function getSliderComponentNames() {
    return Object.keys(sliderComponents);
}
