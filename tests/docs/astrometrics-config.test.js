/**
 * lcards-astrometrics-card config: the schema accepts the three design
 * references, objects are checked against their own type's keys (one oneOf
 * branch per type, picked by `type`), an unknown type names the choices, and
 * the card-local reference checks (one placement form per point, ids that
 * must exist, `on:` of the right kind) report at the right path. The name
 * lists in names.js (schema, registries) match what the runtime draws.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator } from '../../scripts/lib/config-validator.js';
import * as names from '../../src/core/astrometrics/names.js';
import { LABEL_STYLES } from '../../src/core/astrometrics/label-layer.js';
import { MARKER_SIZE } from '../../src/core/astrometrics/markers.js';
import { PATTERNS } from '../../src/core/astrometrics/grid-mesh-material.js';

const registries = await buildRegistries();
const checker = createConfigValidator({ entries: getSchemaEntries(), registries });
const TYPE = 'custom:lcards-astrometrics-card';
const issues = (config) => checker.validateConfig({ type: TYPE, ...config }).map(i => `${i.severity} ${i.code} ${i.path}: ${i.message}`);
const refs = /** @type {any} */ (yaml.load(readFileSync(new URL('../core/fixtures/astro-references.yaml', import.meta.url), 'utf8')));

test('the three design references validate with no issues', () => {
    for (const [name, config] of Object.entries(refs)) assert.deepEqual(issues(config), [], name);
});

test('objects are checked against their own type: a sphere key on a grid is unknown, a bad value is a schema error', () => {
    const out = issues({ objects: [{ type: 'grid', shape: 'disc', lat_step: 4 }, { type: 'ring', inclination: 'steep' }, { type: 'sphere', lat_step: 10 }] });
    assert.deepEqual(out, [
        'error unknown-key objects[0].lat_step: unknown key (not in the schema)',
        'error schema objects[1].inclination: must be number',
    ]);
});

test('an unknown object type names the choices and the closest one', () => {
    const out = issues({ objects: [{ type: 'sphear', radius: 4 }] });
    assert.equal(out.length, 1);
    assert.match(out[0], /^error schema objects\[0\]\.type: unknown type "sphear" \(one of grid, volume, sphere, image, glow, nebula, model, ring, path, beam, belt\) \(did you mean "sphere"\?\)$/);
});

test('reference checks: placement forms, ids that must exist, object: of the right kind, views', () => {
    const out = issues({
        camera: { view: 'mapp', views: { map: { target: 'cor' } } },
        points: [
            { id: 'a', xyz: [0, 0, 0], polar: [1, 2] },
            { id: 'b' },
            { id: 'c', cell: 'AF3' },
            { id: 'd', latlon: [1, 2], object: 'disc' },
            { id: 'e', cell: 'B2', object: 'disc' },
            { id: 'a', at: 'zz' },
        ],
        objects: [
            { type: 'grid', id: 'disc', shape: 'disc' },
            { type: 'ring', at: 'nope' },
            { type: 'path', points: ['a', 'grid#1.ring.90', 'disc.ring.90'], tap_action: { action: 'fly-to', view: 'zz' } },
            { type: 'beam', from: 'a', to: [1, 2, 3] },
        ],
    });
    assert.deepEqual(out.sort(), [
        'error reference camera.view: no view "mapp" in camera.views (did you mean "map"?)',
        'error reference camera.views.map.target: no point "cor" (did you mean "c"?)',
        'error reference objects[1].at: no point "nope"',
        // the disc has an id, so there is no grid#1; its own ring labels are points
        'error reference objects[2].points[1]: no point "grid#1.ring.90"',
        'error reference objects[2].tap_action.view: no view "zz" in camera.views',
        'error reference points[0]: point "a" has more than one position (xyz, polar); use one',
        'error reference points[1]: point "b" has no position (one of xyz, polar, latlon, altaz, sky, at, cell, or part)',
        'error reference points[2]: cell needs object: (the object it stands on)',
        'error reference points[4].object: cell needs a plane grid; "disc" is a grid (disc)',
        'error reference points[5].at: no point "zz" (did you mean "a"?)',
        'error reference points[5].id: two points with id "a"',
        'warning reference points[3].object: latlon stands on a sphere; "disc" is a grid (disc)',
    ]);
});

