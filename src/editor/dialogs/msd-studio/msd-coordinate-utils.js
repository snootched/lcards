/**
 * @fileoverview MSD Studio — Coordinate Utilities
 *
 * Pure functions for coordinate conversion between screen pixels and ViewBox coordinates.
 * Extracted from lcards-msd-studio-dialog.js with zero changes to logic.
 *
 * @module msd-studio/msd-coordinate-utils
 */

import { lcardsLog } from '../../../utils/lcards-logging.js';

/**
 * Convert mouse event to ViewBox coordinates
 * Handles shadow DOM traversal, ViewBox scaling, and zoom transform
 *
 * @param {MouseEvent} event - Mouse event
 * @param {ShadowRoot} dialogShadowRoot - Dialog's shadow root
 * @param {Object} config - Working config object
 * @param {Object} [zoomTransform] - Optional d3-zoom transform {x, y, k}
 * @returns {Object|null} {x, y} in ViewBox coordinates, or null if conversion fails
 */
export function getPreviewCoordinatesFromMouseEvent(event, dialogShadowRoot, config, zoomTransform = null) {
    // Find the preview panel
    const previewPanel = dialogShadowRoot.querySelector('.preview-panel');
    if (!previewPanel) return null;

    const livePreview = previewPanel.querySelector('lcards-msd-live-preview');
    if (!livePreview) return null;

    const livePreviewShadow = livePreview.shadowRoot;
    if (!livePreviewShadow) return null;

    const cardContainer = livePreviewShadow.querySelector('.preview-card-container');
    if (!cardContainer) return null;

    const msdCard = cardContainer.querySelector('lcards-msd-card');
    if (!msdCard) return null;

    // @ts-ignore - TS2339: auto-suppressed
    const shadowRoot = msdCard.shadowRoot || msdCard.renderRoot;
    if (!shadowRoot) return null;

    const svg = shadowRoot.querySelector('svg');
    if (!svg) return null;

    // Get viewBox
    const viewBox = config.msd?.view_box;
    let viewBoxX = 0, viewBoxY = 0, viewBoxWidth = 1920, viewBoxHeight = 1200;
    if (Array.isArray(viewBox) && viewBox.length === 4) {
        [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox;
    }

    // Get SVG rect
    const rect = svg.getBoundingClientRect();
    const panelRect = previewPanel.getBoundingClientRect();

    // Calculate scale
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;
    const scale = Math.max(scaleX, scaleY);

    // Calculate offset
    const renderedWidth = viewBoxWidth / scale;
    const renderedHeight = viewBoxHeight / scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    // Get mouse position relative to preview panel
    const mouseX = event.clientX - panelRect.left;
    const mouseY = event.clientY - panelRect.top;

    // Convert to SVG pixel coordinates
    const svgLeft = rect.left - panelRect.left;
    const svgTop = rect.top - panelRect.top;
    let svgPixelX = mouseX - svgLeft - offsetX;
    let svgPixelY = mouseY - svgTop - offsetY;

    // ✨ ZOOM INTEGRATION: Apply inverse zoom transform
    // This converts screen coordinates back to pre-zoom SVG coordinates
    if (zoomTransform?.k && zoomTransform.k !== 1) {
        svgPixelX = (svgPixelX - zoomTransform.x) / zoomTransform.k;
        svgPixelY = (svgPixelY - zoomTransform.y) / zoomTransform.k;
    }

    // Convert to ViewBox coordinates
    const x = svgPixelX * scale + viewBoxX;
    const y = svgPixelY * scale + viewBoxY;

    return { x, y };
}

/**
 * Snap coordinates to grid
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} gridSize - Grid spacing
 * @param {boolean} enabled - Whether snapping is enabled
 * @returns {Array} [x, y] coordinates (snapped if enabled)
 */
export function snapToGrid(x, y, gridSize, enabled) {
    if (!enabled) return [x, y];

    return [
        Math.round(x / gridSize) * gridSize,
        Math.round(y / gridSize) * gridSize
    ];
}
