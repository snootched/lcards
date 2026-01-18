/**
 * Studio Dialog Shared Styles
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
    /* Dialog Sizing */
    ha-dialog {
        --mdc-dialog-min-width: 95vw;
        --mdc-dialog-max-width: 95vw;
        --mdc-dialog-min-height: 90vh;
    }

    /* Split Panel Layout (33/66 ratio) */
    .studio-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 33.3% 66.6%;
        gap: 0;
        overflow: hidden;
        background: var(--primary-background-color);
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
    }

    /* Floating Toolbar Pattern */
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

    /* Zoom Controls Pattern */
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
        margin-bottom: 12px;
        border-bottom: 2px solid var(--divider-color);
    }

    ha-tab-group-tab ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 8px;
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
