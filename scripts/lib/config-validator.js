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
 *     and background presets, filters, sound assets, MSD backgrounds, theme tokens,
 *     near-miss `var(--lcars-*)` (HA-LCARS) and `var(--lcards-*)` (LCARdS palette) names
 *     (scripts/lib/registries.js). User packs can add names, so these are warnings.
 *   - astrometrics: one placement form per point, and every point, object and view id
 *     a reference names exists in the card (errors: nothing outside the card adds them)
 */

import Ajv from 'ajv';
import { isTemplateString } from '../../src/utils/template-string.js';
import { migrateChartConfig } from '../../src/charts/chart-config-migration.js';
import { migrateDataGridConfig } from '../../src/data-grid/data-grid-config-migration.js';
import { classifyThemePath } from './theme-token-rules.js';
import { PLACEMENT_FORMS, LABEL_STYLE_NAMES, UNIT_NAMES } from '../../src/core/astrometrics/names.js';

/**
 * Keys every card accepts that card schemas don't list (HA / layout plumbing, and the
 * styling keys of UIX and its predecessor card-mod, which work on any card in a hui-card).
 */
const CARD_PLUMBING_KEYS = new Set(['type', 'grid_options', 'view_layout', 'visibility', 'layout_options', 'card_mod', 'uix']);

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
      // CoreValidationService's per-property `required: true` becomes the parent's `required` list
      if (k === 'required' && !Array.isArray(v)) continue;
      if (k === 'properties' && v && typeof v === 'object') {
        const own = Object.keys(v).filter(p => v[p]?.required === true);
        if (own.length) out.required = [...new Set([...(Array.isArray(node.required) ? node.required : []), ...own, ...(out.required ?? [])])];
      }
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

/**
 * A bindable setting: anyOf a number, an `{ entity }` binding and a template
 * (astrometrics-schema.js `setting()`).
 * @param {any} schema
 */
function isSettingSchema(schema) {
  const alts = schema?.anyOf;
  return Array.isArray(alts) && alts.some(b => b?.type === 'number') && alts.some(b => b?.properties?.entity && b?.required?.includes('entity'));
}

/** `oneOf` read as `anyOf` (CoreValidationService tolerates a value matching several branches). */
function oneOfAsAnyOf(node) {
  if (Array.isArray(node)) return node.map(oneOfAsAnyOf);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k === 'oneOf' ? 'anyOf' : k, oneOfAsAnyOf(v)]));
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

/** Keys a schema node declares by name (all branches), for "did you mean" hints. */
function declaredKeys(schema, out = new Set()) {
  if (!schema || typeof schema !== 'object') return out;
  for (const k of Object.keys(schema.properties ?? {})) out.add(k);
  for (const b of [...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])]) declaredKeys(b, out);
  return out;
}

/**
 * Collect `path` strings of keys the schema does not declare. With `hints` (a Map),
 * also records path -> the closest declared key, when one is close.
 */
