/**
 * @fileoverview LCARdS Built-in Sound Pack
 *
 * Provides the default "lcards_default" audio scheme and associated audio assets.
 *
 * File layout on disk (relative to the HA www root):
 *   /hacsfiles/lcards/sounds/lcards_default/<asset>.mp3
 *
 * Asset key conventions:
 *   lcards_default_<event>   e.g. lcards_default_tap, lcards_default_nav
 *
 * To add real audio files:
 *   1. Place .mp3 files in hacsfiles/lcards/sounds/lcards_default/
 *   2. Update the `url` fields below to match the actual filenames.
 *   3. Rebuild (npm run build) and hard-refresh HA.
 *
 * Sound scheme format (sound_schemes):
 *   { schemeName: { eventKey: assetKey | null } }
 *   null  = silence that event within this scheme
 *   omitting a key = fall through to silence
 *
 * Audio asset format (audio_assets):
 *   { assetKey: { url: string, description: string } }
 */

const BASE_URL = '/hacsfiles/lcards/sounds/lcards_default';

// ──────────────────────────────────────────────────────────────
// AUDIO ASSET REGISTRY
// Each entry is registered with AssetManager under the given key.
// ──────────────────────────────────────────────────────────────
const AUDIO_ASSETS = {
  // ── Card interactions ──
  lcards_default_tap: {
    url: `${BASE_URL}/tap.mp3`,
    description: 'Short single-beep for card taps',
  },
  lcards_default_hold: {
    url: `${BASE_URL}/hold.mp3`,
    description: 'Low confirmation tone for hold actions',
  },
  lcards_default_double_tap: {
    url: `${BASE_URL}/double_tap.mp3`,
    description: 'Two-note beep for double-tap',
  },
  lcards_default_hover: {
    url: `${BASE_URL}/hover.mp3`,
    description: 'Subtle hover tick (desktop only)',
  },

  // ── Toggle / slider ──
  lcards_default_toggle_on: {
    url: `${BASE_URL}/toggle_on.mp3`,
    description: 'Rising tone for toggle → on',
  },
  lcards_default_toggle_off: {
    url: `${BASE_URL}/toggle_off.mp3`,
    description: 'Falling tone for toggle → off',
  },
  lcards_default_slider_grab: {
    url: `${BASE_URL}/slider_grab.mp3`,
    description: 'Soft click when grabbing a slider',
  },
  lcards_default_slider_release: {
    url: `${BASE_URL}/slider_release.mp3`,
    description: 'Soft click on slider release',
  },

  // ── Navigation ──
  lcards_default_nav: {
    url: `${BASE_URL}/nav.mp3`,
    description: 'Navigation beep for sidebar / page changes',
  },
  lcards_default_dialog_open: {
    url: `${BASE_URL}/dialog_open.mp3`,
    description: 'Short opening chime for dialogs',
  },

  // ── Alerts ──
  lcards_default_alert_activate: {
    url: `${BASE_URL}/alert_activate.mp3`,
    description: 'Alert activation klaxon',
  },
  lcards_default_alert_clear: {
    url: `${BASE_URL}/alert_clear.mp3`,
    description: 'Alert cleared — all-clear tone',
  },
  lcards_default_system_ready: {
    url: `${BASE_URL}/system_ready.mp3`,
    description: 'LCARdS system ready chime',
  },
  lcards_default_error: {
    url: `${BASE_URL}/error.mp3`,
    description: 'System error tone',
  },
};

// ──────────────────────────────────────────────────────────────
// SOUND SCHEME DEFINITION
// Maps every SoundManager event type to an audio asset key.
// null  = explicitly silence that event.
// Omitted events fall through to silence.
// ──────────────────────────────────────────────────────────────
const LCARDS_DEFAULT_SCHEME = {
  // Card interactions
  card_tap:          'lcards_default_tap',
  card_hold:         'lcards_default_hold',
  card_double_tap:   'lcards_default_double_tap',
  card_hover:        'lcards_default_hover',
  button_tap:        'lcards_default_tap',
  toggle_on:         'lcards_default_toggle_on',
  toggle_off:        'lcards_default_toggle_off',
  slider_drag_start: 'lcards_default_slider_grab',
  slider_drag_end:   'lcards_default_slider_release',
  slider_change:     null,      // No sound on every value tick (too noisy)
  more_info_open:    'lcards_default_dialog_open',

  // UI navigation
  nav_page:             'lcards_default_nav',
  menu_expand:          'lcards_default_nav',
  dialog_open:          'lcards_default_dialog_open',
  dashboard_edit_start: 'lcards_default_nav',
  dashboard_edit_save:  'lcards_default_nav',
  dialog_close:         'lcards_default_nav',

  // Alerts & system — per alert level
  alert_red:         'lcards_default_alert_activate',
  alert_yellow:      'lcards_default_alert_activate',
  alert_blue:        'lcards_default_alert_activate',
  alert_gray:        'lcards_default_alert_activate',
  alert_black:       'lcards_default_alert_activate',
  alert_clear:       'lcards_default_alert_clear',
  system_ready:      'lcards_default_system_ready',
  error:             'lcards_default_error',
  notification:      'lcards_default_nav',
};

// ──────────────────────────────────────────────────────────────
// PACK EXPORT
// ──────────────────────────────────────────────────────────────
export const BUILTIN_SOUNDS_PACK = {
  id:          'lcards_sounds_default',
  version:     '1.0.0',
  name:        'LCARdS Default Sounds',
  description: 'Default LCARS-inspired sound scheme for LCARdS UI interactions',

  /** Registered with AssetManager → accessible as audio assets in override picker */
  audio_assets: AUDIO_ASSETS,

  /** Registered with SoundManager → available in the Sound Scheme dropdown */
  sound_schemes: {
    lcards_default: LCARDS_DEFAULT_SCHEME,
  },
};
