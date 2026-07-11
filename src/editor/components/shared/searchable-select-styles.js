/**
 * @fileoverview Shared CSS for `ha-selector` select-type fields with
 * `custom_value: true` (the "searchable dropdown" pattern — HA renders these
 * as `<ha-generic-picker>`, a combo-box, instead of the plain `<ha-select>`).
 *
 * Fixes a real regression: `<ha-generic-picker>`'s popup width is capped to
 * the trigger field's own width (or 250px, whichever is larger) and its
 * option rows are `white-space: nowrap` with no ellipsis/tooltip — long
 * labels get hard-clipped mid-character with no way to read the rest. The
 * old `<ha-select>` menu had no max-width and fully rendered every row, so
 * it auto-sized to the widest option; the new picker virtualizes its list
 * (only visible rows are in the DOM), so true auto-fit isn't reliably
 * achievable — this raises the practical floor instead, mirroring HA's own
 * `max(var(--body-width), 250px)` formula with a much higher minimum.
 *
 * Usage: `static get styles() { return [css\`...\`, searchableSelectStyles]; }`
 *
 * @module editor/components/shared/searchable-select-styles
 */

import { css } from 'lit';

/**
 * Set on :host (not on an "ha-generic-picker" element selector) because the
 * picker renders many shadow-DOM levels below this component (inside
 * ha-selector → ha-selector-select → ha-generic-picker, each its own shadow
 * root) — plain element/class selectors can't cross those boundaries, but
 * CSS custom properties inherit straight through them, so setting the value
 * here reaches the picker's own `var(--ha-generic-picker-width, ...)` fallback
 * read regardless of nesting depth.
 */
export const searchableSelectStyles = css`
  :host {
    --ha-generic-picker-width: max(var(--body-width, 0px), 480px);
    --ha-generic-picker-max-width: max(var(--body-width, 0px), 480px);
  }
`;
