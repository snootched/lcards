/**
 * MSD pipeline pieces that run without a DOM: HADomains, AnchorProcessor,
 * ConfigProcessor (anchor validation) and ModelBuilder.
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { HA_DOMAINS, isHAEntity, parseTriggerReference } from '../../src/msd/utils/HADomains.js';
import { AnchorProcessor } from '../../src/msd/pipeline/AnchorProcessor.js';
import { processAndValidateConfig, processMsdConfig } from '../../src/msd/pipeline/ConfigProcessor.js';
import { ModelBuilder } from '../../src/msd/pipeline/ModelBuilder.js';
import { ThemeTokenResolver } from '../../src/core/themes/ThemeTokenResolver.js';

afterEach(() => { delete globalThis.lcards; });

// ── HADomains ──────────────────────────────────────────────────────────

test('isHAEntity: known domain prefix with an object id', () => {
    const cases = [
        ['light.desk', true], ['sensor.temp', true], ['binary_sensor.door', true],
        ['temperature', false], ['temp.transformations.celsius', false], ['', false], [null, false],
        // Static list: newer domains are not recognised (current behaviour).
        ['schedule.work', false], ['tag.front_door', false],
    ];
    for (const [ref, want] of cases) assert.equal(isHAEntity(ref), want, String(ref));
    assert.ok(HA_DOMAINS.includes('light'));
});

test('parseTriggerReference: entity, bare datasource, datasource path', () => {
    assert.deepEqual(parseTriggerReference('light.desk'), { type: 'ha_entity', id: 'light.desk' });
    assert.deepEqual(parseTriggerReference('power'), { type: 'msd_datasource', id: 'power' });
    assert.deepEqual(parseTriggerReference('power.transformations.kw'), { type: 'msd_datasource', id: 'power', path: 'transformations.kw' });
    assert.equal(parseTriggerReference(''), null);
});

// ── AnchorProcessor ────────────────────────────────────────────────────

test('processAnchors: user anchors win over SVG and computed; percentages resolve against the viewBox', () => {
    globalThis.lcards = { findSvgAnchors: () => ({ svg_a: [1, 1], shared: [2, 2] }) };
    const { anchors, metadata } = AnchorProcessor.processAnchors(
        '<svg/>',
        { shared: ['50%', '25%'], fixed: [10, '100%'], odd: 'not-a-point' },
        [100, 0, 400, 200],
        { computed: [5, 5], shared: [3, 3] },
    );
    assert.deepEqual(anchors, {
        computed: [5, 5], svg_a: [1, 1],
        shared: [300, 50], fixed: [10, 200], odd: 'not-a-point',
    });
    assert.deepEqual(metadata, {
        computedAnchorCount: 2, svgAnchorCount: 2, userAnchorCount: 3, totalCount: 5, processingSource: 'svg_extraction',
    });
});

test('processAnchors: harvesting off or no SVG skips SVG anchors', () => {
    globalThis.lcards = { findSvgAnchors: () => ({ svg_a: [1, 1] }) };
    const off = AnchorProcessor.processAnchors('<svg/>', {}, [0, 0, 10, 10], {}, { harvestSvgElements: false });
    assert.deepEqual(off.anchors, {});
    const none = AnchorProcessor.processAnchors(null, { a: [1, 2] }, [0, 0, 10, 10]);
    assert.deepEqual(none.anchors, { a: [1, 2] });
    assert.equal(none.metadata.processingSource, 'config_explicit');
});

// ── ConfigProcessor ────────────────────────────────────────────────────

/** Install a stub CoreConfigManager that echoes the config back. */
function stubConfigManager(extra = {}) {
    const calls = [];
    globalThis.lcards = {
        core: {
            configManager: {
                initialized: true,
                async processConfig(config, type) {
                    calls.push({ config, type });
                    return { mergedConfig: config, provenance: { merge_order: [1], field_sources: {} }, errors: [], warnings: [], ...extra };
                },
            },
        },
    };
    return calls;
}

test('processAndValidateConfig: needs an initialised CoreConfigManager', async () => {
    await assert.rejects(processAndValidateConfig({ msd: {} }), /CoreConfigManager not initialized/);
});

