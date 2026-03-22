/**
 * @fileoverview MSD Studio — Anchor & Position Utilities
 *
 * Pure functions for anchor resolution and position calculations.
 * Extracted from lcards-msd-studio-dialog.js with zero changes to logic.
 *
 * @module msd-studio/msd-anchor-utils
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Get base SVG anchors from the rendered preview
 * Extracts anchors defined in the base SVG using findSvgAnchors utility
 *
 * @param {Object} config - Working config object
 * @param {ShadowRoot} dialogShadowRoot - Dialog's shadow root
 * @returns {Object} Map of anchor names to [x, y] positions
 */
export function getBaseSvgAnchors(config, dialogShadowRoot) {
    const baseSvgSource = config.msd?.base_svg?.source;

    // Only extract from builtin sources
    if (!baseSvgSource || !baseSvgSource.startsWith('builtin:')) {
        return {};
    }

    // Check if findSvgAnchors is available
    if (!window.lcards?.findSvgAnchors) {
        lcardsLog.warn('[MSDStudio] window.lcards.findSvgAnchors not available');
        return {};
    }

    // Get the SVG content from the live preview
    const livePreview = dialogShadowRoot?.querySelector('lcards-msd-live-preview');
    if (!livePreview) return {};

    const livePreviewShadow = livePreview.shadowRoot;
    if (!livePreviewShadow) return {};

    const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
    if (!cardContainer) return {};

    const msdCard = cardContainer.querySelector('lcards-msd-card');
    if (!msdCard) return {};

    // @ts-ignore - TS2339: auto-suppressed
    const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
    if (!shadowRoot) return {};

    const svg = shadowRoot.querySelector('svg');
    if (!svg) return {};

    // Extract SVG content
    const svgContent = svg.outerHTML;
    const extractedAnchors = window.lcards.findSvgAnchors(svgContent);

    // Filter out any anchors that are overridden by user
    const userAnchors = config.msd?.anchors || {};
    const baseSvgAnchors = {};
    for (const [name, position] of Object.entries(extractedAnchors)) {
        if (!userAnchors[name]) {
            baseSvgAnchors[name] = position;
        }
    }

    return baseSvgAnchors;
}

/**
 * Resolve control position (either direct position or from anchor)
 *
 * @param {Object} control - Control overlay object
 * @param {Object} config - Working config object
 * @param {ShadowRoot} dialogShadowRoot - Dialog's shadow root
 * @returns {Array|null} [x, y] position or null
 */
export function resolveControlPosition(control, config, dialogShadowRoot) {
    lcardsLog.debug('[MSDStudio] Resolving control position:', control.id, 'position:', control.position, 'anchor:', control.anchor);

    if (control.position && Array.isArray(control.position)) {
        lcardsLog.debug('[MSDStudio] Control has direct position:', control.position);
        return control.position;
    }

    if (control.anchor) {
        const userAnchors = config.msd?.anchors || {};
        const baseSvgAnchors = getBaseSvgAnchors(config, dialogShadowRoot);
        const allAnchors = { ...userAnchors, ...baseSvgAnchors };
        const pos = allAnchors[control.anchor];
        lcardsLog.debug('[MSDStudio] Control resolved from anchor:', control.anchor, '→', pos);
        return pos || null;
    }

    lcardsLog.warn('[MSDStudio] Control has no position or anchor:', control.id);
    return null;
}

/**
 * Resolve position with side for controls or anchors
 * Returns the specific attachment point based on side property
 *
 * @param {string} targetId - ID of anchor or control
 * @param {string|null} side - Side specification (e.g., 'top', 'left', 'center', null)
 * @param {Object} config - Working config object
 * @param {ShadowRoot} dialogShadowRoot - Dialog's shadow root
 * @returns {Array|null} [x, y] coordinates or null
 */
export function resolvePositionWithSide(targetId, side, config, dialogShadowRoot) {
    const overlays = config.msd?.overlays || [];
    const userAnchors = config.msd?.anchors || {};
    const baseSvgAnchors = getBaseSvgAnchors(config, dialogShadowRoot);
    const allAnchors = { ...userAnchors, ...baseSvgAnchors };

    // Check if it's an anchor
    // Anchors are just points - no side offsets (use anchor_gap property instead)
    if (allAnchors[targetId]) {
        return allAnchors[targetId];
    }

    // Check if it's a control
    const control = overlays.find(o => o.id === targetId && o.type === 'control');
    if (control) {
        const pos = resolveControlPosition(control, config, dialogShadowRoot);
        if (!pos) return null;

        const [x, y] = pos;
        const size = control.size || [100, 100];
        const [w, h] = size;

        if (!side || side === 'center') {
            return [x + w/2, y + h/2];
        }

        // Return edge point based on side
        switch (side) {
            case 'top': return [x + w/2, y];
            case 'bottom': return [x + w/2, y + h];
            case 'left': return [x, y + h/2];
            case 'right': return [x + w, y + h/2];
            case 'top-left': return [x, y];
            case 'top-right': return [x + w, y];
            case 'bottom-left': return [x, y + h];
            case 'bottom-right': return [x + w, y + h];
            default: return [x + w/2, y + h/2];
        }
    }

    return null;
}
