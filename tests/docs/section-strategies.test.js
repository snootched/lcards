/**
 * LCARS section strategies (src/strategies/lcards-section-strategies.js,
 * reports/strategies-plan.md S5): targets resolve through the registries like Home
 * Assistant's Entities section, each kind builds valid LCARdS config, and the
 * strategy configs themselves pass the config checker.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

let env;
let S;
let validateTexts;
before(async () => {
    env = installJsdom();
    for (const k of ['Document', 'CSSStyleSheet', 'ShadowRoot']) globalThis[k] ??= env.dom.window[k];
    S = await import('../../src/strategies/lcards-section-strategies.js');
    ({ validateTexts } = await import('../../scripts/lcards-validate.mjs'));
});
after(() => env?.restore());

const st = (state, attributes = {}) => ({ state, attributes });
const hass = {
    states: {
        'light.bridge_lamp': st('on', { friendly_name: 'Bridge Lamp' }),
        'light.ready_room': st('off', { friendly_name: 'Ready Room Light' }),
        'switch.bridge_fan': st('off', { friendly_name: 'Bridge Fan' }),
        'sensor.bridge_temperature': st('21.5', { friendly_name: 'Bridge Temperature', device_class: 'temperature', unit_of_measurement: '°C' }),
        'sensor.bridge_humidity': st('46', { friendly_name: 'Bridge Humidity', device_class: 'humidity', unit_of_measurement: '%' }),
        'sensor.bridge_status': st('ok', { friendly_name: 'Bridge Status' }),
        'sensor.bridge_diag': st('3', { friendly_name: 'Diag', unit_of_measurement: 'x' }),
        'input_number.warp': st('5', { friendly_name: 'Warp Factor', min: 0, max: 10 }),
    },
    areas: {
        bridge: { area_id: 'bridge', name: 'Bridge', floor_id: 'deck1', labels: [] },
        ready: { area_id: 'ready', name: 'Ready Room', floor_id: 'deck1', labels: ['command'] },
        cargo: { area_id: 'cargo', name: 'Cargo', floor_id: 'deck2', labels: [] },
    },
    devices: { fan: { id: 'fan', area_id: 'bridge', labels: [] } },
    entities: {
        'light.bridge_lamp': { area_id: 'bridge', labels: [] },
        'light.ready_room': { area_id: 'ready', labels: [] },
        'switch.bridge_fan': { device_id: 'fan', labels: [] },
        'sensor.bridge_temperature': { area_id: 'bridge', labels: [] },
        'sensor.bridge_humidity': { area_id: 'bridge', labels: ['env'] },
        'sensor.bridge_status': { area_id: 'bridge', labels: [] },
        'sensor.bridge_diag': { area_id: 'bridge', entity_category: 'diagnostic', labels: [] },
        'input_number.warp': { labels: [] },
    },
};

test('resolveTarget: entities, devices, areas (own or device), floors, labels; no configuration entities', () => {
    const r = (target) => S.resolveTarget(hass, target).sort();
    assert.deepEqual(r({ area_id: 'bridge' }), ['light.bridge_lamp', 'sensor.bridge_humidity', 'sensor.bridge_status', 'sensor.bridge_temperature', 'switch.bridge_fan']);
    assert.deepEqual(r({ device_id: 'fan' }), ['switch.bridge_fan']);
    assert.deepEqual(r({ floor_id: 'deck1' }).length, 6);
    assert.deepEqual(r({ label_id: 'command' }), ['light.ready_room'], 'an area label');
    assert.deepEqual(r({ label_id: ['env'] }), ['sensor.bridge_humidity'], 'an entity label');
    assert.deepEqual(r({ entity_id: ['input_number.warp', 'sensor.bridge_diag'] }), ['input_number.warp', 'sensor.bridge_diag'], 'named directly');
    assert.deepEqual(r(undefined), []);
});

const cards = (section) => section.cards;
/** The section's one layout card. */
const card = (section) => section.cards[0];
/** The section's title: the first title label in the layout (the title bar, the bracket's top bar or the Picard header). */
const titleOf = (section) => {
    for (const c of card(section).cards) {
        const t = c.text?.label?.content ?? c.cards?.find((x) => x.text?.label?.content)?.text.label.content;
        if (t) return t;
    }
    return undefined;
};
/** The section's items: the cards in one grid column (the title, frame parts and side bars span columns or are chrome). */
const items = (section) => card(section).cards.filter((c) => c.type !== 'custom:lcards-elbow' && c.preset !== 'panel-light'
    && !String(c.view_layout?.['grid-column'] ?? '').includes('/'));

