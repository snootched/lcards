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
import { loadDemo, demoViews, viewTexts, buildDashboard, headerNote, topicGroups, BOARDS, packGrid, cardSpan, frameGroups, GRID_STEPS } from '../../scripts/lib/demo-dashboard.js';
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
        assert.deepEqual([...targets].sort(), [...expected].sort(), 'the index links every view');
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
    for (const r of demo.releases) {
        for (const v of r.views) {
            const note = headerNote(v, { board: 'public', release: r.version });
            assert.equal(note, r.version, v.file);
            assert.equal(headerNote(v, { board: 'dev', release: r.version }), `${r.version} · ${v.session}`, v.file);
        }
    }
    const header = JSON.stringify(buildDashboard(demo, { board: 'public' }).views[1].sections[0]);
    assert.ok(header.includes(`"${demo.releases[0].version}"`), 'the release is in the header bar');
});

test('topics: every view has one from the list; the index has a block per topic in its order', () => {
    const ids = demo.topics.map(t => t.id);
    assert.equal(new Set(ids).size, ids.length, 'a topic listed twice');
    for (const v of views) assert.ok(ids.includes(v.topic), `${v.file}: topic '${v.topic}' is not in order.yaml topics`);
    const groups = topicGroups(demo.releases, demo.topics);
    assert.deepEqual(groups.map(g => g.id), ids.filter(id => views.some(v => v.topic === id)));
    assert.equal(groups.reduce((n, g) => n + g.views.length, 0), views.length);
    const index = buildDashboard(demo, { board: 'dev' }).views[0];
    assert.equal(index.sections.length, 1 + groups.length);
    // each topic in a numbered frame: its title (not a button), a lozenge per view, the table
    index.sections.slice(1).forEach((sec, i) => {
        assert.equal(sec.cards.length, 1);
        const [top, bar, content, foot] = sec.cards[0].cards;
        assert.deepEqual([top.elbow.type, bar.text.label.content, foot.elbow.type], ['header-left', String(i + 1).padStart(2, '0'), 'footer-left']);
        const [title, ...rest] = content.cards;
        assert.ok(title.text.label.content.startsWith(groups[i].title.toUpperCase()), title.text.label.content);
        assert.equal(title.interactive, false);
        assert.equal(rest.filter(c => c.preset === 'lozenge').length, groups[i].views.length);
        assert.equal(rest.at(-1).type, 'custom:lcards-data-grid');
    });
});

test('the docs site\'s headers have no Index link (it has its own picker)', () => {
    const docs = JSON.stringify(buildDashboard(demo, { board: 'public', release: demo.releases[0].version, index: false }).views.slice(1));
    assert.ok(!docs.includes('/lcards-demo-public/index'), 'no navigate to the Home Assistant index');
    const ha = JSON.stringify(buildDashboard(demo, { board: 'public' }).views.slice(1));
    assert.ok(ha.includes('/lcards-demo-public/index'));
});

test('astrometrics demos are big: the card full width and at least 600 px tall', () => {
    for (const v of views.filter(x => x.topic === 'astrometrics')) {
        const cards = (v.config.sections ?? []).flatMap(sec => sec.cards ?? []);
        const astro = cards.filter(c => c.type === 'custom:lcards-astrometrics-card');
        assert.ok(astro.length, `${v.file}: no astrometrics card`);
        const first = astro[0];
        const section = v.config.sections.find(sec => (sec.cards ?? []).includes(first));
        assert.equal(section.column_span, 4, `${v.file}: the first astrometrics card's section spans the view`);
        assert.equal(first.grid_options?.columns, 'full', `${v.file}: grid_options.columns full`);
        assert.ok(Number(first.height) >= 600, `${v.file}: height ${first.height}`);
    }
});

test('one release (the docs site): only that release\'s public views', () => {
    const release = demo.releases[0].version;
    const one = buildDashboard(demo, { board: 'public', release });
    assert.deepEqual(one.views.slice(1).map(v => v.path), demo.releases[0].views.filter(v => v.public).map(v => v.path));
    assert.equal(buildDashboard(demo, { board: 'public', release: '1999.1.0' }).views.length, 1, 'an unknown release: index only');
});

