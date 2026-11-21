/**
 * MSD Studio quick label: a label control plus its leader line, in one of
 * the Labelled schematic pattern's styles (src/editor/dialogs/msd-studio/msd-quick-label.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator } from '../../scripts/lib/config-validator.js';
import {
    QUICK_LABEL_STYLES,
    QUICK_LABEL_SIZES,
    buildQuickLabel,
    guessQuickLabelStyle,
    nextOverlayId,
    unitsPerPxForSize,
    guessQuickLabelSize,
    controlBox,
    snapLabelPoint,
    nearestSnapTarget,
    controlConnectionPoints,
    isNamedAnchor
} from '../../src/editor/dialogs/msd-studio/msd-quick-label.js';

const checker = createConfigValidator({ entries: getSchemaEntries(), registries: await buildRegistries() });
const issues = (config) => checker.validateConfig(config).map((i) => `${i.severity} ${i.code} ${i.path}: ${i.message}`);

/** A 1160-wide view box shown 500 px wide (the patterns page example). */
const U = 1160 / 500;

const build = (style, extra = {}) => buildQuickLabel({
    style,
    labelPoint: [100, 300],
    target: [400, 120],
    unitsPerPx: U,
    overlays: [],
    text: 'DEUTERIUM 1-3',
    ...extra
});

test('every style (and both bracket kinds) builds overlays the MSD schema accepts', () => {
    const variants = [
        ...Object.keys(QUICK_LABEL_STYLES).map(s => build(s)),
        build('bracket', { bracketKind: 'angled' }),
        build('classic', { target: 'warp_core', targetPoint: [400, 120] })
    ];
    const overlays = variants.flatMap(({ label, line }, i) => [
        { ...label, id: `lbl_${i}` },
        { ...line, id: `ln_${i}`, anchor: `lbl_${i}` }
    ]);
    const config = {
        type: 'custom:lcards-msd-card',
        msd: {
            base_svg: { source: 'builtin:enterprise-d-shuttlecraft15-anomaly' },
            view_box: [-60, -150, 1160, 800],
            anchors: { warp_core: [400, 120] },
            overlays
        }
    };
    assert.deepEqual(issues(config).filter(i => i.startsWith('error')), []);
});

test('the line leaves the side facing the part, the text aligned toward it', () => {
    const right = build('classic');
    assert.equal(right.side, 'right');
    assert.equal(right.line.anchor_side, 'right');
    assert.equal(right.label.attachment, 'right');
    assert.equal(right.label.card.text.label.position, 'center-right');

    const left = build('classic', { labelPoint: [700, 300] });
    assert.equal(left.side, 'left');
    assert.equal(left.line.anchor_side, 'left');
    assert.equal(left.label.attachment, 'left');
    assert.equal(left.label.card.text.label.position, 'center-left');

    // Above or below the part does not change the side: only left or right of it.
    assert.equal(build('classic', { labelPoint: [100, -50] }).side, 'right');
    assert.equal(build('classic', { labelPoint: [700, -50] }).side, 'left');
});

test('sizes are rendered px converted to view-box units', () => {
    const at500 = build('picard');
    assert.equal(at500.label.card.text.label.font_size, Math.round(13 * U * 10) / 10);
    assert.equal(at500.line.style.width, Math.round(2.5 * U * 10) / 10);
    assert.equal(at500.line.corner_radius, Math.round(10 * U * 10) / 10);

    // The same view box on a display twice as wide: half the units.
    const at1000 = build('picard', { unitsPerPx: U / 2 });
    assert.ok(Math.abs(at1000.label.card.text.label.font_size * 2 - at500.label.card.text.label.font_size) <= 0.2);

    // Longer text, a wider box; the box sits close to the text.
    const short = build('classic', { text: 'BAY' });
    const long = build('classic', { text: 'MAIN DEFLECTOR ARRAY' });
    assert.ok(long.label.size[0] > short.label.size[0]);
    assert.ok(long.label.size[0] < 20 * 13 * U); // well under 1 em per character
});

test('classic keeps the default sweep; Picard and tag get a tight bend', () => {
    assert.equal(build('classic').line.corner_radius, undefined);
    assert.ok(build('classic').line.anchor_gap > 0);
    assert.ok(build('picard').line.corner_radius > 0);
    const tag = build('tag');
    assert.equal(tag.label.card.preset, 'panel-dark');
    assert.equal(tag.line.anchor_gap, undefined); // the line touches the block
    assert.equal(tag.label.card.text.label.color, 'theme:colors.ui.secondary'); // readable on the block, as the engineering screen
});

