/**
 * @fileoverview LCARdS Color Picker
 *
 * Unified color picker component combining:
 * - CSS variable dropdown (dynamically scanned from document)
 * - Custom color text input for manual entry
 * - Live preview with computed value and luminance-based text contrast
 * - Special options: "transparent" and "Match Light Colour"
 *
 * Features:
 * - Scans document.documentElement.style for CSS variables
 * - Caches results for performance
 * - Supports configurable prefixes (--lcards-*, --lcars-*, --cblcars-*)
 * - Uses luminance calculation for preview text contrast
 * - Integrates with ha-selector for HA compatibility
 *
 * @example
 * <lcards-color-picker
 *   .hass=${this.hass}
 *   .value=${'var(--lcards-orange)'}
 *   .variablePrefixes=${['--lcards-', '--lcars-']}
 *   ?showPreview=${true}
 *   @value-changed=${this._handleColorChange}>
 * </lcards-color-picker>
 */

import { LitElement, html, css, nothing } from 'lit';

const MDI_CHEVRON_DOWN = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';
const MDI_LIGHTBULB = 'M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z';
const MDI_SORT_ALPHA = 'M9.25,5L12.5,1.75L15.75,5H9.25M15.75,19L12.5,22.25L9.25,19H15.75M3,13H5V11H3M3,6V8H5V6M3,18H5V16H3V18M7,13H21V11H7M7,6V8H21V6M7,18H21V16H7V18Z';
const MDI_PALETTE = 'M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2C17.5,2 22,6 22,11A6,6 0 0,1 16,17H14.2C13.9,17 13.7,17.2 13.7,17.5C13.7,17.6 13.75,17.7 13.8,17.8C14.08,18.1 14.25,18.5 14.25,19A3,3 0 0,1 11.25,22L12,22M10,7.5A1.5,1.5 0 0,0 8.5,9A1.5,1.5 0 0,0 10,10.5A1.5,1.5 0 0,0 11.5,9A1.5,1.5 0 0,0 10,7.5M14,7.5A1.5,1.5 0 0,0 12.5,9A1.5,1.5 0 0,0 14,10.5A1.5,1.5 0 0,0 15.5,9A1.5,1.5 0 0,0 14,7.5M7,12.5A1.5,1.5 0 0,0 5.5,14A1.5,1.5 0 0,0 7,15.5A1.5,1.5 0 0,0 8.5,14A1.5,1.5 0 0,0 7,12.5Z';

// All 140 CSS named colors — used by the "Named" popover tab
const CSS_NAMED_COLORS = [
    'aliceblue','antiquewhite','aqua','aquamarine','azure',
    'beige','bisque','black','blanchedalmond','blue','blueviolet','brown','burlywood',
    'cadetblue','chartreuse','chocolate','coral','cornflowerblue','cornsilk','crimson','cyan',
    'darkblue','darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey','darkkhaki',
    'darkmagenta','darkolivegreen','darkorange','darkorchid','darkred','darksalmon',
    'darkseagreen','darkslateblue','darkslategray','darkslategrey','darkturquoise','darkviolet',
    'deeppink','deepskyblue','dimgray','dimgrey','dodgerblue',
    'firebrick','floralwhite','forestgreen','fuchsia',
    'gainsboro','ghostwhite','gold','goldenrod','gray','green','greenyellow','grey',
    'honeydew','hotpink',
    'indianred','indigo','ivory',
    'khaki',
    'lavender','lavenderblush','lawngreen','lemonchiffon',
    'lightblue','lightcoral','lightcyan','lightgoldenrodyellow','lightgray','lightgreen',
    'lightgrey','lightpink','lightsalmon','lightseagreen','lightskyblue','lightslategray',
    'lightslategrey','lightsteelblue','lightyellow','lime','limegreen','linen',
    'magenta','maroon','mediumaquamarine','mediumblue','mediumorchid','mediumpurple',
    'mediumseagreen','mediumslateblue','mediumspringgreen','mediumturquoise','mediumvioletred',
    'midnightblue','mintcream','mistyrose','moccasin',
    'navajowhite','navy',
    'oldlace','olive','olivedrab','orange','orangered','orchid',
    'palegoldenrod','palegreen','paleturquoise','palevioletred','papayawhip','peachpuff',
    'peru','pink','plum','powderblue','purple',
    'rebeccapurple','red','rosybrown','royalblue',
    'saddlebrown','salmon','sandybrown','seagreen','seashell','sienna','silver',
    'skyblue','slateblue','slategray','slategrey','snow','springgreen','steelblue',
    'tan','teal','thistle','tomato','turquoise',
    'violet',
    'wheat','white','whitesmoke',
    'yellow','yellowgreen',
];

import { HexAlphaBase } from 'vanilla-colorful/lib/entrypoints/hex-alpha';
import { HexInputBase } from 'vanilla-colorful/lib/entrypoints/hex-input';
if (!customElements.get('hex-alpha-color-picker')) {
  class HexAlphaColorPicker extends HexAlphaBase {}
  customElements.define('hex-alpha-color-picker', HexAlphaColorPicker);
}
if (!customElements.get('hex-input')) {
  class HexInput extends HexInputBase {}
  customElements.define('hex-input', HexInput);
}
import { ColorUtils } from '../../../core/themes/ColorUtils.js';
import { getColorFamily, getColorSortKey, compareColorSortKeys, FAMILY_ORDER, FAMILY_LABELS, FAMILY_HUE_RANGES, FAMILY_SWATCH_COLORS } from '../../../core/themes/ColorFamily.js';
import { getCssVarCategory, isColorValue } from '../../../core/themes/CssVarCategory.js';
import { getKnownVariableCatalog } from '../../../core/themes/knownThemeVariables.js';

/** Catalog categories that are colors (excludes lcars-structural: radius/border-width/font-family vars). */
const KNOWN_COLOR_CATALOG_CATEGORIES = new Set(['lcards-palette', 'lcars-semantic', 'lcars-named', 'msd', 'ha-palette', 'ha-semantic', 'ha-legacy']);

/**
 * Opt-in scope groups for the picker's broader-var chip row (issue #372
 * follow-up). 'theme' matches the picker's historical variablePrefixes
 * default (--lcards-/--lcars-/--cblcars-) so the default visible list is
 * unchanged unless the user opts into 'ha' or 'all'.
 */
const CATEGORY_GROUPS = {
    theme: ['lcars', 'lcars-semantic', 'lcards', 'card-mod'],
    // Just ha-lcars's meaningful lcars-ui-*/card/sidebar/tooltip layer —
    // excludes both its ~150-entry raw named palette (--lcars-tomato etc.,
    // still reachable under 'theme'/'all') and LCARdS's own --lcards-*
    // family, so someone looking for e.g. --lcars-ui-quaternary isn't
    // scrolling past either.
    'ha-lcars': ['lcars-semantic'],
    ha: ['ha-legacy', 'ha-color', 'ha-system', 'ha-space', 'ha-shape', 'ha-motion', 'ha-type', 'ha-elevation', 'states'],
    all: null
};
const CATEGORY_GROUP_LABELS = { theme: 'Theme', 'ha-lcars': 'HA-LCARS', ha: 'HA', all: 'All' };

