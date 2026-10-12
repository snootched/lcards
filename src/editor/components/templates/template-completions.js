/**
 * @fileoverview What can be typed next in a template: the completion options for
 * the text before the cursor. Pure (no CodeMirror, no DOM) so it is tested in
 * node; lcards-template-editor wraps it in a CodeMirror completion source.
 *
 * Covers tokens `{entity.…}`, `{states.<entity>.…}`, `{ds:…}`, `{theme:…}`,
 * `{variables.…}`, `{config.…}`, `{hass.user.name}`; Jinja2 entity arguments
 * (`states('…')`, `is_state('…'`, ...); and `entity.attributes.` / `variables.` /
 * `states['…` inside `[[[ JavaScript ]]]`.
 *
 * @module editor/components/templates/template-completions
 */

/**
 * @typedef {Object} CompletionData
 * @property {Object|null} [entity] - The card's entity state object
 * @property {Object} [states] - hass.states
 * @property {string[]} [datasources] - Data source names on the page
 * @property {Object} [themeTokens] - The active theme's token tree
 * @property {Object} [variables] - The card's variables (with test values)
 * @property {Object} [config] - The card config
 */

/**
 * @typedef {Object} Completion
 * @property {string} label
 * @property {string} [apply] - Text to insert (default: label)
 * @property {string} [detail] - Shown beside the label
 * @property {string} [type] - CodeMirror icon type
 */

const ROOTS = [
    { label: 'entity.', detail: "the card's entity", type: 'namespace' },
    { label: 'states.', detail: 'another entity', type: 'namespace' },
    { label: 'ds:', detail: 'data source value', type: 'namespace' },
    { label: 'theme:', detail: 'theme token', type: 'namespace' },
    { label: 'variables.', detail: "the card's variables", type: 'namespace' },
    { label: 'config.', detail: 'card config', type: 'namespace' },
    { label: 'hass.user.name', apply: 'hass.user.name}', detail: 'current user', type: 'property' },
];

/** A short preview of a value for the detail column. */
function preview(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return Array.isArray(value) ? `list (${value.length})` : 'object';
    const s = String(value);
    return s.length > 28 ? `${s.slice(0, 27)}…` : s;
}

/** Keys of an object as options: objects continue with '.', values close the token. */
function keyOptions(obj, close = '}') {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => {
        const nested = value && typeof value === 'object' && !Array.isArray(value);
        return nested
            ? { label: key, apply: `${key}.`, detail: 'object', type: 'namespace' }
            : { label: key, apply: `${key}${close}`, detail: preview(value), type: 'property' };
    });
}

function entityOptions(states, suffix) {
    return Object.entries(states || {}).map(([id, st]) => ({
        label: id,
        apply: `${id}${suffix}`,
        detail: preview(st?.attributes?.friendly_name ?? st?.state),
        type: 'variable',
    }));
}

const stateParts = (entity) => [
    { label: 'state', apply: 'state}', detail: preview(entity?.state), type: 'property' },
    { label: 'attributes.', detail: 'attributes', type: 'namespace' },
];

/** Options inside a `{...}` token, for the token text typed so far. */
function tokenOptions(q, data) {
    if (!/[.:]/.test(q)) return { offset: 0, options: ROOTS };

    for (const prefix of ['ds:', 'datasource:']) {
        if (q.startsWith(prefix)) {
            return {
                offset: prefix.length,
                options: (data.datasources || []).map(name => ({ label: name, apply: `${name}}`, detail: 'data source', type: 'variable' })),
            };
        }
    }

    if (q.startsWith('theme:')) {
        const path = q.slice('theme:'.length).split('.');
        path.pop();
        let node = data.themeTokens;
        for (const seg of path) node = node?.[seg];
        return { offset: q.lastIndexOf('.') >= 'theme:'.length ? q.lastIndexOf('.') + 1 : 'theme:'.length, options: keyOptions(node) };
    }

    if (q.startsWith('states.')) {
        const rest = q.slice('states.'.length);
        const m = /^([a-z_]+\.[a-z0-9_]+)\.(.*)$/i.exec(rest);
        if (!m) return { offset: 'states.'.length, options: entityOptions(data.states, '.') };
        const entity = data.states?.[m[1]];
        const tail = m[2].split('.');
        const base = 'states.'.length + m[1].length + 1;
        if (tail.length === 1) return { offset: base, options: stateParts(entity) };
        if (tail[0] === 'attributes' && tail.length === 2) return { offset: base + 'attributes.'.length, options: keyOptions(entity?.attributes) };
        return null;
    }

    const segs = q.split('.');
    const offset = q.length - segs[segs.length - 1].length;
    const parent = segs.slice(0, -1);
    const [root, ...rest] = parent;

    if (root === 'entity') {
        if (rest.length === 0) return { offset, options: stateParts(data.entity) };
        if (rest.length === 1 && rest[0] === 'attributes') return { offset, options: keyOptions(data.entity?.attributes) };
        return null;
    }
    if (root === 'variables' || root === 'config') {
        let node = root === 'variables' ? data.variables : data.config;
        for (const seg of rest) node = node?.[seg];
        return { offset, options: keyOptions(node) };
    }
    if (root === 'hass') {
        if (rest.length === 0) return { offset, options: [{ label: 'user.', detail: 'current user', type: 'namespace' }] };
        if (rest.length === 1 && rest[0] === 'user') return { offset, options: [{ label: 'name', apply: 'name}', detail: 'user name', type: 'property' }] };
    }
    return null;
}

/**
 * Completion options at the end of `before` (the text before the cursor).
 * @param {string} before
 * @param {CompletionData} data
 * @returns {{from: number, options: Completion[]}|null} `from`: where the replaced text starts in `before`
 */
export function templateCompletions(before, data = {}) {
    // Jinja2 entity arguments: states('…'), is_state('…', …), state_attr('…', …), has_value('…')
    const jinja = /\b(?:states|is_state|state_attr|has_value)\(\s*['"]([\w.]*)$/.exec(before);
    if (jinja) return { from: before.length - jinja[1].length, options: entityOptions(data.states, '') };

    // Inside [[[ JavaScript ]]]
    const jsStart = before.lastIndexOf('[[[');
    if (jsStart >= 0 && before.indexOf(']]]', jsStart) < 0) {
        const js = /(?:\b(entity\.attributes|variables)\.|states\[\s*['"])([\w.]*)$/.exec(before);
        if (!js) return null;
        const word = js[2];
        const options = js[1] === 'entity.attributes' ? keyOptions(data.entity?.attributes, '')
            : js[1] === 'variables' ? keyOptions(data.variables, '')
            : entityOptions(data.states, '');
        return { from: before.length - word.length, options };
    }

    // A {token} (not Jinja2's {{ or {%)
    const token = /\{([^{}\s]*)$/.exec(before);
    if (!token || before[token.index - 1] === '{' || token[1].startsWith('%')) return null;
    const found = tokenOptions(token[1], data);
    if (!found) return null;
    return { from: token.index + 1 + found.offset, options: found.options };
}
