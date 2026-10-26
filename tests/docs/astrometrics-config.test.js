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
    assert.match(out[0], /^error schema objects\[0\]\.type: unknown type "sphear" \(one of grid, volume, sphere, image, glow, ring, path, beam\) \(did you mean "sphere"\?\)$/);
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
            { type: 'ring', around: 'nope' },
            { type: 'path', points: ['a', 'grid#1.ring.90', 'disc.ring.90'], tap_action: { action: 'fly-to', view: 'zz' } },
            { type: 'beam', from: 'a', to: [1, 2, 3] },
        ],
    });
    assert.deepEqual(out.sort(), [
        'error reference camera.view: no view "mapp" in camera.views (did you mean "map"?)',
        'error reference camera.views.map.target: no point "cor" (did you mean "c"?)',
        'error reference objects[1].around: no point "nope"',
        // the disc has an id, so there is no grid#1; its own ring labels are points
        'error reference objects[2].points[1]: no point "grid#1.ring.90"',
        'error reference objects[2].tap_action.view: no view "zz" in camera.views',
        'error reference points[0]: point "a" has more than one position (xyz, polar); use one',
        'error reference points[1]: point "b" has no position (one of xyz, polar, latlon, altaz, sky, at, cell)',
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