test('bracket: a bar on the exit side, the line in the bar colour, from the end of the bar', () => {
    const level = build('bracket');
    assert.deepEqual(Object.keys(level.label.card.style.border.width), ['right']);
    assert.equal(level.label.card.style.border.width.right, Math.round(6 * U * 10) / 10);
    assert.equal(level.line.style.color, level.label.card.style.border.color);
    // the text clears the bar by about half an em (the inset counts from the box edge, the
    // bar inside it; 2026-11-19: 0.6 em left 3 px)
    const font = level.label.card.text.label.font_size;
    const air = level.label.card.text.label.padding.right - level.label.card.style.border.width.right;
    assert.ok(air >= font * 0.45, `${air} px between bar and text at ${font} px`);
    // Level, part above: the bar's top sits at the part's height, the line runs straight out of it.
    const h = level.label.size[1];
    assert.ok(Math.abs(level.label.position[1] - h / 2 - 120) < 0.2);
    assert.equal(level.line.anchor_side, 'top-right');
    assert.equal(level.line.corner_style, 'miter');
    // Part below the label: the bottom of the bar.
    const below = build('bracket', { labelPoint: [100, 50] });
    assert.equal(below.line.anchor_side, 'bottom-right');
    assert.ok(Math.abs(below.label.position[1] + h / 2 - 120) < 0.2);

    const angled = build('bracket', { bracketKind: 'angled', labelPoint: [700, 300] });
    assert.equal(angled.label.position[1], 300); // stays where it was clicked
    assert.deepEqual(Object.keys(angled.label.card.style.border.width), ['left']);
    assert.equal(angled.line.anchor_side, 'top-left');
    assert.equal(angled.line.route, 'angled');
    assert.equal(angled.line.route_hint, 'xy');
    assert.equal(angled.line.stub_length, Math.round(64 * U * 10) / 10);
    assert.equal(build('bracket', { bracketKind: 'angled', labelPoint: [700, 50] }).line.anchor_side, 'bottom-left');

    // Never the middle of the bar.
    for (const kind of ['level', 'angled']) {
        for (const p of [[100, 300], [100, 50], [700, 300], [700, 50]]) {
            assert.match(build('bracket', { bracketKind: kind, labelPoint: p }).line.anchor_side, /^(top|bottom)-(left|right)$/);
        }
    }
});

test('a named part: attach_to the id, arriving at its centre', () => {
    const { line } = build('classic', { target: 'warp_core', targetPoint: [400, 120] });
    assert.equal(line.attach_to, 'warp_core');
    assert.equal(line.attach_side, 'center');
    assert.deepEqual(build('classic').line.attach_to, [400, 120]);
    assert.equal(build('classic').line.attach_side, undefined);
});

test('ids are unique against the MSD and each other', () => {
    const overlays = [{ id: 'lbl_1' }, { id: 'ln_1' }, { id: 'ln_2' }];
    const { label, line } = build('classic', { overlays });
    assert.equal(label.id, 'lbl_2');
    assert.equal(line.id, 'ln_3');
    assert.equal(line.anchor, 'lbl_2');
    assert.equal(nextOverlayId([], 'lbl', new Set(['lbl_1'])), 'lbl_2');
});

test('the style is guessed from the labels already on the MSD', () => {
    assert.equal(guessQuickLabelStyle([]), null);
    const asOverlays = (built) => [built.label, built.line];
    for (const style of Object.keys(QUICK_LABEL_STYLES)) {
        assert.equal(guessQuickLabelStyle(asOverlays(build(style)))?.style, style, style);
    }
    assert.deepEqual(guessQuickLabelStyle(asOverlays(build('bracket', { bracketKind: 'angled' }))), { style: 'bracket', bracketKind: 'angled' });
    // A line between two plain controls tells nothing.
    assert.equal(guessQuickLabelStyle([
        { id: 'a', type: 'control', card: { type: 'custom:lcards-slider' } },
        { id: 'l', type: 'line', anchor: 'a', attach_to: [0, 0] }
    ]), null);
});

