/**
 * @fileoverview lcards-layout-studio-dialog — full-screen editor for lcards-layout-card.
 *
 * HA's card-edit dialog is too small for a grid WYSIWYG, so (like the MSD / Chart
 * / Data Grid studios) layout-card editing happens here. Follows the shared studio
 * pattern: a WebAwesome `ha-dialog` sized via `studioDialogStyles`, a `.studio-layout`
 * split with a config panel (HA tab group) on the left and a live preview canvas on
 * the right. The canvas hosts a single preview card + the shared grid-edit overlay
 * (tracks / areas / surfaces). Each card gets a tab with an inline
 * `hui-card-element-editor` + placement controls.
 *
 * Owns one preview + one overlay for its lifetime (destroyed on close), so the
 * duplicate-overlay / alignment issues of in-dialog editing don't arise. Mutates a
 * working copy and emits `config-changed`; the card's GUI editor relays it to HA.
 */

import { LitElement, html, css, nothing } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { editorStyles } from '../base/editor-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import {
    parseLayoutConfig,
    serializeLayoutConfig,
    getAreaNames,
    renameAreaSettings,
    pruneAreaSettings,
} from '../../views/layout-grid-utils.js';
import { showConfirmDeleteDialog, showInfoDialog } from '../../views/layout-edit-dialogs.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-color-picker.js';
import '../components/yaml/lcards-yaml-editor.js';
import { configToYaml, yamlToConfig } from '../utils/yaml-utils.js';

