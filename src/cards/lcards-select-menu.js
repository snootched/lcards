/**
 * LCARdS Select Menu Card
 *
 * Renders an input_select (or select) entity as a grid of LCARS-styled
 * option buttons. Tapping any button calls input_select.select_option.
 *
 * Architecture:
 * - Each option is a native <div> button styled via CSS
 * - Color/style comes from StylePresetManager (same button presets as lcards-button)
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

import { html, css, svg } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { deepMergeImmutable } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { getSelectMenuSchema } from './schemas/select-menu-schema.js';

import '../editor/cards/lcards-select-menu-editor.js';

export class LCARdSSelectMenu extends LCARdSCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'select-menu';

    static get properties() {
        return {
            ...super.properties,
            _resolvedStyle:  { type: Object,  state: true },
            _optionList:     { type: Array,   state: true },
            _hoverOption:    { type: String,  state: true },
            _pressedOption:  { type: String,  state: true },
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                .sm-grid {
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                }

                .sm-option {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    box-sizing: border-box;
                    -webkit-tap-highlight-color: transparent;
                    cursor: pointer;
                }

                .sm-option-inner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    overflow: hidden;
                    max-width: 100%;
                    pointer-events: none;
                }

                .sm-label {
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    font-family: var(--lcars-font, 'Antonio', 'Helvetica Neue', sans-serif);
                    font-size: inherit;
                    font-weight: inherit;
                    letter-spacing: inherit;
                    text-transform: inherit;
                    line-height: 1.1;
                }

                .sm-icon {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sm-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    color: var(--lcars-text, #CCCCCC);
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
        this._resolvedStyle  = null;
        this._optionList     = [];
        this._hoverOption    = null;
        this._pressedOption  = null;
    }

    // =========================================================================
    // LIFECYCLE
    // =========================================================================

    _onConfigSet(config) {
        super._onConfigSet(config);
        this._buildOptionList();
    }

    _handleFirstUpdate(changedProperties) {
        // Re-detect preview mode now that we're in the DOM (setConfig fires before mount).
        // Same pattern as lcards-chart.js / lcards-msd.js.
        const isInCardPicker = this._checkForAncestor(['hui-card-picker', 'hui-card-preview']);
        if (isInCardPicker) {
            this._isPreviewMode = true;
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
        this._resolveMenuStyle();
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

    _onRulePatchesChanged() {
        this._resolveMenuStyle();
    }

    async _onConnected() {
        await super._onConnected();
        // Re-resolve styles now that StylePresetManager is available
        this._resolveMenuStyle();
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
     * @private
     */
    _buildOptionList() {
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
                };
            });
        }
    }

    // =========================================================================
    // STYLE RESOLUTION
    // =========================================================================

    /**
     * Resolve the card-level style from preset + config.style + rule patches.
     * Stores result in this._resolvedStyle and triggers re-render.
     * @private
     */
    _resolveMenuStyle() {
        let style = {};

        // 1. Resolve button preset via StylePresetManager
        if (this.config.preset) {
            const core = window.lcards?.core;
            const spm  = this._singletons?.stylePresetManager || core?.getStylePresetManager?.();
            if (!spm) {
                lcardsLog.warn(`[LCARdSSelectMenu] StylePresetManager not available, deferring preset '${this.config.preset}'`);
                return;
            }
            const preset = this.getStylePreset('button', this.config.preset);
            if (preset) {
                style = deepMergeImmutable({}, preset);
                lcardsLog.debug(`[LCARdSSelectMenu] Applied preset '${this.config.preset}'`);
            } else {
                lcardsLog.warn(`[LCARdSSelectMenu] Preset '${this.config.preset}' not found`);
            }
        }

        // 2. Merge card-level config.style (config wins over preset)
        if (this.config.style) {
            const copy         = JSON.parse(JSON.stringify(this.config.style));
            const withTokens   = resolveThemeTokensRecursive(copy, this._singletons?.themeManager);
            style              = deepMergeImmutable(style, withTokens);
        }

        // 3. Apply rules patches (highest priority)
        style = this._getMergedStyleWithRules(style);

        const prev = JSON.stringify(this._resolvedStyle);
        if (JSON.stringify(style) !== prev) {
            this._resolvedStyle = style;
            this.requestUpdate();
        }
    }

    /**
     * Resolve the visual CSS properties for a single option button.
     *
     * State classifier:
     *   unavailable → 'unavailable'
     *   pressed     → 'pressed'
     *   hover       → 'hover'
     *   selected    → 'active'
     *   otherwise   → 'inactive'
     *
     * @param {string} optValue      - Option value
     * @param {Object} optStyleOverride - Per-option style config overrides
     * @returns {{ bgColor, textColor, borderRadius, borderWidthPx, borderColor, opacity, fontSizePx, textTransform, letterSpacing, fontWeight }}
     * @private
     */
    _resolveOptionCss(optValue, optStyleOverride) {
        const style = this._resolvedStyle || {};

        const entityState   = this._entity?.state;
        const isUnavailable = !this._entity || entityState === 'unavailable';
        const isSelected    = !isUnavailable && entityState === optValue;
        const isHover       = this._hoverOption === optValue;
        const isPressed     = this._pressedOption === optValue;

        const classifiedState = isUnavailable ? 'unavailable'
            : isPressed                        ? 'pressed'
            : isHover                          ? 'hover'
            : isSelected                       ? 'active'
            :                                    'inactive';

        // ── Background ────────────────────────────────────────────────────
        let bgColor = resolveStateColor({
            actualState:     classifiedState,
            classifiedState: isSelected ? 'active' : 'inactive',
            colorConfig:     style.card?.color?.background,
            fallback:        null
        });

        // Theme defaults when no preset/style color found
        if (!bgColor) {
            if (isUnavailable) {
                bgColor = 'var(--lcars-gray, #333344)';
            } else if (isSelected) {
                bgColor = this.getThemeToken('components.button.background.active')
                    || 'var(--lcars-orange, #FF9900)';
            } else {
                bgColor = this.getThemeToken('components.button.background.inactive')
                    || 'var(--lcars-dark, #4D4D4D)';
            }
        }

        // ── Text color ────────────────────────────────────────────────────
        let textColor = resolveStateColor({
            actualState:     classifiedState,
            classifiedState: isSelected ? 'active' : 'inactive',
            colorConfig:     style.text?.default?.color,
            fallback:        null
        });
        if (!textColor) {
            textColor = isSelected
                ? (this.getThemeToken('components.button.text.color.active') || 'var(--lcars-ui-secondary, #000000)')
                : (this.getThemeToken('components.button.text.color.inactive') || 'var(--lcars-ui-primary, #FFFFFF)');
        }

        // ── Border ────────────────────────────────────────────────────────
        const rawRadius = style.border?.radius ?? 4;
        let borderRadius;
        if (typeof rawRadius === 'object' && rawRadius !== null) {
            const { top_left = 0, top_right = 0, bottom_right = 0, bottom_left = 0 } = rawRadius;
            borderRadius = `${top_left}px ${top_right}px ${bottom_right}px ${bottom_left}px`;
        } else if (typeof rawRadius === 'number') {
            borderRadius = `${rawRadius}px`;
        } else {
            borderRadius = String(rawRadius);
        }

        const borderWidthPx = style.border?.width ?? 0;
        let borderColor = resolveStateColor({
            actualState:     classifiedState,
            classifiedState: isSelected ? 'active' : 'inactive',
            colorConfig:     style.border?.color,
            fallback:        'transparent'
        }) || 'transparent';

        // ── Opacity ───────────────────────────────────────────────────────
        let opacity = 1;
        if (isUnavailable) {
            opacity = 0.45;
        } else if (!isSelected && !isHover && !isPressed) {
            opacity = typeof style.opacity === 'number' ? style.opacity : 0.88;
        }

        // ── Typography ────────────────────────────────────────────────────
        const textCfg    = style.text?.default || {};
        const fontSizePx = textCfg.font_size
            ? (typeof textCfg.font_size === 'number' ? `${textCfg.font_size}px` : textCfg.font_size)
            : '13px';
        const textTransform  = textCfg.text_transform  || 'uppercase';
        const letterSpacing  = textCfg.letter_spacing  || '0.05em';
        const fontWeight     = textCfg.font_weight
            ? (typeof textCfg.font_weight === 'number' ? textCfg.font_weight : String(textCfg.font_weight))
            : '400';

        // ── Per-option overrides (highest priority) ───────────────────────
        if (optStyleOverride && Object.keys(optStyleOverride).length) {
            const ovBg = resolveStateColor({
                actualState:     classifiedState,
                classifiedState: isSelected ? 'active' : 'inactive',
                colorConfig:     optStyleOverride.card?.color?.background,
                fallback:        null
            });
            if (ovBg) bgColor = ovBg;

            const ovText = resolveStateColor({
                actualState:     classifiedState,
                classifiedState: isSelected ? 'active' : 'inactive',
                colorConfig:     optStyleOverride.text?.default?.color,
                fallback:        null
            });
            if (ovText) textColor = ovText;
        }

        return { bgColor, textColor, borderRadius, borderWidthPx, borderColor, opacity, fontSizePx, textTransform, letterSpacing, fontWeight };
    }

    // =========================================================================
    // ACTION EXECUTION
    // =========================================================================

    /**
     * Called when user taps an option button.
     * By default calls input_select.select_option on the card entity.
     * Respects per-option tap_action override, card-level tap_action override,
     * and fires secondary_tap_action afterwards.
     * @param {Object} opt - Normalized option { value, label, icon, style, tap_action }
     * @private
     */
    async _onOptionTap(opt) {
        const entityId     = this.config.entity;
        const optTapAction = opt.tap_action ?? this.config.tap_action;

        lcardsLog.debug(`[LCARdSSelectMenu] Option tapped: "${opt.value}"`, {
            entityId,
            hasCustomAction: !!optTapAction,
        });

        if (optTapAction) {
            // User-defined custom action (overrides built-in select)
            await this._executeAction(optTapAction, entityId, opt.value);
        } else {
            // Default: select the option
            if (entityId && this.hass) {
                // Handle both 'select' and 'input_select' domains
                const domain = entityId.split('.')[0];
                const svcDomain = domain === 'select' ? 'select' : 'input_select';
                await this.hass.callService(
                    svcDomain, 'select_option',
                    { entity_id: entityId, option: opt.value }
                );
                lcardsLog.debug(`[LCARdSSelectMenu] Selected option "${opt.value}" on ${entityId}`);
            }
        }

    }

    /**
     * Execute a standard HA action object.
     * @param {Object}  action   - HA action config
     * @param {string}  entityId - Default entity ID for the action
     * @param {string}  [optionValue] - Current option value (for context)
     * @private
     */
    async _executeAction(action, entityId, optionValue) {
        if (!action || action.action === 'none') return;

        switch (action.action) {
            case 'call-service':
            case 'perform-action': {
                const raw       = action.service || action.perform_action || '';
                const [dom, svc] = raw.split('.');
                const svcData   = { ...(action.service_data || action.data || {}) };
                const target    = action.target || (entityId ? { entity_id: entityId } : undefined);
                if (dom && svc) {
                    if (target) {
                        await this.hass?.callService(dom, svc, svcData, target);
                    } else {
                        await this.hass?.callService(dom, svc, svcData);
                    }
                }
                break;
            }
            case 'navigate':
                if (action.navigation_path) {
                    window.history.pushState(null, '', action.navigation_path);
                    window.dispatchEvent(new CustomEvent('location-changed'));
                }
                break;
            case 'url':
                if (action.url_path) {
                    window.open(action.url_path, action.url_target || '_blank');
                }
                break;
            case 'more-info':
                if (entityId) {
                    this.dispatchEvent(new CustomEvent('hass-more-info', {
                        detail: { entityId },
                        bubbles: true,
                        composed: true,
                    }));
                }
                break;
            case 'toggle':
                if (entityId) {
                    const [dom] = entityId.split('.');
                    await this.hass?.callService(dom, 'toggle', { entity_id: entityId });
                }
                break;
            default:
                lcardsLog.warn(`[LCARdSSelectMenu] Unknown action type: ${action.action}`);
        }
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    _renderCard() {
        if (!this._initialized) return super._renderCard();

        // Card picker / editor preview — show LCARS-style button grid placeholder
        if (this._isPreviewMode) {
            return this._renderPickerPlaceholder();
        }

        if (!this._entity && this.config.entity) {
            return html`<div class="sm-loading">Loading…</div>`;
        }

        // ── Grid CSS ──────────────────────────────────────────────────────
        const gridCfg  = this.config.grid || {};
        let   tplCols  = gridCfg['grid-template-columns'];
        if (!tplCols) {
            const cols = gridCfg.columns;
            if (cols) {
                tplCols = typeof cols === 'number' ? `repeat(${cols}, 1fr)` : String(cols);
            } else {
                tplCols = 'repeat(1, 1fr)';
            }
        }

        const gap      = gridCfg.gap             || '4px';
        const rowGap  = gridCfg['row-gap']    || gridCfg.row_gap    || gap;
        const colGap  = gridCfg['column-gap'] || gridCfg.column_gap || gap;
        const autoFlow = gridCfg['grid-auto-flow'] || 'row';
        const autoRows = gridCfg['grid-auto-rows'] || '56px';

        const gridStyle = [
            `display: grid`,
            `grid-template-columns: ${tplCols}`,
            `row-gap: ${rowGap}`,
            `column-gap: ${colGap}`,
            `grid-auto-flow: ${autoFlow}`,
            `grid-auto-rows: ${autoRows}`,
            `width: 100%`,
            `box-sizing: border-box`,
        ].join('; ');

        return html`
            <div class="sm-grid" style="${gridStyle}">
                ${this._optionList.map(opt => this._renderOption(opt))}
            </div>
        `;
    }

    /**
     * Render a single option as a full lcards-button element.
     * Active/inactive state is communicated by normalising the entity's state
     * to 'on' (selected) or 'off' (not selected) inside a synthetic hass
     * snapshot — letting the button's preset/style system drive the visuals.
     *
     * @param {Object} opt - Normalized option { value, label, icon, style, tap_action }
     * @returns {TemplateResult}
     * @private
     */
    _renderOption(opt) {
        const entityId      = this.config.entity;
        const isSelected    = this._entity?.state === opt.value;
        const isUnavailable = !this._entity || this._entity.state === 'unavailable';

        // Synthetic hass: express option selection as on/off so lcards-button
        // correctly applies active / inactive preset colours.
        let buttonHass = this.hass;
        if (this.hass && entityId) {
            buttonHass = {
                ...this.hass,
                states: {
                    ...this.hass.states,
                    [entityId]: {
                        ...(this.hass.states[entityId] || {}),
                        state: isUnavailable ? 'unavailable' : (isSelected ? 'on' : 'off'),
                    },
                },
            };
        }

        // Tap action: per-option → card-level override → built-in select_option
        const domain     = entityId?.split('.')[0];
        const svcDomain  = domain === 'select' ? 'select' : 'input_select';
        const defaultTap = entityId
            ? { action: 'perform-action', perform_action: `${svcDomain}.select_option`,
                data: { option: opt.value }, target: { entity_id: entityId } }
            : { action: 'none' };

        // button_template: full lcards-button config set via Style-tab sub-editor.
        // Everything in it becomes the base; card-level and option-specific values override.
        const template = this.config.button_template
            ? { ...this.config.button_template }
            : {};

        // Style merge: template.style → card config.style → per-option opt.style
        const templateStyle = template.style;
        const cardStyle     = this.config.style;
        const mergedStyle   = (templateStyle || cardStyle || opt.style)
            ? { ...(templateStyle || {}), ...(cardStyle || {}), ...(opt.style || {}) }
            : undefined;

        // Action priority: per-option → card-level → template-level → default
        // hold/double_tap explicitly default to {action:'none'} so the button card
        // does NOT fall through to tap_action when the user hasn't set them.
        const tapAction    = opt.tap_action        || this.config.tap_action        || template.tap_action        || defaultTap;
        const holdAction   = opt.hold_action       || this.config.hold_action       || template.hold_action       || { action: 'none' };
        const dblTapAction = opt.double_tap_action || this.config.double_tap_action || template.double_tap_action || { action: 'none' };

        const btnConfig = {
            type:   'custom:lcards-button',
            // Spread template first (min_height, padding, and any other button props)
            ...template,
            // Override template with card-level and option-specific values
            entity:     entityId || undefined,
            preset:     this.config.preset,
            tap_action:        tapAction,
            hold_action:       holdAction,
            double_tap_action: dblTapAction,
            ...(mergedStyle  ? { style: mergedStyle }             : {}),
            // Visibility baseline: hide name/state so preset defaults don't bleed through.
            // text.label is the active field for option display text (centered, primary).
            // Merge order: our defaults → template overrides → label.content always from opt.
            // The template can restore any field (e.g. state.show:true) if the user wants it.
            text: {
                name:  { show: false },
                state: { show: false },
                ...(template.text || {}),
                label: {
                    show: true,
                    ...(template.text?.label || {}),
                    content: opt.label,
                },
            },
            ...(opt.icon ? { icon: opt.icon, show_icon: true } : {}),
        };

        return html`<lcards-button .hass=${buttonHass} .config=${btnConfig}></lcards-button>`;
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

    static getConfigElement() {
        return document.createElement('lcards-select-menu-editor');
    }

    /**
     * Register card schema with CoreConfigManager.
     * Called from src/lcards.js after core initialisation.
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
