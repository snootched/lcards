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

import { renderPickerPicture, inCardPicker, fitPickerHost } from '../utils/picker-picture.js';
import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { visibilityPasses } from '../utils/visibility-conditions.js';
import { parseLayoutConfig, cellHeightDefinite, gridHeightIsDefinite, resolveVisibilityTracks, isAutoPlaced } from '../views/layout-grid-utils.js';
import {
    buildGridStyle,
    applyCardPlacement,
    applyGridItemHeight,
    renderAreaSurfaces,
    placeGridChildren,
    inFittedCell,
} from '../views/layout-render.js';

import { layoutCardSchema } from './schemas/layout-card-schema.js';

export class LCARdSLayoutCard extends LitElement {

    static CARD_TYPE = 'layout-card';

    static properties = {
        hass:     { attribute: false },
        editing:  { type: Boolean },   // set by the editor to reserve the overlay gutter
        preview:  { type: Boolean },   // set by hui-card in dashboard edit mode
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
        this.preview   = false;
        this._cardElements = [];
        this._helpers  = null;
        /** @type {{ mql: MediaQueryList, handler: () => void }[]} */
        this._mediaQueryLists = [];
        // A child's hui-card fires a bubbling, composed `card-visibility-changed`
        // when it hides or shows itself: re-resolve the collapsed tracks.
        this._visibilityRaf = 0;
        this._onCardVisibilityChanged = () => {
            cancelAnimationFrame(this._visibilityRaf);
            this._visibilityRaf = requestAnimationFrame(() => this._applyVisibilityTracks());
        };
    }

    connectedCallback() {
        super.connectedCallback();
        // Home Assistant's card picker shows a picture instead of the grid
        this._inPicker = inCardPicker(this);
        if (this._inPicker) fitPickerHost(this);
        this._setupMediaQueries();

        this.addEventListener('card-visibility-changed', this._onCardVisibilityChanged);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._teardownMediaQueries();
        this.removeEventListener('card-visibility-changed', this._onCardVisibilityChanged);
        cancelAnimationFrame(this._visibilityRaf);
    }

