/**
 * YAML that users copy into Home Assistant must mean the same there.
 *
 * Home Assistant's code editor (card dialogs, the raw dashboard editor) reads
 * YAML 1.1 since frontend 20260729 (Home Assistant 2026.8, js-yaml 5,
 * YAML11_SCHEMA): unquoted `on`, `off`, `y`, `n`, `yes`, `no` (any case)
 * are booleans there, so `on: sky` arrives as `true: sky` and `label: N` as
 * `label: false`. LCARdS itself reads YAML 1.2. Every example a user may
 * paste (docs code blocks, the dashboard gallery, live-demo starters and
 * gallery tiles, the user skill) must parse the same both ways: quote such
 * keys and values ("y": 4, label: "N").
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { yaml11Differences } from '../../scripts/lib/yaml-11.js';
import { CARD_STARTERS } from '../../doc/.vitepress/theme/card-demo-starters.js';
import { CARD_GALLERIES } from '../../doc/.vitepress/theme/card-demo-galleries.js';

const root = fileURLToPath(new URL('../../', import.meta.url));

/** Markdown files under a folder (no build output or copied assets) */
const markdown = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (['.vitepress', 'public', 'node_modules'].includes(f)) return [];
    return statSync(p).isDirectory() ? markdown(p) : p.endsWith('.md') ? [p] : [];
});

/**
 * The differences for one YAML text as "path: 1.2 -> 1.1" (empty when it
 * reads the same or does not parse: prose fences and partial snippets are the
 * doc validator's).
 * @param {string} text
 */
const check = (text) => yaml11Differences(text).map((d) => `${d.path}: ${JSON.stringify(d.yaml12)} -> ${JSON.stringify(d.yaml11)}`);

/** Every yaml fence in a markdown file, with its line */
function* fences(file) {
    const md = readFileSync(file, 'utf8');
    for (const m of md.matchAll(/```ya?ml[^\n]*\n([\s\S]*?)```/g)) {
        yield { line: md.slice(0, m.index).split('\n').length, text: m[1] };
    }
}

test('the parser reads YAML 1.1 as Home Assistant does', () => {
    assert.deepEqual(YAML.parse('y: 4\nlabel: N\nstate: on\nquoted: "on"\nlist: [x, y]', { version: '1.1' }),
        { true: 4, label: false, state: true, quoted: 'on', list: ['x', true] });
    assert.deepEqual(YAML.parse('off: 1\nyes: 2', { version: '1.1' }), { false: 1, true: 2 });
    assert.deepEqual(yaml11Differences('a:\n  y: 4\n  label: N\n  ok: "on"\n'), [
        { path: 'a.y', yaml12: 'key "y"', yaml11: 'key "true" or "false"' },
        { path: 'a.label', yaml12: 'N', yaml11: false }
    ]);
    // js-yaml's YAML11_SCHEMA (Home Assistant) reads e1 / E5 as strings; the yaml package reads NaN
    assert.deepEqual(yaml11Differences('grid-area: e1\nother: E5\nsign: +e2\n'), []);
});

test('docs and skill examples mean the same in Home Assistant\'s code editor (YAML 1.1)', () => {
    const files = [...markdown(join(root, 'doc')), ...markdown(join(root, 'skills/lcards'))];
    const bad = [];
    for (const file of files) {
        for (const { line, text } of fences(file)) {
            const d = check(text);
            if (d.length) bad.push(`${relative(root, file)}:${line}: ${d.join(' | ')}`);
        }
    }
    assert.deepEqual(bad, [], 'quote these keys or values (Home Assistant reads unquoted on/off/y/n/yes/no as true/false)');
});

test('dashboard gallery YAML means the same in Home Assistant (YAML 1.1)', () => {
    const dir = join(root, 'doc/gallery/dashboards');
    const bad = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
        const d = check(readFileSync(join(dir, f), 'utf8'));
        if (d.length) bad.push(`${f}: ${d.join(' | ')}`);
    }
    assert.deepEqual(bad, []);
});

test('live-demo starters and gallery tiles mean the same in Home Assistant (YAML 1.1)', () => {
    const bad = [];
    for (const [card, starters] of Object.entries(CARD_STARTERS)) {
        for (const s of starters) {
            const d = check(s.yaml);
            if (d.length) bad.push(`starter ${card} "${s.label}": ${d.join(' | ')}`);
        }
    }
    for (const [name, gallery] of Object.entries(CARD_GALLERIES)) {
        for (const t of gallery.tiles) {
            const d = check(t.yaml);
            if (d.length) bad.push(`gallery ${name} "${t.label}": ${d.join(' | ')}`);
        }
    }
    assert.deepEqual(bad, []);
});
