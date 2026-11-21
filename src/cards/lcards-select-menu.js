/**
 * LCARdS Select Menu Card
 *
 * Renders an input_select (or select) entity as a grid of LCARS-styled
 * option buttons. Tapping any button calls input_select.select_option.
 *
 * Architecture:
 * - Each option is an lcards-button (config via setConfig, real hass)
 * - Style layers: preset < button_template.style < style < option style < rule patches
 * - selected option: 'active' state colors, all others: 'inactive'
 * - Full rules-engine integration via _registerOverlayForRules
 *
 * Config example:
 * ```yaml
 * type: custom:lcards-select-menu
 * entity: input_select.view_selector
 * preset: lozenge
 * grid:
 *   columns: 3
 *   gap: 4px
 * options:
 *   Bridge:
 *     label: "Command Deck"
 *     icon: mdi:bridge
 *   Engineering:
 *     icon: mdi:engine
 * ```
 */

import { html, css, svg, noChange } from 'lit';
import { Directive, directive, PartType } from 'lit/directive.js';
import { styleMap } from 'lit/directives/style-map.js';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { deepMergeImmutable } from '../utils/deepMerge.js';
import { getSelectMenuSchema } from './schemas/select-menu-schema.js';
import {
    gridLayout, mergeStyleLayers, naturalHeightPx, optionCardKeys,
    optionOpacity, rowCount, OPTION_CARD_KEYS,
    optionPlacement, optionMinHeight,
} from './select-menu-config.js';

/**
 * Gives an option button its config through setConfig (as Home Assistant does),
 * and again only when the config changed. A plain `.config=` property skips
 * setConfig, so the button never captured its text settings, loaded its rules
 * or resolved its templates.
 */
class ButtonConfigDirective extends Directive {
    /** @param {import('lit/directive.js').PartInfo} partInfo */
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ELEMENT) throw new Error('buttonConfig() is an element directive');
        /** @type {string | null} */
        this._last = null;
    }

    /** @param {Record<string, any>} _config */
    render(_config) { return noChange; }

    /**
     * @param {import('lit/directive.js').ElementPart} part
     * @param {[Record<string, any>]} args
     */
    update(part, [config]) {
        const json = JSON.stringify(config);
        if (json !== this._last) {
            this._last = json;
            /** @type {any} */ (part.element).setConfig(config);
        }
        return noChange;
    }
}
const buttonConfig = directive(ButtonConfigDirective);


