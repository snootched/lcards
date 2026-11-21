/**
 * Chart time windows follow Home Assistant's locale: the profile's time zone
 * (server = hass.config.time_zone, local = the browser's) and first weekday
 * (language, or an explicit day). Assertions use fixed UTC instants, so the
 * file passes under any TZ; run it under TZ=UTC and TZ=Asia/Tokyo too.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSpan, startOfUnit, endOfUnit } from '../../src/charts/chart-span.js';
import { ChartSeriesFetcher } from '../../src/charts/chart-series-fetcher.js';
import { resolveTimeZone, firstWeekdayIndex, localeCalendar } from '../../src/utils/ha-locale.js';

const utc = (iso) => Date.parse(iso);
const hassFor = (locale, zone = 'America/New_York') => ({
    config: { time_zone: zone },
    locale: { language: 'en', time_zone: 'server', first_weekday: 'monday', ...locale }
});

// Tuesday 3 Nov 2026, 22:30 in New York (EST, UTC-5); already Wednesday in UTC.
const NOW = utc('2026-11-04T03:30:00Z');
const NY = { timeZone: 'America/New_York', weekStart: 1 };

test('resolveTimeZone: server uses hass.config.time_zone, local the browser', () => {
    assert.equal(resolveTimeZone(hassFor({ time_zone: 'server' })), 'America/New_York');
    assert.equal(resolveTimeZone(hassFor({ time_zone: 'local' })), undefined);
    assert.equal(resolveTimeZone(undefined), undefined);
    assert.equal(resolveTimeZone(hassFor({ time_zone: 'server' }, 'Not/AZone')), undefined);
});

test('firstWeekdayIndex: explicit days, language, default Monday', () => {
    assert.equal(firstWeekdayIndex(hassFor({ first_weekday: 'sunday' })), 0);
    assert.equal(firstWeekdayIndex(hassFor({ first_weekday: 'monday' })), 1);
    assert.equal(firstWeekdayIndex(hassFor({ first_weekday: 'saturday' })), 6);
    assert.equal(firstWeekdayIndex(hassFor({ first_weekday: 'language', language: 'en' })), 0);
    assert.equal(firstWeekdayIndex(hassFor({ first_weekday: 'language', language: 'en-GB' })), 1);
    assert.equal(firstWeekdayIndex(hassFor({ first_weekday: 'language', language: 'de' })), 1);
    assert.equal(firstWeekdayIndex(undefined), 1);
});

test('computeSpan: span.start day is midnight in the Home Assistant zone', () => {
    const span = computeSpan({ graph_span: '24h', span: { start: 'day' } }, NOW, NY);
    assert.equal(span.start, utc('2026-11-03T05:00:00Z'));
    assert.equal(span.end, utc('2026-11-04T05:00:00Z'));
    assert.equal(span.live, true);
});

test('computeSpan: week start Sunday vs Monday, across the DST change', () => {
    // DST ended 1 Nov 2026 at 02:00: Sunday midnight is still EDT (UTC-4).
    const sunday = computeSpan({ graph_span: '7d', span: { start: 'week' } }, NOW, { ...NY, weekStart: 0 });
    assert.equal(sunday.start, utc('2026-11-01T04:00:00Z'));
    const monday = computeSpan({ graph_span: '7d', span: { start: 'week' } }, NOW, NY);
    assert.equal(monday.start, utc('2026-11-02T05:00:00Z'));
    const endMonday = computeSpan({ graph_span: '7d', span: { end: 'week' } }, NOW, NY);
    assert.equal(endMonday.end, utc('2026-11-09T05:00:00Z'));
    const endSunday = computeSpan({ graph_span: '7d', span: { end: 'week' } }, NOW, { ...NY, weekStart: 0 });
    assert.equal(endSunday.end, utc('2026-11-08T05:00:00Z'));
});

test('startOfUnit/endOfUnit in a zone: month, year, hour (half-hour offset)', () => {
    assert.equal(startOfUnit(NOW, 'month', 1, 'America/New_York'), utc('2026-11-01T04:00:00Z'));
    assert.equal(endOfUnit(NOW, 'month', 1, 'America/New_York'), utc('2026-12-01T05:00:00Z'));
    assert.equal(startOfUnit(NOW, 'year', 1, 'America/New_York'), utc('2026-01-01T05:00:00Z'));
    assert.equal(endOfUnit(NOW, 'year', 1, 'America/New_York'), utc('2027-01-01T05:00:00Z'));
    assert.equal(endOfUnit(NOW, 'day', 1, 'America/New_York'), utc('2026-11-04T05:00:00Z'));
    // Kolkata is UTC+5:30: its hours start at :30 UTC.
    const t = utc('2026-11-04T03:50:00Z');
    assert.equal(startOfUnit(t, 'hour', 1, 'Asia/Kolkata'), utc('2026-11-04T03:30:00Z'));
    assert.equal(endOfUnit(t, 'hour', 1, 'Asia/Kolkata'), utc('2026-11-04T04:30:00Z'));
    assert.equal(startOfUnit(t, 'minute', 1, 'Asia/Kolkata'), t);
});

test('computeSpan: offset -1d gives yesterday in the zone; no zone keeps browser local', () => {
    const yesterday = computeSpan({ graph_span: '24h', span: { start: 'day', offset: '-1d' } }, NOW, NY);
    assert.equal(yesterday.start, utc('2026-11-02T05:00:00Z'));
    assert.equal(yesterday.live, false);
    const local = new Date(NOW); local.setHours(0, 0, 0, 0);
    assert.equal(computeSpan({ span: { start: 'day' } }, NOW).start, local.getTime());
    assert.equal(computeSpan({ span: { start: 'day' } }, NOW, {}).start, local.getTime());
});

test('localeCalendar: zone and week start from hass', () => {
    assert.deepEqual(localeCalendar(hassFor({ first_weekday: 'sunday' })), { timeZone: 'America/New_York', weekStart: 0 });
    assert.deepEqual(localeCalendar(hassFor({ time_zone: 'local' })), { timeZone: undefined, weekStart: 1 });
    assert.deepEqual(localeCalendar(null), { timeZone: undefined, weekStart: 1 });
});

test('ChartSeriesFetcher: the window follows the hass zone and first weekday', (t) => {
    t.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: NOW });
    const hass = hassFor({ first_weekday: 'sunday' });
    const fetcher = new ChartSeriesFetcher({ getHass: () => hass, onUpdate: () => {} });
    fetcher.start([], { graph_span: '7d', span: { start: 'week' } });
    assert.equal(fetcher.span?.start, utc('2026-11-01T04:00:00Z'));
    fetcher.start([], { graph_span: '24h', span: { start: 'day' } });
    assert.equal(fetcher.span?.start, utc('2026-11-03T05:00:00Z'));
    fetcher.stop();
});
