/**
 * YAML cursor path + JSON Schema lookup helpers for editor assistance
 * (completion, hover, the docs playground's options panel and quick controls).
 *
 * Pure: no DOM, no CodeMirror, no imports, so node:test and the docs can
 * load it directly.
 *
 * @module editor/utils/yaml-schema-path
 */

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const SCALARS = new Set(['string', 'number', 'integer', 'boolean']);

// A mapping key: plain (may contain '-', '.'), or single/double quoted.
const KEY_RE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s#'"\[\]{},:-][^#:]*?|-[^\s#:][^#:]*?)\s*:(?=\s|$)/;

/** @param {string} raw */
function unquote(raw) {
  if (raw.startsWith('"')) return raw.slice(1, -1).replace(/\\(.)/g, '$1');
  if (raw.startsWith("'")) return raw.slice(1, -1).replace(/''/g, "'");
  return raw.trim();
}

/**
 * @typedef {Object} YamlPosition
 * @property {Array<string|number>} path - path of the mapping/sequence the cursor is in
 * @property {'key'|'value'} position - typing a key, or the value of `key`
 * @property {string} [key] - key whose value is being typed (position 'value')
 * @property {string} partial - text typed so far for the key or value
 * @property {number} indent - column a new key at this level starts at
 */

/**
 * Where the cursor is in a block-style YAML document.
 *
 * Handles nested mappings, `- ` sequence items (including compact sequences
 * at the parent key's column and `- key:` items), quoted and hyphenated keys
 * and comments. Flow collections (`[a, b]`) are treated as values.
 *
 * @param {string} text
 * @param {number} offset - cursor offset in text
 * @returns {YamlPosition}
 */
export function yamlPathAt(text, offset) {
  const before = text.slice(0, offset);
  const lines = before.split('\n');
  const current = lines.pop() ?? '';
  /** @type {Array<{col: number, seg: string|number, type: 'key'|'item', open: boolean}>} */
  const stack = [];

  // Pop entries that can't contain content starting at `col`; return the index
  // of a popped sibling item at the same column (for numbering).
  const popTo = (col, isItem) => {
    let sibling = null;
    while (stack.length) {
      const top = stack[stack.length - 1];
      const keepCompact = isItem && top.type === 'key' && top.open && top.col === col;
      if (top.col < col || keepCompact) break;
      if (top.type === 'item' && top.col === col) sibling = /** @type {number} */ (top.seg);
      stack.pop();
    }
    return sibling;
  };

  /**
   * Consume `- ` markers and a `key:` on one line.
   * @returns {{ col: number, rest: string }}
   */
  const consume = (line, final) => {
    const indent = line.match(/^ */)[0].length;
    let col = indent;
    let rest = line.slice(indent);
    if (!final || rest.length) {
      const isItem = /^-(\s|$)/.test(rest);
      const sibling = popTo(col, isItem);
      let first = true;
      while (/^-(\s|$)/.test(rest)) {
        const index = first && sibling !== null ? sibling + 1 : 0;
        stack.push({ col, seg: index, type: 'item', open: true });
        const marker = rest.match(/^-\s*/)[0].length;
        col += marker;
        rest = rest.slice(marker);
        first = false;
      }
    }
    return { col, rest };
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed === '---') continue;
    const { col, rest } = consume(line, false);
    const m = KEY_RE.exec(rest);
    if (m) {
      const value = rest.slice(m[0].length).trim();
      stack.push({ col, seg: unquote(m[1]), type: 'key', open: !value || value.startsWith('#') });
    }
  }

  // The cursor line (text before the cursor only).
  if (!current.trim()) {
    const col = current.length;
    popTo(col, false);
    return { path: stack.map(s => s.seg), position: 'key', partial: '', indent: col };
  }
  const { col, rest } = consume(current, true);
  if (rest.length === 0 || /^-$/.test(rest)) {
    return { path: stack.map(s => s.seg), position: 'key', partial: '', indent: col };
  }
  const m = KEY_RE.exec(rest);
  if (m) {
    return {
      path: stack.map(s => s.seg),
      position: 'value',
      key: unquote(m[1]),
      partial: rest.slice(m[0].length).trimStart(),
      indent: col
    };
  }
  if (/^[^\s:#'"\[{]*$/.test(rest)) {
    return { path: stack.map(s => s.seg), position: 'key', partial: rest, indent: col };
  }
  return { path: stack.map(s => s.seg), position: 'value', partial: rest, indent: col };
}