export class LCARdSSelectMenu extends LCARdSCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'select-menu';

    static get properties() {
        return {
            ...super.properties,
            _optionList:      { type: Array,   state: true },
            _containerHeight: { type: Number,  state: true },
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    /* width: 100% omitted — see LCARdSCard base comment (overflows with card_margin).
                     * height: 100% inherited from LCARdSCard base. */
                }

                .sm-grid {
                    width: 100%;
                    height: auto;
                    box-sizing: border-box;
                }

                .sm-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    color: var(--lcars-font-color, #CCCCCC);
                    font-family: var(--lcars-font, 'Antonio', sans-serif);
                    font-size: 12px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
            `
        ];
    }

    constructor() {
        super();
        this._optionList      = [];
        this._containerHeight = 0;
        this._containerRO     = null;
    }

    // =========================================================================
    // LIFECYCLE
    // =========================================================================

    _onDisconnected() {
        this._containerRO?.disconnect();
        this._containerRO = null;
        super._onDisconnected();
    }

    _onConfigSet(config) {
        super._onConfigSet(config);
        this._buildOptionList();
    }

    _handleFirstUpdate(changedProperties) {
        // Only the card picker (browse-cards screen) shows the placeholder, not every
        // preview (preview mode itself is detected by the base on connect, and is
        // also true in dashboard edit mode): hui-card-picker is the reliable signal.
        this._isInCardPicker = this._checkForAncestor(['hui-card-picker']);
        if (this._isInCardPicker) {
            this.requestUpdate();
            return; // Skip full initialisation in preview context
        }

        const overlayId = this.config.id || this._cardGuid;
        const tags       = ['select-menu', ...(this.config.tags || [])];

        lcardsLog.debug(`[LCARdSSelectMenu] Registering overlay`, {
            overlayId,
            entity: this.config.entity,
            preset: this.config.preset,
        });

        this._registerOverlayForRules(overlayId, 'select-menu', tags);
        this._buildOptionList();
    }

    _handleHassUpdate(newHass, oldHass) {
        super._handleHassUpdate?.(newHass, oldHass);

        // Rebuild option list when entity's available options change
        const prevOpts = JSON.stringify(oldHass?.states[this.config.entity]?.attributes?.options);
        const nextOpts = JSON.stringify(this._entity?.attributes?.options);
        if (prevOpts !== nextOpts) {
            lcardsLog.debug(`[LCARdSSelectMenu] Entity options changed, rebuilding list`);
            this._buildOptionList();
        }
        // Re-render when selected option changes (state changes)
        const prevState = oldHass?.states[this.config.entity]?.state;
        const nextState = this._entity?.state;
        if (prevState !== nextState) {
            this.requestUpdate();
        }
    }

    async _onConnected() {
        await super._onConnected();
        // the container's height: bounded-fill mode sizes the rows to it
        if (!this._containerRO) {
            this._containerRO = new ResizeObserver(entries => {
                const h = entries[0]?.contentRect?.height ?? 0;
                if (h !== this._containerHeight) this._containerHeight = h;
            });
            this._containerRO.observe(this);
        }
    }

    // =========================================================================
    // OPTION LIST BUILDER
    // =========================================================================

    /**
     * Build the normalized option list from entity attributes + config overrides.
     *
     * Supports two config.options shapes:
     *   - Object: { "Bridge": { label, icon, style, tap_action } }  →  entity order preserved
     *   - Array:  [{ value, label, icon, style, tap_action }]        →  explicit order + filter
     *
     * Falls back to plain entity attribute list when no config.options is provided.
     * Each option keeps its card-level keys (rules, sounds, variables, zones,
     * debug_zones) for its own button.
     * @private
     */
    _buildOptionList() {
        /** @param {Record<string, any>} o */
        const pickCardKeys = (o) => Object.fromEntries(OPTION_CARD_KEYS.filter(k => o?.[k] !== undefined).map(k => [k, o[k]]));
        const entityOptions = this._entity?.attributes?.options || [];
        const configOptions  = this.config.options;

        if (!configOptions) {
            // Pure auto-enumerate from entity
            this._optionList = entityOptions.map(value => ({
                value,
                label:      value,
                icon:       null,
                style:      {},
                tap_action: null,
                cardKeys:   {},
            }));
            return;
        }

        if (Array.isArray(configOptions)) {
            // Array form: explicit order — show everything in the config array.
            // When an entity is set, entity state is used for active/inactive detection
            // but the OPTIONS LIST itself comes from config (allows manual entries +
            // reordering that differs from entity order).
            this._optionList = configOptions
                .map(opt => ({
                    value:             opt.value,
                    label:             opt.label             ?? opt.value,
                    icon:              opt.icon              ?? null,
                    style:             opt.style             || {},
                    tap_action:        opt.tap_action        ?? null,
                    hold_action:       opt.hold_action       ?? null,
                    double_tap_action: opt.double_tap_action ?? null,
                    cardKeys:          pickCardKeys(opt),
                }));
            return;
        }

        if (typeof configOptions === 'object') {
            // Object form: entity order, per-option overrides
            this._optionList = entityOptions.map(value => {
                const override = configOptions[value] || {};
                return {
                    value,
                    label:             override.label             ?? value,
                    icon:              override.icon              ?? null,
                    style:             override.style             || {},
                    tap_action:        override.tap_action        ?? null,
                    hold_action:       override.hold_action       ?? null,
                    double_tap_action: override.double_tap_action ?? null,
                    cardKeys:          pickCardKeys(override),
                };
            });
        }
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    _renderCard() {
        if (!this._initialized) return super._renderCard();

        // Card picker — show LCARS-style button grid placeholder.
        // Use the dedicated _isInCardPicker flag so the placeholder only appears
        // when browsing cards to add, not in the card editor dialog or dashboard edit mode.
        if (this._isInCardPicker) {
            return this._renderPickerPlaceholder();
        }

        if (!this._entity && this.config.entity) {
            return html`<div class="sm-loading">Loading…</div>`;
        }

        // ── Grid CSS ──────────────────────────────────────────────────────
        // grid.height 'fit' publishes the menu's natural height as a definite
        // inline height on the HOST: content-sized outer tracks (auto /
        // max-content) cannot reliably measure the menu through HA's hui-card
        // wrappers, so a definite pixel height is the dependable way to let an
        // outer row size itself to this card. '100%' fills a bounded container,
        // the rows sharing its measured height (ResizeObserver, _containerHeight).
        const { style: gridStyle, hostHeight } = gridLayout(this.config.grid || {}, this._optionList.length, this._containerHeight);
        // Definite px in fit mode; otherwise restore the stylesheet default
        // (:host height:100%) so mode switches in the editor behave.
        // Do NOT clear when config.height is set: _onConfigSet already applied it.
        if (hostHeight != null) {
            this.style.height = `${hostHeight}px`;
        } else if (!this.config.height) {
            this.style.height = '';
        }

        return html`
            <div class="sm-grid" style="${gridStyle}">
                ${this._optionList.map(opt => this._renderOption(opt))}
            </div>
        `;
    }

    /**
     * Render a single option as a full lcards-button element.
     * The button sees the real entity; state_classification makes this option's
     * value its 'active' state and every other option 'inactive', so the button's
     * preset/style system drives the visuals and its templates see the real state.
     *
     * @param {Object} opt - Normalized option { value, label, icon, style, tap_action, cardKeys }
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderOption(opt) {
        const entityId   = this.config.entity;
        const isSelected = !!this._entity && this._entity.state === opt.value;

        // Tap action: per-option → card-level override → built-in select_option
        const domain     = entityId?.split('.')[0];
        const svcDomain  = domain === 'select' ? 'select' : 'input_select';
        const defaultTap = entityId
            ? { action: 'perform-action', perform_action: `${svcDomain}.select_option`,
                data: { option: opt.value }, target: { entity_id: entityId } }
            : { action: 'none' };

        // button_template: full lcards-button config set via Style-tab sub-editor.
        // Everything in it becomes the base; card-level and option-specific values override.
        // id and tags are stripped: the card manages them (per-button ids cause rules collision).
        const {
            id:   _tplId,
            tags: _tplTags,
            ...template
        } = this.config.button_template || {};

        // Style layers, merged key by key: template < card < option < rule patches
        // (the button puts its preset underneath). opacity is the menu's own: it
        // dims the host of every option but the selected one.
        const merged = mergeStyleLayers([template.style, this.config.style, opt.style, this._lastRulePatches?.style]);
        const opacity = optionOpacity(merged, !!entityId && !isSelected);
        let style = merged;
        if (style && 'opacity' in style) {
            const { opacity: _menuOpacity, ...rest } = style;
            style = rest;
        }

        // Action priority: per-option → card-level → template-level → default
        // hold/double_tap explicitly default to {action:'none'} so the button card
        // does NOT fall through to tap_action when the user hasn't set them.
        const tapAction    = opt.tap_action        || this.config.tap_action        || template.tap_action        || defaultTap;
        const holdAction   = opt.hold_action       || this.config.hold_action       || template.hold_action       || { action: 'none' };
        const dblTapAction = opt.double_tap_action || this.config.double_tap_action || template.double_tap_action || { action: 'none' };

        const otherValues = this._optionList.map(o => o.value).filter(v => v !== opt.value);

        const btnConfig = {
            type:   'custom:lcards-button',
            // Spread template first (min_height, padding, and any other button props)
            ...template,
            // the option's rules, sounds, variables, zones, debug_zones over the template's
            ...optionCardKeys(template, opt.cardKeys),
            // rows of a definite height: the button follows its row, not the preset's min_height
            ...(optionMinHeight(this.config.grid, template) === 0 ? { min_height: 0 } : {}),
            // Override template with card-level and option-specific values
            ...(entityId ? {
                entity: entityId,
                state_classification: { active: [opt.value], inactive: otherValues, else: 'inactive' },
            } : {}),
            ...(this.config.preset ? { preset: this.config.preset } : {}),
            tap_action:        tapAction,
            hold_action:       holdAction,
            double_tap_action: dblTapAction,
            ...(style ? { style } : {}),
            // Visibility baseline: hide name/state so preset defaults don't bleed through.
            // text.label is the active field for option display text (centered, primary).
            // Merge order (key by key): our defaults → template → label.content always from opt.
            // The template can restore any field (e.g. state.show:true) if the user wants it.
            // The style's text.default also goes in as the button's text.default (over the
            // template's): the button's preset merges its own text.default into the
            // button config, where it would beat a text.default given only as style.
            text: {
                ...deepMergeImmutable(
                    deepMergeImmutable({ name: { show: false }, state: { show: false } }, template.text || {}),
                    style?.text?.default ? { default: style.text.default } : {},
                ),
                label: {
                    show: true,
                    ...(template.text?.label || {}),
                    content: opt.label,
                },
            },
            ...(opt.icon ? { icon: opt.icon, show_icon: true } : {}),
        };
        // The card's sounds reach every option button; the template's and the option's win
        if (this.config.sounds && typeof this.config.sounds === 'object') {
            btnConfig.sounds = { ...this.config.sounds, ...(btnConfig.sounds || {}) };
        }

        // justify-items / align-items place only a button with its own size (an unsized one would vanish)
        const placement = (/** @type {any} */ b) => { const p = optionPlacement(b); return { 'justify-self': p.justifySelf, 'align-self': p.alignSelf }; };
        return html`<lcards-button
            ${buttonConfig(btnConfig)}
            .hass=${this.hass}
            style=${styleMap({ opacity: opacity < 1 ? String(opacity) : undefined, ...placement(btnConfig) })}></lcards-button>`;
    }

    // =========================================================================
    // RULES ENGINE
    // =========================================================================

    /**
     * Overlay type for the rules engine.
     * @returns {string}
     * @protected
     */
    _getOverlayType() {
        return 'select-menu';
    }

    /**
     * Overlay tags for the rules engine.
     * @returns {string[]}
     * @protected
     */
    _getOverlayTags() {
        const tags = ['select-menu'];
        if (this.config.preset)                   tags.push(this.config.preset);
        if (this.config.entity)                   tags.push('entity-based');
        if (this.config.tags?.length)             tags.push(...this.config.tags);
        return tags;
    }

    // =========================================================================
    // CARD PICKER PLACEHOLDER
    // =========================================================================

    /**
     * Walk up the shadow-DOM-aware ancestor chain looking for any of the given
     * tag names.  Mirrors the implementation in lcards-chart.js.
     * @param {string[]} selectors
     * @returns {boolean}
     */
    _checkForAncestor(selectors) {
        let current = /** @type {Element | null} */ (this);
        const maxLevels = 20;
        for (let i = 0; i < maxLevels && current; i++) {
            for (const selector of selectors) {
                if (current.tagName && current.tagName.toLowerCase() === selector.toLowerCase()) {
                    return true;
                }
            }
            current = current.parentElement || /** @type {ShadowRoot} */ (current.parentNode)?.host || /** @type {ShadowRoot} */ (current.getRootNode())?.host;
        }
        return false;
    }

    /** SVG placeholder shown in the HA card picker (no live entity needed). */
    _renderPickerPlaceholder() {
        // 3-col lozenge grid — proper pill shape (rx = btnH/2)
        const items = [
            { label: 'BRIDGE',       color: '#FF9900', text: '#000000', active: false },
            { label: 'MAIN DECK',    color: '#FF9900', text: '#000000', active: true  },
            { label: 'ENGINEERING',  color: '#CC6600', text: '#000000', active: false },
            { label: 'TACTICAL',     color: '#223355', text: '#7799cc', active: false },
            { label: 'HOLODECKS',    color: '#223355', text: '#7799cc', active: false },
            { label: 'SICKBAY',      color: '#223355', text: '#7799cc', active: false },
            { label: 'SCIENCE',      color: '#1a3322', text: '#55aa77', active: false },
            { label: 'TRANSPORTER',  color: '#1a3322', text: '#55aa77', active: false },
            { label: 'OBSERVATION',  color: '#1a3322', text: '#55aa77', active: false },
        ];

        const cols   = 3;
        const btnW   = 78;
        const btnH   = 28;
        const rx     = 14;   // full pill end caps
        const gapX   = 6;
        const gapY   = 6;
        const padX   = 12;
        const padY   = 12;
        const rows   = Math.ceil(items.length / cols);
        const totalW = padX * 2 + cols * btnW + (cols - 1) * gapX;
        const totalH = padY + rows * btnH + (rows - 1) * gapY + padY;

        return html`
            <div style="width:100%;background:linear-gradient(180deg,#000611 0%,#001022 100%);
                        border:2px solid #9999ff;border-radius:12px;overflow:hidden">
                <svg viewBox="0 0 ${totalW} ${totalH}"
                     style="width:100%;display:block"
                     xmlns="http://www.w3.org/2000/svg">
                    ${items.map((item, i) => {
                        const col    = i % cols;
                        const row    = Math.floor(i / cols);
                        const x      = padX + col * (btnW + gapX);
                        const y      = padY + row * (btnH + gapY);
                        const op     = item.active ? '1' : '0.72';
                        const fw     = item.active ? '700' : '500';
                        return svg`
                            <rect x="${x}" y="${y}" width="${btnW}" height="${btnH}"
                                  rx="${rx}" fill="${item.color}" stroke="${item.active ? item.color : 'none'}"
                                  stroke-width="${item.active ? 1.5 : 0}"
                                  opacity="${op}"></rect>
                            ${item.active ? svg`
                                <rect x="${x + 2}" y="${y + 2}" width="${btnW - 4}" height="${btnH - 4}"
                                      rx="${rx - 2}" fill="none"
                                      stroke="rgba(255,255,255,0.35)" stroke-width="1"></rect>
                            ` : svg``}
                            <text x="${x + btnW / 2}" y="${y + btnH / 2 + 4}"
                                  text-anchor="middle" fill="${item.text}"
                                  font-size="7.5" font-family="Antonio, monospace"
                                  letter-spacing="0.06em" font-weight="${fw}">${item.label}</text>
                        `;
                    })}
                </svg>
            </div>
        `;
    }

    // =========================================================================
    // STATIC HELPERS
    // =========================================================================

    /**
     * Masonry height in 50 px units: the option grid's rows (see
     * select-menu-config.js rowCount), about one unit each.
     * @protected
     */
    _getCardSize() {
        if (this._configPx(this.config?.height)) return Math.ceil(/** @type {number} */ (this._configPx(this.config.height)) / 50);
        return rowCount(this.config?.grid || {}, this._optionList.length);
    }

    /**
     * Height of the option grid in px, from the config alone (never from the
     * measured DOM, which would loop with the rows Home Assistant allocates).
     * @returns {number}
     * @private
     */
    _naturalHeightPx() {
        return naturalHeightPx(this.config?.grid || {}, this._optionList.length);
    }

    /**
     * Sections-view size: enough 56 px rows (8 px gaps) to show every option,
     * or a pixel config.height. A user's grid_options wins (Home Assistant
     * also merges config grid_options over these).
     */
    getGridOptions() {
        const go = this.config.grid_options || {};
        const h = this._configPx(this.config?.height) ?? this._naturalHeightPx();
        return {
            columns: go.columns ?? 4,
            rows: go.rows ?? Math.max(1, Math.ceil((h + 8) / 64)),
            min_columns: 2,
            min_rows: 1,
        };
    }

    static getStubConfig() {
        return {
            type: 'custom:lcards-select-menu',
            entity: 'input_select.view_selector',
            preset: 'lozenge',
            grid: {
                columns: 1,
                gap: '4px',
            },
        };
    }

    static async getConfigElement() {
        // Editors load on demand (HA awaits getConfigElement), keeping them out of
        // the bundle every dashboard loads.
        await import('../editor/cards/lcards-select-menu-editor.js');
        return document.createElement('lcards-select-menu-editor');
    }

    /**
     * Register card schema with CoreConfigManager.
     * Called from src/lcards-main.js after core initialisation.
     * @static
     */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;
        if (!configManager) {
            lcardsLog.error('[LCARdSSelectMenu] CoreConfigManager not available for schema registration');
            return;
        }

        const spm              = window.lcards?.core?.stylePresetManager;
        const availablePresets = spm?.getAvailablePresets('button') || [];

        const schema = getSelectMenuSchema({ availablePresets });
        configManager.registerCardSchema('select-menu', schema, { version: __LCARDS_VERSION__ });

        lcardsLog.debug('[LCARdSSelectMenu] Registered schema with CoreConfigManager', {
            presetCount: availablePresets.length,
        });
    }
}
