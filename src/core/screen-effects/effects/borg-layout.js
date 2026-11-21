/**
 * @fileoverview Layout of the WebGL Borg assimilation intro: injection sites,
 * tendrils and their branches, bridges with junction nodes, and the Borg cube's
 * 3D segments. Pure (no DOM), built once on the main thread and posted to the
 * GL worker as plain data.
 *
 * Timings follow the classic Canvas2D intro (BorgAssimilationWorker.js): sites
 * spawn between 600 and 4800 ms, tendrils grow for 3.5 s from 300 ms after their
 * site, branches grow over the second half, bridges flash in once everything
 * has grown.
 *
 * @module core/screen-effects/effects/borg-layout
 */

import { presetRandom } from '../../../utils/lcards-anim-helpers.js';

/** Signal corruption opening, before the first site (ms) */
export const BORG_INTRO_MS = 600;
/** How long a site's tendrils grow (ms) */
export const BORG_GROW_MS = 3500;
/** How long the assimilation front of one site takes to reach the far corner (ms) */
export const BORG_FRONT_MS = 9000;
/** Most injection sites the composite shader takes */
export const BORG_MAX_SITES = 20;

/**
 * @typedef {Object} BorgCurve
 * @property {number[]} p - cubic Bezier control points [x0, y0, x1, y1, x2, y2, x3, y3] (px)
 * @property {number} start - ms the curve starts growing
 * @property {number} dur - ms it takes to grow
 * @property {number} width - base stroke width (px)
 * @property {number} hue - hue offset (degrees)
 * @property {number} seed - 0 to 1, varies pulses
 * @property {0|1} kind - 0 tendril or branch, 1 bridge
 */

/**
 * @typedef {Object} BorgLayout
 * @property {number} width
 * @property {number} height
 * @property {{ x: number, y: number, spawnAt: number, maxR: number, reach: number, seed: number }[]} sites
 * @property {BorgCurve[]} curves
 * @property {{ x: number, y: number, appearAt: number, seed: number }[]} junctions
 * @property {number[][]} cube - segments [ax, ay, az, bx, by, bz, weight] in a -1..1 cube
 * @property {number[][]} cubeSpots - glow spots on the detailed cube's faces [face, u, v, phase]
 * @property {number} cubeAt - ms the cube starts to emerge
 * @property {number} allGrownAt - ms every tendril has grown
 * @property {number} settledAt - ms the picture is complete (the reduced-motion frame)
 */

function bz(t, p0, p1, p2, p3) {
    const q = 1 - t;
    return q * q * q * p0 + 3 * q * q * t * p1 + 3 * q * t * t * p2 + t * t * t * p3;
}

/**
 * @param {number} sx @param {number} sy @param {number} angle @param {number} length
 * @param {number} bend1 @param {number} bend2
 * @returns {number[]}
 */
function curveFrom(sx, sy, angle, length, bend1, bend2) {
    return [
        sx, sy,
        sx + Math.cos(angle + bend1) * length * 0.4, sy + Math.sin(angle + bend1) * length * 0.4,
        sx + Math.cos(angle - bend2) * length * 0.7, sy + Math.sin(angle - bend2) * length * 0.7,
        sx + Math.cos(angle) * length, sy + Math.sin(angle) * length,
    ];
}

/**
 * Borg cube wireframe: outer cube, face grid, greebled panels, inner cube and struts.
 * @param {() => number} rand
 * @returns {number[][]}
 */
