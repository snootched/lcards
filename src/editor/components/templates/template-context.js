/**
 * @fileoverview Template tools shared by the Templates tab and the template
 * sandbox: the evaluator context (the same one a card uses), what a template
 * refers to, the config fields that hold templates, common syntax mistakes and
 * test values. No DOM: tested in node.
 *
 * @module editor/components/templates/template-context
 */

import yaml from 'js-yaml';
import { TemplateDetector } from '../../../core/templates/TemplateDetector.js';
import { TemplateParser } from '../../../core/templates/TemplateParser.js';

/**
 * The evaluator context a card builds (LCARdSCard.processTemplate), so a
 * template evaluates the same in the editor as on the card.
 * @param {Object} opts
 * @param {any} [opts.hass]
 * @param {Object} [opts.config] - The card config
 * @param {Object|null} [opts.entity] - Entity state object (or a test one)
 * @param {Object} [opts.variables] - Overrides merged over config.variables
 * @param {any} [opts.theme] - themeManager.getActiveTheme()
 */
export function templateContext({ hass, config = {}, entity = null, variables = {}, theme } = {}) {
    return {
        entity,
        config,
        hass,
        states: hass?.states,
        variables: { ...(config?.variables || {}), ...variables },
        theme,
        displayFormat: 'friendly',
    };
}

/** A string holds a template the evaluator acts on. */
export function hasTemplate(str) {
    if (typeof str !== 'string' || !str) return false;
    const t = TemplateDetector.detectTemplateTypes(str);
    return t.hasJavaScript || t.hasTokens || t.hasDatasources || t.hasJinja2;
}

