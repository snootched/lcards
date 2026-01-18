/**
 * Editor Widget Styles
 * 
 * Patterns for list-based editors (animation, filter, multi-text).
 * Collapsible items with drag-and-drop support.
 * 
 * Usage:
 * ```javascript
 * import { editorWidgetStyles } from './editor-widget-styles.js';
 * 
 * static get styles() {
 *     return [editorWidgetStyles];
 * }
 * ```
 */
import { css } from 'lit';

export const editorWidgetStyles = css`
    /* List Container */
    .editor-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* List Item */
    .editor-item {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        transition: border-color 0.2s;
    }

    .editor-item:hover {
        border-color: var(--primary-color);
    }

    /* Item Header (clickable, expandable) */
    .editor-item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
        transition: background 0.2s;
    }

    .editor-item-header:hover {
        background: var(--primary-background-color);
    }

    /* Drag Handle */
    .drag-handle {
        cursor: grab;
        color: var(--secondary-text-color);
        padding: 4px;
        margin-left: -4px;
        transition: color 0.2s;
    }

    .drag-handle:hover {
        color: var(--primary-text-color);
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    /* Item Icon */
    .editor-item-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
    }

    /* Item Info */
    .editor-item-info {
        flex: 1;
        min-width: 0;
    }

    .editor-item-title {
        font-weight: 600;
        font-size: 16px;
        color: var(--primary-text-color);
    }

    .editor-item-subtitle {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-family: monospace;
        margin-top: 4px;
    }

    /* Item Actions */
    .editor-item-actions {
        display: flex;
        gap: 4px;
    }

    .editor-item-actions ha-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
    }

    /* Expand Icon */
    .expand-icon {
        transition: transform 0.2s;
    }

    .expand-icon.expanded {
        transform: rotate(180deg);
    }

    /* Item Content (collapsible) */
    .editor-item-content {
        padding: 16px;
        background: var(--card-background-color);
        border-top: 1px solid var(--divider-color);
    }

    /* Dragging States */
    .editor-item.dragging {
        opacity: 0.5;
    }

    .editor-item.drag-over {
        border-top: 3px solid var(--primary-color);
    }

    /* Add Button */
    .add-button {
        width: 100%;
        margin-top: 8px;
    }

    /* Form Sections within Item Content */
    .editor-item-content .section {
        margin-bottom: 24px;
    }

    .editor-item-content .section:last-child {
        margin-bottom: 0;
    }

    .editor-item-content .section-header {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--primary-color);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .editor-item-content .form-row {
        margin-bottom: 16px;
    }

    .editor-item-content .form-row:last-child {
        margin-bottom: 0;
    }

    /* Help Text */
    .help-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 6px;
        line-height: 1.4;
    }

    .help-icon {
        font-size: 16px;
        color: var(--secondary-text-color);
        cursor: help;
    }

    /* Toggle Row Pattern */
    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        margin-bottom: 16px;
    }

    .toggle-label {
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Field Label */
    .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
    }

    /* Warning Banner */
    .warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--warning-color);
        color: white;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.4;
    }

    .warning-banner ha-icon {
        --mdc-icon-size: 20px;
        flex-shrink: 0;
    }
`;
