/**
 * @fileoverview Normalises raw timeline definitions into a consistent shape.
 *
 * Called during the MSD rendering pipeline to produce the `desired` timeline
 * array that `TimelineDiffer` compares against the currently running set.
 */
import { deepMerge } from '../../utils/deepMerge.js';

/**
 * Normalise an array of raw timeline definition objects.
 * Each entry is cloned and its nested `steps` params are deep-merged
 * so downstream code can safely mutate without affecting the config source.
 *
 * @param {Array<Object>} [timelineDefs=[]] Raw timeline definitions from config.
 * @returns {Array<{ id: string, globals: Object, steps: Array<Object> }>}
 */
export function resolveDesiredTimelines(timelineDefs = []) {
  return timelineDefs.map(tl => {
    const globals = { ...(tl.globals || {}) };
    const steps = (tl.steps || []).map(s => ({
      targets: s.targets,
      preset: s.preset,
      params: deepMerge({}, s.params || {}),
      offset: s.offset
    }));
    return {
      id: tl.id,
      globals,
      steps
    };
  });
}
