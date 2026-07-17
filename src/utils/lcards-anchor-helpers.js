/**
 * @fileoverview SVG anchor-point extraction helpers.
 *
 * Locates named anchor elements (circle and text nodes with IDs) inside inline
 * SVG content and returns their coordinates for use by overlay positioning
 * logic.
 *
 * @module utils/lcards-anchor-helpers
 */

import { lcardsLog } from './lcards-logging.js';

/**
 * Find anchor points in SVG content by parsing circle and text elements with IDs.
 *
 * Resolves each element's position through the browser's native `getCTM()`
 * rather than reading `cx`/`cy`/`x`/`y` as absolute coordinates — real-world
 * SVGs (Inkscape/Illustrator exports especially) routinely nest content
 * inside one or more `<g transform="...">` layers, so an element's raw local
 * attributes are frequently nowhere near its true position in the root
 * viewBox. Requires briefly attaching a hidden copy of the SVG to the
 * document, since `getCTM()` is unreliable on fully-detached elements.
 *
 * @param {string} svgContent - SVG markup as string
 * @returns {Object<string, number[]|null>} Map of anchor ID to [x, y] coordinates
 */
export function findSvgAnchors(svgContent) {
  const anchors = /** @type {Object.<string, number[]|null>} */ ({});
  if (!svgContent) return anchors;

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute; left:-99999px; top:-99999px; width:0; height:0; overflow:hidden;';
  container.innerHTML = svgContent;
  const svgRoot = container.querySelector('svg');
  if (!svgRoot) return anchors;

  document.body.appendChild(container);
  try {
    const resolvePoint = (el, localX, localY) => {
      const ctm = typeof el.getCTM === 'function' ? el.getCTM() : null;
      if (!ctm) return [localX, localY]; // no CTM available - fall back to raw local coords
      const pt = svgRoot.createSVGPoint();
      pt.x = localX;
      pt.y = localY;
      const p = pt.matrixTransform(ctm);
      return [p.x, p.y];
    };

    svgRoot.querySelectorAll('circle[id]').forEach(el => {
      const id = el.id;
      if (id.startsWith('__') || id.startsWith('msd-internal-')) return;
      const cx = parseFloat(el.getAttribute('cx'));
      const cy = parseFloat(el.getAttribute('cy'));
      if (Number.isFinite(cx) && Number.isFinite(cy)) {
        anchors[id] = resolvePoint(el, cx, cy);
      }
    });

    svgRoot.querySelectorAll('text[id]').forEach(el => {
      const id = el.id;
      if (id.startsWith('__') || id.startsWith('msd-internal-')) return;
      const x = parseFloat(el.getAttribute('x'));
      const y = parseFloat(el.getAttribute('y'));
      if (Number.isFinite(x) && Number.isFinite(y)) {
        anchors[id] = resolvePoint(el, x, y);
      }
    });

    // <g id="anchor"> - unconditionally overwrites a same-id circle/text match,
    // matching this function's pre-existing (if perhaps accidental) precedence.
    svgRoot.querySelectorAll('g[id]').forEach(el => {
      const id = el.id;
      if (id.startsWith('__') || id.startsWith('msd-internal-')) return;
      anchors[id] = null; // Optionally: calculate centroid if needed
    });
  } finally {
    document.body.removeChild(container);
  }

  return anchors;
}

export function getSvgContent(base_svg) {
  const assetManager = window.lcards?.core?.assetManager;
  if (!assetManager) {
    // Fallback to legacy method if AssetManager not available
    let svgKey = null;
    if (base_svg && base_svg.startsWith('builtin:')) {
      svgKey = base_svg.replace('builtin:', '');
    } else if (base_svg && base_svg.startsWith('/local/')) {
      svgKey = base_svg.split('/').pop().replace('.svg','');
    }
    return svgKey && window.lcards?.assets?.svg_templates?.[svgKey];
  }

  let svgKey = null;
  if (base_svg && base_svg.startsWith('builtin:')) {
    svgKey = base_svg.replace('builtin:', '');
  } else if (base_svg && base_svg.startsWith('/local/')) {
    svgKey = base_svg.split('/').pop().replace('.svg','');
  } else if (base_svg && base_svg.startsWith('media-source://')) {
    // Registered/cached under the content ID itself — see
    // AssetManager.loadSvgFromMediaSource(). Sync-only read like the
    // branches above: only finds it if already fetched by something else.
    svgKey = base_svg;
  }

  if (!svgKey) return null;

  const registry = assetManager.getRegistry('svg');
  return registry.get(svgKey);
}

export function getSvgViewBox(svgContent) {
  const match = svgContent && svgContent.match(/viewBox="([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.\-]+)"/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
  }
  lcardsLog.warn('[getSvgViewBox] ⚠️ No viewBox found in SVG, using fallback [0, 0, 400, 200]');
  return [0, 0, 400, 200];
}

/**
 * Check whether a value is a usable [minX, minY, width, height] viewBox array.
 *
 * @param {*} v - Candidate value
 * @returns {boolean}
 */
export function isValidViewBox(v) {
  return Array.isArray(v) && v.length === 4
    && v.every(n => typeof n === 'number' && Number.isFinite(n))
    && v[2] > 0 && v[3] > 0;
}

/**
 * Resolve the effective viewBox for an MSD card: explicit user config wins,
 * then the base SVG's own native viewBox, then a last-resort default.
 *
 * The default is only reachable when svgContent is unavailable (base_svg:
 * "none" with no explicit view_box) — schema already requires an explicit
 * view_box in that case, so in practice this is dead-last defensive code.
 *
 * @param {*} explicitViewBox - Raw `view_box` value from config, if any
 * @param {?string} svgContent - Raw SVG text, if a base SVG is loaded
 * @returns {number[]} [minX, minY, width, height]
 */
export function resolveEffectiveViewBox(explicitViewBox, svgContent) {
  if (isValidViewBox(explicitViewBox)) return explicitViewBox;
  if (svgContent) return getSvgViewBox(svgContent);
  return [0, 0, 1920, 1080];
}

/**
 * Calculate aspect ratio from viewBox
 *
 * @param {[number, number, number, number]} viewBox - ViewBox array [minX, minY, width, height]
 * @returns {number} Aspect ratio (width/height)
 */
export function getSvgAspectRatio(viewBox) {
  return viewBox[2] && viewBox[3] ? (viewBox[2] / viewBox[3]) : 2;
}