export class LCARdSColorPicker extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            value: { type: String },
            disabled: { type: Boolean },
            variablePrefixes: { type: Array },  // Array of CSS variable prefixes to scan
            showPreview: { type: Boolean },      // Show live preview with computed color
            allowMatchLight: { type: Boolean },  // Allow "Match Light Colour" option
            entityId: { type: String },          // Entity ID — used to resolve match-light in preview
            showBuilder: { type: Boolean },      // Show computed token builder UI
            themeContext: { type: Object },      // Optional {varName: value} map consulted before the live-DOM var() round-trip — lets a caller preview colors from a theme that isn't actually applied to the page (e.g. one just imported into an editor)
            _cssVariables: { type: Array, state: true },
            _computedColor: { type: String, state: true },
            _builderMode: { type: Boolean, state: true },  // Toggle between builder/text mode
            _selectedFunction: { type: String, state: true },
            _baseColor: { type: String, state: true },
            _baseColor2: { type: String, state: true },  // For mix() function
            _amount: { type: Number, state: true },
            _applyBrightness: { type: Boolean, state: true },  // Apply light brightness to colour
            _popoverOpen: { type: Boolean, state: true },       // CSS-var picker popover open (controls .open)
            _popoverMounted: { type: Boolean, state: true },   // True after wa-after-show; keeps popover in DOM during close animation
            _popoverMode: { type: String, state: true },          // ''|'picker'|'named'|'custom'
            _sortMode: { type: String, state: true },             // ''|'name'|'gradient'
            _searchText: { type: String, state: true },         // Popover filter text
            _selectedFamily: { type: String, state: true },     // Popover color-family chip filter
            _selectedCategoryGroup: { type: String, state: true }, // Popover scope: 'theme'|'ha'|'all'
            _builderPickingFor: { type: String, state: true },  // 'color1'|'color2'|null — which builder slot is picking
            _builderPopoverOpen: { type: Boolean, state: true },
            _builderPopoverMounted: { type: Boolean, state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        this.value = '';
        this.disabled = false;
        this.variablePrefixes = ['--lcards-', '--lcars-', '--cblcars-'];
        this.showPreview = true;
        this.allowMatchLight = false;
        this.entityId = '';
        this.showBuilder = true;  // Enable builder by default
        this.themeContext = null;
        this._cssVariables = [];
        this._computedColor = '';
        this._variablesCache = null; // Static cache shared across instances

        // Builder state
        this._builderMode = false;
        this._selectedFunction = 'lighten';
        this._baseColor = '';
        this._baseColor2 = '';
        this._amount = 20;
        this._applyBrightness = false;

        // Popover + filter state
        this._popoverOpen = false;
        this._popoverMounted = false;
        this._popoverMode = '';
        this._sortMode = 'name';
        this._searchText = '';
        this._selectedFamily = 'all';
        this._selectedCategoryGroup = 'theme';

        // Builder color-slot popover state
        this._builderPickingFor = null;
        this._builderPopoverOpen = false;
        this._builderPopoverMounted = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .color-picker {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
            }

            .color-inputs {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .input-label {
                font-size: var(--ha-font-size-s);
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                padding: 0 var(--ha-space-2);
            }

            .input-label-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 24px;
            }

            .brightness-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 var(--ha-space-2);
                min-height: 36px;
            }

            /* ── wa-popover body — zero out Web Awesome's built-in padding and fix size ── */
            wa-popover {
                --wa-space-l: 0;
            }

            wa-popover::part(body) {
                padding: 0;
                width: max(var(--body-width, 320px), 280px);
                max-width: max(var(--body-width, 320px), 280px);
                max-height: 500px;
                height: 70vh;
                overflow: hidden;
            }

            @media (max-height: 1000px) {
                wa-popover::part(body) {
                    max-height: 400px;
                }
            }

            /* Trigger field (replaces ha-select in text UI mode) */
            .color-trigger-field {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 0 var(--ha-space-3);
                height: 56px;
                border: var(--ha-border-width-sm) solid var(--outline-color, var(--divider-color, #e0e0e0));
                border-radius: var(--ha-border-radius-md);
                cursor: pointer;
                background: var(--card-background-color, #fff);
                box-sizing: border-box;
                user-select: none;
            }

            .color-trigger-field:hover {
                border-color: var(--primary-color);
            }

            .color-swatch-trigger {
                width: 20px;
                height: 20px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
                flex-shrink: 0;
            }

            .color-trigger-label {
                flex: 1;
                font-size: var(--ha-font-size-m);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: var(--primary-text-color);
            }

            .color-trigger-chevron {
                color: var(--secondary-text-color);
                flex-shrink: 0;
            }

            /* ── Popover content — mirrors ha-picker-combo-box layout ── */
            .popover-content {
                display: flex;
                flex-direction: column;
                padding-top: var(--ha-space-4);
                height: 100%;
                overflow: hidden;
                box-sizing: border-box;
            }

            /* search input: left/right gutter + bottom spacing, distinct background */
            .popover-content ha-input-search {
                padding: 0 var(--ha-space-3) var(--ha-space-3);
                /* Make the search field visually distinct from the popover body by
                   mapping --card-background-color (used internally by ha-input outlined)
                   to the neutral-quiet-resting fill that HA uses for section headers etc. */
                --card-background-color: var(--ha-color-fill-neutral-quiet-resting, var(--secondary-background-color, #f5f5f5));
            }

            /* sections chip row (scope + separator + Picker, and family row) */
            .sections {
                display: flex;
                flex-wrap: nowrap;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 0 var(--ha-space-3) var(--ha-space-3);
                overflow: auto;
                flex-shrink: 0;
            }

            .sort-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                padding: 0;
                margin-inline-start: auto;
                flex-shrink: 0;
                border: none;
                background: none;
                cursor: pointer;
                color: var(--secondary-text-color);
                opacity: 0.5;
                border-radius: var(--ha-border-radius-sm);
                transition: opacity var(--ha-animation-duration-fast, 0.15s);
            }

            .sort-btn:hover {
                opacity: 0.9;
            }

            .sort-btn ha-svg-icon {
                width: 16px;
                height: 16px;
                pointer-events: none;
            }

            .sort-btn.sort-gradient {
                color: var(--primary-color);
                opacity: 1;
            }

            .sections ha-filter-chip {
                flex-shrink: 0;
                --md-filter-chip-selected-container-color: var(
                    --ha-color-fill-primary-normal-hover,
                    rgba(var(--rgb-primary-color, 3, 169, 244), 0.2)
                );
                color: var(--primary-color);
            }

            /* Chips with no-leading-icon: equalise leading/trailing space so the label
               stays horizontally centred in both selected and unselected states.
               MD3 normally reduces leading-space when a leading icon (checkmark) is
               present; forcing it equal to trailing-space keeps text visually centred. */
            .sections ha-filter-chip[no-leading-icon] {
                --md-filter-chip-leading-space: var(--ha-space-3);
                --md-filter-chip-with-leading-icon-leading-space: var(--ha-space-3);
                --md-filter-chip-trailing-space: var(--ha-space-3);
            }

            /* vertical bar between scope chips and Picker */
            .sections .separator {
                height: var(--ha-space-8);
                width: 0;
                border: var(--ha-border-width-sm) solid var(--ha-color-border-neutral-quiet, var(--divider-color));
                flex-shrink: 0;
                align-self: center;
            }

            /* section title above the list */
            .section-title-wrapper {
                height: 0;
                position: relative;
            }

            .section-title {
                box-sizing: border-box;
                background-color: var(--ha-color-fill-neutral-quiet-resting, var(--secondary-background-color));
                padding: var(--ha-space-1) var(--ha-space-4);
                font-family: var(--ha-font-family-body, inherit);
                font-weight: var(--ha-font-weight-bold, 500);
                color: var(--secondary-text-color);
                min-height: var(--ha-space-6);
                display: flex;
                align-items: center;
                opacity: 0;
                position: absolute;
                top: 1px;
                width: calc(100% - var(--ha-space-4));
            }

            .section-title.show {
                opacity: 1;
                z-index: 1;
            }

            /* scrollable color variable list */
            .color-list {
                overflow-y: auto;
                flex: 1;
                min-height: 0;
                /* leave room for the section-title overlay */
                padding-top: var(--ha-space-6);
            }

            /* selected item highlight */
            ha-combo-box-item.current-value {
                background-color: var(--ha-color-fill-primary-quiet-resting, rgba(var(--rgb-primary-color, 3, 169, 244), 0.08));
            }

            .color-swatch-sm {
                display: block;
                width: 20px;
                height: 20px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
                flex-shrink: 0;
            }

            .color-swatch-sm.unresolvable {
                border-style: dashed;
                opacity: 0.4;
            }

            .swatch-transparent {
                display: block;
                width: 20px;
                height: 20px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
                background: linear-gradient(45deg, #ccc 25%, transparent 25%),
                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                            linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 8px 8px;
                background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
                flex-shrink: 0;
            }

            /* Native color picker (Picker chip mode) */
            .picker-mode-content {
                padding: var(--ha-space-3);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                flex: 1;
                min-height: 0;
                overflow-y: auto;
            }

            hex-alpha-color-picker {
                width: 100%;
                height: 240px;
            }

            hex-alpha-color-picker::part(saturation) {
                border-radius: var(--ha-border-radius-md) var(--ha-border-radius-md) 0 0;
            }

            hex-alpha-color-picker::part(hue) {
                border-radius: 0;
                height: 24px;
            }

            hex-alpha-color-picker::part(alpha) {
                border-radius: 0 0 var(--ha-border-radius-md) var(--ha-border-radius-md);
                height: 24px;
            }

            hex-input {
                width: 100%;
            }

            hex-input::part(input) {
                width: 100%;
                box-sizing: border-box;
                padding: var(--ha-space-2) var(--ha-space-3);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-border-radius-md);
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color);
                font-family: monospace;
                font-size: var(--ha-font-size-m, 14px);
                outline: none;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            hex-input::part(input):focus {
                border-color: var(--primary-color);
            }

            .chip-swatch {
                display: inline-block;
                width: 9px;
                height: 9px;
                border-radius: var(--ha-border-radius-circle, 50%);
                border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.15);
            }

            ha-selector {
                width: 100%;
            }

            .color-swatch {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 3px;
                margin-right: var(--ha-space-2);
                vertical-align: middle;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
            }

            .color-swatch.transparent {
                background: linear-gradient(45deg, #ccc 25%, transparent 25%),
                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                            linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 8px 8px;
                background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            }

            .preview {
                margin-top: var(--ha-space-2);
                padding: var(--ha-space-3);
                border-radius: 22px;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
                transition: all var(--ha-animation-duration-normal, 0.2s) ease;
            }

            .preview-value {
                font-size: 13px;
                font-family: monospace;
            }

            .preview-computed {
                font-size: 13px;
                opacity: 0.7;
            }

            /* Builder UI Styles */
            .picker-header {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding: 0 var(--ha-space-1);
            }

            /* Unified pill-group: square the inner corners, pill the outer ones.
               ::part(base) pierces ha-button's shadow DOM to reach the <button> element. */
            .picker-header wa-button-group ha-button::part(base) {
                min-height: 28px;
                height: 28px;
                padding-block: 0;
                font-size: var(--ha-font-size-s, 12px);
            }

            .picker-header wa-button-group ha-button:first-child::part(base) {
                border-start-start-radius: var(--ha-border-radius-pill);
                border-end-start-radius: var(--ha-border-radius-pill);
                border-start-end-radius: 0;
                border-end-end-radius: 0;
                border-inline-end: none;
            }

            .picker-header wa-button-group ha-button:last-child::part(base) {
                border-start-start-radius: 0;
                border-end-start-radius: 0;
                border-start-end-radius: var(--ha-border-radius-pill);
                border-end-end-radius: var(--ha-border-radius-pill);
            }

            .builder-panel {
                background: var(--card-background-color, #fff);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-4);
            }

            .builder-row {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
            }

            .builder-row label {
                font-size: 13px;
                font-weight: 500;
                color: var(--primary-text-color);
            }

            .builder-result {
                background: var(--secondary-background-color, #f5f5f5);
                padding: var(--ha-space-3);
                border-radius: var(--ha-border-radius-md);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
            }

            .builder-result code {
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: var(--primary-text-color);
                word-break: break-all;
            }

            .result-actions {
                display: flex;
                gap: var(--ha-space-2);
                align-items: center;
                justify-content: flex-end;
                margin-top: var(--ha-space-2);
            }

            .result-actions ha-button {
                --ha-button-border-radius: var(--ha-card-border-radius, 12px);
            }

            .copy-success {
                font-size: var(--ha-font-size-s);
                color: var(--success-color, #4caf50);
                display: flex;
                align-items: center;
                gap: var(--ha-space-1);
            }

            .preview-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-3);
            }

            .preview-swatch {
                padding: var(--ha-space-3);
                border-radius: var(--ha-card-border-radius, 12px);
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                text-align: center;
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .preview-swatch-label {
                font-size: 13px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.8;
            }

            .preview-swatch-value {
                font-size: 13px;
                font-family: monospace;
                opacity: 0.7;
            }

            .validation-error {
                color: var(--error-color, #f44336);
                font-size: var(--ha-font-size-s);
                padding: 8px;
                background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                border-radius: var(--ha-border-radius-sm);
                margin-top: 8px;
            }

            .custom-color-input {
                padding: 0 var(--ha-space-3) var(--ha-space-3);
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .custom-color-input ha-selector {
                flex: 1;
                width: 100%;
            }

            .custom-color-input .color-swatch-sm {
                flex-shrink: 0;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadCssVariables();
        // Parse incoming value to populate brightness toggle state
        const { applyBrightness } = this._parseIncomingValue(this.value);
        if (applyBrightness) {
            this._applyBrightness = true;
        }
        this._updateComputedColor();
    }

    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('value')) {
            // Parse incoming value to keep brightness toggle in sync
            const { applyBrightness } = this._parseIncomingValue(this.value);
            if (this._applyBrightness !== applyBrightness) {
                this._applyBrightness = applyBrightness;
            }
            this._updateComputedColor();

            // Try to parse value into builder if in builder mode
            if (this._builderMode && this.value) {
                this._tryParseValueToBuilder(this.value);
            }
        } else if (changedProps.has('themeContext')) {
            // this.value itself didn't change, but _computeColor(this.value) also depends on
            // themeContext — a different theme can define the same var() reference text (e.g.
            // "var(--lcars-ui-primary)") pointing at a different actual color, so the resolved
            // preview must be recomputed even when the raw string is unchanged.
            this._updateComputedColor();
        }
    }

    /**
     * Load CSS variables from document
     * Uses cache to avoid repeated scans
     * @private
     */
    _loadCssVariables() {
        // Use static cache if available
        if (LCARdSColorPicker._variablesCache) {
            this._cssVariables = LCARdSColorPicker._variablesCache;
            return;
        }

        // getCssVarCategory() only knows the '--lcars-' prefix, not that ~150
        // of those names are ha-lcars's raw named Star-Trek palette (e.g.
        // --lcars-tomato) vs. ~46 being its meaningful lcars-ui-*/card/
        // sidebar semantic layer — the distinction the 'ha-lcars' chip below
        // needs. The catalog module already carries that split; look up bare
        // names against it and refine the generic 'lcars' category to
        // 'lcars-semantic' where it applies.
        const catalogCategoryByName = new Map(getKnownVariableCatalog().map(e => [`--${e.name}`, e.category]));
        const categoryFor = (prop) => {
            const generic = getCssVarCategory(prop);
            if (generic === 'lcars' && catalogCategoryByName.get(prop) === 'lcars-semantic') return 'lcars-semantic';
            return generic;
        };

        const variables = [];
        const seenNames = new Set();
        const styles = getComputedStyle(document.documentElement);

        // Scan every CSS custom property (not just variablePrefixes) — scope
        // is narrowed downstream by the category-group chip (issue #372
        // follow-up), defaulting to 'theme' so the visible list is unchanged
        // unless the user opts into 'ha' or 'all'. Only color values are ever
        // candidates here since this is a color field.
        for (let i = 0; i < styles.length; i++) {
            const prop = styles[i];
            if (!prop.startsWith('--')) continue;

            const value = styles.getPropertyValue(prop).trim();
            if (!value || !isColorValue(value)) continue;

            seenNames.add(prop);
            variables.push({
                name: prop,
                value: `var(${prop})`,
                label: this._formatVariableName(prop),
                // Value-based color family (hue bucket), independent of var naming — issue #372
                family: getColorFamily(value),
                category: categoryFor(prop),
                resolvable: true
            });
        }

        // Merge in the static known-name catalog (ha-lcars/LCARdS/HA var
        // names) for anything not currently live on the page — the exact
        // situation a theme-*authoring* tool is used in, before HA-LCARS is
        // installed/active. These have no live value to preview, so they're
        // tagged unresolvable and rendered with an empty swatch instead of a
        // guessed color, rather than silently missing from the picker.
        for (const entry of getKnownVariableCatalog()) {
            if (!KNOWN_COLOR_CATALOG_CATEGORIES.has(entry.category)) continue;
            const prop = `--${entry.name}`;
            if (seenNames.has(prop)) continue;

            variables.push({
                name: prop,
                value: `var(${prop})`,
                label: `${this._formatVariableName(prop)} (inactive)`,
                family: null,
                category: categoryFor(prop),
                resolvable: false
            });
        }

        // Sort alphabetically by label
        variables.sort((a, b) => a.label.localeCompare(b.label));

        // Cache for future instances
        LCARdSColorPicker._variablesCache = variables;
        this._cssVariables = variables;
    }

    /**
     * Format CSS variable name for display
     * @param {string} varName - CSS variable name (e.g., '--lcards-orange')
     * @returns {string} Formatted label (e.g., 'lcards-orange')
     * @private
     */
    _formatVariableName(varName) {
        // Remove the leading dashes but keep the prefix
        let label = varName;

        // Remove leading dashes
        if (label.startsWith('--')) {
            label = label.substring(2);
        }

        return label;
    }

    /**
     * The shared, static-cached scan (_loadCssVariables) buckets every var's `family` from
     * whatever's genuinely live on document.documentElement at scan time — a single cache shared
     * across every color-picker instance and never re-scoped per this.themeContext. But
     * themeContext (a theme being edited/imported, never actually applied to the page — e.g. the
     * Palette Seed custom ramp editor) can define a completely different value for the same var
     * name, and _computeColor already resolves *that* value correctly for the swatch dot/preview
     * via _substituteThemeContextVars — the family bucket just never got the same treatment, so a
     * var could show its correct color in the swatch while still being filed under the wrong hue
     * chip. Recomputes family only for names themeContext actually overrides — cheap (no DOM
     * scanning), and returns a new array rather than mutating the shared cache, since other open
     * pickers may have a different (or no) context.
     * @param {Array} variables
     * @returns {Array}
     * @private
     */
    _applyThemeContextFamilies(variables) {
        if (!this.themeContext) return variables;
        // Memoized on themeContext's own identity (a fresh object every time a theme is
        // (re)loaded — see _importedThemeContext in lcards-theme-generator-view.js) — this method
        // runs on every render (typing in the search box, etc.), and _computeColor below can do a
        // real DOM round-trip per var, not worth repeating when nothing's actually changed.
        if (this._themeContextFamiliesSource === this.themeContext && this._themeContextFamiliesCache) {
            return this._themeContextFamiliesCache;
        }
        const result = variables.map(v => {
            // themeContext keys are bare (no leading --), matching _substituteThemeContextVars's
            // own var(--x) capture group convention — v.name always carries the -- prefix.
            const key = v.name.startsWith('--') ? v.name.slice(2) : v.name;
            if (!Object.prototype.hasOwnProperty.call(this.themeContext, key)) return v;
            // Route through _computeColor rather than reading this.themeContext[key] directly —
            // a theme's own flat var map is frequently chained (e.g. lcars-ui-config-icon: var(
            // --lcars-ui-config-button), which is itself var(--lcards-orange-lightest)) and only
            // _computeColor's _substituteThemeContextVars recursively walks that chain; a single
            // shallow lookup left the second (and deeper) hop resolving against whatever's live on
            // the real page instead of the theme actually being edited — the same class of bug
            // _renderPreview's swatch used to have before it also switched to _computeColor.
            const resolved = this._computeColor(`var(--${key})`);
            const family = getColorFamily(resolved);
            return family ? { ...v, family } : v;
        });
        this._themeContextFamiliesSource = this.themeContext;
        this._themeContextFamiliesCache = result;
        return result;
    }

    /**
     * Variables to actually render in the dropdown(s), narrowed by the
     * search text / color-family chip filter bar (issue #372). When no
     * filter is active this is just `_cssVariables` unchanged.
     * @returns {Array}
     * @private
     */
    _getFilteredVariables() {
        let vars = this._applyThemeContextFamilies(this._cssVariables);

        const allowedCategories = CATEGORY_GROUPS[this._selectedCategoryGroup];
        if (allowedCategories) {
            vars = vars.filter(v => allowedCategories.includes(v.category));
        }

        if (this._selectedFamily !== 'all') {
            vars = vars.filter(v => v.family === this._selectedFamily);
        }

        if (this._searchText) {
            const q = this._searchText.toLowerCase();
            vars = vars.filter(v =>
                v.label.toLowerCase().includes(q) ||
                v.name.toLowerCase().includes(q) ||
                (v.family && FAMILY_LABELS[v.family].toLowerCase().includes(q))
            );
        }

        if (this._sortMode === 'gradient') {
            // Pre-compute sort keys once (avoids n·log(n) DOM reads inside comparator)
            const withKeys = vars.map(v => ({ v, k: getColorSortKey(v.value) }));
            withKeys.sort((a, b) => {
                const ak = a.k, bk = b.k;
                if (!ak && !bk) return a.v.label.localeCompare(b.v.label);
                if (!ak) return 1;
                if (!bk) return -1;
                // Family first (hue-wheel order: red → orange → … → gray)
                const familyDiff = FAMILY_ORDER.indexOf(ak.family) - FAMILY_ORDER.indexOf(bk.family);
                if (familyDiff !== 0) return familyDiff;
                // Within family: lightness (dark → light) so variants cluster visually
                const lightnessDiff = ak.lightness - bk.lightness;
                if (lightnessDiff !== 0) return lightnessDiff;
                // Tiebreak by hue, then name
                return (ak.hue - bk.hue) || a.v.label.localeCompare(b.v.label);
            });
            vars = withKeys.map(({ v }) => v);
        } else {
            vars = [...vars].sort((a, b) => a.label.localeCompare(b.label));
        }

        return vars;
    }

    _cycleSortMode() {
        this._sortMode = this._sortMode === 'gradient' ? 'name' : 'gradient';
    }

    _handleFilterSearchInput(ev) {
        this._searchText = ev.target.value || '';
    }

    _selectPickerFamily(family) {
        this._selectedFamily = family;
    }

    _selectCategoryGroup(group) {
        this._selectedCategoryGroup = group;
    }

    /**
     * Full popover body: category chips + search + family chips + Picker chip + list or color input.
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderPopoverContent() {
        const familiesPresent = FAMILY_ORDER.filter(f => this._cssVariables.some(v => v.family === f));
        const sectionTitle = this._getSectionTitle();
        const isListMode = this._popoverMode === '';

        return html`
            <div class="popover-content">

                <!-- 1. Search — always visible, always first -->
                <ha-input-search
                    appearance="outlined"
                    style="--start-slot-width: calc(18px + var(--ha-space-1)); --input-padding-inline-start: var(--ha-space-1);"
                    .value=${this._searchText}
                    .disabled=${this.disabled}
                    @input=${this._handleFilterSearchInput}>
                </ha-input-search>

                <!-- 2. Sections row: scope chips | separator | Picker | CSS | Custom -->
                <ha-chip-set class="sections">
                    ${Object.keys(CATEGORY_GROUPS).map(group => html`
                        <ha-filter-chip
                            no-leading-icon
                            .selected=${this._selectedCategoryGroup === group && isListMode}
                            .label=${CATEGORY_GROUP_LABELS[group]}
                            @click=${() => { this._popoverMode = ''; this._selectCategoryGroup(group); }}>
                        </ha-filter-chip>
                    `)}
                    <div class="separator"></div>
                    <ha-filter-chip
                        no-leading-icon
                        .selected=${this._popoverMode === 'picker'}
                        .label=${'Picker'}
                        @click=${() => this._setPopoverMode('picker')}>
                    </ha-filter-chip>
                    <ha-filter-chip
                        no-leading-icon
                        .selected=${this._popoverMode === 'named'}
                        .label=${'CSS'}
                        @click=${() => this._setPopoverMode('named')}>
                    </ha-filter-chip>
                    <ha-filter-chip
                        no-leading-icon
                        .selected=${this._popoverMode === 'custom'}
                        .label=${'Custom'}
                        @click=${() => this._setPopoverMode('custom')}>
                    </ha-filter-chip>
                </ha-chip-set>

                <!-- 3. Color family chips (list mode only) -->
                ${isListMode ? html`
                    <ha-chip-set class="sections">
                        <ha-filter-chip
                            no-leading-icon
                            .selected=${this._selectedFamily === 'all'}
                            .label=${'All'}
                            @click=${() => this._selectPickerFamily('all')}>
                        </ha-filter-chip>
                        ${familiesPresent.map(family => html`
                            <ha-filter-chip
                                .selected=${this._selectedFamily === family}
                                .label=${FAMILY_LABELS[family]}
                                title=${FAMILY_HUE_RANGES[family] || ''}
                                @click=${() => this._selectPickerFamily(family)}>
                                <span slot="icon" class="chip-swatch"
                                    style="background-color: ${FAMILY_SWATCH_COLORS[family]}">
                                </span>
                            </ha-filter-chip>
                        `)}
                    </ha-chip-set>

                    <!-- 4. Section title header (floats above list) with sort button -->
                    <div class="section-title-wrapper">
                        <div class="section-title show">
                            <span>${sectionTitle}</span>
                            <button
                                class="sort-btn ${this._sortMode === 'gradient' ? 'sort-gradient' : ''}"
                                title=${this._sortMode === 'gradient' ? 'Sort: Colour (click for A–Z)' : 'Sort: A–Z (click for colour)'}
                                @click=${this._cycleSortMode}>
                                <ha-svg-icon .path=${this._sortMode === 'gradient' ? MDI_PALETTE : MDI_SORT_ALPHA}></ha-svg-icon>
                            </button>
                        </div>
                    </div>
                ` : nothing}

                <!-- 5. Content area: list, color wheel, named colors, or custom input -->
                ${this._popoverMode === 'picker' ? this._renderPickerMode() :
                  this._popoverMode === 'named' ? this._renderNamedColorList() :
                  this._popoverMode === 'custom' ? this._renderCustomColorInput() :
                  this._renderColorList()}
            </div>
        `;
    }

    /**
     * Label for the section title bar above the list.
     * @returns {string}
     * @private
     */
    _getSectionTitle() {
        const scopeLabel = CATEGORY_GROUP_LABELS[this._selectedCategoryGroup];
        if (this._selectedFamily === 'all') return scopeLabel;
        return `${scopeLabel} — ${FAMILY_LABELS[this._selectedFamily]}`;
    }

    /**
     * Scrollable list of color variables + special entries for the popover.
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderColorList() {
        const filteredVars = this._getFilteredVariables();
        const activeValue = this._builderPickingFor === 'color1' ? this._baseColor
                          : this._builderPickingFor === 'color2' ? this._baseColor2
                          : this.value;
        const { color: currentColor } = this._parseIncomingValue(activeValue);

        return html`
            <div class="color-list" role="listbox">
                <ha-combo-box-item type="button"
                    @click=${() => this._selectAndClose('')}>
                    <span slot="headline">— None —</span>
                </ha-combo-box-item>
                <ha-combo-box-item type="button"
                    @click=${() => this._selectAndClose('transparent')}>
                    <span slot="start" class="swatch-transparent"></span>
                    <span slot="headline">Transparent</span>
                </ha-combo-box-item>
                ${this.allowMatchLight ? html`
                    <ha-combo-box-item type="button"
                        @click=${() => this._selectAndClose('match-light')}>
                        <ha-svg-icon slot="start" .path=${MDI_LIGHTBULB}
                            style="color: ${this._resolveMatchLightForPreview('match-light') || 'var(--primary-text-color)'}; width: 20px; height: 20px; flex-shrink: 0;">
                        </ha-svg-icon>
                        <span slot="headline">Match Light Colour</span>
                    </ha-combo-box-item>
                ` : nothing}
                ${filteredVars.map(v => html`
                    <ha-combo-box-item type="button"
                        class="${currentColor === v.value ? 'current-value' : ''}"
                        @click=${() => this._selectAndClose(v.value)}>
                        <span slot="start" class="color-swatch-sm ${v.resolvable === false ? 'unresolvable' : ''}"
                            style="background-color: ${this._computeColor(v.value)};"></span>
                        <span slot="headline">${v.label}</span>
                    </ha-combo-box-item>
                `)}
            </div>
        `;
    }

    /**
     * Native ha-input color picker shown when "Picker" chip is active.
     * Uses `change` (not `input`) so the popover closes only when the browser
     * native color picker is dismissed, not on each slider drag.
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderPickerMode() {
        const hexValue = this._valueToHex();
        return html`
            <div class="picker-mode-content">
                <hex-alpha-color-picker
                    .color=${hexValue}
                    @color-changed=${this._handlePickerColorChange}>
                </hex-alpha-color-picker>
                <hex-input
                    prefixed
                    alpha
                    .color=${hexValue}
                    @color-changed=${this._handlePickerColorChange}>
                </hex-input>
            </div>
        `;
    }

    /** Filter CSS named colors by current search text. */
    _getFilteredNamedColors() {
        if (!this._searchText) return CSS_NAMED_COLORS;
        const q = this._searchText.toLowerCase();
        return CSS_NAMED_COLORS.filter(n => n.includes(q));
    }

    _renderNamedColorList() {
        const filtered = this._getFilteredNamedColors();
        const activeValue = this._builderPickingFor === 'color1' ? this._baseColor
                          : this._builderPickingFor === 'color2' ? this._baseColor2
                          : this.value;
        return html`
            <div class="color-list" role="listbox">
                ${filtered.map(name => html`
                    <ha-combo-box-item type="button"
                        class="${activeValue === name ? 'current-value' : ''}"
                        @click=${() => this._selectAndClose(name)}>
                        <span slot="start" class="color-swatch-sm"
                            style="background-color: ${name};"></span>
                        <span slot="headline">${name}</span>
                    </ha-combo-box-item>
                `)}
            </div>
        `;
    }

    _renderCustomColorInput() {
        const currentVal = this._builderPickingFor === 'color1' ? this._baseColor
                         : this._builderPickingFor === 'color2' ? this._baseColor2
                         : this.value;
        // Live preview swatch, computed fresh on every render so it tracks
        // whatever's currently typed — not wired to _computedColor (which
        // only ever tracks this.value, not _baseColor/_baseColor2 while
        // builder-picking), so it stays correct in both contexts.
        const previewColor = currentVal ? this._computeColor(currentVal) : '';
        return html`
            <div class="custom-color-input">
                <span class="color-swatch-sm" style="background-color: ${previewColor};"></span>
                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{ text: {} }}
                    .value=${currentVal || ''}
                    .disabled=${this.disabled}
                    @value-changed=${this._handlePopoverCustomInput}
                    placeholder="#ff9900, rgb(255,153,0), var(...), lighten(...)">
                </ha-selector>
            </div>
        `;
    }

    _handlePopoverCustomInput(ev) {
        if (this.disabled) return;
        const value = ev.detail.value;
        if (this._builderPickingFor) {
            if (this._builderPickingFor === 'color1') this._baseColor = value;
            else this._baseColor2 = value;
        } else {
            this._emitChange(value);
        }
    }

    /**
     * Update computed color for preview
     * @private
     */
    _updateComputedColor() {
        // Delegates to _computeColor rather than duplicating its DOM/token/match-light resolution
        // (this used to have its own copy of that logic, which meant it never got the themeContext
        // fix _computeColor has — the main swatch/button was silently resolving var() references
        // against the live page instead of an imported theme, while the Custom-text tab's own
        // preview swatch, wired to _computeColor directly, resolved correctly).
        this._computedColor = this.value ? this._computeColor(this.value) : '';
    }

    /**
     * Resolve 'match-light' to an actual colour string using the hass entity state.
     * Only used for editor preview — the card runtime uses _resolveMatchLightColor().
     * @param {string} value - May equal 'match-light' or contain it
     * @returns {string} Resolved colour, or the original string if unavailable
     * @private
     */
    _resolveMatchLightForPreview(value) {
        if (!value || (!value.includes('match-light') && !value.includes('match-brightness'))) return value;
        // @ts-ignore - TS2339: auto-suppressed
        const entity = this.hass?.states?.[this.entityId];

        // Resolve match-brightness: replace with actual alpha value or remove if light is off
        let result = value;
        if (result.includes('match-brightness')) {
            if (entity && entity.state === 'on') {
                const brightness = entity.attributes.brightness ?? 255;
                const alpha = (brightness / 255).toFixed(3);
                result = result.replace(/match-brightness/g, alpha);
            } else {
                result = result.replace(/match-brightness/g, '1');
            }
        }

        if (!result.includes('match-light')) return result;
        if (!entity || entity.state !== 'on') return result;

        let color = null;
        if (entity.attributes.rgb_color) {
            const [r, g, b] = entity.attributes.rgb_color;
            color = `rgb(${r}, ${g}, ${b})`;
        } else if (entity.attributes.hs_color) {
            const [h, s] = entity.attributes.hs_color;
            color = ColorUtils.hsToRgb ? (() => {
                const [r, g, b] = ColorUtils.hsToRgb(h, s, (entity.attributes.brightness ?? 255));
                return `rgb(${r}, ${g}, ${b})`;
            })() : null;
        } else if (entity.attributes.color_temp) {
            const kelvin = entity.attributes.color_temp_kelvin
                ?? Math.round(1000000 / entity.attributes.color_temp);
            const [r, g, b] = ColorUtils.kelvinToRgb(kelvin);
            color = `rgb(${r}, ${g}, ${b})`;
        } else {
            // Brightness-only light — derive a warm white scaled to brightness
            const b = entity.attributes.brightness ?? 255;
            const level = Math.round((b / 255) * 255);
            color = `rgb(${level}, ${Math.round(level * 0.97)}, ${Math.round(level * 0.85)})`;
        }

        if (!color) return result;
        return result.replace(/match-light/g, color);
    }

    /**
     * Compute actual color from CSS variable or computed token
     * @param {string} colorValue - Color value (may be CSS variable or computed token)
     * @returns {string} Computed color
     * @private
     */
    _computeColor(colorValue) {
        if (!colorValue) return '';

        // Resolve match-light token for preview via hass entity
        colorValue = this._resolveMatchLightForPreview(colorValue);

        // Check if it's a computed token
        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix', 'base'];
        const isComputedToken = validFunctions.some(fn => colorValue.startsWith(`${fn}(`));

        if (isComputedToken) {
            return this._approximateComputedColor(colorValue);
        }

        // For CSS variables, compute the actual color via DOM
        if (colorValue.includes('var(')) {
            // Substitute any var(--x) this.themeContext knows about *before* asking the live
            // DOM — themeContext holds a theme's own var map, which was never actually applied
            // to the page (e.g. a theme just imported into an editor), so the DOM round-trip
            // alone would silently resolve against whatever theme IS currently live instead.
            colorValue = this._substituteThemeContextVars(colorValue);
            // Only skip the DOM round-trip below when colorValue is already something
            // ColorUtils._parseColor can read directly (plain hex or rgb()/rgba()) — a value like
            // `color-mix(in oklch, var(--x) 8%, white)` still has a color-mix() wrapper around the
            // now-substituted var() that only the browser's own CSS engine can evaluate down to a
            // real colour. Used to return early the instant every var() was gone, handing back
            // that still-unevaluated color-mix() string as if it were a finished colour, which
            // every downstream consumer (contrast-colour luminance, the hex readout) then silently
            // mis-parsed.
            if (/^#[0-9a-f]{3,8}$/i.test(colorValue) || /^rgba?\(/i.test(colorValue)) return colorValue;
            try {
                const temp = document.createElement('div');
                temp.style.color = colorValue;
                document.body.appendChild(temp);
                const computed = getComputedStyle(temp).color;
                document.body.removeChild(temp);
                return computed || colorValue;
            } catch (err) {
                return colorValue;
            }
        }

        return colorValue;
    }

    /** Repeatedly substitutes any var(--x) found as a key in this.themeContext with its value, recursing until stable (depth-capped) — handles both a bare var() and one embedded in a larger expression like color-mix(). Vars not present in themeContext are left untouched for the normal live-DOM path below. */
    _substituteThemeContextVars(value, depth = 0) {
        if (!this.themeContext || depth > 12 || typeof value !== 'string' || !value.includes('var(--')) return value;
        let changed = false;
        const next = value.replace(/var\(--([a-zA-Z0-9-]+)\)/g, (match, key) => {
            if (Object.prototype.hasOwnProperty.call(this.themeContext, key)) {
                changed = true;
                return String(this.themeContext[key]);
            }
            return match;
        });
        return changed ? this._substituteThemeContextVars(next, depth + 1) : next;
    }

    /**
     * Calculate luminance for contrast determination
     * Based on WCAG relative luminance formula
     * @param {string} color - Color value (hex, rgb, rgba)
     * @returns {number} Luminance value (0-1)
     * @private
     */
    _calculateLuminance(color) {
        return ColorUtils.luminance(color);
    }

    /**
     * Parse color string to RGB array
     * @param {string} color - Color value
     * @returns {Array<number>|null} [r, g, b]
     * @private
     */
    _parseColor(color) {
        return ColorUtils.parseColor(color);
    }

    /**
     * Convert RGB string to hex
     * @param {string} rgb - RGB color string (e.g., 'rgb(255, 153, 0)')
     * @returns {string|null} Hex color (e.g., '#ff9900')
     * @private
     */
    _rgbToHex(rgb) {
        const rgbValues = ColorUtils.parseColor(rgb);
        if (!rgbValues) return null;
        return ColorUtils.rgbToHex(rgbValues[0], rgbValues[1], rgbValues[2]);
    }

    /**
     * Get text color based on background luminance
     * @param {string} bgColor - Background color
     * @returns {string} 'black' or 'white'
     * @private
     */
    _getContrastColor(bgColor) {
        return ColorUtils.contrastColor(bgColor);
    }

    render() {
        return html`
            <div class="color-picker">
                ${this.showBuilder ? this._renderModeToggle() : ''}

                ${this._builderMode ? this._renderBuilderUI() : this._renderTextUI()}

                ${this.showPreview ? this._renderPreview() : ''}
            </div>
        `;
    }

    /**
     * Render mode toggle buttons
     * @returns {TemplateResult}
     * @private
     */
    _renderModeToggle() {
        return html`
            <div class="picker-header">
                <wa-button-group childSelector="ha-button">
                    <ha-button iconTag="ha-svg-icon"
                        variant="brand" size="s"
                        .appearance=${!this._builderMode ? 'accent' : 'filled'}
                        .disabled=${this.disabled}
                        @click=${() => this._setMode(false)}>
                        Picker / Text
                    </ha-button>
                    <ha-button iconTag="ha-svg-icon"
                        variant="brand" size="s"
                        .appearance=${this._builderMode ? 'accent' : 'filled'}
                        .disabled=${this.disabled}
                        @click=${() => this._setMode(true)}>
                        Builder
                    </ha-button>
                </wa-button-group>
            </div>
        `;
    }

    /**
     * Render standard text input UI
     * @returns {TemplateResult}
     * @private
     */
    _renderTextUI() {
        const triggerLabel = this._getTriggerLabel();
        const triggerBg = this._computedColor || 'transparent';
        const isTriggerNone = !this.value;

        return html`
            <div class="color-inputs">
                <!-- CSS Variable / Preset — opens wa-popover picker -->
                <div class="input-group">
                    <div class="input-label-row">
                        <div class="input-label">CSS Variable / Preset</div>
                    </div>
                    <div id="color-trigger"
                        class="color-trigger-field"
                        role="button"
                        tabindex="0"
                        aria-haspopup="dialog"
                        aria-expanded=${this._popoverOpen ? 'true' : 'false'}
                        @click=${this._openPickerPopover}
                        @keydown=${(e) => (e.key === 'Enter' || e.key === ' ') && this._openPickerPopover(e)}>
                        <span class="color-swatch-trigger"
                            style="background-color: ${isTriggerNone ? 'transparent' : triggerBg};
                                   ${isTriggerNone ? 'border-style: dashed;' : ''}">
                        </span>
                        <span class="color-trigger-label">${triggerLabel}</span>
                        <ha-svg-icon class="color-trigger-chevron" .path=${MDI_CHEVRON_DOWN}></ha-svg-icon>
                    </div>
                    ${this._popoverOpen || this._popoverMounted ? html`
                        <wa-popover
                            .open=${this._popoverOpen}
                            style="--body-width: ${this._getPopoverWidth()}px;"
                            without-arrow
                            distance="-4"
                            for="color-trigger"
                            placement="bottom"
                            auto-size="vertical"
                            auto-size-padding="16"
                            @wa-after-show=${this._onPopoverOpened}
                            @wa-after-hide=${this._closePickerPopover}
                            trap-focus
                            role="dialog"
                            aria-modal="true"
                            aria-label="Select color">
                            ${this._popoverMounted ? this._renderPopoverContent() : nothing}
                        </wa-popover>
                    ` : nothing}
                </div>

                ${this.allowMatchLight ? html`
                <div class="brightness-toggle-row">
                    <span class="input-label">Apply light brightness to colour</span>
                    <ha-switch
                        .checked=${this._applyBrightness}
                        .disabled=${this.disabled}
                        @change=${this._handleBrightnessToggle}>
                    </ha-switch>
                </div>
                ` : ''}

            </div>
        `;
    }

    /**
     * Render computed token builder UI
     * @returns {TemplateResult}
     * @private
     */
    _renderBuilderUI() {
        const expression = this._buildExpression();
        const isValid = this._validateExpression(expression);

        return html`
            <div class="builder-panel">
                <!-- Function Selector -->
                <div class="builder-row">
                    <label>Function:</label>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'lighten', label: 'Lighten' },
                            { value: 'darken', label: 'Darken' },
                            { value: 'alpha', label: 'Alpha/Transparency' },
                            { value: 'saturate', label: 'Saturate' },
                            { value: 'desaturate', label: 'Desaturate' },
                            { value: 'mix', label: 'Mix Colours' },
                            { value: 'base', label: 'Alert-Immune Baseline' }
                        ]}}}
                        .value=${this._selectedFunction}
                        .disabled=${this.disabled}
                        @value-changed=${this._onFunctionChange}>
                    </ha-selector>
                </div>

                <!-- Base Color Picker -->
                <div class="builder-row">
                    <label>${this._selectedFunction === 'mix' ? 'Color 1:' : 'Base Color:'}</label>
                    ${this._renderBuilderColorTrigger('color1', this._baseColor)}
                </div>

                <!-- Second Color for Mix Function -->
                ${this._selectedFunction === 'mix' ? html`
                    <div class="builder-row">
                        <label>Color 2:</label>
                        ${this._renderBuilderColorTrigger('color2', this._baseColor2)}
                    </div>
                ` : ''}

                <!-- Amount Slider (hidden for base() which takes no amount argument) -->
                ${this._selectedFunction !== 'base' ? html`
                <div class="builder-row">
                    <label>${this._getAmountLabel()}: ${this._amount}%</label>
                    <ha-selector
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 100, step: 5, mode: 'slider' }}}
                        .value=${this._amount}
                        .disabled=${this.disabled}
                        @value-changed=${this._onAmountChange}>
                    </ha-selector>
                </div>
                ` : html`
                <div class="builder-row" style="font-size:12px; color: var(--secondary-text-color); padding: 4px 0;">
                    Returns the colour’s pre-alert, green-alert baseline value — immune to alert-mode hue shifts.
                </div>
                `}

                <!-- Generated Expression -->
                <div class="builder-result">
                    <code>${expression || 'Configure options above'}</code>
                    ${expression ? html`
                        <div class="result-actions">
                            <ha-button
                                appearance="filled"
                                .disabled=${this.disabled || !isValid || expression === this.value}
                                @click=${this._applyExpression}>
                                Apply
                            </ha-button>
                            <ha-button
                                appearance="filled"
                                .disabled=${this.disabled || !expression}
                                @click=${this._copyExpression}>
                                Copy
                            </ha-button>
                            ${this._copySuccess ? html`
                                <span class="copy-success">
                                    <ha-icon icon="mdi:check"></ha-icon>
                                    Copied!
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                ${!isValid && expression ? html`
                    <div class="validation-error">
                        Invalid expression. Please check the function syntax.
                    </div>
                ` : ''}

                <!-- Before/After Preview -->
                ${this._renderPreviewComparison()}
            </div>
        `;
    }

    /**
     * Get dropdown options
     * @returns {Array} Select options
     * @private
     */
    /*
    _getDropdownOptions() {
        const options = [
            { value: '', label: '-- Select Variable --' },
            { value: 'transparent', label: '🔲 Transparent' }
        ];

        if (this.allowMatchLight) {
            options.push({
                value: 'match-light',
                label: '💡 Match Light Colour'
            });
        }

        // Add CSS variables
        this._cssVariables.forEach(variable => {
            options.push({
                value: variable.value,
                label: variable.label
            });
        });

        return options;
    }
    */

    /**
     * Get current dropdown value
     * @returns {string}
     * @private
     */
    _getCurrentDropdownValue() {
        if (!this.value) return '';

        // Unwrap alpha(color, match-brightness) to get the inner colour for dropdown matching
        const { color } = this._parseIncomingValue(this.value);

        // Check for special values
        if (color === 'transparent') return 'transparent';
        if (color === 'match-light') return 'match-light';

        // Check if value matches a CSS variable
        const matchingVar = this._cssVariables.find(v => v.value === color);
        if (matchingVar) return matchingVar.value;

        return '';
    }

    /**
     * Render preview
     * @returns {TemplateResult}
     * @private
     */
    _renderPreview() {
        if (!this.value) return html``;

        const bgColor = this._computedColor || this.value;
        // _computeColor() can fail to fully resolve a var() (themeContext miss + no live DOM
        // match) and fall through to the raw, still-unresolved string. The swatch's own
        // background-color below still renders fine either way — real CSS resolves var() at
        // paint time even when our JS couldn't — but ColorUtils.contrastColor/_rgbToHex go
        // through a canvas-based parser that has no access to the cascade at all: canvas
        // silently ignores an unparseable fillStyle and keeps whatever it was previously set to
        // ('#000000', since it's reset right before), so an unresolved var() was quietly read as
        // pure black — always producing white contrast text regardless of the swatch's true,
        // possibly very light, colour. Resolve it for real first, via a live DOM element (the
        // same technique _computeColor's own var() branch already uses), not canvas guessing.
        const resolvedBg = bgColor.includes('var(') ? ColorUtils.resolveCssVariable(bgColor, bgColor) : bgColor;
        const textColor = this._getContrastColor(resolvedBg);
        const hexColor = this._rgbToHex(resolvedBg);
        // Genuine R/G/B decimal values, computed fresh rather than trusting _computedColor's own
        // format — it's hex when resolved via a computed token (lighten/darken/...) or a
        // themeContext hit, and only actually "rgb(...)" when resolved via the live-DOM
        // getComputedStyle roundtrip, so labelling it "RGB:" unconditionally showed a hex string
        // under either of the first two paths.
        const rgbValues = ColorUtils.parseColor(resolvedBg);
        const rgbLabel = rgbValues ? rgbValues.join(', ') : this._computedColor;

        return html`
            <div
                class="preview"
                style="background-color: ${bgColor}; color: ${textColor};">
                <div class="preview-value">${this.value}</div>
                ${this._computedColor && this._computedColor !== this.value ? html`
                    <div class="preview-computed">
                        ${hexColor ? html`Hex: ${hexColor} • ` : ''}
                        RGB: ${rgbLabel}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Parse incoming value to extract the inner colour and brightness toggle state.
     * Handles the `alpha(<color>, match-brightness)` round-trip pattern.
     * @param {string} value - Incoming color value
     * @returns {{ color: string, applyBrightness: boolean }}
     * @private
     */
    _parseIncomingValue(value) {
        if (!value || typeof value !== 'string') return { color: value, applyBrightness: false };
        const match = value.match(/^alpha\((.+),\s*match-brightness\)$/);
        if (match) {
            return { color: match[1].trim(), applyBrightness: true };
        }
        return { color: value, applyBrightness: false };
    }

    /**
     * Compute the emitted color value, optionally wrapping with alpha(color, match-brightness).
     * @param {string} colorValue - The base color value
     * @param {boolean} applyBrightness - Whether to apply light brightness
     * @returns {string} Final value to emit
     * @private
     */
    _computeEmittedValue(colorValue, applyBrightness) {
        if (!colorValue) return colorValue;
        if (!applyBrightness) return colorValue;
        return `alpha(${colorValue}, match-brightness)`;
    }

    /**
     * Handle text input change
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleTextChange(ev) {
        if (this.disabled) return;

        const newValue = ev.detail.value;
        this._emitChange(newValue);
    }

    /**
     * Handle brightness toggle change
     * @param {Event} ev - change event from ha-switch
     * @private
     */
    _handleBrightnessToggle(ev) {
        if (this.disabled) return;
        this._applyBrightness = ev.target.checked;
        // Re-emit with the inner colour value, wrapping/unwrapping as needed
        const { color } = this._parseIncomingValue(this.value);
        const baseColor = color || this._getCurrentDropdownValue();
        if (baseColor) {
            this._emitChange(this._computeEmittedValue(baseColor, this._applyBrightness));
        }
    }

    /**
     * Emit value-changed event
     * @param {string} value - New color value
     * @private
     */
    _emitChange(value) {
        this.value = value;
        this._updateComputedColor();

        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }

    // ============================================================================
    // POPOVER METHODS
    // ============================================================================

    _openPickerPopover(ev) {
        if (this.disabled) return;
        ev?.stopPropagation();
        this._popoverOpen = true;
    }

    // Called by @wa-after-show — popover animation complete, now render content
    _onPopoverOpened() {
        this._popoverMounted = true;
    }

    // Called by @wa-after-hide — animation complete, now safe to remove from DOM
    _closePickerPopover() {
        this._popoverOpen = false;
        this._popoverMounted = false;
        this._popoverMode = '';
        this._searchText = '';
        this._selectedFamily = 'all';
    }

    _openBuilderColorPicker(target, ev) {
        if (this.disabled) return;
        ev?.stopPropagation();
        this._builderPickingFor = target;
        this._builderPopoverOpen = true;
    }

    _onBuilderPopoverOpened() {
        this._builderPopoverMounted = true;
    }

    _closeBuilderPopover() {
        this._builderPopoverOpen = false;
        this._builderPopoverMounted = false;
        this._builderPickingFor = null;
        this._popoverMode = '';
        this._searchText = '';
        this._selectedFamily = 'all';
    }

    /** Label for a builder color slot — falls back to raw value or placeholder. */
    _getBuilderColorLabel(value) {
        if (!value) return '— Select Variable —';
        if (value === 'transparent') return 'Transparent';
        return this._cssVariables.find(v => v.value === value)?.label || value;
    }

    /**
     * Render a builder color-slot trigger field + its wa-popover.
     * @param {'color1'|'color2'} target
     * @param {string} value
     * @returns {import('lit').TemplateResult}
     * @private
     */
    _renderBuilderColorTrigger(target, value) {
        const triggerId = `builder-${target}-trigger`;
        const isOpen = this._builderPopoverOpen && this._builderPickingFor === target;
        const isMounted = this._builderPopoverMounted && this._builderPickingFor === target;
        const showPopover = isOpen || isMounted;
        const computedColor = value ? this._computeColor(value) : null;
        const label = this._getBuilderColorLabel(value);
        const isNone = !value;

        return html`
            <div id="${triggerId}"
                class="color-trigger-field"
                role="button"
                tabindex="0"
                aria-haspopup="dialog"
                aria-expanded=${isOpen ? 'true' : 'false'}
                @click=${(ev) => this._openBuilderColorPicker(target, ev)}
                @keydown=${(e) => (e.key === 'Enter' || e.key === ' ') && this._openBuilderColorPicker(target, e)}>
                <span class="color-swatch-trigger"
                    style="background-color: ${isNone ? 'transparent' : computedColor};
                           ${isNone ? 'border-style: dashed;' : ''}">
                </span>
                <span class="color-trigger-label">${label}</span>
                <ha-svg-icon class="color-trigger-chevron" .path=${MDI_CHEVRON_DOWN}></ha-svg-icon>
            </div>
            ${showPopover ? html`
                <wa-popover
                    .open=${isOpen}
                    style="--body-width: ${this._getPopoverWidth()}px;"
                    without-arrow
                    distance="-4"
                    for="${triggerId}"
                    placement="bottom"
                    auto-size="vertical"
                    auto-size-padding="16"
                    @wa-after-show=${this._onBuilderPopoverOpened}
                    @wa-after-hide=${this._closeBuilderPopover}
                    trap-focus
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select color">
                    ${isMounted ? this._renderPopoverContent() : nothing}
                </wa-popover>
            ` : nothing}
        `;
    }

    /** Select a color from the list and close the popover. */
    _selectAndClose(value) {
        if (this.disabled) return;
        if (this._builderPickingFor) {
            // Route to the builder color slot — don't emit value-changed
            if (this._builderPickingFor === 'color1') this._baseColor = value || '';
            else this._baseColor2 = value || '';
            this._builderPopoverOpen = false;
            // _builderPickingFor cleared by _closeBuilderPopover after animation
        } else {
            const emitted = value ? this._computeEmittedValue(value, this._applyBrightness) : '';
            this._emitChange(emitted);
            this._popoverOpen = false;
        }
    }

    /** Toggle one of the named popover modes; clicking the active chip returns to list. */
    _setPopoverMode(mode) {
        this._popoverMode = this._popoverMode === mode ? '' : mode;
    }

    _handlePickerColorChange(ev) {
        const hex = ev.detail.value;
        if (!hex || this.disabled) return;
        if (this._builderPickingFor) {
            if (this._builderPickingFor === 'color1') this._baseColor = hex;
            else this._baseColor2 = hex;
        } else {
            this._emitChange(this._computeEmittedValue(hex, this._applyBrightness));
        }
        // Live updates — popover stays open while picking
    }

    /**
     * Human-readable label for the trigger field.
     * @returns {string}
     * @private
     */
    _getTriggerLabel() {
        if (!this.value) return '— None —';
        const { color } = this._parseIncomingValue(this.value);
        if (color === 'transparent') return 'Transparent';
        if (color === 'match-light') return 'Match Light Colour';
        const matchingVar = this._cssVariables.find(v => v.value === color);
        if (matchingVar) return matchingVar.label;
        return color || '— None —';
    }

    /**
     * Current value as a hex color string for ha-input type="color".
     * Falls back to #000000 if the computed color cannot be converted.
     * @returns {string}
     * @private
     */
    _valueToHex() {
        // If value is already a hex literal, round-trip it directly with alpha preserved
        const raw = (this.value || '').trim().toLowerCase();
        if (/^#[0-9a-f]{8}$/.test(raw)) return raw;
        if (/^#[0-9a-f]{6}$/.test(raw)) return raw + 'ff';
        if (/^#[0-9a-f]{4}$/.test(raw)) {
            const [r, g, b, a] = raw.slice(1).split('');
            return `#${r}${r}${g}${g}${b}${b}${a}${a}`;
        }
        if (/^#[0-9a-f]{3}$/.test(raw)) {
            const [r, g, b] = raw.slice(1).split('');
            return `#${r}${r}${g}${g}${b}${b}ff`;
        }
        // Fall back to computed color (handles CSS vars, token values, named colors)
        const rgba = this._computedColor?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!rgba) return '#000000ff';
        const r = parseInt(rgba[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgba[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgba[3]).toString(16).padStart(2, '0');
        const a = rgba[4] !== undefined
            ? Math.round(parseFloat(rgba[4]) * 255).toString(16).padStart(2, '0')
            : 'ff';
        return `#${r}${g}${b}${a}`;
    }

    /**
     * Width for the wa-popover --body-width, matched to the trigger field.
     * @returns {number}
     * @private
     */
    _getPopoverWidth() {
        return this.offsetWidth || 320;
    }

    // ============================================================================
    // COMPUTED TOKEN BUILDER METHODS
    // ============================================================================

    /**
     * Set UI mode (text entry vs builder)
     * @param {boolean} builderMode - True for builder, false for text
     * @private
     */
    _setMode(builderMode) {
        this._builderMode = builderMode;

        if (builderMode && this.value) {
            // Try to parse existing value into builder
            this._tryParseValueToBuilder(this.value);
        }
    }

    /**
     * Try to parse a value into builder fields
     * @param {string} value - Color value to parse
     * @private
     */
    _tryParseValueToBuilder(value) {
        if (!value || typeof value !== 'string') return;

        // Try to parse computed token
        const parsed = this._parseComputedToken(value);
        if (parsed) {
            this._selectedFunction = parsed.function;
            this._baseColor = parsed.baseColor;
            this._baseColor2 = parsed.baseColor2 || '';
            this._amount = parsed.amount;
        } else if (value.includes('var(') || value.startsWith('#') || value.startsWith('rgb')) {
            // If it's a plain color, set it as base color
            this._baseColor = value;
        }
    }

    /**
     * Parse computed token expression into builder components
     * @param {string} expression - Expression to parse
     * @returns {Object|null} Parsed components or null
     * @private
     */
    _parseComputedToken(expression) {
        if (!expression) return null;

        // Match: functionName(arg1, arg2) or functionName(arg1, arg2, arg3)
        const match = expression.match(/^(\w+)\((.+)\)$/);
        if (!match) return null;

        const [, funcName, argsStr] = match;

        // Split arguments (handle nested parentheses for var())
        const args = this._splitArguments(argsStr);

        // base() takes 1 arg; all other functions take 2+
        const minArgs = funcName === 'base' ? 1 : 2;
        if (!args || args.length < minArgs) return null;

        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix', 'base'];
        if (!validFunctions.includes(funcName)) return null;

        // Parse based on function type
        if (funcName === 'base') {
            // base() takes exactly one argument — no amount
            if (args.length !== 1) return null;
            return {
                function: funcName,
                baseColor: args[0].trim(),
                amount: 0
            };
        } else if (funcName === 'mix') {
            if (args.length !== 3) return null;
            return {
                function: funcName,
                baseColor: args[0].trim(),
                baseColor2: args[1].trim(),
                amount: Math.round(parseFloat(args[2]) * 100)
            };
        } else {
            if (args.length !== 2) return null;
            return {
                function: funcName,
                baseColor: args[0].trim(),
                amount: Math.round(parseFloat(args[1]) * 100)
            };
        }
    }

    /**
     * Split arguments handling nested parentheses
     * @param {string} argsStr - Arguments string
     * @returns {Array<string>} Array of arguments
     * @private
     */
    _splitArguments(argsStr) {
        const args = [];
        let current = '';
        let depth = 0;

        for (const char of argsStr) {
            if (char === '(') {
                depth++;
                current += char;
            } else if (char === ')') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                args.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current) {
            args.push(current.trim());
        }

        return args;
    }

    /**
     * Build expression from current builder state
     * @returns {string} Computed token expression
     * @private
     */
    _buildExpression() {
        if (!this._selectedFunction || !this._baseColor) {
            return '';
        }

        const amount = this._amount / 100; // Convert percentage to decimal

        if (this._selectedFunction === 'base') {
            // base() takes only the colour argument — no amount
            return `base(${this._baseColor})`;
        } else if (this._selectedFunction === 'mix') {
            if (!this._baseColor2) return '';
            return `${this._selectedFunction}(${this._baseColor}, ${this._baseColor2}, ${amount})`;
        } else {
            return `${this._selectedFunction}(${this._baseColor}, ${amount})`;
        }
    }

    /**
     * Validate computed token expression
     * @param {string} expression - Expression to validate
     * @returns {boolean} True if valid
     * @private
     */
    _validateExpression(expression) {
        if (!expression) return false;

        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix', 'base'];
        const regex = new RegExp(`^(${validFunctions.join('|')})\\(.+\\)$`);

        if (!regex.test(expression)) return false;

        // Try to parse
        const parsed = this._parseComputedToken(expression);
        return parsed !== null;
    }

    /**
     * Get context-appropriate label for amount slider
     * @returns {string} Label text
     * @private
     */
    _getAmountLabel() {
        switch (this._selectedFunction) {
            case 'lighten':
                return 'Lighten Amount';
            case 'darken':
                return 'Darken Amount';
            case 'alpha':
                return 'Opacity';
            case 'saturate':
                return 'Saturation Increase';
            case 'desaturate':
                return 'Saturation Decrease';
            case 'mix':
                return 'Mix Ratio';
            case 'base':
                return 'Amount'; // hidden for base(), but guard in case
            default:
                return 'Amount';
        }
    }

    /**
     * Handle function selection change
     * @param {CustomEvent} ev - value-changed event from ha-selector
     * @private
     */
    _onFunctionChange(ev) {
        ev.stopPropagation();
        const newValue = ev.detail.value;
        if (newValue && newValue !== this._selectedFunction) {
            this._selectedFunction = newValue;

            // Reset amount to sensible default for function
            if (this._selectedFunction === 'alpha') {
                this._amount = 50; // 50% opacity is common
            } else if (this._selectedFunction === 'mix') {
                this._amount = 50; // 50/50 mix
            } else if (this._selectedFunction === 'base') {
                this._amount = 0; // unused, but keep clean
            } else {
                this._amount = 20; // 20% adjustment
            }

            this.requestUpdate();
        }
    }

    /**
     * Handle amount slider change
     * @param {CustomEvent} ev - value-changed event from ha-selector
     * @private
     */
    _onAmountChange(ev) {
        ev.stopPropagation();
        const newValue = ev.detail.value;
        if (newValue !== undefined && Number(newValue) !== this._amount) {
            this._amount = Number(newValue);
            this.requestUpdate();
        }
    }

    /**
     * Apply generated expression to value
     * @private
     */
    _applyExpression() {
        const expression = this._buildExpression();
        if (expression && this._validateExpression(expression)) {
            this._emitChange(expression);
        }
    }

    /**
     * Copy expression to clipboard
     * @private
     */
    async _copyExpression() {
        const expression = this._buildExpression();
        if (!expression) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(expression);
            } else {
                // Fallback for HTTP / iframe contexts where clipboard API is unavailable
                const ta = document.createElement('textarea');
                ta.value = expression;
                ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            this._copySuccess = true;
            this.requestUpdate();
            setTimeout(() => {
                this._copySuccess = false;
                this.requestUpdate();
            }, 2000);
        } catch (err) {
            lcardsLog.debug('[ColorPicker] Failed to copy expression:', err);
        }
    }

    /**
     * Render before/after preview comparison
     * @returns {TemplateResult}
     * @private
     */
    _renderPreviewComparison() {
        if (!this._baseColor) return html``;

        const baseComputed = this._computeColor(this._baseColor);
        const expression = this._buildExpression();

        // For computed color, we need to resolve it
        // Since we can't actually run ThemeTokenResolver here, we'll show a placeholder
        const resultComputed = expression ? this._approximateComputedColor(expression) : '';

        if (!baseComputed) return html``;

        // See _renderPreview()'s comment on the same pattern — ColorUtils.contrastColor's canvas
        // parser can't see CSS custom properties, so any lingering unresolved var() needs a real
        // DOM-based resolve first or it silently reads as black (always-white text) regardless of
        // the swatch's true colour.
        const baseResolved = baseComputed.includes('var(') ? ColorUtils.resolveCssVariable(baseComputed, baseComputed) : baseComputed;
        const resultResolved = resultComputed && resultComputed.includes('var(') ? ColorUtils.resolveCssVariable(resultComputed, resultComputed) : resultComputed;

        return html`
            <div class="preview-comparison">
                <div class="preview-swatch" style="background-color: ${baseComputed}; color: ${this._getContrastColor(baseResolved)};">
                    <div class="preview-swatch-label">Before</div>
                    <div class="preview-swatch-value">${this._rgbToHex(baseResolved) || baseComputed}</div>
                </div>
                ${resultComputed ? html`
                    <div class="preview-swatch" style="background-color: ${resultComputed}; color: ${this._getContrastColor(resultResolved)};">
                        <div class="preview-swatch-label">After (Preview)</div>
                        <div class="preview-swatch-value">${this._rgbToHex(resultResolved) || resultComputed}</div>
                    </div>
                ` : html`
                    <div class="preview-swatch" style="background-color: var(--disabled-color, #ccc); color: black;">
                        <div class="preview-swatch-label">After</div>
                        <div class="preview-swatch-value">Configure function</div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Approximate computed color result for preview
     * Uses ColorUtils for accurate color computation
     * @param {string} expression - Computed token expression
     * @returns {string} Approximated RGB color
     * @private
     */
    _approximateComputedColor(expression) {
        const parsed = this._parseComputedToken(expression);
        if (!parsed) return '';

        // Resolve base color (handle CSS variables)
        const baseColor = this._computeColor(parsed.baseColor);
        if (!baseColor) return '';

        const amount = parsed.amount / 100;

        try {
            switch (parsed.function) {
                case 'lighten':
                    return ColorUtils.lighten(baseColor, amount);
                case 'darken':
                    return ColorUtils.darken(baseColor, amount);
                case 'alpha':
                    return ColorUtils.alpha(baseColor, amount);
                case 'saturate':
                    return ColorUtils.saturate(baseColor, amount);
                case 'desaturate':
                    return ColorUtils.desaturate(baseColor, amount);
                case 'mix': {
                    if (!parsed.baseColor2) return '';
                    const color2 = this._computeColor(parsed.baseColor2);
                    if (!color2) return '';
                    return ColorUtils.mix(baseColor, color2, amount);
                }
                case 'base': {
                    // Resolve via the ThemeTokenResolver baseline snapshot (same logic as ThemeTokenResolver._resolveComputedToken).
                    // Fall back to the live-DOM resolved colour if the snapshot isn’t available yet.
                    const resolver = window.lcards?.core?.themeManager?.resolver;
                    if (resolver) {
                        const resolved = resolver.resolve(`base(${parsed.baseColor})`, null);
                        if (resolved && resolved !== `base(${parsed.baseColor})`) return resolved;
                    }
                    // Fallback: materialise via live DOM (will be the mutated value, but better than nothing)
                    return baseColor;
                }
                default:
                    return '';
            }
        } catch (error) {
            console.warn('[ColorPicker] Failed to compute color:', error);
            return '';
        }
    }
}

// Static cache for CSS variables (shared across instances)
LCARdSColorPicker._variablesCache = null;

/**
 * Invalidate the shared CSS variable cache.
 * Call this after the palette changes (alert mode switch or theme override applied)
 * so that freshly-opened picker instances show the current swatch colours.
 */
LCARdSColorPicker.invalidateCache = function() {
  LCARdSColorPicker._variablesCache = null;
};

if (!customElements.get('lcards-color-picker')) customElements.define('lcards-color-picker', LCARdSColorPicker);
