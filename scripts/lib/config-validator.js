/**
 * @fileoverview Validate LCARdS YAML config: the one checker behind the docs
 * example validator (scripts/validate-doc-examples.js) and the user-facing CLI
 * (scripts/lcards-validate.mjs).
 *
 * For every LCARdS node in a parsed config (a card, a layout view, the shell
 * strategy; nested anywhere: views, sections, stacks, MSD control overlays):
 *   - JSON Schema (ajv) against the real schemas (scripts/lib/card-schemas.js)
 *   - keys no schema branch declares (most schemas are open, so ajv alone misses
 *     typos such as `text_fields` or `style.colr`)
 *   - MSD: a base_svg.source or a view_box
 *   - charts and data grids: the legacy (pre-sources[]) format
 *   - names that pass the schema but don't exist: presets, components, animation
 *     and background presets, filters, sound assets, MSD backgrounds, theme tokens
 *     (scripts/lib/registries.js). User packs can add names, so these are warnings.
 */

import Ajv from 'ajv';
import { isTemplateString } from '../../src/utils/template-string.js';
import { migrateChartConfig } from '../../src/charts/chart-config-migration.js';
import { migrateDataGridConfig } from '../../src/data-grid/data-grid-config-migration.js';
import { classifyThemePath } from './theme-token-rules.js';

/** Keys every card accepts that card schemas don't list (HA / layout plumbing). */
const CARD_PLUMBING_KEYS = new Set(['type', 'grid_options', 'view_layout', 'visibility', 'layout_options', 'card_mod']);

// ── Schema preparation ─────────────────────────────────────────────────────────
// Strip `additionalProperties: false` / 'warn' (partial examples would fail it;
// unknown keys are reported separately below), any `$ref` left in a source
// schema, and empty `enum: []`. When stripping leaves an empty `{}` branch in a
// oneOf/anyOf/allOf, drop it: `{}` matches everything and would make `oneOf` fail
// for values that also satisfy a sibling branch.
export function stripSchemaRestrictions(node) {
  if (Array.isArray(node)) return node.map(stripSchemaRestrictions);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'additionalProperties' && (v === false || v === 'warn')) continue;
      if (k === '$ref') continue;
      if (typeof v === 'function') continue;
      if (k === 'enum' && Array.isArray(v) && v.length === 0) continue;
      if ((k === 'oneOf' || k === 'anyOf' || k === 'allOf') && Array.isArray(v)) {
        const stripped = v
          .map(stripSchemaRestrictions)
          .filter(item => !(item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0));
        if (stripped.length > 0) out[k] = stripped;
        continue;
      }
      out[k] = stripSchemaRestrictions(v);
    }
    return out;
  }
  return node;
}

// ── Unknown keys ─────────────────────────────────────────────────────────────
/** Sub-schema for `key` in `schema`, `undefined` if open/unconstrained, or `false` if unknown. */
function schemaForKey(schema, key) {
  if (!schema || typeof schema !== 'object') return undefined;
  const branches = [schema, ...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])]
    .filter(b => b && typeof b === 'object');
  let declaresProperties = false;
  for (const b of branches) {
    if (b !== schema && (b.anyOf || b.oneOf || b.allOf)) {
      const nested = schemaForKey(b, key);
      if (nested !== false) return nested;
      declaresProperties = true;
      continue;
    }
    if (b.properties && Object.prototype.hasOwnProperty.call(b.properties, key)) return b.properties[key];
    for (const [pattern, sub] of Object.entries(b.patternProperties ?? {})) {
      if (new RegExp(pattern).test(key)) return sub;
    }
    if (b.additionalProperties === true) return undefined;
    if (b.additionalProperties && typeof b.additionalProperties === 'object') return b.additionalProperties;
    if (b.properties || b.patternProperties) declaresProperties = true;
  }
  return declaresProperties ? false : undefined;
}

/** Collect `path` strings of keys the schema does not declare. */
export function unknownKeys(value, schema, pathPrefix = '', out = [], isCardRoot = false) {
  if (!value || typeof value !== 'object' || !schema) return out;
  if (Array.isArray(value)) {
    const items = schema.items ?? [schema, ...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].find(b => b?.items)?.items;
    value.forEach((v, i) => unknownKeys(v, items, `${pathPrefix}[${i}]`, out));
    return out;
  }
  for (const [key, v] of Object.entries(value)) {
    if (isCardRoot && CARD_PLUMBING_KEYS.has(key)) continue;
    const sub = schemaForKey(schema, key);
    const p = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (sub === false) { out.push(p); continue; }
    if (sub) unknownKeys(v, sub, p, out);
  }
  return out;
}

