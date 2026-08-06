#!/usr/bin/env node
/**
 * @fileoverview MSD Routing Concepts — Illustrative Diagram Generator
 *
 * Renders the 4 small SVG diagrams embedded in doc/cards/msd/routing-concepts.md
 * (obstacle avoidance, automatic bundling, channel preference, crossing
 * avoidance) directly from RouterCore's own computed output — each line's `d`
 * path is used verbatim (real corner-rounding included via
 * RouterCore._applyCornerRounding), so these are accurate illustrations of
 * actual router behavior, not hand-drawn approximations.
 *
 * Reuses the same Node-only import shim tests/routing/helpers/router-harness.js
 * already established: RouterCore is pure geometry/graph-search with zero DOM
 * dependencies, so it can be driven directly under plain `node` once the few
 * browser globals its import chain touches are stubbed.
 *
 * Run manually (not part of `npm run build`) whenever a scenario needs
 * retuning or routing defaults change enough to make an existing diagram
 * stale: `node scripts/generate-routing-diagrams.js`
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

globalThis.window = globalThis.window || {};
globalThis.__LCARDS_VERSION__ = globalThis.__LCARDS_VERSION__ || 'docgen';
globalThis.document = globalThis.document || { addEventListener() {} };

const { RouterCore } = await import('../src/msd/routing/RouterCore.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../doc/public/img');

// LCARdS canon palette stops (paletteInjector.js) — fixed hex, not CSS vars,
// since these are standalone static SVGs with no theme system attached.
const COLOR = {
  bg: '#0a1420',
  bgBorder: '#1c3c55',
  grid: '#16283a',
  obstacle: '#ff6753',       // orange
  obstacleLabel: '#ffceb3',
  channel: '#37a6d1',        // blue, low alpha fill
  channelBorder: '#37a6d1',
  text: '#8fa5b8',
  lines: ['#37a6d1', '#ff6753', '#f9ef97'], // blue, orange, yellow — distinct at a glance
};

function makeRouter(config = {}, viewBox = [0, 0, 400, 220]) {
  const router = new RouterCore({ grid_resolution: 20, trunk_line_spacing: 10, ...config }, {}, viewBox);
  return router;
}

function makeLine(id, a, b, rawExtra = {}) {
  return { id, _raw: { id, route: 'smart', ...rawExtra }, a, b };
}

/** Mirrors tests/routing/helpers/router-harness.js's runDiscoveryLoop. */
function runDiscoveryLoop(router, lines) {
  const seq = lines.slice().sort((p, q) => (p.id < q.id ? -1 : p.id > q.id ? 1 : 0));
  const maxPasses = router._trunkDiscoveryMaxPasses ?? 4;
  const results = new Map();
  let lastVersion = -1;
  for (let pass = 0; pass < maxPasses + 1; pass++) {
    for (const line of seq) {
      const req = router.buildRouteRequest(line, line.a, line.b);
      results.set(line.id, router.computePath(req));
    }
    if (router._registryVersion === lastVersion) break;
    lastVersion = router._registryVersion;
  }
  return results;
}

/**
 * @param {object} opts
 * @param {[number,number,number,number]} opts.viewBox
 * @param {{x:number,y:number,w:number,h:number,label:string}[]} [opts.obstacles]
 * @param {{x:number,y:number,w:number,h:number,label:string}[]} [opts.channels]
 * @param {{d:string,color:string}[]} opts.paths
 * @param {number} [opts.scale] - uniform multiplier baked into the request
 *   geometry to give RouterCore's fixed-px corner_radius (34) room to render
 *   at full size in a tight scenario (see the crossing-avoidance scenario's
 *   own comment) — every rendering constant here (stroke width, dot radius,
 *   grid step, font size) scales up to match, so the DISPLAYED result at a
 *   fixed page width looks identical to an unscaled diagram, just computed
 *   over a physically larger coordinate space.
 * @returns {string}
 */
