/**
 * Astrometrics navigation (N1): wheel events told apart (mouse wheel,
 * touchpad swipe, pinch; src/core/astrometrics/wheel-input.js), what the rig
 * does with each (`wheel: auto | zoom | pan`), moving a followed target with
 * and without a fly-to running, and the camera button layout with
 * `hide: toggle`.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { wheelKindOf, classifyWheel, wheelAction, wheelZoomFactor, WHEEL_GESTURE_GAP_MS } = await import('../../src/core/astrometrics/wheel-input.js');
const { CameraRig, DEFAULT_KEYS } = await import('../../src/core/astrometrics/camera-rig.js');
const { cameraButtonLayout, TIME_STOPS, timeStop, PAD_AREAS, dpadPaths, padTokenStyle } = await import('../../src/cards/astrometrics-buttons.js');

const close = (a, b, eps = 1e-6, msg = '') => assert.ok(Math.abs(a - b) < eps, `${msg} ${a} vs ${b}`);

test('wheelKindOf: mouse notches, touchpad swipes and pinches', () => {
  const cases = [
    [{ deltaX: 0, deltaY: 100 }, 'mouse', 'Chrome/Edge notch'],
    [{ deltaX: 0, deltaY: -120 }, 'mouse', 'a 120 px notch'],
    [{ deltaX: 0, deltaY: 3, deltaMode: 1 }, 'mouse', 'Firefox lines'],
    [{ deltaX: 0, deltaY: 4.000244140625 * 2 }, 'mouse', 'Firefox macOS wheel step'],
    [{ deltaX: 0, deltaY: 4, wheelDeltaY: -120 }, 'mouse', 'legacy 120 with a small delta'],
    [{ deltaX: 0, deltaY: 40, wheelDeltaY: -120 }, 'touchpad', 'legacy -3x delta is a touchpad'],
    [{ deltaX: 0, deltaY: 2.5 }, 'touchpad', 'fractional'],
    [{ deltaX: 0, deltaY: 12 }, 'touchpad', 'small whole delta'],
    [{ deltaX: 6, deltaY: 1 }, 'touchpad', 'sideways'],
    [{ deltaX: 100, deltaY: 0, shiftKey: true }, 'mouse', 'shift+wheel turned into X'],
    [{ deltaX: 0, deltaY: 100, ctrlKey: true }, 'pinch', 'ctrl+wheel'],
    [{ deltaX: 0, deltaY: 1.7, ctrlKey: true }, 'pinch', 'touchpad pinch']
  ];
  for (const [e, kind, msg] of cases) assert.equal(wheelKindOf(/** @type {any} */ (e)), kind, msg);
});

test('classifyWheel: a gesture keeps its first kind until a pause; a pinch is always a pinch', () => {
  let g = classifyWheel({ deltaX: 0, deltaY: 100 }, null, 0);
  assert.equal(g.kind, 'mouse');
  // momentum tail with small deltas, inside the gesture
  g = classifyWheel({ deltaX: 0, deltaY: 3 }, g, 50);
  assert.equal(g.kind, 'mouse');
  g = classifyWheel({ deltaX: 0, deltaY: 1, ctrlKey: true }, g, 80);
  assert.equal(g.kind, 'pinch');
  // after the pause a new gesture is judged on its own
  g = classifyWheel({ deltaX: 0, deltaY: 3 }, g, 80 + WHEEL_GESTURE_GAP_MS + 1);
  assert.equal(g.kind, 'touchpad');
  g = classifyWheel({ deltaX: 0, deltaY: 100 }, g, 80 + WHEEL_GESTURE_GAP_MS + 20);
  assert.equal(g.kind, 'touchpad', 'a big delta inside a touchpad gesture stays touchpad');
});

test('wheelAction: auto pans a touchpad and zooms a mouse; zoom and pan force it; a pinch always zooms', () => {
  assert.equal(wheelAction('touchpad'), 'pan');
  assert.equal(wheelAction('mouse'), 'zoom');
  assert.equal(wheelAction('touchpad', 'zoom'), 'zoom');
  assert.equal(wheelAction('mouse', 'pan'), 'pan');
  assert.equal(wheelAction('pinch', 'pan'), 'zoom');
});

test('wheelZoomFactor: a mouse notch about 10 percent, a pinch faster per delta, clamped', () => {
  close(wheelZoomFactor({ deltaX: 0, deltaY: 100 }, 'mouse'), Math.exp(0.1));
  close(wheelZoomFactor({ deltaX: 0, deltaY: -5 }, 'pinch'), Math.exp(-0.05));
  close(wheelZoomFactor({ deltaX: 0, deltaY: 3, deltaMode: 1 }, 'mouse'), Math.exp(0.099));
  close(wheelZoomFactor({ deltaX: 0, deltaY: 5000 }, 'mouse'), Math.exp(1));
});