export function borgCubeSegments(rand) {
    /** @type {number[][]} */
    const segs = [];
    const corners = [];
    for (let i = 0; i < 8; i++) corners.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1]);
    const edges = [];
    for (let i = 0; i < 8; i++) {
        for (const bit of [1, 2, 4]) if (!(i & bit)) edges.push([i, i | bit]);
    }
    for (const [a, b] of edges) segs.push([...corners[a], ...corners[b], 1]);

    // Faces: axis k, side s; u and v are the other two axes
    const N = 4;
    for (let k = 0; k < 3; k++) {
        const u = (k + 1) % 3, v = (k + 2) % 3;
        for (const s of [-1, 1]) {
            /** @param {number} a @param {number} b */
            const pt = (a, b, lift = 0) => {
                const p = [0, 0, 0];
                p[k] = s * (1 + lift); p[u] = a; p[v] = b;
                return p;
            };
            for (let i = 1; i < N; i++) {
                const g = -1 + (2 * i) / N;
                segs.push([...pt(g, -1), ...pt(g, 1), 0.35]);
                segs.push([...pt(-1, g), ...pt(1, g), 0.35]);
            }
            // Greebles: raised panels snapped to the half grid
            for (let n = 0; n < 4; n++) {
                const snap = (x) => Math.round(x * N) / N;
                const a0 = snap(-0.9 + rand() * 1.4), b0 = snap(-0.9 + rand() * 1.4);
                const a1 = Math.min(0.9, a0 + 0.2 + snap(rand() * 0.6)), b1 = Math.min(0.9, b0 + 0.2 + snap(rand() * 0.6));
                const lift = 0.04;
                segs.push([...pt(a0, b0, lift), ...pt(a1, b0, lift), 0.7]);
                segs.push([...pt(a1, b0, lift), ...pt(a1, b1, lift), 0.7]);
                segs.push([...pt(a1, b1, lift), ...pt(a0, b1, lift), 0.7]);
                segs.push([...pt(a0, b1, lift), ...pt(a0, b0, lift), 0.7]);
            }
        }
    }

    const inner = 0.5;
    for (const [a, b] of edges) {
        segs.push([...corners[a].map(c => c * inner), ...corners[b].map(c => c * inner), 0.6]);
    }
    for (const c of corners) segs.push([...c.map(x => x * inner), ...c, 0.3]);
    return segs;
}

/** Glow spots on the detailed cube (the shader's array holds this many) */
export const BORG_CUBE_SPOTS = 18;

/**
 * Glow spots deep in the detailed cube: face 0-5 (axis * 2 + positive side),
 * u and v inside -0.8..0.8 on that face, and a pulse phase 0-1. Every face
 * gets at least one so any rotation shows a few.
 * @param {() => number} rand
 * @returns {number[][]}
 */
export function borgCubeSpots(rand) {
    const spots = [];
    for (let i = 0; i < BORG_CUBE_SPOTS; i++) {
        const face = i < 6 ? i : Math.floor(rand() * 6);
        spots.push([face, (rand() * 2 - 1) * 0.8, (rand() * 2 - 1) * 0.8, rand()]);
    }
    return spots;
}

/**
 * Build the layout for a `width` x `height` screen.
 *
 * @param {number} width
 * @param {number} height
 * @param {Object} [params]
 * @param {number} [params.siteCount=7]
 * @param {number} [params.tendrilsPerSite=8]
 * @param {number} [params.tendrilLength=600]
 * @param {number} [params.seed] - same layout every time when a number
 * @returns {BorgLayout}
 */
