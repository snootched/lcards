/**
 * The config checker behind the docs validator and the lcards-validate CLI
 * (scripts/lib/config-validator.js, scripts/lib/registries.js,
 * scripts/lcards-validate.mjs, scripts/build-validator.js): it finds LCARdS nodes at
 * any depth, reports schema errors and unknown keys at their path, flags names
 * that don't exist (with suggestions), respects component presets, media-source
 * sounds, open theme namespaces and HA YAML tags, and the standalone bundle behaves
 * like the repo CLI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries, BUILTIN_OPTIONS } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator, collectLcardsNodes } from '../../scripts/lib/config-validator.js';
import { validateTexts, parseConfig } from '../../scripts/lcards-validate.mjs';
import { ANIMATION_PRESET_PARAMS_SCHEMAS } from '../../src/cards/schemas/animation-preset-params-schemas.js';
import { BACKGROUND_ANIMATION_PARAMS_SCHEMAS } from '../../src/cards/schemas/background-animation-params-schemas.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const registries = await buildRegistries();
const checker = createConfigValidator({ entries: getSchemaEntries(), registries });
const check = (config) => checker.validateConfig(config);
const messages = (issues) => issues.map(i => `${i.severity} ${i.path}: ${i.message}`);

test('registries: lists match the runtime sources they come from', () => {
    assert.deepEqual(registries.button_presets, [...BUILTIN_OPTIONS.buttonPresets].sort());
    assert.deepEqual(registries.animation_presets, Object.keys(ANIMATION_PRESET_PARAMS_SCHEMAS).sort(), 'every registered animation preset has a params schema and vice versa');
    assert.deepEqual(registries.background_presets, Object.keys(BACKGROUND_ANIMATION_PARAMS_SCHEMAS).sort());
    assert.ok(registries.component_presets.alert.includes('condition_red'));
    assert.ok(registries.sound_assets.includes('lcards_default_tap'));
    assert.ok(registries.msd_backgrounds.includes('builtin:ncc-1701-a-blue'));
    assert.ok(registries.theme_tokens.length > 100);
});

test('finds LCARdS nodes at any depth: views, stacks, conditional cards, MSD overlays, strategies', () => {
    const config = {
        strategy: { type: 'custom:lcars-shell' },
        views: [{ type: 'custom:lcards-layout-view', cards: [
            { type: 'vertical-stack', cards: [{ type: 'custom:lcards-button' }] },
            { type: 'conditional', card: { type: 'custom:lcards-elbow', elbow: { type: 'header-left' } } },
            { type: 'custom:lcards-msd-card', msd: { view_box: [0, 0, 1, 1], overlays: [{ id: 'c', type: 'control', card: { type: 'custom:lcards-slider' } }] } },
            { type: 'entities' },
        ] }],
    };
    assert.deepEqual(collectLcardsNodes(config).map(n => `${n.tag} @ ${n.path}`), [
        'lcars-shell @ strategy',
        'lcards-layout-view @ views[0]',
        'lcards-button @ views[0].cards[0].cards[0]',
        'lcards-elbow @ views[0].cards[1].card',
        'lcards-msd-card @ views[0].cards[2]',
        'lcards-slider @ views[0].cards[2].msd.overlays[0].card',
    ]);
    assert.deepEqual(check(config), []);
});

test('schema errors and unknown keys are reported at their full path', () => {
    const issues = check({ views: [{ cards: [{ type: 'custom:lcards-button', text: { name: { colour: 'red' } }, height: 'tall' }] }] });
    const m = messages(issues);
    assert.ok(m.includes('error views[0].cards[0].text.name.colour: unknown key (not in the schema)'), m.join('\n'));
    assert.ok(m.some(x => x.startsWith('error views[0].cards[0].height:')), m.join('\n'));
});

test('unknown names are warnings with a suggestion', () => {
    const m = messages(check({
        type: 'custom:lcards-button',
        preset: 'lozange',
        style: { card: { color: { background: { default: 'theme:colors.ui.primary', active: 'theme:colors.alrt.red' } } } },
        animations: [{ trigger: 'on_tap', preset: 'puls' }],
        background_animation: [{ preset: 'starfeild' }],
        filters: [{ mode: 'css', type: 'blurr', value: { blur: 1 } }],
        sounds: { card_tap: 'lcards_default_tapp', card_hold: null },
    }));
    for (const expected of [
        'warning preset: unknown button preset "lozange" (did you mean "lozenge"?)',
        'warning animations[0].preset: unknown animation preset "puls" (did you mean "pulse"?)',
        'warning background_animation[0].preset: unknown background animation preset "starfeild" (did you mean "starfield"?)',
        'warning filters[0].type: unknown filter "blurr" (did you mean "blur"?)',
        'warning sounds.card_tap: unknown sound asset "lcards_default_tapp" (did you mean "lcards_default_tap"?)',
    ]) assert.ok(m.includes(expected), `missing: ${expected}\n${m.join('\n')}`);
    assert.ok(m.some(x => x.includes('unknown theme token "theme:colors.alrt.red"')), m.join('\n'));
    assert.ok(!m.some(x => x.includes('colors.ui.primary')), 'colors.ui.* is an open namespace');
});

test('names that are valid are not flagged: component presets, media-source sounds, theme functions, templates, envelope effects', () => {
    const issues = check([
        { type: 'custom:lcards-button', component: 'alert', preset: 'condition_red' },
        { type: 'custom:lcards-button', component: 'dpad', preset: 'lozenge' },
        { type: 'custom:lcards-button', component: 'alert', ranges: [{ preset: 'condition_red', above: 80 }, { preset: 'mine', below: 10 }], alert: { custom_presets: { mine: {} } } },
        { type: 'custom:lcards-button', preset: '{{ states("input_select.preset") }}', sounds: { card_tap: 'media-source://media_source/local/beep.mp3' } },
        { type: 'custom:lcards-button', style: { card: { color: { background: { default: 'theme:alpha(colors.ui.primary, 0.5)' } } } } },
        { type: 'custom:lcards-elbow', elbow: { type: 'header-left' }, background_animation: { inset: 'auto', effects: [{ preset: 'grid' }] } },
        { type: 'custom:lcards-msd-card', msd: { base_svg: { source: '/local/my-ship.svg' } } },
    ]);
    assert.deepEqual(messages(issues), []);
});

test('range presets on a component must be that component\'s presets', () => {
    const m = messages(check({ type: 'custom:lcards-button', component: 'alert', ranges: [{ preset: 'red', above: 80 }] }));
    assert.ok(m.includes('warning ranges[0].preset: unknown alert component preset "red"'), m.join('\n'));
});

test('MSD without a canvas is an error; legacy chart format a warning', () => {
    const m = messages(check([
        { type: 'custom:lcards-msd-card', msd: { overlays: [] } },
        { type: 'custom:lcards-chart', source: 'sensor.temp' },
    ]));
    assert.ok(m.some(x => x.startsWith('error [0].msd: MSD has neither')), m.join('\n'));
    assert.ok(m.some(x => x.startsWith('warning [1]: legacy chart format')), m.join('\n'));
});

test('schema fixes found by checking real configs: CSS functions for sizes, 0 spacing, symbiont size/anchor, the frame elbow', () => {
    assert.deepEqual(messages(check([
        { type: 'custom:lcards-elbow', width: 'calc(50px + clamp(100px, 12vw, 180px))', height: 'var(--x)', elbow: { type: 'header-left' },
          symbiont: { enabled: true, size: { width: 200, height: '50%' }, anchor: 'center' } },
        { type: 'custom:lcards-layout-card', layout: { margin: 0, padding: '8px', card_margin: 0 } },
        { type: 'custom:lcards-elbow', elbow: { type: 'frame', style: 'segmented', frame: {
            bar_width: 40, left: { enabled: false }, top: { bar_height: '20px' },
            corners: { top_left: { outer_curve: 30 } }, segments: { gap: 6, inner_frame: { bar_width: 12, color: 'theme:colors.ui.primary', right: { enabled: false } } },
        } } },
    ])), []);
    assert.ok(messages(check({ type: 'custom:lcards-layout-card', layout: { margin: 10 } })).length > 0, 'a bare number other than 0 is not CSS');
});

test('CLI: HA YAML tags are placeholders, not errors; whole dashboards and JSON parse', async () => {
    const yamlText = 'views:\n  - cards:\n      - type: custom:lcards-elbow\n        elbow: !include elbow.yaml\n        text: !secret elbow_text\n';
    assert.equal(parseConfig(yamlText).views[0].cards[0].text, '!secret elbow_text');
    assert.deepEqual(await validateTexts([{ name: 'd.yaml', text: yamlText }]), []);
    const json = JSON.stringify({ data: { config: { views: [{ cards: [{ type: 'custom:lcards-button', preset: 'nope' }] }] } } });
    const issues = await validateTexts([{ name: 'lovelace', text: json }]);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].path, 'data.config.views[0].cards[0].preset');
});

function runCli(script, args, input) {
    return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', input });
}

test('CLI exit codes and output: errors 1, warnings 0 (1 with --strict), usage 2; the docs test dashboard is clean', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lcards-cli-'));
    writeFileSync(join(dir, 'err.yaml'), 'type: custom:lcards-button\ntext_fields: {}\n');
    writeFileSync(join(dir, 'warn.yaml'), 'type: custom:lcards-button\npreset: lozange\n');
    const cli = join(ROOT, 'scripts/lcards-validate.mjs');
    const err = runCli(cli, [join(dir, 'err.yaml')]);
    assert.equal(err.status, 1);
    assert.match(err.stdout, /error .*err\.yaml: text_fields \[lcards-button\] unknown key/);
    assert.equal(runCli(cli, [join(dir, 'warn.yaml')]).status, 0);
    assert.equal(runCli(cli, ['--strict', join(dir, 'warn.yaml')]).status, 1);
    assert.equal(runCli(cli, []).status, 2);
    const json = JSON.parse(runCli(cli, ['--json', join(dir, 'warn.yaml')]).stdout);
    assert.deepEqual(json.map(i => i.code), ['registry']);
    const ha = runCli(cli, [join(ROOT, 'tests/ha/dashboard.yaml')]);
    assert.equal(ha.status, 0, ha.stdout);
});

test('standalone bundle: one file, no node_modules, same results as the repo CLI', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lcards-bundle-'));
    const out = join(dir, 'lcards-validate.mjs');
    const b = spawnSync(process.execPath, [join(ROOT, 'scripts/build-validator.js'), `--out=${out}`], { encoding: 'utf8' });
    assert.equal(b.status, 0, b.stderr);
    assert.ok(existsSync(out));
    writeFileSync(join(dir, 'd.yaml'), 'type: custom:lcards-slider\npreset: pills-basik\nanimations:\n  - preset: puls\n');
    const repo = JSON.parse(runCli(join(ROOT, 'scripts/lcards-validate.mjs'), ['--json', join(dir, 'd.yaml')]).stdout);
    const repoRun = runCli(join(ROOT, 'scripts/lcards-validate.mjs'), ['--json', join(dir, 'd.yaml')]);
    const bundled = runCli(out, ['--json', join(dir, 'd.yaml')]);
    assert.equal(bundled.stderr, '');
    assert.equal(bundled.status, repoRun.status);
    assert.deepEqual(JSON.parse(bundled.stdout), repo);
    assert.ok(repo.length >= 2);
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    assert.equal(runCli(out, ['--version']).stdout.trim(), pkg.version);
});
