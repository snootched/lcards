/**
 * "Options here" panel model: what can go at the cursor in a YAML editor and
 * what Insert should add. Shared by the card editor's YAML tab (Lit) and the
 * docs playgrounds (Vue). Pure, no DOM.
 *
 * @module editor/utils/yaml-options-model
 */

import { yamlPathAt, schemaAt, optionsAt, valueChoicesAt, lenientParse, typeLabel } from './yaml-schema-path.js';
import { docsFor } from './yaml-docs-links.js';

/**
 * @typedef {Object} OptionsPanel
 * @property {'options'|'values'} kind - list of keys to add, or values for one key
 * @property {Array<string|number>} path - path of the mapping the panel describes
 * @property {string} crumb - readable path, e.g. "sources > 0" or "top level"
 * @property {Array<Object>} options - keys (kind 'options'): SchemaOption + docs
 * @property {number} indent - column for inserted keys
 * @property {boolean} listItem - inserted key starts a new list item ("- key:")
 * @property {string} [key] - key whose value is at the cursor (kind 'values')
 * @property {string} [type] @property {string} [description] @property {string} [docs]
 * @property {Array<{value: *, label: string}>} choices - values (kind 'values')
 */

const isContainer = (node) => {
  const types = node?.type || [];
  return !node?.enum && (types.includes('object') || types.includes('array')) && !types.some(t => ['string', 'number', 'integer', 'boolean'].includes(t));
};

/**
 * Panel content for the cursor position.
 * @param {Object|null} schema - card schema
 * @param {string} text - YAML text
 * @param {number} offset - cursor offset
 * @param {(text: string) => *} parse - YAML parser (throws on error)
 * @param {string} [cardType] - for docs links
 * @returns {OptionsPanel}
 */
export function panelAt(schema, text, offset, parse, cardType = '') {
  /** @type {OptionsPanel} */
  const empty = { kind: 'options', path: [], crumb: 'top level', options: [], indent: 0, listItem: false, choices: [] };
  if (!schema) return empty;
  const where = yamlPathAt(text, offset);
  const cfg = lenientParse(text, offset, parse);
  const decorate = (path) => optionsAt(schema, path, cfg).map(o => ({ ...o, docs: docsFor(cardType, [...path, o.key]) }));
  const crumb = (path) => (path.length ? path.join(' > ') : 'top level');

  if (where.position === 'value' && where.key) {
    const node = schemaAt(schema, [...where.path, where.key], cfg);
    if (isContainer(node) && !where.partial) {
      // Cursor at the end of e.g. `style:`: describe what goes inside it.
      const types = node.type || [];
      const isList = types.includes('array') && !types.includes('object');
      const path = isList ? [...where.path, where.key, 0] : [...where.path, where.key];
      return { kind: 'options', path, crumb: crumb(path), options: decorate(path), indent: where.indent + 2, listItem: isList, choices: [] };
    }
    const path = [...where.path, where.key];
    return {
      kind: 'values',
      path: where.path,
      crumb: crumb(path),
      key: where.key,
      type: typeLabel(node),
      description: node?.description,
      docs: docsFor(cardType, path),
      options: [],
      indent: where.indent,
      listItem: false,
      choices: valueChoicesAt(schema, where.path, where.key, cfg)
    };
  }
  return { kind: 'options', path: where.path, crumb: crumb(where.path), options: decorate(where.path), indent: where.indent, listItem: false, choices: [] };
}

/**
 * Lines Insert adds for an option (unindented; insert at panel.indent).
 * Containers open a block; scalars get their default or first allowed value.
 * @param {Object} option - from panel.options
 * @param {OptionsPanel} panel
 * @param {Object} schema
 * @param {*} [config] - parsed config, for discriminated schemas
 * @returns {string[]}
 */
export function insertLinesFor(option, panel, schema, config) {
  const node = schemaAt(schema, [...panel.path, option.key], config);
  const types = node?.type || [];
  let lines;
  if (option.container) {
    // Children sit two columns in from the key (four when the key opens a list item)
    const child = panel.listItem ? '    ' : '  ';
    lines = types.includes('array') && !types.includes('object') ? [`${option.key}:`, `${child}- `] : [`${option.key}:`, child];
  } else {
    const start = option.default ?? option.enum?.[0] ?? (types.includes('boolean') ? true : '');
    lines = [start === '' ? `${option.key}: ` : `${option.key}: ${quoteIfNeeded(start)}`];
  }
  if (panel.listItem) lines[0] = `- ${lines[0]}`;
  return lines;
}

/** Quote scalar values YAML would misread (`#...` comments, `: ` etc.). */
export function quoteIfNeeded(value) {
  if (typeof value !== 'string') return String(value);
  return /^[#&*!|>'"%@`{}[\],?-]|: | #|^\s|\s$/.test(value) || value === '' ? `'${value.replace(/'/g, "''")}'` : value;
}
