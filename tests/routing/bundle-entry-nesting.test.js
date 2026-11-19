/**
 * Bundle entry with no room further on (2026-11-19, the Live Demo's routing view):
 * four lines from the left join one discovered trunk over an obstacle, and the
 * trunk starts right where the lines bend, so the comb's shared bend spot
 * (_pushBundledApproachLegs, bundle-entry-radius-coordination.test.js) left B and
 * C climbing two units apart. B's short climb is a full-radius reverse curve whose
 * upper arc swept through C's climb (the two drawn lines touched). The conflict
 * search now bends a line EARLIER when it cannot bend later: B turns inside C,
 * the corners nested.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RouterCore } from '../../src/msd/routing/RouterCore.js';
import { runDiscoveryLoop, makeLine, renderedClearance, countRenderedCrossings, flattenSvgPath } from './helpers/router-harness.js';

/** The view's first example: production's discovery loop, then its declaration-order render pass. */
function liveDemoComb() {
    const anchors = { t1: [570, 110], t2: [570, 135], t3: [570, 160], t4: [570, 185] };
    const router = new RouterCore({ trunk_line_spacing: 10, clearance: 10 }, anchors, [0, 0, 600, 300]);
    router.setOverlays([{ id: 'obstacle', _raw: { id: 'obstacle', type: 'control', position: [300, 150], size: [140, 70], obstacle: true } }]);
    // AdvancedRenderer gives a line leaving a control the side facing its target
    const raw = { route: 'auto', corner_style: 'round', anchor_side: 'right', style: { width: 3 } };
    const lines = [
        makeLine('l1', [105, 50], anchors.t1, raw),
        makeLine('l2', [105, 115], anchors.t2, raw),
        makeLine('l3', [105, 185], anchors.t3, raw),
        makeLine('l4', [105, 250], anchors.t4, raw),
    ];
    const { results } = runDiscoveryLoop(router, lines);
    for (const l of lines) results.set(l.id, router.computePath(router.buildRouteRequest(l, l.a, l.b)));
    return results;
}

// left of the targets: the four dots sit on one vertical, so every line comes down onto them together
const entry = (/** @type {number[]} */ p) => p[0] < 540;

test('lines joining a trunk that starts where they bend never touch: the shorter climb bends inside the longer', () => {
    const r = liveDemoComb();
    const ids = ['l1', 'l2', 'l3', 'l4'];
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const { gap, at } = renderedClearance(r.get(ids[i]).d, r.get(ids[j]).d, 3, 3, entry);
            assert.ok(gap >= 1, `${ids[i]} and ${ids[j]} touch (gap ${gap.toFixed(1)} at ${at.map(Math.round)})`);
            const a = flattenSvgPath(r.get(ids[i]).d).filter(entry);
            const b = flattenSvgPath(r.get(ids[j]).d).filter(entry);
            assert.equal(countRenderedCrossings(a, b), 0, `${ids[i]} crosses ${ids[j]}`);
        }
    }
    // B (the shorter climb) turns before C: its climb column is left of C's
    const climb = (/** @type {string} */ id) => r.get(id).pts.find((/** @type {number[]} */ p, /** @type {number} */ k, /** @type {number[][]} */ pts) => k > 0 && p[0] === pts[k + 1]?.[0] && p[0] < 300)?.[0];
    assert.ok(climb('l2') < climb('l3'), `B climbs at ${climb('l2')}, C at ${climb('l3')}`);
});

test('a line only trying a corridor gets no earlier bend: the line overlay docs example still settles', () => {
    // card_a's right side to card_b's left, and bottom to bottom (doc/cards/msd/line-overlay.md).
    // Offered an earlier bend into the other line's trunk, h joined, v moved its climb away,
    // h left, v came back: a 2-cycle to the pass cap, h's corner drawn against v's old place.
    const router = new RouterCore({}, {}, [0, 0, 600, 260]);
    router.setOverlays([]);
    const lines = [
        makeLine('h', [220, 70], [380, 190], { route: 'auto', anchor_side: 'right', attach_side: 'left', style: { width: 4 } }),
        makeLine('v', [130, 100], [470, 220], { route: 'auto', anchor_side: 'bottom', attach_side: 'bottom', style: { width: 4 } }),
    ];
    const { passes, results } = runDiscoveryLoop(router, lines);
    assert.ok(passes < (router._trunkDiscoveryMaxPasses ?? 4), `settles (${passes} passes)`);
    for (const l of lines) results.set(l.id, router.computePath(router.buildRouteRequest(l, l.a, l.b)));
    const radius = Number(/A([\d.]+)/.exec(results.get('h').d)?.[1]);
    assert.ok(radius > 30, `h keeps its full corner (${radius})`);
});

test('the bundle entry settles (before, B swung between two entries on every pass)', () => {
    const anchors = { t1: [570, 110], t2: [570, 135], t3: [570, 160], t4: [570, 185] };
    const router = new RouterCore({ trunk_line_spacing: 10, clearance: 10 }, anchors, [0, 0, 600, 300]);
    router.setOverlays([{ id: 'obstacle', _raw: { id: 'obstacle', type: 'control', position: [300, 150], size: [140, 70], obstacle: true } }]);
    const raw = { route: 'auto', corner_style: 'round', anchor_side: 'right', style: { width: 3 } };
    const lines = [[105, 50], [105, 115], [105, 185], [105, 250]].map((a, i) => makeLine(`l${i + 1}`, a, anchors[`t${i + 1}`], raw));
    // routed until a whole pass changes nothing (the renderer stops at its pass cap; this
    // asks whether there is a fixed point at all)
    let last = -1;
    let passes = 0;
    while (router._registryVersion !== last && passes < 8) {
        last = router._registryVersion;
        for (const l of lines) router.computePath(router.buildRouteRequest(l, l.a, l.b));
        passes++;
    }
    assert.ok(passes < 8, 'settles');
});