// ── Finding LCARdS nodes ───────────────────────────────────────────────────────
/** `custom:<tag>` of an LCARdS card/view (custom:lcards-*) or strategy (custom:lcars-shell). */
export function lcardsTag(type) {
  if (typeof type !== 'string') return null;
  const m = /^custom:(lcards-[a-z0-9-]+|lcars-shell)$/.exec(type.trim());
  return m ? m[1] : null;
}

/**
 * Every LCARdS node in a parsed config, with its path: cards at any depth (views,
 * sections, stacks, conditional cards, MSD control overlays), views, strategies.
 * @returns {{node: object, path: string, tag: string}[]}
 */
export function collectLcardsNodes(root, path = '', out = []) {
  if (Array.isArray(root)) {
    root.forEach((item, i) => collectLcardsNodes(item, `${path}[${i}]`, out));
  } else if (root && typeof root === 'object') {
    const tag = lcardsTag(root.type);
    if (tag) out.push({ node: root, path, tag });
    for (const [k, v] of Object.entries(root)) collectLcardsNodes(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

// ── Registry checks ────────────────────────────────────────────────────────────
const isLiteral = (v) => typeof v === 'string' && v.trim() !== '' && !isTemplateString(v);

/** Walk every value under a node, with its dotted path (stops at nested LCARdS nodes). */
function walk(value, path, visit, isRoot = true) {
  if (!isRoot && value && typeof value === 'object' && !Array.isArray(value) && lcardsTag(value.type)) return;
  visit(value, path);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, visit, false));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, visit, false);
  }
}

/**
 * Names used in one LCARdS node that the built-in registries don't have.
 * @returns {{path: string, message: string}[]}
 */
