/**
 * LCARdS YAML Editor with Schema Support
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
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { yaml } from '@codemirror/lang-yaml';
import { autocompletion } from '@codemirror/autocomplete';
import { linter, lintGutter } from '@codemirror/lint';
import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark';
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
            }

            .editor-container {
                flex: 1;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                overflow: hidden;
                min-height: 400px;
                background: #282c34;
            }

            :host([maximized]) .editor-container {
                border: none;
                border-radius: 0;
                min-height: 0;
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
                overflow: auto;
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
        `;
    }

    render() {
        return html`
            <div class="editor-wrapper">
                <div class="toolbar">
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
            </div>
        `;
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

            // Keymaps
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                indentWithTab
            ]),

            // VSCode Dark theme
            vsCodeDark,

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

        if (isPropertyPosition && this.schema.properties) {
            // Suggest property names
            const options = Object.keys(this.schema.properties).map(key => {
                const prop = this.schema.properties[key];
                return {
                    label: key,
                    type: 'property',
                    detail: prop.description || prop.type || '',
                    boost: prop.required ? 10 : 0
                };
            });

            return {
                from: word.from,
                options,
                validFor: /^\w*$/
            };
        }

        // Check if we're at a value position for an enum property
        const propertyMatch = beforeCursor.match(/(\w+):\s*\w*$/);
        if (propertyMatch) {
            const propertyName = propertyMatch[1];
            const propSchema = this.schema.properties?.[propertyName];

            if (propSchema?.enum) {
                const options = propSchema.enum.map(val => ({
                    label: String(val),
                    type: 'enum',
                    detail: 'enum value'
                }));

                return {
                    from: word.from,
                    options,
                    validFor: /^\w*$/
                };
            }
        }

        return null;
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
                errors.push({
                    field: key,
                    message: `Property '${key}' must be one of: ${propSchema.enum.join(', ')}`
                });
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
