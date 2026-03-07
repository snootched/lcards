/**
 * @fileoverview LCARdS YAML Editor with Schema Support
 *
 * CodeMirror 6-based YAML editor featuring:
 * - Schema-based autocomplete (property names, enum values)
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
import { autocompletion } from '@codemirror/autocomplete';
import { linter, lintGutter } from '@codemirror/lint';
import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { validateYaml, yamlToConfig } from '../../utils/yaml-utils.js';

export class LCARdSYamlEditor extends LitElement {

    static get properties() {
        return {
            value: { type: String },           // YAML string
            schema: { type: Object },          // JSON Schema for validation
            hass: { type: Object },            // HA instance for entity autocomplete
            readOnly: { type: Boolean },       // Read-only mode
            _isMaximized: { type: Boolean, state: true }, // Maximized state
            _showHelp: { type: Boolean, state: true },     // Help dialog visibility
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
                border-bottom: 1px solid var(--divider-color, #181a1f);
                gap: 4px;
            }

            ha-icon-button {
                --mdc-icon-button-size: 36px;
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

            .editor-container {
                flex: 1;
                border: 1px solid var(--divider-color, #e0e0e0);
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
                border: 1px solid #3e4451;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
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
                border-bottom: 1px solid #3e4451;
                color: #abb2bf;
            }

            .editor-container :global(.cm-textfield) {
                background: #282c34;
                border: 1px solid #3e4451;
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
                border: 1px solid #61afef;
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
                border-left: 1px solid rgba(92, 99, 112, 0.3);
                height: 100%;
            }

            .editor-container :global(.cm-indent-marker-active) {
                border-left: 1px solid rgba(97, 175, 239, 0.4);
            }

            /* Status footer */
            .status-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 12px;
                background: var(--card-background-color, #21252b);
                border-top: 1px solid var(--divider-color, #181a1f);
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
                border: 1px solid #3e4451;
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
                border-bottom: 1px solid #3e4451;
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
                border: 1px solid #4e545f;
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
                <div
                    class="editor-container"
                    id="editor-mount"
                    @keydown=${this._ignoreKeydown}>
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
        }
        if (changedProps.has('readOnly')) {
            this._updateReadOnly();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
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

            // Autocomplete
            autocompletion({
                override: [
                    this._schemaAutocomplete.bind(this),
                    this._entityAutocomplete.bind(this)
                ],
                activateOnTyping: true,
                maxRenderedOptions: 20
            }),

            // Schema-based linting (validation)
            this._schemaCompartment.of(
                this.schema ? linter(this._schemaLinter.bind(this), { delay: 300 }) : []
            ),
            lintGutter(),

            // Update handler
            EditorView.updateListener.of((update) => {
                if (update.docChanged && !this._updating) {
                    this._onEditorChange();
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
                this.schema ? linter(this._schemaLinter.bind(this), { delay: 300 }) : []
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

        this._changeDebounceTimer = setTimeout(() => {
            this.value = newValue; // Only update value when we're ready to notify parent
            this.dispatchEvent(new CustomEvent('value-changed', {
                detail: { value: newValue },
                bubbles: true,
                composed: true
            }));
        }, 1500); // Wait 1.5 seconds after last keystroke before notifying parent
    }    /**
     * Schema-based autocomplete provider
     * Suggests property names and enum values based on JSON Schema
     * @private
     */
    _schemaAutocomplete(context) {
        if (!this.schema) return null;

        const word = context.matchBefore(/\w*/);
        if (!word || (word.from === word.to && !context.explicit)) {
            return null;
        }

        // Get the current line to determine context
        const line = context.state.doc.lineAt(context.pos);
        const lineText = line.text;
        const beforeCursor = lineText.slice(0, context.pos - line.from);

        // Determine if we're at a property name position (start of line or after whitespace)
        const isPropertyPosition = /^\s*\w*$/.test(beforeCursor);

        if (isPropertyPosition) {
            // Determine the current path by analyzing indentation and previous lines
            const currentPath = this._getCurrentYamlPath(context);
            const currentSchema = this._getSchemaAtPath(this.schema, currentPath);

            if (currentSchema?.properties) {
                // Suggest property names with enhanced details
                const options = Object.keys(currentSchema.properties).map(key => {
                    const prop = currentSchema.properties[key];

                    // Build detail string from schema metadata
                    let detail = '';
                    if (prop.default !== undefined) {
                        detail = `default: ${JSON.stringify(prop.default)}`;
                    } else if (prop.type) {
                        detail = prop.type;
                    }

                    // Add pattern hint if available
                    if (prop.pattern) {
                        detail += ' (pattern)';
                    }

                    // Add range hint for numbers
                    if (prop.type === 'number' && (prop.minimum !== undefined || prop.maximum !== undefined)) {
                        const min = prop.minimum !== undefined ? prop.minimum : '?';
                        const max = prop.maximum !== undefined ? prop.maximum : '?';
                        detail += ` (${min}-${max})`;
                    }

                    return {
                        label: key,
                        type: 'property',
                        detail: detail || prop.description || '',
                        info: prop.description || '',
                        boost: prop.required ? 10 : 0
                    };
                });

                return {
                    from: word.from,
                    options,
                    validFor: /^\w*$/
                };
            }

            // Check for additionalProperties (for dynamic keys like text.label1, text.label2)
            if (currentSchema?.additionalProperties && typeof currentSchema.additionalProperties === 'object') {
                const additionalProps = currentSchema.additionalProperties.properties;
                if (additionalProps) {
                    const options = Object.keys(additionalProps).map(key => {
                        const prop = additionalProps[key];
                        let detail = prop.type || '';
                        if (prop.default !== undefined) {
                            detail = `default: ${JSON.stringify(prop.default)}`;
                        }
                        return {
                            label: key,
                            type: 'property',
                            detail: detail || prop.description || '',
                            info: prop.description || ''
                        };
                    });
                    return {
                        from: word.from,
                        options,
                        validFor: /^\w*$/
                    };
                }
            }
        }

        // Check if we're at a value position for an enum property
        const propertyMatch = beforeCursor.match(/(\w+):\s*\w*$/);
        if (propertyMatch) {
            const propertyName = propertyMatch[1];
            const currentPath = this._getCurrentYamlPath(context);
            const currentSchema = this._getSchemaAtPath(this.schema, currentPath);
            const propSchema = currentSchema?.properties?.[propertyName];

            if (propSchema?.enum) {
                const options = propSchema.enum.map((val, index) => {
                    // Use enumDescriptions if available
                    const description = propSchema.enumDescriptions?.[index] || '';

                    return {
                        label: String(val),
                        type: 'enum',
                        detail: description || 'enum value',
                        info: description
                    };
                });

                return {
                    from: word.from,
                    options,
                    validFor: /^\w*$/
                };
            }

            // Check for examples in the schema
            if (propSchema?.examples && Array.isArray(propSchema.examples)) {
                const options = propSchema.examples.map(example => ({
                    label: typeof example === 'string' ? example : JSON.stringify(example),
                    type: 'example',
                    detail: 'example value',
                    apply: typeof example === 'string' ? example : JSON.stringify(example, null, 2)
                }));

                if (options.length > 0) {
                    return {
                        from: word.from,
                        options,
                        validFor: /^[\w.:]*$/
                    };
                }
            }
        }

        return null;
    }

    /**
     * Get the current YAML path based on indentation
     * @private
     */
    _getCurrentYamlPath(context) {
        const doc = context.state.doc;
        const currentLine = doc.lineAt(context.pos);
        const currentIndent = currentLine.text.match(/^\s*/)[0].length;

        const path = [];

        // Walk backwards through lines to build the path
        for (let lineNum = currentLine.number - 1; lineNum >= 1; lineNum--) {
            const line = doc.line(lineNum);
            const lineIndent = line.text.match(/^\s*/)[0].length;

            // Skip empty lines and comments
            if (!line.text.trim() || line.text.trim().startsWith('#')) {
                continue;
            }

            // If this line is less indented, it's a parent key
            if (lineIndent < currentIndent) {
                const match = line.text.match(/^\s*(\w+):/);
                if (match) {
                    path.unshift(match[1]);
                    // Update current indent to continue looking for parents
                    if (lineIndent === 0) break; // Reached top level
                    const currentIndentToFind = lineIndent;
                    // Continue looking for parents of this line
                    for (let parentNum = lineNum - 1; parentNum >= 1; parentNum--) {
                        const parentLine = doc.line(parentNum);
                        const parentIndent = parentLine.text.match(/^\s*/)[0].length;
                        if (!parentLine.text.trim() || parentLine.text.trim().startsWith('#')) {
                            continue;
                        }
                        if (parentIndent < currentIndentToFind) {
                            const parentMatch = parentLine.text.match(/^\s*(\w+):/);
                            if (parentMatch) {
                                path.unshift(parentMatch[1]);
                                if (parentIndent === 0) break;
                            }
                        }
                    }
                    break;
                }
            }
        }

        return path;
    }

    /**
     * Get schema at a specific path
     * @private
     */
    _getSchemaAtPath(schema, path) {
        let current = schema;

        for (const key of path) {
            if (!current) return null;

            // Check regular properties
            if (current.properties?.[key]) {
                current = current.properties[key];
            }
            // Check additionalProperties for dynamic keys
            else if (current.additionalProperties && typeof current.additionalProperties === 'object') {
                current = current.additionalProperties;
            }
            // Check items for arrays
            else if (current.items) {
                current = current.items;
            }
            else {
                return null;
            }
        }

        return current;
    }

    /**
     * Entity autocomplete provider
     * Suggests Home Assistant entities
     * @private
     */
    _entityAutocomplete(context) {
        if (!this.hass?.states) return null;

        const word = context.matchBefore(/[\w.:]*/);
        if (!word || word.from === word.to) {
            return null;
        }

        // Only trigger for entity-like patterns
        const text = word.text;
        if (!text.includes('.') && text.length < 3) {
            return null;
        }

        const entities = Object.keys(this.hass.states);
        const options = entities
            .filter(entity => entity.toLowerCase().includes(text.toLowerCase()))
            .slice(0, 50)
            .map(entity => ({
                label: entity,
                type: 'entity',
                detail: this.hass.states[entity].attributes.friendly_name || '',
                boost: entity.startsWith(text) ? 10 : 0
            }));

        if (options.length === 0) return null;

        return {
            from: word.from,
            options,
            validFor: /^[\w.:]*$/
        };
    }

    /**
     * Schema-based linter (validation)
     * Shows inline errors for YAML syntax and schema violations
     * @private
     */
    _schemaLinter(view) {
        const diagnostics = [];
        const yamlText = view.state.doc.toString();

        lcardsLog.debug('[LCARdSYamlEditor] Linter running. Schema available:', !!this.schema);

        // 1. Validate YAML syntax
        const yamlValidation = validateYaml(yamlText);
        if (!yamlValidation.valid) {
            const lineNum = yamlValidation.lineNumber || 1;
            const line = view.state.doc.line(Math.min(lineNum, view.state.doc.lines));

            diagnostics.push({
                from: line.from,
                to: line.to,
                severity: 'error',
                message: `YAML Syntax Error: ${yamlValidation.error}`
            });

            lcardsLog.debug('[LCARdSYamlEditor] YAML syntax error detected');
            return diagnostics;
        }

        // 2. Validate against schema if available
        if (this.schema) {
            try {
                const config = yamlToConfig(yamlText);
                lcardsLog.debug('[LCARdSYamlEditor] Parsed config for validation:', config);

                const errors = this._validateAgainstSchema(config, this.schema);
                lcardsLog.debug('[LCARdSYamlEditor] Schema validation errors:', errors);

                errors.forEach(error => {
                    // Try to find the line with the problematic field
                    const searchPattern = new RegExp(`^\\s*${error.field}:`, 'm');
                    const match = yamlText.match(searchPattern);

                    let from = 0;
                    let to = yamlText.length;

                    if (match) {
                        from = match.index;
                        const lineEnd = yamlText.indexOf('\n', from);
                        to = lineEnd > -1 ? lineEnd : yamlText.length;
                    }

                    diagnostics.push({
                        from,
                        to,
                        severity: 'error',
                        message: error.message
                    });
                });
            } catch (err) {
                lcardsLog.warn('[LCARdSYamlEditor] Error during schema validation:', err);
            }
        } else {
            lcardsLog.debug('[LCARdSYamlEditor] No schema available for validation');
        }

        return diagnostics;
    }

    /**
     * Simple schema validator
     * @private
     */
    _validateAgainstSchema(config, schema) {
        const errors = [];

        if (!schema.properties) return errors;

        // Check for unknown properties not in schema
        Object.keys(config).forEach(key => {
            if (!schema.properties[key]) {
                errors.push({
                    field: key,
                    message: `Unknown property '${key}' is not defined in the schema`
                });
            }
        });

        // Check required properties
        if (schema.required) {
            schema.required.forEach(field => {
                if (config[field] === undefined) {
                    errors.push({
                        field,
                        message: `Required property '${field}' is missing`
                    });
                }
            });
        }

        // Check property types and enums
        Object.keys(config).forEach(key => {
            const propSchema = schema.properties[key];
            if (!propSchema) return; // Already reported as unknown

            const value = config[key];

            // Type checking
            if (propSchema.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== propSchema.type && value !== null) {
                    errors.push({
                        field: key,
                        message: `Property '${key}' should be ${propSchema.type}, got ${actualType}`
                    });
                }
            }

            // Enum checking
            if (propSchema.enum && !propSchema.enum.includes(value)) {
                const enumList = propSchema.enum.join(', ');
                errors.push({
                    field: key,
                    message: `Property '${key}' must be one of: ${enumList}`
                });
            }

            // Pattern validation for strings
            if (propSchema.pattern && typeof value === 'string') {
                const pattern = new RegExp(propSchema.pattern);
                if (!pattern.test(value)) {
                    let message = `Property '${key}' does not match required pattern`;
                    // Add helpful hints for common patterns
                    if (propSchema.format === 'entity') {
                        message += ' (expected format: domain.object_id, e.g., light.living_room)';
                    } else if (key === 'icon') {
                        message += ' (expected format: mdi:icon-name or si:icon-name)';
                    } else if (propSchema.examples && propSchema.examples.length > 0) {
                        message += ` (e.g., ${propSchema.examples[0]})`;
                    }
                    errors.push({
                        field: key,
                        message
                    });
                }
            }

            // Range validation for numbers
            if (propSchema.type === 'number' && typeof value === 'number') {
                if (propSchema.minimum !== undefined && value < propSchema.minimum) {
                    errors.push({
                        field: key,
                        message: `Property '${key}' must be at least ${propSchema.minimum} (got ${value})`
                    });
                }
                if (propSchema.maximum !== undefined && value > propSchema.maximum) {
                    errors.push({
                        field: key,
                        message: `Property '${key}' must be at most ${propSchema.maximum} (got ${value})`
                    });
                }
            }
        });

        return errors;
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

customElements.define('lcards-yaml-editor', LCARdSYamlEditor);
