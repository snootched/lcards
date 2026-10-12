/**
 * @fileoverview LCARdS template editor: a CodeMirror editor for one template
 * string, with completion for LCARdS tokens, Jinja2 entity arguments and
 * JavaScript (template-completions.js) and the template parts highlighted.
 * Same look as lcards-yaml-editor.
 *
 * @element lcards-template-editor
 * @fires value-changed - detail: { value }, after a short typing pause (flush() sends it now)
 *
 * @property {string} value - The template
 * @property {() => import('./template-completions.js').CompletionData} getCompletionData - What completion offers
 * @property {string} placeholder
 */

import { LitElement, html, css } from 'lit';
import { EditorView, keymap, placeholder, Decoration, ViewPlugin, MatchDecorator } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion, completionKeymap, startCompletion } from '@codemirror/autocomplete';
import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark';
import { templateCompletions } from './template-completions.js';

/** Template parts, marked so they stand out from plain text. */
const templatePart = new MatchDecorator({
    regexp: /\[\[\[|\]\]\]|\{\{[^\n]*?\}\}|\{%[^\n]*?%\}|\{(?:theme|ds|datasource):[^{}\n]*\}|\{[a-z_][\w.]*\}/gi,
    decoration: (m) => Decoration.mark({
        class: m[0].startsWith('[[[') || m[0].startsWith(']]]') ? 'tpl-js'
            : m[0].startsWith('{{') || m[0].startsWith('{%') ? 'tpl-jinja'
            : 'tpl-token',
    }),
});
const highlightTemplateParts = ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = templatePart.createDeco(view); }
    update(update) { this.decorations = templatePart.updateDeco(update, this.decorations); }
}, { decorations: (v) => v.decorations });

export class LCARdSTemplateEditor extends LitElement {
    static get properties() {
        return {
            value: { type: String },
            placeholder: { type: String },
            getCompletionData: { attribute: false },
        };
    }

    constructor() {
        super();
        this.value = '';
        this.placeholder = 'Type a template. Ctrl+Space lists what can go next.';
        /** @type {() => Object} */
        this.getCompletionData = () => ({});
        this._view = null;
        this._timer = null;
        this._updating = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
            .mount {
                border-radius: var(--ha-border-radius-md);
                overflow: hidden;
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }
            .mount:focus-within {
                border-color: var(--primary-color);
            }
            .cm-editor {
                min-height: 140px;
                max-height: 40vh;
                font-size: 14px;
            }
            .cm-editor.cm-focused {
                outline: none;
            }
            .cm-scroller {
                font-family: var(--code-font-family, monospace);
                line-height: 1.6;
            }
            .tpl-token {
                color: #4ec9b0;
            }
            .tpl-jinja {
                color: #c586c0;
            }
            .tpl-js {
                color: #dcdcaa;
                font-weight: 600;
            }
        `;
    }

    render() {
        return html`<div class="mount" @keydown=${this._keepKeys}></div>`;
    }

    /**
     * Keep typed characters from Home Assistant's one-key shortcuts ("e", "a", ...),
     * which would otherwise take them. Navigation, and an Escape the editor didn't
     * use, still bubble.
     * @param {KeyboardEvent} e
     */
    _keepKeys(e) {
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) e.stopPropagation();
        // Escape that closed the completion list mustn't also close the dialog
        if (e.key === 'Escape' && e.defaultPrevented) e.stopPropagation();
    }

    firstUpdated() {
        const source = (context) => {
            const line = context.state.doc.lineAt(context.pos);
            const before = context.state.sliceDoc(Math.max(0, context.pos - 400), context.pos);
            const found = templateCompletions(before, this.getCompletionData?.() ?? {});
            if (!found) return null;
            const from = context.pos - (before.length - found.from);
            if (from < line.from && !context.explicit) return null;
            return { from, options: found.options, validFor: /^[\w.]*$/ };
        };
        this._view = new EditorView({
            parent: this.renderRoot.querySelector('.mount'),
            state: EditorState.create({
                doc: this.value ?? '',
                extensions: [
                    history(),
                    EditorView.lineWrapping,
                    placeholder(this.placeholder),
                    autocompletion({ override: [source], activateOnTyping: true, maxRenderedOptions: 40 }),
                    keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
                    vsCodeDark,
                    highlightTemplateParts,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && !this._updating) this._schedule();
                        // CodeMirror opens the list after letters only; also after . : { ' " [
                        if (update.docChanged && update.transactions.some(tr => tr.isUserEvent('input.type'))) {
                            let typed = '';
                            update.changes.iterChanges((_a, _b, _c, _d, text) => { typed = text.toString(); });
                            if (/[.:{'"[]$/.test(typed)) queueMicrotask(() => this._view && startCompletion(this._view));
                        }
                    }),
                ],
            }),
        });
    }

    updated(changed) {
        if (changed.has('value') && this._view && this.value !== this._view.state.doc.toString()) {
            this._updating = true;
            this._view.dispatch({ changes: { from: 0, to: this._view.state.doc.length, insert: this.value ?? '' } });
            this._updating = false;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this._timer);
        this._view?.destroy();
        this._view = null;
    }

    _schedule() {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this._emit(), 300);
    }

    _emit() {
        this._timer = null;
        const value = this._view?.state.doc.toString() ?? this.value;
        this.value = value;
        this.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
    }

    /** Send a change still waiting for the typing pause, now. */
    flush() {
        if (!this._timer) return;
        clearTimeout(this._timer);
        this._emit();
    }

    /**
     * Insert text at the cursor (replacing a selection) and focus the editor. After a
     * starter that ends where completion can continue ({entity. {ds: ...), the list opens.
     * @param {string} text
     * @param {number} [caret=0] - Where the cursor ends up, from the end of the text (e.g. -4)
     */
    insert(text, caret = 0) {
        const view = this._view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length + caret } });
        view.focus();
        if (/[.:{]$/.test(text) && caret === 0) startCompletion(view);
    }

    focus() {
        this._view?.focus();
    }
}

if (!customElements.get('lcards-template-editor')) customElements.define('lcards-template-editor', LCARdSTemplateEditor);
