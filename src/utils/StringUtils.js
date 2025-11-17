/**
 * String manipulation utilities for LCARdS cards
 *
 * Provides common string operations for text processing,
 * security, and formatting across all card types.
 *
 * @module utils/StringUtils
 */

import { lcardsLog } from './lcards-logging.js';

/**
 * Escape HTML/SVG special characters for safe rendering
 *
 * Prevents XSS attacks by escaping characters that have special
 * meaning in HTML/SVG contexts. Use this for any user-provided
 * text that will be rendered in SVG or HTML.
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for SVG/HTML
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 *
 * @example
 * // Safe for SVG text content
 * const svgText = `<text>${escapeHtml(userInput)}</text>`;
 */
export function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (including ellipsis)
 * @param {string} ellipsis - Ellipsis string (default: '...')
 * @returns {string} Truncated text
 *
 * @example
 * truncate('This is a long text', 10)
 * // Returns: 'This is...'
 */
export function truncate(text, maxLength, ellipsis = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Capitalize first letter of a string
 *
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 *
 * @example
 * capitalize('hello world')
 * // Returns: 'Hello world'
 */
export function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert camelCase to kebab-case
 *
 * @param {string} text - CamelCase text
 * @returns {string} kebab-case text
 *
 * @example
 * camelToKebab('backgroundColor')
 * // Returns: 'background-color'
 */
export function camelToKebab(text) {
    if (!text) return '';
    return text.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 *
 * @param {string} text - kebab-case text
 * @returns {string} camelCase text
 *
 * @example
 * kebabToCamel('background-color')
 * // Returns: 'backgroundColor'
 */
export function kebabToCamel(text) {
    if (!text) return '';
    return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
