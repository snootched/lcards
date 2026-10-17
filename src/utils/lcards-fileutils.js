/**
 * @fileoverview SVG fetch/cache helpers, and the `window.jsyaml` shim for legacy
 * callers that expect js-yaml on the global scope.
 *
 * @module utils/lcards-fileutils
 */

import { lcardsLog } from './lcards-logging.js';
import jsyaml from 'js-yaml';

// Ensure global fallback for legacy callers expecting window.jsyaml
try {
  if (typeof window !== 'undefined' && !window.jsyaml) {
    window.jsyaml = { load: jsyaml.load, dump: jsyaml.dump };
  }
} catch {}

/**
 * Ensure the SVG cache exists on the window object.
 * Stores built-in SVG templates under window.lcards.assets to avoid
 * namespace collision with MSD runtime initialization.
 */
const _svgTemplates = {};

function ensureSVGCache() {
    return _svgTemplates;
}

/**
 * Load an SVG from a URL and cache it under the given key.
 * Returns a promise that resolves to the SVG string.
 */
export async function loadSVGToCache(key, url) {
    const cache = ensureSVGCache();
    if (cache[key]) {
        // Already cached
        return cache[key];
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            lcardsLog.error(`[loadSVGToCache] Failed to fetch SVG [${url}] for key [${key}]: ${response.status} ${response.statusText}`);
            return undefined;
        }
        let svgText = await response.text();

        // Find the opening <svg> tag and its attributes.
        svgText = svgText.replace(/<svg([^>]*)>/i, (match, attributes) => {
            // Remove existing width and height attributes.
            let newAttributes = attributes.replace(/\s(width|height)=["'][^"']*["']/gi, '');
            // Add width="100%" and height="100%".
            return `<svg width="100%" height="100%"${newAttributes}>`;
        });

        cache[key] = svgText;
        // Individual load messages removed - see preloadSVGs() for summary
        return svgText;
    } catch (error) {
        lcardsLog.error(`[loadSVGToCache] Error loading SVG [${key}] from [${url}]`, error);
        return undefined;
    }
}

/**
 * Get an SVG from the cache by key.
 */
export function getSVGFromCache(key) {
    const cache = ensureSVGCache();
    return cache[key];
}

/**
 * Preload a list of SVGs from a base path.
 * svgList: array of keys (filenames without .svg)
 * basePath: path to prepend (should end with /)
 * Returns a promise that resolves when all SVGs are loaded.
 */
export async function preloadSVGs(svgList, basePath) {
    const promises = svgList.map(key => {
        const url = `${basePath}${key}.svg`;
        return loadSVGToCache(key, url);
    });
    await Promise.all(promises);
    lcardsLog.info(`[preloadSVGs] Preloaded SVGs: ${svgList.join(', ')} from ${basePath}`);
}