test('sizes are a share of the drawing; new labels match the MSD\'s own', () => {
    // Medium: the pattern's 13 px at 500 px wide, whatever the view box.
    assert.equal(unitsPerPxForSize(1160, 'medium'), 1160 / 500);
    assert.equal(unitsPerPxForSize(1160), 1160 / 500);
    // Each size larger than the one before.
    const order = Object.keys(QUICK_LABEL_SIZES).map(k => unitsPerPxForSize(1160, k));
    assert.deepEqual(order, [...order].sort((x, y) => x - y));
    assert.equal(new Set(order).size, order.length);

    assert.equal(guessQuickLabelSize([], 1160), null);
    for (const size of Object.keys(QUICK_LABEL_SIZES)) {
        const { label, line } = build('picard', { unitsPerPx: unitsPerPxForSize(1160, size) });
        assert.equal(guessQuickLabelSize([line, label], 1160), size, size);
    }
    // The patterns page example: font_size 28 in a 1160 view box reads as Medium.
    const text = (card) => [{ id: 'a', type: 'control', card }];
    assert.equal(guessQuickLabelSize(text({ type: 'custom:lcards-button', preset: 'text-only', text: { label: { font_size: 28 } } }), 1160), 'medium');
    // Other cards do not count.
    assert.equal(guessQuickLabelSize(text({ type: 'custom:lcards-slider', text: { label: { font_size: 28 } } }), 1160), null);
});

test('a control box follows its attachment (controls default to centre)', () => {
    assert.deepEqual(controlBox({ position: [100, 50], size: [40, 20] }), { x: 80, y: 40, w: 40, h: 20 });
    assert.deepEqual(controlBox({ position: [100, 50], size: [40, 20], attachment: 'right' }), { x: 60, y: 40, w: 40, h: 20 });
    assert.deepEqual(controlBox({ position: [100, 50], size: [40, 20], attachment: 'top-left' }), { x: 100, y: 50, w: 40, h: 20 });
    assert.equal(controlBox({ anchor: 'x' }), null);
});

test('label placement snaps into line with the other labels', () => {
    const { label } = build('classic'); // right edge on x 100, middle on y 300
    const others = [label, { id: 'slider', type: 'control', position: [500, 500], size: [40, 40], card: { type: 'custom:lcards-slider' } }];
    // Near the label's right edge and its row: both snap, with guides.
    const s = snapLabelPoint([104, 296], others, 8);
    assert.deepEqual(s.point, [100, 300]);
    assert.equal(s.guideX, 100);
    assert.equal(s.guideY, 300);
    // Its left edge is a column too.
    const left = label.position[0] - label.size[0];
    assert.equal(snapLabelPoint([left + 3, 600], others, 8).guideX, left);
    // Out of reach, or near a control that is not a label: unchanged.
    assert.deepEqual(snapLabelPoint([300, 600], others, 8), { point: [300, 600], guideX: null, guideY: null });
    assert.equal(snapLabelPoint([522, 520], others, 8).guideX, null);
});

test('the part click snaps to the nearest named point in reach', () => {
    const slider = { id: 'slider', type: 'control', position: [500, 500], size: [40, 40] };
    const points = controlConnectionPoints(slider);
    assert.equal(points.length, 9);
    assert.deepEqual(points.find(p => p.side === 'top')?.point, [500, 480]);
    assert.deepEqual(points.find(p => p.side === null)?.point, [500, 500]);
    const candidates = [{ id: 'warp_core', side: null, point: [100, 100] }, ...points];
    assert.equal(nearestSnapTarget([104, 97], candidates, 12)?.id, 'warp_core');
    assert.equal(nearestSnapTarget([519, 503], candidates, 12)?.side, 'right');
    assert.equal(nearestSnapTarget([300, 300], candidates, 12), null);
    // A snapped side becomes the line's attach_side.
    const { line } = build('classic', { target: 'slider', targetSide: 'right', targetPoint: [520, 500] });
    assert.equal(line.attach_side, 'right');
});

test('the part click skips drawing ids a tool made up', () => {
    for (const n of ['g46-3', 'path123', 'rect4-7', 'layer1', 'svg_2', 'circle12']) assert.equal(isNamedAnchor(n), false, n);
    for (const n of ['warp_core', 'bridge', 'deflector', 'nacelle_port', 'g_bridge', 'path_main']) assert.equal(isNamedAnchor(n), true, n);
});