/** A rig attached to a 400 x 300 element */
function attached(opts = {}) {
  const rig = new CameraRig();
  Object.assign(rig, opts);
  rig.aspect = 400 / 300;
  rig.keys = { ...DEFAULT_KEYS, tx: 0, ty: 0, tz: 0, yaw: 0, tilt: 90, distance: 100 };
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientHeight', { value: 300 });
  el.getBoundingClientRect = () => /** @type {any} */ ({ left: 0, top: 0, width: 400, height: 300 });
  document.body.appendChild(el);
  let pans = 0;
  rig.attach(el, { onPan: () => { pans++; } });
  // the jsdom here has no WheelEvent: an Event with its fields
  const wheel = (init) => el.dispatchEvent(Object.assign(new window.Event('wheel', { bubbles: true, cancelable: true }), { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, shiftKey: false, clientX: 200, clientY: 150, ...init }));
  return { rig, el, wheel, pans: () => pans };
}

test('rig wheel: a mouse notch zooms, a touchpad swipe pans (and tells onPan), shift+swipe orbits', () => {
  const { rig, wheel, pans } = attached();
  wheel({ deltaY: 100 });
  close(rig.keys.distance, 100 * Math.exp(0.1), 1e-6, 'mouse zooms');
  assert.equal(rig.keys.tx, 0);

  const b = attached();
  b.wheel({ deltaX: 10, deltaY: 0 });
  assert.ok(b.rig.keys.tx > 0, 'a swipe left-to-right of content moves the view right');
  close(b.rig.keys.distance, 100, 1e-9, 'a swipe does not zoom');
  assert.equal(b.pans(), 1);

  const c = attached();
  c.wheel({ deltaX: 10, deltaY: 0, shiftKey: true });
  close(c.rig.keys.yaw, 3, 1e-9, 'shift+swipe orbits');
  assert.equal(c.pans(), 0);
  assert.equal(pans(), 0);
});

test('rig wheel: a pinch zooms; wheel: zoom keeps the old behaviour; wheel: pan pans a mouse wheel too', () => {
  const a = attached();
  a.wheel({ deltaY: -5, ctrlKey: true });
  close(a.rig.keys.distance, 100 * Math.exp(-0.05));

  const z = attached({ wheelMode: 'zoom' });
  z.wheel({ deltaX: 0, deltaY: 3 });
  close(z.rig.keys.distance, 100 * Math.exp(0.003));

  const p = attached({ wheelMode: 'pan' });
  p.wheel({ deltaY: 100 });
  close(p.rig.keys.distance, 100, 1e-9);
  assert.notEqual(p.rig.keys.tz, 0);
});

test('rig zoomAbout: the wheel zooms about the target, not the cursor', () => {
  const { rig, wheel } = attached({ zoomAbout: true });
  wheel({ deltaY: 100, clientX: 380, clientY: 20 });
  assert.equal(rig.keys.tx, 0);
  assert.equal(rig.keys.tz, 0);
  const free = attached();
  free.wheel({ deltaY: -100, clientX: 380, clientY: 20 });
  assert.notEqual(free.rig.keys.tx, 0, 'toward the cursor without it');
});

