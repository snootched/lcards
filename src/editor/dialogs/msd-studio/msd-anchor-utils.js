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
 * Fixed set of ids SvgStructureAnalyzer.detectAnchors() ever emits (see
 * SvgStructureAnalyzer.js) - used purely client-side, in the Studio dialog,
 * to distinguish "computed" landmark anchors from "harvested" named-element
 * anchors within the combined base-SVG anchor map. The merged anchor map
 * itself (AnchorProcessor.processAnchors()) carries no per-anchor
 * provenance, so this is a name-based classification, not a real source tag -
 * if a user's own <g id="hull_center">, say, collided with a landmark name,
 * it would be classified as "computed" here too. Acceptable: landmark ids
 * are deliberately unlikely/unusual names to author by hand.
 */
const LANDMARK_ANCHOR_IDS = new Set([
    'hull_center', 'extremity_bow', 'extremity_stern', 'extremity_top', 'extremity_bottom', 'lateral_a', 'lateral_b'
]);

/**
 * Split a base-SVG anchor map (name -> [x, y]) into computed landmark
 * anchors (SvgStructureAnalyzer) and harvested named-element anchors
 * (findSvgAnchors), for separate display/management in the Studio dialog.
 *
 * @param {Object} baseSvgAnchors - Combined base-SVG anchor map
 * @returns {{ computed: Object, harvested: Object }}
 */
export function splitBaseSvgAnchorsBySource(baseSvgAnchors) {
    const computed = {};
    const harvested = {};
    for (const [name, position] of Object.entries(baseSvgAnchors)) {
        if (LANDMARK_ANCHOR_IDS.has(name)) {
            computed[name] = position;
        } else {
            harvested[name] = position;
        }
    }
    return { computed, harvested };
}

/**
 * Get base SVG anchors from the rendered preview
 *
 * Reads `getResolvedModel().anchors` off the live preview's actual
 * `<lcards-msd-card>` - the real pipeline's own already-merged result
 * (computed landmark anchors < SVG-embedded anchors < user anchors, see
 * AnchorProcessor.processAnchors()) - rather than re-deriving anchors
 * independently here. An earlier version of this function called
 * findSvgAnchors() directly against `svg.outerHTML` (the *rendered*,
 * `__msd-base-content`-wrapped DOM, not the raw fetched SVG string the
 * pipeline itself parses); that's a different string than what the pipeline
 * hashes/extracts from, so a same-approach cache lookup for computed anchors
 * reliably missed. Delegating to the pipeline's own resolved model sidesteps
 * that whole class of "does my independent re-derivation match reality"
 * risk, for both computed and SVG-embedded anchors at once - and matches
 * the pattern already used elsewhere in this dialog (e.g. the highlight and
 * animation-target-picker code, which read
 * `msdCard._msdPipeline?.getResolvedModel()?.anchors` directly).
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

    // Get the live preview's actual card instance
    const livePreview = dialogShadowRoot?.querySelector('lcards-msd-live-preview');
    if (!livePreview) return {};

    const livePreviewShadow = livePreview.shadowRoot;
    if (!livePreviewShadow) return {};

    const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
    if (!cardContainer) return {};

    const msdCard = cardContainer.querySelector('lcards-msd-card');
    if (!msdCard) return {};

    // @ts-ignore - TS2339: auto-suppressed
    const resolvedAnchors = msdCard._msdPipeline?.getResolvedModel?.()?.anchors || {};

    // Filter out any anchors that are overridden by user (shown separately
    // in the editable "User Anchors" section)
    const userAnchors = config.msd?.anchors || {};
    const baseSvgAnchors = {};
    for (const [name, position] of Object.entries(resolvedAnchors)) {
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
