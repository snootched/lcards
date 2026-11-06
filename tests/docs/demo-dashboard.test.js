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
import { loadDemo, demoViews, viewTexts, buildDashboard, headerNote, topicGroups, BOARDS, GALLERY_PREFIX, packGrid, cardSpan, frameGroups, GRID_STEPS } from '../../scripts/lib/demo-dashboard.js';
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
    // a gallery dashboard (file: gallery/<name>) is shown as dashboard-<name>
    for (const v of views) assert.equal(v.path, v.file.startsWith(GALLERY_PREFIX) ? `dashboard-${v.file.slice(GALLERY_PREFIX.length)}` : v.file, `${v.file}.yaml: path ${v.path}`);
    assert.equal(new Set(views.map(v => v.path)).size, views.length, 'paths unique');
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
        // in the topic tree's order, like the index
        const expected = views.filter(v => board === 'dev' || v.public).sort((a, b) => a.rank - b.rank).map(v => v.path);
        assert.equal(config.views[0].path, 'index');
        assert.deepEqual(config.views.slice(1).map(v => v.path), expected);
        const targets = [...new Set((JSON.stringify(config.views[0]).match(/"navigation_path":"[^"]+"/g) ?? []).map(t => t.split('/').pop().slice(0, -1)))];
        assert.deepEqual([...targets].sort(), [...expected].sort(), 'the index links every view');
        assert.ok(JSON.stringify(config.views[0]).includes(`"/${BOARDS[board].urlPath}/`), 'links stay on this board');
        const issues = await validateTexts([{ name: board, text: yaml.dump(config) }]);
        assert.deepEqual(issues.map(i => `${i.severity} ${i.path}: ${i.message}`), []);
    });
}

/** A view laid out as an lcards-layout-view (its own frame, no sections) */
const isLayoutView = (config) => config?.type === 'custom:lcards-layout-view';

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
    const header = JSON.stringify(buildDashboard(demo, { board: 'public' }).views.find((v, i) => i > 0 && v.sections).sections[0]);
    assert.ok(header.includes(`"${demo.releases[0].version}"`), 'the release is in the header bar');
});

