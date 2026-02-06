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

import picardComponent from './picard.js';

/**
 * Basic Slider Component (Unified)
 * Square viewBox with preserveAspectRatio="none" for flexible orientation
 * Orientation controlled by style.track.orientation config, not component
 * ViewBox: 100x100 (normalized, stretches to fit container)
 */
const sliderBasicSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <title>LCARdS Basic Slider Component</title>
    <description>Unified slider shell for horizontal or vertical orientation</description>
  </metadata>

  <!-- Track zone: normalized to square -->
  <g id="track-zone"
     data-zone="track"
     data-bounds="10,10,80,80">
    <!-- Card injects pills/gauge here -->
  </g>

  <!-- Control zone: full area -->
  <rect id="control-zone"
        data-zone="control"
        data-bounds="0,0,100,100"
        x="0" y="0"
        width="100" height="100"
        fill="none"
        stroke="none"
        pointer-events="none" />
</svg>`;

/**
 * Slider component registry
 *
 * Base component: 'basic' (orientation-agnostic, stretches via CSS)
 * Styled components: Decorative variants with locked orientation (e.g., 'picard')
 *
 * Orientation is controlled by style.track.orientation config, NOT component choice.
 * Component determines visual shell (plain vs. decorated), not layout direction.
 *
 * @type {Object.<string, {svg: string, orientation: string, features: string[]}>}
 */
export const sliderComponents = {
    // Basic shell - works with any orientation
    'basic': {
        svg: sliderBasicSvg,
        orientation: 'auto',  // Adapts to style.track.orientation
        features: []
    },
    
    // Picard component - render function architecture
    'picard': picardComponent
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

