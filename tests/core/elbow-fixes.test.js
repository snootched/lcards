/**
 * Elbow card fixes from the D2 docs audit (2026-11-07): the pure parts. The
 * rendering side of each is in tests/browser/elbow-fixes.spec.js; the schema
 * accepting the segment keys is in tests/docs/config-validator.test.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getElbowSchema } from '../../src/cards/schemas/elbow-schema.js';
import { elbowComponents as ELBOW_COMPONENTS } from '../../src/core/packs/components/elbows/index.js';
import {
    concentricInnerCurve, parseFrameConfig, frameLengthValues, elbowContentInsets, translatePath,
    segmentActions, segmentOwnsInput, themeBindings, parseSegmentBar,
} from '../../src/cards/elbow-config.js';

const layoutOf = (type) => ({ type, ...ELBOW_COMPONENTS[type].layout });

test('content insets follow each type\'s arms: open has no side arm, contained has both, bar types none', () => {
    const g = { horizontal: 90, vertical: 20 };
    const insets = (type) => elbowContentInsets({ ...g, type }, layoutOf(type));
    assert.deepEqual(insets('header-left'), { top: 20, right: 0, bottom: 0, left: 90 });
    assert.deepEqual(insets('footer-right'), { top: 0, right: 90, bottom: 20, left: 0 });
    assert.deepEqual(insets('header-open'), { top: 20, right: 0, bottom: 0, left: 0 });
    assert.deepEqual(insets('footer-open'), { top: 0, right: 0, bottom: 20, left: 0 });
    assert.deepEqual(insets('header-contained'), { top: 20, right: 90, bottom: 0, left: 90 });
    assert.deepEqual(insets('footer-contained'), { top: 0, right: 90, bottom: 20, left: 90 });
    assert.deepEqual(insets('diagonal-cap-footer-left'), { top: 0, right: 0, bottom: 20, left: 90 });
    for (const type of ['bar-slant-left', 'bar-slant-right', 'bar-parallelogram']) {
        assert.deepEqual(insets(type), { top: 0, right: 0, bottom: 0, left: 0 }, type);
    }
    // segmented: the whole bar stack
    const seg = { type: 'header-right', outer: { horizontal: 90, vertical: 20 }, inner: { horizontal: 30, vertical: 10 }, gap: 4 };
    assert.deepEqual(elbowContentInsets(seg, layoutOf('header-right')), { top: 34, right: 124, bottom: 0, left: 0 });
    // frame: every enabled side, plus gap and inner ring
    const frame = parseFrameConfig({ bar_width: 30, bar_height: 10, right: { enabled: false }, segments: { gap: 5, inner_frame: { bar_width: 4 } } }, 'segmented');
    assert.deepEqual(elbowContentInsets({ type: 'frame', sides: frame.sides, inner: frame.segments?.inner, gap: frame.segments?.gap }, layoutOf('frame')),
        { top: 19, right: 9, bottom: 19, left: 39 }); // the inner ring keeps its right side
});

test('frame lengths: CSS lengths go through the measurer, defaults derive from the measured values', () => {
    const measured = [];
    const toPx = (v) => { measured.push(v); return typeof v === 'string' && v.startsWith('clamp') ? 40 : Number(v) || 0; };
    const f = parseFrameConfig({ bar_width: 'clamp(20px, 3vw, 40px)', top: { bar_height: 12 } }, 'simple', toPx);
    assert.equal(f.sides.left.thickness, 40);
    assert.equal(f.sides.right.thickness, 40);
    assert.equal(f.sides.bottom.thickness, 40);          // bar_height defaults to bar_width
    assert.equal(f.sides.top.thickness, 12);
    assert.equal(f.corners.top_left.outer, 20);          // half of the measured bar_width
    assert.equal(f.corners.top_left.inner, 10);
    assert.ok(measured.includes('clamp(20px, 3vw, 40px)'));
    assert.equal(f.segments, undefined);
    // segmented: inner ring defaults (28) and its colour (null = the outer ring's)
    const s = parseFrameConfig({}, 'segmented');
    assert.equal(s.segments?.gap, 4);
    assert.equal(s.segments?.inner.sides.left.thickness, 28);
    assert.equal(s.segments?.inner.color, null);
    assert.deepEqual(frameLengthValues({ bar_width: 'calc(1vw)', corners: { top_left: { outer_curve: 3 } }, segments: { inner_frame: { left: { thickness: '2vw' } } } }),
        ['calc(1vw)', 3, '2vw']);
});

test('translatePath moves absolute coordinates (arc end points, not radii)', () => {
    assert.equal(translatePath('M 0 0 L 10 0 A 5 5 0 0 1 15 5 Z', 100, 50), 'M 100 50 L 110 50 A 5 5 0 0 1 115 55 Z');
    assert.equal(translatePath('M 1 2 H 5 V 7 Z', 10, 20), 'M 11 22 H 15 V 27 Z');
    assert.equal(translatePath('M 1 2 l 3 4', 10, 10), 'M 11 12 l 3 4');
    assert.equal(translatePath('M 1 2', 0, 0), 'M 1 2');
});

test('segment actions: the segment\'s own, else the card\'s; on the segment\'s entity, else the card\'s', () => {
    const card = { entity: 'light.card', tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' } };
    assert.deepEqual(segmentActions({ entity_id: 'switch.seg', double_tap_action: { action: 'none' } }, card), {
        actions: { tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' }, double_tap_action: { action: 'none' } },
        entity: 'switch.seg',
    });
    assert.deepEqual(segmentActions({ tap_action: { action: 'more-info' } }, { entity: 'light.card' }, { action: 'none' }).actions.tap_action, { action: 'more-info' });
    assert.deepEqual(segmentActions({}, {}, { action: 'none' }), { actions: { tap_action: { action: 'none' }, hold_action: undefined, double_tap_action: undefined }, entity: undefined });
    assert.equal(segmentOwnsInput({ bar_width: 10 }), false);
    assert.equal(segmentOwnsInput({ entity_id: 'switch.x' }), true);
    assert.equal(segmentOwnsInput({ hold_action: { action: 'none' } }), true);
});

test('segmented bars keep theme; the helpers a segment is bound to are tracked on either segment', () => {
    const css = (v) => typeof v === 'string' && v.includes('(');
    assert.equal(parseSegmentBar('theme', 'input_number.lcars_vertical', css), 'theme');
    assert.equal(parseSegmentBar('input_number.lcars_vertical', 'input_number.lcars_vertical', css), 'theme');
    assert.equal(parseSegmentBar('clamp(1px, 2vw, 3px)', 'x', css), 'clamp(1px, 2vw, 3px)');
    assert.equal(parseSegmentBar('40', 'x', css), 40);
    assert.equal(parseSegmentBar(undefined, 'x', css), undefined);
    // bar_height defaults to bar_width, keyword and all (as in the simple style)
    assert.deepEqual(themeBindings({ style: 'segmented', segments: { outer_segment: { bar_width: 90 }, inner_segment: { bar_width: 'theme' } } }),
        { vertical: true, horizontal: true, angle: false });
    assert.deepEqual(themeBindings({ style: 'segmented', segments: { outer_segment: { bar_width: 90, bar_height: 'theme', diagonal_angle: 'theme' }, inner_segment: { bar_width: 30 } } }),
        { vertical: false, horizontal: true, angle: true });
    assert.deepEqual(themeBindings({ style: 'simple', segment: { bar_width: 'theme', bar_height: 20 } }), { vertical: true, horizontal: false, angle: false });
});

test('schema: segments declare what the card reads; segment and symbiont defaults match the code', () => {
    const elbow = getElbowSchema().properties.elbow.properties;
    for (const key of ['outer_segment', 'inner_segment']) {
        const props = elbow.segments.properties[key].properties;
        for (const k of ['entity_id', 'outer_curve_clamp', 'diagonal_angle', 'color', 'tap_action', 'hold_action', 'double_tap_action']) {
            assert.ok(props[k], `${key}.${k}`);
            assert.ok(props[k].description, `${key}.${k} has a description`);
        }
    }
    // bar_height defaults to bar_width (no fixed 20 anywhere), bar_width to 90
    assert.deepEqual(elbow.segment.default, { bar_width: 90, outer_curve: 'auto' });
    assert.ok(elbow.segment.properties.bar_height.oneOf.every(b => b.default === undefined));
    const pos = getElbowSchema().properties.symbiont.properties.position.properties;
    assert.deepEqual(Object.fromEntries(Object.entries(pos).map(([k, v]) => [k, v.default])), { top: 0, left: 0, right: 0, bottom: 0 });
});

test('segmented elbow: a thin inner band keeps one even width round the corner (2026-11-11)', () => {
    // Pilot header: outer segment 134 x 20 (outer radius 67, inner 33.5), gap 6 -> the inner
    // segment's outer radius 27.5. A 5 x 4 band used half of it (13.75) round another centre,
    // so it swelled at the corner; R - bar puts both arcs round (nearly) one centre.
    const R = 27.5;
    assert.equal(concentricInnerCurve(R, 5, 4), 22.5);
    // centre of the band's outer arc vs its inner arc, measured from the band's corner
    assert.equal(R, 5 + concentricInnerCurve(R, 5, 4));
    // Uniform whenever the curve is bigger than the bar (the user, 2026-11-11: equal bars,
    // uniform bend), so 40 round a 24 bar -> 16, not the classic 20
    assert.equal(concentricInnerCurve(40, 24, 24), 16);
    // A curve no bigger than the bar (the classic thick LCARS elbow): half the outer radius
    assert.equal(concentricInnerCurve(30, 60, 60), 15);
    assert.equal(concentricInnerCurve(45, 90, 90), 22.5);
    // Sizes not known as px yet (CSS lengths): the classic half
    assert.equal(concentricInnerCurve(40, 'clamp(10px, 2vw, 20px)', 10), 20);
});

test('frame: a corner beside an open side is a square bar end; thin bars keep one width round a corner (2026-11-11)', () => {
    // The utility bracket: left side off -> its top-left and bottom-left are bar ends
    const bracket = parseFrameConfig({ bar_width: 14, bar_height: 36, outer_curve: 36, left: { enabled: false } }, 'simple');
    assert.deepEqual(bracket.corners.top_left, { outer: 0, inner: 0 });
    assert.deepEqual(bracket.corners.bottom_left, { outer: 0, inner: 0 });
    // the turning corners keep the curve; a curve no bigger than the 36 bar -> the classic half
    assert.deepEqual(bracket.corners.top_right, { outer: 36, inner: 18 });
    // Equal 24 bars round a 40 curve: uniform, 16
    assert.deepEqual(parseFrameConfig({ bar_width: 24, outer_curve: 40, top: { enabled: false } }, 'simple').corners.bottom_left, { outer: 40, inner: 16 });
    // A corner's own curve still wins on an open side (a rounded bar end on purpose)
    const rounded = parseFrameConfig({ right: { enabled: false }, corners: { top_right: { outer_curve: 20 } } }, 'simple');
    assert.equal(rounded.corners.top_right.outer, 20);
    // Display sweep: thin bars (14 / 12) with outer 60 -> inner 60 - 14 = 46, not 30
    const sweep = parseFrameConfig({ bar_width: 14, bar_height: 12, outer_curve: 60, right: { enabled: false } }, 'simple');
    assert.deepEqual(sweep.corners.top_left, { outer: 60, inner: 46 });
    assert.deepEqual(sweep.corners.top_right, { outer: 0, inner: 0 });
    // Thick default bars keep the classic half of the outer radius
    assert.deepEqual(parseFrameConfig({}, 'simple').corners.top_left, { outer: 45, inner: 23 });
});
