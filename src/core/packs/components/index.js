/**
 * Component Registry
 *
 * Centralized registry for all card component types. This is the **central lookup**
 * used by CoreConfigManager to resolve component configurations for all card types.
 *
 * Components provide reusable UI patterns with SVG shapes, segment configurations,
 * and theme token references. The registry supports two structure types:
 *
 * 1. **Legacy preset structure** (D-Pad):
 *    - Object with id, name, description, version, segments
 *    - Example: { dpad: { id: 'dpad', segments: {...} } }
 *
 * 2. **Component registry structure** (Sliders, future types):
 *    - Object with svg, orientation, features properties
 *    - Example: { basic: { svg: '...', orientation: 'auto', features: [] } }
 *
 * Future component types (button, elbow, MSD) will be added here using the same
 * spread pattern for seamless integration.
 *
 * @module core/packs/components
 */

import { dpadComponentPreset } from './dpad.js';
import { sliderComponents } from './sliders/index.js';

/**
 * Component registry mapping component names to their presets
 * @type {Object.<string, Object>}
 */
export const components = {
    dpad: dpadComponentPreset,  // D-Pad preset (legacy structure)
    ...sliderComponents          // Slider registry (basic, picard)
};

/**
 * Get a component preset by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component preset or undefined if not found
 */
export function getComponent(name) {
    return components[name];
}

/**
 * Check if a component exists
 * @param {string} name - Component name
 * @returns {boolean} True if component exists
 */
export function hasComponent(name) {
    return name in components;
}

/**
 * Get all available component names
 * @returns {string[]} Array of component names
 */
export function getComponentNames() {
    return Object.keys(components);
}

/**
 * Get component metadata
 * @param {string} name - Component name
 * @returns {Object|null} Component metadata (id, name, description, version) or null
 */
export function getComponentMetadata(name) {
    const component = components[name];
    if (!component) return null;

    return {
        id: component.id,
        name: component.name,
        description: component.description,
        version: component.version,
    };
}
