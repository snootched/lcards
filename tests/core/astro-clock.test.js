/**
 * The astrometrics scene clock (src/core/astrometrics/clock.js) and what
 * follows it: `body` points (placements.js) in each frame's units, the
 * time slider's modes and date stops (cards/astrometrics-buttons.js), the
 * registry's setClock, and the body list the schema publishes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { SceneClock, parseDate, parseRate, dateStop, formatSceneDate, DATE_STOPS, LIVE_RATE } from '../../src/core/astrometrics/clock.js';
import { Placements } from '../../src/core/astrometrics/placements.js';
import { position, toScene, BODIES, AU_KM } from '../../src/core/astrometrics/ephemeris.js';
import { BODY_NAMES, PLACEMENT_FORMS } from '../../src/core/astrometrics/names.js';
import { timeMode } from '../../src/cards/astrometrics-buttons.js';

const T0 = Date.UTC(2026, 9, 30, 12);

test('parseDate: now, ISO, date only at midnight UTC, Home Assistant state form, garbage', () => {
  assert.equal(parseDate('now'), null);
  assert.equal(parseDate(undefined), null);
  assert.equal(parseDate('2026-10-30T12:00:00Z'), T0);
  assert.equal(parseDate('2026-10-30'), Date.UTC(2026, 9, 30));
  assert.equal(parseDate('2026-10-30 12:00:00'), new Date(2026, 9, 30, 12).valueOf(), 'local time, like input_datetime');
  assert.equal(parseDate(T0), T0);
  assert.equal(parseDate('soon'), undefined);
});

test('parseRate: live, numbers, negative, garbage', () => {
  assert.equal(parseRate('live'), LIVE_RATE);
  assert.equal(parseRate(undefined), LIVE_RATE);
  assert.equal(parseRate(30), 30);
  assert.equal(parseRate('-1'), -1);
  assert.equal(parseRate(0), 0);
  assert.equal(parseRate('fast'), null);
});

test('SceneClock: runs at its rate from its date; setting one keeps the other running', () => {
  const c = new SceneClock(() => T0);
  assert.equal(c.date(0), T0, 'starts now');
  assert.ok(Math.abs(c.date(1000) - (T0 + 1000)) < 1e-6, 'live: a second a second');
  c.set({ rate: 1 }, 1000);
  assert.ok(Math.abs(c.date(2000) - (T0 + 1000 + 86400000)) < 1e-3, 'a day a second from where it was');
  c.set({ date: '2000-01-01T12:00:00Z' }, 2000);
  assert.equal(c.date(2000), Date.UTC(2000, 0, 1, 12));
  assert.ok(Math.abs(c.date(3000) - (Date.UTC(2000, 0, 1, 12) + 86400000)) < 1e-3, 'rate kept');
  c.set({ rate: -30 }, 3000);
  assert.ok(c.date(4000) < c.date(3000), 'negative runs back');
  assert.equal(c.fast, true);
  c.set({ rate: 0 }, 4000);
  assert.equal(c.running, false);
  assert.equal(c.date(9000), c.date(4000), 'held');
  c.set({ rate: 'live' }, 9000);
  assert.equal(c.fast, false, 'live redraws on a timer');
  assert.equal(c.set({ date: 'soon', rate: 2 }, 9000), false, 'a bad value is refused');
  assert.equal(c.rate, 2, 'the good one still applies');
});

test('date stops: rewind to a year a second, live in the middle, nearest stop', () => {
  assert.equal(DATE_STOPS.length, 9);
  assert.equal(DATE_STOPS[dateStop(LIVE_RATE)].label, 'Live');
  assert.equal(DATE_STOPS[dateStop(0)].label, 'Paused');
  assert.equal(DATE_STOPS[dateStop(1)].label, '1 d/s');
  assert.equal(DATE_STOPS[dateStop(20)].label, '30 d/s');
  assert.equal(DATE_STOPS[dateStop(-400)].label, '-1 y/s');
  assert.equal(DATE_STOPS[dateStop(1 / 30)].label, '1 h/s');
});

test('formatSceneDate: minutes, UTC on request, years before 1 AD', () => {
  assert.equal(formatSceneDate(T0, { utc: true }), '2026-10-30 12:00 UTC');
  assert.match(formatSceneDate(T0), /^2026-10-3\d \d\d:\d\d$/);
  assert.equal(formatSceneDate(NaN), '-');
  assert.match(formatSceneDate(Date.UTC(-500, 0, 1), { utc: true }), /^-0500-01-01/);
});

test('timeMode: speed by default, both once there is a clock, explicit modes win', () => {
  assert.equal(timeMode(true), 'speed');
  assert.equal(timeMode(undefined), 'speed');
  assert.equal(timeMode(true, true), 'both');
  assert.equal(timeMode({ time: true }, true), 'both');
  assert.equal(timeMode({ time: 'date' }), 'date');
  assert.equal(timeMode({ time: 'speed' }, true), 'speed');
});

test('body points: where the body is at the clock date, in the frame units, the Sun at the origin', () => {
  let date = T0;
  const units = { root: 'km', inner: 'au' };
  const p = new Placements({
    points: [
      { id: 'mars', body: 'mars' },
      { id: 'mars_au', body: 'mars', _system: 'inner' },
      { id: 'io', body: 'io', center: 'jupiter' },
      { id: 'luna', body: 'moon', center: 'earth', offset: [0, 10, 0] }
    ],
    date: () => date,
    units: (sys) => (sys ? units[sys] : units.root)
  });
  const want = new Vector3(...toScene(position('mars', T0)));
  const got = p.get('mars');
  assert.ok(got.distanceTo(want) < 1, 'km');
  assert.ok(p.get('mars_au').distanceTo(want.clone().multiplyScalar(1 / AU_KM)) < 1e-9, 'au (no frame node: scene space)');
  assert.ok(Math.abs(p.get('io').length() - 421800) < 3000, 'Io from Jupiter');
  const l = p.get('luna');
  assert.ok(l.distanceTo(new Vector3(...toScene(position('moon', T0, 'earth'))).add(new Vector3(0, 10, 0))) < 1e-6, 'offset added');
  assert.equal(p.isDynamic('mars'), true);
  date = T0 + 30 * 86400000;
  p.invalidate();
  assert.ok(p.get('mars').distanceTo(want) > 1e7, 'moves with the clock');
});

test('body points: an unknown body or a frame without units', () => {
  const p = new Placements({ points: [{ id: 'x', body: 'vulcan' }, { id: 'e', body: 'earth' }], date: () => T0 });
  assert.equal(p.get('x'), null);
  // no units: read as au (and a warning)
  assert.ok(Math.abs(p.get('e').length() - 1) < 0.02);
});

test('BODY_NAMES (names.js, for the schema) lists exactly the ephemeris bodies; body is a placement form', () => {
  assert.deepEqual([...BODY_NAMES].sort(), Object.keys(BODIES).sort());
  assert.ok(PLACEMENT_FORMS.includes('body'));
});

test('registry setClock: the card by id, a date or a rate needed', async () => {
  const { astrometricsRegistry, registerAstrometricsCard, unregisterAstrometricsCard } = await import('../../src/cards/astrometrics-registry.js');
  const calls = [];
  const card = /** @type {any} */ ({ config: { id: 'sol' }, flyTo: async () => {}, setClock: (o) => { calls.push(o); return true; } });
  registerAstrometricsCard(card);
  try {
    assert.equal(astrometricsRegistry.setClock('sol', { date: 'now', rate: 1 }), 1);
    assert.deepEqual(calls[0], { date: 'now', rate: 1 });
    assert.equal(astrometricsRegistry.setClock('sol', { rate: 30, date: '' }), 1);
    assert.deepEqual(calls[1], { rate: 30 }, 'empty values left out');
    assert.equal(astrometricsRegistry.setClock('sol', {}), 0, 'nothing to set');
    assert.equal(astrometricsRegistry.setClock('other', { rate: 1 }), 0, 'no such card');
  } finally {
    unregisterAstrometricsCard(card);
  }
});
