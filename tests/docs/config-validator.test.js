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
    assert.ok(m.includes('error views[0].cards[0].text.name.colour: unknown key (not in the schema) (did you mean "color"?)'), m.join('\n'));
    assert.ok(m.some(x => x.startsWith('error views[0].cards[0].height:')), m.join('\n'));
});

test('processor settings are checked against their own type (2026-11-02: one shared list before)', () => {
    const m = messages(check({ type: 'custom:lcards-button', data_sources: { t: { entity: 'sensor.temp', processing: {
        s: { type: 'smooth', method: 'wobbly', alpha: 7 },
        r: { type: 'round', alpha: 0.2, precision: 1 },
        d: { type: 'duration' },
        ok: { type: 'scale', curve: 'sigmoid' },
    } } } }));
    assert.ok(m.includes('error data_sources.t.processing.r.alpha: unknown key (not in the schema)'), m.join('\n'));
    assert.ok(m.some(x => x.startsWith('error data_sources.t.processing.s.method:')), m.join('\n'));
    assert.ok(m.some(x => x.startsWith('error data_sources.t.processing.s.alpha:')), m.join('\n'));
    assert.ok(m.some(x => x.startsWith("error data_sources.t.processing.d: must have required property 'condition'")), m.join('\n'));
    assert.ok(!m.some(x => x.includes('processing.ok')), 'scale with only a curve is valid (ranges default)');
});

