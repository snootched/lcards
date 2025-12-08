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
        gap: 16px;
    }
    
    .tab-bar {
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        margin-bottom: 16px;
    }
    
    .tab-content {
        padding: 8px 0;
        min-height: 400px;
    }
    
    .section {
        margin-bottom: 24px;
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
        margin-bottom: 16px;
        line-height: 1.5;
    }
    
    .form-row {
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .form-row-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
    }
    
    .form-row label {
        font-weight: 500;
        color: var(--primary-text-color, #212121);
        font-size: 14px;
        display: block;
    }
    
    .helper-text {
        font-size: 12px;
        color: var(--secondary-text-color, #727272);
        margin-top: 4px;
        line-height: 1.4;
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
    
    ha-textfield,
    ha-selector,
    ha-entity-picker {
        width: 100%;
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
    
    /* Responsive design */
    @media (max-width: 768px) {
        :host {
            padding: 12px;
        }
        
        .form-row-group {
            grid-template-columns: 1fr;
        }
        
        .monaco-container {
            height: 400px;
        }
    }
`;
