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
        border: 2px solid var(--primary-color);
        border-radius: 8px;
        box-shadow: var(--ha-box-shadow-l);
        min-width: 320px;
        max-width: 400px;
    }

    .editor-header {
        padding: 12px;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 6px 6px 0 0;
    }

    .editor-title {
        font-weight: 600;
        font-size: 14px;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    .editor-content {
        padding: 12px;
        max-height: 400px;
        overflow-y: auto;
    }

    .editor-actions {
        padding: 12px;
        border-top: 1px solid var(--divider-color);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .danger-zone {
        border-top: 1px solid color-mix(in srgb, var(--error-color) 40%, transparent);
        padding: 12px;
        margin-top: 12px;
        background: color-mix(in srgb, var(--error-color) 5%, transparent);
        border-radius: 6px;
    }
`;
