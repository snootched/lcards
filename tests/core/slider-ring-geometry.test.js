/**
 * Ring gauge geometry (slider `component: ring`): sweep, layout, angle to value
 * with the gap, the seam guard while dragging, step rounding, ticks, text zones.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeSweep, thicknessPx, ringLayout, arcExtent, polar, arcPath, fractionToAngle,
    pointToFraction, hitsRing, snapValue, fractionToValue, scaleValues, estimateTextWidth, labelCentre, ringTextZones, markerRadialSpan, ringMarkerSize,
} from '../../src/cards/slider-ring-geometry.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('sweep wraps an end at or before the start, equal angles are a full ring', () => {
    assert.equal(normalizeSweep(-135, 135), 270);
    assert.equal(normalizeSweep(90, 0), 270);          // across 0
    assert.equal(normalizeSweep(200, -160), 360);        // the same angle: full ring
    assert.equal(normalizeSweep(200, 200 + 40), 40);
    assert.equal(normalizeSweep(0, 0), 360);
    assert.equal(normalizeSweep(-170, 170), 340);
    assert.equal(normalizeSweep(undefined, undefined), 270);
});

test('thickness: % of the diameter, px number or string, capped below the radius', () => {
    assert.equal(thicknessPx('10%', 100), 20);
    assert.equal(thicknessPx(14, 100), 14);
    assert.equal(thicknessPx('14px', 100), 14);
    near(thicknessPx(undefined, 100), 24);               // default 12%
    assert.equal(thicknessPx(500, 100), 90);              // 0.9 r cap
});

test('layout centres a full ring at the smaller side for square, wide and tall boxes', () => {
    for (const [w, h] of [[200, 200], [400, 200], [200, 400]]) {
        const l = ringLayout(w, h, { thickness: 20, start_angle: 0, end_angle: 360 });
        assert.equal(l.cx, w / 2);
        assert.equal(l.cy, h / 2);
        assert.equal(l.rOuter, 99);
        assert.equal(l.rInner, 79);
        assert.equal(l.rMid, 89);
        assert.equal(l.box.width, 200);
        near(l.inner.width, 79 * Math.SQRT2);
        near(l.inner.x + l.inner.width / 2, l.cx);
    }
    // Room outside the ring for ticks, markers and labels; never more than leaves a usable ring.
    const FULL = { start_angle: 0, end_angle: 360 };
    const t = ringLayout(200, 200, FULL, { outerPad: 20 });
    assert.equal(t.rOuter, 100 - 20 - 1);
    assert.equal(ringLayout(200, 200, FULL, { outerPad: 500 }).rOuter, 10 - 1);
});

test('arc extent: the arc\'s ends, the top/right/bottom/left points it passes, and its centre', () => {
    assert.deepEqual(arcExtent(0, 360), { minX: -1, maxX: 1, minY: -1, maxY: 1 });
    // a half ring over the top (left to right through the top)
    assert.deepEqual(arcExtent(-90, 180), { minX: -1, maxX: 1, minY: -1, maxY: 0 });
    // a quarter, top to right
    assert.deepEqual(arcExtent(0, 90), { minX: 0, maxX: 1, minY: -1, maxY: 0 });
    // the default three-quarter ring (-135 to 135): open at the bottom, its ends 0.707 down
    const d = arcExtent(-135, 270);
    assert.deepEqual([d.minX, d.maxX, d.minY], [-1, 1, -1]);
    near(d.maxY, Math.SQRT1_2);
});

test('a partial ring fits its arc: a half ring fills a wide box, its arc touches the edges, its text stays inside', () => {
    // a half ring over the top in a 400 x 200 box: as wide as the box (not a 200 square in it)
    const half = ringLayout(400, 200, { start_angle: -90, end_angle: 90, thickness: 20 });
    assert.equal(half.rOuter + 1, 200);
    near(half.cx, 200);
    near(half.cy, 200, 1e-9);
    assert.deepEqual([half.box.x, half.box.y, half.box.width, half.box.height], [0, 0, 400, 200]);
    // the centre text: in the open half, above the cut, inside the box
    assert.ok(half.inner.y >= half.box.y && half.inner.y + half.inner.height <= half.box.y + half.box.height + 1e-9);
    // a quarter ring (top to right) in a square: its corner at the bottom left
    const q = ringLayout(200, 200, { start_angle: 0, end_angle: 90 });
    assert.equal(q.rOuter + 1, 200);
    near(q.cx, 0); near(q.cy, 200);
    // the default three-quarter ring in a square: as wide as the box (radius as before), moved down so
    // its shape is centred (its open bottom is shorter than its top half)
    const d = ringLayout(200, 200, {});
    assert.equal(d.rOuter + 1, 100);
    near(d.cy, (200 - 100 * (1 + Math.SQRT1_2)) / 2 + 100);
    // in a wide box it grows into the room its open bottom leaves
    near(ringLayout(400, 200, {}).rOuter + 1, 200 / (1 + Math.SQRT1_2));
    // padding goes round the arc's box
    const p = ringLayout(400, 220, { start_angle: -90, end_angle: 90 }, { outerPad: 10 });
    near(p.rOuter + 1, 190);
    near(p.cx, 200); near(p.cy, (220 - 210) / 2 + 10 + 190);
});

test('angles: 0 is the top, clockwise', () => {
    const p = polar(0, 0, 10, 90);
    near(p.x, 10); near(p.y, 0);
    const q = polar(0, 0, 10, 180);
    near(q.x, 0); near(q.y, 10);
    assert.equal(fractionToAngle(0.5, -135, 270), 0);
    assert.equal(fractionToAngle(2, -135, 270), 135);
});

test('arc paths: large-arc flag past 180, reverse direction, full turn as two arcs', () => {
    assert.match(arcPath(0, 0, 10, -135, 135), /A 10 10 0 1 1 /);
    assert.match(arcPath(0, 0, 10, 0, 90), /A 10 10 0 0 1 /);
    assert.match(arcPath(0, 0, 10, 90, 0), /A 10 10 0 0 0 /);
    const full = arcPath(0, 0, 10, 0, 360);
    assert.equal((full.match(/A /g) || []).length, 2);
    assert.equal((full.match(/M /g) || []).length, 1);
});

test('pointer angle to fraction along a 270 degree ring with the gap at the bottom', () => {
    const l = { cx: 0, cy: 0, start: -135, sweep: 270 };
    near(pointToFraction(0, -10, l), 0.5);                // top
    near(pointToFraction(10, 0, l), 225 / 270);           // right (90deg)
    near(pointToFraction(-10, 0, l), 45 / 270);           // left (-90deg)
    // In the gap: snaps to the nearer end.
    assert.equal(pointToFraction(-1, 10, l), 0);          // just left of bottom: start side
    assert.equal(pointToFraction(1, 10, l), 1);           // just right of bottom: end side
});

test('start/end across 0: a ring from 90 to 0 (gap top-right)', () => {
    const l = { cx: 0, cy: 0, start: 90, sweep: normalizeSweep(90, 0) };
    near(pointToFraction(10, 0, l), 0);                   // 90deg = start
    near(pointToFraction(0, 10, l), 1 / 3);               // 180deg
    near(pointToFraction(0, -10, l), 1);                  // 0deg = end
});

test('dragging never wraps across the gap or the seam of a full ring', () => {
    const gap = { cx: 0, cy: 0, start: -135, sweep: 270 };
    // At the end, moving into the far side of the gap keeps the end.
    assert.equal(pointToFraction(-1, 10, gap, 0.98), 1);
    assert.equal(pointToFraction(1, 10, gap, 0.02), 0);
    const full = { cx: 0, cy: 0, start: 0, sweep: 360 };
    near(pointToFraction(10, 0, full), 0.25);
    // Just past the top from 0.98: would be ~0.01, stays at 1.
    assert.equal(pointToFraction(0.2, -10, full, 0.98), 1);
    assert.equal(pointToFraction(-0.2, -10, full, 0.02), 0);
    // A press (no previous fraction) jumps freely.
    near(pointToFraction(-10, 0, full, null), 0.75);
});

test('hit test: only the ring band (with tolerance) starts a drag', () => {
    const l = { cx: 100, cy: 100, rInner: 80, rOuter: 100 };
    assert.equal(hitsRing(100, 10, l), true);              // on the band
    assert.equal(hitsRing(100, 100, l), false);            // centre text
    assert.equal(hitsRing(100, 25, l, 8), true);           // 75 from centre, inside tolerance
    assert.equal(hitsRing(100, 30, l, 8), false);
});

test('step rounding and clamping', () => {
    assert.equal(snapValue(21.26, 15, 30, 0.5), 21.5);
    assert.equal(snapValue(0.30000000004, 0, 1, 0.1), 0.3);
    assert.equal(snapValue(120, 0, 100, 1), 100);
    assert.equal(snapValue(-3, 0, 100, 5), 0);
    assert.equal(snapValue(42, 0, 100, 0), 42);           // step 0 falls back to 1
});

test('fraction to value: maps the display range, clamps to the control range', () => {
    assert.equal(fractionToValue(0.5, { min: 0, max: 100 }, { min: 0, max: 100, step: 1 }), 50);
    assert.equal(fractionToValue(0.9, { min: 0, max: 100 }, { min: 10, max: 80, step: 1 }), 80);
    assert.equal(fractionToValue(0.333, { min: 15, max: 30 }, { min: 15, max: 30, step: 0.5 }), 20);
});

test('scale values: from min by interval, inclusive, minor ticks skip the majors', () => {
    assert.deepEqual(scaleValues(0, 100, 25), [0, 25, 50, 75, 100]);
    assert.deepEqual(scaleValues(15, 30, 2.5), [15, 17.5, 20, 22.5, 25, 27.5, 30]);
    assert.deepEqual(scaleValues(0, 10, 2, 5), [2, 4, 6, 8]);
    assert.deepEqual(scaleValues(0, 1, 0.1).length, 11);              // float tolerance keeps the end
    assert.deepEqual(scaleValues(0, 100, 0), []);
    assert.deepEqual(scaleValues(100, 0, 50), [0, 50, 100]);           // reversed bounds
});

test('labels sit outside the ring: wide labels pushed further out at the sides', () => {
    assert.equal(estimateTextWidth('100', 10), 16.5);
    const top = labelCentre(0, 0, 50, 0, 40, 10);
    near(top.x, 0); near(top.y, -55);                                  // half the height above r0
    const right = labelCentre(0, 0, 50, 90, 40, 10);
    near(right.x, 70); near(right.y, 0);                               // half the width beside r0
});

test('markers: line from the inner edge past the ring; triangle outside pointing in; dot on the band', () => {
    const l = { rInner: 80, rOuter: 100, rMid: 90 };
    assert.deepEqual(ringMarkerSize('line', 20), { width: 4, height: 26 });
    assert.deepEqual(markerRadialSpan('line', 'start', l, 26), { r0: 80, r1: 106, tip: 80 });
    assert.deepEqual(markerRadialSpan('triangle', 'end', l, 10), { r0: 100, r1: 110, tip: 100 });
    assert.deepEqual(markerRadialSpan('triangle', 'start', l, 10), { r0: 70, r1: 80, tip: 80 });   // inside, points out
    assert.deepEqual(markerRadialSpan('round', 'center', l, 10), { r0: 85, r1: 95, tip: 85 });
    assert.deepEqual(markerRadialSpan('triangle', 'end', l, 10, 4), { r0: 104, r1: 114, tip: 104 }); // offset outward
});

test('text zones split the inner square into label, value and sublabel', () => {
    const z = ringTextZones({ x: 10, y: 20, width: 100, height: 100 });
    assert.deepEqual(z.center, { x: 10, y: 20, width: 100, height: 100 });
    near(z.label.height + z.value.height + z.sublabel.height, 100);
    near(z.value.y, 20 + 28);
    near(z.sublabel.y + z.sublabel.height, 120);
});
