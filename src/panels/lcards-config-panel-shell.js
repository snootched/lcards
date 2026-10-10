/**
 * @fileoverview Lightweight `lcards-config-panel` element registered in the main
 * chunk. HA's custom panel creates `<lcards-config-panel>` by name and sets
 * hass / narrow / panel / route on it; this shell loads the real panel
 * (lcards-config-panel.js, with its tabs, editors and CodeMirror) only when the
 * panel is opened, then renders it and forwards those properties.
 *
 * @element lcards-config-panel
 */
import { lcardsLog } from '../utils/lcards-logging.js';

const FORWARDED = ['hass', 'narrow', 'panel', 'route'];

export class LCARdSConfigPanelShell extends HTMLElement {
    constructor() {
        super();
        /** @type {Record<string, any>} */
        this._props = {};
        /** @type {HTMLElement|null} */
        this._impl = null;
        this._loading = null;
        // HA may create the element and set properties before the main chunk has
        // defined this class; those land as own properties that would shadow the
        // accessors below, so move them into _props (as Lit does on upgrade).
        for (const key of FORWARDED) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                const value = this[key];
                delete this[key];
                this._props[key] = value;
            }
        }
    }

    connectedCallback() {
        this.style.display = 'block';
        this.style.height = '100%';
        this._loading ??= import('./lcards-config-panel.js')
            .then(() => {
                const impl = document.createElement('lcards-config-panel-impl');
                for (const key of FORWARDED) {
                    if (key in this._props) impl[key] = this._props[key];
                }
                this._impl = impl;
                this.appendChild(impl);
            })
            .catch((error) => {
                this._loading = null; // allow a retry on the next connect
                lcardsLog.error('[LCARdSConfigPanelShell] Failed to load the config panel:', error);
                this.textContent = 'LCARdS: the config panel failed to load. Try a hard refresh.';
            });
    }
}

// hass / narrow / panel / route: keep the latest value and pass it through.
for (const key of FORWARDED) {
    Object.defineProperty(LCARdSConfigPanelShell.prototype, key, {
        get() { return this._props[key]; },
        set(value) {
            this._props[key] = value;
            if (this._impl) this._impl[key] = value;
        },
        configurable: true,
    });
}

if (!customElements.get('lcards-config-panel')) {
    customElements.define('lcards-config-panel', LCARdSConfigPanelShell);
}