export function buildBorgLayout(width, height, params = {}) {
    const rand = presetRandom(params.seed);
    const W = Math.max(1, width), H = Math.max(1, height);
    const clampInt = (v, lo, hi, d) => {
        const n = Math.round(Number(v));
        return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
    };
    const siteCount = clampInt(params.siteCount, 1, BORG_MAX_SITES, 7);
    const tendrilsPerSite = clampInt(params.tendrilsPerSite, 1, 24, 8);
    const tendrilLength = Math.min(1200, Math.max(100, Number(params.tendrilLength) || 600));

    const sites = [];
    /** @type {BorgCurve[]} */
    const curves = [];
    /** @type {{ x: number, y: number, s: number }[]} */
    const endpoints = [];

    for (let s = 0; s < siteCount; s++) {
        const x = rand() * W, y = rand() * H;
        const spawnAt = BORG_INTRO_MS + rand() * 4200;
        const reach = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
        sites.push({ x, y, spawnAt, maxR: 20 + rand() * 30, reach, seed: rand() });

        for (let i = 0; i < tendrilsPerSite; i++) {
            const angle = (i / tendrilsPerSite) * Math.PI * 2 + (rand() - 0.5) * 0.6;
            const length = tendrilLength * (0.2 + rand() * 0.8);
            const hue = (rand() - 0.5) * 24;
            const width = 3.5 + rand() * 5.5;
            const p = curveFrom(x, y, angle, length, 0.65, 0.45);
            curves.push({ p, start: spawnAt + 300, dur: BORG_GROW_MS, width, hue, seed: rand(), kind: 0 });
            endpoints.push({ x: p[6], y: p[7], s });

            // Branches fork at 60% and grow over the second half of the tendril's growth
            const ft = 0.6, dt = 0.01;
            const fx = bz(ft, p[0], p[2], p[4], p[6]), fy = bz(ft, p[1], p[3], p[5], p[7]);
            const tang = Math.atan2(
                bz(ft + dt, p[1], p[3], p[5], p[7]) - bz(ft - dt, p[1], p[3], p[5], p[7]),
                bz(ft + dt, p[0], p[2], p[4], p[6]) - bz(ft - dt, p[0], p[2], p[4], p[6]),
            );
            const branchCount = 2 + Math.floor(rand() * 2);
            let longest = null;
            for (let b = 0; b < branchCount; b++) {
                const bAngle = tang + (rand() - 0.5) * 2 * (0.45 + rand() * 0.45);
                const bLen = length * (0.2 + rand() * 0.2);
                const bp = curveFrom(fx, fy, bAngle, bLen, 0.55, 0.35);
                curves.push({
                    p: bp, start: spawnAt + 300 + BORG_GROW_MS / 2, dur: BORG_GROW_MS / 2,
                    width: width * 0.45, hue: hue + (rand() - 0.5) * 10, seed: rand(), kind: 0,
                });
                if (!longest || bLen > longest.len) longest = { len: bLen, x: bp[6], y: bp[7] };
            }
            if (longest) endpoints.push({ x: longest.x, y: longest.y, s });
        }
    }

    const allGrownAt = Math.max(...sites.map(s => s.spawnAt)) + 300 + BORG_GROW_MS;

    // Bridges between nearby endpoints of different sites, at most 3 per endpoint
    const junctions = [];
    const used = new Array(endpoints.length).fill(0);
    for (let i = 0; i < endpoints.length; i++) {
        for (let j = i + 1; j < endpoints.length; j++) {
            const a = endpoints[i], b = endpoints[j];
            if (a.s === b.s || used[i] >= 3 || used[j] >= 3) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 200 || dist < 1) continue;
            const perp = (rand() - 0.5) * dist * 0.8;
            const cx = (a.x + b.x) / 2 - (dy / dist) * perp;
            const cy = (a.y + b.y) / 2 + (dx / dist) * perp;
            const appearAt = allGrownAt + rand() * 2000;
            used[i]++; used[j]++;
            // The quadratic as a cubic
            curves.push({
                p: [a.x, a.y, a.x + (2 / 3) * (cx - a.x), a.y + (2 / 3) * (cy - a.y),
                    b.x + (2 / 3) * (cx - b.x), b.y + (2 / 3) * (cy - b.y), b.x, b.y],
                start: appearAt, dur: 300, width: 1.6, hue: 0, seed: rand(), kind: 1,
            });
            junctions.push({ x: 0.25 * a.x + 0.5 * cx + 0.25 * b.x, y: 0.25 * a.y + 0.5 * cy + 0.25 * b.y, appearAt: appearAt + 200, seed: rand() });
        }
    }

    return {
        width: W,
        height: H,
        sites,
        curves,
        junctions,
        cube: borgCubeSegments(rand),
        // After the segments, so seeded layouts before F2 stay the same
        cubeSpots: borgCubeSpots(rand),
        cubeAt: allGrownAt - 1500,
        allGrownAt,
        settledAt: allGrownAt + 2000 + 600 + 3000,
    };
}
