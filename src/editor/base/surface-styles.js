/**
 * @fileoverview Surfaces shared by the config panel, its tabs and the editor
 * dialogs: the inset content area, its scrolling body, status banners and hint
 * text. Taken from the config panel (the reference look); see "Dialogs, surfaces
 * and messages" in .github/instructions/editor.instructions.md.
 *
 * Class names: `.studio-layout` / `.scrollable-body` are the names the panel tabs
 * use; `.inset-surface` / `.scroll-body` are the same styles for new code. Studio
 * dialogs have their own `.studio-layout` (a split grid), so they import
 * messageStyles only.
 *
 * @module editor/base/surface-styles
 */

import { css } from 'lit';

/**
 * Banners and hint text: safe in any component (the dialogs and studios use these;
 * their own `.studio-layout` is the studio split grid, not the panel inset).
 */
export const messageStyles = css`
  /* Status banners (tinted, outlined), for state the user should see at once. */
  .banner {
    display: flex;
    align-items: center;
    gap: var(--ha-space-3);
    padding: var(--ha-space-3) var(--ha-space-4);
    border-radius: var(--ha-border-radius-md);
    font-size: 0.9em;
    color: var(--primary-text-color);
  }
  .banner.info {
    background: color-mix(in srgb, var(--info-color, #03a9f4) 12%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 35%, transparent);
  }
  .banner.warning {
    background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
  }
  .banner.error {
    background: color-mix(in srgb, var(--error-color, #f44336) 15%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color, #f44336) 40%, transparent);
  }
  .banner.success {
    background: color-mix(in srgb, var(--success-color, #4caf50) 15%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--success-color, #4caf50) 40%, transparent);
  }

  /* Helper text under a field or a section. */
  .hint {
    font-size: var(--ha-font-size-s);
    line-height: 1.4;
    color: var(--secondary-text-color);
  }
`;

/**
 * The config panel's inset area and its scrolling body (`.studio-layout` /
 * `.scrollable-body` in the panel tabs), plus the banners and hints. For panel
 * tabs; studio dialogs use studioDialogStyles (whose `.studio-layout` is a grid).
 */
export const surfaceStyles = css`
  /* The inset content area: a darker card the content sits in. */
  .studio-layout,
  .inset-surface {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--primary-background-color);
    min-height: 0;
    border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
    padding: var(--ha-space-4);
  }

  /* The inset area's scrolling column; the gap spaces sections. */
  .scrollable-body,
  .scroll-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-4);
    padding-bottom: var(--ha-space-2);
    /* lcards-form-section's own margin is replaced by the gap */
    --lcards-section-spacing: 0;
  }

  ${messageStyles}
`;