// ============================================================================
// SCHEMA LOOKUP
// ============================================================================

/**
 * Value at a path in a parsed config (undefined when missing).
 * @param {*} config
 * @param {Array<string|number>} path
 */
export function valueAtPath(config, path) {
  let v = config;
  for (const seg of path) {
    if (v === null || v === undefined) return undefined;
    v = v[seg];
  }
  return v;
}

/**
 * Flatten a schema node with its oneOf/anyOf/allOf branches into one view:
 * merged properties, first items/additionalProperties, union of enums and
 * types. Deprecated branches are skipped (the node's own flags are kept).
 *
 * @param {Object|null|undefined} node
 * @param {Object} [sibling] - parent object's value, for `discriminatedBy`
 * @returns {Object|null}
 */
export function resolveSchema(node, sibling) {
  if (!isObject(node)) return null;
  if (node.discriminatedBy) {
    const { field, schemas, default: fallback } = node.discriminatedBy;
    const chosen = schemas?.[sibling?.[field]] ?? fallback;
    const { discriminatedBy, ...rest } = node;
    return resolveSchema({ ...rest, ...(chosen ? { allOf: [chosen] } : {}) }, sibling);
  }

  const branches = [];
  const collect = (n, depth) => {
    if (!isObject(n) || depth > 4) return;
    branches.push(n);
    for (const key of ['oneOf', 'anyOf', 'allOf']) {
      for (const b of n[key] || []) {
        if (isObject(b) && !b.deprecated) collect(b, depth + 1);
      }
    }
  };
  collect(node, 0);

  const out = {
    description: node.description,
    default: node.default,
    deprecated: node.deprecated,
    'x-replacement': node['x-replacement'],
    examples: node.examples,
    title: node.title
  };
  const types = new Set();
  const enums = [];
  let properties = null;
  for (const b of branches) {
    const t = Array.isArray(b.type) ? b.type : (b.type ? [b.type] : []);
    t.forEach(x => types.add(x));
    if (Array.isArray(b.enum)) b.enum.forEach(v => { if (!enums.includes(v)) enums.push(v); });
    if (b.const !== undefined && !enums.includes(b.const)) enums.push(b.const);
    if (isObject(b.properties)) properties = { ...(properties || {}), ...b.properties };
    if (out.items === undefined && b.items) out.items = b.items;
    if (out.additionalProperties === undefined && isObject(b.additionalProperties)) out.additionalProperties = b.additionalProperties;
    if (out.description === undefined && b.description) out.description = b.description;
    if (out.default === undefined && b.default !== undefined) out.default = b.default;
    if (out.examples === undefined && b.examples) out.examples = b.examples;
    for (const k of ['minimum', 'maximum', 'exclusiveMinimum', 'pattern', 'format']) {
      if (out[k] === undefined && b[k] !== undefined) out[k] = b[k];
    }
  }
  if (types.size) out.type = [...types];
  if (enums.length) out.enum = enums;
  if (properties) out.properties = properties;
  return out;
}

/**
 * Resolved schema at a path. Numeric segments step into `items`; string
 * segments into `properties` (or `additionalProperties`).
 *
 * @param {Object} schema - card schema
 * @param {Array<string|number>} path
 * @param {*} [config] - parsed config, for `discriminatedBy` (e.g. animation params)
 * @returns {Object|null}
 */