test('packGrid: cards flow row by row as in a sections grid; a tall card keeps its column free below', () => {
    const area = (p) => p.areas.split('" "').map(r => r.replace(/"/g, '').split(' '));
    const a = area(packGrid([{ columns: 8, rows: 1 }, { columns: 8, rows: 1 }, { columns: 48, rows: 2 }], 48));
    assert.equal(a.length, 3);
    assert.deepEqual([a[0][0], a[0][8], a[0][16], a[1][0], a[2][47]], ['c0', 'c1', '.', 'c2', 'c2']);
    // a slider 5 rows tall, then buttons: they fill the rows beside it
    const b = area(packGrid([{ columns: 6, rows: 5 }, { columns: 6, rows: 1 }, { columns: 6, rows: 1 }], 12));
    assert.deepEqual([b[0][0], b[0][6], b[1][6], b[4][0]], ['c0', 'c1', 'c2', 'c0']);
    // too wide for the row: on to the next
    const c = area(packGrid([{ columns: 8, rows: 1 }, { columns: 8, rows: 1 }], 12));
    assert.deepEqual([c[0][0], c[0][8], c[1][0]], ['c0', '.', 'c1']);
});

test('cardSpan: columns capped by the grid, rows from grid_options, else from a pixel height, else the card default', () => {
    assert.deepEqual(cardSpan({ grid_options: { columns: 24, rows: 2 } }, 12), { columns: 12, rows: 2 });
    assert.deepEqual(cardSpan({ type: 'custom:lcards-astrometrics-card', height: 650, grid_options: { columns: 'full' } }, 48), { columns: 48, rows: 11 });
    assert.equal(cardSpan({ type: 'custom:lcards-astrometrics-card' }, 48).rows, 8);
    assert.equal(cardSpan({ type: 'custom:lcards-button', grid_options: { columns: 6 } }, 48).rows, 1);
});

test('frameGroups: a frame per scene, the controls before it with it', () => {
    const scene = { type: 'custom:lcards-astrometrics-card', height: 650, grid_options: { columns: 'full' } };
    const button = { type: 'custom:lcards-button', grid_options: { columns: 8, rows: 1 } };
    assert.deepEqual(frameGroups([button, button, scene, scene]).map(g => g.length), [3, 1]);
    assert.deepEqual(frameGroups([scene, button, scene, button]).map(g => g.length), [1, 2, 1]);
    assert.deepEqual(frameGroups([button, button]).map(g => g.length), [2]);
});

/** Every frame card of a built view, in order */
const framesOf = (view) => view.sections.slice(1).flatMap(sec => sec.cards).filter(c => c.type === 'custom:lcards-layout-card');

test('every view: its cards sit in numbered LCARS frames (sweep, bar, content, footer), placed at every width', () => {
    const board = buildDashboard(demo, { board: 'dev' });
    for (const view of board.views.slice(1)) {
        const source = views.find(v => v.path === view.path);
        const own = (source.config.sections ?? []).flatMap(sec => sec.cards ?? []).filter(c => c.type !== 'custom:lcards-alert-overlay');
        const frames = framesOf(view);
        assert.ok(frames.length >= 1, view.path);
        assert.deepEqual(frames.map(f => f.cards[1].text.label.content), frames.map((_, i) => String(i + 1).padStart(2, '0')), `${view.path}: numbered in order`);
        const placed = [];
        for (const f of frames) {
            assert.deepEqual(f.cards.map(c => c.elbow?.type ?? c.view_layout['grid-area']), ['header-left', 'bar', 'content', 'footer-left'], view.path);
            assert.equal(f.cards[1].interactive, false, `${view.path}: the bar is not a button`);
            const content = f.cards[2];
            placed.push(...content.cards);
            const { mediaquery, ...base } = content.layout;
            assert.deepEqual(Object.keys(mediaquery), GRID_STEPS.slice(1).map(([, q]) => q));
            for (const grid of [base, ...Object.values(mediaquery)]) {
                for (const card of content.cards) assert.ok(grid['grid-template-areas'].includes(card.view_layout['grid-area']), `${view.path}: ${card.view_layout['grid-area']} placed at ${grid['grid-template-columns']}`);
                const rows = grid['grid-template-areas'].split('" "').length;
                assert.equal(grid['grid-template-rows'], `repeat(${rows}, minmax(56px, auto))`, view.path);
            }
        }
        assert.equal(placed.length, own.length, `${view.path}: every card framed once`);
    }
});

test('every scene has a frame of its own (cards never run together)', () => {
    for (const view of buildDashboard(demo, { board: 'dev' }).views.slice(1)) {
        for (const f of framesOf(view)) {
            const scenes = f.cards[2].cards.filter(c => cardSpan(c, 48).columns === 48 && cardSpan(c, 48).rows >= 6);
            assert.ok(scenes.length <= 1, `${view.path}: ${scenes.length} scenes in one frame`);
        }
    }
});

test('headers: the title and plain segments are not buttons; Index and Docs are; the sweeps are rounded', () => {
    const board = buildDashboard(demo, { board: 'dev' });
    for (const view of board.views) {
        const headers = view.sections.flatMap(sec => sec.cards).filter(c => c.type === 'custom:lcards-layout-card' && c.cards.some(x => x.preset === 'text-only'));
        assert.ok(headers.length, view.path);
        for (const h of headers) {
            for (const c of h.cards.filter(x => x.type === 'custom:lcards-button')) {
                if (c.tap_action) assert.equal(c.interactive, undefined, `${view.path}: ${c.text.label.content} is a button`);
                else assert.equal(c.interactive, false, `${view.path}: ${c.text.label.content} is decorative`);
            }
            assert.ok(h.cards[0].elbow.segment.outer_curve > h.cards[0].elbow.segment.bar_width / 2, 'rounder than the default sweep');
        }
    }
});