test('sectionLabels drops the leading words every name shares; gauge caps take the last word', () => {
    const h = { states: {
        'sensor.a': st('1', { friendly_name: 'Toronto Apparent Temperature' }),
        'sensor.b': st('1', { friendly_name: 'Toronto Humidity' }),
        'sensor.c': st('1', { friendly_name: 'Toronto' }),
    }, entities: {}, areas: {} };
    assert.deepEqual([...S.sectionLabels(h, ['sensor.a', 'sensor.b']).values()], ['APPARENT TEMPERATURE', 'HUMIDITY']);
    assert.deepEqual([...S.sectionLabels(h, ['sensor.a', 'sensor.c']).values()], ['TORONTO APPARENT TEMPERATURE', 'TORONTO'], 'never empties a name');
    const gauges = S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target: { entity_id: ['sensor.bridge_temperature', 'input_number.warp'] } }, hass);
    assert.deepEqual(items(gauges).map((c) => c.text.name.content), ['TEMPERATURE', 'WARP FACTOR'], 'classic: the whole short name');
    const picard = S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', look: 'picard', target: { entity_id: ['sensor.bridge_temperature', 'input_number.warp'] } }, hass);
    assert.deepEqual(items(picard).map((c) => c.text.name.content), ['TEMP', 'FACTOR'], 'picard caps: the last word, shortened');
});