function renderSVG({ viewBox, obstacles = [], channels = [], paths, scale = 1 }) {
  const [vx, vy, vw, vh] = viewBox;
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" font-family="Helvetica, Arial, sans-serif">`);
  parts.push(`<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="${8 * scale}" fill="${COLOR.bg}" stroke="${COLOR.bgBorder}" stroke-width="${scale}"/>`);

  // Faint background grid — flavor only, matches the pathfinding-grid concept
  // without claiming to BE the router's own resolved grid_resolution.
  const gridStep = 20 * scale;
  for (let x = vx + gridStep; x < vx + vw; x += gridStep) {
    parts.push(`<line x1="${x}" y1="${vy}" x2="${x}" y2="${vy + vh}" stroke="${COLOR.grid}" stroke-width="${scale}"/>`);
  }
  for (let y = vy + gridStep; y < vy + vh; y += gridStep) {
    parts.push(`<line x1="${vx}" y1="${y}" x2="${vx + vw}" y2="${y}" stroke="${COLOR.grid}" stroke-width="${scale}"/>`);
  }

  for (const c of channels) {
    parts.push(`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${4 * scale}" fill="${COLOR.channel}" fill-opacity="0.14" stroke="${COLOR.channelBorder}" stroke-width="${1.5 * scale}" stroke-dasharray="${5 * scale},${4 * scale}"/>`);
    if (c.label) parts.push(`<text x="${c.x + c.w / 2}" y="${c.y - 6 * scale}" fill="${COLOR.text}" font-size="${10 * scale}" text-anchor="middle" letter-spacing="${scale}">${c.label}</text>`);
  }

  for (const o of obstacles) {
    parts.push(`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${4 * scale}" fill="${COLOR.obstacle}" fill-opacity="0.22" stroke="${COLOR.obstacle}" stroke-width="${1.5 * scale}"/>`);
    if (o.label) parts.push(`<text x="${o.x + o.w / 2}" y="${o.y + o.h / 2 + 4 * scale}" fill="${COLOR.obstacleLabel}" font-size="${10 * scale}" text-anchor="middle" letter-spacing="${scale}">${o.label}</text>`);
  }

  for (const p of paths) {
    parts.push(`<path d="${p.d}" fill="none" stroke="${p.color}" stroke-width="${3 * scale}" stroke-linecap="round"/>`);
    const start = p.d.match(/M\s*([\d.-]+)[,\s]+([\d.-]+)/);
    if (start) parts.push(`<circle cx="${start[1]}" cy="${start[2]}" r="${4 * scale}" fill="${p.color}"/>`);
    const endMatches = [...p.d.matchAll(/[LA]\s*[\d.\s,-]+/g)];
    if (endMatches.length) {
      const lastSeg = endMatches[endMatches.length - 1][0].trim();
      const nums = lastSeg.replace(/^[LA]/, '').trim().split(/[\s,]+/).map(Number);
      const ex = nums[nums.length - 2], ey = nums[nums.length - 1];
      parts.push(`<circle cx="${ex}" cy="${ey}" r="${4 * scale}" fill="${p.color}"/>`);
    }
  }

  parts.push('</svg>');
  return parts.join('\n');
}

function writeSVG(filename, svg) {
  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, filename);
  writeFileSync(outPath, svg, 'utf8');
  console.log(`wrote ${path.relative(process.cwd(), outPath)}`);
}

// ── Scenario 1: Obstacle Avoidance ──────────────────────────────────────────
{
  const viewBox = [0, 0, 400, 220];
  const obstacle = { x: 170, y: 80, w: 60, h: 60 };
  const router = makeRouter({}, viewBox);
  router.setOverlays([{ id: 'ctrl', _raw: { obstacle: true, position: [obstacle.x, obstacle.y], size: [obstacle.w, obstacle.h], attachment: 'top-left' } }]);
  const line = makeLine('line_1', [30, 110], [370, 110], { anchor_side: 'right', attach_side: 'left' });
  const results = runDiscoveryLoop(router, [line]);
  const r = results.get('line_1');
  const svg = renderSVG({
    viewBox,
    obstacles: [{ ...obstacle, label: 'OBSTACLE' }],
    paths: [{ d: r.d, color: COLOR.lines[0] }],
  });
  writeSVG('msd-routing-obstacle-avoidance.svg', svg);
}

// ── Scenario 2: Automatic Bundling (Trunk-and-Branch) ───────────────────────
{
  const viewBox = [0, 0, 400, 220];
  const router = makeRouter({}, viewBox);
  router.setOverlays([]);
  // All 3 lines START close together (well within trunk_proximity's default
  // 32px capture radius) heading the same general direction, then diverge to
  // widely-spaced destinations — the classic converge-then-branch raceway
  // shape. Starting them spread apart instead (tried first) never triggers
  // discovery at all: each just rides its own row independently, which
  // illustrates nothing.
  const lines = [
    makeLine('line_a', [30, 95], [370, 30], { anchor_side: 'right', attach_side: 'left' }),
    makeLine('line_b', [30, 110], [370, 110], { anchor_side: 'right', attach_side: 'left' }),
    makeLine('line_c', [30, 125], [370, 190], { anchor_side: 'right', attach_side: 'left' }),
  ];
  const results = runDiscoveryLoop(router, lines);
  const svg = renderSVG({
    viewBox,
    paths: lines.map((l, i) => ({ d: results.get(l.id).d, color: COLOR.lines[i] })),
  });
  writeSVG('msd-routing-trunk-bundling.svg', svg);
}