    /**
     * Collapse the row or column of a hidden child (resolveVisibilityTracks, the
     * layout view's rule): a track goes to 0 when every child with a Visibility
     * condition that sits in it alone is hidden, and the `fr` tracks take the
     * space. Written on the grid node after Lit's own style, so it survives
     * re-renders (updated() calls it again). Every track is open while the
     * dashboard or the Layout Studio is editing.
     */
    _applyVisibilityTracks() {
        const grid = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('#grid-root'));
        if (!grid) return;
        const cards = (this._config?.cards ?? []).flatMap((cfg, i) => {
            const area = cfg?.view_layout?.['grid-area'];
            if (!area) return [];
            const conditional = !!cfg?.visibility?.length;
            const h = cfg.layout?.height;
            return [{ area, conditional, hidden: conditional && !!this._cardElements?.[i]?.hidden, targetHeight: h && h !== 'auto' && h !== '100%' ? h : null }];
        });
        if (!cards.some((c) => c.conditional)) return;
        const { rows, columns } = resolveVisibilityTracks(this._activeGrid(), cards, !!(this.preview || this.editing));
        grid.style.gridTemplateRows = rows.join(' ');
        grid.style.gridTemplateColumns = columns.join(' ');
    }

    /** Re-render when a `layout.mediaquery` query starts or stops matching. */
    _setupMediaQueries() {
        this._teardownMediaQueries();
        if (!this.isConnected) return;
        for (const query of Object.keys(this._config?.layout?.mediaquery ?? {})) {
            try {
                const mql = window.matchMedia(query);
                const handler = () => this.requestUpdate();
                mql.addEventListener('change', handler);
                this._mediaQueryLists.push({ mql, handler });
            } catch { /* ignore invalid queries */ }
        }
    }

    _teardownMediaQueries() {
        for (const { mql, handler } of this._mediaQueryLists) mql.removeEventListener('change', handler);
        this._mediaQueryLists = [];
    }

    /**
     * The grid tracks, areas and gap to draw: the editor state, or with
     * `layout.mediaquery` overrides matching (as the layout view applies them)
     * the layout with those overrides merged in. The studio always edits the base.
     */
    _activeGrid() {
        const base = { columns: this._columns, rows: this._rows, areas: this._areas, gap: this._gap };
        const { mediaquery, ...layout } = this._config?.layout ?? {};
        if (!mediaquery || typeof mediaquery !== 'object' || this.editing) return base;
        let merged = null;
        for (const [query, override] of Object.entries(mediaquery)) {
            try {
                if (override && window.matchMedia(query).matches) merged = { ...(merged ?? layout), ...override };
            } catch { /* ignore invalid queries */ }
        }
        return merged ? parseLayoutConfig(merged) : base;
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

    static async getConfigElement() {
        // Editors load on demand (HA awaits getConfigElement), keeping them out of
        // the bundle every dashboard loads.
        await import('../editor/cards/lcards-layout-card-editor.js');
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
        this._setupMediaQueries();

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
                el.preview = this.preview;
                if (this._hass) el.hass = this._hass;
                return el;
            }
            if (this._helpers?.createCardElement) {
                const el = this._helpers.createCardElement(cardConfig);
                el.preview = this.preview;
                if (this._hass) el.hass = this._hass;
                return el;
            }
            // Outside HA's frontend (docs live demos, the browser test harness) there is
            // neither: build a registered custom card directly.
            const tag = typeof cardConfig?.type === 'string' && cardConfig.type.startsWith('custom:') ? cardConfig.type.slice(7) : null;
            if (tag && customElements.get(tag)) {
                const el = /** @type {any} */ (document.createElement(tag));
                el.setConfig?.(cardConfig);
                el.preview = this.preview;
                // hui-card checks Visibility conditions; without it, this card does
                // (_applyFallbackVisibility, on every hass update)
                if (Array.isArray(cardConfig.visibility) && cardConfig.visibility.length) el._lcardsVisibility = cardConfig.visibility;
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
        this._applyFallbackVisibility();
    }

    /**
     * Outside Home Assistant's frontend (no hui-card: the docs, the browser test
     * harness) a child built directly carries its Visibility conditions here: hide it
     * as hui-card would (`hidden`, plus display none, since a card's own :host display
     * outranks the attribute), show every child while editing, and collapse its
     * track as for a hui-card child.
     */
    _applyFallbackVisibility() {
        let changed = false;
        for (const el of /** @type {any[]} */ (this._cardElements ?? [])) {
            if (!el?._lcardsVisibility) continue;
            const hide = !(this.preview || this.editing) && !visibilityPasses(el._lcardsVisibility, this._hass);
            if (!!el.hidden !== hide) {
                el.hidden = hide;
                el.style.display = hide ? 'none' : '';
                changed = true;
            }
        }
        if (changed) {
            cancelAnimationFrame(this._visibilityRaf);
            this._visibilityRaf = requestAnimationFrame(() => this._applyVisibilityTracks());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render / placement
    // ─────────────────────────────────────────────────────────────────────────

    updated(changed) {
        // Mirror the grid height onto the host. Default is 100% (fill the area),
        // but a percentage height collapses to 0 in a content-sized (minmax(0,auto))
        // grid row — so when the user sets layout.height: auto, the host must be
        // 'auto' too (not just #grid-root) or it contributes 0 to the row's
        // max-content and the whole card collapses.
        this.style.height = this._config?.layout?.height ?? '100%';

        // Like hui-stack-card: in edit mode, children stay visible even when their
        // Visibility conditions are not met.
        if (changed.has('preview')) {
            for (const el of this._cardElements ?? []) el.preview = this.preview;
        }
        if (changed.has('preview') || changed.has('editing')) this._applyFallbackVisibility();

        // The parent grid's fitted-cell mark (inFittedCell) changed since the last
        // placement: applyCardPlacement asked for this update.
        const fitChanged = this._placedInFittedCell !== undefined && this._placedInFittedCell !== inFittedCell(this);
        if (fitChanged || changed.has('_config') || changed.has('_columns') || changed.has('_rows')
            || changed.has('_areas') || changed.has('_gap') || changed.has('editing')) {
            this._placeCards();
        }
        // Lit wrote the configured tracks back with the style attribute
        this._applyVisibilityTracks();
    }

    render() {
        if (this._inPicker) return renderPickerPicture('layout-card', 'A layout: the Bridge screen, a chart, readouts and rows of controls in an LCARS frame');
        const layout = this._config?.layout ?? {};
        const { columns, rows, areas, gap } = this._activeGrid();
        const gridStyle = buildGridStyle(layout, columns, rows, areas, gap, {
            // The layout studio sets `editing` while its grid editor is on the canvas.
            editMode: this.editing ? 'grid' : null,
            defaultHeight: '100%',
        });
        return html`<div id="grid-root" style="${gridStyle}"></div>`;
    }

    _placeCards() {
        const grid = /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('#grid-root'));
        if (!grid) return;
        const layout       = this._config?.layout ?? {};
        const cardMargin   = layout.card_margin ?? null;
        const cardOverflow = layout.card_overflow ?? 'visible';

        const active = this._activeGrid();
        const surfaces = document.createDocumentFragment();
        renderAreaSurfaces(surfaces, layout, active.areas);
        // A % height (100% by default) is definite when this card's own cell is: a
        // layout card filling a fixed cell gives its fr and % rows a definite height.
        const height = layout.height ?? '100%';
        const gridDefinite = gridHeightIsDefinite(height)
            || (String(height).trim().endsWith('%') && inFittedCell(this));
        this._placedInFittedCell = inFittedCell(this);

        const autoRows = layout['grid-auto-rows'] ?? null;
        let autoIndex = 0;
        (this._cardElements ?? []).forEach((cardEl, i) => {
            const childCfg     = this._config?.cards?.[i];
            const viewLayout   = childCfg?.view_layout ?? {};
            const areaSettings = layout.areas?.[viewLayout['grid-area']] ?? {};
            const auto         = isAutoPlaced(viewLayout)
                ? { index: autoIndex++, columns: active.columns?.length ?? 1, autoRows } : null;
            const cellFits     = cellHeightDefinite(active.rows, active.areas, viewLayout, gridDefinite, auto);
            applyCardPlacement(cardEl, cardEl, viewLayout, cardMargin, cardOverflow, areaSettings, { cellFits });
            applyGridItemHeight(cardEl, childCfg);
        });
        // cards already in place stay put (no disconnect and reconnect, #409)
        placeGridChildren(grid, this._cardElements ?? [], surfaces);
        this._applyVisibilityTracks();
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
