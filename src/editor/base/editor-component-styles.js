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
        border: 2px solid transparent;
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
        gap: 12px;
        padding: 16px;
        background: var(--card-background-color);
        border: 2px solid var(--divider-color);
        border-radius: var(--ha-border-radius-lg);
        margin-bottom: 12px;
    }

    .info-card-content h3 {
        margin: 0 0 8px 0;
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
        gap: 8px;
        justify-content: flex-start;
    }

    /* Section Headers */
    .section-header-standard {
        font-size: var(--ha-font-size-l);
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color);
        padding-bottom: 8px;
    }

    /* Grid Layouts */
    .two-column-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .three-column-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
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
        gap: 8px;
        margin-top: 12px;
    }

    .button-group ha-button {
        flex: 1;
    }

    /* Empty State Pattern */
    .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
        font-size: 64px; /* icon display size — no HA token at this scale */
        opacity: 0.3;
        margin-bottom: 16px;
        --mdc-icon-size: 64px;
    }

    .empty-state-title {
        font-size: var(--ha-font-size-l);
        font-weight: 600;
        margin-bottom: 8px;
    }

    .empty-state-subtitle {
        font-size: var(--ha-font-size-m);
        opacity: 0.7;
    }

    /* Toolbar Pattern */
    .toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 8px;
        background: var(--secondary-background-color);
        border-radius: var(--ha-border-radius-md);
        margin-bottom: 12px;
    }

    .toolbar-divider {
        width: 1px;
        height: 24px;
        background: var(--divider-color);
        margin: 0 4px;
    }

    /* Badge Pattern */
    .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
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