test('topics: every view sits in one group of the topic tree; the index has a block per topic in the tree\'s order', () => {
    const ids = demo.topics.map(t => t.id);
    assert.equal(new Set(ids).size, ids.length, 'a topic listed twice');
    assert.deepEqual(demo.ungrouped, [], 'views in no topic, or tree entries that are not listed views');
    assert.deepEqual(demo.regrouped, [], 'views in two groups');
    for (const v of views) assert.ok(ids.includes(v.topic), `${v.file}: no topic`);
    for (const t of demo.topics) {
        // a topic is either one untitled list or named groups, never a mix
        const titled = t.groups.filter(g => g.title).length;
        assert.ok(titled === 0 ? t.groups.length === 1 : titled === t.groups.length, `${t.id}: groups all named`);
    }
    const groups = topicGroups(demo.releases, demo.topics);
    assert.deepEqual(groups.map(g => g.id), ids.filter(id => views.some(v => v.topic === id)));
    assert.equal(groups.reduce((n, g) => n + g.views.length, 0), views.length);
    // within a topic, the tree's order
    for (const g of groups) {
        const tree = demo.topics.find(t => t.id === g.id).groups.flatMap(x => x.views);
        assert.deepEqual(g.views.map(v => v.file), tree);
    }
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
        if (isLayoutView(v.config)) {
            // a layout view: the card fills its grid area, the view is at least 600 px tall
            const astro = (v.config.cards ?? []).find(c => c.type === 'custom:lcards-astrometrics-card');
            assert.ok(astro, `${v.file}: no astrometrics card`);
            assert.equal(astro.height, '100%', `${v.file}: the card fills its area`);
            assert.ok(parseInt(v.config.layout['min-height'], 10) >= 600, `${v.file}: min-height`);
            continue;
        }
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
    assert.deepEqual(one.views.slice(1).map(v => v.path), demo.releases[0].views.filter(v => v.public).sort((a, b) => a.rank - b.rank).map(v => v.path));
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
    // a layout view is its own frame
    for (const view of board.views.slice(1).filter(v => !isLayoutView(v))) {
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
    for (const view of buildDashboard(demo, { board: 'dev' }).views.slice(1).filter(v => !isLayoutView(v))) {
        for (const f of framesOf(view)) {
            const scenes = f.cards[2].cards.filter(c => cardSpan(c, 48).columns === 48 && cardSpan(c, 48).rows >= 6);
            assert.ok(scenes.length <= 1, `${view.path}: ${scenes.length} scenes in one frame`);
        }
    }
});

test('headers: the title and plain segments are not buttons; Index and Docs are; the sweeps are rounded', () => {
    const board = buildDashboard(demo, { board: 'dev' });
    // a gallery dashboard is a whole screen with its own LCARS frame: no generated header
    const gallery = new Set(views.filter(v => v.file.startsWith(GALLERY_PREFIX)).map(v => v.path));
    for (const view of board.views.filter(v => !gallery.has(v.path))) {
        // header bars at any depth (a view's sits inside the frame round its description)
        const headers = [];
        (function find(cards) {
            for (const c of cards ?? []) {
                if (c.type !== 'custom:lcards-layout-card') continue;
                if (c.cards.some(x => x.preset === 'text-only') && c.cards[0].elbow) headers.push(c);
                else find(c.cards);
            }
        })(isLayoutView(view) ? view.cards : view.sections.flatMap(sec => sec.cards));
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

test('every lozenge on a view is 8 grid columns wide (narrower ones turn round)', () => {
    const odd = [];
    for (const v of views) {
        odd.length = 0;
        (function walk(n) {
            if (Array.isArray(n)) n.forEach(walk);
            else if (n && typeof n === 'object') {
                if (n.type === 'custom:lcards-button' && n.preset === 'lozenge' && n.grid_options && n.grid_options.columns !== 8) odd.push(`${n.text?.name?.content} (${n.grid_options.columns})`);
                Object.values(n).forEach(walk);
            }
        })(v.config.sections ?? []);
        assert.deepEqual(odd, [], v.file);
    }
});

test('a view\'s description sits in a frame headed by the view\'s header bar', () => {
    for (const view of buildDashboard(demo, { board: 'dev' }).views.slice(1).filter(v => !isLayoutView(v))) {
        const source = views.find(v => v.path === view.path);
        const [head] = view.sections[0].cards;
        if (!source.description) continue;
        assert.deepEqual(head.cards.map(c => c.elbow?.type ?? c.view_layout['grid-area']), ['top', 'bar', 'content', 'footer-left'], view.path);
        assert.ok(head.cards[0].cards.some(c => c.preset === 'text-only'), `${view.path}: the title bar on top`);
        assert.equal(head.cards[1].text, undefined, `${view.path}: no frame number on the header`);
        assert.equal(head.cards[2].cards[0].rows[0][0], source.description);
    }
});

/** Views whose sliders are the feature itself (they drive nothing else) */
const SLIDER_FEATURE_VIEWS = new Set(['ring-gauge']);

test('controls drive their own view: alert buttons only where something reacts to the alert mode; every slider bound to another card', () => {
    for (const v of views) {
        const cards = (v.config.sections ?? []).flatMap(sec => sec.cards ?? []);
        const alertButtons = cards.filter(c => /lcards\.(red|yellow|clear)_alert/.test(c.tap_action?.perform_action ?? ''));
        if (alertButtons.length) {
            assert.ok(v.topic === 'alerts' || v.text.includes('lcards_alert_mode'), `${v.file}: alert buttons, but nothing on the view follows the alert mode`);
        }
        if (SLIDER_FEATURE_VIEWS.has(v.path)) continue;
        for (const s of cards.filter(c => c.type === 'custom:lcards-slider')) {
            const others = JSON.stringify(cards.filter(c => c !== s));
            assert.ok(others.includes(s.entity), `${v.file}: the ${s.text?.name?.content ?? s.entity} slider drives nothing on the view`);
            assert.ok(s.text?.name?.content, `${v.file}: a slider without a name (say what it drives)`);
        }
    }
});

test('fly-to buttons name a card on their view, and a view or point it has', () => {
    for (const v of views) {
        const cards = (v.config.sections ?? []).flatMap(sec => sec.cards ?? []);
        const byId = new Map(cards.filter(c => c.id).map(c => [c.id, c]));
        for (const b of cards.filter(c => c.tap_action?.action === 'fly-to')) {
            const { card, view, point } = b.tap_action;
            const target = byId.get(card);
            assert.ok(target, `${v.file}: fly-to names card ${card}, not on the view`);
            if (view) assert.ok(Object.hasOwn(target.camera?.views ?? {}, view), `${v.file}: ${card} has no view ${view}`);
            if (point) {
                const ids = [...(target.points ?? []), ...(target.objects ?? []).filter(o => o.type === 'system').flatMap(o => o.points ?? [])].map(p => p.id);
                assert.ok(ids.includes(point), `${v.file}: ${card} has no point ${point}`);
            }
        }
    }
});

test('the helper package on the live demo page defines every lcards_test_* helper a public view uses', async () => {
    const { TEST_HELPERS, GALLERY_HELPERS } = await import('../ha/ha-client.mjs');
    const { helpersPackage, loadPackage } = await import('../../scripts/lib/demo-dashboard.js');
    const pub = views.filter(v => v.public);
    const pkg = helpersPackage(pub, { ...TEST_HELPERS, ...GALLERY_HELPERS }, loadPackage());
    assert.deepEqual(pkg.missing, [], 'a public view uses a helper, script or automation with no definition');
    const parsed = yaml.load(pkg.yaml);
    for (const id of pkg.ids) {
        const [domain, object] = id.split('.');
        assert.ok(parsed[domain]?.[object]?.name, `${id} in the package`);
        assert.equal(parsed[domain][object].type, undefined, `${id}: no create-command keys`);
    }
});

test('demo/package.yaml: the scripts and automations a view names go into the package; an unknown one is missing', async () => {
    const { helpersPackage, loadPackage } = await import('../../scripts/lib/demo-dashboard.js');
    const extras = loadPackage();
    assert.ok(extras.script.lcards_test_tour, 'the tour script');
    assert.ok(extras.automation.some((a) => a.id === 'lcards_test_alert'), 'the alert automation');
    const pkg = helpersPackage([{ text: '# uses: automation.lcards_test_alert\naction: script.lcards_test_tour\nscript.lcards_test_nope' }], {}, extras);
    const parsed = /** @type {any} */ (yaml.load(pkg.yaml));
    assert.ok(parsed.script.lcards_test_tour.sequence);
    assert.equal(parsed.automation[0].id, 'lcards_test_alert');
    assert.deepEqual(pkg.missing, ['script.lcards_test_nope']);
    assert.deepEqual(yaml.load(helpersPackage([{ text: 'nothing' }], {}, extras).yaml), {}, 'nothing named: nothing added');
});

test('the astrometrics showcase view is what scripts/make-astro-showcase.mjs writes (not edited by hand, not stale)', async () => {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, ['scripts/make-astro-showcase.mjs', '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('the astrometrics showcase: every tour stop is a named view of its card (a bare point would fly in at the default distance)', async () => {
    const { showcaseCard, STOPS } = await import('../../scripts/make-astro-showcase.mjs');
    const card = await showcaseCard();
    const views = Object.keys(card.camera.views);
    for (const [view] of STOPS) assert.ok(views.includes(view), `stop ${view} has no view`);
    assert.deepEqual(card.camera.view.views.map((s) => (typeof s === 'string' ? s : s.view)), STOPS.map(([v]) => v), 'the tour visits the stops in order');
});
