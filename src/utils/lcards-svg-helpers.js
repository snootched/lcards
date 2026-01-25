// --- SVG Helpers ---
import { lcardsLog } from './lcards-logging.js';

/**
 * Generate SVG line element as string
 * 
 * @param {Object} params - Line parameters
 * @param {number} params.x1 - Start X coordinate
 * @param {number} params.y1 - Start Y coordinate
 * @param {number} params.x2 - End X coordinate
 * @param {number} params.y2 - End Y coordinate
 * @param {string} [params.id] - Element ID
 * @param {Object} [params.attrs] - Additional SVG attributes
 * @param {Object} [params.style] - CSS style properties
 * @returns {string} SVG line element markup
 */
export function drawLine({ x1, y1, x2, y2, id, attrs = {}, style = {} }) {
  const attrsStr = attrsToString(attrs);
  const styleStr = styleToString(style);
  return `<line id="${id || ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${attrsStr}${styleStr} />`;
}

/**
 * Generate SVG polyline element as string
 * 
 * @param {Object} params - Polyline parameters
 * @param {Array<[number, number]>} params.points - Array of [x, y] coordinate pairs
 * @param {string} [params.id] - Element ID
 * @param {Object} [params.attrs] - Additional SVG attributes
 * @param {Object} [params.style] - CSS style properties
 * @returns {string} SVG polyline element markup
 */
export function drawPolyline({ points, id, attrs = {}, style = {} }) {
  const pts = points.map(pt => pt.join(',')).join(' ');
  const attrsStr = attrsToString(attrs);
  const styleStr = styleToString(style);
  return `<polyline id="${id || ''}" points="${pts}"${attrsStr}${styleStr} />`;
}

export function drawPath({ d, id, attrs = {}, style = {} }) {
  const attrsStr = attrsToString(attrs);
  const styleStr = styleToString(style);
  return `<path id="${id || ''}" d="${d}"${attrsStr}${styleStr} />`;
}

export function drawText({ x, y, text, id, attrs = {}, style = {} }) {
  const attrsStr = attrsToString(attrs);
  const styleStr = styleToString(style);
  return `<text id="${id || ''}" x="${x}" y="${y}"${attrsStr}${styleStr}>${text}</text>`;
}

export function drawCircle({ cx, cy, r, id, attrs = {}, style = {} }) {
  const attrsStr = attrsToString(attrs);
  const styleStr = styleToString(style);
  return `<circle id="${id || ''}" cx="${cx}" cy="${cy}" r="${r}"${attrsStr}${styleStr} />`;
}

export function drawRect({ x, y, width, height, id, attrs = {}, style = {} }) {
  const attrsStr = attrsToString(attrs);
  const styleStr = styleToString(style);
  return `<rect id="${id || ''}" x="${x}" y="${y}" width="${width}" height="${height}"${attrsStr}${styleStr} />`;
}

// --- Utility helpers ---

export function attrsToString(attrs) {
  if (!attrs || typeof attrs !== "object") return '';
  return Object.entries(attrs)
    .map(([k, v]) => ` ${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${v}"`)
    .join('');
}

export function styleToString(style) {
  if (!style || typeof style !== "object") return "";
  const s = Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
    .join(';');
  return s ? ` style="${s}"` : '';
}

// --- SVG Content Processing ---

/**
 * Sanitize SVG content to prevent XSS attacks
 * Strips dangerous elements and attributes while preserving visual content
 *
 * @param {string} svgContent - Raw SVG markup
 * @param {boolean} stripScripts - Remove <script> tags (default: true)
 * @returns {string} Sanitized SVG markup
 */
export function sanitizeSvg(svgContent, stripScripts = true) {
  // Strip XML declaration if present (causes parsing errors when wrapping)
  // Matches: <?xml version="1.0" encoding="UTF-8" standalone="no"?>
  let cleanedContent = svgContent.trim().replace(/^<\?xml[^?]*\?>\s*/i, '');

  // Wrap content in <svg> if not already wrapped (allows fragments like <rect/><defs/>)
  let wrappedContent = cleanedContent;
  if (!wrappedContent.startsWith('<svg')) {
    wrappedContent = `<svg xmlns="http://www.w3.org/2000/svg">${cleanedContent}</svg>`;
  }

  // Parse SVG to DOM (in memory, not attached to document)
  const parser = new DOMParser();
  const doc = parser.parseFromString(wrappedContent, 'image/svg+xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    lcardsLog.error('[SVGHelpers] ❌ Invalid SVG markup:', parserError.textContent);
    return '';
  }

  const svg = doc.documentElement;

  // Strip dangerous elements
  if (stripScripts) {
    const dangerousElements = svg.querySelectorAll('script, iframe, embed, object, foreignObject[src], use[href^="data:"], use[xlink\\:href^="data:"]');
    dangerousElements.forEach(el => el.remove());
  }

  // Strip event handlers (onclick, onload, onerror, etc.)
  const allElements = svg.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Strip dangerous URL schemes in href/xlink:href
  // Checks for javascript:, data:, and vbscript: schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:'];
  allElements.forEach(el => {
    ['href', 'xlink:href'].forEach(attr => {
      const value = el.getAttribute(attr);
      if (value) {
        const trimmedLower = value.trim().toLowerCase();
        if (dangerousSchemes.some(scheme => trimmedLower.startsWith(scheme))) {
          el.removeAttribute(attr);
        }
      }
    });
  });

  // Make text elements click-through so they don't interfere with segment interactions
  // This allows pointer events to pass through to interactive segments beneath
  const textElements = svg.querySelectorAll('text, tspan, foreignObject');
  textElements.forEach(el => {
    el.setAttribute('pointer-events', 'none');
  });

  // Return the full SVG (including wrapper if we added one)
  return new XMLSerializer().serializeToString(svg);
}

/**
 * Extract viewBox attribute from SVG content
 *
 * @param {string} svgContent - SVG markup
 * @returns {string|null} ViewBox value or null
 */
export function extractViewBox(svgContent) {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  return viewBoxMatch ? viewBoxMatch[1] : null;
}

/**
 * Extract content from a data URI
 * Supports both base64 and URL-encoded formats
 *
 * @param {string} dataUri - Data URI string (e.g., "data:image/svg+xml,<svg>..." or "data:image/svg+xml;base64,...")
 * @returns {string} Decoded content
 * @throws {Error} If data URI format is invalid
 */
export function extractDataUriContent(dataUri) {
  // Format: data:image/svg+xml,<svg>...</svg> or data:image/svg+xml;base64,...
  const commaIndex = dataUri.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URI format');
  }

  const header = dataUri.substring(0, commaIndex);
  const content = dataUri.substring(commaIndex + 1);

  if (header.includes(';base64')) {
    // Base64 encoded
    return atob(content);
  } else {
    // URL encoded
    return decodeURIComponent(content);
  }
}