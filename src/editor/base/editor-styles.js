/**
 * Shared Editor Styles
 *
 * Common CSS styles for LCARdS editors.
 */

import { css } from 'lit';

export const editorStyles = css`
    :host {
        display: block;
        padding: 16px;
        background: var(--card-background-color, #fff);
    }

    .editor-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .tab-bar {
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        margin-bottom: 12px;
    }

    .tab-content {
        padding: 8px 0;
        min-height: 400px;
    }

    /* Section spacing with CSS variables for density control */
    .section {
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    .section-header {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--primary-text-color, #212121);
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        padding-bottom: 8px;
    }

    .section-description {
        font-size: 14px;
        color: var(--secondary-text-color, #727272);
        margin-bottom: 12px;
        line-height: 1.5;
    }

    .form-row {
        margin-bottom: var(--lcards-section-spacing, 16px);
        display: grid;
        grid-template-columns: 100%;
        grid-gap: 8px;
    }

    .form-row.two-controls {
        grid-template-columns: 50% 50%;
    }

    .form-row-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    .form-row label {
        font-weight: 500;
        color: var(--primary-text-color, #212121);
        font-size: 14px;
        display: block;
        padding: 2px 8px;
    }

    .form-control {
        padding: 2px 8px;
        border-radius: 10px;
        box-sizing: border-box;
    }

    .helper-text {
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        margin-top: 4px;
        line-height: 1.4;
        padding: 0 8px;
    }

    .error-message {
        color: var(--error-color, #f44336);
        background: var(--error-background-color, rgba(244, 67, 54, 0.1));
        padding: 8px 12px;
        border-radius: 4px;
        margin: 8px 0;
        font-size: 14px;
    }

    .error-message ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
    }

    .error-message li {
        margin: 4px 0;
    }

    .warning-message {
        color: var(--warning-color, #ff9800);
        background: var(--warning-background-color, rgba(255, 152, 0, 0.1));
        padding: 8px 12px;
        border-radius: 4px;
        margin: 8px 0;
        font-size: 14px;
    }

    .info-message {
        color: var(--info-color, #2196f3);
        background: var(--info-background-color, rgba(33, 150, 243, 0.1));
        padding: 8px 12px;
        border-radius: 4px;
        margin: 8px 0;
        font-size: 14px;
    }

    /* Info card - standardized launcher card for tabs (Theme Browser, Provenance, Templates) */
    .info-card {
        background: var(--primary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .info-card h3 {
        margin: 0 0 12px 0;
        color: var(--primary-text-color);
        font-size: 18px;
        font-weight: 500;
    }

    .info-card p {
        margin: 8px 0;
        color: var(--secondary-text-color);
        line-height: 1.5;
    }

    .info-card code {
        background: var(--secondary-background-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
    }

    .info-card-content {
        margin-bottom: 16px;
    }

    .info-card-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color);
    }

    ha-textfield,
    ha-selector,
    ha-entity-picker {
        width: 100%;
    }

    /* Expansion panel styling to match legacy */
    ha-expansion-panel {
        margin-bottom: 10px;
        border-radius: var(--ha-card-border-radius, 24px);
    }

    ha-expansion-panel[outlined] {
        border: 2px solid var(--chip-background-color, #e0e0e0);
    }

    ha-expansion-panel[expanded] {
        background-color: var(--chip-background-color, #f5f5f5);
    }

    /* Icon spacing in headers - increased padding */
    h1 ha-icon,
    h2 ha-icon,
    h3 ha-icon,
    h4 ha-icon,
    h5 ha-icon,
    h6 ha-icon {
        margin-right: var(--lcards-icon-spacing, 12px);
        vertical-align: middle;
    }

    .button-group {
        display: flex;
        gap: 8px;
        margin-top: 16px;
    }

    .button-group mwc-button {
        flex: 1;
    }

    /* Monaco editor container */
    .monaco-container {
        height: 500px;
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 4px;
        overflow: hidden;
    }

    /* Horizontal rule styling */
    hr {
        width: 95%;
        border: 1px solid var(--chip-background-color, #e0e0e0);
        margin: 16px auto;
    }

    /* YAML Editor Validation Errors */
    .validation-errors {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .validation-errors ha-alert {
        margin: 0;
    }

    /* Density Variants */
    
    /* Nested Section Spacing - tighter spacing for nested sections */
    lcards-form-section lcards-form-section {
        margin-bottom: 8px;
    }

    /* Section Content Variants */
    .section-content.nested {
        padding: 8px;
    }

    .section-content.compact {
        padding: 8px;
    }

    /* Compact Form Field Variant */
    .form-field.compact {
        margin-bottom: 8px;
        gap: 6px;
    }

    /* Form Row Variants */
    .form-row.compact {
        margin-bottom: 8px;
    }

    .form-row.nested {
        margin-bottom: 8px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        :host {
            padding: 12px;
        }

        .form-row-group,
        .form-row.two-controls {
            grid-template-columns: 1fr;
        }
    }
`;
