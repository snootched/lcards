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
const { cameraButtonLayout, TIME_STOPS, timeStop } = await import('../../src/cards/astrometrics-buttons.js');

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

test('cameraButtonLayout: hide defaults to idle; toggle adds a fold button at the edge row, folded shows only it', () => {
  assert.equal(cameraButtonLayout(true)?.hide, 'idle');
  assert.equal(cameraButtonLayout({ hide: 'never' })?.hide, 'never');
  const open = cameraButtonLayout({ hide: 'toggle' });
  assert.ok(open);
  assert.ok(open.areas.endsWith('". . fold"'), open.areas);
  assert.deepEqual(open.buttons.map((b) => b[0]).slice(-1), ['fold']);
  const folded = cameraButtonLayout({ hide: 'toggle' }, { folded: true });
  assert.deepEqual(folded?.buttons.map((b) => b[0]), ['unfold']);
  assert.equal(folded?.areas, '". . fold"');
  const topLeft = cameraButtonLayout({ hide: 'toggle', position: 'top-left' });
  assert.ok(topLeft?.areas.startsWith('"fold . ."'), topLeft?.areas);
});

test('time slider: a row of its own unless time: false; stops snap to the nearest', () => {
  const on = cameraButtonLayout(true);
  assert.ok(on?.areas.includes('"time time time"'));
  assert.ok(on?.buttons.some((b) => b[0] === 'time'));
  const off = cameraButtonLayout({ time: false });
  assert.ok(!off?.areas.includes('time'));
  const only = cameraButtonLayout({ pan: false, zoom: false, reset: false });
  assert.equal(only?.areas, '"time time time"');
  assert.equal(TIME_STOPS[timeStop(1)], 1);
  assert.equal(TIME_STOPS[timeStop(0.3)], 0.25);
  assert.equal(TIME_STOPS[timeStop(0)], 0);
  assert.equal(TIME_STOPS[timeStop(10)], 4);
});
