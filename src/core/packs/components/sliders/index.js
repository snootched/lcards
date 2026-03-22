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

import defaultComponent from './default.js';
import picardComponent from './picard.js';
import demoComponent from './demo.js';
import shapedComponent from './shaped.js';

/**
 * Slider component registry
 *
 * Base component: 'default' (orientation-agnostic, render function architecture)
 * Styled components: Decorative variants with locked orientation (e.g., 'picard')
 *
 * Orientation is controlled by style.track.orientation config, NOT component choice.
 * Component determines visual shell (plain vs. decorated), not layout direction.
 *
 * @type {Object.<string, any>}
 */
export const sliderComponents = {
    // Default component - render function architecture
    'default': defaultComponent,

    // Picard component - render function architecture
    'picard': picardComponent,

    // Demo component - comprehensive feature showcase (development/testing)
    'demo': demoComponent,

    // Shaped component - generic clip-path shell with exterior label bands
    // Shape type (lozenge, rect, rounded, diamond, hexagon, polygon, path) is
    // configured via style.shaped.type — defaults to lozenge.
    'shaped': shapedComponent
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

