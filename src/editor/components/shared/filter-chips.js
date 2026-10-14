/**
 * @fileoverview A single-choice row of pill buttons: the one style for category
 * filters and scope pickers (config panel tabs, theme browser, scope selector).
 * The selected pill is solid (brand, accent), the others grey (neutral, filled);
 * all are default-size `ha-button`s so labels stay legible in condensed theme fonts.
 *
 * @example
 * renderFilterChips({
 *   options: [{ value: 'all', label: 'All (12)' }, { value: 'sound', label: 'Sounds (3)', icon: 'mdi:volume-high' }],
 *   selected: this._category,
 *   onSelect: (value) => { this._category = value; },
 * })
 *
 * @module editor/components/shared/filter-chips
 */

import { html } from 'lit';

/**
 * @param {object} args
 * @param {Array<{value: string, label: string, title?: string, icon?: string, swatch?: string}>} args.options
 *   `icon`: an mdi icon before the label; `swatch`: a CSS colour shown as a dot before it.
 * @param {string} args.selected - The selected option's value
 * @param {(value: string) => void} args.onSelect
 * @param {string} [args.className] - Extra class on the row
 * @param {boolean} [args.disabled]
 */
export function renderFilterChips({ options, selected, onSelect, className = '', disabled = false }) {
    return html`
        <div class="filter-chips ${className}" role="radiogroup"
            style="display: flex; flex-wrap: wrap; gap: var(--ha-space-2);">
            ${options.map(opt => html`
                <ha-button
                    role="radio"
                    aria-checked=${selected === opt.value ? 'true' : 'false'}
                    variant=${selected === opt.value ? 'brand' : 'neutral'}
                    appearance=${selected === opt.value ? 'accent' : 'filled'}
                    title=${opt.title ?? ''}
                    ?disabled=${disabled}
                    @click=${() => { if (selected !== opt.value) onSelect(opt.value); }}>
                    ${opt.icon ? html`<ha-icon slot="start" icon=${opt.icon}></ha-icon>` : ''}
                    ${opt.swatch ? html`<span slot="start" style="display: inline-block; width: 10px; height: 10px; border-radius: var(--ha-border-radius-circle); border: var(--ha-border-width-sm) solid var(--divider-color); background-color: ${opt.swatch};"></span>` : ''}
                    ${opt.label}
                </ha-button>
            `)}
        </div>
    `;
}
