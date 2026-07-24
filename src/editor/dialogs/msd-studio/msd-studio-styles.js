/**
 * @fileoverview MSD Studio Dialog Styles
 *
 * CSS styles for the MSD Studio dialog interface.
 *
 * Consolidated onto the shared `studio-dialog-styles.js` (Phase 6 dialog UX
 * refresh) — this file now holds only genuinely MSD-specific rules plus a
 * handful of intentional overrides of the shared sheet's defaults (33.3/66.6
 * split ratio, `.preview-panel`'s `overflow:hidden` needed by d3-zoom's pan,
 * tab-group spacing, zoom-controls tint). Import order in
 * `lcards-msd-studio-dialog.js` must keep this file AFTER `studioDialogStyles`
 * so these overrides win the cascade.
 */

import { css } from 'lit';

export const msdStudioStyles = css`
    :host {
        display: block;
        color: var(--primary-text-color);
    }

    /* List item styled like ha-card but without transition:all or color inheritance issues */
    .list-item-card {
        background: var(--ha-card-background, var(--card-background-color, white));
        box-shadow: var(--ha-card-box-shadow, none);
        box-sizing: border-box;
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        border-width: var(--ha-card-border-width, var(--ha-border-width-sm));
        border-style: solid;
        border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
        padding: var(--ha-space-3);
        margin-bottom: var(--ha-space-2);
    }

    /* Dialog Content */
    .dialog-content {
        display: flex;
        flex-direction: column;
        min-height: 70vh;
        max-height: 80vh;
        gap: 0;
    }

    /* Canvas Toolbar collapsed-state modifier (base .canvas-toolbar comes from studioDialogStyles) */
    .canvas-toolbar.collapsed {
        padding: 8px;
    }

    /* Zoom Level Display in Canvas Toolbar */
    .zoom-level-display {
        font-size: 14px;
        font-weight: 600;
        color: white;
        padding: 0 8px;
        min-width: 52px;
        text-align: center;
        user-select: none;
        font-family: var(--lcars-font, var(--lcars-fallback-font, 'Antonio', sans-serif));
        letter-spacing: 0.5px;
    }

    /* Tab header icon button toggles - match canvas toolbar styling */
    ha-icon-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid transparent;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        --ha-icon-button-size: 40px;
        --mdc-icon-size: 20px;
    }

    ha-icon-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: var(--primary-color);
    }

    ha-icon-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }

    ha-icon-button ha-icon {
        --mdc-icon-size: 20px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Zoom Controls (Floating) - MSD uses a bluish tint + border vs. the shared sheet's plain black */
    .zoom-controls {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(30, 40, 60, 0.82);
        backdrop-filter: blur(8px);
        border-radius: 24px;
        padding: 8px 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        z-index: 1000;
    }

    .zoom-control-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: transparent;
        border: 1px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        flex-shrink: 0;
        padding: 0;
        color: white;
        --mdc-icon-size: 18px;
    }

    .zoom-control-btn ha-icon {
        --mdc-icon-size: 18px;
        color: white;
    }

    .zoom-control-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: var(--primary-color);
    }

    .zoom-control-divider {
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 2px;
    }

    /* Grid Settings Popup — must sit above .canvas-toolbar (z-index: 1000),
       which opens it and can now wrap to multiple rows tall enough to
       otherwise cover this popup's top: 60px position. */
    .grid-settings-popup {
        position: absolute;
        top: 60px;
        right: 12px;
        width: 280px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideIn 0.2s ease;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .grid-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
    }

    .grid-settings-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
    }

    /* Split Panel Layout override - MSD uses a 33.3/66.6 config/preview ratio
       (shared studioDialogStyles defaults to 50/50) */
    .studio-layout {
        grid-template-columns: 33.3% 66.6%;
    }

    /* .preview-panel override - MSD needs plain overflow:hidden because
       d3-zoom owns pan itself; native scroll (the shared sheet's default)
       would fight the CSS transform it applies. */
    .preview-panel {
        overflow: hidden;
    }

    .preview-scroll-container {
        flex: 1;
        overflow: hidden;   /* d3-zoom owns pan — native scroll would fight the CSS transform */
        position: relative;
        padding-top: 48px;  /* Push content down below action bar */
    }

    /* Cursor feedback based on mode */
    .preview-panel.mode-view {
        cursor: default;
    }

    /* Grab cursor hints that the canvas can be panned by dragging */
    .preview-panel.mode-view .preview-scroll-container {
        cursor: grab;
    }

    /* Grabbing cursor while a pan drag is in progress (class added by d3-zoom start/end) */
    .preview-panel.mode-view .preview-scroll-container.panning {
        cursor: grabbing !important;
    }

    .preview-panel.mode-view.dragging {
        cursor: grabbing !important;
    }

    .preview-panel.mode-place_anchor,
    .preview-panel.mode-place_control {
        cursor: crosshair;
    }

    .preview-panel.mode-connect_line {
        cursor: crosshair;
    }

    .preview-panel.mode-draw_channel {
        cursor: crosshair;
    }

    .preview-panel.mode-draw_channel.drawing {
        cursor: crosshair;
    }

    .preview-panel.mode-add_waypoint {
        cursor: crosshair;
    }

    /* Tab Navigation override - MSD keeps 12px spacing below the tab group
       (shared sheet defaults to 0) */
    ha-tab-group {
        margin-bottom: 12px;
    }

    /* Card Picker Button Styling */
    .card-picker-button {
        height: 80px;
        flex-direction: column;
        --ha-button-text-color: var(--primary-text-color);
    }

    .card-picker-button ha-icon {
        --mdc-icon-size: 32px;
        margin-bottom: 8px;
    }

    .card-picker-button div {
        font-size: 12px;
    }

    /* Mode Status Badge */
    .mode-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--primary-background-color);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-left: auto;
    }

    /* Line Dialog - Connection Flow Layout */
    .line-connection-flow {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 16px;
        align-items: start;
        margin: 16px 0;
    }

    .connection-source,
    .connection-target {
        min-width: 0;
    }

    .connection-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 32px;
        color: var(--lcars-orange);
    }

    .connection-arrow ha-icon {
        --mdc-icon-size: 32px;
    }

    /* Routing Info Panel */
    .routing-info-panel {
        margin-top: 16px;
        padding: 16px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
    }

    .routing-info-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-text-color);
        margin-bottom: 8px;
    }

    .routing-info-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--lcars-orange);
    }

    .routing-info-description {
        font-size: 13px;
        color: var(--secondary-text-color);
        line-height: 1.5;
        margin-bottom: 12px;
    }

    .routing-info-diagram {
        display: flex;
        justify-content: center;
        padding: 12px;
        background: var(--primary-background-color);
        border-radius: 4px;
    }

    .routing-info-diagram svg {
        max-width: 300px;
    }

    /* Routing 2-Column Layout */
    .routing-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
    }

    .routing-mode-column,
    .routing-advanced-column {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* Interactive Bounding Boxes */
    .interactive-bbox {
        cursor: grab;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .interactive-bbox:hover {
        border-color: #00CCFF !important;
        border-width: 3px !important;
        box-shadow: 0 0 12px rgba(0, 204, 255, 0.6);
    }

    .interactive-bbox:active {
        cursor: grabbing;
    }

    .bbox-dragging {
        cursor: grabbing !important;
        border-color: #FF9900 !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(255, 153, 0, 0.8);
        opacity: 0.8;
    }

    .bbox-resizing {
        border-color: #9900FF !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(153, 0, 255, 0.8);
        opacity: 0.8;
    }

    /* Resize Handles */
    .resize-handle {
        position: absolute;
        background: white;
        border: 2px solid #0088FF;
        width: 10px;
        height: 10px;
        pointer-events: auto;
        z-index: 1000;
        transition: all 0.2s;
    }

    .resize-handle:hover {
        background: #00CCFF;
        border-color: #00CCFF;
        width: 12px;
        height: 12px;
        box-shadow: 0 0 8px rgba(0, 204, 255, 0.8);
    }

    .resize-handle.active {
        background: #9900FF;
        border-color: #9900FF;
        box-shadow: 0 0 12px rgba(153, 0, 255, 0.8);
    }

    /* Handle positions */
    .resize-handle.tl { top: -5px; left: -5px; cursor: nwse-resize; }
    .resize-handle.t  { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
    .resize-handle.tr { top: -5px; right: -5px; cursor: nesw-resize; }
    .resize-handle.r  { top: 50%; right: -5px; transform: translateY(-50%); cursor: ew-resize; }
    .resize-handle.br { bottom: -5px; right: -5px; cursor: nwse-resize; }
    .resize-handle.b  { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
    .resize-handle.bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
    .resize-handle.l  { top: 50%; left: -5px; transform: translateY(-50%); cursor: ew-resize; }

    /* Live dimension/coordinate readout shown only while actively dragging or
       resizing a control/shape/channel — see _renderLiveCoordBadge. Matches
       the existing "Control ID label" diagnostic-badge styling (fixed blue,
       not theme-tinted — intentional: this overlays arbitrary base_svg/canvas
       content, same reasoning as anchor/bbox/route debug colors). */
    .live-coord-badge {
        position: absolute;
        background: rgba(0, 136, 255, 0.9);
        color: white;
        padding: 3px 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    /* Interactive Anchors */
    .interactive-anchor {
        cursor: grab;
        transition: all 0.2s;
    }

    .interactive-anchor:hover {
        background: #FFFF00 !important;
        width: 16px !important;
        height: 16px !important;
        box-shadow: 0 0 12px rgba(255, 255, 0, 0.8) !important;
    }

    .interactive-anchor:active {
        cursor: grabbing;
    }

    .anchor-dragging {
        cursor: grabbing !important;
        background: #FF9900 !important;
        width: 16px !important;
        height: 16px !important;
        box-shadow: 0 0 16px rgba(255, 153, 0, 0.9) !important;
        opacity: 0.9;
    }

    /* Interactive Channels */
    .interactive-channel {
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .interactive-channel:hover {
        border-color: #00FFFF !important;
        border-width: 3px !important;
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);
    }

    .channel-resizing {
        border-color: #9900FF !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(153, 0, 255, 0.8);
        opacity: 0.8;
    }

    .channel-dragging {
        cursor: grabbing !important;
        border-color: #FF9900 !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(255, 153, 0, 0.8);
        opacity: 0.8;
    }

    /* Responsive - only MSD-specific rules; .studio-layout/.config-panel
       single-column fallback comes from the shared studioDialogStyles */
    @media (max-width: 1024px) {
        .line-connection-flow {
            grid-template-columns: 1fr;
            gap: 8px;
        }

        .connection-arrow {
            padding-top: 0;
            transform: rotate(90deg);
        }

        .routing-columns {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }

    /* HA Native Card Picker Styles */
    .card-picker-container {
        min-height: 300px;
        max-height: 500px;
        overflow-y: auto;
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 8px;
    }

    .card-picker-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 200px;
        color: var(--secondary-text-color);
    }

    hui-card-picker {
        display: block;
        width: 100%;
    }

    /* HA Native Card Editor Styles */
    .card-editor-container {
        min-height: 200px;
    }

    /* Selected Card Header */
    .selected-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .selected-card-header:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Preview Tab Styles */
    .control-preview-panel {
        background: var(--card-background-color);
        border-radius: 8px;
        min-height: 400px;
    }

    .preview-card-wrapper {
        background: var(--primary-background-color);
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        padding: 20px;
        transition: border-color 0.3s ease;
    }

    .preview-card-wrapper:hover {
        border-color: var(--primary-color);
    }

    .preview-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--divider-color);
    }

    .preview-footer {
        padding-top: 12px;
        border-top: 1px solid var(--divider-color);
        font-size: 12px;
        color: var(--secondary-text-color);
        text-align: center;
    }

    /* Channel Suggestion Panel */
    .channel-suggestion-panel {
        margin-top: 16px;
        padding: 12px;
        background: rgba(0, 255, 170, 0.1);
        border: 1px solid rgba(0, 255, 170, 0.3);
        border-radius: 4px;
    }

    .channel-suggestion-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .channel-suggestion-header ha-icon {
        color: #00FFAA;
        margin-right: 8px;
        --mdc-icon-size: 20px;
    }

    .channel-suggestion-title {
        margin: 0;
        color: #00FFAA;
        font-size: 14px;
        font-weight: 600;
    }

    .channel-suggestion-description {
        margin-bottom: 12px;
        font-size: 13px;
        color: var(--secondary-text-color);
    }

    .channel-suggestion-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .channel-suggestion-actions ha-button[primary] {
        --primary-color: #00FFAA;
    }

    .channel-suggestion-affected-lines {
        margin-top: 8px;
        font-size: 11px;
        color: var(--disabled-text-color);
    }

    /* Waypoint Markers (Visual Editing) */
    .waypoint-marker {
        cursor: grab;
        transition: all 0.15s ease;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    .waypoint-marker:hover {
        filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
    }

    .waypoint-marker.editing {
        cursor: grab;
    }

    .waypoint-marker.dragging {
        cursor: grabbing;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8));
    }

    .waypoint-marker circle {
        stroke-width: 2;
    }

    .waypoint-marker:hover circle {
        stroke-width: 3;
    }

    .waypoint-marker.dragging circle {
        stroke-width: 4;
    }

    /* Line paths should capture pointer events for hover/click */
    .line-path {
        pointer-events: auto !important;
    }

    /* Selected line highlighting for waypoint editing */
    .line-path.line-selected {
        filter: drop-shadow(0 0 8px var(--lcars-blue)) drop-shadow(0 0 4px var(--lcars-blue)) !important;
        stroke-width: 4 !important;
    }

    /* Hover effect for lines - same intensity as selection for visibility */
    .line-path:hover {
        filter: drop-shadow(0 0 8px var(--lcars-blue)) drop-shadow(0 0 4px var(--lcars-blue)) !important;
        stroke-width: 4 !important;
        cursor: pointer;
    }

    /* Don't apply hover when already selected */
    .line-path.line-selected:hover {
        filter: drop-shadow(0 0 8px var(--lcars-blue)) drop-shadow(0 0 4px var(--lcars-blue)) !important;
        stroke-width: 4 !important;
    }

    /* Crosshair cursor when in ADD_WAYPOINT mode */
    .preview-container[data-mode="add-waypoint"] {
        cursor: crosshair !important;
    }

    .preview-container[data-mode="add-waypoint"] * {
        cursor: crosshair !important;
    }
`;
