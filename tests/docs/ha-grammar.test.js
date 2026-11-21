/**
 * Nothing LCARdS writes, generates or documents uses Home Assistant's old config
 * grammar (reports/ha-grammar-sweep-plan.md, part 1). The old forms still work at
 * runtime for released configs; this keeps them out of what users copy.
 *
 *   card actions   `action: perform-action` + `perform_action:` + `data:` / `target:`
 *                  (old: `call-service`, `service:`, `service_data:`)
 *   automations    `triggers:` / `conditions:` / `actions:`, `- trigger: state`,
 *                  `- action: domain.service` (old: `trigger:` / `condition:` /
 *                  `action:` lists, `- platform: state`, `- service: domain.service`)
 *
 * Scanned: every ```yaml block in doc/ and skills/lcards/, demo/views/*.yaml,
 * doc/gallery/dashboards/*.yaml, the docs playground starters and gallery tiles, the
 * component packs' `examples`, the shell strategy's generated dashboards and the
 * rendered HA-LCARS guide (scripts/lib/ha-lcars-reference.js rewrites the upstream
 * README's old blocks).
 *
 * Not flagged: LCARdS's own `- service: [domain, service, data]` steps in the shot
 * and motion scripts (an array, not Home Assistant grammar), and browser_mod's
 * `fire-dom-event` `browser_mod: { service: ... }` block (browser_mod's own grammar:
 * its handler reads only `service`; it is not an action config itself).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { CARD_STARTERS } from '../../doc/.vitepress/theme/card-demo-starters.js';
import { CARD_GALLERIES } from '../../doc/.vitepress/theme/card-demo-galleries.js';
import { components } from '../../src/core/packs/components/index.js';
import { loadHaLcars, renderGuide, modernizeGuide } from '../../scripts/lib/ha-lcars-reference.js';
import { installJsdom } from '../helpers/jsdom-env.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Pages that name the old aliases on purpose, in prose and tables (their YAML blocks
 * are still checked): the actions reference says `call-service` / `service` /
 * `service_data` still work, and the action handler's architecture page documents
 * how the handler reads them.
 */
const PROSE_ALLOWLIST = new Set([
    'doc/core/actions.md',
    'doc/architecture/subsystems/action-handler.md',
]);

const ACTION_LIST_KEYS = new Set(['actions', 'sequence', 'tap_action_sequence', 'then', 'else', 'default']);

/** Old-grammar findings in one parsed config tree. */
export function grammarIssues(node, path = '') {
    const out = [];
    const walk = (n, p, isAction) => {
        if (Array.isArray(n)) { n.forEach((v, i) => walk(v, `${p}[${i}]`, isAction)); return; }
        if (n === 'call-service') { out.push(`${p}: call-service (use perform-action)`); return; }
        if (!n || typeof n !== 'object') return;
        if (isAction && typeof n.service === 'string') out.push(`${p}.service: use perform_action (or action: in a script)`);
        for (const [k, v] of Object.entries(n)) {
            const kp = p ? `${p}.${k}` : k;
            if (k === 'service_data') out.push(`${kp}: use data`);
            if (['trigger', 'condition', 'action'].includes(k) && Array.isArray(v)) out.push(`${kp}: a list (use ${k}s:)`);
            if ((k === 'triggers' || k === 'trigger') && Array.isArray(v)) {
                v.forEach((t, i) => { if (t && typeof t === 'object' && 'platform' in t) out.push(`${kp}[${i}].platform: use trigger:`); });
            }
            const childIsAction = (/(^|_)action$/.test(k) && v && typeof v === 'object') || (ACTION_LIST_KEYS.has(k) && Array.isArray(v));
            walk(v, kp, childIsAction);
        }
    };
    walk(node, path, false);
    return out;
}

/** Findings in one YAML text; text that does not parse gets a line check instead. */
function yamlIssues(text, where) {
    let docs;
    try {
        docs = yaml.loadAll(text);
    } catch {
        return text.split('\n').flatMap((line, i) =>
            /\bcall-service\b|\bservice_data\s*:/.test(line) ? [`${where}+${i + 1}: ${line.trim()}`] : []);
    }
    return docs.flatMap(d => grammarIssues(d).map(m => `${where}: ${m}`));
}

