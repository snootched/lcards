/**
 * @fileoverview Schema assistance for CodeMirror YAML editors
 *
 * Framework-free CodeMirror extensions shared by the card editor's YAML tab
 * (lcards-yaml-editor) and the docs playgrounds:
 * - completion: keys for the mapping at the cursor (list items, oneOf
 *   branches, discriminated params included; deprecated keys hidden), value
 *   choices (enums, booleans, examples) and entity ids
 * - hover: a key's description, type, default and allowed values
 * - lint: YAML syntax errors and simple top-level schema checks
 *
 * Path and schema logic lives in editor/utils/yaml-schema-path.js.
 */

import { autocompletion } from '@codemirror/autocomplete';
import { hoverTooltip } from '@codemirror/view';
import yaml from 'js-yaml';
import {
    yamlPathAt, schemaAt, optionsAt, valueChoicesAt, lenientParse, keySpanAt, typeLabel
} from '../../utils/yaml-schema-path.js';
import { validateYaml, yamlToConfig } from '../../utils/yaml-utils.js';

/**
 * @typedef {Object} AssistOptions
 * @property {() => Object|null} getSchema - current card schema
 * @property {() => Array<{ id: string, name?: string }>} [getEntities] - entity ids to suggest
 */

const ENTITY_KEY = /(^|_)entity$|^entity_id$/;
const parse = (text) => yaml.load(text);

/** Short "type, default" line for a completion. */
function detailFor(option) {
    const parts = [];
    if (option.type) parts.push(option.type.length > 40 ? option.type.slice(0, 40) + '...' : option.type);
    if (option.default !== undefined) parts.push(`default ${JSON.stringify(option.default)}`);
    return parts.join(', ');
}

/** True when the schema node at a value position expects an entity id. */
function wantsEntity(node, key) {
    return node?.format === 'entity' || ENTITY_KEY.test(key || '');
}

/**
 * Completion source for schema keys, values and entities.
 * @param {AssistOptions} opts
 */
