/**
 * The user-facing skill (skills/lcards/SKILL.md, scripts/build-user-skill.js): the zip
 * has valid skill frontmatter, every path SKILL.md points at exists in the package, the
 * schemas cover every card, and the bundled checker runs. The Claude Code plugin zip
 * carries the same skill with a plugin.json for this version, and the marketplace file
 * points each docs channel at its own plugin zip. The HA-LCARS and UIX references come
 * from their committed snapshots, and the plugin's hook runs the checker on LCARdS YAML.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { loadHaLcars } from '../../scripts/lib/ha-lcars-reference.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
let dir;
let skill;
let plugin;

/** Run the build for one docs channel into `out`; returns the marketplace file. */
function build(out, docsBase) {
    const env = { ...process.env };
    if (docsBase) env.DOCS_BASE = docsBase; else delete env.DOCS_BASE;
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/build-user-skill.js'),
        `--out=${join(out, 'lcards-skill.zip')}`, `--plugin-out=${join(out, 'lcards-plugin.zip')}`,
        `--marketplace-out=${join(out, 'marketplace.json')}`], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(readFileSync(join(out, 'marketplace.json'), 'utf8'));
}

/** Every file under `root`, relative, sorted. */
const listFiles = (root, sub = '') => readdirSync(join(root, sub), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? listFiles(root, join(sub, e.name)) : [join(sub, e.name)]).sort();

before(() => {
    dir = mkdtempSync(join(tmpdir(), 'lcards-skill-test-'));
    build(dir);
    execFileSync('python3', ['-m', 'zipfile', '-e', join(dir, 'lcards-skill.zip'), dir]);
    skill = join(dir, 'lcards');
    plugin = join(dir, 'plugin');
    execFileSync('python3', ['-m', 'zipfile', '-e', join(dir, 'lcards-plugin.zip'), plugin]);
});

test('SKILL.md has the frontmatter a skill needs and names the version it was built for', () => {
    const md = readFileSync(join(skill, 'SKILL.md'), 'utf8');
    const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
    assert.match(fm, /^name: lcards$/m);
    const description = /^description: (.+)$/m.exec(fm)?.[1] ?? '';
    assert.ok(description.length > 100 && description.length < 1024, 'description sized for triggering');
    assert.ok(md.includes(`Built for LCARdS ${version}`));
    assert.ok(!/—/.test(md));
});

// The Agent Skills open standard (agentskills.io/specification): any tool that supports
// it can load the zip, so the frontmatter must keep to its rules.
test('SKILL.md follows the Agent Skills specification', () => {
    const md = readFileSync(join(skill, 'SKILL.md'), 'utf8');
    const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
    const fields = Object.fromEntries(fm.split('\n').map(l => /^([a-z-]+): (.*)$/.exec(l)).filter(Boolean).map(m => [m[1], m[2]]));
    const allowed = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
    assert.deepEqual(Object.keys(fields).filter(k => !allowed.includes(k)), [], 'only spec fields');
    assert.match(fields.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(fields.name.length <= 64);
    assert.equal(fields.name, 'lcards', 'name matches the folder in the zip');
    assert.ok(existsSync(join(dir, fields.name, 'SKILL.md')));
    assert.ok(fields.description.length >= 1 && fields.description.length <= 1024);
    if (fields.compatibility) assert.ok(fields.compatibility.length <= 500);
    assert.ok(md.split('\n').length < 500, 'SKILL.md under 500 lines');
});

test('every path SKILL.md mentions exists in the package', () => {
    const md = readFileSync(join(skill, 'SKILL.md'), 'utf8');
    const paths = [...md.matchAll(/`((?:references|scripts)\/[^`<>*\s]+)`/g)].map(m => m[1].replace(/\/$/, ''));
    assert.ok(paths.length >= 6);
    for (const p of paths) assert.ok(existsSync(join(skill, p)), `${p} missing from the package`);
});

test('schemas for every card, view and strategy; docs for every card', () => {
    const index = JSON.parse(readFileSync(join(skill, 'references/schema/index.json'), 'utf8'));
    for (const { tag } of getSchemaEntries()) {
        const entry = index.cards[tag] ?? index.views[tag] ?? index.strategies[tag];
        assert.ok(entry && existsSync(join(skill, 'references/schema', entry.file)), tag);
    }
    const cards = readdirSync(join(skill, 'references/docs/cards'));
    for (const card of ['button', 'elbow', 'slider-card', 'chart', 'data-grid', 'select-menu', 'msd', 'layout-view']) assert.ok(cards.includes(card), card);
});

test('the bundled checker runs on the bundled gallery', () => {
    const gallery = readdirSync(join(skill, 'references/gallery')).map(f => join(skill, 'references/gallery', f));
    const r = spawnSync(process.execPath, [join(skill, 'scripts/lcards-validate.mjs'), '--strict', ...gallery], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('the plugin zip is the same skill with a plugin.json for this version', () => {
    const manifest = JSON.parse(readFileSync(join(plugin, '.claude-plugin/plugin.json'), 'utf8'));
    assert.equal(manifest.name, 'lcards');
    assert.equal(manifest.version, version, 'plugin.json version drives Claude Code updates');
    assert.ok(manifest.description && !/—/.test(manifest.description));
    const skillFiles = listFiles(skill);
    assert.deepEqual(listFiles(join(plugin, 'skills/lcards')), skillFiles);
    for (const f of ['SKILL.md', 'scripts/lcards-validate.mjs', 'references/schema/index.json']) {
        assert.equal(readFileSync(join(plugin, 'skills/lcards', f), 'utf8'), readFileSync(join(skill, f), 'utf8'), f);
    }
});

test('each docs channel gets its own marketplace pointing at its own plugin zip', () => {
    const channels = [['', 'lcards', '/'], ['/dev/', 'lcards-dev', '/dev/'], [`/v/${version}/`, `lcards-${version}`, `/v/${version}/`]];
    for (const [docsBase, name, base] of channels) {
        const out = mkdtempSync(join(tmpdir(), 'lcards-marketplace-test-'));
        const m = docsBase ? build(out, docsBase) : JSON.parse(readFileSync(join(dir, 'marketplace.json'), 'utf8'));
        assert.equal(m.name, name);
        assert.match(m.name, /^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'valid marketplace name');
        assert.ok(m.owner?.name && m.description && !/—/.test(m.description));
        assert.equal(m.plugins.length, 1);
        const [entry] = m.plugins;
        assert.equal(entry.name, 'lcards', 'entry name = plugin.json name');
        assert.equal(entry.version, undefined, 'plugin.json owns the version');
        assert.deepEqual(entry.source, { source: 'archive', url: `https://lcards.unimatrix01.ca${base}tools/lcards-plugin.zip` });
    }
});

