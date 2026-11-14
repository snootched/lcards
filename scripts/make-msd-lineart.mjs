#!/usr/bin/env node
/**
 * make-msd-lineart.mjs: draws a built-in MSD line-art background from one of
 * our built-in ship models (src/assets/models/*.glb, made in code by
 * scripts/make-ships.mjs), so every line comes from real geometry.
 *
 *   node scripts/make-msd-lineart.mjs              # every drawing below
 *   node scripts/make-msd-lineart.mjs galaxy-class-lineart
 *
 * How (headless system Chromium + three, orthographic side elevation):
 * - Outline: the model rendered flat, one colour per named part; every
 *   boundary between parts (and with the background) is traced, chained and
 *   simplified. Joins where two parts meet are drawn, hidden parts are not.
 * - Creases: mesh edges sharper than `crease` degrees, kept where a depth
 *   render shows them, so panel and band lines come from the model too.
 * - Inside: a cutaway drawn in code (deck lines every deck height, the warp
 *   core, nacelle coils), clipped to the part it belongs to.
 * - Anchors: <circle id> at the projected centre of named parts (bridge,
 *   deflector, ...), so labels and lines can target parts by name.
 *
 * Lines use currentColor; the colour (an LCARdS palette variable, so alert
 * modes recolour it) and every paint attribute sit on an inner group: the MSD
 * card keeps the root <svg> as its own, so anything on the root is inherited
 * by the overlays.
 */
import http from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Render size (square, px) the projection is traced at. */
const R = 2400;

const DRAWINGS = {
  'galaxy-class-lineart': {
    model: 'src/assets/models/galaxy-class.glb',
    out: 'src/assets/msd/galaxy-class-lineart.svg',
    title: 'Galaxy class, side elevation (line art)',
    az: 90,
    crease: 35,
    // The output frame: the ship scaled to `shipWidth` and centred, room above and below for labels.
    frame: [2000, 720],
    shipWidth: 1840,
    // Parts left out of the outline (tiny or surface decals); `windows` is left out everywhere.
    skipOutline: ['impulse_exhaust', 'grille_port', 'grille_starboard'],
    deck: 3.5,
    // A line every so many decks (every deck turns to grey at dashboard sizes).
    deckEvery: 2,
    decksIn: ['saucer', 'secondary_hull', 'neck'],
    // Warp core: vertical, in the engineering hull under the neck. Its axis at `xAt` across the
    // `xIn` part's box (0 = the box's left edge in the drawing), from `topAt` down `topIn`'s box
    // to `bottomAt` down `bottomIn`'s; width in metres.
    core: { xIn: 'neck', xAt: 0.5, width: 7, topIn: 'neck', topAt: 0.55, bottomIn: 'secondary_hull', bottomAt: 0.9, clipTo: ['secondary_hull', 'neck'] },
    coils: { part: 'nacelle_starboard', from: 0.18, to: 0.92, every: 7 },
    anchors: {
      bridge: 'bridge',
      saucer: 'saucer',
      neck: 'neck',
      engineering: 'secondary_hull',
      impulse: 'impulse',
      shuttle_bay: 'shuttle_bay',
      deflector: 'deflector',
      torpedo: 'torpedo_launcher',
      nacelle: 'nacelle_starboard',
      bussard: 'bussard_starboard',
      pylon: 'pylon_starboard'
    }
  }
};

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

