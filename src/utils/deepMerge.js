/**
 * @fileoverview Deep merge utilities.
 *
 * `deepMerge` mutates the target object (preserving original behaviour).
 * `immutableDeepMerge` returns a new object, leaving both inputs untouched.
 *
 * @module utils/deepMerge
 */

export function isPlain(o) {
  return o && typeof o === 'object' && !Array.isArray(o);
}

/**
 * Deep merge that MUTATES the target object (original behavior)
 * Use with caution - mutates the first argument!
 */
export function deepMerge(target, source) {
  if (!isPlain(source)) return source;
  if (!isPlain(target)) target = {};
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];
    if (isPlain(sv) && isPlain(tv)) {
      target[k] = deepMerge(tv, sv);
    } else {
      // Arrays & scalars replace (per spec).
      target[k] = sv;
    }
  }
  return target;
}

/**
 * Deep merge that creates a NEW object without mutating inputs
 * This is the safe version for preset inheritance where we need to avoid
 * mutating cached preset objects
 *
 * @param {Object} target - Base object (will NOT be mutated)
 * @param {Object} source - Override object (will NOT be mutated)
 * @returns {Object} New merged object
 */
export function deepMergeImmutable(target, source) {
  // If source is not a plain object, return it as-is
  if (!isPlain(source)) return source;

  // If target is not a plain object, just clone source
  if (!isPlain(target)) {
    return deepMergeImmutable({}, source);
  }

  // Create fresh result object
  const result = {};

  // First, copy all properties from target
  for (const k of Object.keys(target)) {
    const tv = target[k];
    if (isPlain(tv)) {
      // Deep clone nested objects
      result[k] = deepMergeImmutable({}, tv);
    } else {
      // Copy scalars and arrays
      result[k] = tv;
    }
  }

  // Then, merge/override with source properties
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];

    if (isPlain(sv) && isPlain(tv)) {
      // Both are objects - recursive merge
      result[k] = deepMergeImmutable(tv, sv);
    } else if (isPlain(sv)) {
      // Source is object, target is not - deep clone source
      result[k] = deepMergeImmutable({}, sv);
    } else {
      // Scalar or array - replace
      result[k] = sv;
    }
  }

  return result;
}
