/**
 * Animation Presets - Modernized MSD System
 *
 * Ported from legacy lcards-anim-presets.js with modernizations:
 * - No direct DOM manipulation (handled by AnimationManager target resolution)
 * - Clean separation of anime.js params and element styles
 * - Support for multi-target animations via AnimationManager
 * - Simplified configuration with smart defaults
 *
 * Each preset returns:
 * {
 *   anime: { ...anime.js parameters },
 *   styles: { ...CSS properties to set on target(s) }
 * }
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { deepMerge } from '../../utils/deepMerge.js';

const _presets = new Map();

/**
 * Register an animation preset
 * @param {string} name - Preset name
 * @param {Function} builder - Preset function that returns {anime, styles}
 */
export function registerAnimationPreset(name, builder) {
  _presets.set(name, builder);
  lcardsLog.debug(`[AnimationPresets] Registered preset: ${name}`);
}

/**
 * Get an animation preset by name
 * @param {string} name - Preset name
 * @returns {Function|null} Preset function or null if not found
 */
export function getAnimationPreset(name) {
  return _presets.get(name);
}

/**
 * List all registered preset names
 * @returns {string[]} Array of preset names
 */
export function listAnimationPresets() {
  return Array.from(_presets.keys());
}

/**
 * Merge animation parameters
 * @param {Object} base - Base parameters
 * @param {Object} override - Override parameters
 * @returns {Object} Merged parameters
 */
export function mergeAnimationParams(base, override) {
  return deepMerge({ ...(base || {}) }, override || {});
}

// ==============================================================================
// BUILTIN ANIMATION PRESETS
// ==============================================================================
// 
// Builtin animation presets have been moved to:
// src/core/packs/animations/presets/index.js
//
// They are registered during pack loading via registerBuiltinAnimationPresets()
// ==============================================================================