test('an unknown custom:lcards-* type is an error, with the full type suggested', () => {
    // It used to pass silently: there is no schema to check it against
    const m = messages(check({ type: 'custom:lcards-msd', msd: { base_svg: { source: 'builtin:ncc-1701-kelvin' } } }));
    assert.ok(m.includes('error type: unknown LCARdS type "custom:lcards-msd" (did you mean "custom:lcards-msd-card"?)'), m.join('\n'));
    const typo = messages(check({ type: 'custom:lcards-buton' }));
    assert.ok(typo.some(x => x.includes('unknown LCARdS type "custom:lcards-buton" (did you mean "lcards-button"?)')), typo.join('\n'));
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

test('names that are valid are not flagged: component presets, media-source sounds, theme functions, templates, envelope effects, uix/card_mod styling', () => {
    const issues = check([
        { type: 'custom:lcards-button', component: 'alert', preset: 'condition_red' },
        { type: 'custom:lcards-button', component: 'dpad', preset: 'lozenge' },
        { type: 'custom:lcards-button', component: 'alert', ranges: [{ preset: 'condition_red', above: 80 }, { preset: 'mine', below: 10 }], alert: { custom_presets: { mine: {} } } },
        { type: 'custom:lcards-button', preset: '{{ states("input_select.preset") }}', sounds: { card_tap: 'media-source://media_source/local/beep.mp3' } },
        { type: 'custom:lcards-button', style: { card: { color: { background: { default: 'theme:alpha(colors.ui.primary, 0.5)' } } } } },
        { type: 'custom:lcards-elbow', elbow: { type: 'header-left' }, background_animation: { inset: 'auto', effects: [{ preset: 'grid' }] } },
        { type: 'custom:lcards-msd-card', msd: { base_svg: { source: '/local/my-ship.svg' } } },
        { type: 'custom:lcards-button', uix: { style: ':host { opacity: 0.5; }' }, card_mod: { class: 'header-left' } },
    ]);
    assert.deepEqual(messages(issues), []);
});

test('CSS variables: HA-LCARS and LCARdS palette near-misses and prefix mix-ups warn; real and user-theme names pass', () => {
    assert.ok(registries.ha_lcars_vars.includes('lcars-ui-primary'));
    assert.ok(registries.ha_lcars_vars.includes('lcars-card-top-color'));
    const m = messages(check({
        type: 'custom:lcards-button',
        style: { card: { color: { background: {
            default: 'var(--lcars-ui-primery)',
            active: 'alpha(var(--lcars-card-top-color), 0.5)',
            inactive: 'var(--lcars-my-own-theme-colour, #333)',
            unavailable: 'var(--lcards-moonlight)',
        } } } },
        text: { name: { color: { default: 'var(--lcars-moonlight)', active: 'var(--lcards-orange-meduim)' } } },
    }));
    assert.deepEqual(m, [
        'warning style.card.color.background.default: unknown HA-LCARS variable "--lcars-ui-primery" (did you mean "--lcars-ui-primary"?)',
        'warning text.name.color.default: unknown HA-LCARS variable "--lcars-moonlight" (did you mean "--lcards-moonlight"?)',
        'warning text.name.color.active: unknown LCARdS palette variable "--lcards-orange-meduim" (did you mean "--lcards-orange-medium"?)',
    ]);
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
    const none = messages(check({ type: 'custom:lcards-msd-card', msd: { base_svg: { source: 'none' } } }));
    assert.ok(none.includes('error msd.view_box: base_svg.source "none" needs a view_box [x, y, w, h]'), none.join('\n'));
    assert.deepEqual(messages(check({ type: 'custom:lcards-msd-card', msd: { base_svg: { source: 'none' }, view_box: [0, 0, 400, 200] } })), []);
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

test('discriminatedBy: animation params and background config are checked by their preset or type, like the runtime', () => {
    const issues = messages(check({
        type: 'custom:lcards-button',
        animations: [
            { trigger: 'on_load', preset: 'pulse', params: { scale: 'big' } },
            { trigger: 'on_load', preset: 'my-pack-preset', params: { anything: 'goes' } },
        ],
        background_animation: [{ preset: 'grid', config: { line_spacing: true } }], // any string is a template there
    }));
    assert.ok(issues.some(m => m.startsWith('error animations[0].params.scale')), issues.join('\n'));
    assert.ok(!issues.some(m => m.includes('animations[1].params')), 'an unknown preset (user pack) is not schema-checked');
    assert.ok(issues.some(m => m.startsWith('error background_animation[0].config.line_spacing')), issues.join('\n'));
    // Reactive values and overlapping oneOf branches pass, as at runtime (CoreValidationService reads oneOf as anyOf)
    assert.deepEqual(messages(check({
        type: 'custom:lcards-button',
        background_animation: [{ preset: 'grid', config: { color: 'var(--lcards-blue)', line_spacing: { map_range: { entity_id: 'input_number.x', input: [0, 1], output: [10, 40] } } } }],
    })), []);
});

test('grid_options.columns: any width up to the section (12 per section column, 48 in a column_span: 4 section)', () => {
    assert.deepEqual(messages(check({ type: 'custom:lcards-button', grid_options: { columns: 48, rows: 2 } })), []);
});

test('animation duration and delay have no upper limit (slow background loops)', () => {
    assert.deepEqual(messages(check({
        type: 'custom:lcards-elbow', elbow: { type: 'header-left' },
        animations: [
            { trigger: 'on_load', preset: 'custom', target: 'background', effect: 0, params: { surface_rotate_x: [0, 360], duration: 20000, loop: true } },
            { trigger: 'on_load', preset: 'pulse', duration: 60000, delay: 15000 },
        ],
    })), []);
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

test('fly-to: another card needs card and a view or point; inside astrometrics a bare fly-to is fine', () => {
    const button = (tap_action) => ({ type: 'custom:lcards-button', preset: 'lozenge', tap_action });
    assert.deepEqual(messages(check(button({ action: 'fly-to', card: 'galaxy', point: 'earth', duration: 2000 }))), []);
    assert.deepEqual(messages(check(button({ action: 'fly-to', view: 'top' }))), ['warning tap_action: fly-to needs card: the id of the astrometrics card to fly']);
    assert.deepEqual(messages(check(button({ action: 'fly-to', card: 'galaxy' }))), ['warning tap_action: fly-to to another card needs a view or a point']);
    const astro = {
        type: 'custom:lcards-astrometrics-card',
        points: [
            { id: 'a', xyz: [0, 0, 0], tap_action: { action: 'fly-to' } },
            { id: 'b', xyz: [1, 0, 0], tap_action: { action: 'fly-to', card: 'other', point: 'x' } },
        ],
        camera: { buttons: { position: 'top-left', zoom: false }, drag: 'pan', pan: 'ground', zoom_to: 'target', zoom_step: 1.5, double_tap: 'none', limits: { target: { radius: 50 } } },
    };
    assert.deepEqual(messages(check(astro)), []);
    assert.deepEqual(messages(check({ ...astro, camera: { limits: { target: false } } })), []);
    assert.ok(messages(check({ ...astro, camera: { zoom_step: 1 } })).some(m => m.startsWith('error camera.zoom_step')));
});

test('astrometrics face: motion needs an object at a point (M3)', () => {
    const astro = (extra) => ({ type: 'custom:lcards-astrometrics-card', ...extra });
    const out = messages(check(astro({
        points: [{ id: 'ship', xyz: [10, 0, 0] }],
        objects: [{ type: 'sphere', at: 'ship', radius: 1, face: 'motion' }, { type: 'sphere', at: [0, 0, 0], radius: 1, face: 'motion' }, { type: 'sphere', radius: 1, face: 'motion' }]
    })));
    assert.deepEqual(out, [
        'warning objects[1].face: face: motion turns the object along its point\'s travel: give it at: a point id',
        'warning objects[2].face: face: motion turns the object along its point\'s travel: give it at: a point id'
    ]);
    assert.ok(messages(check(astro({ objects: [{ type: 'sphere', face: 'sideways' }] }))).some((m) => m.startsWith('error objects[0].face: no point "sideways"')));
    // hide_in_systems: a list names systems
    const sys = { type: 'system', id: 'sol_system', units: 'km', points: [], objects: [] };
    assert.deepEqual(messages(check(astro({ units: 'ly', objects: [sys, { type: 'ring', radius: 5, hide_in_systems: ['sol_system'] }] }))), []);
    assert.ok(messages(check(astro({ units: 'ly', objects: [sys, { type: 'ring', radius: 5, hide_in_systems: ['sol'] }] }))).some((m) => m.startsWith('error objects[1].hide_in_systems[0]: no system "sol"')));
    // face: a point id turns the object toward it
    assert.deepEqual(messages(check(astro({ points: [{ id: 'far', xyz: [10, 0, 0] }], objects: [{ type: 'grid', shape: 'well', face: 'far' }] }))), []);
});

test('astrometrics nebula: shapes and dust only with render: volume (NB1)', () => {
    const astro = (extra) => ({ type: 'custom:lcards-astrometrics-card', ...extra });
    const neb = { type: 'nebula', shape: 'shell', stretch: 0.5, dust: { count: 2 }, core: { color: 'var(--lcars-ice)' }, clouds: [{ xyz: [0, 0, 0], size: [40, 10, 20], rotation: [0, 30, 0] }, { radius: 5, dust: true }] };
    assert.deepEqual(messages(check(astro({ objects: [{ ...neb, render: 'volume' }] }))), []);
    assert.deepEqual(messages(check(astro({ objects: [neb] }))), [
        'warning objects[0].shape: shape applies only with render: volume (this nebula draws puffs)',
        'warning objects[0].dust: dust applies only with render: volume (this nebula draws puffs)',
        'warning objects[0].clouds[].dust: clouds[].dust applies only with render: volume (this nebula draws puffs)'
    ]);
    assert.deepEqual(messages(check(astro({ objects: [{ type: 'nebula', shape: 'clouds', stretch: 1 }] }))), [], 'clouds and stretch suit puffs');
    assert.ok(messages(check(astro({ objects: [{ type: 'nebula', render: 'volume', shape: 'ring' }] }))).some((m) => m.startsWith('error objects[0].shape')));
});

test('astrometrics model file_units: needs units where the model is, and no size (UX1 P6c)', () => {
    const astro = (extra) => ({ type: 'custom:lcards-astrometrics-card', ...extra });
    const ship = (extra = {}) => ({ type: 'model', id: 'ship', src: 'builtin:constitution', file_units: 'ft', ...extra });
    assert.deepEqual(messages(check(astro({ units: 'km', objects: [ship()] }))), []);
    assert.deepEqual(messages(check(astro({ objects: [ship()] }))), ['warning objects[0].file_units: file_units needs units for a real size: give the card units (km, au, ly); without them the model is drawn at 50']);
    assert.deepEqual(messages(check(astro({ units: 'km', objects: [ship({ size: 20 })] }))), ['warning objects[0].file_units: file_units sets the real size: size is set, so it does nothing (leave size out for the real size)']);
    // in a system: its units, or the card's when it names neither units nor scale
    assert.deepEqual(messages(check(astro({ units: 'ly', objects: [{ type: 'system', id: 's', units: 'km', objects: [ship()] }] }))), []);
    assert.deepEqual(messages(check(astro({ units: 'km', objects: [{ type: 'system', id: 's', objects: [ship()] }] }))), []);
    assert.equal(messages(check(astro({ units: 'km', objects: [{ type: 'system', id: 's', scale: 0.5, objects: [ship()] }] }))).length, 1);
    // no file_units: a model without size is fine with or without units
    assert.deepEqual(messages(check(astro({ objects: [{ type: 'model', id: 'ship', src: 'builtin:constitution' }] }))), []);
    // length: the same, and file_units beside it does nothing
    const odyssey = (extra = {}) => ({ type: 'model', id: 'ship', src: '/local/odyssey.glb', length: 1061, ...extra });
    assert.deepEqual(messages(check(astro({ units: 'km', objects: [odyssey()] }))), []);
    assert.deepEqual(messages(check(astro({ objects: [odyssey()] }))), ['warning objects[0].length: length needs units for a real size: give the card units (km, au, ly); without them the model is drawn at 50']);
    assert.deepEqual(messages(check(astro({ units: 'km', objects: [odyssey({ size: 1 })] }))), ['warning objects[0].length: length sets the real size: size is set, so it does nothing (leave size out for the real size)']);
    assert.deepEqual(messages(check(astro({ units: 'km', objects: [odyssey({ file_units: 'cm' })] }))), ['warning objects[0].file_units: file_units sets the real size from what the file measures: length is set, so it does nothing']);
    assert.ok(messages(check(astro({ units: 'km', objects: [odyssey({ length: 0 })] }))).some((m) => m.startsWith('error')), 'length must be above 0');
});

test('astrometrics distance: a range that never shows warns, on points and objects (E9)', () => {
    const astro = (extra) => ({ type: 'custom:lcards-astrometrics-card', ...extra });
    const out = messages(check(astro({
        points: [{ id: 'a', xyz: [0, 0, 0], label: 'A', min_distance: 50, max_distance: 20 }],
        objects: [{ type: 'sphere', radius: 5, fade: [100, 10] }, { type: 'ring', radius: 9, min_distance: 10, max_distance: 90 }]
    })));
    assert.deepEqual(out, [
        'warning points[0].min_distance: min_distance (50) is not below max_distance (20): it never shows',
        'warning objects[0].fade: fade is [start, end]: start nearer than end'
    ]);
});

test('astrometrics whole-number settings follow an entity or a template; a plain number must still be whole', () => {
    const astro = (belt) => ({ type: 'custom:lcards-astrometrics-card', objects: [{ type: 'belt', id: 'b', ...belt }] });
    const errors = (c) => messages(check(c)).filter((m) => m.startsWith('error'));
    assert.deepEqual(errors(astro({ count: { entity: 'input_number.rocks', output: [100, 500] } })), []);
    assert.deepEqual(errors(astro({ count: '[[[ return 300 ]]]' })), []);
    assert.deepEqual(errors(astro({ count: 300 })), []);
    assert.ok(errors(astro({ count: 2.5 })).length > 0, 'a plain number must still be whole');
    assert.deepEqual(errors({ type: 'custom:lcards-astrometrics-card', objects: [{ type: 'grid', id: 'g', deform: [{ type: 'wobble', lobes: { entity: 'input_number.lobes' } }] }] }), []);
});

test('astrometrics pair settings: either side can follow an entity or a template', () => {
    const errors = (c) => messages(check(c)).filter((m) => m.startsWith('error'));
    const belt = (radius) => ({ type: 'custom:lcards-astrometrics-card', objects: [{ type: 'belt', id: 'b', radius }] });
    assert.deepEqual(errors(belt([{ entity: 'input_number.a', output: [40, 60] }, 100])), []);
    assert.deepEqual(errors(belt([50, '[[[ return 90 ]]]'])), []);
    assert.ok(errors(belt([50, { entity: 'input_number.a', to: [1, 2] }])).length > 0, 'the old words are unknown keys');
});
