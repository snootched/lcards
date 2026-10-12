/**
 * @fileoverview LCARdS YAML Editor with Schema Support
 *
 * CodeMirror 6-based YAML editor featuring:
 * - Schema-based autocomplete (keys for the mapping at the cursor, including
 *   list items and oneOf branches; enum values; entities) and key hover help,
 *   shared with the docs playgrounds via yaml-schema-assist.js
 * - "Options here" panel: what can go at the cursor, with Insert and docs links
 * - Inline validation with error squiggles
 * - YAML syntax highlighting
 * - Entity and icon autocomplete
 * - Dark theme matching Home Assistant
 * - Lightweight (~500KB vs Monaco's 12MB)
 *
 * @fires value-changed - Fired when editor content changes
 *
 * @example
 * <lcards-yaml-editor
 *   .value=${yamlString}
 *   .schema=${cardSchema}
 *   .hass=${this.hass}
 *   @value-changed=${this._handleYamlChange}>
 * </lcards-yaml-editor>
 */

import { LitElement, html, css } from 'lit';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, placeholder, highlightTrailingWhitespace } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { yaml } from '@codemirror/lang-yaml';
import { linter, lintGutter } from '@codemirror/lint';
import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import jsYaml from 'js-yaml';
import { yamlSchemaAssist, schemaLintSource, insertLines, setLineValue } from './yaml-schema-assist.js';
import { panelAt, insertLinesFor, quoteIfNeeded } from '../../utils/yaml-options-model.js';
import { lenientParse } from '../../utils/yaml-schema-path.js';
import './lcards-yaml-options-panel.js';

const OPTIONS_PANEL_KEY = 'lcards-yaml-options-panel';

export class LCARdSYamlEditor extends LitElement {

    static get properties() {
        return {
            value: { type: String },           // YAML string
            schema: { type: Object },          // JSON Schema for validation
            cardType: { type: String },        // e.g. 'chart', for docs links in the options panel
            hass: { type: Object },            // HA instance for entity autocomplete
            readOnly: { type: Boolean },       // Read-only mode
            _isMaximized: { type: Boolean, state: true }, // Maximized state
            _showHelp: { type: Boolean, state: true },     // Help dialog visibility
            _showOptions: { type: Boolean, state: true },  // "Options here" panel visibility
            _panel: { type: Object, state: true },         // Options panel content
        };
    }

    constructor() {
        super();
        this.value = '';
        this.schema = null;
        this.hass = null;
        this.readOnly = false;
        this._editorView = null;
        this._updating = false;
        this._schemaCompartment = new Compartment();
        this._editableCompartment = new Compartment();
        this._isMaximized = false;
        this._showHelp = false;
        this._changeDebounceTimer = null;
        this.cardType = '';
        this._panel = null;
        this._panelTimer = null;
        this._showOptions = true;
        try {
            this._showOptions = localStorage.getItem(OPTIONS_PANEL_KEY) !== '0';
        } catch { /* storage blocked: keep default */ }
    }