test('E3a: text fields, entity bindings and label styles are checked', () => {
    const out = issues({
        labels: { default: { font_family: 'lcards_title' }, styles: { alert: { font_size: 16, priority: 90 } } },
        points: [
            { id: 'ok', entity: 'device_tracker.a', latlon: { entity: 'person.b' }, object: 'globe', style: 'alert', text: { label: { content: '{entity.state}', color: { default: 'red', not_home: 'blue', selected: 'yellow' } }, sub: { content: 'x', position: 'bottom-right', letter_spacing: '0.1em', background: { default: 'black' } } } },
            { id: 'own', entity: 'device_tracker.a', xyz: { attributes: ['x', 'y', 'z'] } },
            { id: 'none', altaz: { azimuth: 'az' }, object: 'globe' },
            { id: 'svg', xyz: [0, 0, 0], text: { label: { content: 'A', zone: 'body' } } },
            { id: 'sty', xyz: [0, 0, 0], label: 'B', style: 'majr' },
            { id: 'bad', xyz: { entity: 'sensor.a', latitude: 'lat' } },
        ],
        objects: [{ type: 'sphere', id: 'globe', radius: 10 }, { type: 'grid', shape: 'disc', ring_labels: { style: 'mine', text: { default: { font_weight: 700 } } } }],
    });
    assert.deepEqual(out.sort(), [
        'error reference points[2].altaz: altaz reads an entity: give it entity:, or the point an entity',
        'error unknown-key points[3].text.label.zone: unknown key (not in the schema)',
        'error unknown-key points[5].xyz.latitude: unknown key (not in the schema)',
        'warning reference objects[1].ring_labels.style: no label style "mine" (built-in: title, major, minor, tiny; or declare it in labels.styles) (did you mean "minor"?)',
        'warning reference points[2].object: altaz stands on a dome grid; "globe" is a sphere',
        'warning reference points[4].style: no label style "majr" (built-in: title, major, minor, tiny; or declare it in labels.styles) (did you mean "major"?)',
    ]);
});

test('generated object ids (type#n) count, in config order per type', () => {
    assert.deepEqual(issues({
        points: [{ id: 'p', latlon: [0, 0], object: 'sphere#2' }, { id: 'q', cell: 'A1', object: 'grid#1' }],
        objects: [{ type: 'grid' }, { type: 'sphere' }, { type: 'sphere', at: 'q' }],
    }), []);
});

test('names.js lists match what the runtime draws, and are published in the registries', () => {
    assert.deepEqual([...names.LABEL_STYLE_NAMES], Object.keys(LABEL_STYLES));
    assert.deepEqual([...names.MARKERS].sort(), Object.keys(MARKER_SIZE).sort());
    assert.deepEqual([...names.GRID_PATTERNS].sort(), Object.keys(PATTERNS).sort());
    assert.deepEqual(registries.astrometrics.object_types, [...names.OBJECT_TYPES]);
    assert.deepEqual(registries.astrometrics.markers, [...names.MARKERS]);
    assert.deepEqual(registries.astrometrics.placement_forms, [...names.PLACEMENT_FORMS]);
    assert.deepEqual(registries.astrometrics.fill_effects, [...names.FILL_EFFECTS]);
});