export function registryIssues(node, tag, reg) {
  const out = [];
  const tokenSet = new Set(reg.theme_tokens);
  const check = (path, value, list, what) => {
    if (isLiteral(value) && !list.includes(value)) out.push({ path, message: `unknown ${what} "${value}"${suggest(value, list)}` });
  };
  // Card-level preset / component. Like CoreConfigManager: a style preset first; with
  // a component set, an unknown style preset is that component's own preset
  // (e.g. alert: condition_red).
  // A component's own presets include the user's `<component>.custom_presets`.
  const componentPresets = isLiteral(node.component) && reg.component_presets?.[node.component]
    ? [...reg.component_presets[node.component], ...Object.keys(node[node.component]?.custom_presets ?? {})]
    : null;
  if (componentPresets) check('preset', node.preset, [...componentPresets, ...reg.button_presets], `${node.component} component preset or button preset`);
  else if (['lcards-button', 'lcards-elbow', 'lcards-select-menu'].includes(tag)) check('preset', node.preset, reg.button_presets, 'button preset');
  // Range-driven presets switch between the component's own presets (no style-preset fallback).
  if (componentPresets && Array.isArray(node.ranges)) {
    node.ranges.forEach((range, i) => check(`ranges[${i}].preset`, range?.preset, componentPresets, `${node.component} component preset`));
  }
  if (tag === 'lcards-slider') {
    check('preset', node.preset, reg.slider_presets, 'slider preset');
    check('component', node.component, reg.components.slider ?? [], 'slider component');
  }
  if (tag === 'lcards-button') check('component', node.component, Object.values(reg.components).flat(), 'component');
  if (tag === 'lcards-msd-card') check('msd.base_svg.source', builtinOnly(node.msd?.base_svg?.source), reg.msd_backgrounds, 'built-in MSD background');

  walk(node, '', (value, path) => {
    if (typeof value === 'string') {
      for (const m of value.matchAll(/theme:([a-zA-Z][a-zA-Z0-9._-]*)/g)) {
        if (classifyThemePath(m[1], tokenSet) === 'unknown') out.push({ path, message: `unknown theme token "theme:${m[1]}"${suggest(m[1], reg.theme_tokens)}` });
      }
      return;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const key = path.replace(/\[\d+\]$/, '').split('.').pop();
    const inList = /\[\d+\]$/.test(path);
    if (inList && key === 'animations') check(`${path}.preset`, value.preset, reg.animation_presets, 'animation preset');
    if (inList && (key === 'background_animation' || key === 'effects')) check(`${path}.preset`, value.preset, reg.background_presets, 'background animation preset');
    if (inList && key === 'filters') check(`${path}.type`, value.type, reg.filters, 'filter');
    if (key === 'sounds' && !inList) {
      for (const [event, asset] of Object.entries(value)) {
        if (event === 'enabled' || (typeof asset === 'string' && asset.startsWith('media-source://'))) continue;
        check(`${path}.${event}`, asset, reg.sound_assets, 'sound asset');
      }
    }
  });
  return out;
}

/** Only `builtin:` sources are checked against the registry (paths and media IDs are the user's). */
function builtinOnly(source) {
  return typeof source === 'string' && source.startsWith('builtin:') ? source : undefined;
}

/** ` (did you mean "x"?)` for a close match, else ''. */
function suggest(value, list) {
  let best = null;
  let bestScore = Infinity;
  for (const candidate of list) {
    const d = distance(value.toLowerCase(), candidate.toLowerCase());
    if (d < bestScore) { bestScore = d; best = candidate; }
  }
  return best && bestScore <= Math.max(2, Math.floor(value.length / 4)) ? ` (did you mean "${best}"?)` : '';
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// ── The validator ──────────────────────────────────────────────────────────────
/**
 * @typedef {{ path: string, tag: string, severity: 'error'|'warning', code: string, message: string }} Issue
 *   code: schema | unknown-key | msd-canvas | legacy-format | registry
 */

/**
 * @param {{ entries: {tag: string, schema: object}[], registries?: object }} opts
 * @returns {{ tags: string[], validateConfig: (config: any) => Issue[] }}
 */
export function createConfigValidator({ entries, registries = null }) {
  // validateFormats: false silences HA-specific formats (entity, font-family, color).
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  // Template strings are evaluated at render time, so `pattern` only applies to literal values
  // (the same rule as CoreValidationService).
  ajv.removeKeyword('pattern');
  ajv.addKeyword({
    keyword: 'pattern',
    type: 'string',
    schemaType: 'string',
    validate: (pattern, data) => isTemplateString(data) || new RegExp(pattern, 'u').test(data),
  });
  const raw = new Map();
  const compiled = new Map();
  for (const { tag, schema } of entries) {
    raw.set(tag, schema);
    compiled.set(tag, ajv.compile(stripSchemaRestrictions(schema)));
  }

  /** Issues for one LCARdS node (not its nested LCARdS nodes). */
  function validateNode(node, tag, at) {
    const issues = [];
    const add = (severity, code, path, message) => issues.push({ path: [at, path].filter(Boolean).join('.') || '(root)', tag, severity, code, message });

    if (tag === 'lcards-msd-card' && !node.msd?.base_svg?.source && !Array.isArray(node.msd?.view_box)) {
      add('error', 'msd-canvas', 'msd', 'MSD has neither msd.base_svg.source nor a view_box [x, y, w, h]');
    }
    const validate = compiled.get(tag);
    if (!validate) return issues;

    const migrator = { 'lcards-chart': migrateChartConfig, 'lcards-data-grid': migrateDataGridConfig }[tag];
    if (migrator) {
      const { changed, notes } = migrator(node);
      if (changed) add('warning', 'legacy-format', '', `legacy ${tag === 'lcards-chart' ? 'chart' : 'data grid'} format (still works; ${notes.join('; ') || 'legacy keys'})`);
    }
    for (const key of unknownKeys(node, raw.get(tag), '', [], true)) add('error', 'unknown-key', key, 'unknown key (not in the schema)');
    if (!validate(node)) {
      for (const err of validate.errors ?? []) {
        const p = err.instancePath.replace(/^\//, '').replace(/\/(\d+)(?=\/|$)/g, '[$1]').replace(/\//g, '.');
        add('error', 'schema', p, err.message ?? 'invalid');
      }
    }
    if (registries) {
      for (const r of registryIssues(node, tag, registries)) add('warning', 'registry', r.path, r.message);
    }
    return issues;
  }

  return {
    tags: [...compiled.keys()],
    /** Issues for every LCARdS node in a parsed config (a card, a view, a whole dashboard). */
    validateConfig(config) {
      return collectLcardsNodes(config).flatMap(({ node, path, tag }) => validateNode(node, tag, path));
    },
    validateNode,
  };
}