export function unknownKeys(value, schema, pathPrefix = '', out = [], isCardRoot = false, hints = null) {
  if (!value || typeof value !== 'object' || !schema) return out;
  if (Array.isArray(value)) {
    const items = schema.items ?? [schema, ...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].find(b => b?.items)?.items;
    value.forEach((v, i) => unknownKeys(v, items, `${pathPrefix}[${i}]`, out, false, hints));
    return out;
  }
  // A oneOf/anyOf keyed by `type` (one branch per type: astrometrics objects): check
  // against the branch for this value's type, so keys of other types are reported.
  if (!isCardRoot && typeof value.type === 'string') {
    const branch = [...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].filter(b => b?.properties?.type?.const === value.type);
    if (branch.length === 1) schema = branch[0];
  }
  for (const [key, v] of Object.entries(value)) {
    if (isCardRoot && CARD_PLUMBING_KEYS.has(key)) continue;
    const sub = schemaForKey(schema, key);
    const p = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (sub === false) {
      out.push(p);
      if (hints) {
        const hint = closest(key, [...declaredKeys(schema)]);
        if (hint) hints.set(p, hint);
      }
      continue;
    }
    if (sub) unknownKeys(v, sub, p, out, false, hints);
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
  const lcarsVars = reg.ha_lcars_vars ? new Set(reg.ha_lcars_vars) : null;
  const lcardsVars = reg.lcards_palette_vars ? new Set(reg.lcards_palette_vars) : null;
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
  if (tag === 'lcards-astrometrics-card' && reg.astrometrics?.builtin_models) {
    const models = reg.astrometrics.builtin_models;
    const items = astrometricsItems(node);
    items.objects.forEach(({ o, at }) => { if (o?.type === 'model') check(`${at}.src`, builtinOnly(o.src), Object.keys(models), 'built-in model'); });
    const images = reg.astrometrics.builtin_images ?? [];
    items.objects.forEach(({ o, at }) => {
      if (o?.type === 'image') check(`${at}.src`, builtinOnly(o.src), images, 'built-in image');
      if (o?.type === 'sphere' || o?.type === 'ring') check(`${at}.image`, builtinOnly(o.image), images, 'built-in image');
    });
    // A part on a built-in model must be one of its parts
    items.points.forEach(({ p, at }) => {
      if (!isLiteral(p?.part) || !isLiteral(p?.object)) return;
      const host = items.objects.map(({ o }) => o).find((o) => o?.type === 'model' && String(o.id) === p.object);
      const parts = host && typeof host.src === 'string' ? models[host.src] : undefined;
      if (parts) check(`${at}.part`, p.part, parts, `part of ${host.src}`);
    });
  }

  walk(node, '', (value, path) => {
    if (typeof value === 'string') {
      for (const m of value.matchAll(/theme:([a-zA-Z][a-zA-Z0-9._-]*)/g)) {
        if (classifyThemePath(m[1], tokenSet) === 'unknown') out.push({ path, message: `unknown theme token "theme:${m[1]}"${suggest(m[1], reg.theme_tokens).replace('"', '"theme:')}` });
      }
      // CSS variables: HA-LCARS `--lcars-*` and the LCARdS palette `--lcards-*`. A user
      // theme can add more, so only near-misses are reported (`--lcars-ui-primery`), and
      // a palette name under the other prefix (`--lcars-moonlight` for `--lcards-moonlight`).
      for (const m of value.matchAll(/var\(\s*--((lcars|lcards)-([a-z0-9-]+))/g)) {
        const [, name, prefix, rest] = m;
        const own = prefix === 'lcars' ? lcarsVars : lcardsVars;
        const other = prefix === 'lcars' ? lcardsVars : lcarsVars;
        if (!own || own.has(name)) continue;
        const swapped = `${prefix === 'lcars' ? 'lcards' : 'lcars'}-${rest}`;
        const best = other?.has(swapped) ? swapped : closest(name, prefix === 'lcars' ? reg.ha_lcars_vars : reg.lcards_palette_vars);
        const what = prefix === 'lcars' ? 'HA-LCARS variable' : 'LCARdS palette variable';
        if (best) out.push({ path, message: `unknown ${what} "--${name}" (did you mean "--${best}"?)` });
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

/**
 * `action: fly-to` flies an astrometrics card's camera. Outside that card it
 * names the card in `card` and gives a `view` or a `point`; without them it
 * does nothing.
 * @returns {{path: string, message: string}[]}
 */
export function flyToIssues(node, tag) {
  const out = [];
  walk(node, '', (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.action !== 'fly-to') return;
    const inAstro = tag === 'lcards-astrometrics-card';
    if (!inAstro && typeof value.card !== 'string') out.push({ path, message: 'fly-to needs card: the id of the astrometrics card to fly' });
    else if ((!inAstro || value.card !== undefined) && !value.view && !value.point) out.push({ path, message: 'fly-to to another card needs a view or a point' });
  });
  return out;
}

/**
 * Home Assistant's code editor (card dialogs, the raw dashboard editor) reads
 * YAML 1.1 since Home Assistant 2026.8: unquoted on, off, y, n, yes, no (any
 * case) become true / false. A key `true` or a boolean where text belongs is
 * almost always that.
 */
const YAML11_KEY_HINT = 'Home Assistant\'s code editor reads a bare y, on or yes as true and n, off or no as false: quote the key, as "y": 20';
const YAML11_VALUE_HINT = 'Home Assistant\'s code editor reads a bare N, no, off, on, Y or yes as true or false: quote the value, as label: "N"';

/**
 * The value at an ajv instancePath (/a/0/b).
 * @param {any} node
 * @param {string} path
 */
function valueAt(node, path) {
  let v = node;
  for (const part of path.split('/').slice(1)) v = v?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
  return v;
}

/**
 * Astrometrics references (all card-local): each point has exactly one placement
 * form, ids are unique, and every id a reference names exists: points (`at`,
 * `target`, path `points` / `from` / `to`, beam ends, trail `point`, object `at`),
 * objects (`on`, of a kind that carries the form) and views (`camera.view`, an
 * action's `view`). Generated label points (`<object>.ring.<deg>`, `.col.`, `.row.`)
 * count as points. A system's points and objects (`type: system`) are checked
 * with the card's own: ids are card-wide.
 * @returns {{path: string, severity: 'error'|'warning', message: string}[]}
 */
export function astrometricsIssues(node) {
  const out = [];
  const err = (path, message) => out.push({ path, severity: 'error', message });
  const warn = (path, message) => out.push({ path, severity: 'warning', message });
  const { points, objects } = astrometricsItems(node);
  const views = node.camera?.views && typeof node.camera.views === 'object' ? node.camera.views : {};

  /** @type {Map<string, any>} object id -> config (generated ids type#n as the runtime makes them) */
  const objectIds = new Map();
  const counts = {};
  objects.forEach(({ o, at }) => {
    if (!o || typeof o !== 'object') return;
    counts[o.type] = (counts[o.type] ?? 0) + 1;
    const id = o.id === undefined || o.id === null || o.id === '' ? `${o.type}#${counts[o.type]}` : String(o.id);
    if (objectIds.has(id)) warn(`${at}.id`, `two objects with id "${id}": references use the later one`);
    objectIds.set(id, o);
  });
  const pointIds = new Set();
  points.forEach(({ p, at }) => {
    if (!p || typeof p !== 'object' || p.id === undefined) return;
    const id = String(p.id);
    if (pointIds.has(id)) err(`${at}.id`, `two points with id "${id}"`);
    pointIds.add(id);
  });
  const generated = /^(.+)\.(ring|col|row)\.[\d.]+$/;
  const isPoint = (ref) => pointIds.has(ref) || (generated.test(ref) && objectIds.has(generated.exec(ref)[1]));
  const nearPoint = (ref) => suggest(ref, [...pointIds]);
  /** A point reference: an id that must exist, or [x, y, z] */
  const pointRef = (path, ref) => {
    if (isLiteral(ref) && !isPoint(ref)) err(path, `no point "${ref}"${nearPoint(ref)}`);
  };
  const viewRef = (path, ref) => {
    if (isLiteral(ref) && !Object.prototype.hasOwnProperty.call(views, ref)) err(path, `no view "${ref}" in camera.views${suggest(ref, Object.keys(views))}`);
  };
  const actionViews = (path, cfg) => {
    for (const key of ['tap_action', 'hold_action']) {
      if (cfg?.[key]?.view !== undefined) viewRef(`${path}.${key}.view`, cfg[key].view);
    }
  };
  const userStyles = node.labels?.styles && typeof node.labels.styles === 'object' ? Object.keys(node.labels.styles) : [];
  const styleNames = [...LABEL_STYLE_NAMES, ...userStyles];
  const isStyle = (name) => styleNames.includes(name);
  const isDome = (o) => o?.type === 'grid' && (o.shape === 'dome' || o.shape === 'sphere');
  const isGlobe = (o) => o?.type === 'sphere' || (o?.type === 'grid' && o.shape === 'sphere');
  /** A distance range that can never show (points and objects) */
  const rangeIssues = (at, c) => {
    const lo = Number(c.min_distance);
    const hi = Number(c.max_distance);
    if (c.min_distance !== undefined && c.max_distance !== undefined && Number.isFinite(lo) && Number.isFinite(hi) && lo >= hi) {
      warn(`${at}.min_distance`, `min_distance (${lo}) is not below max_distance (${hi}): it never shows`);
    }
    if (Array.isArray(c.fade) && c.fade.length === 2 && Number(c.fade[0]) > Number(c.fade[1])) warn(`${at}.fade`, 'fade is [start, end]: start nearer than end');
  };

  points.forEach(({ p, at }) => {
    if (!p || typeof p !== 'object') return;
    const forms = PLACEMENT_FORMS.filter(f => p[f] !== undefined);
    if (forms.length === 0 && p.part === undefined) err(at, `point "${p.id}" has no position (one of ${PLACEMENT_FORMS.join(', ')}, or part)`);
    if (p.part !== undefined && forms.some((f) => f !== 'xyz')) err(`${at}.part`, `part places the point on a model part (xyz is an offset from it); drop ${forms.filter((f) => f !== 'xyz').join(', ')}`);
    if (forms.length > 1) err(at, `point "${p.id}" has more than one position (${forms.join(', ')}); use one`);
    if (p.at !== undefined) pointRef(`${at}.at`, p.at);
    for (const f of ['xyz', 'polar', 'latlon', 'altaz']) {
      const b = p[f];
      if (b && typeof b === 'object' && !Array.isArray(b) && !b.entity && !p.entity) {
        err(`${at}.${f}`, `${f} reads an entity: give it entity:, or the point an entity`);
      }
    }
    if (typeof p.style === 'string' && !isStyle(p.style)) {
      warn(`${at}.style`, `no label style "${p.style}" (built-in: ${LABEL_STYLE_NAMES.join(', ')}; or declare it in labels.styles)${suggest(p.style, styleNames)}`);
    }
    if (p.object !== undefined && isLiteral(p.object)) {
      const host = objectIds.get(p.object);
      if (!host) err(`${at}.object`, `no object "${p.object}"${suggest(p.object, [...objectIds.keys()])}`);
      else if (p.latlon !== undefined && !isGlobe(host)) warn(`${at}.object`, `latlon stands on a sphere; "${p.object}" is a ${host.type}${host.shape ? ` (${host.shape})` : ''}`);
      else if ((p.altaz !== undefined || p.sky !== undefined) && !isDome(host)) warn(`${at}.object`, `${p.sky !== undefined ? 'sky' : 'altaz'} stands on a dome grid; "${p.object}" is a ${host.type}${host.shape ? ` (${host.shape})` : ''}`);
      else if (p.part !== undefined && host.type !== 'model') err(`${at}.part`, `part needs a model object; "${p.object}" is a ${host.type}`);
      else if (p.cell !== undefined && !(host.type === 'grid' && (host.shape ?? 'plane') === 'plane')) err(`${at}.object`, `cell needs a plane grid; "${p.object}" is a ${host.type}${host.shape ? ` (${host.shape})` : ''}`);
    } else if (p.cell !== undefined || p.latlon !== undefined || p.altaz !== undefined || p.sky !== undefined || p.part !== undefined) {
      const form = ['cell', 'latlon', 'altaz', 'sky', 'part'].find(f => p[f] !== undefined);
      err(at, `${form} needs object: (the object it stands on)`);
    }
    rangeIssues(at, p);
    actionViews(at, p);
  });

  objects.forEach(({ o, at, system }) => {
    if (!o || typeof o !== 'object') return;
    if (o.at !== undefined) pointRef(`${at}.at`, o.at);
    if (o.face === 'motion' && !(typeof o.at === 'string' && o.at !== '')) warn(`${at}.face`, 'face: motion turns the object along its point\'s travel: give it at: a point id');
    if (o.type === 'system') {
      if (system !== undefined) err(at, `a system cannot hold another system (one level: "${system.id ?? 'system'}" holds "${o.id ?? 'system'}")`);
      else if (o.scale === undefined && typeof o.units === 'string' && UNIT_NAMES.includes(o.units) && node.units === undefined) {
        err(`${at}.units`, `units: ${o.units} needs the card's own units (units: ly at the top of the card), or give the system a scale`);
      }
    }
    // E6 effects: settings that silently do nothing
    if (o.type === 'sphere' && o.fill_effect && o.image !== undefined) warn(`${at}.image`, 'fill_effect paints the body: image is not shown');
    if (['ring', 'path', 'beam', 'trail'].includes(o.type) && o.flow_speed && !o.pulse && !(o.type !== 'beam' && Array.isArray(o.dash))) {
      warn(`${at}.flow_speed`, 'flow_speed moves dashes or pulses: this line has neither (add dash or pulse)');
    }
    for (const key of ['ring_labels', 'axis_labels']) {
      const st = o[key]?.style;
      if (typeof st === 'string' && !isStyle(st)) warn(`${at}.${key}.style`, `no label style "${st}" (built-in: ${LABEL_STYLE_NAMES.join(', ')}; or declare it in labels.styles)${suggest(st, styleNames)}`);
    }
    if (o.type === 'path' || o.type === 'beam') {
      for (const key of ['from', 'to']) if (o[key] !== undefined) pointRef(`${at}.${key}`, o[key]);
    }
    if (o.type === 'trail' && o.point !== undefined) pointRef(`${at}.point`, o.point);
    if (o.type === 'path' && Array.isArray(o.points)) o.points.forEach((r, k) => pointRef(`${at}.points[${k}]`, r));
    if (o.type === 'path' && o.object !== undefined && isLiteral(o.object) && !objectIds.has(o.object)) err(`${at}.object`, `no object "${o.object}"${suggest(o.object, [...objectIds.keys()])}`);
    rangeIssues(at, o);
    actionViews(at, o);
  });

  for (const [name, v] of Object.entries(views)) {
    if (v?.target !== undefined) pointRef(`camera.views.${name}.target`, v.target);
  }
  if (node.camera?.view !== undefined) viewRef('camera.view', node.camera.view);
  const warps = node.camera?.warp === true || Object.values(views).some((v) => v?.warp === true)
    || points.some(({ p }) => p?.view?.warp === true) || objects.some(({ o }) => o?.view?.warp === true);
  if (warps && !node.backdrop?.stars && !node.backdrop?.dust) warn('backdrop', 'warp streaks the stars and dust: add backdrop.stars or backdrop.dust');
  return out;
}

/**
 * Every point and object of an astrometrics card with its path: the card's
 * own and each system's (`objects[2].points[0]`), and the system holding it.
 * @returns {{ points: { p: any, at: string, system?: any }[], objects: { o: any, at: string, system?: any }[] }}
 */
export function astrometricsItems(node) {
  const points = [];
  const objects = [];
  (Array.isArray(node.points) ? node.points : []).forEach((p, i) => points.push({ p, at: `points[${i}]` }));
  const walkObjects = (list, base, system) => {
    list.forEach((o, i) => {
      const at = `${base}objects[${i}]`;
      objects.push({ o, at, ...(system ? { system } : {}) });
      if (o?.type !== 'system') return;
      (Array.isArray(o.points) ? o.points : []).forEach((p, k) => points.push({ p, at: `${at}.points[${k}]`, system: o }));
      walkObjects(Array.isArray(o.objects) ? o.objects : [], `${at}.`, o);
    });
  };
  walkObjects(Array.isArray(node.objects) ? node.objects : [], '', undefined);
  return { points, objects };
}

/** Only `builtin:` sources are checked against the registry (paths and media IDs are the user's). */
function builtinOnly(source) {
  return typeof source === 'string' && source.startsWith('builtin:') ? source : undefined;
}

/** ` (did you mean "x"?)` for a close match, else ''. */
function suggest(value, list) {
  const best = closest(value, list);
  return best ? ` (did you mean "${best}"?)` : '';
}

/** The entry of `list` closest to `value`, when it is close enough to be a typo; else null. */
function closest(value, list) {
  let best = null;
  let bestScore = Infinity;
  for (const candidate of list) {
    const d = distance(value.toLowerCase(), candidate.toLowerCase());
    if (d < bestScore) { bestScore = d; best = candidate; }
  }
  return best && bestScore <= Math.max(2, Math.floor(value.length / 4)) ? best : null;
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
 *   code: schema | unknown-key | msd-canvas | legacy-format | registry | reference
 */

/**
 * @param {{ entries: {tag: string, schema: object}[], registries?: object }} opts
 * @returns {{ tags: string[], validateConfig: (config: any) => Issue[] }}
 */
export function createConfigValidator({ entries, registries = null }) {
  // validateFormats: false silences HA-specific formats (entity, font-family, color).
  // discriminator: a oneOf keyed by `type` (astrometrics objects) reports only the matching branch.
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false, discriminator: true, verbose: true });
  // Template strings are evaluated at render time, so `pattern` only applies to literal values
  // (the same rule as CoreValidationService).
  ajv.removeKeyword('pattern');
  ajv.addKeyword({
    keyword: 'pattern',
    type: 'string',
    schemaType: 'string',
    validate: (pattern, data) => isTemplateString(data) || new RegExp(pattern, 'u').test(data),
  });
  // `discriminatedBy` (CoreValidationService's own keyword): a value's schema picked by a
  // sibling's value, e.g. an animation's `params` by its `preset`. Unknown names pass
  // (user packs add presets; registryIssues reports them).
  const bySchema = new WeakMap();
  ajv.addKeyword({
    keyword: 'discriminatedBy',
    schemaType: 'object',
    validate: function discriminated(spec, data, _parent, cxt) {
      const name = cxt?.parentData?.[spec.field];
      const sub = typeof name === 'string' && Object.prototype.hasOwnProperty.call(spec.schemas ?? {}, name) ? spec.schemas[name] : null;
      if (!sub) return true;
      let check = bySchema.get(sub);
      // The runtime's oneOf passes when any branch matches (_validateOneOf): the same here
      if (!check) bySchema.set(sub, check = ajv.compile(oneOfAsAnyOf(sub)));
      if (check(data)) return true;
      discriminated.errors = check.errors.map(e => ({ ...e, instancePath: `${cxt.instancePath}${e.instancePath}` }));
      return false;
    },
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
    // A blank canvas has no size of its own: anchors and overlays need a view_box.
    if (tag === 'lcards-msd-card' && node.msd?.base_svg?.source === 'none' && !Array.isArray(node.msd?.view_box)) {
      add('error', 'msd-canvas', 'msd.view_box', 'base_svg.source "none" needs a view_box [x, y, w, h]');
    }
    const validate = compiled.get(tag);
    if (!validate) {
      // A custom:lcards-* type no card, view or strategy registers (e.g. lcards-msd for
      // lcards-msd-card): Home Assistant shows "Custom element doesn't exist"
      const known = [...compiled.keys()];
      const prefixed = known.find(k => k.startsWith(`${tag}-`)); // lcards-msd -> lcards-msd-card
      add('error', 'unknown-type', 'type', `unknown LCARdS type "custom:${tag}"${prefixed ? ` (did you mean "custom:${prefixed}"?)` : suggest(tag, known)}`);
      return issues;
    }

    const migrator = { 'lcards-chart': migrateChartConfig, 'lcards-data-grid': migrateDataGridConfig }[tag];
    if (migrator) {
      const { changed, notes } = migrator(node);
      if (changed) add('warning', 'legacy-format', '', `legacy ${tag === 'lcards-chart' ? 'chart' : 'data grid'} format (still works; ${notes.join('; ') || 'legacy keys'})`);
    }
    const hints = new Map();
    for (const key of unknownKeys(node, raw.get(tag), '', [], true, hints)) {
      const last = key.split('.').pop();
      const yaml11 = last === 'true' || last === 'false' ? ` (${YAML11_KEY_HINT})` : '';
      add('error', 'unknown-key', key, `unknown key (not in the schema)${hints.has(key) ? ` (did you mean "${hints.get(key)}"?)` : ''}${yaml11}`);
    }
    if (!validate(node)) {
      // A bindable number (a number, { entity, ... } or a template: astrometrics settings) that is
      // none of them: one message instead of one per branch
      const settingPaths = new Set((validate.errors ?? []).filter(e => e.keyword === 'anyOf' && isSettingSchema(e.parentSchema)).map(e => e.instancePath));
      for (const err of validate.errors ?? []) {
        const p = err.instancePath.replace(/^\//, '').replace(/\/(\d+)(?=\/|$)/g, '[$1]').replace(/\//g, '.');
        if (settingPaths.has(err.instancePath)) {
          if (err.keyword === 'anyOf') add('error', 'schema', p, 'must be a number, { entity, ... } to follow an entity, or a template');
          continue;
        }
        if (err.keyword === 'discriminator' && err.params?.error === 'mapping') {
          // A oneOf keyed by type with no branch for this value: name the choices
          const types = (err.parentSchema?.oneOf ?? []).map(b => b?.properties?.type?.const).filter(Boolean);
          add('error', 'schema', `${p}.type`, `unknown type "${err.params.tagValue}" (one of ${types.join(', ')})${suggest(String(err.params.tagValue), types)}`);
          continue;
        }
        // A bare N, no, off, on, y or yes arrives as true/false from Home Assistant's code editor
        const value = valueAt(node, err.instancePath);
        const wantsBoolean = [err.params?.type].flat().includes('boolean');
        const yaml11 = err.keyword === 'type' && typeof value === 'boolean' && !wantsBoolean ? ` (${YAML11_VALUE_HINT})` : '';
        add('error', 'schema', p, `${err.message ?? 'invalid'}${yaml11}`);
      }
    }
    if (registries) {
      for (const r of registryIssues(node, tag, registries)) add('warning', 'registry', r.path, r.message);
    }
    if (tag === 'lcards-astrometrics-card') {
      for (const r of astrometricsIssues(node)) add(r.severity, 'reference', r.path, r.message);
    }
    for (const r of flyToIssues(node, tag)) add('warning', 'reference', r.path, r.message);
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
