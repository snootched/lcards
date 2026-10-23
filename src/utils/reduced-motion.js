/**
 * prefers-reduced-motion, read live.
 *
 * Home Assistant's --ha-animation-duration-* variables collapse under the media
 * query, but JS-driven motion (anime.js, canvas loops, WAAPI) has to ask. Read it
 * at the moment motion would start rather than caching it at startup: the user
 * can flip the OS setting while a dashboard is open.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

/** @returns {MediaQueryList|null} */
function _mediaQuery() {
    try {
        return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(QUERY)
            : null;
    } catch {
        return null;
    }
}

/**
 * True when the user asked the system to minimise non-essential motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    return _mediaQuery()?.matches === true;
}

/**
 * Call `callback(reduced)` whenever the setting changes.
 * @param {(reduced: boolean) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onReducedMotionChange(callback) {
    const mql = _mediaQuery();
    if (!mql || typeof mql.addEventListener !== 'function') return () => {};
    /** @param {MediaQueryListEvent} event */
    const listener = (event) => callback(event.matches === true);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
}
