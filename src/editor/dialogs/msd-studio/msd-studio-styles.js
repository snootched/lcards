/**
 * MSD Studio Dialog Styles
 *
 * CSS styles for the MSD Studio dialog interface.
 *
 * Extracted from lcards-msd-studio-dialog.js for better organization.
 * Zero-risk extraction - no logic changes, just moved to separate file.
 */

import { css } from 'lit';

export const msdStudioStyles = css`
    :host {
        display: block;
    }

    /* Override HA button fonts to use theme font */
    ha-button {
        font-family: var(--lcars-font-family, 'Antonio', sans-serif);
    }

    /* ha-dialog Sizing */
    ha-dialog {
        --mdc-dialog-min-width: 95vw;
        --mdc-dialog-max-width: 95vw;
        --mdc-dialog-min-height: 90vh;
    }

    /* Dialog Content */
    .dialog-content {
        display: flex;
        flex-direction: column;
        min-height: 70vh;
        max-height: 80vh;
        gap: 0;
    }

    /* Canvas Toolbar (Floating) */
    .canvas-toolbar {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 8px;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        border-radius: 24px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
    }

    .canvas-toolbar.collapsed {
        padding: 8px;
    }

    .canvas-toolbar-toggle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-color);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .canvas-toolbar-toggle:hover {
        background: var(--primary-color);
        filter: brightness(1.2);
    }

    .canvas-toolbar-toggle ha-icon {
        --mdc-icon-size: 24px;
        color: white;
    }

    .canvas-toolbar-buttons {
        display: flex;
        gap: 4px;
        align-items: center;
    }

    .canvas-toolbar-divider {
        width: 1px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 4px;
    }

    .canvas-toolbar-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .canvas-toolbar-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: var(--primary-color);
    }

    .canvas-toolbar-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }

    .canvas-toolbar-button ha-icon {
        --mdc-icon-size: 20px;
        color: white;
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
        font-family: var(--lcars-font-family, 'Antonio', sans-serif);
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
        --mdc-icon-button-size: 40px;
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

    /* Zoom Controls (Floating) */
    .zoom-controls {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        border-radius: 24px;
        padding: 8px 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        z-index: 1000;
    }

    .zoom-controls ha-icon-button {
        --mdc-icon-button-size: 36px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .zoom-controls ha-icon-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
    }

    .zoom-level {
        font-size: 14px;
        font-weight: 600;
        color: white;
        min-width: 48px;
        text-align: center;
        user-select: none;
    }

    /* Grid Settings Popup */
    .grid-settings-popup {
        position: absolute;
        top: 60px;
        right: 12px;
        width: 280px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 999;
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

    /* Split Panel Layout */
    .studio-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 33.3% 66.6%;
        gap: 0;
        overflow: hidden;
        background: var(--primary-background-color);
        border-radius: var(--ha-card-border-radius, 12px);
    }

    .config-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 2px solid var(--divider-color);
    }

    .preview-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding-top: 48px;  /* Push preview down below action bar */
    }

    .preview-scroll-container {
        flex: 1;
        overflow: auto;
        position: relative;
    }

    /* Cursor feedback based on mode */
    .preview-panel.mode-view {
        cursor: default;
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

    /* Tab Navigation with HA Tab Group */
    ha-tab-group {
        display: block;
        margin-bottom: 12px;
        border-bottom: 2px solid var(--divider-color);
    }

    ha-tab-group-tab ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 8px;
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

    /* Tab Content */
    .tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }

    /* Placeholder Content */
    .placeholder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: var(--secondary-text-color);
    }

    .placeholder-content ha-icon {
        --mdc-icon-size: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .placeholder-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 12px 0;
    }

    .placeholder-description {
        font-size: 14px;
        margin: 0;
        max-width: 500px;
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

    /* Responsive */
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

    @media (max-width: 1024px) {
        .studio-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
        }

        .config-panel {
            border-right: none;
            border-bottom: 2px solid var(--divider-color);
        }

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
