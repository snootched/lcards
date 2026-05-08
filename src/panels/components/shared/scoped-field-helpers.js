/**
 * @fileoverview Shared helpers for scoped-settings field badges.
 *
 * Used by lcards-connectivity-tab and lcards-sound-config-tab (and any future
 * settings tab that needs per-field origin badges for ScopedSettingsService data).
 */

import { html } from 'lit';

/**
 * Return a small ha-assist-chip indicating which scope a field's effective value
 * comes from. Always renders — shows "global" (primary tint) when the value falls
 * through to the global / hardcoded default, or the scope colour when an explicit
 * override exists at the device or user tier.
 *
 * @param {'device'|'user'|'global'} resolvedScope  Which scope provides the value.
 * @param {boolean} [isAdminTarget=false]            If true, labels the chip 'override'
 *                                                   instead of the scope name.
 * @returns {import('lit').TemplateResult}
 */
export function originBadge(resolvedScope, isAdminTarget = false) {
    const label = isAdminTarget ? 'override' : resolvedScope;
    const bg = resolvedScope === 'user'
        ? 'color-mix(in srgb, var(--info-color, #03a9f4) 25%, transparent)'
        : resolvedScope === 'device'
            ? 'color-mix(in srgb, var(--success-color, #4caf50) 25%, transparent)'
            : 'color-mix(in srgb, var(--primary-color, #7b6ff0) 30%, transparent)';
    const fg = resolvedScope === 'user'
        ? 'var(--info-color, #03a9f4)'
        : resolvedScope === 'device'
            ? 'var(--success-color, #4caf50)'
            : 'var(--primary-color, #7b6ff0)';
    return html`<ha-assist-chip
      .filled=${true}
      .label=${label}
      style="
        --ha-assist-chip-filled-container-color: ${bg};
        --md-assist-chip-label-text-color: ${fg};
        --md-sys-color-on-surface: ${fg};
        --ha-assist-chip-container-height: 22px;
        --md-assist-chip-label-text-font-size: 0.7rem;
      "
    ></ha-assist-chip>`;
}
