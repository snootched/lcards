/**
 * The routing lab (tests/routing/lab-scenes.js, the dev board's msd-routing-lab view):
 * every scene routed as the card routes it (the discovery loop to its pass cap, then
 * the declaration-order render pass) and held to the general rules. A scene with
 * `checks.known` is a known limitation: its rules run as a todo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { RouterCore } from '../../src/msd/routing/RouterCore.js';
import {
    runDiscoveryLoop, renderedClearance, countRenderedCrossings, flattenSvgPath,
    findIllegalReversal, findDiagonalSegment, findSelfCrossing,
} from './helpers/router-harness.js';
import { LAB_SCENES, LAB_LINE_WIDTH } from './lab-scenes.js';

/** A scene's router and lines, as the card builds them (scripts/make-routing-lab.mjs). */
function build(scene) {
    const anchors = {};
    for (const l of scene.lines) {
        anchors[`${l.id}_a`] = l.from;
        anchors[`${l.id}_b`] = l.to;
    }
    const router = new RouterCore({ ...(scene.routing ?? {}), ...(scene.channels ? { channels: scene.channels } : {}) }, anchors, scene.viewBox);
    router.setOverlays((scene.obstacles ?? []).map(o => ({ id: o.id, _raw: { id: o.id, type: 'control', position: o.at, size: o.size, obstacle: true } })));
    const lines = scene.lines.map(({ id, from, to, color, ...keys }) => ({
        id, a: from, b: to,
        _raw: { id, route: 'auto', corner_style: 'round', ...keys, style: { width: LAB_LINE_WIDTH } },
    }));
    return { router, lines };
}

/** Routed as the card does: discovery to the pass cap, then the render pass. */
function route(scene) {
    const { router, lines } = build(scene);
    const { results } = runDiscoveryLoop(router, lines);
    for (const l of lines) results.set(l.id, router.computePath(router.buildRouteRequest(l, l.a, l.b)));
    return results;
}

/** Whole passes until one changes nothing; Infinity when 8 don't get there. */
function passesToSettle(scene) {
    const { router, lines } = build(scene);
    let last = -1;
    for (let pass = 0; pass < 8; pass++) {
        if (router._registryVersion === last) return pass;
        last = router._registryVersion;
        for (const l of lines) router.computePath(router.buildRouteRequest(l, l.a, l.b));
    }
    return Infinity;
}

/**
 * A pointless sideways step smaller than one lane: two opposite turns with parallel runs
 * either side, less than `spacing` across, on a line that moves on that axis elsewhere
 * too (so the step could have been part of that move, or is undone by it). A line
 * pulled into a trunk's lane it nearly had already.
 * @param {number[][]} pts
 * @param {number} spacing
 */
function subLaneJog(pts, spacing) {
    for (let i = 1; i < pts.length - 2; i++) {
        const [a, b, c, d] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
        const horizontalRuns = a[1] === b[1] && c[1] === d[1] && b[0] === c[0] && Math.sign(b[0] - a[0]) === Math.sign(d[0] - c[0]);
        const verticalRuns = a[0] === b[0] && c[0] === d[0] && b[1] === c[1] && Math.sign(b[1] - a[1]) === Math.sign(d[1] - c[1]);
        const step = horizontalRuns ? Math.abs(c[1] - b[1]) : verticalRuns ? Math.abs(c[0] - b[0]) : 0;
        if (!(step > 0 && step <= spacing)) continue;
        // needed when it is the line's only move on that axis (its end sits that far off
        // its start row); pointless when another move on the axis could take it, or
        // undoes it
        const axis = horizontalRuns ? 1 : 0;
        const moves = pts.slice(1).filter((p, k) => p[axis] !== pts[k][axis] && p[1 - axis] === pts[k][1 - axis]).length;
        if (moves > 1) return { at: b, step };
    }
    return null;
}

const lastRadius = (/** @type {string} */ d) => Number([...d.matchAll(/A([\d.]+)/g)].at(-1)?.[1] ?? 0);

/**
 * A flattened path without its collinear points: a crossing that lands exactly on a
 * line's own straight-through vertex (an anchor stub's end) is otherwise skipped by
 * countRenderedCrossings, which leaves out segment ends.
 * @param {number[][]} pts
 */
function straightRuns(pts) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const [a, b, c] = [out[out.length - 1], pts[i], pts[i + 1]];
        if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-6) out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
}

test('the routing lab view is generated from the scenes (node scripts/make-routing-lab.mjs)', () => {
    assert.doesNotThrow(() => execFileSync(process.execPath, ['scripts/make-routing-lab.mjs', '--check'], { stdio: 'pipe' }));
});

for (const scene of LAB_SCENES) {
    test(`routing lab ${scene.id}: ${scene.title}`, { todo: scene.checks.known }, () => {
        const results = route(scene);
        const ids = scene.lines.map(l => l.id);
        const problems = [];
        for (const id of ids) {
            const { pts, d } = results.get(id);
            if (!d) { problems.push(`${id}: no route`); continue; }
            if (findIllegalReversal(pts)) problems.push(`${id}: reverses`);
            if (findDiagonalSegment(pts)) problems.push(`${id}: diagonal segment`);
            if (findSelfCrossing(pts)) problems.push(`${id}: crosses itself`);
            const jog = subLaneJog(pts, Number(scene.routing?.trunk_line_spacing ?? 8));
            if (jog) problems.push(`${id}: a ${Math.round(jog.step)} unit sideways step at ${jog.at.map(Math.round)} (up to one lane)`);
        }
        const expected = scene.checks.crossings ?? {};
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const [a, b] = [ids[i], ids[j]];
                const want = expected[`${a}|${b}`] ?? expected[`${b}|${a}`] ?? 0;
                const got = countRenderedCrossings(straightRuns(flattenSvgPath(results.get(a).d)), straightRuns(flattenSvgPath(results.get(b).d)));
                if (got !== want) problems.push(`${a} and ${b} cross ${got} times (expected ${want})`);
                // lines meant to cross touch where they cross: only the others must keep apart
                if (!want) {
                    const { gap, at } = renderedClearance(results.get(a).d, results.get(b).d, LAB_LINE_WIDTH, LAB_LINE_WIDTH);
                    if (gap < 1) problems.push(`${a} and ${b} touch (gap ${gap.toFixed(1)} at ${at.map(Math.round)})`);
                }
            }
        }
        for (const group of scene.checks.nested ?? []) {
            const radii = group.map(id => lastRadius(results.get(id).d));
            for (let k = 1; k < radii.length; k++) {
                if (radii[k - 1] < radii[k] - 0.5) problems.push(`nested ${group.join('>')}: last turns ${radii.map(r => r.toFixed(1)).join(', ')} (an outer turn tighter than an inner one)`);
            }
        }
        const settle = passesToSettle(scene);
        if (settle === Infinity) problems.push('does not settle in 8 passes');
        assert.deepEqual(problems, []);
    });
}
