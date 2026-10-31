/**
 * The Astrometrics Studio's clock fields (rate presets and custom rates, the
 * date as now or a date and time) and the adapter that lets the card editors'
 * text controls edit the labels object.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATE_STOPS, parseRate, parseDate } from '../../src/core/astrometrics/clock.js';
import {
  RATE_PRESETS, rateField, customParts, presetValue, customRateValue, rateWords, isNowDate, dateSelectorValue, todayValue
} from '../../src/editor/dialogs/astro-studio/clock-fields.js';
import { valueEditor, setPath, schemaAt } from '../../src/editor/dialogs/astro-studio/text-adapter.js';
import { astrometricsSchema } from '../../src/cards/schemas/astrometrics-schema.js';

test('every time slider stop is a preset, and each preset round-trips through the config', () => {
  assert.equal(RATE_PRESETS.length, DATE_STOPS.length);
  for (const p of RATE_PRESETS) {
    const v = presetValue(p.value);
    assert.equal(parseRate(v), p.rate, p.label);
    assert.deepEqual(rateField(v), { preset: p.value }, p.label);
  }
  assert.equal(RATE_PRESETS.find((p) => p.value === 'live')?.label, 'Live (real time)');
  assert.equal(RATE_PRESETS.find((p) => p.value === '-30 d/s')?.label, '30 days a second, backward');
  assert.equal(RATE_PRESETS.find((p) => p.value === '1 h/s')?.label, '1 hour a second');
});

test('rates off the presets are custom: an amount and a unit', () => {
  assert.deepEqual(rateField('2 h/s'), { amount: 2, unit: 'h' });
  assert.deepEqual(rateField('-3 w'), { amount: -3, unit: 'w' });
  assert.deepEqual(rateField(7), { amount: 7, unit: 'd' });
  assert.deepEqual(rateField('live'), { preset: 'live' });
  assert.deepEqual(rateField(undefined), { preset: 'live' });
  assert.deepEqual(rateField(0), { preset: '0' });
  assert.deepEqual(rateField(1), { preset: '1 d/s' });
  assert.equal(customRateValue(2, 'h'), '2 h/s');
  assert.equal(customRateValue(undefined, 'mo'), '1 mo/s');
  assert.equal(parseRate(customRateValue(-1.5, 'y')), -1.5 * 365.25);
  assert.equal(rateWords(1, 'mo'), '1 month a second');
  // Custom starts from the current rate, a preset's included
  assert.deepEqual(customParts('30 d/s'), { amount: 30, unit: 'd' });
  assert.deepEqual(customParts(undefined), { amount: 1, unit: 's' });
  assert.deepEqual(customParts(0), { amount: 0, unit: 'd' });
});

test('dates: now or a date and time, in the form the datetime selector writes and the clock reads', () => {
  assert.ok(isNowDate(undefined) && isNowDate('now') && !isNowDate('2026-10-30'));
  assert.equal(dateSelectorValue('2026-10-30'), '2026-10-30 00:00:00');
  assert.equal(dateSelectorValue('1969-07-20T20:17:00Z'), '1969-07-20 20:17:00');
  assert.equal(dateSelectorValue('2026-10-30 12:00'), '2026-10-30 12:00:00');
  assert.equal(dateSelectorValue('now'), undefined);
  assert.equal(todayValue(new Date(2026, 9, 31, 15, 4)), '2026-10-31 00:00:00');
  assert.equal(parseDate('2026-10-31 00:00:00'), new Date(2026, 9, 31).getTime());
});

test('the labels adapter: schema through styles by name, writes prune empty parents', () => {
  const labels = astrometricsSchema.properties.labels;
  assert.ok(schemaAt(labels, 'default.font_family'));
  assert.ok(schemaAt(labels, 'styles.major.priority'));
  assert.ok(schemaAt(labels, 'styles.my_style.color'));
  assert.equal(schemaAt(labels, 'default.content'), null);
  /** @type {any[]} */
  const seen = [];
  const ed = valueEditor({ hass: null, schema: labels, value: { snap: true }, onChange: (v) => seen.push(v) });
  ed._setConfigValue('styles.major.font_size', 24);
  assert.deepEqual(seen.at(-1), { snap: true, styles: { major: { font_size: 24 } } });
  assert.equal(ed._getConfigValue('styles.major.font_size'), 24);
  ed._setConfigValue('styles.major.font_size', undefined);
  assert.deepEqual(seen.at(-1), { snap: true });
  assert.deepEqual(setPath({ a: { b: 1, c: 2 } }, ['a', 'b'], ''), { a: { c: 2 } });
});
