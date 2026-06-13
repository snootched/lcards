/**
 * @fileoverview Add `custom:lcards-layout-view` to HA's "View type" dropdown.
 *
 * HA's `hui-view-editor` builds its View-type `<select>` from a HARD-CODED list
 * (sections / masonry / sidebar / panel) via a `memoizeOne`'d `_schema` — there is
 * no registry, event, or window hook to add a custom view type (confirmed against
 * the HA frontend source). The only way to surface our view in that dropdown is to
 * monkey-patch the editor, exactly as lovelace-layout-card does.
 *
 * This is intentionally DEFENSIVE (Option C): if HA changes the schema shape, we
 * no-op and the dialog is left untouched (users can still set
 * `type: custom:lcards-layout-view` in YAML). It is also idempotent and coexists
 * with layout-card's patch (we chain through whatever `_schema` is already in
 * place using a uniquely-named backup, so neither patch recurses into the other).
 */

import { lcardsLog } from '../utils/lcards-logging.js';

const VIEW_TYPE_OPTION = {
    value: 'custom:lcards-layout-view',
    label: 'LCARdS Layout',
};

customElements.whenDefined('hui-view-editor').then(() => {
    const HuiViewEditor = customElements.get('hui-view-editor');
    if (!HuiViewEditor || HuiViewEditor.__lcardsViewTypePatched) return;
    HuiViewEditor.__lcardsViewTypePatched = true;

    const originalFirstUpdated = HuiViewEditor.prototype.firstUpdated;

    HuiViewEditor.prototype.firstUpdated = function (...args) {
        originalFirstUpdated?.apply(this, args);

        // Chain through the current _schema (which may already be layout-card's
        // wrapper). Use a unique backup name to avoid colliding with other patches.
        if (typeof this._schema !== 'function') return;
        const prevSchema = this._schema;
        this.__lcardsPrevSchema = prevSchema;

        this._schema = (...schemaArgs) => {
            const retval = this.__lcardsPrevSchema(...schemaArgs);
            try {
                if (!Array.isArray(retval)) return retval;
                const typeField = retval.find((f) => f?.name === 'type');
                const options = typeField?.selector?.select?.options;
                if (!Array.isArray(options)) return retval; // shape changed → no-op
                if (!options.some((o) => o?.value === VIEW_TYPE_OPTION.value)) {
                    options.push({ ...VIEW_TYPE_OPTION });
                }
            } catch (e) {
                lcardsLog.debug('[hui-view-editor-patch] skipped (schema shape unexpected)', { error: e?.message });
            }
            return retval;
        };

        // Add a small help note. Deferred to the next frame so it appends AFTER all
        // patches' synchronous firstUpdated appends (e.g. layout-card's note),
        // landing ours below theirs regardless of which patch wrapped last.
        requestAnimationFrame(() => {
            if (!this.shadowRoot || this.shadowRoot.querySelector('.lcards-view-editor-help')) return;
            const help = document.createElement('p');
            help.className = 'lcards-view-editor-help';
            help.innerHTML = `
                You have <b>LCARdS</b> installed, which adds the <b>LCARdS Layout</b> view type.
                See the
                <a href="https://lcards.unimatrix01.ca/cards/layout-view/" target="_blank" rel="noreferrer">LCARdS Layout documentation</a>
                for usage instructions.
                <style>
                    .lcards-view-editor-help { padding: 16px 0 0; margin-bottom: 0; }
                    .lcards-view-editor-help a { color: var(--primary-color); }
                </style>
            `;
            this.shadowRoot.appendChild(help);
        });

        this.requestUpdate?.();
    };

    lcardsLog.debug('[hui-view-editor-patch] hui-view-editor patched: added LCARdS Layout view type');
});
