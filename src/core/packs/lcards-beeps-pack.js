/**
 * @fileoverview LCARdS Beeps Sound Pack
 *
 * A library of individual beep/tone audio assets.
 * This pack does NOT define a sound scheme — its assets are
 * intended to be selected individually via per-event overrides
 * in the Config Panel Sound tab.
 *
 * File layout on disk (relative to the HA www root):
 *   /lcards/sounds/lcards_beeps/<asset>.mp3
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

const BASE_URL = '/lcards/sounds/lcards_beeps';

// ──────────────────────────────────────────────────────────────
// AUDIO ASSET REGISTRY
// Registered with AssetManager → available in Config Panel override picker.
// No scheme mapping required.
// ──────────────────────────────────────────────────────────────
const AUDIO_ASSETS = {
  // ── Generic ──
  short: {
    url: `${BASE_URL}/short.mp3`,
    description: 'Short single beep',
  },

  // ── Computer / Interface ──
  astrometrics_controls: {
    url: `${BASE_URL}/astrometrics_controls.mp3`,
    description: 'Astrometrics controls',
  },
  computer_activate: {
    url: `${BASE_URL}/computer_activate.mp3`,
    description: 'Computer activate',
  },
  computer_beep_sequence_1: {
    url: `${BASE_URL}/computer_beep_sequence_1.mp3`,
    description: 'Computer beep sequence 1',
  },
  computer_beep_sequence_2: {
    url: `${BASE_URL}/computer_beep_sequence_2.mp3`,
    description: 'Computer beep sequence 2',
  },
  computer_beep_sequence_3: {
    url: `${BASE_URL}/computer_beep_sequence_3.mp3`,
    description: 'Computer beep sequence 3',
  },
  computer_beep_sequence_4: {
    url: `${BASE_URL}/computer_beep_sequence_4.mp3`,
    description: 'Computer beep sequence 4',
  },
  computer_beep_sequence_5: {
    url: `${BASE_URL}/computer_beep_sequence_5.mp3`,
    description: 'Computer beep sequence 5',
  },
  computer_screen_off_button_push: {
    url: `${BASE_URL}/computer_screen_off_button_push.mp3`,
    description: 'Computer screen off / button push',
  },
  ops_beep_sequence: {
    url: `${BASE_URL}/ops_beep_sequence.mp3`,
    description: 'Ops beep sequence',
  },
  tactical_beep_sequence: {
    url: `${BASE_URL}/tactical_beep_sequence.mp3`,
    description: 'Tactical beep sequence',
  },

  // ── Keys / PADD ──
  key_ok_1: {
    url: `${BASE_URL}/key_ok_1.mp3`,
    description: 'Key OK 1',
  },
  key_ok_2: {
    url: `${BASE_URL}/key_ok_2.mp3`,
    description: 'Key OK 2',
  },
  key_ok_3: {
    url: `${BASE_URL}/key_ok_3.mp3`,
    description: 'Key OK 3',
  },
  key_ok_4: {
    url: `${BASE_URL}/key_ok_4.mp3`,
    description: 'Key OK 4',
  },
  key_ok_5: {
    url: `${BASE_URL}/key_ok_5.mp3`,
    description: 'Key OK 5',
  },
  key_ok_6: {
    url: `${BASE_URL}/key_ok_6.mp3`,
    description: 'Key OK 6',
  },
  padd_1: {
    url: `${BASE_URL}/padd_1.mp3`,
    description: 'PADD 1',
  },
  padd_2: {
    url: `${BASE_URL}/padd_2.mp3`,
    description: 'PADD 2',
  },
  padd_3: {
    url: `${BASE_URL}/padd_3.mp3`,
    description: 'PADD 3',
  },
  padd_button_sequence: {
    url: `${BASE_URL}/padd_button_sequence.mp3`,
    description: 'PADD button sequence',
  },

  // ── Screen / Scroll ──
  screen_scroll_1: {
    url: `${BASE_URL}/screen_scroll_1.mp3`,
    description: 'Screen scroll 1',
  },
  screen_scroll_2: {
    url: `${BASE_URL}/screen_scroll_2.mp3`,
    description: 'Screen scroll 2',
  },
  screen_scroll_3: {
    url: `${BASE_URL}/screen_scroll_3.mp3`,
    description: 'Screen scroll 3',
  },

  // ── Helm / Navigation ──
  helm_beep_sequence_1: {
    url: `${BASE_URL}/helm_beep_sequence_1.mp3`,
    description: 'Helm beep sequence 1',
  },
  helm_beep_sequence_2: {
    url: `${BASE_URL}/helm_beep_sequence_2.mp3`,
    description: 'Helm beep sequence 2',
  },
  helm_beep_sequence_3: {
    url: `${BASE_URL}/helm_beep_sequence_3.mp3`,
    description: 'Helm beep sequence 3',
  },
  sensors_1: {
    url: `${BASE_URL}/sensors_1.mp3`,
    description: 'Sensors 1',
  },

  // ── Doors / Chimes ──
  ds9_doorchime: {
    url: `${BASE_URL}/ds9_doorchime.mp3`,
    description: 'DS9 door chime',
  },
  ent_doorchime: {
    url: `${BASE_URL}/ent_doorchime.mp3`,
    description: 'ENT door chime',
  },
  tng_chime_clean: {
    url: `${BASE_URL}/tng_chime_clean.mp3`,
    description: 'TNG chime (clean)',
  },
  voy_door_chime_1: {
    url: `${BASE_URL}/voy_door_chime_1.mp3`,
    description: 'Voyager door chime 1',
  },
  voy_door_chime_2: {
    url: `${BASE_URL}/voy_door_chime_2.mp3`,
    description: 'Voyager door chime 2',
  },
  ten_forward_doors: {
    url: `${BASE_URL}/ten_forward_doors.mp3`,
    description: 'Ten Forward doors',
  },
  jefferies_tube: {
    url: `${BASE_URL}/jefferies_tube.mp3`,
    description: "Jefferies tube",
  },
  forcefield_powering_down: {
    url: `${BASE_URL}/forcefield_powering_down.mp3`,
    description: 'Forcefield powering down',
  },

  // ── Chirps / Swooshes ──
  tng_chirp_1: {
    url: `${BASE_URL}/tng_chirp_1.mp3`,
    description: 'TNG chirp 1',
  },
  tng_chirp_2: {
    url: `${BASE_URL}/tng_chirp_2.mp3`,
    description: 'TNG chirp 2',
  },
  tng_chirp_3: {
    url: `${BASE_URL}/tng_chirp_3.mp3`,
    description: 'TNG chirp 3',
  },
  tng_swoosh_clean: {
    url: `${BASE_URL}/tng_swoosh_clean.mp3`,
    description: 'TNG swoosh (clean)',
  },
  ent_b_swoosh_clean: {
    url: `${BASE_URL}/ent_b_swoosh_clean.mp3`,
    description: 'ENT-B swoosh (clean)',
  },

  // ── Misc Series ──
  ds9_bajoran_comm: {
    url: `${BASE_URL}/ds9_bajoran_comm.mp3`,
    description: 'DS9 Bajoran comm',
  },
};

// ──────────────────────────────────────────────────────────────
// PACK EXPORT
// No sound_schemes — assets only.
// ──────────────────────────────────────────────────────────────
export const LCARDS_BEEPS_PACK = {
  id:          'lcards_beeps',
  version:     __LCARDS_VERSION__,
  name:        'LCARdS Beeps',
  description: 'Library of individual beep and tone assets for use as per-event sound overrides',

  /** Registered with AssetManager → available in Config Panel override picker */
  audio_assets: AUDIO_ASSETS,

  // No sound_schemes — this pack is an asset library, not a preset scheme.
};