// ── Scenario 3: Channels (guided corridor) ──────────────────────────────────
{
  const viewBox = [0, 0, 400, 220];
  const channel = { x: 120, y: 150, w: 160, h: 30 };
  const router = makeRouter({
    channels: { power_bus: { bounds: [channel.x, channel.y, channel.w, channel.h], mode: 'prefer', direction: 'horizontal', weight: 0.8, line_spacing: 10 } },
  }, viewBox);
  router.setOverlays([]);
  // Shortest direct path from (30,40) to (370,60) is a nearly-straight line
  // nowhere near the channel band at y:150-180 — any bend toward it has to be
  // cost-justified by the channel's own prefer discount.
  const line = makeLine('line_1', [30, 40], [370, 60], { anchor_side: 'right', attach_side: 'left', route_channels: ['power_bus'] });
  const results = runDiscoveryLoop(router, [line]);
  const r = results.get('line_1');
  const svg = renderSVG({
    viewBox,
    channels: [{ ...channel, label: 'PREFER CHANNEL' }],
    paths: [{ d: r.d, color: COLOR.lines[0] }],
  });
  writeSVG('msd-routing-channel-prefer.svg', svg);
}

// ── Scenario 4: Crossing Avoidance ──────────────────────────────────────────
{
  // corner_radius (default 34, a fixed viewBox-unit target — RouterCore.js's
  // own default) is purely a RENDER-time target, applied by
  // _applyCornerRounding strictly AFTER a path is already chosen. Confirmed
  // by reading _costComposite (the function that scores a candidate route
  // during search/comparison): it's distance + bend-count*weight +
  // obstacle-proximity-penalty*weight + channel delta — no term anywhere
  // for "how much room this shape leaves for corner rendering." So a tight
  // detour with barely enough straight leg between two nearby turns WILL
  // render with a visibly shrunk radius at that spot — that's
  // auto-mode's documented "shrinks gracefully where it doesn't have room"
  // behavior working as designed, not a bug, and not something route
  // SELECTION currently accounts for (an earlier attempt at this diagram
  // tried to route around that by inflating the whole coordinate space 6x
  // so 34 units was physically small relative to the detour — technically
  // full-radius, but then visually TINY relative to the other 3 diagrams at
  // the same display width, trading one problem for a worse one).
  //
  // Real fix: pick geometry where the natural, honestly-computed radius is
  // reasonably large AND consistent across all 4 corners, rather than
  // fighting the router for a literal 34 it has no mechanism to prefer. An
  // 80-unit wall (long enough to read clearly as a real barrier, not a
  // token obstacle) centered in a taller canvas gives the hook a full-radius
  // swing out and a full-radius swing back in; only the final corner, right
  // before the endpoint, clamps down (the attach-side stub run into the
  // endpoint is a fixed ~grid_resolution length regardless of extra room
  // elsewhere — same "shrinks gracefully where it doesn't have room"
  // behavior, just localized to one corner instead of spread across two).
  const viewBox = [0, 0, 600, 460];
  // Scales stroke width / dot radius / grid step / font size (renderSVG's
  // `scale` param) to stay visually consistent with the other 3 diagrams'
  // line weight at this somewhat larger canvas — proportional to viewBox
  // width vs. the 400-unit reference the other 3 scenarios use.
  const scale = 1.5;
  const router = makeRouter({ crossing_avoid_bias: 30, grid_resolution: 30 }, viewBox);
  // line_wall uses route:'manhattan' — registered so other lines avoid
  // crossing it, but (per routing.md's "Routing Modes" table) it never
  // reacts itself, staying exactly where drawn.
  router.setOverlays([]);
  const wall = makeLine('line_wall', [260, 320], [340, 320], { route: 'manhattan' });
  const wallReq = router.buildRouteRequest(wall, wall.a, wall.b);
  const wallResult = router.computePath(wallReq);
  const crosser = makeLine('line_crosser', [300, 430], [300, 110], { anchor_side: 'bottom', attach_side: 'top' });
  const crosserReq = router.buildRouteRequest(crosser, crosser.a, crosser.b);
  const crosserResult = router.computePath(crosserReq);
  const svg = renderSVG({
    viewBox,
    scale,
    paths: [
      { d: wallResult.d, color: COLOR.lines[1] },
      { d: crosserResult.d, color: COLOR.lines[0] },
    ],
  });
  writeSVG('msd-routing-crossing-avoidance.svg', svg);
}
