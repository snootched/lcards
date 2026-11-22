/**
 * @fileoverview Read-only list of the Home Assistant labels a card's entity carries
 * (reports/ha-labels-plan.md 1d), shown under the Tags field. Labels are set in Home
 * Assistant; rules target them with `ha_label:<id>`. Each chip shows the label's name
 * and id; its tooltip says whether the label is on the entity, its device or its area.
 */

import { LitElement, html, css, nothing } from 'lit';
import { labelsOf, fetchLabelRegistry } from '../../../utils/ha-targets.js';

const FROM = { entity: 'On the entity', device: "On the entity's device", area: "On the entity's area" };

export class LCARdSHaLabels extends LitElement {
    static get properties() {
        return {
            hass: { attribute: false },
            entity: { type: String },
            _registry: { state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = null;
        /** @type {string} */
        this.entity = '';
        /** @type {Map<string, import('../../../utils/ha-targets.js').LabelEntry> | null} */
        this._registry = null;
        this._fetching = false;
    }

    /** @param {Map<string, any>} changed */
    willUpdate(changed) {
        // label names, once per page (fetchLabelRegistry keeps them); ids alone until then or on failure
        if (changed.has('hass') && this.hass && !this._registry && !this._fetching) {
            this._fetching = true;
            fetchLabelRegistry(this.hass).then((registry) => {
                this._registry = registry;
                this._fetching = false;
            });
        }
    }

    render() {
        if (!this.entity) return nothing;
        const labels = labelsOf(this.hass, this.entity);
        if (!labels.length) {
            return html`<div class="hint">This entity has no labels in Home Assistant.</div>`;
        }
        return html`
            <div class="title">Home Assistant labels</div>
            <ha-chip-set>
                ${labels.map(({ id, from }) => {
                    const entry = this._registry?.get(id);
                    const name = entry?.name;
                    return html`
                        <ha-assist-chip
                            .filled=${true}
                            .label=${name && name !== id ? `${name} · ${id}` : id}
                            title=${`${FROM[from]}. In rules: ha_label:${id}`}>
                            ${entry?.icon ? html`<ha-icon slot="icon" .icon=${entry.icon}></ha-icon>` : nothing}
                        </ha-assist-chip>`;
                })}
            </ha-chip-set>
            <div class="hint">Set in Home Assistant. Rules can target them with ha_label:&lt;id&gt;, beside the tags above.</div>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: block;
                margin-top: var(--ha-space-2);
            }
            .title {
                font-size: var(--ha-font-size-s);
                color: var(--secondary-text-color);
                margin-bottom: var(--ha-space-1);
            }
            .hint {
                font-size: var(--ha-font-size-s);
                color: var(--secondary-text-color);
                margin-top: var(--ha-space-1);
            }
            ha-assist-chip {
                cursor: default;
            }
        `;
    }
}

if (!customElements.get('lcards-ha-labels')) customElements.define('lcards-ha-labels', LCARdSHaLabels);