test('readings: sensors with a class or unit, classes first; title from the one area', () => {
    const out = S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', look: 'picard', target: { area_id: 'bridge' } }, hass);
    assert.equal(out.type, 'grid');
    assert.equal(titleOf(out), 'BRIDGE');
    const [grid] = items(out);
    assert.deepEqual(grid.rows.map((r) => [r.values[1], r.values[2]]), [['TEMPERATURE', 'sensor.bridge_temperature'], ['HUMIDITY', 'sensor.bridge_humidity']]);
    // classic: the number column, the value as a big number, a block, the name in a pill
    const classic = items(S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', target: { area_id: 'bridge' } }, hass));
    assert.deepEqual(classic.map((row) => [row.cards[0].entity, row.cards[0].text.state.show, row.cards[2].preset, row.cards[2].text.label.content]), [
        ['sensor.bridge_temperature', true, 'bullet', 'TEMPERATURE'], ['sensor.bridge_humidity', true, 'bullet', 'HUMIDITY'],
    ]);
    // mode switches between the number column and the table in either look
    const table = items(S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', mode: 'table', target: { area_id: 'bridge' } }, hass));
    assert.deepEqual(table[0].rows.map((r) => r.values), [['TEMPERATURE:', 'sensor.bridge_temperature'], ['HUMIDITY:', 'sensor.bridge_humidity']]);
    const numbers = items(S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', look: 'picard', mode: 'numbers', target: { area_id: 'bridge' } }, hass));
    assert.deepEqual(numbers.map((row) => row.cards[2].preset), ['filled', 'filled']);
});

test('gauges and controls pick their entities, in both looks; notes without a target or matches', () => {
    const gauges = S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target: { floor_id: 'deck1' }, title: 'LEVELS' }, hass);
    assert.deepEqual(items(gauges).map((c) => c.entity), ['sensor.bridge_humidity', 'sensor.bridge_temperature']);
    for (const look of ['classic', 'picard']) {
        const controls = S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', look, target: { floor_id: 'deck1' } }, hass);
        assert.deepEqual(items(controls).map((c) => [c.entity, (c.text.label ?? c.text.name).content]), [
            ['switch.bridge_fan', 'FAN'], ['light.bridge_lamp', 'LAMP'], ['light.ready_room', 'LIGHT'],
        ], look);
        assert.equal(items(controls)[0].preset, look === 'picard' ? 'filled' : 'lozenge');
    }
    assert.match(cards(S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls' }, hass))[1].text.label.content, /PICK AN AREA/);
    assert.match(cards(S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target: { area_id: 'cargo' } }, hass))[1].text.label.content, /NOTHING TO SHOW/);
});

test('columns place the items in a grid; max_items caps them; frames follow the look', () => {
    const target = { floor_id: 'deck1' };
    const three = S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target, columns: 3, max_items: 2 }, hass);
    assert.equal(cards(three).length, 1, 'one layout card holds the title and the items');
    // padding tracks (0 by default without a frame), the items with a gap track between them
    assert.equal(card(three).layout['grid-template-columns'], '0px minmax(0, 1fr) 6px minmax(0, 1fr) 0px', 'no wider than the items');
    assert.equal(card(three).layout['grid-template-rows'], '28px 8px 0px minmax(0, 1fr) 0px', 'title, header gap, padding, items, padding');
    assert.deepEqual(items(three).map((c) => c.view_layout), [{ 'grid-column': '2', 'grid-row': '4' }, { 'grid-column': '4', 'grid-row': '4' }]);
    // classic frame: a bracket in pieces (as the demo board's frames): a top sweep across
    // the whole width with the title cut into its bar, a bar down the left with a break at
    // each end, a closing sweep across the whole width; no horizontal joins (no seams)
    const classic = S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target, frame: true, title: 'DECK' }, hass);
    const [topSweep, side, footSweep] = card(classic).cards;
    assert.deepEqual([topSweep.elbow.type, footSweep.elbow.type], ['header-left', 'footer-left']);
    assert.deepEqual([topSweep.view_layout['grid-column'], footSweep.view_layout['grid-column']], ['1 / -1', '1 / -1'], 'one piece each, full width');
    assert.deepEqual([topSweep.text.label.content, topSweep.text.label.zone, topSweep.text.label.background.default], ['DECK', 'horizontal_bar', 'black']);
    assert.equal(titleOf(classic), 'DECK');
    assert.equal(side.layout['grid-template-rows'], '6px minmax(0, 1fr) 6px', 'a short side: one block, a break above and below');
    assert.deepEqual([side.cards[0].preset, side.cards[0].text.label.show], ['panel-light', false], 'no codes unless asked');
    // each sweep is exactly its rows' height: its bar plus the header gap (top) or padding (foot)
    assert.deepEqual([topSweep.min_height, footSweep.min_height], [0, 0]);
    const tracks = card(classic).layout['grid-template-rows'].split(' ').map(parseFloat);
    assert.equal(topSweep.elbow.segment.outer_curve, tracks[0] + tracks[1]);
    assert.equal(footSweep.elbow.segment.outer_curve, tracks.at(-1) + tracks.at(-2));
    // the side is several times the top bar
    assert.ok(topSweep.elbow.segment.bar_width >= 2 * topSweep.elbow.segment.bar_height);
    // the same space above the first row as below the last (18 px by default)
    const rows = card(classic).layout['grid-template-rows'].split(' ');
    assert.deepEqual([rows[1], rows.at(-2)], ['18px', '18px']);
    // titles fill their bar as bar-label's do: capitals sized to the bar, not a fixed font size
    const fullHeight = (label) => [label.font_size, label.font_size_percent, label.cap_height_ratio];
    assert.deepEqual(fullHeight(topSweep.text.label), [undefined, 100, 0.86]);
    // Picard: the Titan title (bars, the title at the right end), then a sweep open on the right round the items
    const picard = S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target, frame: true, look: 'picard', title: 'DECK' }, hass);
    assert.equal(titleOf(picard), 'DECK');
    const picardTitle = card(picard).cards[0].cards.find((c) => c.text?.label?.content === 'DECK').text.label;
    assert.deepEqual(fullHeight(picardTitle), [undefined, 100, 0.86]);
    // the sweep keeps its distance from the items, as the bracket does
    assert.equal(card(picard).layout['grid-template-columns'].split(' ')[1], '16px');
    const sweep = card(picard).cards.find((c) => c.type === 'custom:lcards-elbow');
    assert.equal(sweep.elbow.frame.right.enabled, false);
    assert.equal(sweep.view_layout['grid-row'], '3 / -1', 'under the title');
    // the layout asks for enough section rows for its items
    assert.ok(card(picard).grid_options.rows >= 2);
});

