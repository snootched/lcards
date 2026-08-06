/**
 * @fileoverview Shared CSS for the collapsible "How X works" info-guide
 * pattern, used by the animation, filter, and background-animation editors.
 * Extracted from the animation editor (the original implementation) so the
 * ~90 lines of rules aren't tripled across the three consumers.
 *
 * Usage: `static get styles() { return [css\`...\`, infoGuideStyles]; }`
 *
 * @module editor/components/shared/info-guide-styles
 */

import { css } from 'lit';

export const infoGuideStyles = css`
  .preset-info-guide {
    background: var(--primary-background-color);
    border: var(--ha-border-width-sm) solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    margin: 12px 0;
    font-size: 13px;
    overflow: hidden;
  }

  .preset-info-guide-header {
    display: flex;
    align-items: center;
    gap: var(--ha-space-2);
    padding: var(--ha-space-3) var(--ha-space-3);
    cursor: pointer;
    user-select: none;
    color: var(--primary-color);
    font-weight: 500;
  }

  .preset-info-guide-header:hover {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent);
  }

  .preset-info-guide-header .guide-chevron {
    margin-left: auto;
    transition: transform 0.2s;
  }

  .preset-info-guide-header .guide-chevron.expanded {
    transform: rotate(180deg);
  }

  .preset-info-guide-body {
    padding: 0 var(--ha-space-3) var(--ha-space-3) var(--ha-space-3);
    border-top: var(--ha-border-width-sm) solid var(--divider-color);
    color: var(--primary-text-color);
  }

  .preset-info-guide-body p {
    margin: var(--ha-space-3) 0;
    line-height: 1.6;
    max-width: 65ch;
  }

  .preset-info-guide-body ul {
    margin: 0 0 var(--ha-space-3) 0;
    padding-left: var(--ha-space-5);
    max-width: 65ch;
  }

  .preset-info-guide-body li {
    margin-bottom: var(--ha-space-2);
    line-height: 1.5;
  }

  .preset-info-guide-body code {
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    padding: 2px 6px;
    border-radius: var(--ha-border-radius-sm, 4px);
    font-family: monospace;
    font-size: 12px;
  }

  .preset-info-guide-links {
    display: flex;
    gap: var(--ha-space-4);
    flex-wrap: wrap;
  }

  .preset-info-guide-body a {
    color: var(--primary-color);
  }

  .preset-info-guide-example {
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    border: var(--ha-border-width-sm) solid var(--divider-color);
    border-radius: var(--ha-border-radius-sm, 4px);
    padding: var(--ha-space-2) var(--ha-space-3);
    margin: var(--ha-space-2) 0 var(--ha-space-3) 0;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre;
    overflow-x: auto;
    max-width: 100%;
  }

  .preset-info-guide-missing-note {
    margin: 0 0 var(--ha-space-3) 0;
    line-height: 1.5;
    max-width: 65ch;
    color: var(--secondary-text-color);
    font-size: 12px;
  }

  .preset-info-guide-tip {
    margin: 0 0 var(--ha-space-3) 0;
    line-height: 1.5;
    max-width: 65ch;
    padding: var(--ha-space-2) var(--ha-space-3);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    border-radius: var(--ha-border-radius-sm, 4px);
  }
`;
