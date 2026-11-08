/**
 * Combine rule overlay patches by overlay id. RulesEngine hands them highest
 * priority first; merging from the end lets the highest-priority rule win
 * while rules that patch different keys combine.
 */
import { deepMerge } from '../config-manager/merge-helpers.js';

/**
 * @param {Array<{ id?: string } & Record<string, any>>} overlayPatches - highest priority first
 * @returns {Record<string, any>} overlay id -> merged patch
 */
export function mergeOverlayPatches(overlayPatches) {
    /** @type {Record<string, any>} */
    const byId = {};
    for (const patch of [...overlayPatches].reverse()) {
        if (!patch?.id) continue;
        byId[patch.id] = byId[patch.id] ? deepMerge(byId[patch.id], patch) : patch;
    }
    return byId;
}