    static get styles() {
        return css`
            :host {
                display: block;
                position: relative;
            }

            :host([maximized]) {
                position: fixed;
                top: var(--header-height, 0);
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                background: #282c34;
                margin: 0;
                padding: 8px;
            }

            .editor-wrapper {
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .toolbar {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                padding: 4px 8px;
                background: var(--card-background-color, #21252b);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #181a1f);
                gap: 4px;
            }

            ha-icon-button {
                --ha-icon-button-size: 36px;
                --mdc-icon-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            ha-icon-button ha-icon {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .editor-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                min-height: 0;
            }

            :host([maximized]) .editor-body {
                flex-direction: row;
            }

            :host([maximized]) lcards-yaml-options-panel {
                width: 380px;
                flex: none;
                overflow: auto;
            }

            ha-icon-button.active {
                color: #61afef;
            }

            .editor-container {
                flex: 1;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                overflow: hidden;
                min-height: 400px;
                max-height: 600px;
                background: #282c34;
                position: relative;
            }

            :host([maximized]) .editor-container {
                border: none;
                border-radius: 0;
                min-height: 0;
                max-height: none;
                height: 100%;
            }

            /* CodeMirror styling overrides */
            .editor-container :global(.cm-editor) {
                height: 100%;
                min-height: 400px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 14px;
            }

            :host([maximized]) .editor-container :global(.cm-editor) {
                min-height: 0;
            }

            .editor-container :global(.cm-scroller) {
                overflow: auto !important;
                scrollbar-width: thin;
                scrollbar-color: #5c6370 #282c34;
            }

            /* Webkit scrollbar styling */
            .editor-container :global(.cm-scroller::-webkit-scrollbar) {
                width: 10px;
                height: 10px;
            }

            .editor-container :global(.cm-scroller::-webkit-scrollbar-track) {
                background: #282c34;
            }

            .editor-container :global(.cm-scroller::-webkit-scrollbar-thumb) {
                background: #5c6370;
                border-radius: 5px;
            }

            .editor-container :global(.cm-scroller::-webkit-scrollbar-thumb:hover) {
                background: #6c7380;
            }

            .editor-container :global(.cm-focused) {
                outline: none !important;
            }

            /* Line numbers */
            .editor-container :global(.cm-lineNumbers) {
                color: #5c6370;
                padding-right: 8px;
            }

            /* Autocomplete popup */
            .editor-container :global(.cm-tooltip-autocomplete) {
                background: #282c34;
                border: var(--ha-border-width-sm) solid #3e4451;
                border-radius: 4px;
                box-shadow: var(--ha-box-shadow-m);
            }

            .editor-container :global(.cm-completionLabel) {
                color: #abb2bf;
            }

            .editor-container :global(.cm-completionDetail) {
                color: #5c6370;
                font-style: italic;
            }

            /* Linter/validation styling */
            .editor-container :global(.cm-diagnostic-error) {
                border-bottom: 2px wavy #e06c75;
            }

            .editor-container :global(.cm-diagnostic-warning) {
                border-bottom: 2px wavy #e5c07b;
            }

            .editor-container :global(.cm-lintRange-error) {
                background-color: rgba(224, 108, 117, 0.2);
            }

            /* Search panel */
            .editor-container :global(.cm-panel) {
                background: #21252b;
                border-bottom: var(--ha-border-width-sm) solid #3e4451;
                color: #abb2bf;
            }

            .editor-container :global(.cm-textfield) {
                background: #282c34;
                border: var(--ha-border-width-sm) solid #3e4451;
                color: #abb2bf;
                padding: 4px 8px;
                border-radius: 3px;
            }

            .editor-container :global(.cm-button) {
                background: #3e4451;
                border: none;
                color: #abb2bf;
                padding: 4px 12px;
                border-radius: 3px;
                cursor: pointer;
            }

            .editor-container :global(.cm-button:hover) {
                background: #4e545f;
            }

            /* Bracket matching */
            .editor-container :global(.cm-matchingBracket) {
                background-color: rgba(97, 175, 239, 0.3);
                border: var(--ha-border-width-sm) solid #61afef;
            }

            /* Selection match highlighting */
            .editor-container :global(.cm-selectionMatch) {
                background-color: rgba(152, 195, 121, 0.2);
            }

            /* Trailing whitespace */
            .editor-container :global(.cm-trailingWhitespace) {
                background-color: rgba(224, 108, 117, 0.3);
            }

            /* Fold markers */
            .editor-container :global(.cm-foldGutter) {
                color: #5c6370;
                padding-left: 4px;
            }

            /* Indentation markers */
            .editor-container :global(.cm-indent-markers) {
                position: absolute;
                left: 0;
                right: 0;
                pointer-events: none;
            }

            .editor-container :global(.cm-indent-marker) {
                border-left: var(--ha-border-width-sm) solid rgba(92, 99, 112, 0.3);
                height: 100%;
            }

            .editor-container :global(.cm-indent-marker-active) {
                border-left: var(--ha-border-width-sm) solid rgba(97, 175, 239, 0.4);
            }

            /* Status footer */
            .status-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 12px;
                background: var(--card-background-color, #21252b);
                border-top: var(--ha-border-width-sm) solid var(--divider-color, #181a1f);
                font-size: 12px;
                color: #5c6370;
                gap: 16px;
            }

            .status-left {
                display: flex;
                gap: 16px;
                align-items: center;
            }

            .status-right {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .status-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .status-item ha-icon {
                --mdc-icon-size: 14px;
            }

            .hint {
                color: #98c379;
            }

            /* Help dialog */
            .help-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #282c34;
                border: var(--ha-border-width-sm) solid #3e4451;
                border-radius: 8px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.6);
                z-index: 10000;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow: auto;
                color: #abb2bf;
            }

            .help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: var(--ha-border-width-sm) solid #3e4451;
                background: #21252b;
                border-radius: 8px 8px 0 0;
            }

            .help-title {
                font-size: 18px;
                font-weight: 600;
                color: #61afef;
            }

            .help-content {
                padding: 20px;
            }

            .help-section {
                margin-bottom: 24px;
            }

            .help-section:last-child {
                margin-bottom: 0;
            }

            .help-section-title {
                font-size: 14px;
                font-weight: 600;
                color: #e5c07b;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .help-section-title ha-icon {
                --mdc-icon-size: 18px;
            }

            .shortcut-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #21252b;
                border-radius: 4px;
            }

            .shortcut-desc {
                color: #abb2bf;
            }

            .shortcut-keys {
                display: flex;
                gap: 4px;
            }

            .key {
                padding: 4px 8px;
                background: #3e4451;
                border: var(--ha-border-width-sm) solid #4e545f;
                border-radius: 4px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 11px;
                color: #98c379;
                min-width: 24px;
                text-align: center;
            }

            .help-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
            }
        `;
    }

