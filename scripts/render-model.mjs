#!/usr/bin/env node
/**
 * render-model.mjs: renders a GLB from fixed angles to PNGs, to compare a
 * built-in model with its reference stills side by side (the lcards-models
 * skill). Headless system Chromium, three from node_modules; lit like
 * `material: original`, no LCARdS code involved.
 *
 *   node scripts/render-model.mjs src/assets/models/deep-space-nine.glb tmp/renders/ds9
 *   node scripts/render-model.mjs <glb> <outdir> '[{"name":"side30","az":30,"el":0,"ortho":true}]'
 *
 * A view: name (the PNG's name), az (degrees from +z toward +x: 0 looks at the
 * front), el (degrees up; 90 is the top view, -90 the underside), ortho (an
 * orthographic camera, for matching blueprint elevations), fov (perspective,
 * degrees; small values flatten like a long lens), zoom (1 frames the whole
 * model). Default views: side, front, top, bottom, three-quarter, low.
 * Combine the PNGs with the stills using ImageMagick, e.g.
 *   magick montage ref.png <outdir>/side.png -tile 2x -geometry 500x500+2+2 compare.jpg
 */
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_VIEWS = [
  { name: 'side', az: 90, el: 0, ortho: true },
  { name: 'front', az: 0, el: 0, ortho: true },
  { name: 'top', az: 0, el: 90, ortho: true },
  { name: 'bottom', az: 0, el: -90, ortho: true },
  { name: 'three-quarter', az: 35, el: 22 },
  { name: 'low', az: -30, el: -15 }
];

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#111}</style>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(700, 700);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15171c);
scene.add(new THREE.HemisphereLight(0xdde6ff, 0x302820, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
scene.add(sun);
let size, centre;
window.load = async (url) => {
  const g = await new GLTFLoader().loadAsync(url);
  scene.add(g.scene);
  const box = new THREE.Box3().setFromObject(g.scene);
  size = box.getSize(new THREE.Vector3());
  centre = box.getCenter(new THREE.Vector3());
};
window.view = ({ az, el, ortho, fov = 30, zoom = 1 }) => {
  const r = Math.max(size.x, size.y, size.z);
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  const dir = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  const h = r * 0.56 / zoom;
  const cam = ortho ? new THREE.OrthographicCamera(-h, h, h, -h, 0.1, r * 10) : new THREE.PerspectiveCamera(fov, 1, r / 100, r * 20);
  cam.position.copy(centre).addScaledVector(dir, ortho ? r * 3 : (r * 0.62 / zoom) / Math.tan(fov * Math.PI / 360));
  if (Math.abs(el) > 89) cam.up.set(0, 0, el > 0 ? -1 : 1);
  cam.lookAt(centre);
  sun.position.copy(cam.position).add(new THREE.Vector3(r, r * 1.5, r * 0.5));
  renderer.render(scene, cam);
};
</script></body></html>`;

const [glbArg, outArg, viewsArg] = process.argv.slice(2);
if (!glbArg || !outArg) {
  console.error('usage: node scripts/render-model.mjs <file.glb> <outdir> [views json]');
  process.exit(1);
}
const glb = resolve(glbArg);
const rel = relative(ROOT, glb);
if (rel.startsWith('..') || !existsSync(glb)) {
  console.error(`${glbArg}: not a file inside the repo`);
  process.exit(1);
}
const views = viewsArg ? JSON.parse(viewsArg) : DEFAULT_VIEWS;
const types = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url === '/page.html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(PAGE);
  }
  const file = resolve(ROOT, '.' + url);
  if (relative(ROOT, file).startsWith('..') || !existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, () => r(undefined)));
const port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  await page.goto(`http://localhost:${port}/page.html`);
  await page.evaluate((u) => /** @type {any} */ (window).load(u), '/' + rel);
  const out = resolve(outArg);
  mkdirSync(out, { recursive: true });
  for (const v of views) {
    await page.evaluate((v) => /** @type {any} */ (window).view(v), v);
    await page.locator('canvas').screenshot({ path: resolve(out, `${v.name}.png`) });
  }
  console.log(`${views.length} views of ${rel} in ${relative(ROOT, out) || out}`);
} finally {
  await browser.close();
  server.close();
}
