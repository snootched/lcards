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
 * Picard-style Vertical Slider
 * Vertical slider with segmented elbow borders (TNG aesthetic)
 * Has decorative LCARS elbows baked into SVG - track content injected dynamically
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
 * Slider component registry
 *
 * Base templates: horizontal and vertical (borders injected dynamically via style.border config)
 * Complex shapes: Picard and other LCARS-styled variants with decorative elbows baked into SVG
 * Track content: Pills or gauge ruler controlled by style.track.type config
 *
 * @type {Object.<string, {svg: string, orientation: string, features: string[]}>}
 */
export const sliderComponents = {
    // Simple base templates - borders added via style.border config
    'horizontal': {
        svg: sliderHorizontalSvg,
        orientation: 'horizontal',
        features: []
    },
    'vertical': {
        svg: sliderVerticalSvg,
        orientation: 'vertical',
        features: []
    },

    // Complex LCARS-styled components with decorative elbows/borders in SVG
    'picard': {
        svg: sliderPicardVerticalSvg,
        orientation: 'vertical',
        features: ['decorative-borders', 'segmented-elbows', 'text-zone']
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
