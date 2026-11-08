/**
 * resolveAnimParams - Shared animation parameter resolution utilities
 *
 * Handles map_range descriptor resolution for animation parameters.
 * Used by both RulesEngine (apply.animations) and AnimationManager
 * (config.animations / TriggerManager) so that map_range works in all paths.
 *
 * Also provides resolveEntityValue() for TriggerManager's while-condition
 * and to_state/from_state evaluation with attribute and brightness_pct support.
 *
 * @module core/animation/resolveAnimParams
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { mapRangeOutput } from '../../utils/linearMap.js';

// ─────────────────────────────────────────────────────────────────────────────
// Entity value resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the value to compare for a given entity and optional attribute.
 *
 * Supports the virtual "brightness_pct" attribute which computes
 * Math.round(attributes.brightness / 2.55) — a 0-100 percentage — so users
 * don't have to convert the raw 0-255 HA brightness value themselves.
 *
 * @param {string}  entityId   - HA entity ID (e.g. 'light.kitchen')
 * @param {Object}  hass       - Home Assistant instance
 * @param {string}  [attribute] - Attribute name, 'brightness_pct', or undefined (→ entity.state)
 * @returns {string|number|undefined} Resolved value, or undefined if entity/attribute not found
 */
export function resolveEntityValue(entityId, hass, attribute) {
  const entityObj = hass?.states?.[entityId];
  if (!entityObj) return undefined;

  if (!attribute) {
    return entityObj.state;
  }

  if (attribute === 'brightness_pct') {
    const brightness = entityObj.attributes?.brightness;
    return brightness !== undefined ? Math.round(brightness / 2.55) : undefined;
  }

  const val = entityObj.attributes?.[attribute];
  return val !== undefined ? val : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// map_range resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a single animation parameter value.
 *
 * If the value is a map_range descriptor, linearly interpolates the entity's
 * current value into the output range. Otherwise returns it as-is.
 *
 * Supports:
 * - Numeric output ranges:     output: [0, 1000]
 * - Colour interpolation:      output: ['#00ff88', 'var(--lcars-red)'] (any colour form LCARdS accepts)
 * - Virtual attribute:         attribute: 'brightness_pct'  (0-100, computed from brightness/2.55)
 *
 * map_range descriptor shape:
 * {
 *   map_range: {
 *     entity:    'sensor.grid_power',   // Required
 *     attribute: 'brightness_pct',      // Optional — defaults to entity.state
 *     input:     [0, 5000],             // Required [inMin, inMax]
 *     output:    [8, 0.5],              // Required [outMin, outMax]: two numbers or two colours
 *     clamp:     true                   // Optional, default true
 *   }
 * }
 *
 * @param {*}      paramValue - Raw param (may be a map_range descriptor or plain value)
 * @param {Object} hass       - Home Assistant instance for entity lookup
 * @returns {*} Resolved value, or original value if not a descriptor
 */
export function resolveAnimParam(paramValue, hass) {
  if (!paramValue || typeof paramValue !== 'object' || !paramValue.map_range) {
    return paramValue;
  }

  const cfg = paramValue.map_range;
  const entityId = cfg.entity;
  if (!entityId) {
    lcardsLog.warn('[resolveAnimParams] map_range missing required "entity" field:', cfg);
    return undefined;
  }

  const rawValue = resolveEntityValue(entityId, hass, cfg.attribute);
  if (rawValue === undefined) {
    lcardsLog.warn(`[resolveAnimParams] map_range: entity not found or attribute missing: ${entityId}${cfg.attribute ? `.${cfg.attribute}` : ''}`);
    return undefined;
  }

  const numVal = Number(rawValue);
  if (!Number.isFinite(numVal)) {
    lcardsLog.warn(`[resolveAnimParams] map_range: value "${rawValue}" for "${entityId}" is not numeric`);
    return undefined;
  }

  const [inMin, inMax] = cfg.input || [];
  const clamp = cfg.clamp !== false;

  if (![inMin, inMax].every(v => Number.isFinite(Number(v)))) {
    lcardsLog.warn('[resolveAnimParams] map_range: invalid "input" range:', cfg.input);
    return undefined;
  }

  if (!Array.isArray(cfg.output) || cfg.output.length !== 2) {
    lcardsLog.warn('[resolveAnimParams] map_range: "output" must be a 2-element array:', cfg.output);
    return undefined;
  }

  const result = mapRangeOutput(numVal, Number(inMin), Number(inMax), cfg.output, clamp);
  if (result === undefined) {
    lcardsLog.warn('[resolveAnimParams] map_range: "output" must be two numbers or two colours:', cfg.output);
    return undefined;
  }
  lcardsLog.debug(`[resolveAnimParams] map_range: ${entityId}=${numVal} → ${result}`);
  return result;
}

/**
 * Resolve all map_range descriptors in an animation command.
 *
 * Walks `animCmd.duration`, `animCmd.delay`, and all entries in `animCmd.params`,
 * resolving any that are map_range descriptors. Returns a new object — does not
 * mutate the original.
 *
 * @param {Object} animCmd - Animation command object
 * @param {Object} hass    - Home Assistant instance
 * @returns {Object} New animation command with all map_range values resolved
 */
export function resolveAnimCommandParams(animCmd, hass) {
  const resolved = { ...animCmd };

  for (const field of ['duration', 'delay']) {
    if (resolved[field] !== undefined) {
      resolved[field] = resolveAnimParam(resolved[field], hass);
    }
  }

  if (resolved.params && typeof resolved.params === 'object') {
    const resolvedParams = {};
    for (const [key, val] of Object.entries(resolved.params)) {
      resolvedParams[key] = resolveAnimParam(val, hass);
    }
    resolved.params = resolvedParams;
  }

  return resolved;
}
