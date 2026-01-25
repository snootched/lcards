import yamlLib from 'js-yaml';
import { lcardsLog } from '../../utils/lcards-logging.js';

const _cache = new Map(); // url -> { checksum, parsed, ts }

const MAX_BYTES = 250 * 1024;

/**
 * Load an external pack from a URL
 * 
 * @param {string} url - URL to fetch the pack from
 * @param {Function} fetchImpl - Fetch implementation (default: global fetch)
 * @returns {Promise<Object|null>} Parsed pack object or null on error
 */
export async function loadExternalPack(url, fetchImpl = fetch) {
  if (_cache.has(url)) return _cache.get(url).parsed;
  let txt;
  try {
    const res = await fetchImpl(url, { cache: 'no-cache' });
    const blob = await res.blob();
    if (blob.size > MAX_BYTES) {
      lcardsLog.warn('[MSD v1] ⚠️ external pack too large', url, blob.size);
      return null;
    }
    txt = await blob.text();
  } catch (e) {
    lcardsLog.warn('[MSD v1] ⚠️ external pack fetch failed', url, e);
    return null;
  }
  let parsed;
  try {
    parsed = yamlLib.load(txt);
  } catch (e) {
    lcardsLog.warn('[MSD v1] ⚠️ external pack parse failed', url, e);
    return null;
  }
  _cache.set(url, { parsed, ts: Date.now() });
  return parsed;
}

/**
 * Clear the external pack cache
 * 
 * @param {string} [url] - Specific URL to clear, or clear all if not provided
 */
export function clearExternalPackCache(url) {
  if (url) _cache.delete(url); else _cache.clear();
}

/**
 * List all cached external pack URLs
 * 
 * @returns {Array<string>} Array of cached URLs
 */
export function listExternalPackCache() {
  return Array.from(_cache.keys());
}