test('E6 effects: every new key validates, and settings that silently do nothing warn', () => {
    const good = {
        camera: { warp: true, views: { near: { target: [0, 0, 0], distance: 20, warp: false } } },
        backdrop: { stars: { count: 500, streak: 2, spectrum: true, spectrum_direction: 'reverse' }, dust: { count: 100, radius: 300, spectrum: true, spectrum_direction: 'doppler' } },
        points: [{ id: 'a', xyz: [0, 0, 0] }, { id: 'b', xyz: [10, 0, 0], view: { distance: 5, warp: true } }],
        objects: [
            { type: 'nebula', size: [200, 40, 200], cloud_count: 6, colors: ['var(--lcars-violet)', 'var(--lcars-blue)'], turbulence: 0.7, drift: [2, 1], seed: 3 },
            { type: 'nebula', clouds: [{ xyz: [10, 0, 0], radius: 20, color: 'var(--lcars-red)' }], blend: 'normal' },
            { type: 'grid', shape: 'disc', radius: 100, scan_period: 5, scan_color: 'var(--lcars-yellow)', fill_effect: { type: 'contour', colors: ['var(--lcars-blue)', 'var(--lcars-orange)'], num_bands: 6, fill_level: 0.3 } },
            { type: 'sphere', radius: 10, scan_period: 4, fill_effect: { type: 'plasma', color_a: 'var(--lcars-orange)', color_b: 'var(--lcars-yellow)', speed: 2 } },
            { type: 'volume', shape: 'box', size: [10, 6, 10], scan_period: 3 },
            { type: 'path', from: 'a', to: 'b', dash: [6, 4], flow_speed: 30 },
            { type: 'ring', radius: 30, pulse: { length: 20, gap: 80, color: 'var(--lcars-yellow)' } },
            { type: 'beam', from: 'a', to: 'b', pulse: true, flow_speed: -40 }
        ]
    };
    assert.deepEqual(issues(good), []);
    const bad = issues({
        camera: { views: { v: { target: [0, 0, 0], warp: true } } },
        objects: [
            { type: 'sphere', image: '/local/x.jpg', fill_effect: { type: 'fluid' } },
            { type: 'path', from: [0, 0, 0], to: [1, 0, 0], flow_speed: 20 },
            { type: 'grid', fill_effect: { type: 'lava' } }
        ]
    });
    assert.ok(bad.some((m) => m.startsWith('warning') && m.includes('objects[0].image') && m.includes('image is not shown')), bad.join('\n'));
    assert.ok(bad.some((m) => m.startsWith('warning') && m.includes('objects[1].flow_speed')), bad.join('\n'));
    assert.ok(bad.some((m) => m.startsWith('warning') && m.includes('backdrop') && m.includes('warp')), bad.join('\n'));
    assert.ok(bad.some((m) => m.startsWith('error') && m.includes('fill_effect.type')), bad.join('\n'));
});

test('the browser fixtures of the references match the shared reference YAML', () => {
    for (const name of Object.keys(refs)) {
        const fixture = /** @type {any} */ (yaml.load(readFileSync(new URL(`../browser/fixtures/astro-${name}.yaml`, import.meta.url), 'utf8')));
        const { type, height, ...rest } = fixture;
        assert.equal(type, TYPE);
        assert.deepEqual(rest, refs[name], `tests/browser/fixtures/astro-${name}.yaml drifted from tests/core/fixtures/astro-references.yaml`);
    }
});

test('docs starters and gallery tiles pass the full checker (references included)', async () => {
    const { CARD_STARTERS } = await import('../../doc/.vitepress/theme/card-demo-starters.js');
    const { CARD_GALLERIES } = await import('../../doc/.vitepress/theme/card-demo-galleries.js');
    const configs = [
        ...CARD_STARTERS['lcards-astrometrics-card'].map((s) => [s.label, s.yaml]),
        ...Object.entries(CARD_GALLERIES).filter(([k]) => k.startsWith('astro-')).flatMap(([, g]) => g.tiles.map((t) => [t.label, t.yaml])),
    ];
    assert.ok(configs.length >= 21, `${configs.length} configs`);
    for (const [label, text] of configs) {
        const out = checker.validateConfig(yaml.load(text)).map(i => `${i.severity} ${i.path}: ${i.message}`);
        assert.deepEqual(out, [], label);
    }
});

test('E4 models: part needs a model, combines with xyz only, names a part of a built-in model; built-in model names are checked', () => {
    const reg = /** @type {any} */ (registries);
    assert.ok(reg.astrometrics.builtin_models['builtin:constitution'].includes('bridge'));
    assert.deepEqual(reg.astrometrics.model_materials, ['hologram', 'original']);
    const out = issues({
        objects: [
            { type: 'model', id: 'ship', src: 'builtin:constitution', size: 40, material: 'hologram', animation: 'bussards' },
            { type: 'model', id: 'mine', src: '/local/station.glb' },
            { type: 'model', id: 'typo', src: 'builtin:constitutoin' },
            { type: 'sphere', id: 'globe' },
        ],
        points: [
            { id: 'ok', object: 'ship', part: 'bridge', xyz: [0, 1, 0] },
            { id: 'free', object: 'mine', part: 'anything' },
            { id: 'bad', object: 'ship', part: 'brige' },
            { id: 'two', object: 'ship', part: 'bridge', polar: [1, 2] },
            { id: 'globe', object: 'globe', part: 'x' },
            { id: 'loose', part: 'bridge' },
        ],
    });
    assert.deepEqual(out.sort(), [
        'error reference points[3].part: part places the point on a model part (xyz is an offset from it); drop polar',
        'error reference points[4].part: part needs a model object; "globe" is a sphere',
        'error reference points[5]: part needs object: (the object it stands on)',
        'warning registry objects[2].src: unknown built-in model "builtin:constitutoin" (did you mean "builtin:constitution"?)',
        'warning registry points[2].part: unknown part of builtin:constitution "brige" (did you mean "bridge"?)',
    ]);
});