export function schemaCompletionSource({ getSchema, getEntities = () => [] }) {
    return (context) => {
        const schema = getSchema();
        const text = context.state.doc.toString();
        const where = yamlPathAt(text, context.pos);

        if (where.position === 'key') {
            const word = context.matchBefore(/[\w-]*/);
            if (!schema || !word || (word.from === word.to && !context.explicit)) return null;
            const config = lenientParse(text, context.pos, parse);
            const pad = ' '.repeat(where.indent + 2);
            const options = optionsAt(schema, where.path, config).map(o => {
                const node = schemaAt(schema, [...where.path, o.key], config);
                const isList = (node?.type || []).includes('array') && !(node?.type || []).includes('object');
                return {
                    label: o.key,
                    type: 'property',
                    detail: detailFor(o),
                    info: o.description || undefined,
                    apply: o.container ? (isList ? `${o.key}:\n${pad}- ` : `${o.key}:\n${pad}`) : `${o.key}: `
                };
            });
            return options.length ? { from: word.from, options, validFor: /^[\w-]*$/ } : null;
        }

        // Value position: schema choices (enum, boolean, examples) for the key...
        const config = lenientParse(text, context.pos, parse);
        const node = schema && where.key ? schemaAt(schema, [...where.path, where.key], config) : null;
        if (schema && where.key && !wantsEntity(node, where.key)) {
            const word = context.matchBefore(/[^\s:[\]{},'"#][^:[\]{}'"#]*/) || { from: context.pos, text: '' };
            const choices = valueChoicesAt(schema, where.path, where.key, config).map(c => ({
                label: c.label,
                type: c.kind === 'example' ? 'text' : 'enum',
                detail: c.kind === 'example' ? 'example' : ''
            }));
            if (choices.length && (word.text || context.explicit || where.partial === '')) {
                return { from: word.from, options: choices, validFor: /^[^:[\]{}'"#]*$/ };
            }
        }

        // ...otherwise entity ids: for entity keys, or anything that looks like one
        const word = context.matchBefore(/[\w.]*/);
        const typed = word?.text ?? '';
        if (!(typed.includes('.') || typed.length >= 3 || wantsEntity(node, where.key) || context.explicit)) return null;
        const needle = typed.toLowerCase();
        const options = [];
        for (const e of getEntities()) {
            if (needle && !e.id.toLowerCase().includes(needle)) continue;
            options.push({ label: e.id, type: 'variable', detail: e.name || '', boost: e.id.startsWith(typed) ? 10 : 0 });
            if (options.length >= 50) break;
        }
        return options.length ? { from: word ? word.from : context.pos, options, validFor: /^[\w.]*$/ } : null;
    };
}

/**
 * Hover tooltip for keys: description, type, default, allowed values.
 * @param {AssistOptions} opts
 */
export function schemaHover({ getSchema }) {
    return hoverTooltip((view, pos) => {
        const schema = getSchema();
        if (!schema) return null;
        const line = view.state.doc.lineAt(pos);
        const span = keySpanAt(line.text);
        if (!span || pos < line.from + span.from || pos > line.from + span.to) return null;

        const text = view.state.doc.toString();
        const start = line.from + span.from;
        const where = yamlPathAt(text, start);
        const config = lenientParse(text, start, parse);
        const node = schemaAt(schema, [...where.path, span.key], config);
        if (!node) return null;

        return {
            pos: start,
            end: line.from + span.to,
            above: true,
            create() {
                const dom = document.createElement('div');
                dom.className = 'cm-schema-hover';
                dom.style.cssText = 'max-width: 420px; padding: 6px 8px; font-size: 12px; line-height: 1.4;';
                const add = (tag, textContent, css = '') => {
                    const el = document.createElement(tag);
                    el.textContent = textContent;
                    if (css) el.style.cssText = css;
                    dom.appendChild(el);
                };
                add('div', span.key, 'font-weight: 600;');
                const type = typeLabel(node);
                if (type) add('div', type, 'opacity: 0.75; font-family: monospace;');
                if (node.deprecated) add('div', `Deprecated${node['x-replacement'] ? `: use ${node['x-replacement']}` : ''}`, 'color: #e5c07b;');
                if (node.description) add('div', node.description, 'margin-top: 4px;');
                if (node.default !== undefined) add('div', `Default: ${JSON.stringify(node.default)}`, 'margin-top: 4px; opacity: 0.75;');
                return { dom };
            }
        };
    });
}

/**
 * Lint source: YAML syntax errors, then simple top-level schema checks
 * (unknown or missing keys, type, enum, pattern, number range).
 * @param {() => Object|null} getSchema
 */
export function schemaLintSource(getSchema) {
    return (view) => {
        /** @type {import('@codemirror/lint').Diagnostic[]} */
        const diagnostics = [];
        const yamlText = view.state.doc.toString();

        const yamlValidation = validateYaml(yamlText);
        if (!yamlValidation.valid) {
            const lineNum = yamlValidation.lineNumber || 1;
            const line = view.state.doc.line(Math.min(lineNum, view.state.doc.lines));
            diagnostics.push({ from: line.from, to: line.to, severity: 'error', message: `YAML Syntax Error: ${yamlValidation.error}` });
            return diagnostics;
        }

        diagnostics.push(...unquotedHexDiagnostics(view));

        const schema = getSchema();
        if (!schema) return diagnostics;
        let config;
        try {
            config = yamlToConfig(yamlText);
        } catch {
            return diagnostics;
        }
        if (!config || typeof config !== 'object') return diagnostics;

        for (const error of validateTopLevel(config, schema)) {
            const match = yamlText.match(new RegExp(`^\\s*${error.field}:`, 'm'));
            let from = 0;
            let to = yamlText.length;
            if (match) {
                from = match.index;
                const lineEnd = yamlText.indexOf('\n', from);
                to = lineEnd > -1 ? lineEnd : yamlText.length;
            }
            diagnostics.push({ from, to, severity: 'error', message: error.message });
        }
        return diagnostics;
    };
}

// `key: #ff0000` (unquoted): YAML reads `#...` as a comment, so the value is empty.
const UNQUOTED_HEX = /^(\s*(?:-\s+)*[^\s#][^#]*?:\s+)(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))\s*$/;

/**
 * Warn about hex colours written without quotes, with a one-click fix.
 * @param {import('@codemirror/view').EditorView} view
 */
export function unquotedHexDiagnostics(view) {
    /** @type {import('@codemirror/lint').Diagnostic[]} */
    const out = [];
    const doc = view.state.doc;
    for (let n = 1; n <= doc.lines; n++) {
        const line = doc.line(n);
        const m = UNQUOTED_HEX.exec(line.text);
        if (!m) continue;
        const from = line.from + m[1].length;
        const to = from + m[2].length;
        out.push({
            from,
            to,
            severity: 'warning',
            message: `In YAML, # starts a comment, so this colour is ignored. Put it in quotes: '${m[2]}'`,
            actions: [{
                name: 'Add quotes',
                apply: (v, f, t) => v.dispatch({ changes: { from: f, to: t, insert: `'${m[2]}'` } })
            }]
        });
    }
    return out;
}

/**
 * Simple top-level schema checks (moved unchanged from lcards-yaml-editor).
 * @param {Object} config
 * @param {Object} schema
 * @returns {Array<{ field: string, message: string }>}
 */
export function validateTopLevel(config, schema) {
    const errors = [];
    if (!schema.properties) return errors;

    Object.keys(config).forEach(key => {
        if (!schema.properties[key]) {
            errors.push({ field: key, message: `Unknown property '${key}' is not defined in the schema` });
        }
    });

    if (schema.required) {
        schema.required.forEach(field => {
            if (config[field] === undefined) {
                errors.push({ field, message: `Required property '${field}' is missing` });
            }
        });
    }

    Object.keys(config).forEach(key => {
        const propSchema = schema.properties[key];
        if (!propSchema) return;
        const value = config[key];

        if (propSchema.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            const allowed = Array.isArray(propSchema.type) ? propSchema.type : [propSchema.type];
            const ok = allowed.includes(actualType) || (actualType === 'number' && allowed.includes('integer'));
            if (!ok && value !== null) {
                errors.push({ field: key, message: `Property '${key}' should be ${allowed.join(' or ')}, got ${actualType}` });
            }
        }

        if (propSchema.enum && !propSchema.enum.includes(value)) {
            errors.push({ field: key, message: `Property '${key}' must be one of: ${propSchema.enum.join(', ')}` });
        }

        if (propSchema.pattern && typeof value === 'string') {
            const pattern = new RegExp(propSchema.pattern);
            if (!pattern.test(value)) {
                let message = `Property '${key}' does not match required pattern`;
                if (propSchema.format === 'entity') {
                    message += ' (expected format: domain.object_id, e.g., light.living_room)';
                } else if (key === 'icon') {
                    message += ' (expected format: mdi:icon-name or si:icon-name)';
                } else if (propSchema.examples && propSchema.examples.length > 0) {
                    message += ` (e.g., ${propSchema.examples[0]})`;
                }
                errors.push({ field: key, message });
            }
        }

        if (propSchema.type === 'number' && typeof value === 'number') {
            if (propSchema.minimum !== undefined && value < propSchema.minimum) {
                errors.push({ field: key, message: `Property '${key}' must be at least ${propSchema.minimum} (got ${value})` });
            }
            if (propSchema.maximum !== undefined && value > propSchema.maximum) {
                errors.push({ field: key, message: `Property '${key}' must be at most ${propSchema.maximum} (got ${value})` });
            }
        }
    });

    return errors;
}

/**
 * Completion + hover for a YAML editor (add a linter separately).
 * @param {AssistOptions} opts
 */
export function yamlSchemaAssist(opts) {
    return [
        autocompletion({
            override: [schemaCompletionSource(opts)],
            activateOnTyping: true,
            maxRenderedOptions: 30
        }),
        schemaHover(opts)
    ];
}

/**
 * Insert lines at a nesting level: on the cursor line if it is blank,
 * otherwise after it. Used by the "Options here" panel's Insert.
 * @param {import('@codemirror/view').EditorView} view
 * @param {string[]} lines - unindented lines
 * @param {number} indent - column to indent them to
 */
export function insertLines(view, lines, indent) {
    const line = view.state.doc.lineAt(view.state.selection.main.head);
    const pad = ' '.repeat(indent);
    const block = lines.map(l => pad + l).join('\n');
    const blank = !line.text.trim();
    const from = blank ? line.from : line.to;
    const insert = blank ? block : '\n' + block;
    view.dispatch({ changes: { from, to: line.to, insert }, selection: { anchor: from + insert.length } });
    view.focus();
}

/**
 * Replace the value after `key:` on the cursor line (keeps a trailing comment).
 * @param {import('@codemirror/view').EditorView} view
 * @param {string} value - already YAML-safe (see quoteIfNeeded)
 */
export function setLineValue(view, value) {
    const line = view.state.doc.lineAt(view.state.selection.main.head);
    const m = /^(\s*(?:-\s+)*[^#\s][^#]*?:)(?:\s|$)/.exec(line.text);
    if (!m) return;
    const from = line.from + m[1].length;
    const comment = line.text.slice(m[1].length).match(/\s+#.*$/)?.[0] ?? '';
    const insert = ` ${value}${comment}`;
    view.dispatch({ changes: { from, to: line.to, insert }, selection: { anchor: from + 1 + String(value).length } });
    view.focus();
}
