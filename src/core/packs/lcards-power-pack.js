/**
 * @fileoverview LCARdS Power Sound Pack
 *
 * A library of power-up and power-down audio assets.
 * This pack does NOT define a sound scheme — its assets are
 * intended to be selected individually via per-event overrides
 * in the Config Panel Sound tab or card YAML.
 *
 * File layout on disk (relative to the HA www root):
 *   /lcards/sounds/lcards_power/<asset>.mp3
 *
 * Asset key conventions:
 *   power_<descriptor>       e.g. power_up1, power_down
 *   tng_<descriptor>         e.g. tng_poweringup, tng_powerloss
 *
 * To add real audio files:
 *   1. Place .mp3 files in src/assets/sounds/lcards_power/
 *   2. Rebuild (npm run build) and hard-refresh HA.
 *
 * Note: no sound_schemes key is defined here — these assets are
 * available in the override picker without forming a named scheme.
 */

const BASE_URL = '/lcards/sounds/lcards_power';

// ──────────────────────────────────────────────────────────────
// AUDIO ASSET REGISTRY
// Registered with AssetManager → available in Config Panel override picker.
// No scheme mapping required.
// ──────────────────────────────────────────────────────────────
const AUDIO_ASSETS = {
  // ── Generic Power ──
  power_down: {
    url: `${BASE_URL}/power_down.mp3`,
    description: 'Power down',
  },
  power_hold_and_off: {
    url: `${BASE_URL}/power_hold_and_off.mp3`,
    description: 'Power hold and off',
  },
  power_up1: {
    url: `${BASE_URL}/power_up1.mp3`,
    description: 'Power up 1',
  },
  power_up2: {
    url: `${BASE_URL}/power_up2.mp3`,
    description: 'Power up 2',
  },
  power_up3: {
    url: `${BASE_URL}/power_up3.mp3`,
    description: 'Power up 3',
  },
  power_up4: {
    url: `${BASE_URL}/power_up4.mp3`,
    description: 'Power up 4',
  },

  // ── TNG ──
  tng_poweringdown: {
    url: `${BASE_URL}/tng_poweringdown.mp3`,
    description: 'TNG powering down',
  },
  tng_poweringup: {
    url: `${BASE_URL}/tng_poweringup.mp3`,
    description: 'TNG powering up',
  },
  tng_powerloss: {
    url: `${BASE_URL}/tng_powerloss.mp3`,
    description: 'TNG power loss',
  },
};

// ──────────────────────────────────────────────────────────────
// PACK EXPORT
// No sound_schemes — assets only.
// ──────────────────────────────────────────────────────────────
export const LCARDS_POWER_PACK = {
  id:          'lcards_power',
  version:     __LCARDS_VERSION__,
  name:        'LCARdS Power Sounds',
  description: 'Power-up and power-down sound effects',

  /** Registered with AssetManager → available in Config Panel override picker */
  audio_assets: AUDIO_ASSETS,

  // No sound_schemes — this pack is an asset library, not a preset scheme.
};
