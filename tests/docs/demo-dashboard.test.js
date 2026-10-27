/**
 * The demo boards (demo/order.yaml + demo/views/*.yaml, pushed by
 * scripts/demo-push.mjs, the public one also on the docs site): every view file is
 * listed once with its header text, paths are unique, views use LCARdS cards only,
 * every view and both assembled boards (generated headers, index) are valid LCARdS
 * config with no warnings (a schema change that breaks a demo fails here), and the
 * views use only lcards_test_* helpers plus a few non-personal entities.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTexts } from '../../scripts/lcards-validate.mjs';
import { loadDemo, demoViews, viewTexts, buildDashboard, BOARDS } from '../../scripts/lib/demo-dashboard.js';
import { disallowedEntities } from '../helpers/allowed-entities.js';
import yaml from 'js-yaml';

/** Non-personal entities the demos may use besides the lcards_test_* helpers. */
const ALLOWED = [
    'sensor.desk_sensor_temperature',
    'sun.sun',
    'zone.home',
    'input_select.lcards_alert_mode', // the LCARdS integration's own
];

const demo = loadDemo();
const views = demoViews(demo);

test('order.yaml and demo/views/ agree', () => {
    assert.deepEqual(demo.missing, [], 'listed in order.yaml, no file');
    assert.deepEqual(demo.unlisted, [], 'file not listed in order.yaml');
    const files = views.map(v => v.file);
    assert.equal(new Set(files).size, files.length, 'a view listed twice');
    assert.ok(views.length >= 20, `${views.length} views`);
});

test('view paths are unique and match their file names', () => {
    for (const v of views) assert.equal(v.path, v.file, `${v.file}.yaml: path ${v.path}`);
    assert.ok(!views.some(v => v.path === 'index'), 'index is the generated view');
});

test('every view: valid config, no warnings', async () => {
    const issues = await validateTexts(viewTexts(demo));
    assert.deepEqual(issues.map(i => `${i.severity} ${i.file.split('/').pop()} ${i.path}: ${i.message}`), []);
});

test('every view has a title and its header text in order.yaml', () => {
    for (const v of views) {
        assert.ok(v.config.title, `${v.file}: no title`);
        for (const key of ['summary', 'description', 'session']) assert.ok(v[key], `${v.file}: no ${key} in order.yaml`);
        assert.ok(v.docs === null || v.docs.startsWith('/'), `${v.file}: docs must be a docs path (/...)`);
        assert.equal(typeof v.public, 'boolean', `${v.file}: public must be true or false`);
    }
});

test('views use LCARdS cards only (they render the same on the docs site)', () => {
    for (const v of views) {
        const cards = [...(v.config.sections ?? []).flatMap(sec => sec.cards ?? []), ...(v.config.cards ?? [])];
        assert.deepEqual(cards.map(c => c.type).filter(t => !String(t).startsWith('custom:lcards-')), [], v.file);
    }
});

for (const v of views) {
    test(`${v.file}: only lcards_test_* helpers and allowed entities`, () => {
        assert.deepEqual(disallowedEntities(v.text, ALLOWED), []);
    });
}

for (const board of Object.keys(BOARDS)) {
    test(`${board} board: index first, every view once, headers and index valid`, async () => {
        const config = buildDashboard(demo, { board });
        const expected = views.filter(v => board === 'dev' || v.public).map(v => v.path);
        assert.equal(config.views[0].path, 'index');
        assert.deepEqual(config.views.slice(1).map(v => v.path), expected);
        const targets = [...new Set((JSON.stringify(config.views[0]).match(/"navigation_path":"[^"]+"/g) ?? []).map(t => t.split('/').pop().slice(0, -1)))];
        assert.deepEqual(targets, expected, 'the index links every view');
        assert.ok(JSON.stringify(config.views[0]).includes(`"/${BOARDS[board].urlPath}/`), 'links stay on this board');
        const issues = await validateTexts([{ name: board, text: yaml.dump(config) }]);
        assert.deepEqual(issues.map(i => `${i.severity} ${i.path}: ${i.message}`), []);
    });
}

test('public board: no benchmarks or checks; the dev board has them', () => {
    const pub = buildDashboard(demo, { board: 'public' }).views.map(v => v.path);
    assert.ok(!pub.some(p => p.startsWith('bench') || p === 'alert-recolour'), pub.join(', '));
    assert.ok(pub.length > 10, pub.join(', '));
    // Session codes (C4, E3a) are for the dev board: public headers show the release only
    const notes = buildDashboard(demo, { board: 'public' }).views.slice(1).map(v => v.sections[0].cards[0].text.note.content);
    assert.ok(notes.every(n => /^\d{4}\.\d+\.\d+$/.test(n)), notes.join(', '));
});

test('one release (the docs site): only that release\'s public views', () => {
    const release = demo.releases[0].version;
    const one = buildDashboard(demo, { board: 'public', release });
    assert.deepEqual(one.views.slice(1).map(v => v.path), demo.releases[0].views.filter(v => v.public).map(v => v.path));
    assert.equal(buildDashboard(demo, { board: 'public', release: '1999.1.0' }).views.length, 1, 'an unknown release: index only');
});