export function schemaAt(schema, path, config) {
  let node = resolveSchema(schema, undefined);
  for (let i = 0; i < path.length; i++) {
    if (!node) return null;
    const seg = path[i];
    const parentValue = valueAtPath(config, path.slice(0, i));
    let next;
    if (typeof seg === 'number' || /^\d+$/.test(String(seg))) {
      next = Array.isArray(node.items) ? node.items[Number(seg)] : node.items;
    } else {
      next = node.properties?.[seg] ?? (isObject(node.additionalProperties) ? node.additionalProperties : undefined);
    }
    node = resolveSchema(next, isObject(parentValue) ? parentValue : undefined);
  }
  return node;
}

/** Short type label for a resolved schema. */
export function typeLabel(node) {
  if (!node) return '';
  if (node.enum?.length) return node.enum.length <= 6 ? node.enum.map(String).join(' | ') : 'one of ' + node.enum.length;
  return (node.type || []).join(' | ');
}

/**
 * @typedef {Object} SchemaOption
 * @property {string} key
 * @property {string} type - short type label
 * @property {*} [default]
 * @property {Array} [enum]
 * @property {Array} [examples]
 * @property {string} [description]
 * @property {boolean} container - value is an object or list (no inline value)
 */

/**
 * Keys that can be added at a path (deprecated and already-present keys left out).
 *
 * @param {Object} schema
 * @param {Array<string|number>} path
 * @param {*} [config]
 * @returns {SchemaOption[]}
 */
export function optionsAt(schema, path, config) {
  const node = schemaAt(schema, path, config);
  if (!node?.properties) return [];
  const present = valueAtPath(config, path);
  const parent = isObject(present) ? present : undefined;
  return Object.entries(node.properties)
    .filter(([key, prop]) => !prop?.deprecated && !(parent && key in parent))
    .map(([key, prop]) => {
      const r = resolveSchema(prop, parent) || {};
      const types = r.type || [];
      return {
        key,
        type: typeLabel(r),
        default: r.default,
        enum: r.enum,
        examples: r.examples,
        description: r.description,
        // Block-only values; options that also take a plain value insert as `key: value`
        container: !r.enum && (types.includes('object') || types.includes('array')) && !types.some(t => SCALARS.has(t))
      };
    });
}

/**
 * Values to suggest for `key` at a path: enum values, booleans, examples.
 *
 * @param {Object} schema
 * @param {Array<string|number>} path - path of the object holding `key`
 * @param {string} key
 * @param {*} [config]
 * @returns {Array<{ value: *, label: string, kind: 'enum'|'boolean'|'example' }>}
 */
export function valueChoicesAt(schema, path, key, config) {
  const node = schemaAt(schema, [...path, key], config);
  if (!node) return [];
  if (node.enum?.length) return node.enum.map(v => ({ value: v, label: String(v), kind: 'enum' }));
  if ((node.type || []).length === 1 && node.type[0] === 'boolean') {
    return [true, false].map(v => ({ value: v, label: String(v), kind: 'boolean' }));
  }
  return (node.examples || [])
    .filter(v => v === null || typeof v !== 'object')
    .map(v => ({ value: v, label: String(v), kind: 'example' }));
}

/**
 * Parse YAML leniently for schema context: try the whole text, then without
 * the cursor line (usually the half-typed one). Returns undefined if neither parses.
 *
 * @param {string} text
 * @param {number} offset
 * @param {(text: string) => *} parse - e.g. js-yaml `load`
 */
export function lenientParse(text, offset, parse) {
  try {
    return parse(text);
  } catch {
    const start = text.lastIndexOf('\n', offset - 1) + 1;
    const endIdx = text.indexOf('\n', offset);
    const end = endIdx === -1 ? text.length : endIdx;
    try {
      return parse(text.slice(0, start) + text.slice(end + 1));
    } catch {
      return undefined;
    }
  }
}

/**
 * The mapping key on a line (after indentation and `- ` markers), with its
 * column span. Null when the line has no key.
 * @param {string} lineText
 * @returns {{ key: string, from: number, to: number }|null}
 */
export function keySpanAt(lineText) {
  const lead = lineText.match(/^[ ]*(?:-\s+)*/)[0].length;
  const m = KEY_RE.exec(lineText.slice(lead));
  if (!m) return null;
  const raw = m[1];
  return { key: unquote(raw), from: lead, to: lead + raw.length };
}
