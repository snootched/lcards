/**
 * Sample data for the chart docs' live demos (no Home Assistant on the docs
 * site). Each entity id maps to a deterministic generated signal, so every
 * page load draws the same chart.
 *
 * Signals are picked from the entity id: temperature, humidity, power,
 * energy (meter), battery, on/off domains; anything else gets a generic wave.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Small deterministic PRNG (mulberry32) seeded from a string. */
function rng(seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed ^ ch.charCodeAt(0), 2654435761) >>> 0);
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hour of day as a 0..1 fraction (local time). */
const dayPhase = (t) => {
  const d = new Date(t);
  return (d.getHours() + d.getMinutes() / 60) / 24;
};

/**
 * What a sample entity looks like.
 * @param {string} entityId
 * @returns {{kind: string, name: string, unit?: string}}
 */
export function describeEntity(entityId = '') {
  const id = entityId.toLowerCase();
  const object = id.split('.')[1] ?? id;
  const name = object.replace(/^demo_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const domain = id.split('.')[0];
  if (['light', 'switch', 'binary_sensor', 'input_boolean', 'fan'].includes(domain)) return { kind: 'onoff', name };
  if (/temp/.test(id)) return { kind: 'temperature', name, unit: '°C' };
  if (/humid/.test(id)) return { kind: 'humidity', name, unit: '%' };
  if (/energy|kwh|consumption|meter/.test(id)) return { kind: 'energy', name, unit: 'kWh' };
  if (/solar|pv_/.test(id)) return { kind: 'solar', name, unit: 'W' };
  if (/power|watt|load/.test(id)) return { kind: 'power', name, unit: 'W' };
  if (/battery|percent|level/.test(id)) return { kind: 'battery', name, unit: '%' };
  return { kind: 'wave', name };
}

/** Sample sensors shown in the playground's reference list. */
export const SAMPLE_ENTITIES = [
  'sensor.demo_temperature',
  'sensor.demo_outdoor_temperature',
  'sensor.demo_humidity',
  'sensor.demo_power',
  'sensor.demo_energy',
  'sensor.demo_battery',
  'light.demo'
];

/**
 * Generated history for one entity.
 * @param {string} entityId
 * @param {number} start - Epoch ms
 * @param {number} end - Epoch ms (capped at now)
 * @returns {Array<{t: number, v: number}>}
 */
export function samplePoints(entityId, start, end) {
  const { kind } = describeEntity(entityId);
  const random = rng(entityId);
  const span = end - start;
  // About 300 points per chart, never finer than one per minute
  const step = Math.max(MINUTE, Math.round(span / 300 / MINUTE) * MINUTE);
  const first = Math.floor(start / step) * step;
  const points = [];

  if (kind === 'onoff') {
    let state = 0;
    for (let t = first; t <= end; t += step) {
      // Lights are more likely on in the evening
      const p = dayPhase(t);
      const onChance = p > 0.75 || p < 0.05 ? 0.18 : 0.04;
      if (random() < (state ? 0.12 : onChance)) state = 1 - state;
      points.push({ t, v: state });
    }
    return points;
  }

  // Per-entity character (seeded), so similar sensors don't overlap exactly
  const offset = (random() - 0.5) * 3;
  const amplitude = 0.7 + random() * 0.6;
  // Slow day-to-day "weather" drift (period of a few days)
  const drift = (t) => Math.sin(t / (3.3 * 24 * HOUR) + offset) * 3 + Math.sin(t / (1.7 * 24 * HOUR)) * 1.5;
  let meter = 1200 + random() * 50;
  let battery = 40 + random() * 60; // each battery starts at a different level
  for (let t = first; t <= end; t += step) {
    const p = dayPhase(t);
    const wave = Math.sin((p - 0.25) * 2 * Math.PI); // peaks mid-afternoon
    const noise = random() - 0.5;
    let v;
    switch (kind) {
      case 'temperature':
        v = /outdoor|outside/.test(entityId)
          ? 12 + offset + 7 * amplitude * wave + drift(t) + noise * 0.8
          : 21 + offset + 1.5 * amplitude * wave + drift(t) * 0.2 + noise * 0.4;
        break;
      case 'humidity':
        v = 52 + offset * 2 - 12 * amplitude * wave - drift(t) * 2 + noise * 3;
        break;
      case 'solar': {
        // Daylight only: a bell curve from about 06:00 to 18:00
        const daylight = Math.sin((p - 0.25) * 2 * Math.PI);
        v = Math.max(0, daylight) * 2400 * (0.85 + random() * 0.15);
        break;
      }
      case 'power':
        v = 220 + 180 * Math.max(0, wave) + (random() < 0.06 ? 1500 + random() * 800 : 0) + noise * 40;
        break;
      case 'energy':
        meter += (0.1 + 0.3 * Math.max(0, wave) + random() * 0.05) * (step / HOUR);
        v = meter;
        break;
      case 'battery':
        battery = battery <= 15 ? 100 : battery - (step / HOUR) * 0.8;
        v = battery;
        break;
      default:
        v = 50 + 25 * Math.sin(t / (3 * HOUR) + random() * 0.1) + noise * 4;
    }
    points.push({ t, v: Math.round(v * 100) / 100 });
  }
  return points;
}

/** Start of a statistics period, aligned to local time like HA's recorder. */
function periodStart(t, period) {
  const d = new Date(t);
  if (period === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (period === 'week') { const back = (d.getDay() + 6) % 7; d.setDate(d.getDate() - back); d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (period === 'day') { d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (period === 'hour') { d.setMinutes(0, 0, 0); return d.getTime(); }
  return Math.floor(t / (5 * MINUTE)) * 5 * MINUTE;
}

/** Start of the period after the one containing t. */
function nextPeriod(t, period) {
  const d = new Date(periodStart(t, period));
  if (period === 'month') d.setMonth(d.getMonth() + 1);
  else if (period === 'week') d.setDate(d.getDate() + 7);
  else if (period === 'day') d.setDate(d.getDate() + 1);
  else if (period === 'hour') d.setHours(d.getHours() + 1);
  else return t + 5 * MINUTE;
  return d.getTime();
}

const PERIOD_MS = { '5minute': 5 * MINUTE, hour: HOUR, day: 24 * HOUR, week: 7 * 24 * HOUR, month: 30 * 24 * HOUR };

/**
 * Generated long-term statistics (what HA's recorder would return).
 * @param {string} entityId
 * @param {{type: string, period: string}} statistics
 * @param {number} start
 * @param {number} end
 * @param {boolean} [minMax] - Return [min, max] per period (rangeArea)
 * @returns {Array<{t: number, v: number|number[]}>}
 */
export function sampleStatistics(entityId, { type, period }, start, end, minMax = false) {
  const size = PERIOD_MS[period] ?? HOUR;
  const raw = samplePoints(entityId, start - size, end);
  const out = [];
  let previousLast = null;
  for (let bucket = periodStart(start, period); bucket < end; bucket = nextPeriod(bucket, period)) {
    const bucketEnd = nextPeriod(bucket, period);
    const values = raw.filter(p => p.t >= bucket && p.t < bucketEnd).map(p => p.v);
    if (!values.length) continue;
    const last = values[values.length - 1];
    const stats = {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      state: last,
      sum: last,
      change: previousLast === null ? last - values[0] : last - previousLast
    };
    previousLast = last;
    out.push({ t: bucket, v: minMax ? [stats.min, stats.max] : Math.round((stats[type] ?? stats.mean) * 100) / 100 });
  }
  return out;
}

/**
 * Token lookup against the default LCARdS theme, following token-to-token
 * references the way ThemeManager does ("colors.chart.series" etc.).
 * @param {Object} tokens - lcardsDefaultTokens
 * @returns {(path: string) => any}
 */
export function tokenLookup(tokens) {
  const read = (path) => path.split('.').reduce((node, key) => node?.[key], tokens);
  const resolve = (value, depth = 0) => {
    if (depth < 5 && typeof value === 'string' && /^[a-zA-Z]+(\.[\w-]+)+$/.test(value)) {
      const next = read(value);
      if (next !== undefined) return resolve(next, depth + 1);
    }
    return value;
  };
  return (path) => resolve(read(path));
}

/**
 * HA-LCARS colour variables (default theme values from th3jesta/ha-lcars),
 * so docs examples that use var(--lcars-...) look as they would on an LCARS
 * dashboard. Only set where the page doesn't already define them.
 */
export const LCARS_DEMO_VARS = {
  '--lcars-orange': '#ff7700',
  '--lcars-blue': '#4455ff',
  '--lcars-yellow': '#ffcc33',
  '--lcars-violet': '#9944ff',
  '--lcars-red': '#dd4444',
  '--lcars-green': '#33cc99',
  '--lcars-gray': '#666688',
  '--lcars-lilac': '#cc33ff',
  '--lcars-african-violet': '#cc88ff',
  '--lcars-text-gray': '#d3d3d3',
  '--lcars-text-light': '#ffffff',
  '--lcars-text-dark': '#000000'
};