const ALIGN_V_OPTIONS = [
    { value: 'stretch', label: 'Stretch (default)' },
    { value: 'start',   label: 'Top' },
    { value: 'center',  label: 'Center' },
    { value: 'end',     label: 'Bottom' },
];
const ALIGN_H_OPTIONS = [
    { value: 'stretch', label: 'Stretch (default)' },
    { value: 'start',   label: 'Left' },
    { value: 'center',  label: 'Center' },
    { value: 'end',     label: 'Right' },
];
const OVERFLOW_OPTIONS = [
    { value: 'visible', label: 'Visible — bleeds beyond cell' },
    { value: 'clip',    label: 'Clip — hard clip, no scroll' },
    { value: 'hidden',  label: 'Hidden — clip + block context' },
    { value: 'auto',    label: 'Scroll when needed (auto)' },
    { value: 'scroll',  label: 'Always scroll' },
];
const BORDER_STYLE_OPTIONS = [
    { value: 'none',   label: 'None' },
    { value: 'solid',  label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];
const BG_SIZE_OPTIONS = [
    { value: 'cover',     label: 'Cover (fill & crop)' },
    { value: 'contain',   label: 'Contain (fit whole)' },
    { value: '100% 100%', label: 'Stretch' },
    { value: 'auto',      label: 'Auto (natural size)' },
];
const BG_POSITION_OPTIONS = [
    { value: 'center', label: 'Center' },
    { value: 'top',    label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left',   label: 'Left' },
    { value: 'right',  label: 'Right' },
];
const BG_REPEAT_OPTIONS = [
    { value: 'no-repeat', label: 'No repeat' },
    { value: 'repeat',    label: 'Repeat' },
    { value: 'repeat-x',  label: 'Repeat X' },
    { value: 'repeat-y',  label: 'Repeat Y' },
];

export class LCARdSLayoutStudioDialog extends LitElement {

    static get properties() {
        return {
            hass:           { attribute: false },
            _workingConfig: { state: true },
            _activeTab:     { state: true },   // 'layout' | 'card-<index>' | 'yaml'
        };
    }

    set config(value) {
        this._handled       = false;  // reset so the new session can save/cancel once
        this._initialConfig = JSON.parse(JSON.stringify(value ?? {}));
        this._workingConfig = JSON.parse(JSON.stringify(value ?? {}));
    }
    get config() { return this._workingConfig; }

    constructor() {
        super();
        this.hass = undefined;
        this._initialConfig = {};
        this._workingConfig = {};
        this._handled       = false;  // true after the first save or cancel; prevents ha-dialog's
                                      // async 'closed' event from re-dispatching config-changed
        this._activeTab = 'layout'; // 'layout' | 'card-<index>' | 'yaml'
        this._previewEl = null;
        this._overlayEl = null;
        this._pickerDialog = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._realGridObserver?.disconnect();
        this._realGridObserver = null;
        this._previewEl?.remove();
        this._overlayEl?.remove();
        this._pickerDialog?.remove();
        this._previewEl = this._overlayEl = null;
    }

    updated() {
        this._syncCanvas();
    }

    _cardIndexFromTab() {
        if (typeof this._activeTab === 'string' && this._activeTab.startsWith('card-')) {
            return Number(this._activeTab.slice(5));
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Canvas: live preview + single grid-edit overlay
    // ─────────────────────────────────────────────────────────────────────────

    _syncCanvas() {
        const canvas = this.renderRoot?.querySelector('#canvas');
        if (!canvas) return;

        if (!this._previewEl) {
            this._previewEl = document.createElement('lcards-layout-card');
            canvas.appendChild(this._previewEl);
        }
        this._previewEl.editing = true;
        this._previewEl.hass = this.hass;
        this._previewEl.setConfig?.(JSON.parse(JSON.stringify(this.config ?? {})));

        // Observe the real grid so the overlay's ghost can mirror content-sized
        // tracks (auto / min-content) — otherwise the empty ghost diverges from the
        // real grid whenever an `auto` row holds a tall card.
        this._previewEl.updateComplete?.then(() => {
            const realGrid = this._previewEl?.renderRoot?.querySelector('#grid-root');
            if (realGrid && !this._realGridObserver) {
                this._realGridObserver = new ResizeObserver(() => this._syncMeasureTracks());
                this._realGridObserver.observe(realGrid);
            }
            this._syncMeasureTracks();
        });

        if (!this._overlayEl) {
            const el = document.createElement('lcards-grid-edit-overlay');
            el.hideCardMode = true;
            el.hideSettings = true; // the studio's Layout tab is the single grid-settings source
            el.addEventListener('grid-state-changed',      (e) => this._onGridStateChanged(e));
            el.addEventListener('grid-preview-changed',    (e) => this._onGridPreviewChanged(e));
            el.addEventListener('area-settings-changed',   (e) => this._onAreaSettingsChanged(e));
            el.addEventListener('area-renamed',            (e) => this._onAreaRenamed(e));
            el.addEventListener('layout-settings-changed', (e) => this._onLayoutSettingsChanged(e));
            el.addEventListener('area-cards-changed',      (e) => this._onAreaCardsChanged(e));
            el.addEventListener('add-card-to-area',        (e) => this._onAddCardToArea(e));
            canvas.appendChild(el);
            this._overlayEl = el;
            // The dialog open animation can leave the first measurement stale (cells
            // sized mid-transition). Re-measure after it settles so headers/areas
            // line up with the real grid.
            requestAnimationFrame(() => this._overlayEl?.refresh?.());
            setTimeout(() => this._overlayEl?.refresh?.(), 250);
        }
        const { columns, rows, areas, gap } = parseLayoutConfig(this.config?.layout);
        const o = this._overlayEl;
        o.hass        = this.hass;
        o.columns     = columns;
        o.rows        = rows;
        o.areas       = areas;
        o.gap         = gap;
        o.cardConfigs = this.config?.cards ?? [];
        o.layout      = this.config?.layout ?? {};
    }

    /** Feed the overlay the real grid's resolved px track sizes so its ghost grid
     *  matches content-sized tracks (auto / min-content). */
    _syncMeasureTracks() {
        const realGrid = this._previewEl?.renderRoot?.querySelector('#grid-root');
        if (!realGrid || !this._overlayEl) return;
        const cs = getComputedStyle(realGrid);
        const cols = cs.gridTemplateColumns;
        const rows = cs.gridTemplateRows;
        if (cols && cols !== 'none') this._overlayEl.measureColumns = cols.trim().split(/\s+/);
        if (rows && rows !== 'none') this._overlayEl.measureRows = rows.trim().split(/\s+/);
        this._overlayEl.refresh?.();
    }

    /** Push a live preview of the working config without re-rendering the studio. */
    _refreshPreview() {
        this._previewEl?.setConfig?.(JSON.parse(JSON.stringify(this.config ?? {})));
        if (this._overlayEl) {
            const { columns, rows, areas, gap } = parseLayoutConfig(this.config?.layout);
            this._overlayEl.columns = columns;
            this._overlayEl.rows = rows;
            this._overlayEl.areas = areas;
            this._overlayEl.gap = gap;
            this._overlayEl.cardConfigs = this.config?.cards ?? [];
            this._overlayEl.layout = this.config?.layout ?? {};
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Change plumbing
    // ─────────────────────────────────────────────────────────────────────────

    _commit(newConfig) {
        this._workingConfig = newConfig;
        this.requestUpdate();
        this.updateComplete.then(() => this._syncCanvas());
    }

    /** Commit WITHOUT re-rendering the studio — used by the inline child editor
     *  so typing doesn't reset its own value binding. */
    _commitQuiet() {
        this._refreshPreview();
    }

    // ─── Overlay handlers ──────────────────────────────────────────────────────

    _onGridPreviewChanged(ev) {
        ev.stopPropagation();
        const { columns, rows, gap } = ev.detail;
        const grid = this._previewEl?.renderRoot?.querySelector('#grid-root');
        if (!grid) return;
        if (columns) grid.style.gridTemplateColumns = columns.join(' ');
        if (rows)    grid.style.gridTemplateRows    = rows.join(' ');
        if (gap)     grid.style.gap                 = gap;
    }

    _onGridStateChanged(ev) {
        ev.stopPropagation();
        const { columns, rows, areas, gap } = ev.detail;
        let layout = serializeLayoutConfig(columns, rows, areas, gap, this.config?.layout ?? {});
        if (layout.areas) layout = { ...layout, areas: pruneAreaSettings(layout.areas, getAreaNames(areas)) };
        this._commit({ ...this.config, layout });
    }

    _onAreaRenamed(ev) {
        ev.stopPropagation();
        const { from, to } = ev.detail ?? {};
        const layout = this.config?.layout;
        if (!layout?.areas || layout.areas[from] === undefined) return;
        this._commit({ ...this.config, layout: { ...layout, areas: renameAreaSettings(layout.areas, from, to) } });
    }

    _onAreaSettingsChanged(ev) {
        ev.stopPropagation();
        const { name, key, value } = ev.detail ?? {};
        if (!name || !key) return;
        this._setAreaSetting(name, key, value);
    }

    /** Merge one per-area surface setting (empty value removes the key / area). */
    _setAreaSetting(name, key, value) {
        const layout = this.config?.layout ?? {};
        const areas  = { ...(layout.areas ?? {}) };
        const s      = { ...(areas[name] ?? {}) };
        if (value == null || value === '') delete s[key];
        else s[key] = value;
        if (Object.keys(s).length > 0) areas[name] = s;
        else delete areas[name];
        this._commit({ ...this.config, layout: { ...layout, areas } });
    }

    _onLayoutSettingsChanged(ev) {
        ev.stopPropagation();
        this._commit({ ...this.config, layout: ev.detail.layout });
    }

    _onAreaCardsChanged(ev) {
        ev.stopPropagation();
        this._commit({ ...this.config, cards: ev.detail.cards });
    }

    _onAddCardToArea(ev) {
        ev.stopPropagation();
        this._addCard(ev.detail?.areaName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    render() {
        const cards = this.config?.cards ?? [];
        const activeIdx = this._cardIndexFromTab();
        return html`
            <ha-dialog
                open
                @closed=${(e) => { e.stopPropagation(); this._handleCancel(); }}
                header-title="Layout Studio">

                <div class="dialog-content">
                    <div class="studio-layout">
                        <!-- Left: config tabs -->
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                                <ha-tab-group-tab value="layout" ?active=${this._activeTab === 'layout'}>
                                    <ha-icon icon="mdi:grid"></ha-icon>
                                    Layout
                                </ha-tab-group-tab>
                                ${cards.map((c, i) => html`
                                    <ha-tab-group-tab value="card-${i}" ?active=${this._activeTab === `card-${i}`}>
                                        <ha-icon icon="mdi:card-outline"></ha-icon>
                                        ${i + 1}: ${(c.type ?? 'card').replace('custom:', '')}
                                    </ha-tab-group-tab>
                                `)}
                                <ha-tab-group-tab value="yaml" ?active=${this._activeTab === 'yaml'}>
                                    <ha-icon icon="mdi:code-braces"></ha-icon>
                                    YAML
                                </ha-tab-group-tab>
                            </ha-tab-group>

                            <div class="tab-content">
                                ${this._activeTab === 'layout' ? this._renderLayoutTab()
                                : this._activeTab === 'yaml'   ? this._renderYamlTab()
                                : this._renderCardTab(activeIdx)}
                            </div>
                        </div>

                        <!-- Right: live preview canvas + overlay. Cards are added per
                             area via the overlay's area tools, so there's no global
                             "add card" here. -->
                        <div class="preview-panel">
                            <div class="preview-container">
                                <div id="canvas" class="canvas"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                    <ha-button variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `;
    }

    _renderLayoutTab() {
        const layout = this.config?.layout ?? {};
        const setLayout = (key, value) => {
            const l = { ...layout };
            if (value == null || value === '') delete l[key];
            else l[key] = value;
            this._commit({ ...this.config, layout: l });
        };
        return html`
            <div class="layout-tab">
                <div class="hint">Drag the handles on the canvas to size tracks, draw areas, and use each
                    area's tools for backgrounds &amp; cards.</div>
                <lcards-form-section
                    header="Grid settings"
                    description="Spacing and sizing for the whole grid"
                    icon="mdi:cog"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="4">
                    <div class="grid2">
                        <label>Gap</label>
                        <ha-input .value=${layout['grid-gap'] ?? layout.gap ?? ''} placeholder="5px"
                            @change=${(e) => setLayout('grid-gap', e.target.value || undefined)}></ha-input>
                        <label>Height</label>
                        <ha-input .value=${layout.height ?? ''} placeholder="100%"
                            @change=${(e) => setLayout('height', e.target.value || undefined)}></ha-input>
                        <label>Card margin</label>
                        <ha-input .value=${layout.card_margin ?? ''} placeholder="none"
                            @change=${(e) => setLayout('card_margin', e.target.value || undefined)}></ha-input>
                        <label>Card overflow</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: OVERFLOW_OPTIONS } }}
                            .value=${layout.card_overflow ?? 'visible'}
                            @value-changed=${(e) => setLayout('card_overflow', e.detail.value === 'visible' ? undefined : e.detail.value)}></ha-selector>
                        <label>Padding</label>
                        <ha-input .value=${layout.padding ?? ''} placeholder="none"
                            @change=${(e) => setLayout('padding', e.target.value || undefined)}></ha-input>
                        <label>Margin</label>
                        <ha-input .value=${layout.margin ?? ''} placeholder="none"
                            @change=${(e) => setLayout('margin', e.target.value || undefined)}></ha-input>
                    </div>
                </lcards-form-section>
            </div>
        `;
    }

    _renderCardTab(i) {
        const card = this.config?.cards?.[i];
        if (i == null || !card) return html`<div class="hint">Select a card tab, or add a card.</div>`;
        const vl = card.view_layout ?? {};
        const { view_layout, ...cardOnly } = card;
        const areaNames = getAreaNames(parseLayoutConfig(this.config?.layout).areas);
        const areaOptions = [{ value: '', label: '— none —' }, ...areaNames.map(n => ({ value: n, label: n }))];
        const areaName = vl['grid-area'];

        return html`
            <div class="card-tab">
                <lcards-form-section
                    header="Card placement"
                    description="Where this card sits and how it fills its area"
                    icon="mdi:card-outline"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="4">
                    <div class="ct-remove">
                        <ha-button class="danger" appearance="plain" @click=${() => this._removeCard(i)}>
                            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>Remove card
                        </ha-button>
                    </div>
                    <div class="grid2">
                        <label>Area</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: areaOptions } }}
                            .value=${vl['grid-area'] ?? ''}
                            @value-changed=${(e) => this._setPlacement(i, 'grid-area', e.detail.value || undefined)}></ha-selector>
                        <label>Align ↕</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: ALIGN_V_OPTIONS } }}
                            .value=${vl['align-self'] ?? vl['place-self'] ?? 'stretch'}
                            @value-changed=${(e) => this._setAlignment(i, e.detail.value, vl['justify-self'] ?? vl['place-self'] ?? 'stretch')}></ha-selector>
                        <label>Align ↔</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: ALIGN_H_OPTIONS } }}
                            .value=${vl['justify-self'] ?? vl['place-self'] ?? 'stretch'}
                            @value-changed=${(e) => this._setAlignment(i, vl['align-self'] ?? vl['place-self'] ?? 'stretch', e.detail.value)}></ha-selector>
                        <label>Margin</label>
                        <ha-input .value=${vl.margin ?? ''} placeholder=${this.config?.layout?.card_margin ?? 'none'}
                            @change=${(e) => this._setPlacement(i, 'margin', e.target.value || undefined)}></ha-input>
                        <label>Overflow X</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: OVERFLOW_OPTIONS } }}
                            .value=${vl['overflow-x'] ?? vl.overflow ?? 'visible'}
                            @value-changed=${(e) => this._setOverflow(i, e.detail.value, vl['overflow-y'] ?? vl.overflow ?? 'visible')}></ha-selector>
                        <label>Overflow Y</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { mode: 'dropdown', options: OVERFLOW_OPTIONS } }}
                            .value=${vl['overflow-y'] ?? vl.overflow ?? 'visible'}
                            @value-changed=${(e) => this._setOverflow(i, vl['overflow-x'] ?? vl.overflow ?? 'visible', e.detail.value)}></ha-selector>
                    </div>
                </lcards-form-section>

                ${areaName ? this._renderAreaStyleSection(areaName) : nothing}

                <div class="card-editor-host">
                    <hui-card-element-editor
                        .hass=${this.hass}
                        .lovelace=${this._childLovelace()}
                        .value=${cardOnly}
                        @config-changed=${(e) => this._onChildConfigChanged(i, e)}
                    ></hui-card-element-editor>
                </div>
            </div>
        `;
    }

    /** Per-area surface settings (background / border) for the card's area — the
     *  same options the overlay's area tool offers in layout mode. */
    _renderAreaStyleSection(name) {
        const s = this.config?.layout?.areas?.[name] ?? {};
        const set = (key, value) => this._setAreaSetting(name, key, value);
        return html`
            <lcards-form-section
                header="Area background"
                description=${`Backing surface for area "${name}" (shows even when empty)`}
                icon="mdi:palette"
                ?outlined=${true}
                headerLevel="4">
                <div class="grid2">
                    <label>Background</label>
                    <lcards-color-picker .hass=${this.hass} .value=${s.background ?? ''}
                        ?showPreview=${true} ?showBuilder=${true}
                        @value-changed=${(e) => set('background', e.detail.value || undefined)}></lcards-color-picker>
                    <label>Image</label>
                    <ha-input .value=${s['background-image'] ?? ''} placeholder="url(...) or linear-gradient(...)"
                        @change=${(e) => set('background-image', e.target.value || undefined)}></ha-input>
                    ${s['background-image'] ? html`
                        <label>Fit</label>
                        <ha-selector .hass=${this.hass} .selector=${{ select: { mode: 'dropdown', options: BG_SIZE_OPTIONS } }}
                            .value=${s['background-size'] ?? 'cover'}
                            @value-changed=${(e) => set('background-size', e.detail.value === 'cover' ? undefined : e.detail.value)}></ha-selector>
                        <label>Position</label>
                        <ha-selector .hass=${this.hass} .selector=${{ select: { mode: 'dropdown', options: BG_POSITION_OPTIONS } }}
                            .value=${s['background-position'] ?? 'center'}
                            @value-changed=${(e) => set('background-position', e.detail.value === 'center' ? undefined : e.detail.value)}></ha-selector>
                        <label>Repeat</label>
                        <ha-selector .hass=${this.hass} .selector=${{ select: { mode: 'dropdown', options: BG_REPEAT_OPTIONS } }}
                            .value=${s['background-repeat'] ?? 'no-repeat'}
                            @value-changed=${(e) => set('background-repeat', e.detail.value === 'no-repeat' ? undefined : e.detail.value)}></ha-selector>
                    ` : nothing}
                    <label>Border color</label>
                    <lcards-color-picker .hass=${this.hass} .value=${s['border-color'] ?? ''}
                        ?showPreview=${true} ?showBuilder=${true}
                        @value-changed=${(e) => set('border-color', e.detail.value || undefined)}></lcards-color-picker>
                    <label>Border</label>
                    <div class="inline2">
                        <ha-input .value=${s['border-width'] ?? ''} placeholder="2px"
                            @change=${(e) => set('border-width', e.target.value || undefined)}></ha-input>
                        <ha-selector .hass=${this.hass} .selector=${{ select: { mode: 'dropdown', options: BORDER_STYLE_OPTIONS } }}
                            .value=${s['border-style'] ?? 'none'}
                            @value-changed=${(e) => set('border-style', e.detail.value === 'none' ? undefined : e.detail.value)}></ha-selector>
                    </div>
                    <label>Radius</label>
                    <ha-input .value=${s['border-radius'] ?? ''} placeholder="0"
                        @change=${(e) => set('border-radius', e.target.value || undefined)}></ha-input>
                </div>
            </lcards-form-section>
        `;
    }

    _renderYamlTab() {
        return html`
            <div class="yaml-tab">
                <lcards-yaml-editor
                    .value=${configToYaml(this.config ?? {})}
                    .hass=${this.hass}
                    @value-changed=${this._handleYamlChange}>
                </lcards-yaml-editor>
            </div>
        `;
    }

    _handleYamlChange(ev) {
        try {
            const newConfig = yamlToConfig(ev.detail.value);
            this._commit(newConfig);
        } catch (_) {
            // Invalid YAML mid-edit — wait for valid state
        }
    }

    _handleTabChange(e) {
        const value = e.target?.activeTab?.getAttribute('value');
        if (value != null) {
            this._activeTab = value;
            this.requestUpdate();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Card actions
    // ─────────────────────────────────────────────────────────────────────────

    _setPlacement(i, key, value) {
        const cards = [...(this.config?.cards ?? [])];
        const card = cards[i];
        if (!card) return;
        const vl = { ...(card.view_layout ?? {}) };
        if (value == null || value === '') delete vl[key];
        else vl[key] = value;
        cards[i] = { ...card, view_layout: vl };
        this._commit({ ...this.config, cards });
    }

    _setAlignment(i, v, h) {
        const cards = [...(this.config?.cards ?? [])];
        const card = cards[i];
        if (!card) return;
        const vl = { ...(card.view_layout ?? {}) };
        delete vl['place-self'];
        delete vl['align-self'];
        delete vl['justify-self'];
        if (v === h) {
            if (v !== 'stretch') vl['place-self'] = v;
        } else {
            if (v !== 'stretch') vl['align-self']   = v;
            if (h !== 'stretch') vl['justify-self'] = h;
        }
        cards[i] = { ...card, view_layout: vl };
        this._commit({ ...this.config, cards });
    }

    _setOverflow(i, ox, oy) {
        const cards = [...(this.config?.cards ?? [])];
        const card = cards[i];
        if (!card) return;
        const vl = { ...(card.view_layout ?? {}) };
        delete vl['overflow'];
        delete vl['overflow-x'];
        delete vl['overflow-y'];
        if (ox === oy) {
            if (ox !== 'visible') vl['overflow'] = ox;
        } else {
            if (ox !== 'visible') vl['overflow-x'] = ox;
            if (oy !== 'visible') vl['overflow-y'] = oy;
        }
        cards[i] = { ...card, view_layout: vl };
        this._commit({ ...this.config, cards });
    }

    _onChildConfigChanged(i, ev) {
        ev.stopPropagation();
        const cfg = ev.detail?.config ?? ev.detail?.value;
        if (!cfg?.type) return;
        const cards = this.config?.cards;
        if (!cards?.[i]) return;
        const vl = cards[i].view_layout;
        cards[i] = vl ? { ...cfg, view_layout: vl } : { ...cfg };
        this._commitQuiet();
    }

    async _removeCard(i) {
        const card = this.config?.cards?.[i];
        const label = (card?.type ?? 'card').replace('custom:', '');
        const ok = await showConfirmDeleteDialog({
            title: 'Remove card?',
            message: `Remove the "${label}" card from this layout? This cannot be undone.`,
            confirmText: 'Remove',
        });
        if (!ok) return;
        const cards = [...(this.config?.cards ?? [])];
        cards.splice(i, 1);
        this._activeTab = cards.length ? `card-${Math.min(i, cards.length - 1)}` : 'layout';
        this._commit({ ...this.config, cards });
    }

    _addCard(areaName) {
        this._openCardPicker((picked) => {
            const view_layout = areaName ? { 'grid-area': areaName } : null;
            const card = view_layout ? { ...picked, view_layout } : { ...picked };
            const cards = [...(this.config?.cards ?? []), card];
            this._activeTab = `card-${cards.length - 1}`;
            this._commit({ ...this.config, cards });
        });
    }

    // ─── HA child picker (element editing is inline; only the picker is a dialog) ──

    _childLovelace() {
        return { views: [{ title: 'Home', path: 'home', cards: [] }] };
    }

    async _openCardPicker(onPick) {
        if (!customElements.get('hui-card-picker')) {
            // HA only registers its card picker after its create-card dialog has been
            // opened once. We can't reliably trigger that load ourselves, so guide
            // the user to prime it (same limitation as the elbow/MSD editors).
            showInfoDialog({
                title: 'Card picker not ready',
                message: 'Home Assistant hasn’t loaded its card picker yet. On any dashboard, '
                    + 'click “Add card” once (you can cancel it), then come back and try again.',
            });
            return;
        }
        this._pickerDialog?.remove();
        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - ha-dialog props
        dialog.heading = 'Select a card';
        this._pickerDialog = dialog;
        document.body.appendChild(dialog);
        // @ts-ignore
        dialog.open = true;
        // @ts-ignore
        await dialog.updateComplete;

        const picker = document.createElement('hui-card-picker');
        // @ts-ignore
        picker.hass = this.hass;
        // @ts-ignore
        picker.lovelace = this._childLovelace();
        picker.style.cssText = 'padding:24px; display:block;';
        dialog.appendChild(picker);
        await new Promise(r => setTimeout(r, 80));
        // @ts-ignore
        picker.requestUpdate?.();

        picker.addEventListener('config-changed', (e) => {
            const selected = e.detail?.config;
            // @ts-ignore
            dialog.open = false;
            if (selected) onPick(JSON.parse(JSON.stringify(selected)));
        });
        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._pickerDialog === dialog) this._pickerDialog = null;
        });
    }

    _handleSave() {
        if (this._handled) return;
        this._handled = true;
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._workingConfig }, bubbles: true, composed: true,
        }));
        this._handleClose();
    }

    _handleCancel() {
        if (this._handled) return;
        this._handled = true;
        // Restore initial config so the card isn't left with any intermediate state
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._initialConfig }, bubbles: true, composed: true,
        }));
        this._handleClose();
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Styles
    // ─────────────────────────────────────────────────────────────────────────

    static get styles() {
        return [
            editorStyles,
            studioDialogStyles,
            css`
                :host { display: block; }

                /* Fixed dialog height set on first paint so it doesn't grow as tabs
                   get taller — content scrolls inside each panel instead. */
                .dialog-content { height: 80vh; max-height: 80vh; min-height: 0; display: flex; flex-direction: column; }
                /* Left config pane ~1/3, preview ~2/3. Explicit row so panels take the
                   full height and scroll internally rather than sizing to content. */
                .studio-layout {
                    grid-template-columns: 1fr 2fr;
                    grid-template-rows: minmax(0, 1fr);
                    min-height: 0;
                }

                ha-tab-group { flex-shrink: 0; }
                ha-tab-group-tab { flex-shrink: 0; white-space: nowrap; }

                /* Preview element wraps the interactive canvas (matches other studios:
                   padded panel + framed inner surface). */
                .preview-panel { overflow: hidden; min-height: 0; }
                .preview-container {
                    flex: 1;
                    min-height: 0;
                    padding: 16px;
                    background: var(--primary-background-color);
                    display: flex;
                }
                /* No fill behind the grid — the user's own cell/area backgrounds
                   (colors, gradients, images) must show as-is. The opaque
                   preview-container behind prevents anything bleeding through. */
                .canvas {
                    flex: 1;
                    position: relative;
                    min-height: 0;
                    border-radius: var(--ha-border-radius-lg, 12px);
                    border: var(--ha-border-width-sm, 1px) solid var(--divider-color);
                    overflow: hidden;
                }
                .canvas lcards-layout-card { display: block; width: 100%; height: 100%; }

                .layout-tab { display: flex; flex-direction: column; gap: 12px; }
                .yaml-tab { display: flex; flex-direction: column; height: 100%; }
                .yaml-tab lcards-yaml-editor { flex: 1; min-height: 0; }
                .hint { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }

                .card-tab { display: flex; flex-direction: column; gap: 14px; }
                .grid2 { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 8px 10px; }
                .grid2 > label { font-size: 12px; color: var(--secondary-text-color); }
                .grid2 lcards-color-picker,
                .grid2 ha-input,
                .grid2 ha-selector { min-width: 0; }
                .inline2 { display: flex; gap: 6px; min-width: 0; }
                .inline2 ha-input,
                .inline2 ha-selector { flex: 1; min-width: 0; }
                .ct-remove { display: flex; justify-content: flex-end; margin-bottom: 8px; }
                .ct-remove .danger { --mdc-theme-primary: var(--error-color, #ef4444); color: var(--error-color, #ef4444); }
                .card-editor-host {
                    border-top: var(--ha-border-width-sm, 1px) solid var(--divider-color);
                    padding-top: 12px;
                }
            `,
        ];
    }
}

if (!customElements.get('lcards-layout-studio-dialog')) {
    customElements.define('lcards-layout-studio-dialog', LCARdSLayoutStudioDialog);
}
