/**
 * @fileoverview Studio Dialog Shared Styles
 *
 * Patterns for full-screen studio dialogs with config/preview panels.
 * Extracted from MSD Studio for reuse in Chart/Data Grid studios.
 *
 * Usage:
 * ```javascript
 * import { studioDialogStyles } from '../dialogs/studio-dialog-styles.js';
 *
 * static get styles() {
 *     return [editorStyles, studioDialogStyles];
 * }
 * ```
 */
import { css } from 'lit';

export const studioDialogStyles = css`
    /* Dialog Sizing - Web Awesome ha-dialog uses --ha-dialog-* CSS properties */
    ha-dialog {
        --ha-dialog-width-md: min(95vw, 95vw);
        --ha-dialog-width-lg: min(95vw, 95vw);
        --ha-dialog-min-height: 90vh;
        --ha-dialog-max-height: 90vh;
    }

    /* Ensure ha-dialog's internal structure respects height */
    ha-dialog::part(dialog) {
        max-height: 90vh;
        display: flex;
        flex-direction: column;
    }

    /* ha-dialog::part(body) is the scrollable body container in WA-based ha-dialog */
    ha-dialog::part(body) {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* .dialog-content is the direct light-DOM child slotted into that body —
       without its own flex sizing it defaults to its content's natural
       height, which can exceed the body and force the *whole dialog* to
       scroll instead of just .tab-content. Keeping it in the same flex chain
       (flex:1, min-height:0, overflow:hidden) means only .tab-content (which
       opts in below) ever actually scrolls; the tab headers and canvas
       toolbar stay put. */
    .dialog-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
    }

    /* Split Panel Layout (50/50 ratio - balanced config and preview) */
    .studio-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 50% 50%;
        gap: 0;
        overflow: hidden;
        background: var(--primary-background-color);
        min-height: 0;
        border-radius: var(--ha-card-border-radius, 12px);
    }

    .config-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 2px solid var(--divider-color);
        min-height: 0;
    }

    /* Tab content scrolling */
    .tab-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
    }

    /* Never scrolls — always consumes exactly the space it's given. Overflow
       within the canvas is handled by d3-zoom pan/zoom, not a scrollbar. */
    .preview-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
    }

    /* Floating Toolbar Pattern — a dark scrim is still needed here for icon
       legibility over arbitrary base_svg/canvas content behind it, but tinted
       with the theme's own accent color (rather than flat neutral black)
       so it reads as part of the LCARdS palette, matching the
       rgba(var(--rgb-primary-color, ...), alpha) pattern already used
       elsewhere in the Studio dialogs (e.g. lcards-data-grid-studio-dialog.js). */
    .canvas-toolbar {
        position: absolute;
        top: 12px;
        right: 12px;
        max-width: calc(100% - 24px);
        display: flex;
        gap: 8px;
        background: color-mix(in srgb, rgba(var(--rgb-primary-color, 3, 169, 244), 0.9) 12%, rgba(0, 0, 0, 0.8) 88%);
        backdrop-filter: blur(8px);
        border-radius: 20px;
        padding: 8px;
        box-shadow: var(--ha-box-shadow-l);
        z-index: 1000;
        transition: all 0.3s ease;
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
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
    }

    /* Groups related buttons into a visually distinct "chip" (e.g. Tools,
       Edit Mode, View aids, Overlay toggles) — a subtly lighter capsule
       floating within the toolbar's own dark pill, so it's clear at a glance
       which buttons belong together without relying on a thin, easy-to-miss
       divider line. Never splits across a wrap boundary — the whole group
       moves to the next row together. */
    .canvas-toolbar-group {
        display: flex;
        flex-wrap: nowrap;
        flex-shrink: 0;
        gap: 4px;
        align-items: center;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.18);
        border: 1px solid rgba(var(--rgb-primary-color, 3, 169, 244), 0.32);
        /* Full pill, not a fixed radius — each group is always exactly one
           row tall (button height + padding), so this keeps the chip's end
           curvature concentric with the fully-round buttons inside it. */
        border-radius: var(--ha-border-radius-pill, 9999px);
        padding: 4px;
    }

    .canvas-toolbar-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.12);
        border: 2px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .canvas-toolbar-button:hover {
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.3);
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

    /* Zoom Controls Pattern — same palette-tinted dark scrim as .canvas-toolbar above */
    .zoom-controls {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        align-items: center;
        background: color-mix(in srgb, rgba(var(--rgb-primary-color, 3, 169, 244), 0.9) 12%, rgba(0, 0, 0, 0.85) 88%);
        backdrop-filter: blur(8px);
        border-radius: 24px;
        padding: 8px 16px;
        box-shadow: var(--ha-box-shadow-l);
        z-index: 1000;
    }

    .zoom-level {
        font-size: 14px;
        font-weight: 600;
        color: white;
        min-width: 48px;
        text-align: center;
        user-select: none;
    }

    /* Tab Navigation */
    ha-tab-group {
        display: block;
        margin-bottom: 0;
        border-bottom: 2px solid var(--divider-color);
    }

    ha-tab-group-tab ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 8px;
    }

    /* Tab Content - Independent Scrolling */
    .tab-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        min-height: 0; /* Allow flex item to shrink */
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

    /* Responsive */
    @media (max-width: 1024px) {
        .studio-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
        }

        .config-panel {
            border-right: none;
            border-bottom: 2px solid var(--divider-color);
        }
    }
`;