test('processAndValidateConfig (base_svg none): anchors resolved, references validated', async () => {
    const calls = stubConfigManager();
    const { mergedConfig, issues } = await processAndValidateConfig({
        base_svg: { source: 'none' },
        view_box: [0, 0, 200, 100],
        anchors: { mid: ['50%', '50%'] },
        overlays: [
            { id: 'a', type: 'line', anchor: 'mid', attach_to: 'b' },   // overlay ids are valid anchors
            { id: 'b', type: 'line', anchor: 'ghost' },                 // missing anchor
            { id: 'c', type: 'line', attach_to: 'c' },                  // self reference
            { id: 'd', type: 'line', position: [1, 2] },                // non-string position: ignored
        ],
    });
    assert.equal(calls[0].type, 'msd');
    assert.deepEqual(mergedConfig.view_box, [0, 0, 200, 100]);
    assert.deepEqual(mergedConfig.anchors, { mid: [100, 50] });
    assert.deepEqual(issues.errors.map(e => [e.code, e.overlay, e.anchor]), [
        ['anchor.missing', 'b', 'ghost'],
        ['anchor.self_reference', 'c', 'c'],
    ]);
    assert.equal(mergedConfig.__issues, issues);
});

test('processMsdConfig returns config and validation from CoreConfigManager', async () => {
    stubConfigManager({ errors: [{ code: 'x' }], warnings: [{ code: 'w' }] });
    const out = await processMsdConfig({ overlays: [] });
    assert.deepEqual(out.config, { overlays: [] });
    assert.deepEqual(out.validation, { errors: [{ code: 'x' }], warnings: [{ code: 'w' }] });
});

// ── ModelBuilder ───────────────────────────────────────────────────────

function builder({ overlays, themeManager, sources = {} } = {}) {
    const subscribed = [];
    const updates = [];
    const coordinator = {
        router: { setOverlays: (o) => { coordinator.routed = o; } },
        themeManager,
        renderer: { updateOverlayData: (id, data) => updates.push([id, data]) },
        dataSourceManager: {
            getSource: (name) => sources[name] && {
                subscribe: (cb) => { subscribed.push(name); sources[name].cb = cb; return () => { sources[name].unsubscribed = true; }; },
            },
        },
    };
    const cardModel = { viewBox: [0, 0, 100, 100], anchors: { a: [1, 1] }, overlaysBase: overlays };
    return { mb: new ModelBuilder({ timelines: [] }, cardModel, coordinator), coordinator, subscribed, updates };
}

test('computeResolvedModel: overlays merge raw + base, theme: tokens resolve per component', async () => {
    const resolver = new ThemeTokenResolver({
        colors: { ui: { primary: '#ff9900' } },
        components: { line: { stroke: '#123456' } },
    });
    const overlays = [{
        id: 'l1', type: 'line', anchor: 'a',
        style: { color: 'theme:colors.ui.primary', nested: { stroke: 'theme:stroke' }, width: 2, missing: 'theme:colors.none' },
        raw: { id: 'l1', type: 'line', entities: ['x'], anchor: 'raw-anchor' },
    }];
    const { mb, coordinator } = builder({ overlays, themeManager: { initialized: true, resolver } });
    const model = await mb.computeResolvedModel();
    const [o] = model.overlays;
    assert.equal(o.anchor, 'a');                // base wins over raw
    assert.deepEqual(o.entities, ['x']);        // raw-only keys kept
    assert.deepEqual(o.style, { color: '#ff9900', nested: { stroke: '#123456' }, width: 2, missing: 'theme:colors.none' });
    assert.deepEqual(o.finalStyle, o.style);
    assert.notEqual(o.finalStyle, o.style);
    assert.equal(coordinator.routed, model.overlays);
    assert.equal(mb.getResolvedModel(), model);
    assert.deepEqual(model.anchors, { a: [1, 1] });
});

test('computeResolvedModel: without a ready theme manager styles pass through', async () => {
    const { mb } = builder({ overlays: [{ id: 'x', type: 'text', style: { color: 'theme:colors.ui.primary' }, raw: {} }] });
    const model = await mb.computeResolvedModel();
    assert.equal(model.overlays[0].style.color, 'theme:colors.ui.primary');
});

test('triggers_update: datasources subscribe and forward data, HA entities are skipped', async () => {
    const sources = { power: {} };
    const overlays = [{ id: 'o1', type: 'text', raw: {}, triggers_update: ['light.desk', 'power.transformations.kw', 'ghost'] }];
    const { mb, subscribed, updates } = builder({ overlays, sources });
    await mb.computeResolvedModel();
    assert.deepEqual(subscribed, ['power']);
    sources.power.cb({ v: 1 });
    assert.deepEqual(updates, [['o1', { v: 1 }]]);
    mb.destroy();
    assert.equal(sources.power.unsubscribed, true);
});
