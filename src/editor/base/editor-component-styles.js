/**
 * @fileoverview Shared Editor Component Styles
 *
 * Common patterns for buttons, cards, sections, and layouts.
 * Extracted from MSD Studio, Theme Browser, and Data Grid editors.
 *
 * Usage:
 * ```javascript
 * import { editorComponentStyles } from '../base/editor-component-styles.js';
 *
 * static get styles() {
 *     return [editorStyles, editorComponentStyles];
 * }
 * ```
 */
import { css } from 'lit';

export const editorComponentStyles = css`
    /* Icon Button Pattern (from MSD Studio) */
    ha-icon-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        border: var(--ha-border-width-md) solid transparent;
        transition: all var(--ha-animation-duration-normal, 0.2s);
        --ha-icon-button-size: 40px;
        --mdc-icon-size: 20px;
    }

    ha-icon-button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
        border-color: var(--primary-color);
    }

    ha-icon-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }

    /* Info Card Pattern (from Data Grid Studio) */
    .info-card {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        padding: var(--ha-space-4);
        background: var(--card-background-color);
        border: var(--ha-border-width-md) solid var(--divider-color);
        border-radius: var(--ha-border-radius-lg);
        margin-bottom: var(--ha-space-3);
    }

    .info-card-content h3 {
        margin: 0 0 var(--ha-space-2) 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-text-color);
    }

    .info-card-content p {
        margin: 0;
        font-size: var(--ha-font-size-m);
        color: var(--secondary-text-color);
        line-height: 1.5;
    }

    .info-card-actions {
        display: flex;
        gap: var(--ha-space-2);
        justify-content: flex-start;
    }

    /* Section Headers */
    .section-header-standard {
        font-size: var(--ha-font-size-l);
        font-weight: 500;
        margin-bottom: var(--ha-space-3);
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        padding-bottom: var(--ha-space-2);
    }

    /* Grid Layouts */
    .two-column-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
    }

    .three-column-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: var(--ha-space-3);
    }

    @media (max-width: 768px) {
        .two-column-grid,
        .three-column-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Button Group Pattern */
    .button-group {
        display: flex;
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-3);
    }

    .button-group ha-button {
        flex: 1;
    }

    /* Empty State Pattern */
    .empty-state {
        text-align: center;
        padding: var(--ha-space-8) var(--ha-space-4);
        color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
        font-size: 64px; /* icon display size — no HA token at this scale */
        opacity: 0.3;
        margin-bottom: var(--ha-space-4);
        --mdc-icon-size: 64px;
    }

    .empty-state-title {
        font-size: var(--ha-font-size-l);
        font-weight: 600;
        margin-bottom: var(--ha-space-2);
    }

    .empty-state-subtitle {
        font-size: var(--ha-font-size-m);
        opacity: 0.7;
    }

    /* Toolbar Pattern */
    .toolbar {
        display: flex;
        gap: var(--ha-space-2);
        align-items: center;
        padding: var(--ha-space-2);
        background: var(--secondary-background-color);
        border-radius: var(--ha-border-radius-md);
        margin-bottom: var(--ha-space-3);
    }

    .toolbar-divider {
        width: var(--ha-border-width-sm);
        height: 24px;
        background: var(--divider-color);
        margin: 0 var(--ha-space-1);
    }

    /* Badge Pattern */
    .badge {
        display: inline-flex;
        align-items: center;
        padding: var(--ha-space-1) var(--ha-space-2);
        background: var(--primary-color);
        color: white;
        border-radius: var(--ha-border-radius-md);
        font-size: var(--ha-font-size-s);
        font-weight: 500;
    }

    .badge.secondary {
        background: var(--secondary-text-color);
    }

    .badge.success {
        background: var(--success-color);
    }

    .badge.warning {
        background: var(--warning-color);
    }

    .badge.error {
        background: var(--error-color);
    }
`;
