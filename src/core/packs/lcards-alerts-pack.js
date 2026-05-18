/**
 * @fileoverview LCARdS Alerts Sound Pack
 *
 * A library of individual alert audio assets.
 * This pack does NOT define a sound scheme — its assets are
 * intended to be selected individually via per-event overrides
 * in the Config Panel Sound tab.
 *
 * File layout on disk (relative to the HA www root):
 *   /lcards/sounds/lcards_alerts/<asset>.mp3
 *
 * Asset key conventions:
 *   alerts_<descriptor>   e.g. alerts_red, alerts_blue
 *
 * To add real audio files:
 *   1. Place .mp3 files in hacsfiles/lcards/sounds/lcards_alerts/
 *   2. Update the `url` fields below to match the actual filenames.
 *   3. Rebuild (npm run build) and hard-refresh HA.
 *
 * Note: no sound_schemes key is defined here — these assets are
 * available in the override picker without forming a named scheme.
 */

const BASE_URL = '/lcards/sounds/lcards_alerts';

// ──────────────────────────────────────────────────────────────
// AUDIO ASSET REGISTRY
// Registered with AssetManager → available in Config Panel override picker.
// No scheme mapping required.
// ──────────────────────────────────────────────────────────────
const AUDIO_ASSETS = {
  // ── Generic Klaxons ──
  alert_klaxon_1: {
    url: `${BASE_URL}/alert_klaxon_1.mp3`,
    description: 'Alert Klaxon 1',
  },
  alert_klaxon_2: {
    url: `${BASE_URL}/alert_klaxon_2.mp3`,
    description: 'Alert Klaxon 2',
  },
  // ── TNG ──
  tng_nemesis_intruder_alert: {
    url: `${BASE_URL}/tng_nemesis_intruder_alert.mp3`,
    description: 'TNG Nemesis Intruder Alert',
  },
  tng_red_alert_1: {
    url: `${BASE_URL}/tng_red_alert_1.mp3`,
    description: 'TNG Red Alert 1',
  },
  tng_red_alert_2: {
    url: `${BASE_URL}/tng_red_alert_2.mp3`,
    description: 'TNG Red Alert 2',
  },
  tng_red_alert_3: {
    url: `${BASE_URL}/tng_red_alert_3.mp3`,
    description: 'TNG Red Alert 3',
  },
  tng_red_alert_4: {
    url: `${BASE_URL}/tng_red_alert_4.mp3`,
    description: 'TNG Red Alert 4',
  },
  // ── Voyager ──
  voy_blue_alert: {
    url: `${BASE_URL}/voy_blue_alert.mp3`,
    description: 'Voyager Blue Alert',
  },
  voy_intruder_alert: {
    url: `${BASE_URL}/voy_intruder_alert.mp3`,
    description: 'Voyager Intruder Alert',
  },
  voy_red_alert_1: {
    url: `${BASE_URL}/voy_red_alert_1.mp3`,
    description: 'Voyager Red Alert 1',
  },
  voy_red_alert_2: {
    url: `${BASE_URL}/voy_red_alert_2.mp3`,
    description: 'Voyager Red Alert 2',
  },
};

// ──────────────────────────────────────────────────────────────
// PACK EXPORT
// No sound_schemes — assets only.
// ──────────────────────────────────────────────────────────────
export const LCARDS_ALERTS_PACK = {
  id:          'lcards_alerts',
  version:     __LCARDS_VERSION__,
  name:        'LCARdS Alerts',
  description: 'Library of individual alert assets for use as per-event sound overrides',
  /** Registered with AssetManager → available in Config Panel override picker */
  audio_assets: AUDIO_ASSETS,

  // No sound_schemes — this pack is an asset library, not a preset scheme.
};