test('moveTarget: moves the keys; in a flight, the landing (and with from the start), keys at its progress', () => {
  const rig = new CameraRig();
  rig.keys = { ...DEFAULT_KEYS, tx: 0, ty: 0, tz: 0 };
  rig.moveTarget([1, 2, 3]);
  assert.deepEqual([rig.keys.tx, rig.keys.ty, rig.keys.tz], [1, 2, 3]);

  globalThis.matchMedia ??= /** @type {any} */ (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  rig.keys = { ...DEFAULT_KEYS, tx: 0, ty: 0, tz: 0 };
  rig.flyTo({ tx: 100, ty: 0, tz: 0 }, { duration: 1000, ease: 'linear' });
  rig.step(0);
  rig.step(500);
  close(rig.keys.tx, 50, 1e-6, 'half way');
  // the point moved +10 in x: the landing moves, the start stays
  rig.moveTarget([10, 0, 0], { from: false });
  close(rig.keys.tx, 55, 1e-6, 'keys at the same progress');
  rig.step(1000);
  close(rig.keys.tx, 110, 1e-6, 'lands on the moved point');

  rig.keys = { ...DEFAULT_KEYS, tx: 0, ty: 0, tz: 0, distance: 100 };
  rig.flyTo({ distance: 50 }, { duration: 1000, ease: 'linear' });
  rig.step(0);
  rig.step(500);
  rig.moveTarget([10, 0, 0]);
  close(rig.keys.tx, 10, 1e-6, 'a zoom step on the point moves whole');
});

test('cameraButtonLayout: hide defaults to idle; toggle adds a fold button, folded shows only it', () => {
  assert.equal(cameraButtonLayout(true)?.hide, 'idle');
  assert.equal(cameraButtonLayout(true)?.fold, null);
  assert.equal(cameraButtonLayout({ hide: 'never' })?.hide, 'never');
  const open = cameraButtonLayout({ hide: 'toggle' });
  assert.equal(open?.fold?.[0], 'fold');
  assert.equal(open?.pad, true);
  const folded = cameraButtonLayout({ hide: 'toggle' }, { folded: true });
  assert.equal(folded?.fold?.[0], 'unfold');
  assert.deepEqual([folded?.pad, folded?.time, folded?.scale], [false, false, false]);
  // the model size button: on unless scale: false (the card shows it only while a model is at its real size)
  assert.equal(cameraButtonLayout(true)?.scale, true);
  assert.equal(cameraButtonLayout({ scale: false })?.scale, false);
  assert.ok(cameraButtonLayout({ pan: false, zoom: false, travel: false, reset: false, time: false }), 'the size button alone still lays out');
  assert.equal(cameraButtonLayout({ pan: false, zoom: false, travel: false, reset: false, time: false, scale: false }), null);
});

test('camera pad: the D-pad segments, each a command on its cell of the 3 x 3 grid; options turn parts off; size clamps', () => {
  const pad = cameraButtonLayout(true);
  assert.ok(pad);
  const by = Object.fromEntries(pad.segments.map((s) => [s.seg, s]));
  assert.deepEqual(Object.fromEntries(pad.segments.map((s) => [s.seg, s.cmd])), {
    up: 'pan-up', down: 'pan-down', left: 'pan-left', right: 'pan-right', center: 'reset',
    'up-left': 'zoom-in', 'down-left': 'zoom-out', 'up-right': 'fly-forward', 'down-right': 'fly-back'
  });
  assert.ok(pad.segments.every((s) => s.on));
  // every grid cell is one segment's, each named once
  const cells = PAD_AREAS.replace(/"/g, '').split(/\s+/);
  assert.equal(cells.length, 9);
  assert.deepEqual([...cells].sort(), pad.segments.map((s) => s.area).sort());
  assert.equal(cells[0], by['up-left'].area);
  assert.equal(cells[4], by.center.area);
  assert.equal(cells[8], by['down-right'].area);
  // the paths come from the D-pad component
  const paths = dpadPaths();
  for (const s of pad.segments) assert.ok(paths[s.seg]?.startsWith('m'), s.seg);
  // options dim their parts; the pad keeps its shape
  const noTravel = cameraButtonLayout({ travel: false, zoom: false });
  assert.deepEqual(noTravel?.segments.filter((s) => !s.on).map((s) => s.cmd).sort(), ['fly-back', 'fly-forward', 'zoom-in', 'zoom-out']);
  assert.equal(noTravel?.segments.length, 9);
  assert.equal(cameraButtonLayout(true)?.size, 180);
  assert.equal(cameraButtonLayout({ size: 200 })?.size, 200);
  assert.equal(cameraButtonLayout({ size: 20 })?.size, 64);
  assert.equal(cameraButtonLayout({ size: 900 })?.size, 320);
});

test('camera pad colours: CSS variables from the D-pad theme tokens, var() kept live', () => {
  const asked = /** @type {string[]} */ ([]);
  const style = padTokenStyle((path) => { asked.push(path); return path.includes('.fill.') ? `var(--t-${path.split('.').slice(-3).join('-')})` : null; });
  assert.ok(asked.includes('components.dpad.segment.directional.fill.default'));
  assert.ok(asked.includes('components.dpad.segment.diagonal.fill.hover'));
  assert.ok(asked.includes('components.dpad.segment.center.stroke-width.pressed'));
  assert.match(style, /--pad-directional-fill-rest: var\(--t-directional-fill-default\)/);
  assert.match(style, /--pad-center-fill-off: var\(--t-center-fill-unavailable\)/);
  // a token that does not resolve is left out (the CSS fallback applies)
  assert.doesNotMatch(style, /--pad-directional-stroke-rest/);
});

test('time slider: shown unless time: false; alone without the pad; stops snap to the nearest', () => {
  assert.equal(cameraButtonLayout(true)?.time, true);
  assert.equal(cameraButtonLayout({ time: false })?.time, false);
  const only = cameraButtonLayout({ pan: false, zoom: false, reset: false, travel: false });
  assert.deepEqual([only?.pad, only?.time], [false, true]);
  assert.equal(cameraButtonLayout({ pan: false, zoom: false, reset: false, travel: false, time: false, scale: false }), null);
  assert.equal(TIME_STOPS[timeStop(1)], 1);
  assert.equal(TIME_STOPS[timeStop(0.3)], 0.25);
  assert.equal(TIME_STOPS[timeStop(0)], 0);
  assert.equal(TIME_STOPS[timeStop(10)], 4);
});

test('camera pad colours: every D-pad token the pad reads exists in the default theme', async () => {
  const { lcardsDefaultTokens } = await import('../../src/core/packs/themes/tokens/lcardsDefaultTokens.js');
  const missing = /** @type {string[]} */ ([]);
  padTokenStyle((path) => {
    const v = path.split('.').reduce((/** @type {any} */ o, k) => o?.[k], lcardsDefaultTokens);
    if (v === undefined) missing.push(path);
    return v;
  });
  assert.deepEqual(missing, []);
});