test('HA-LCARS references: every --lcars-* name, every theme, every helper, attributed to a commit', () => {
    const { snapshot } = loadHaLcars();
    const read = (f) => readFileSync(join(skill, 'references/ha-lcars', f), 'utf8');
    const variables = read('variables.md');
    const themes = read('themes.md');
    const guide = read('guide.md');
    for (const md of [variables, themes, guide]) {
        assert.ok(md.includes(snapshot.source.commit.slice(0, 7)) && md.includes('MIT'), 'names the HA-LCARS commit and licence');
        assert.ok(!/\u2014/.test(md), 'no em dashes');
    }
    for (const v of snapshot.vars) assert.ok(variables.includes(`\`--${v}\``), `--${v} in variables.md`);
    for (const t of snapshot.themes) assert.ok(themes.includes(`| ${t.name.replace(/\|/g, '\\|')} |`), `${t.name} in themes.md`);
    for (const h of snapshot.helpers) assert.ok(themes.includes(h.entity_id), h.entity_id);
    for (const cls of ['header-left', 'middle-right', 'footer-contained', 'button-lozenge-left', 'bar-large-right']) assert.ok(guide.includes(cls), cls);
    assert.ok(!/<img|<td|<table/i.test(guide), 'README layout HTML stripped');
});

test('UIX references: the snapshot pages, each attributed (CC BY 4.0), no MkDocs syntax left', () => {
    const meta = JSON.parse(readFileSync(join(ROOT, 'scripts/data/uix/meta.json'), 'utf8'));
    for (const page of meta.pages) {
        const md = readFileSync(join(skill, 'references/uix', page), 'utf8');
        assert.match(md, /^<!-- From the UIX documentation, https:\/\/uix\.lf\.technology\/\S* \(commit [0-9a-f]{7}, .*CC BY 4\.0/, page);
        assert.ok(!/^\s*(!!!|\?\?\?|=== ")/m.test(md) && !/<img/i.test(md) && !/\u2014/.test(md), page);
        for (const [, href] of md.matchAll(/\]\(((?!https?:|#)[^)\s#]+)/g)) {
            assert.ok(existsSync(join(skill, 'references/uix', page, '..', href)), `${page}: link ${href} resolves in the package`);
        }
    }
});

test('the plugin hook runs the checker on LCARdS YAML only: errors block, warnings inform', () => {
    assert.ok(!existsSync(join(plugin, 'evals')), 'the eval suite stays out of the shipped plugin');
    const hooks = JSON.parse(readFileSync(join(plugin, 'hooks/hooks.json'), 'utf8'));
    const [entry] = hooks.hooks.PostToolUse;
    assert.equal(entry.matcher, 'Write|Edit|MultiEdit');
    assert.match(entry.hooks[0].command, /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/check-lcards-yaml\.mjs/);
    for (const c of ['check.md', 'dashboard.md']) {
        const md = readFileSync(join(plugin, 'commands', c), 'utf8');
        assert.match(md, /^---\ndescription: .+\n/, `${c} frontmatter`);
        assert.ok(!/\u2014/.test(md));
    }
    const work = mkdtempSync(join(tmpdir(), 'lcards-hook-test-'));
    const runHook = (name, yaml, tool = 'Write') => {
        const file = join(work, name);
        writeFileSync(file, yaml);
        const r = spawnSync(process.execPath, [join(plugin, 'hooks/check-lcards-yaml.mjs')], {
            input: JSON.stringify({ tool_name: tool, tool_input: { file_path: file } }),
            encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_ROOT: plugin },
        });
        assert.equal(r.status, 0, r.stderr);
        return r.stdout ? JSON.parse(r.stdout) : null;
    };
    const bad = runHook('bad.yaml', 'type: custom:lcards-button\ntext:\n  name:\n    colour: red\n');
    assert.equal(bad.decision, 'block');
    assert.match(bad.reason, /text\.name\.colour .*did you mean "color"/);
    const warn = runHook('warn.yaml', 'type: custom:lcards-button\nstyle:\n  card:\n    color:\n      background:\n        default: var(--lcars-ui-primery)\n', 'Edit');
    assert.equal(warn.decision, undefined);
    assert.match(warn.hookSpecificOutput.additionalContext, /did you mean "--lcars-ui-primary"/);
    assert.equal(runHook('clean.yaml', 'type: custom:lcards-button\npreset: lozenge\n'), null);
    assert.equal(runHook('stock.yaml', 'type: markdown\ncontent: hi\n'), null, 'non-LCARdS YAML is left alone');
    assert.equal(runHook('notes.md', 'type: custom:lcards-button\nbogus: 1\n'), null, 'only .yaml/.yml files');
});
