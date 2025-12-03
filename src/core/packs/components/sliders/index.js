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
 */
const sliderHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 200 30" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Horizontal Slider Component</title>
    <description>Simple horizontal slider track for pill/gauge content</description>
  </metadata>
  
  <!-- Track zone: where pills/gauge content is injected -->
  <g id="track-zone" 
     data-zone="track" 
     data-bounds="0,5,200,20">
    <!-- Card injects pills/gauge here -->
  </g>
  
  <!-- Control zone: where the invisible range input is positioned -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,200,30"
        x="0" y="0"
        width="200" height="30"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Simple Vertical Slider
 * Basic vertical slider with track zone
 */
const sliderVerticalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 30 200" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Vertical Slider Component</title>
    <description>Simple vertical slider track for pill/gauge content</description>
  </metadata>
  
  <!-- Track zone: where pills/gauge content is injected -->
  <g id="track-zone" 
     data-zone="track" 
     data-bounds="5,0,20,200">
    <!-- Card injects pills/gauge here -->
  </g>
  
  <!-- Control zone: where the invisible range input is positioned -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,30,200"
        x="0" y="0"
        width="30" height="200"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Bordered Horizontal Slider
 * Horizontal slider with LCARS-style left border/cap
 */
const sliderBorderedHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 300 50" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Bordered Horizontal Slider</title>
    <description>Horizontal slider with LCARS border cap on left</description>
  </metadata>
  
  <!-- Static border elements -->
  <rect id="border-left"
        x="0" y="0"
        width="60" height="50"
        rx="25" ry="25"
        fill="{{BORDER_COLOR}}" />
  
  <rect id="border-top"
        x="35" y="0"
        width="265" height="15"
        fill="{{BORDER_COLOR}}" />
  
  <!-- Track zone: right of border, below top bar -->
  <g id="track-zone" 
     data-zone="track" 
     data-bounds="70,20,220,20">
    <!-- Card injects pills/gauge here -->
  </g>
  
  <!-- Control zone: covers the entire track interaction area -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="70,15,220,30"
        x="70" y="15"
        width="220" height="30"
        fill="none"
        stroke="none"
        pointer-events="none" />
  
  <!-- Text zone: for value/label display -->
  <g id="text-zone"
     data-zone="text"
     data-bounds="5,15,50,30"
     transform="translate(5, 15)">
    <!-- Card injects text here -->
  </g>
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
 */
const gaugeHorizontalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Horizontal Gauge</title>
    <description>Horizontal gauge with scale zone for tick marks</description>
  </metadata>
  
  <!-- Border/frame -->
  <rect id="frame"
        x="0" y="0"
        width="300" height="60"
        rx="8" ry="8"
        fill="none"
        stroke="{{BORDER_COLOR}}"
        stroke-width="2" />
  
  <!-- Track zone: main gauge area -->
  <g id="track-zone" 
     data-zone="track" 
     data-bounds="10,10,280,25">
    <!-- Card injects gauge content here -->
  </g>
  
  <!-- Scale zone: for tick marks below track -->
  <g id="scale-zone"
     data-zone="scale"
     data-bounds="10,38,280,15"
     transform="translate(10, 38)">
    <!-- Card injects tick marks here -->
  </g>
  
  <!-- Text zone: value display -->
  <g id="text-zone"
     data-zone="text"
     data-bounds="250,10,45,40"
     transform="translate(250, 10)">
    <!-- Card injects value text here -->
  </g>
  
  <!-- Control zone: for potential interactive mode -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="10,5,280,50"
        x="10" y="5"
        width="280" height="50"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Slider component registry
 * @type {Object.<string, string>}
 */
export const sliderComponents = {
    'slider-horizontal': sliderHorizontalSvg,
    'slider-vertical': sliderVerticalSvg,
    'slider-bordered-horizontal': sliderBorderedHorizontalSvg,
    'slider-picard-vertical': sliderPicardVerticalSvg,
    'slider-minimal': sliderMinimalSvg,
    'gauge-horizontal': gaugeHorizontalSvg,
    // Aliases for convenience
    'horizontal': sliderHorizontalSvg,
    'vertical': sliderVerticalSvg,
    'minimal': sliderMinimalSvg,
    'picard-vertical': sliderPicardVerticalSvg,
    'picard': sliderPicardVerticalSvg
};

/**
 * Get a slider component by name
 * @param {string} name - Component name
 * @returns {string|undefined} SVG content or undefined if not found
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
