/**
 * @fileoverview ImageLoader — singleton image cache for background and texture effects.
 *
 * Caches HTMLImageElement instances by URL so the same image is only fetched once per
 * page load regardless of how many cards reference it.  Both `ImageEffect` (background
 * animation layer) and `ImageTextureEffect` (shape texture layer) import from here.
 *
 * CORS note: `crossOrigin = 'anonymous'` is required so Canvas2D `drawImage()` does not
 * taint the canvas when drawing images served from HA's /local/ static file server.
 * External HTTPS images from CORS-enabled CDNs will also work transparently.
 *
 * HTTP warning: plain http:// URLs will be blocked by the browser as mixed content when
 * HA is served over HTTPS.  A warning is logged at load time to surface this early.
 *
 * @module core/packs/shared/ImageLoader
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

/** @type {Map<string, Promise<HTMLImageElement>>} */
const _cache = new Map();

/**
 * Resolve a `builtin:<key>` URL via AssetManager, if available.
 * Returns the resolved URL string, or null if the key is not registered.
 *
 * @param {string} key - Asset key (without 'builtin:' prefix).
 * @returns {string|null}
 */
function _resolveBuiltin(key) {
    try {
        return window?.lcards?.core?.assetManager?.resolveImageUrl?.(key) ?? null;
    } catch (_) {
        return null;
    }
}

/**
 * Resolve a `media-source://…` content ID to a real URL via AssetManager
 * (which calls the HA `media_source/resolve_media` websocket command).
 * Returns null if unresolvable (no HASS connection, invalid ID, etc.).
 *
 * @param {string} mediaContentId - A `media-source://…` content ID.
 * @returns {Promise<string|null>}
 */
async function _resolveMediaSource(mediaContentId) {
    try {
        return await (window?.lcards?.core?.assetManager?.resolveMediaSourceUrl?.(mediaContentId) ?? null);
    } catch (_) {
        return null;
    }
}

/**
 * Load an `<img>` element from an already-resolved, browser-loadable URL.
 * Shared by the direct-URL path and the media-source resolution path.
 *
 * @param {string} url - A concrete, loadable image URL.
 * @returns {Promise<HTMLImageElement>}
 */
function _loadImageElement(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // required for canvas drawImage — avoids tainted-canvas errors
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error(`[ImageLoader] Failed to load: "${url}"`));
        img.src = url;
    });
}

/**
 * Load (or retrieve from cache) an image by URL.
 *
 * Accepts:
 * - `/local/` paths       — HA static file server
 * - `https://` URLs       — external CORS-enabled sources
 * - `builtin:<key>`       — named entries from the AssetManager image registry
 * - `media-source://…`    — HA media library items, resolved via AssetManager
 * - Any other browser-loadable URL
 *
 * @param {string} url - Image source: URL, /local/ path, builtin:key, or media-source:// id.
 * @returns {Promise<HTMLImageElement>} Resolves with the loaded image element.
 *   Rejects on network or CORS error — callers should handle gracefully.
 */
export function loadImage(url) {
    if (!url) return Promise.reject(new Error('[ImageLoader] Empty URL'));

    // Resolve builtin:key references via AssetManager image registry
    if (url.startsWith('builtin:')) {
        const key = url.slice('builtin:'.length);
        const resolved = _resolveBuiltin(key);
        if (!resolved) {
            return Promise.reject(
                new Error(`[ImageLoader] builtin image not found: "${key}". Register it via assetManager or lcards-images-pack.`)
            );
        }
        lcardsLog.debug(`[ImageLoader] Resolved builtin:${key} → ${resolved}`);
        url = resolved; // fall through to normal load with resolved URL
    }

    // Resolve media-source://… references (HA media library items) via AssetManager.
    // Cached here under the *original* media-source id, not the resolved URL — resolved
    // URLs may carry an expiring signed token, so AssetManager owns its own short-lived
    // cache for those and re-resolves on expiry; this cache just dedupes concurrent loads.
    if (url.startsWith('media-source://')) {
        if (_cache.has(url)) return _cache.get(url);

        const mediaSourceId = url;
        const p = _resolveMediaSource(mediaSourceId).then((resolvedUrl) => {
            if (!resolvedUrl) {
                throw new Error(`[ImageLoader] Failed to resolve media source: "${mediaSourceId}"`);
            }
            return _loadImageElement(resolvedUrl);
        });

        _cache.set(mediaSourceId, p);
        return p;
    }

    // Warn about mixed-content risk early (before the browser silently blocks it)
    if (url.startsWith('http:') && typeof location !== 'undefined' && location.protocol === 'https:') {
        lcardsLog.warn(
            `[ImageLoader] http:// URL may be blocked as mixed content on HTTPS: "${url}". ` +
            'Use an https:// URL or a /local/ path instead.'
        );
    }

    if (_cache.has(url)) return _cache.get(url);

    const p = _loadImageElement(url);
    _cache.set(url, p);
    return p;
}

/**
 * Remove a URL from the cache.  Subsequent calls to `loadImage(url)` will re-fetch.
 * Useful after a dynamic image at a stable URL has been updated on disk.
 *
 * @param {string} url
 */
export function evictImage(url) {
    _cache.delete(url);
}