/** Every ```yaml block of a markdown text, with its 1-based start line. */
function yamlBlocks(md) {
    const blocks = [];
    const lines = md.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const open = /^(\s*)(`{3,}|~{3,})\s*ya?ml\b/.exec(lines[i]);
        if (!open) continue;
        const [, indent, fence] = open;
        const body = [];
        let j = i + 1;
        for (; j < lines.length && !lines[j].trimStart().startsWith(fence); j++) body.push(lines[j].startsWith(indent) ? lines[j].slice(indent.length) : lines[j]);
        blocks.push({ line: i + 1, text: body.join('\n') });
        i = j;
    }
    return blocks;
}

/** Markdown findings: its YAML blocks, plus the old names in prose unless allowlisted. */
function markdownIssues(md, file) {
    const issues = yamlBlocks(md).flatMap(b => yamlIssues(b.text, `${file}:${b.line}`));
    if (!PROSE_ALLOWLIST.has(file)) {
        md.split('\n').forEach((line, i) => {
            if (/\bcall-service\b|\bservice_data\b/.test(line)) issues.push(`${file}:${i + 1}: ${line.trim().slice(0, 80)}`);
        });
    }
    return [...new Set(issues)];
}

function walkFiles(dir, accept, skip = new Set()) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const rel = relative(ROOT, full);
        if (skip.has(rel) || name === 'node_modules') continue;
        if (statSync(full).isDirectory()) out.push(...walkFiles(full, accept, skip));
        else if (accept(name)) out.push(rel);
    }
    return out;
}

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

test('matcher: flags the old grammar', () => {
    const old = yaml.load(`
tap_action:
  action: call-service
  service: light.turn_on
  service_data: { brightness: 10 }
hold_action:
  action: perform-action
  service: light.toggle
right_button_action:
  service: browser_mod.close_popup
automation:
  trigger:
    - platform: state
      entity_id: light.x
  condition: []
  action:
    - service: light.turn_off
`);
    const issues = grammarIssues(old);
    for (const want of ['tap_action.action: call-service', 'tap_action.service:', 'tap_action.service_data:', 'hold_action.service:',
        'right_button_action.service:', 'automation.trigger: a list', 'automation.trigger[0].platform:', 'automation.condition: a list',
        'automation.action: a list', 'automation.action[0].service:']) {
        assert.ok(issues.some(i => i.startsWith(want)), `${want} not flagged in:\n${issues.join('\n')}`);
    }
});

test('matcher: passes the current grammar, LCARdS service steps and browser_mod blocks', () => {
    const current = yaml.load(`
tap_action:
  action: perform-action
  perform_action: light.turn_on
  target: { entity_id: light.x }
  data: { brightness: 10 }
double_tap_action:
  action: fire-dom-event
  browser_mod:
    service: browser_mod.javascript
    data: { code: "1" }
right_button_action:
  action: browser_mod.close_popup
automation:
  triggers:
    - trigger: state
      entity_id: light.x
  conditions: []
  actions:
    - action: light.turn_off
      target: { entity_id: light.x }
shot:
  actions:
    - service: [light, turn_on, { entity_id: light.x }]
sensor:
  - platform: time_date
`);
    assert.deepEqual(grammarIssues(current), []);
});

test('docs and skill markdown: no old grammar', () => {
    const files = [
        ...walkFiles(join(ROOT, 'doc'), n => n.endsWith('.md'), new Set(['doc/public', 'doc/.vitepress', 'doc/node_modules'])),
        ...walkFiles(join(ROOT, 'skills/lcards'), n => n.endsWith('.md')),
    ];
    assert.ok(files.length > 100, `${files.length} markdown files`);
    assert.deepEqual(files.flatMap(f => markdownIssues(read(f), f)), []);
});

test('demo views, gallery dashboards and the skill plugin YAML: no old grammar', () => {
    const files = [
        ...walkFiles(join(ROOT, 'demo/views'), n => /\.ya?ml$/.test(n)),
        ...walkFiles(join(ROOT, 'doc/gallery/dashboards'), n => /\.ya?ml$/.test(n)),
        ...walkFiles(join(ROOT, 'skills/lcards'), n => /\.ya?ml$/.test(n)),
    ];
    assert.ok(files.length > 20, `${files.length} YAML files`);
    assert.deepEqual(files.flatMap(f => yamlIssues(read(f), f)), []);
});

test('skill plugin scripts and data: no call-service or service_data', () => {
    const files = walkFiles(join(ROOT, 'skills/lcards'), n => /\.(m?js|json)$/.test(n));
    const hits = files.flatMap(f => read(f).split('\n').flatMap((line, i) =>
        /\bcall-service\b|\bservice_data\b/.test(line) ? [`${f}:${i + 1}`] : []));
    assert.deepEqual(hits, []);
});

test('docs playground starters and gallery tiles: no old grammar', () => {
    const issues = [];
    for (const [card, starters] of Object.entries(CARD_STARTERS)) {
        for (const s of starters) issues.push(...yamlIssues(s.yaml, `starter ${card}/${s.key ?? s.label}`));
    }
    for (const [name, gallery] of Object.entries(CARD_GALLERIES)) {
        for (const t of gallery.tiles) issues.push(...yamlIssues(t.yaml, `gallery ${name}/${t.label}`));
    }
    assert.deepEqual(issues, []);
});

test('component pack examples: no old grammar', () => {
    let seen = 0;
    const issues = [];
    for (const [name, def] of Object.entries(components)) {
        for (const [key, example] of Object.entries({ ...def?.examples, ...def?.metadata?.examples })) {
            seen++;
            issues.push(...grammarIssues(example, `${name}.examples.${key}`));
        }
    }
    assert.ok(seen >= 4, `${seen} examples`);
    assert.deepEqual(issues, []);
});

test('rendered HA-LCARS guide: no old grammar (the upstream README is rewritten)', () => {
    const { snapshot, guide } = loadHaLcars();
    const md = renderGuide(snapshot, guide);
    assert.deepEqual(markdownIssues(md, 'references/ha-lcars/guide.md'), []);
    assert.match(md, /triggers:\n {2}- trigger: homeassistant\n {4}event: start\n {2}conditions: \[\]\n {2}actions:\n {2}- action: frontend\.set_theme\n {4}data:\n {6}name: LCARS Default/);
    assert.match(md, /action: perform-action\n {2}perform_action: frontend\.reload_themes\n {2}data: \{\}\n {2}target: \{\}/);
});

test('modernizeGuide: rewrites only the known blocks, leaves changed upstream text alone', () => {
    const automation = [
        '- alias: Set Default Theme', "  description: ''", '  trigger:', '  - event: start', '    platform: homeassistant',
        '  condition: []', '  action:', '  - data:', '      name: LCARS Default', '    service: frontend.set_theme',
    ].join('\n');
    const out = modernizeGuide(`\`\`\`yaml\n${automation}\n\`\`\``);
    assert.deepEqual(yaml.load(out.replace(/```(yaml)?/g, '')), [{
        alias: 'Set Default Theme', description: '',
        triggers: [{ trigger: 'homeassistant', event: 'start' }],
        conditions: [],
        actions: [{ action: 'frontend.set_theme', data: { name: 'LCARS Default' } }],
    }]);

    // An upstream variant the rewrite does not know stays exactly as it was.
    const changed = automation.replace('event: start', 'event: shutdown');
    assert.equal(modernizeGuide(changed), changed);
    const unrelated = 'tap_action:\n  action: toggle\nservice: not.an_action';
    assert.equal(modernizeGuide(unrelated), unrelated);
    // call-service + service on adjacent lines at the same indent only.
    assert.equal(modernizeGuide('x:\n    action: call-service\n    service: a.b\n    data: {}'), 'x:\n    action: perform-action\n    perform_action: a.b\n    data: {}');
    assert.equal(modernizeGuide('action: call-service\n  service: a.b'), 'action: call-service\n  service: a.b');
});

let env;
let strategy;
before(async () => {
    env = installJsdom();
    // Lit's node build reads these constructors as globals.
    for (const k of ['Document', 'CSSStyleSheet', 'ShadowRoot']) globalThis[k] ??= env.dom.window[k];
    ({ LCARdSShellDashboardStrategy: strategy } = await import('../../src/strategies/lcards-shell-strategy.js'));
});
after(() => env?.restore());

test('shell strategy output: no old grammar', async () => {
    const hass = {
        states: {
            'input_select.rooms': { state: 'Bridge', attributes: { options: ['Bridge'] } },
            'input_text.area': { state: '' },
        },
        areas: { bridge: { area_id: 'bridge', name: 'Bridge' } },
    };
    const issues = [];
    for (const config of [{}, { room_selector_entity: 'input_select.rooms', page_selector_entity: 'input_select.rooms' }, { room_selector_entity: 'input_text.area' }]) {
        issues.push(...grammarIssues(await strategy.generate(config, hass), JSON.stringify(config)));
    }
    assert.deepEqual(issues, []);
});
