/**
 * Nebula presets (`preset: badlands | badlands_voyager`): named bundles of
 * defaults a nebula's own keys override. Free of three.js (the config
 * checker and the docs read it too). The names are in `names.js`
 * NEBULA_PRESETS; a test keeps the two in step.
 *
 * @module core/astrometrics/nebula-presets
 */

/** The parts a preset sets as objects: the config's own keys merge into them one level deep */
const PARTS = ['band', 'columns', 'lightning', 'core', 'dust', 'ribbon', 'wake'];

/** @type {Record<string, Record<string, any>>} */
export const NEBULA_PRESET_CONFIGS = {
  // Deep Space Nine's Badlands: two sheets of liquid fire, a bright band between, fire columns
  badlands: {
    render: 'volume',
    shape: 'layers',
    size: [500, 140, 500],
    count: 6,
    colors: ['var(--lcars-yellow, var(--lcards-yellow-medium))', 'var(--lcars-orange, var(--lcards-orange-medium))', 'var(--lcars-red, var(--lcards-orange-dark))'],
    seed: 3,
    drift: [4, 1],
    veins: 0.8,
    gap: 0.4,
    band: { brightness: 1.5, width: 0.1, color: 'var(--lcars-orange, var(--lcards-orange-medium))' },
    columns: { count: 8, kind: 'fire', width: [1, 3], color: 'var(--lcars-butter, var(--lcards-yellow-lightest))' }
  },
  // Voyager's Badlands: mauve layers, held pink lightning columns, strikes lighting the gas
  badlands_voyager: {
    render: 'volume',
    shape: 'layers',
    size: [500, 160, 500],
    count: 4,
    colors: ['var(--lcars-peach, var(--lcards-orange-lightest))', 'var(--lcars-mauve, var(--lcards-orange-light))', 'var(--lcars-black-cherry, var(--lcards-gray-dark))'],
    seed: 8,
    drift: [3, 0],
    band: { brightness: 1, color: 'var(--lcars-butter, var(--lcards-yellow-lightest))' },
    columns: { count: 7, kind: 'lightning', speed: 0.6, color: 'var(--lcars-roseblush, var(--lcards-orange-lightest))', glow: { color: 'var(--lcars-magenta, var(--lcards-orange-medium))' } },
    lightning: { rate: 0.8, branches: 3, color: 'var(--lcars-space-white, var(--lcards-moonlight))', glow: { color: 'var(--lcars-magenta, var(--lcards-orange-medium))' } }
  },
  // The Nexus (Generations): a white-hot ribbon, a wake of pink and red gas trailing it
  nexus: {
    render: 'volume',
    shape: 'wake',
    size: [2000, 500, 500],
    count: 8,
    colors: ['var(--lcars-roseblush, var(--lcards-orange-lightest))', 'var(--lcars-red, var(--lcards-orange-dark))', 'var(--lcars-black-cherry, var(--lcards-gray-dark))'],
    seed: 2,
    turbulence: 0.55,
    wake: { lean: 0.35 },
    ribbon: { waves: 2.5, amplitude: 0.2, speed: 40, width: 4, color: 'var(--lcars-space-white, var(--lcards-moonlight))', glow: { color: 'var(--lcars-violet-creme, var(--lcards-moonlight))' } },
    lightning: { mode: 'crawl', count: 18, reach: 0.18, width: 1.4, color: 'var(--lcars-space-white, var(--lcards-moonlight))', glow: { color: 'var(--lcars-lavender, var(--lcards-blue-light))' } }
  }
};

/**
 * A nebula config with its preset merged under it: the config's keys win,
 * and a part the preset sets (band, columns, lightning) takes the config's
 * keys over the preset's (`band: false` turns it off). No preset, or an
 * unknown one: the config as it is.
 * @param {any} cfg
 * @returns {any}
 */
export function withNebulaPreset(cfg) {
  const preset = cfg && typeof cfg.preset === 'string' ? NEBULA_PRESET_CONFIGS[cfg.preset] : undefined;
  if (!preset) return cfg;
  /** @type {Record<string, any>} */
  const out = { ...preset, ...cfg };
  for (const k of PARTS) {
    const p = preset[k];
    const c = cfg[k];
    if (p && typeof p === 'object' && c && typeof c === 'object' && !Array.isArray(c)) out[k] = { ...p, ...c };
    // true: the preset's settings
    else if (p && c === true) out[k] = p;
  }
  // the size in the preset is a box: a radius of your own replaces it
  if (cfg.radius !== undefined && cfg.size === undefined) delete out.size;
  // the preset's speeds are scene units a second for its own box: at a size of your own they scale
  // with it, so the gas churns and the ribbon's waves run as fast for its size (a Badlands 10 ly across
  // would otherwise churn 50 times as fast); speeds of your own stay as written
  const k = sizeRatio(cfg, preset);
  if (k !== 1) {
    if (cfg.drift === undefined && preset.drift !== undefined) out.drift = scaleSpeed(preset.drift, k);
    const rib = out.ribbon;
    const ownSpeed = cfg.ribbon && typeof cfg.ribbon === 'object' && cfg.ribbon.speed !== undefined;
    if (rib && typeof rib === 'object' && !ownSpeed && typeof rib.speed === 'number') out.ribbon = { ...rib, speed: scaleSpeed(rib.speed, k) };
  }
  return out;
}

/**
 * How many times the preset's box across (x) a config's own size or radius
 * is; 1 with neither, or one that is not plain numbers (a binding).
 * @param {any} cfg @param {Record<string, any>} preset
 */
function sizeRatio(cfg, preset) {
  const base = Array.isArray(preset.size) ? preset.size[0] : Number(preset.size);
  /** @type {number} */
  let across = NaN;
  if (cfg.size !== undefined) across = Array.isArray(cfg.size) ? Number(cfg.size[0]) : typeof cfg.size === 'number' ? cfg.size : NaN;
  else if (typeof cfg.radius === 'number') across = 2 * cfg.radius;
  return Number.isFinite(across) && across > 0 && base > 0 ? across / base : 1;
}

/** A speed (or [x, y]) times k, to 4 significant figures @param {any} v @param {number} k */
const scaleSpeed = (v, k) => (Array.isArray(v) ? v.map((x) => scaleSpeed(x, k)) : typeof v === 'number' ? Number((v * k).toPrecision(4)) : v);
