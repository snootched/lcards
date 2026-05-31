/**
 * @fileoverview Shared Editor Styles
 *
 * Common CSS styles for LCARdS editors.
 */

import { css } from 'lit';

export const editorStyles = css`
    :host {
        display: block;
        padding: 0;
        background: var(--card-background-color, #fff);
    }

    .editor-container {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
    }

    .tab-bar {
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        margin-bottom: var(--ha-space-3);
    }

    .tab-content {
        padding: var(--ha-space-2) 0;
        min-height: 400px;
    }

    /* HA tab group styling */
    ha-tab-group {
        display: block;
        margin-bottom: 0;
        padding: var(--ha-space-3) 0;
    }

    ha-tab-panel {
        padding: 0px;
        min-height: 400px;
    }

    /* Expansion panel styling */
    ha-expansion-panel {
        margin-bottom: var(--lcards-section-spacing, 16px);
        border-radius: var(--ha-card-border-radius, 12px);
    }

    ha-expansion-panel[outlined] {
        border: var(--ha-border-width-md) solid var(--divider-color);
    }

    ha-expansion-panel[expanded] {
        background-color: var(--secondary-background-color);
    }

    /* Form field spacing */
    .form-field {
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    /* Common tab content container (used in Effects tabs, etc.) */
    .tab-content-container {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
    }

    /* Section spacing with CSS variables for density control */
    .section {
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    .section-header {
        font-size: var(--ha-font-size-l);
        font-weight: 500;
        margin-bottom: var(--ha-space-3);
        color: var(--primary-text-color, #212121);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        padding-bottom: var(--ha-space-2);
    }

    .section-description {
        font-size: var(--ha-font-size-m);
        color: var(--secondary-text-color, #727272);
        margin-bottom: var(--ha-space-3);
        line-height: 1.5;
    }

    .form-row {
        margin-bottom: var(--lcards-section-spacing, 16px);
        display: grid;
        grid-template-columns: 100%;
        grid-gap: var(--ha-space-2);
    }

    .form-row.two-controls {
        grid-template-columns: 50% 50%;
    }

    .form-row-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    .form-row label {
        font-weight: 500;
        color: var(--primary-text-color, #212121);
        font-size: var(--ha-font-size-m);
        display: block;
        padding: 2px var(--ha-space-2);
    }

    .form-control {
        padding: 2px var(--ha-space-2);
        border-radius: 10px;
        box-sizing: border-box;
    }

    .helper-text {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color, #727272);
        margin-top: var(--ha-space-1);
        line-height: 1.4;
        padding: 0 var(--ha-space-2);
    }

    .error-message {
        color: var(--error-color, #f44336);
        background: var(--error-background-color, rgba(244, 67, 54, 0.1));
        padding: var(--ha-space-2) var(--ha-space-3);
        border-radius: var(--ha-border-radius-sm);
        margin: var(--ha-space-2) 0;
        font-size: var(--ha-font-size-m);
    }

    .error-message ul {
        margin: var(--ha-space-2) 0 0 0;
        padding-left: var(--ha-space-5);
    }

    .error-message li {
        margin: var(--ha-space-1) 0;
    }

    .warning-message {
        color: var(--warning-color, #ff9800);
        background: var(--warning-background-color, rgba(255, 152, 0, 0.1));
        padding: var(--ha-space-2) var(--ha-space-3);
        border-radius: var(--ha-border-radius-sm);
        margin: var(--ha-space-2) 0;
        font-size: var(--ha-font-size-m);
    }

    .info-message {
        color: var(--info-color, #2196f3);
        background: var(--info-background-color, rgba(33, 150, 243, 0.1));
        padding: var(--ha-space-2) var(--ha-space-3);
        border-radius: var(--ha-border-radius-sm);
        margin: var(--ha-space-2) 0;
        font-size: var(--ha-font-size-m);
    }

    /* Info card - standardized launcher card for tabs (Theme Browser, Provenance, Templates) */
    .info-card {
        background: var(--primary-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: var(--ha-space-6);
        margin-bottom: var(--lcards-section-spacing, 16px);
        box-shadow: var(--ha-box-shadow-s);
    }

    .info-card h3 {
        margin: 0 0 var(--ha-space-3) 0;
        color: var(--primary-text-color);
        font-size: 18px;
        font-weight: 500;
    }

    .info-card p {
        margin: var(--ha-space-2) 0;
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
        margin-bottom: var(--ha-space-4);
    }

    .info-card-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--ha-space-2);
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
        gap: var(--ha-space-2);
    }

    ha-input,
    ha-selector,
    ha-entity-picker {
        width: 100%;
    }

    /* Expansion panel styling to match legacy */
    ha-expansion-panel {
        margin-bottom: 10px;
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-3xl));
    }

    ha-expansion-panel[outlined] {
        border: var(--ha-border-width-md) solid var(--chip-background-color, #e0e0e0);
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
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-4);
    }

    .button-group mwc-button {
        flex: 1;
    }

    /* Monaco editor container */
    .monaco-container {
        height: 500px;
        border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        border-radius: var(--ha-border-radius-sm);
        overflow: hidden;
    }

    /* Horizontal rule styling */
    hr {
        width: 95%;
        border: var(--ha-border-width-sm) solid var(--chip-background-color, #e0e0e0);
        margin: var(--ha-space-4) auto;
    }

    /* YAML Editor Validation Errors */
    .validation-errors {
        margin-top: var(--ha-space-4);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
    }

    .validation-errors ha-alert {
        margin: 0;
    }

    /* Density Variants */

    /* Nested Section Spacing - tighter spacing for nested sections */
    lcards-form-section lcards-form-section {
        margin-bottom: var(--ha-space-2);
    }

    /* Section Content Variants */
    .section-content.nested {
        padding: var(--ha-space-2);
    }

    .section-content.compact {
        padding: var(--ha-space-2);
    }

    /* Compact Form Field Variant */
    .form-field.compact {
        margin-bottom: var(--ha-space-2);
        gap: 6px;
    }

    /* Form Row Variants */
    .form-row.compact {
        margin-bottom: var(--ha-space-2);
    }

    .form-row.nested {
        margin-bottom: var(--ha-space-2);
    }

    /* Responsive design */
    @media (max-width: 768px) {
        :host {
            padding: var(--ha-space-3);
        }

        .form-row-group,
        .form-row.two-controls {
            grid-template-columns: 1fr;
        }
    }
`;