test('a tall classic bracket side breaks into blocks; codes label them', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `input_boolean.t${i}`);
    const h = { states: Object.fromEntries(ids.map((id) => [id, st('off', { friendly_name: id })])), entities: {}, areas: {}, devices: {} };
    // 12 controls, 2 per row: 6 rows of 48 px and 5 gaps of 6 = 318 px, 3 blocks of about 90 px
    const out = card(S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', frame: true, codes: true, target: { entity_id: ids } }, h));
    const side = out.cards[1];
    assert.equal(side.layout['grid-template-rows'], '6px minmax(0, 1fr) 6px minmax(0, 1fr) 6px minmax(0, 1fr) 6px');
    assert.deepEqual(side.cards.map((c) => c.view_layout['grid-row']), ['2', '4', '6']);
    // codes: panel-light's own random code, at the bottom right
    assert.ok(side.cards.every((c) => c.text.label.show === true && c.text.label.content === undefined && c.text.label.position === 'bottom-right'));
});

test('item_height: fixed rows of that height for every kind, a floor per kind; tables size their lines', () => {
    const target = { floor_id: 'deck1' };
    const rowsOf = (key, extra) => card(S.generateLcarsSection(key, { type: `custom:${key}`, target, item_height: 40, ...extra }, hass)).layout['grid-template-rows'];
    // controls (3 toggles, 2 per row): two rows of exactly 40 px
    assert.equal(rowsOf('lcars-controls'), '28px 8px 0px 40px 6px 40px 0px');
    // classic gauges: the slider takes the row's height too (it sets its own)
    const gauges = items(S.generateLcarsSection('lcars-gauges', { type: 'custom:lcars-gauges', target, item_height: 40 }, hass));
    assert.ok(gauges.every((g) => g.height === 40));
    // readings numbers: the big number's font follows the row
    const numbers = items(S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', target: { area_id: 'bridge' }, item_height: 40 }, hass));
    assert.ok(numbers.every((row) => row.cards[0].text.state.font_size === 40));
    // a table: item_height is a line; the table is lines x height (+ 8)
    const [table] = items(S.generateLcarsSection('lcars-readings', { type: 'custom:lcars-readings', mode: 'table', target: { area_id: 'bridge' }, item_height: 30 }, hass));
    assert.equal(table.grid['grid-template-rows'], 'repeat(2, 30px)');
    assert.equal(table.style.font_size, 20);
    // floors: a Picard column gauge keeps room for its caps and scale
    assert.equal(rowsOf('lcars-gauges', { look: 'picard', item_height: 40 }).split(' ').at(-2), '120px');
    // without item_height the rows share the section's height
    assert.match(card(S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target }, hass)).layout['grid-template-rows'], /minmax\(0, 1fr\)/);
});

test('gap, padding and header_gap set their own tracks', () => {
    const target = { floor_id: 'deck1' };
    const out = card(S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target, columns: 2, gap: 12, padding: 4, header_gap: 20 }, hass));
    assert.equal(out.layout['grid-template-columns'], '4px minmax(0, 1fr) 12px minmax(0, 1fr) 4px');
    assert.equal(out.layout['grid-template-rows'], '28px 20px 4px minmax(0, 1fr) 12px minmax(0, 1fr) 4px');
    const bracket = card(S.generateLcarsSection('lcars-controls', { type: 'custom:lcars-controls', target, frame: true, padding: 0, header_gap: 30 }, hass));
    const rows = bracket.layout['grid-template-rows'].split(' ');
    assert.deepEqual([rows[1], rows.at(-2)], ['30px', '0px']);
    assert.equal(bracket.layout['grid-template-columns'].split(' ')[1], '0px');
});

