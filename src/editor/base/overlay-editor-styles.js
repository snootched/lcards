/**
 * @fileoverview Shared styles for context-aware overlay editors
 * (grid cell, row, and column editors).
 */

import { css } from 'lit';

export const overlayEditorStyles = css`
    :host {
        display: block;
        position: fixed;
        z-index: 10000;
        background: var(--card-background-color);
        border: var(--ha-border-width-md) solid var(--primary-color);
        border-radius: var(--ha-border-radius-md);
        box-shadow: var(--ha-box-shadow-l);
        min-width: 320px;
        max-width: 400px;
    }

    .editor-header {
        padding: var(--ha-space-3);
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: var(--ha-border-radius-md) var(--ha-border-radius-md) 0 0;
    }

    .editor-title {
        font-weight: 600;
        font-size: var(--ha-font-size-m);
    }

    .close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: var(--ha-space-1);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background: color-mix(in srgb, white 20%, transparent);
        border-radius: var(--ha-border-radius-sm);
    }

    .editor-content {
        padding: var(--ha-space-3);
        max-height: 400px;
        overflow-y: auto;
    }

    .editor-actions {
        padding: var(--ha-space-3);
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
        display: flex;
        gap: var(--ha-space-2);
        justify-content: flex-end;
    }

    .danger-zone {
        border-top: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color) 40%, transparent);
        padding: var(--ha-space-3);
        margin-top: var(--ha-space-3);
        background: color-mix(in srgb, var(--error-color) 5%, transparent);
        border-radius: var(--ha-border-radius-md);
    }
`;
