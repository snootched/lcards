/**
 * @fileoverview Styles for data source list items (this card's sources and all
 * sources on the page): label/value rows, chips, actions and the empty state.
 *
 * @module editor/components/datasources/datasource-item-styles
 */

import { css } from 'lit';

export const datasourceItemStyles = css`
  .datasources-list {
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-3);
    --lcards-section-spacing: 0;
  }

  .datasource-details {
    padding: var(--ha-space-2);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    gap: var(--ha-space-3);
    padding: 6px 0;
    border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
  }

  .info-row:last-of-type {
    border-bottom: none;
  }

  .info-row .label {
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .info-row .value {
    color: var(--primary-text-color);
    font-family: var(--code-font-family, monospace);
    text-align: right;
    overflow-wrap: anywhere;
  }

  .info-row .value.name {
    font-weight: 600;
    color: var(--primary-color);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-1);
    justify-content: flex-end;
  }

  .chip {
    padding: 2px var(--ha-space-2);
    border-radius: var(--ha-border-radius-pill);
    background: color-mix(in srgb, var(--primary-color) 18%, transparent);
    color: var(--primary-text-color);
    font-size: 12px;
    font-family: var(--code-font-family, monospace);
  }

  .chip.auto {
    background: color-mix(in srgb, var(--warning-color, #ff9800) 22%, transparent);
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-2);
    margin-top: var(--ha-space-3);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--ha-space-2);
    padding: var(--ha-space-10) var(--ha-space-6);
    text-align: center;
    color: var(--secondary-text-color);
  }

  .empty-state ha-icon {
    --mdc-icon-size: 48px;
    color: var(--disabled-text-color);
  }

  .empty-state p {
    margin: 0;
  }
`;