test('every section kind generates valid LCARdS config, and its strategy config passes the checker', async () => {
    const sections = [];
    for (const key of Object.keys(S.LCARS_SECTIONS)) {
        for (const look of ['classic', 'picard']) {
            for (const frame of [false, true]) {
                const strategy = { type: `custom:${key}`, title: 'TEST', look, frame, columns: 2, max_items: 4, gap: 4, padding: 6, header_gap: 10, codes: frame, item_height: 36, ...(key === 'lcars-readings' ? { mode: frame ? 'table' : 'numbers' } : {}), target: { area_id: 'bridge', floor_id: ['deck1'] } };
                sections.push({ strategy }, S.generateLcarsSection(key, strategy, hass));
            }
        }
    }
    const dashboard = { views: [{ type: 'sections', sections }] };
    const issues = await validateTexts([{ name: 'sections', text: JSON.stringify(dashboard) }]);
    assert.deepEqual(issues.map((i) => `${i.severity} ${i.path}: ${i.message}`), []);
    // and an unknown key in a strategy block is caught
    const bad = await validateTexts([{ name: 'bad', text: JSON.stringify({ views: [{ type: 'sections', sections: [{ strategy: { type: 'custom:lcars-gauges', entities: [] } }] }] }) }]);
    assert.ok(bad.some((i) => /entities/.test(`${i.path} ${i.message}`)), JSON.stringify(bad));
});

test('the settings form: grouped in LCARdS sections; shown defaults stay out of the config', async () => {
    S.defineSectionEditor();
    const ed = document.createElement('lcards-section-strategy-editor');
    ed.setConfig({ type: 'custom:lcars-readings', target: { area_id: 'bridge' } });
    const names = (g) => g.schema.flatMap((f) => (f.schema ?? [f]).map((x) => x.name));
    assert.deepEqual(ed._groups().map((g) => [g.header, g.icon.startsWith('mdi:'), names(g)]), [
        ['Target', true, ['target', 'title']],
        ['Look', true, ['look', 'mode', 'frame', 'codes']],
        ['Items', true, ['columns', 'max_items', 'item_height']],
        ['Spacing', true, ['gap', 'padding', 'header_gap']],
    ]);
    ed.setConfig({ type: 'custom:lcars-gauges' });
    assert.ok(!names(ed._groups()[1]).includes('mode'), 'readings mode only on readings');
    // the form shows classic and its readings mode picked, but writes neither unless changed
    ed.setConfig({ type: 'custom:lcars-readings', target: { area_id: 'bridge' } });
    assert.deepEqual([ed._shown().look, ed._shown().mode], ['classic', 'numbers']);
    let sent;
    ed.addEventListener('config-changed', (e) => { sent = e.detail.config; });
    ed._valueChanged({ stopPropagation() {}, detail: { value: { ...ed._shown(), frame: true } } });
    assert.deepEqual(sent, { type: 'custom:lcars-readings', target: { area_id: 'bridge' }, frame: true });
    ed._valueChanged({ stopPropagation() {}, detail: { value: { ...ed._shown(), look: 'picard' } } });
    assert.deepEqual(sent, { type: 'custom:lcars-readings', target: { area_id: 'bridge' }, look: 'picard' });
});

test('the stub targets the area with the most matching entities', async () => {
    (await import('../../src/strategies/strategy-registration.js')).registerLcarsSections();
    const cls = customElements.get('ll-strategy-section-lcars-controls');
    // the registered class loads the generator module on first use
    assert.deepEqual(await cls.getStubConfig(hass), { type: 'custom:lcars-controls', target: { area_id: 'bridge' } });
    assert.equal((await cls.generate({ type: 'custom:lcars-controls', target: { area_id: 'bridge' } }, hass)).type, 'grid');
    const editor = await cls.getConfigElement();
    assert.equal(editor.localName, 'lcards-section-strategy-editor');
    assert.ok(window.customStrategies.some((s) => s.type === 'lcars-readings' && s.strategyType === 'section'));
});
