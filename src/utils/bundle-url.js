/**
 * Built-in asset URLs, resolved against the folder the bundle was loaded from.
 *
 * Pack data, docs examples and user configs write built-in asset URLs as
 * `/lcards/...` (fonts, sounds, MSD SVGs, images, models). In Home Assistant
 * the bundle is served from `/lcards/`, so those URLs are right as written.
 * Elsewhere (the versioned docs site serves it from `/dev/lcards/` or
 * `/v/<version>/lcards/`) a root-absolute `/lcards/...` would fetch another
 * version's copy, so every place that fetches, links or uses such a URL as a
 * source passes it through `bundleUrl()` at use time. The loader stub
 * (`src/lcards.js`) records its folder in `window.__LCARDS_BOOT__.base`.
 *
 * Pure and safe in node: with no `window` (or no recorded base) the base is
 * `/lcards/` and every URL comes back unchanged.
 *
 * @module utils/bundle-url
 */

/** Where built-in asset URLs are written to live. */
export const BUILTIN_PREFIX = '/lcards/';

/**
 * The folder the bundle was loaded from, ending in `/` (Home Assistant:
 * `/lcards/`; dev docs: `/dev/lcards/`).
 * @returns {string}
 */
export function bundleBase() {
    try {
        const base = typeof window !== 'undefined' ? window.__LCARDS_BOOT__?.base : undefined;
        return typeof base === 'string' && base.endsWith('/') ? base : BUILTIN_PREFIX;
    } catch (_e) {
        return BUILTIN_PREFIX;
    }
}

/**
 * Resolve a built-in asset URL against the bundle folder: `/lcards/<rest>`
 * becomes `bundleBase() + <rest>`. Anything else (`/lcards-user/...`,
 * `/local/...`, `http(s)://...`, `builtin:` keys, `data:`, relative paths,
 * non-strings) comes back unchanged.
 * @template T
 * @param {T} url
 * @returns {T | string}
 */
export function bundleUrl(url) {
    if (typeof url !== 'string' || !url.startsWith(BUILTIN_PREFIX)) return url;
    const base = bundleBase();
    if (base === BUILTIN_PREFIX) return url;
    return base + url.slice(BUILTIN_PREFIX.length);
}

