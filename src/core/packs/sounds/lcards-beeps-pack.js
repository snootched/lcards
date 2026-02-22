/**
 * @fileoverview LCARdS Beeps Sound Pack
 *
 * A library of individual beep/tone audio assets.
 * This pack does NOT define a sound scheme — its assets are
 * intended to be selected individually via per-event overrides
 * in the Config Panel Sound tab.
 *
 * File layout on disk (relative to the HA www root):
 *   /hacsfiles/lcards/sounds/lcards_beeps/<asset>.mp3
 *
 * Asset key conventions:
 *   beeps_<descriptor>   e.g. beeps_short, beeps_chirp_high
 *
 * To add real audio files:
 *   1. Place .mp3 files in hacsfiles/lcards/sounds/lcards_beeps/
 *   2. Update the `url` fields below to match the actual filenames.
 *   3. Rebuild (npm run build) and hard-refresh HA.
 *
 * Note: no sound_schemes key is defined here — these assets are
 * available in the override picker without forming a named scheme.
 */

const BASE_URL = '/hacsfiles/lcards/sounds/lcards_beeps';

// ──────────────────────────────────────────────────────────────
// AUDIO ASSET REGISTRY
// Registered with AssetManager → available in Config Panel override picker.
// No scheme mapping required.
// ──────────────────────────────────────────────────────────────
const AUDIO_ASSETS = {
  // ── Short beeps ──
  beeps_short: {
    url: `${BASE_URL}/short.mp3`,
    description: 'Short single beep',
  },
  beeps_short_high: {
    url: `${BASE_URL}/short_high.mp3`,
    description: 'Short high-pitched beep',
  },
  beeps_short_low: {
    url: `${BASE_URL}/short_low.mp3`,
    description: 'Short low-pitched beep',
  },

  // ── Double / multi beeps ──
  beeps_double: {
    url: `${BASE_URL}/double.mp3`,
    description: 'Two quick beeps',
  },
  beeps_triple: {
    url: `${BASE_URL}/triple.mp3`,
    description: 'Three quick beeps',
  },

  // ── Tones / chirps ──
  beeps_chirp: {
    url: `${BASE_URL}/chirp.mp3`,
    description: 'Rising chirp',
  },
  beeps_chirp_descend: {
    url: `${BASE_URL}/chirp_descend.mp3`,
    description: 'Falling chirp',
  },
  beeps_tone_soft: {
    url: `${BASE_URL}/tone_soft.mp3`,
    description: 'Soft mid-range tone',
  },
  beeps_tone_confirm: {
    url: `${BASE_URL}/tone_confirm.mp3`,
    description: 'Confirmation tone — rising two-note',
  },
  beeps_tone_deny: {
    url: `${BASE_URL}/tone_deny.mp3`,
    description: 'Denial tone — falling two-note',
  },

  // ── Clicks ──
  beeps_click: {
    url: `${BASE_URL}/click.mp3`,
    description: 'Crisp mechanical click',
  },
  beeps_click_soft: {
    url: `${BASE_URL}/click_soft.mp3`,
    description: 'Soft muted click',
  },
};

// ──────────────────────────────────────────────────────────────
// PACK EXPORT
// No sound_schemes — assets only.
// ──────────────────────────────────────────────────────────────
export const LCARDS_BEEPS_PACK = {
  id:          'lcards_beeps',
  version:     '1.0.0',
  name:        'LCARdS Beeps',
  description: 'Library of individual beep and tone assets for use as per-event sound overrides',

  /** Registered with AssetManager → available in Config Panel override picker */
  audio_assets: AUDIO_ASSETS,

  // No sound_schemes — this pack is an asset library, not a preset scheme.
};