window.run = async (cfg) => {
  const { url, R } = cfg;
  const g = await new GLTFLoader().loadAsync(url);
  const model = g.scene;
  model.updateMatrixWorld(true);

  // Each mesh's part: its own name, or its nearest named ancestor's.
  const meshes = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    let n = o;
    while (n && !n.name) n = n.parent;
    meshes.push({ mesh: o, part: n?.name || 'hull' });
  });
  const shown = meshes.filter((m) => m.part !== 'windows');
  for (const m of meshes) m.mesh.visible = m.part !== 'windows';

  const box = new THREE.Box3();
  for (const { mesh } of shown) box.expandByObject(mesh);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z);
  const a = cfg.az * Math.PI / 180;
  const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
  const h = r * 0.52;
  const cam = new THREE.OrthographicCamera(-h, h, h, -h, r * 2, r * 4);
  cam.position.copy(centre).addScaledVector(dir, r * 3);
  cam.lookAt(centre);
  cam.updateMatrixWorld(true);
  const pxPerM = R / (2 * h);
  const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * R, (1 - p.y) / 2 * R, p.z * 0.5 + 0.5]; };

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(R, R);
  const scene = new THREE.Scene();
  scene.add(model);

  // Part ids: a flat colour per part, depth tested.
  const parts = [...new Set(shown.map((m) => m.part))];
  const idOf = Object.fromEntries(parts.map((p, i) => [p, i + 1]));
  const saved = shown.map(({ mesh }) => mesh.material);
  shown.forEach(({ mesh, part }) => { mesh.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(idOf[part] / 255, 0, 0), side: THREE.DoubleSide }); });
  const rtId = new THREE.WebGLRenderTarget(R, R);
  renderer.setRenderTarget(rtId);
  renderer.setClearColor(0x000000, 1);
  renderer.render(scene, cam);
  const idRaw = new Uint8Array(R * R * 4);
  renderer.readRenderTargetPixels(rtId, 0, 0, R, R, idRaw);
  // ids[y * R + x], y down
  const ids = new Uint8Array(R * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) ids[y * R + x] = idRaw[((R - 1 - y) * R + x) * 4];
  const idAt = (x, y) => { const px = Math.floor(x), py = Math.floor(y); return px < 0 || py < 0 || px >= R || py >= R ? 0 : ids[py * R + px]; };

  // Depth, for the creases.
  const rtD = new THREE.WebGLRenderTarget(R, R, { type: THREE.FloatType });
  scene.overrideMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0); }'
  });
  renderer.setRenderTarget(rtD);
  renderer.setClearColor(0xffffff, 1);
  renderer.render(scene, cam);
  scene.overrideMaterial = null;
  const dRaw = new Float32Array(R * R * 4);
  renderer.readRenderTargetPixels(rtD, 0, 0, R, R, dRaw);
  const depthAt = (x, y) => { const px = Math.round(x), py = Math.round(y); return px < 0 || py < 0 || px >= R || py >= R ? 1 : dRaw[((R - 1 - py) * R + px) * 4]; };
  shown.forEach(({ mesh }, i) => { mesh.material = saved[i]; });

  // Outline: unit segments on pixel edges where the part id changes.
  const skip = new Set((cfg.skipOutline || []).map((p) => idOf[p]).filter(Boolean));
  const keyOf = (v) => (skip.has(v) ? 0 : v);
  const outline = [];
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
    const v = keyOf(ids[y * R + x]);
    if (x + 1 < R && v !== keyOf(ids[y * R + x + 1])) outline.push(x + 1, y, x + 1, y + 1);
    if (y + 1 < R && v !== keyOf(ids[(y + 1) * R + x])) outline.push(x, y + 1, x + 1, y + 1);
  }

  // Creases facing the camera, visible pieces only.
  const creases = [];
  const cosC = Math.cos(cfg.crease * Math.PI / 180);
  for (const { mesh } of shown) {
    let geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    for (const k of Object.keys(geo.attributes)) if (k !== 'position') geo.deleteAttribute(k);
    geo = mergeVertices(geo, 1e-4 * r);
    const pos = geo.attributes.position, idx = geo.index;
    const n = idx.count / 3;
    const normals = [];
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    for (let f = 0; f < n; f++) {
      va.fromBufferAttribute(pos, idx.getX(f * 3)); vb.fromBufferAttribute(pos, idx.getX(f * 3 + 1)); vc.fromBufferAttribute(pos, idx.getX(f * 3 + 2));
      normals.push(new THREE.Vector3().crossVectors(vb.clone().sub(va), vc.clone().sub(va)).normalize());
    }
    const edges = new Map();
    for (let f = 0; f < n; f++) for (let k = 0; k < 3; k++) {
      const i0 = idx.getX(f * 3 + k), i1 = idx.getX(f * 3 + (k + 1) % 3);
      const key = i0 < i1 ? i0 + '_' + i1 : i1 + '_' + i0;
      const e = edges.get(key);
      if (e) e.f.push(f); else edges.set(key, { a: i0, b: i1, f: [f] });
    }
    for (const { a: i0, b: i1, f } of edges.values()) {
      if (f.length !== 2) continue;
      const n1 = normals[f[0]], n2 = normals[f[1]];
      const d1 = n1.dot(dir), d2 = n2.dot(dir);
      if (!(d1 > 0.05 && d2 > 0.05) || n1.dot(n2) >= cosC) continue; // both faces toward us, a sharp fold
      const p = proj(new THREE.Vector3().fromBufferAttribute(pos, i0)), q = proj(new THREE.Vector3().fromBufferAttribute(pos, i1));
      const steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 1.5));
      let run = null;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, z = p[2] + (q[2] - p[2]) * t;
        let d = 0;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) d = Math.max(d, depthAt(x + dx, y + dy));
        if (z <= d + 0.003) { if (!run) run = [x, y, x, y]; else { run[2] = x; run[3] = y; } }
        else if (run) { creases.push(run); run = null; }
      }
      if (run) creases.push(run);
    }
  }

  // Part boxes in the render (world bounding box projected), for the inside and the anchors.
  const partBox = (part) => {
    const b = new THREE.Box3();
    for (const m of shown) if (m.part === part) b.expandByObject(m.mesh);
    if (b.isEmpty()) return null;
    const c = b.getCenter(new THREE.Vector3());
    const corners = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) corners.push(proj(new THREE.Vector3(x, y, z)));
    const xs = corners.map((p) => p[0]), ys = corners.map((p) => p[1]);
    const cp = proj(c);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), cx: cp[0], cy: cp[1] };
  };

  // Inside: lines sampled along, kept where the pixel belongs to one of the parts.
  const clipLine = (x0, y0, x1, y1, partNames, out) => {
    const want = new Set(partNames.map((p) => idOf[p]).filter(Boolean));
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    let run = null;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      // Keep a pixel's margin off the outline so inside lines never touch it.
      let ok = true;
      for (let dx = -2; dx <= 2 && ok; dx += 2) for (let dy = -2; dy <= 2 && ok; dy += 2) ok = want.has(idAt(x + dx, y + dy));
      if (ok) { if (!run) run = [x, y, x, y]; else { run[2] = x; run[3] = y; } }
      else if (run) { if (Math.hypot(run[2] - run[0], run[3] - run[1]) > 4) out.push(run); run = null; }
    }
    if (run && Math.hypot(run[2] - run[0], run[3] - run[1]) > 4) out.push(run);
  };

  const inside = [];
  const core = [];
  const deckPx = cfg.deck * pxPerM;
  const deckLinePx = deckPx * (cfg.deckEvery || 1);
  const top = Math.min(...cfg.decksIn.map((p) => partBox(p)?.y0 ?? R));
  for (let y = top + deckLinePx; y < R; y += deckLinePx) clipLine(0, y, R, y, cfg.decksIn, inside);

  if (cfg.coils) {
    const b = partBox(cfg.coils.part);
    const every = cfg.coils.every * pxPerM;
    // The nacelle's front is toward the bow (smaller x in this view when the bow is left).
    for (let x = b.x0 + (b.x1 - b.x0) * cfg.coils.from; x < b.x0 + (b.x1 - b.x0) * cfg.coils.to; x += every) clipLine(x, b.y0, x, b.y1, [cfg.coils.part], inside);
  }

  let coreBox = null;
  if (cfg.core) {
    const c = cfg.core;
    const xb = partBox(c.xIn);
    const cx = xb.x0 + (xb.x1 - xb.x0) * c.xAt;
    const tb = partBox(c.topIn), bb = partBox(c.bottomIn);
    const y0 = tb.y0 + (tb.y1 - tb.y0) * c.topAt, y1 = bb.y0 + (bb.y1 - bb.y0) * c.bottomAt;
    const hw = c.width / 2 * pxPerM;
    clipLine(cx - hw, y0, cx - hw, y1, c.clipTo, core);
    clipLine(cx + hw, y0, cx + hw, y1, c.clipTo, core);
    for (let y = y0; y <= y1; y += deckPx) clipLine(cx - hw, y, cx + hw, y, c.clipTo, core);
    coreBox = { cx, cy: (y0 + y1) / 2, x0: cx - hw, x1: cx + hw, y0, y1 };
  }

  const anchors = {};
  for (const [name, part] of Object.entries(cfg.anchors)) {
    const b = partBox(part);
    if (b) anchors[name] = [b.cx, b.cy];
  }
  if (coreBox) anchors.warp_core = [coreBox.cx, coreBox.cy];

  // The ship's extent in the render, for framing.
  let minX = R, maxX = 0, minY = R, maxY = 0;
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (ids[y * R + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }

  return { outline, creases: creases.flat(), inside: inside.flat(), core: core.flat(), anchors, extent: [minX, minY, maxX + 1, maxY + 1], parts };
};
</script></body></html>`;

/** Chain segments end to end into polylines. @param {number[]} flat x0,y0,x1,y1,... */
function chain(flat, snap = 2) {
  const lines = [];
  for (let i = 0; i < flat.length; i += 4) lines.push([[flat[i], flat[i + 1]], [flat[i + 2], flat[i + 3]]]);
  const key = (p) => `${Math.round(p[0] * snap)},${Math.round(p[1] * snap)}`;
  const byEnd = new Map();
  lines.forEach((l, i) => { for (const e of [0, 1]) { const k = key(l[e]); if (!byEnd.has(k)) byEnd.set(k, []); byEnd.get(k).push(i); } });
  const used = new Set();
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const c = [...lines[i]];
    for (const atEnd of [true, false]) {
      for (;;) {
        const tip = atEnd ? c[c.length - 1] : c[0];
        const next = (byEnd.get(key(tip)) || []).find((j) => !used.has(j));
        if (next === undefined) break;
        used.add(next);
        const [a, b] = lines[next];
        const far = key(a) === key(tip) ? b : a;
        if (atEnd) c.push(far); else c.unshift(far);
      }
    }
    out.push(c);
  }
  return out;
}

/** Moving average over a polyline (ends kept), to take the pixel steps off traced curves. */
function smooth(pts, passes = 2) {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    if (p.length < 5) return p;
    const q = [p[0], p[1]];
    for (let i = 2; i < p.length - 2; i++) {
      q.push([(p[i - 2][0] + p[i - 1][0] + p[i][0] + p[i + 1][0] + p[i + 2][0]) / 5, (p[i - 2][1] + p[i - 1][1] + p[i][1] + p[i + 1][1] + p[i + 2][1]) / 5]);
    }
    q.push(p[p.length - 2], p[p.length - 1]);
    p = q;
  }
  return p;
}

/** Ramer-Douglas-Peucker. */
function rdp(pts, tol) {
  if (pts.length < 3) return pts;
  const a = pts[0], b = pts[pts.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  let best = -1, bi = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = L ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L : Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]);
    if (d > best) { best = d; bi = i; }
  }
  return best > tol ? [...rdp(pts.slice(0, bi + 1), tol).slice(0, -1), ...rdp(pts.slice(bi), tol)] : [a, b];
}

const length = (c) => c.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - c[i - 1][0], p[1] - c[i - 1][1]) : 0), 0);

async function make(name, cfg) {
  const types = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (url === '/page.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
    const file = resolve(ROOT, '.' + url);
    if (relative(ROOT, file).startsWith('..') || !existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, () => r(undefined)));
  const port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let res;
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error(e.message));
    await page.goto(`http://localhost:${port}/page.html`);
    await page.waitForFunction(() => typeof /** @type {any} */ (window).run === 'function');
    res = await page.evaluate((o) => /** @type {any} */ (window).run(o), { ...cfg, url: '/' + cfg.model, R });
  } finally {
    await browser.close();
    server.close();
  }

  // Frame: the ship scaled to shipWidth, centred in the frame.
  const [ex0, ey0, ex1, ey1] = res.extent;
  const [FW, FH] = cfg.frame;
  const s = cfg.shipWidth / (ex1 - ex0);
  const ox = (FW - (ex1 - ex0) * s) / 2 - ex0 * s;
  const oy = (FH - (ey1 - ey0) * s) / 2 - ey0 * s;
  const tx = (p) => [p[0] * s + ox, p[1] * s + oy];
  const fmt = (v) => (Math.round(v * 10) / 10).toString();
  const pathOf = (flat, { tol, min, snap, soft = 0 }) => chain(flat, snap)
    .map((c) => rdp(smooth(c, soft).map(tx), tol))
    .filter((c) => length(c) >= min)
    .map((c) => 'M' + c.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join('L'))
    .join('');

  const outlineD = pathOf(res.outline, { tol: 0.6, min: 4, snap: 1, soft: 3 });
  const creaseD = pathOf(res.creases, { tol: 0.5, min: 6, snap: 2 });
  const insideD = pathOf(res.inside, { tol: 0.5, min: 4, snap: 2 });
  const coreD = pathOf(res.core, { tol: 0.5, min: 2, snap: 2 });
  const anchors = Object.entries(res.anchors)
    .map(([id, p]) => { const [x, y] = tx(p); return `<circle id="${id}" cx="${fmt(x)}" cy="${fmt(y)}" r="0"/>`; })
    .join('\n    ');

  // Paint attributes on the inner group, never the root: the MSD card keeps the root <svg>
  // as its own, so a root stroke or fill would be inherited by every overlay (labels too).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}">
  <title>${cfg.title}</title>
  <desc>Made by scripts/make-msd-lineart.mjs from ${cfg.model} (LCARdS, MIT). Lines use the theme's colour; anchors name the main parts.</desc>
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="color: var(--lcards-blue-medium-light, #67caf0)">
    <path class="lineart-inside" stroke-width="1" opacity="0.5" d="${insideD}"/>
    <path class="lineart-crease" stroke-width="1.2" opacity="0.7" d="${creaseD}"/>
    <path class="lineart-core" stroke-width="1.6" opacity="0.85" d="${coreD}"/>
    <path class="lineart-outline" stroke-width="2.4" d="${outlineD}"/>
  </g>
  <g>
    ${anchors}
  </g>
</svg>
`;
  writeFileSync(resolve(ROOT, cfg.out), svg);
  console.log(`${name}: ${cfg.out} (${(svg.length / 1024).toFixed(1)} KB; anchors ${Object.keys(res.anchors).join(', ')})`);
}

const only = process.argv[2];
for (const [name, cfg] of Object.entries(DRAWINGS)) {
  if (only && only !== name) continue;
  await make(name, cfg);
}
