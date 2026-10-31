/**
 * @fileoverview Undo and redo for the Astrometrics Studio's working copy.
 *
 * Every commit records the config it replaces. Commits that change the same
 * paths within a short window (typing in one field, dragging one slider)
 * merge into one step, so undo goes back a field at a time, not a key at a
 * time. A commit marked `step` (a starter, the YAML tab) never merges.
 *
 * Pure: no DOM, no Lit.
 */

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Commits closer than this that change the same paths merge, ms */
export const COALESCE_MS = 800;

/**
 * The paths whose values differ between two configs, sorted ("objects.2.radius").
 * A list that changed length counts as one change at the list.
 * @param {any} a
 * @param {any} b
 * @param {string} [at]
 * @param {string[]} [out]
 * @returns {string[]}
 */
export function changedPaths(a, b, at = '', out = []) {
  if (a === b) return out;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    a.forEach((v, i) => changedPaths(v, b[i], at ? `${at}.${i}` : String(i), out));
  } else if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) changedPaths(a[k], b[k], at ? `${at}.${k}` : k, out);
  } else if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push(at);
  }
  return out;
}

/**
 * @param {{ limit?: number, now?: () => number }} [opts]
 */
export function createHistory({ limit = 100, now = () => Date.now() } = {}) {
  /** @type {any[]} configs before each step, oldest first */
  let past = [];
  /** @type {any[]} configs undone, the next redo last */
  let future = [];
  /** @type {{ key: string, at: number } | null} the last step, while it may still merge */
  let last = null;

  return {
    /**
     * Record a commit: `prev` is the config it replaces.
     * @param {any} prev
     * @param {any} next
     * @param {{ step?: boolean }} [opts] - step: never merge with the last one
     */
    push(prev, next, { step = false } = {}) {
      const paths = changedPaths(prev, next);
      if (!paths.length) return;
      const key = paths.join('|');
      const t = now();
      future = [];
      if (!step && last && last.key === key && t - last.at < COALESCE_MS && past.length) {
        last.at = t;
        return;
      }
      past.push(prev);
      if (past.length > limit) past = past.slice(past.length - limit);
      last = step ? null : { key, at: t };
    },
    /**
     * Step back: the config to show, or null when there is nothing to undo.
     * @param {any} current
     */
    undo(current) {
      if (!past.length) return null;
      last = null;
      future.push(current);
      return past.pop();
    },
    /**
     * Step forward again: the config to show, or null.
     * @param {any} current
     */
    redo(current) {
      if (!future.length) return null;
      last = null;
      past.push(current);
      return future.pop();
    },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    clear() { past = []; future = []; last = null; }
  };
}