test('cohesion review (AR): keys the runtime and docs support validate; the old names are gone', () => {
    const ok = issues({
        points: [{ id: 'a', xyz: [0, 0, 0], label: 'A', visible: false, opacity: 0.5 }],
        objects: [
            { type: 'grid', id: 'g', shape: 'disc', radius: [20, 60], tags: ['map'], edges: true, edge_width: 2, edge_color: 'var(--lcars-blue)' },
            { type: 'sphere', radius: 10, line_spacing_deg: 30, fill_color: 'black', deform: [{ type: 'wobble', period: 4 }, { type: 'noise', base_frequency: 0.1, num_octaves: 3, drift: 2 }] },
            { type: 'volume', edge_color: 'var(--lcars-orange)' },
            { type: 'ring', at: 'a', radius: 30 },
            { type: 'nebula', size: [100, 30, 100] }
        ]
    });
    assert.deepEqual(ok, []);
    const old = issues({
        objects: [
            { type: 'grid', shape: 'disc', inner_radius: 10, border: false, deform: [{ type: 'wobble', speed: 1 }, { type: 'noise', frequency: 3, octaves: 2 }] },
            { type: 'sphere', fill: 'black' },
            { type: 'ring', around: [0, 0, 0] },
            { type: 'nebula', size: [100, 30] }
        ]
    });
    for (const key of ['objects[0].inner_radius', 'objects[0].border', 'objects[0].deform[0].speed', 'objects[0].deform[1].frequency', 'objects[0].deform[1].octaves', 'objects[1].fill', 'objects[2].around']) {
        assert.ok(old.some((m) => m.includes(key)), `${key} is rejected`);
    }
    assert.ok(old.some((m) => m.includes('objects[3].size')));
});

test('E8 content: planet maps and the ring band validate, built-in image names are checked, fill presets are published', () => {
    const reg = /** @type {any} */ (registries);
    for (const k of ['earth_blue_marble', 'moon_lroc', 'mars_viking', 'mercury_messenger', 'venus_magellan', 'jupiter_cassini', 'pluto_new_horizons', 'saturn_rings']) {
        assert.ok(reg.astrometrics.builtin_images.includes(`builtin:${k}`), k);
    }
    assert.deepEqual(reg.astrometrics.fill_presets, [...names.FILL_PRESETS]);
    const out = issues({
        objects: [
            { type: 'sphere', id: 'mars', image: 'builtin:mars_viking' },
            { type: 'sphere', id: 'saturn', fill_effect: { preset: 'ringed_giant', turbulence: 0.2 } },
            { type: 'ring', at: [0, 0, 0], radius: 9.8, inner_radius: 4.66, inclination: 27, image: 'builtin:saturn_rings', image_opacity: 0.9, image_color: 'var(--lcars-orange)' },
            { type: 'sphere', id: 'own', image: '/local/planet.jpg' },
            { type: 'sphere', id: 'typo', image: 'builtin:mars_vikng' },
            { type: 'image', src: 'builtin:nope' },
            { type: 'sphere', id: 'bad', fill_effect: { preset: 'jupiter' } },
        ],
    });
    assert.deepEqual(out.sort(), [
        'error schema objects[6].fill_effect.preset: must be equal to one of the allowed values',
        'warning registry objects[4].image: unknown built-in image "builtin:mars_vikng" (did you mean "builtin:mars_viking"?)',
        'warning registry objects[5].src: unknown built-in image "builtin:nope"',
    ]);
});

test('E8 content: every built-in image and model file in the pack exists in src/assets', async () => {
    const { LCARDS_IMAGES_PACK } = await import('../../src/core/packs/lcards-images-pack.js');
    const { existsSync } = await import('node:fs');
    for (const [k, a] of Object.entries({ ...LCARDS_IMAGES_PACK.image_assets, ...LCARDS_IMAGES_PACK.model_assets })) {
        const file = String(/** @type {any} */ (a).url).replace(/^\/lcards\//, 'src/assets/');
        assert.ok(existsSync(new URL(`../../${file}`, import.meta.url)), `${k}: ${file}`);
    }
});