    render() {
        return html`
            <div class="editor-wrapper">
                <div class="toolbar">
                    ${this.schema ? html`
                        <ha-icon-button
                            class=${this._showOptions ? 'active' : ''}
                            .label=${this._showOptions ? 'Hide options panel' : 'Show options panel'}
                            @click=${this._toggleOptions}>
                            <ha-icon icon="mdi:format-list-bulleted-square"></ha-icon>
                        </ha-icon-button>
                    ` : ''}
                    <ha-icon-button
                        .label=${'Keyboard shortcuts'}
                        @click=${this._toggleHelp}>
                        <ha-icon icon="mdi:keyboard"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        .label=${this._isMaximized ? 'Exit maximize' : 'Maximize editor'}
                        @click=${this._toggleMaximize}>
                        <ha-icon .icon=${this._isMaximized ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'}></ha-icon>
                    </ha-icon-button>
                </div>
                <div class="editor-body">
                    <div
                        class="editor-container"
                        id="editor-mount"
                        @keydown=${this._ignoreKeydown}>
                    </div>
                    ${this.schema && this._showOptions ? html`
                        <lcards-yaml-options-panel
                            ?fill=${this._isMaximized}
                            .panel=${this._panel}
                            @option-insert=${this._onOptionInsert}
                            @value-pick=${this._onValuePick}>
                        </lcards-yaml-options-panel>
                    ` : ''}
                </div>
                <div class="status-footer">
                    <div class="status-left">
                        <div class="status-item hint">
                            <ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>
                            <span>Ctrl+Space for autocomplete</span>
                        </div>
                        <div class="status-item hint">
                            <ha-icon icon="mdi:magnify"></ha-icon>
                            <span>Ctrl+F to search</span>
                        </div>
                    </div>
                    <div class="status-right">
                        <div class="status-item">
                            <ha-icon icon="mdi:keyboard"></ha-icon>
                            <span style="cursor: pointer; color: #61afef;" @click=${this._toggleHelp}>Show all shortcuts</span>
                        </div>
                    </div>
                </div>
            </div>
            ${this._showHelp ? this._renderHelpDialog() : ''}
        `;
    }

    /**
     * Render help dialog with keyboard shortcuts
     * @private
     */
    _renderHelpDialog() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const mod = isMac ? 'Cmd' : 'Ctrl';

