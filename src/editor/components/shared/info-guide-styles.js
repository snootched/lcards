/**
 * @fileoverview Shared CSS for the info guide (renderInfoGuide in
 * shared/info-guide.js): the `.info-guide*` rules. Included in editorStyles,
 * so every editor and studio has them.
 *
 * @module editor/components/shared/info-guide-styles
 */

import { css } from 'lit';

export const infoGuideStyles = css`
  /* The info guide's body (renderInfoGuide: an lcards-form-section variant="guide") */
  .info-guide-body {
    color: var(--primary-text-color);
    font-size: 14px;
    line-height: 1.6;
  }

  .info-guide-body > :first-child {
    margin-top: 0;
  }

  .info-guide-body p {
    margin: 0 0 var(--ha-space-3);
    max-width: 75ch;
  }

  .info-guide-body ul,
  .info-guide-body ol {
    margin: 0 0 var(--ha-space-3);
    padding-left: var(--ha-space-5);
    max-width: 75ch;
  }

  .info-guide-body li {
    margin-bottom: var(--ha-space-1);
  }

  .info-guide-body code {
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    padding: 1px 6px;
    border-radius: var(--ha-border-radius-sm);
    font-family: var(--code-font-family, monospace);
    font-size: 13px;
  }

  .info-guide-body a,
  .info-guide-links a {
    color: var(--primary-color);
  }

  .info-guide-example {
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    border-radius: var(--ha-border-radius-sm);
    padding: var(--ha-space-2) var(--ha-space-3);
    margin: 0 0 var(--ha-space-3);
    font-family: var(--code-font-family, monospace);
    font-size: 13px;
    white-space: pre;
    overflow-x: auto;
  }

  .info-guide-tip {
    margin: 0 0 var(--ha-space-3);
    padding: var(--ha-space-2) var(--ha-space-3);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border-radius: var(--ha-border-radius-sm);
  }

  .info-guide-note {
    margin: 0 0 var(--ha-space-3);
    color: var(--secondary-text-color);
    font-size: 13px;
  }

  .info-guide-links {
    display: flex;
    gap: var(--ha-space-4);
    flex-wrap: wrap;
  }

  .info-guide-body lcards-message {
    display: block;
    margin-top: var(--ha-space-2);
  }
`;
