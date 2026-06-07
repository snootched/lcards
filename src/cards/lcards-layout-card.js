/**
 * @fileoverview lcards-layout-card — a CSS Grid container card.
 *
 * The card version of `lcards-layout-view`: renders a CSS Grid and places its
 * own `cards: []` into named areas via per-card `view_layout`. Use it to build a
 * sub-grid inside a single area of an `lcards-layout-view` (or any view/stack).
 *
 * Schema mirrors the view:
 *
 *   type: custom:lcards-layout-card
 *   layout:
 *     grid-template-columns: "1fr 1fr"
 *     grid-template-rows: "auto auto"
 *     grid-template-areas: |
 *       "a b"
 *       "c c"
 *     grid-gap: "6px"
 *     areas: { ... }          # per-area surfaces (background/border/etc.)
 *   cards:
 *     - type: custom:lcards-button
 *       view_layout: { grid-area: a, place-self: center }
 *
 * Unlike the view, HA does NOT provide pre-built card elements to a card — we
 * build the children ourselves. They are wrapped in HA's `hui-card` so the
 * cards' native Visibility conditions and lifecycle keep working.
 *
 * Visual editing happens in the card's GUI editor (lcards-layout-card-editor),
 * not on the live dashboard — so this element renders read-only. The editor sets
 * the `editing` property to reserve the top/left gutter for the overlay's
 * row/column headers.
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { parseLayoutConfig } from '../views/layout-grid-utils.js';
import {
    buildGridStyle,
    applyCardPlacement,
    renderAreaSurfaces,
} from '../views/layout-render.js';

// Static import so getConfigElement() can return the editor synchronously
// (the bundle is a single file; no code-splitting).
import '../editor/cards/lcards-layout-card-editor.js';
import { layoutCardSchema } from './schemas/layout-card-schema.js';

export class LCARdSLayoutCard extends LitElement {

    static CARD_TYPE = 'layout-card';

    static properties = {
        hass:     { attribute: false },
        editing:  { type: Boolean },   // set by the editor to reserve the overlay gutter
        _config:  { state: true },
        _columns: { state: true },
        _rows:    { state: true },
        _areas:   { state: true },
        _gap:     { state: true },
    };

    constructor() {
        super();
        this._config   = {};
        this._columns  = ['1fr', '1fr'];
        this._rows     = ['1fr'];
        this._areas    = [['.', '.']];
        this._gap      = '5px';
        this.editing   = false;
        this._cardElements = [];
        this._helpers  = null;
    }

    static getStubConfig() {
        return {
            layout: {
                'grid-template-columns': '1fr 1fr',
                'grid-template-rows': 'auto',
            },
            cards: [],
        };
    }

    static getConfigElement() {
        return document.createElement('lcards-layout-card-editor');
    }

    /** Register the config schema with CoreConfigManager (called from lcards.js). */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;
        if (!configManager) {
            lcardsLog.error('[LCARdSLayoutCard] CoreConfigManager not available for schema registration');
            return;
        }
        configManager.registerCardSchema('layout-card', layoutCardSchema);
        lcardsLog.debug('[LCARdSLayoutCard] Schema registered with CoreConfigManager');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HA card interface
    // ─────────────────────────────────────────────────────────────────────────

    setConfig(config) {
        const next = JSON.parse(JSON.stringify(config ?? {}));
        const cardsChanged =
            JSON.stringify(next.cards ?? []) !== JSON.stringify(this._config?.cards ?? []);
        this._config = next;

        const { columns, rows, areas, gap } = parseLayoutConfig(this._config.layout);
        this._columns = columns;
        this._rows    = rows;
        this._areas   = areas;
        this._gap     = gap;

        // Only rebuild child elements when the cards list actually changed — layout
        // edits (resize/areas) just re-place the existing children.
        if (cardsChanged || !this._cardElements?.length) {
            this._buildChildren();
        } else {
            this.requestUpdate();
            this.updateComplete.then(() => this._placeCards());
        }
    }

    set hass(hass) {
        this._hass = hass;
        this._propagateHass();
    }
    get hass() { return this._hass; }

    getCardSize() {
        return Math.max(1, this._rows.length);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Children
    // ─────────────────────────────────────────────────────────────────────────

    async _buildChildren() {
        if (!this._helpers && window.loadCardHelpers) {
            try { this._helpers = await window.loadCardHelpers(); } catch { /* ignore */ }
        }
        const cards = this._config?.cards ?? [];
        this._cardElements = cards.map((cfg) => this._createChild(cfg));
        this._propagateHass();
        this.requestUpdate();
        this.updateComplete.then(() => this._placeCards());
    }

    /**
     * Build a single child element. Prefer HA's `hui-card` wrapper so the card's
     * native Visibility conditions and lifecycle are honoured; fall back to a raw
     * card element (or error card) if hui-card isn't available.
     */
    _createChild(cardConfig) {
        try {
            if (customElements.get('hui-card')) {
                const el = document.createElement('hui-card');
                el.config = cardConfig;
                el.editMode = false;
                if (this._hass) el.hass = this._hass;
                return el;
            }
            if (this._helpers?.createCardElement) {
                const el = this._helpers.createCardElement(cardConfig);
                if (this._hass) el.hass = this._hass;
                return el;
            }
        } catch (e) {
            lcardsLog.warn('[LCARdSLayoutCard] Failed to build child card', { error: e?.message });
        }
        const err = document.createElement('hui-error-card');
        try { err.setConfig?.({ type: 'error', error: 'Unable to build card', origConfig: cardConfig }); } catch { /* ignore */ }
        return err;
    }

    _propagateHass() {
        if (!this._hass) return;
        for (const el of this._cardElements ?? []) {
            try { el.hass = this._hass; } catch { /* ignore */ }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render / placement
    // ─────────────────────────────────────────────────────────────────────────

    updated(changed) {
        if (changed.has('_config') || changed.has('_columns') || changed.has('_rows')
            || changed.has('_areas') || changed.has('_gap') || changed.has('editing')) {
            this._placeCards();
        }
    }

    render() {
        const layout = this._config?.layout ?? {};
        const gridStyle = buildGridStyle(layout, this._columns, this._rows, this._areas, this._gap, {
            withGutter: this.editing,
            defaultHeight: '100%',
        });
        return html`<div id="grid-root" style="${gridStyle}"></div>`;
    }

    _placeCards() {
        const grid = this.renderRoot?.querySelector('#grid-root');
        if (!grid) return;
        grid.innerHTML = '';

        const layout       = this._config?.layout ?? {};
        const cardMargin   = layout.card_margin ?? null;
        const cardOverflow = layout.card_overflow ?? 'visible';

        renderAreaSurfaces(grid, layout, this._areas);

        (this._cardElements ?? []).forEach((cardEl, i) => {
            const viewLayout   = this._config?.cards?.[i]?.view_layout ?? {};
            const areaSettings = layout.areas?.[viewLayout['grid-area']] ?? {};
            applyCardPlacement(cardEl, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings);
            grid.appendChild(cardEl);
        });
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            box-sizing: border-box;
            height: 100%;
        }
        #grid-root {
            display: grid;
            box-sizing: border-box;
            /* grid-template-* / gap / height set inline via buildGridStyle */
        }
        .area-surface {
            box-sizing: border-box;
            min-width: 0;
            min-height: 0;
            pointer-events: none;
            z-index: 0;
        }
    `;
}