        return html`
            <div class="help-overlay" @click=${this._toggleHelp}></div>
            <div class="help-dialog" @click=${(e) => e.stopPropagation()}>
                <div class="help-header">
                    <div class="help-title">Keyboard Shortcuts</div>
                    <ha-icon-button
                        .label=${'Close'}
                        @click=${this._toggleHelp}>
                        <ha-icon icon="mdi:close"></ha-icon>
                    </ha-icon-button>
                </div>
                <div class="help-content">
                    <div class="help-section">
                        <div class="help-section-title">
                            <ha-icon icon="mdi:pencil"></ha-icon>
                            Editing
                        </div>
                        <div class="shortcut-list">
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Undo</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Z</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Redo</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Shift</span>
                                    <span class="key">Z</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Indent line/selection</span>
                                <div class="shortcut-keys">
                                    <span class="key">Tab</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Dedent line/selection</span>
                                <div class="shortcut-keys">
                                    <span class="key">Shift</span>
                                    <span class="key">Tab</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Delete line</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Shift</span>
                                    <span class="key">K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <div class="help-section-title">
                            <ha-icon icon="mdi:code-braces"></ha-icon>
                            Autocomplete & Navigation
                        </div>
                        <div class="shortcut-list">
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Trigger autocomplete</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Space</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Close autocomplete popup</span>
                                <div class="shortcut-keys">
                                    <span class="key">Esc</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Fold/unfold section</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Shift</span>
                                    <span class="key">[</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Fold all sections</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Alt</span>
                                    <span class="key">[</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Unfold all sections</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Alt</span>
                                    <span class="key">]</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <div class="help-section-title">
                            <ha-icon icon="mdi:magnify"></ha-icon>
                            Search & Replace
                        </div>
                        <div class="shortcut-list">
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Find</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">F</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Find next</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">G</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Find previous</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Shift</span>
                                    <span class="key">G</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Replace</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">H</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Select all matches</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Alt</span>
                                    <span class="key">G</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <div class="help-section-title">
                            <ha-icon icon="mdi:cursor-default"></ha-icon>
                            Selection
                        </div>
                        <div class="shortcut-list">
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Select line</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">L</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Select all</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">A</span>
                                </div>
                            </div>
                            <div class="shortcut-item">
                                <span class="shortcut-desc">Add cursor above/below</span>
                                <div class="shortcut-keys">
                                    <span class="key">${mod}</span>
                                    <span class="key">Alt</span>
                                    <span class="key">↑/↓</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <div class="help-section-title">
                            <ha-icon icon="mdi:lightbulb-on"></ha-icon>
                            Tips
                        </div>
                        <div class="shortcut-list">
                            <div class="shortcut-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                                <span class="shortcut-desc" style="color: #98c379;">• Schema autocomplete suggests valid properties and values</span>
                                <span class="shortcut-desc" style="color: #98c379;">• Entity IDs autocomplete from your Home Assistant instance</span>
                                <span class="shortcut-desc" style="color: #98c379;">• Red underlines show validation errors - hover for details</span>
                                <span class="shortcut-desc" style="color: #98c379;">• Indentation guides help align YAML structure</span>
                                <span class="shortcut-desc" style="color: #e06c75;">• Pink highlights indicate trailing whitespace (YAML sensitive!)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle help dialog visibility
     * @private
     */
    _toggleHelp() {
        this._showHelp = !this._showHelp;
    }

    /**
     * Prevent keydown events from bubbling to parent (prevents dialog close on Enter)
     * Follows Home Assistant pattern from hui-dialog-edit-card.ts
     * @private
     */
    _ignoreKeydown(ev) {
        ev.stopPropagation();
    }

    firstUpdated() {
        this._initializeEditor();

        // Debug: Log schema connection
        lcardsLog.debug('[LCARdSYamlEditor] Schema connected:', !!this.schema);
        if (this.schema) {
            lcardsLog.debug('[LCARdSYamlEditor] Schema properties:', Object.keys(this.schema.properties || {}));
            lcardsLog.debug('[LCARdSYamlEditor] Schema required:', this.schema.required);
        }
    }

    updated(changedProps) {
        // Recreate editor if it was destroyed (e.g., after tab switch)
        if (!this._editorView) {
            this._initializeEditor();
        }

        if (!this._editorView) return; // Guard: editor not initialized yet

        if (changedProps.has('value') && !this._updating) {
            this._updateEditorValue();
        }
        if (changedProps.has('schema')) {
            this._updateSchema();
            this._updatePanel();
        }
        if (changedProps.has('readOnly')) {
            this._updateReadOnly();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this._panelTimer);
        if (this._editorView) {
            this._editorView.destroy();
            this._editorView = null;
        }
    }

    /**
     * Initialize CodeMirror editor
     * @private
     */
    _initializeEditor() {
        const container = this.shadowRoot.getElementById('editor-mount');
        if (!container) return;

        const extensions = [
            // Basic editor features
            lineNumbers(),
            highlightActiveLineGutter(),
            history(),

            // YAML language support
            yaml(),

            // Placeholder text when empty
            placeholder('# Start typing your YAML configuration...\n# Press Ctrl+Space for autocomplete suggestions'),

            // Code folding
            foldGutter(),

            // Bracket matching
            bracketMatching(),

            // Search/Replace panel
            search(),

            // Highlight selection matches
            highlightSelectionMatches(),

            // Indentation guides (critical for YAML!)
            indentationMarkers({
                colors: {
                    light: 'rgba(92, 99, 112, 0.3)',
                    dark: 'rgba(92, 99, 112, 0.3)',
                    activeLight: 'rgba(97, 175, 239, 0.4)',
                    activeDark: 'rgba(97, 175, 239, 0.4)'
                }
            }),

            // Highlight trailing whitespace (YAML is picky!)
            highlightTrailingWhitespace(),

            // Keymaps
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...searchKeymap,
                ...foldKeymap,
                indentWithTab
            ]),

            // VSCode Dark theme
            vsCodeDark,

            // Editor height and scrolling
            EditorView.theme({
                "&": {
                    height: "100%",
                    maxHeight: "600px"
                },
                ".cm-scroller": {
                    overflow: "auto",
                    maxHeight: "600px"
                }
            }),

            // Autocomplete + hover help from the schema
            yamlSchemaAssist({
                getSchema: () => this.schema,
                getEntities: () => Object.entries(this.hass?.states || {})
                    .map(([id, st]) => ({ id, name: st?.attributes?.friendly_name || '' }))
            }),

            // Schema-based linting (validation)
            this._schemaCompartment.of(
                this.schema ? linter(schemaLintSource(() => this.schema), { delay: 300 }) : []
            ),
            lintGutter(),

            // Update handler
            EditorView.updateListener.of((update) => {
                if (update.docChanged && !this._updating) {
                    this._onEditorChange();
                }
                if (update.docChanged || update.selectionSet) {
                    this._schedulePanel();
                }
            }),

            // Read-only mode (use Compartment for dynamic updates)
            this._editableCompartment.of(EditorView.editable.of(!this.readOnly)),
        ];

        const state = EditorState.create({
            doc: this.value || '',
            extensions
        });

        this._editorView = new EditorView({
            state,
            parent: container
        });

        this._updatePanel();
        lcardsLog.debug('[LCARdSYamlEditor] Editor initialized');
    }

    /**
     * Update editor value from prop
     * @private
     */
    _updateEditorValue() {
        if (!this._editorView) return;

        const currentValue = this._editorView.state.doc.toString();
        if (currentValue !== this.value) {
            this._updating = true;
            this._editorView.dispatch({
                changes: {
                    from: 0,
                    to: currentValue.length,
                    insert: this.value || ''
                }
            });
            this._updating = false;
        }
    }

    /**
     * Update schema and reconfigure linter
     * @private
     */
    _updateSchema() {
        if (!this._editorView) return;

        this._editorView.dispatch({
            effects: this._schemaCompartment.reconfigure(
                this.schema ? linter(schemaLintSource(() => this.schema), { delay: 300 }) : []
            )
        });

        lcardsLog.debug('[LCARdSYamlEditor] Schema updated. Has schema:', !!this.schema);
    }

    /**
     * Update read-only state
     * @private
     */
    _updateReadOnly() {
        if (!this._editorView) return;

        this._editorView.dispatch({
            effects: this._editableCompartment.reconfigure(
                EditorView.editable.of(!this.readOnly)
            )
        });

        lcardsLog.debug('[LCARdSYamlEditor] Read-only state updated:', this.readOnly);
    }

    /**
     * Handle editor content changes
     * @private
     */
    _onEditorChange() {
        const newValue = this._editorView.state.doc.toString();

        // Debounce the value-changed event to prevent mid-typing updates
        if (this._changeDebounceTimer) {
            clearTimeout(this._changeDebounceTimer);
        }

        this._changeDebounceTimer = setTimeout(() => this._emitChange(), 1500); // Wait 1.5 seconds after last keystroke before notifying parent
    }

    /** @private */
    _emitChange() {
        this._changeDebounceTimer = null;
        const newValue = this._editorView?.state.doc.toString() ?? this.value;
        this.value = newValue; // Only update value when we're ready to notify parent
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Fire a change that is still waiting for the typing pause, now. Call it
     * before reading the value to save, or the last 1.5 s of typing is lost.
     */
    flush() {
        if (!this._changeDebounceTimer) return;
        clearTimeout(this._changeDebounceTimer);
        this._emitChange();
    }

    /**
     * Recompute the options panel shortly after the cursor or text changes.
     * @private
     */
    _schedulePanel() {
        if (!this._showOptions || !this.schema) return;
        clearTimeout(this._panelTimer);
        this._panelTimer = setTimeout(() => this._updatePanel(), 100);
    }

    /** @private */
    _updatePanel() {
        if (!this._editorView || !this.schema) return;
        const text = this._editorView.state.doc.toString();
        const head = this._editorView.state.selection.main.head;
        this._panel = panelAt(this.schema, text, head, (t) => jsYaml.load(t), this.cardType);
    }

    /** @private */
    _toggleOptions() {
        this._showOptions = !this._showOptions;
        try {
            localStorage.setItem(OPTIONS_PANEL_KEY, this._showOptions ? '1' : '0');
        } catch { /* storage blocked: session-only */ }
        if (this._showOptions) this._updatePanel();
    }

    /** @private */
    _onOptionInsert(e) {
        if (!this._editorView || !this._panel) return;
        const text = this._editorView.state.doc.toString();
        const config = lenientParse(text, this._editorView.state.selection.main.head, (t) => jsYaml.load(t));
        insertLines(this._editorView, insertLinesFor(e.detail.option, this._panel, this.schema, config), this._panel.indent);
    }

    /** @private */
    _onValuePick(e) {
        if (this._editorView) setLineValue(this._editorView, quoteIfNeeded(e.detail.value));
    }

    /**
     * Get editor content
     * @returns {string}
     */
    getValue() {
        return this._editorView ? this._editorView.state.doc.toString() : this.value;
    }

    /**
     * Set editor content
     * @param {string} value
     */
    setValue(value) {
        this.value = value;
        this._updateEditorValue();
    }

    /**
     * Focus the editor
     */
    focus() {
        if (this._editorView) {
            this._editorView.focus();
        }
    }

    /**
     * Toggle fullscreen mode
     * @private
     */
    _toggleMaximize() {
        this._isMaximized = !this._isMaximized;

        if (this._isMaximized) {
            this.setAttribute('maximized', '');
        } else {
            this.removeAttribute('maximized');
        }

        // Refresh CodeMirror layout after transition
        requestAnimationFrame(() => {
            if (this._editorView) {
                this._editorView.requestMeasure();
            }
        });
    }
}

if (!customElements.get('lcards-yaml-editor')) customElements.define('lcards-yaml-editor', LCARdSYamlEditor);
