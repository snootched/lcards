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
  return out;
}