/** Template kinds in a string, for chips: 'JavaScript', 'Token', 'Theme', 'Data source', 'Jinja2'. */
export function templateKinds(str) {
    if (typeof str !== 'string') return [];
    const t = TemplateDetector.detectTemplateTypes(str);
    const kinds = [];
    if (t.hasJavaScript) kinds.push('JavaScript');
    if (/\{theme:/.test(str)) kinds.push('Theme');
    if (/\{(?:datasource|ds):/.test(str)) kinds.push('Data source');
    if (/\{(?!theme:|datasource:|ds:|\{|%)[a-z_][\w.]*\}/i.test(str)) kinds.push('Token');
    if (t.hasJinja2) kinds.push('Jinja2');
    return kinds;
}

/**
 * What a template refers to.
 * @param {string} template
 * @param {Object} [opts]
 * @param {string} [opts.entityId] - The card's entity (what `entity` means)
 * @returns {{entities: string[], datasources: string[], themeTokens: string[], variables: string[], usesEntity: boolean}}
 */
export function templateRefs(template, { entityId } = {}) {
    const text = String(template ?? '');
    const entities = new Set();
    const datasources = new Set();
    const themeTokens = new Set();
    const variables = new Set();

    const usesEntity = /\{entity\.|\bentity\s*[.?[]/.test(text);
    if (usesEntity && entityId) entities.add(entityId);
    for (const m of text.matchAll(/\{states\.([a-z_]+)\.([a-z0-9_]+)\./gi)) entities.add(`${m[1]}.${m[2]}`);
    for (const m of text.matchAll(/states\[\s*['"]([a-z_]+\.[a-z0-9_]+)['"]\s*\]/gi)) entities.add(m[1]);
    for (const id of TemplateParser.extractJinja2Entities(text)) entities.add(id);
    for (const m of text.matchAll(/\{(?:datasource|ds):([a-z0-9_]+)/gi)) datasources.add(m[1]);
    for (const m of text.matchAll(/\{theme:([^}]+)\}/g)) themeTokens.add(m[1].trim());
    for (const m of text.matchAll(/\bvariables\.([a-z_][\w]*)/gi)) variables.add(m[1]);

    return {
        entities: [...entities],
        datasources: [...datasources],
        themeTokens: [...themeTokens],
        variables: [...variables],
        usesEntity,
    };
}

/** Common mistakes, each with what to write instead. */
/** @type {Array<[RegExp, string]>} */
const MISTAKES = [
    [/\{\{\s*theme:[^}]*\}\}/g, 'Theme tokens use single braces: {theme:colors.text.onDark}'],
    [/\{(?:datasource|ds)\.[^}]*\}/g, 'Data sources use a colon: {ds:name}'],
    [/\{(?:colors|typography|components|palette)\.[^}]*\}/g, 'Missing the theme: prefix: {theme:colors.text.onDark}'],
];

/**
 * Syntax mistakes in a string.
 * @param {string} str
 * @returns {Array<{match: string, message: string}>}
 */
export function templateMistakes(str) {
    if (typeof str !== 'string') return [];
    const out = [];
    for (const [pattern, message] of MISTAKES) {
        for (const m of str.matchAll(pattern)) out.push({ match: m[0], message });
    }
    return out;
}

/**
 * Every config string that holds a template (or a template mistake), one per
 * field, in config order. Card-level keys that aren't rendered are skipped.
 * @param {Object} config
 * @returns {Array<{path: string, value: string, kinds: string[], mistakes: Array<{match: string, message: string}>}>}
 */
export function templateFields(config) {
    const out = [];
    const skip = new Set(['type', 'rules', 'data_sources', 'grid_options', 'view_layout', 'visibility']);
    const walk = (node, path) => {
        if (typeof node === 'string') {
            const mistakes = templateMistakes(node);
            if (hasTemplate(node) || mistakes.length) out.push({ path, value: node, kinds: templateKinds(node), mistakes });
            return;
        }
        if (Array.isArray(node)) {
            node.forEach((item, i) => walk(item, `${path}[${i}]`));
            return;
        }
        if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) {
                if (!path && skip.has(k)) continue;
                walk(v, path ? `${path}.${k}` : k);
            }
        }
    };
    walk(config ?? {}, '');
    return out;
}

/**
 * Split a field path ('text.label.content', 'segments[2].text') into keys and indexes.
 * @param {string} path
 * @returns {Array<string|number>}
 */
export function pathSegments(path) {
    const out = [];
    for (const part of String(path).split('.')) {
        const m = /^([^[\]]*)((?:\[\d+\])*)$/.exec(part);
        if (!m) { out.push(part); continue; }
        if (m[1]) out.push(m[1]);
        for (const idx of m[2].matchAll(/\[(\d+)\]/g)) out.push(Number(idx[1]));
    }
    return out;
}

/**
 * A copy of `config` with the value at `path` replaced (configs are frozen in HA,
 * so nothing is written in place).
 * @param {Object} config
 * @param {string} path
 * @param {*} value
 */
export function withValueAt(config, path, value) {
    const segs = pathSegments(path);
    const set = (node, i) => {
        if (i === segs.length) return value;
        const key = segs[i];
        const copy = Array.isArray(node) ? [...node] : { ...(node ?? {}) };
        copy[key] = set(node?.[key], i + 1);
        return copy;
    };
    return set(config, 0);
}

/**
 * Test values typed as YAML (a mapping). Empty text is no values.
 * @param {string} text
 * @returns {{value: Object, error: string}}
 */
export function parseTestValues(text) {
    if (!String(text ?? '').trim()) return { value: {}, error: '' };
    try {
        const value = yaml.load(text);
        if (value === null || value === undefined) return { value: {}, error: '' };
        if (typeof value !== 'object' || Array.isArray(value)) return { value: {}, error: 'Write name: value lines (a YAML mapping).' };
        return { value, error: '' };
    } catch (err) {
        return { value: {}, error: `YAML error: ${String(err.message).split('\n')[0]}` };
    }
}

/**
 * Leftover template syntax in a result: what didn't resolve.
 * @param {string} result
 * @returns {string[]} The unresolved pieces
 */
export function unresolvedParts(result) {
    const text = String(result ?? '');
    const parts = [
        ...text.matchAll(/\[\[\[[\s\S]*?\]\]\]/g),
        ...text.matchAll(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g),
        ...text.matchAll(/\{(?:theme|datasource|ds):[^}]*\}/g),
        ...text.matchAll(/\{(?:entity|states|config|variables|hass)\.[^}]*\}/g),
        // A token still being typed: no closing brace yet
        ...text.matchAll(/\{(?:entity|states|config|variables|hass)\.[^{}]*$|\{(?:theme|datasource|ds):[^{}]*$/g),
    ].map(m => m[0]);
    return [...new Set(parts)];
}

/** A state object for a test value, over the live one when there is one. */
function testState(id, live, test) {
    const now = new Date().toISOString();
    return {
        entity_id: id,
        last_changed: now,
        last_updated: now,
        context: { id: 'lcards-test', parent_id: null, user_id: null },
        ...(live ?? {}),
        state: String(test?.state ?? live?.state ?? ''),
        attributes: { ...(live?.attributes ?? {}), ...(test?.attributes ?? {}) },
    };
}

/**
 * Apply test values over the live ones.
 * @param {Object} opts
 * @param {any} opts.hass
 * @param {string} [opts.entityId] - The entity `entity` means
 * @param {Object} [opts.test] - { entity?: {state, attributes}, states?: {id: {state, attributes}}, ds?: {name: value}, variables?: {} }
 * @returns {{hass: any, entity: Object|null, variables: Object, ds: Object, testEntities: string[]}}
 *   `hass` carries the test states (tokens and JavaScript read hass.states)
 */
export function withTestValues({ hass, entityId, test = {} }) {
    const t = test && typeof test === 'object' ? test : {};
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const live = entityId ? hass?.states?.[entityId] ?? null : null;
    const entity = isObj(t.entity) ? testState(entityId || 'test.entity', live, t.entity) : live;

    const overrides = {};
    if (isObj(t.states)) {
        for (const [id, st] of Object.entries(t.states)) overrides[id] = testState(id, hass?.states?.[id], isObj(st) ? st : { state: st });
    }
    if (isObj(t.entity) && entityId) overrides[entityId] = entity;
    const testEntities = Object.keys(overrides);
    const testHass = testEntities.length ? { ...hass, states: { ...(hass?.states ?? {}), ...overrides } } : hass;

    return {
        hass: testHass,
        entity,
        variables: isObj(t.variables) ? t.variables : {},
        ds: isObj(t.ds) ? t.ds : {},
        testEntities,
    };
}
