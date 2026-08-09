/**
 * @fileoverview LCARdS Example Pack — Full-Feature Template
 *
 * This file is the canonical template for creating a new LCARdS pack.
 * It demonstrates every key the pack format supports, with inline
 * documentation for each section.  Copy this file to a new folder,
 * rename everything from 'example' to your pack name, and delete the
 * sections you don't need.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Quick-start checklist
 * ─────────────────────────────────────────────────────────────────────
 *  1. Copy this folder to  src/core/packs/<your-pack-name>/
 *  2. Rename  lcards-example-pack.js  →  lcards-<your-pack-name>-pack.js
 *  3. Set  id, name, version, description  at the bottom
 *  4. Fill in only the sections that apply; delete the rest
 *  5. Import the pack in  src/core/packs/loadBuiltinPacks.js  and add it
 *     to  BUILTIN_REGISTRY  (and optionally  alwaysLoad)
 *  6. npm run build  →  hard-refresh HA  →  check Pack Explorer
 *
 * Pack system reference: doc/architecture/subsystems/pack-system.md
 */

// ─────────────────────────────────────────────────────────────────────
// STYLE PRESETS
//
// Named style bundles distributed to StylePresetManager.
// Key is the overlay type the presets apply to ('button', 'slider', …).
// The preset object mirrors the card's YAML style config.
//
// Access at runtime:
//   window.lcards.core.stylePresetManager.getPreset('button', 'example-lozenge')
//   window.lcards.core.stylePresetManager.getAvailablePresets('button')
// ─────────────────────────────────────────────────────────────────────
const STYLE_PRESETS = {
  button: {
    /**
     * Every button preset should declare at minimum: card.color.background.*
     * and text.default.  Use theme tokens ('{theme:…}') wherever possible
     * so the preset works across all themes.
     */
    'example-lozenge': {
      // Override the shape rendered by the button card
      // (maps to the 'preset' field in button config)
      height: 50,
      show_icon: true,
      card: {
        color: {
          background: {
            default:     '{theme:palette.primary}',
            active:      '{theme:palette.primary}',
            inactive:    '{theme:palette.inactive}',
            unavailable: '{theme:palette.unavailable}',
            hover:       '{theme:palette.primary-light}',
            pressed:     '{theme:palette.primary-dark}'
          }
        }
      },
      text: {
        default: {
          font_family:    '{theme:components.button.text.font_family}',
          font_size:      '{theme:components.button.text.font_size}',
          text_transform: 'uppercase',
          color: {
            default:     '{theme:components.button.text.color.active}',
            inactive:    '{theme:components.button.text.color.inactive}',
            unavailable: '{theme:components.button.text.color.unavailable}'
          }
        }
      }
    }
  },

  slider: {
    /**
     * Slider presets follow the same pattern.
     * Unused preset types (button, slider, …) can simply be omitted.
     */
    'example-gauge': {
      height: 60,
      card: {
        color: {
          track: {
            default:  '{theme:palette.surface}',
            active:   '{theme:palette.surface}'
          },
          fill: {
            default:  '{theme:palette.primary}',
            active:   '{theme:palette.primary}'
          }
        }
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────
// COMPONENTS
//
// Structural component definitions distributed to ComponentManager.
// Each component MUST declare  metadata.type  — this is how
// getComponentsByType('mytype') works.
//
// Typical component types: 'elbow', 'slider', 'dpad', 'alert'
// (use your own string for custom types)
//
// Access at runtime:
//   window.lcards.core.componentManager.getComponent('example-widget')
//   window.lcards.core.componentManager.getComponentsByType('example')
// ─────────────────────────────────────────────────────────────────────
const COMPONENTS = {
  'example-widget': {
    // Orientation hint used by layout engines
    orientation: 'auto',

    // Which style variants this component supports
    features: ['simple'],

    // Layout metadata for content-area calculation
    layout: {
      position: 'header',   // 'header' | 'footer'
      side:     'left'      // 'left' | 'right' | 'contained' | 'open'
    },

    // SVG can be a static string or a function:
    //   svg: `<rect … />`
    //   svg: (config) => `<rect width="${config.width}" … />`
    svg: `<rect x="0" y="0" width="100%" height="100%" rx="8" fill="currentColor"/>`,

    // Required metadata block — metadata.type drives getComponentsByType()
    metadata: {
      type:        'example',
      name:        'Example Widget',
      description: 'A placeholder structural component',
      version:     '1.0.0'
    }
  }
};

// ─────────────────────────────────────────────────────────────────────
// THEMES
//
// Full theme objects distributed to ThemeManager.
// A theme defines the complete token tree for the LCARdS colour system.
// In practice, themes are large objects; consider splitting the token
// data into a separate file and importing it here.
//
// Access at runtime:
//   window.lcards.core.themeManager.activateTheme('example-theme')
//   window.lcards.core.themeManager.getActiveTheme()
// ─────────────────────────────────────────────────────────────────────
const THEMES = {
  'example-theme': {
    id:   'example-theme',
    name: 'Example Theme',
    // tokens: { palette: { primary: '#FF9C00', … }, … }
    // See src/core/packs/themes/builtin-themes.js for the full token schema.
    tokens: {}
  }
};

// ─────────────────────────────────────────────────────────────────────
// RULES
//
// Conditional style patches distributed to RulesEngine.
// Rules fire when their conditions are met and apply CSS/style patches
// to registered card overlays.
//
// Schema reference: doc/architecture/subsystems/rules-engine.md
// ─────────────────────────────────────────────────────────────────────
const RULES = [
  {
    id:          'example-rule',
    description: 'Turn all buttons with tag "example" red when active',
    enabled:     true,
    conditions: [
      // Match cards that have the 'example' tag AND whose entity is 'on'
      { type: 'tag',    value: 'example' },
      { type: 'state',  entity: '{config.entity}', operator: '==', value: 'on' }
    ],
    patches: [
      {
        target: { tag: 'example' },
        style: {
          card: { color: { background: { active: '#CC0000' } } }
        }
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────
// AUDIO ASSETS
//
// Individual audio clips registered with AssetManager.
// Once registered, assets appear in the Config Panel "Sound" tab
// override picker for per-event assignment.
//
// URL convention for HACS-distributed packs:
//   /hacsfiles/<your-pack-hacs-id>/sounds/<file>.mp3
//
// Access at runtime (indirect — via SoundManager):
//   window.lcards.core.soundManager.play('card_tap')
// ─────────────────────────────────────────────────────────────────────
const BASE_AUDIO_URL = '/hacsfiles/lcards-example/sounds';

const AUDIO_ASSETS = {
  example_tap: {
    url:         `${BASE_AUDIO_URL}/tap.mp3`,
    description: 'Example card-tap beep'
  },
  example_alert: {
    url:         `${BASE_AUDIO_URL}/alert.mp3`,
    description: 'Example alert klaxon'
  }
};

// ─────────────────────────────────────────────────────────────────────
// SOUND SCHEMES
//
// Named schemes that map SoundManager event keys to audio asset keys.
// Selecting a scheme in the Config Panel applies all its mappings at once.
//
// Supported event keys (see SoundManager for the full list):
//   card_tap, card_hold, card_double_tap, card_hover
//   toggle_on, toggle_off
//   slider_grab, slider_release, slider_change
//   nav_forward, nav_back
//   alert_red, alert_yellow, alert_clear
//
// null  = explicitly silence that event in this scheme
// omit  = fall through to the system default
// ─────────────────────────────────────────────────────────────────────
const SOUND_SCHEMES = {
  'example-scheme': {
    card_tap:    'example_tap',
    card_hold:   'example_tap',
    alert_red:   'example_alert',
    alert_clear: null              // silence the clear event
  }
};

// ─────────────────────────────────────────────────────────────────────
// SVG ASSETS
//
// SVG images registered with AssetManager for use as MSD backgrounds
// or card imagery.
//
// URL convention for HACS-distributed packs:
//   /hacsfiles/<your-pack-hacs-id>/svg/<file>.svg
// ─────────────────────────────────────────────────────────────────────
const BASE_SVG_URL = '/hacsfiles/lcards-example/svg';

const SVG_ASSETS = {
  'example-bg': {
    url:      `${BASE_SVG_URL}/background.svg`,
    metadata: {
      name:        'Example Background',
      description: 'A placeholder MSD background',
      category:    'backgrounds',
      tags:        ['example', 'placeholder']
    }
  }
};

// ─────────────────────────────────────────────────────────────────────
// FONT ASSETS
//
// Web fonts registered with AssetManager.
// URL can be an absolute external URL (set external: true)
// or a local HACS path.
// ─────────────────────────────────────────────────────────────────────
const FONT_ASSETS = {
  'example-font': {
    url:         '/hacsfiles/lcards-example/fonts/ExampleFont.woff2',
    displayName: 'Example Font',
    category:    'display',
    description: 'A placeholder display font',
    external:    false
  }
};

// ─────────────────────────────────────────────────────────────────────
// PACK EXPORT
//
// The pack object consumed by PackManager.registerPack().
// Remove any keys your pack does not use — PackManager silently
// ignores empty/missing keys.
// ─────────────────────────────────────────────────────────────────────
export const LCARDS_EXAMPLE_PACK = {
  // ── Identity (all required) ──────────────────────────────────────
  id:          'lcards_example',
  name:        'LCARdS Example',
  version:     '1.0.0',
  description: 'Full-feature example pack — template for third-party pack authors',

  // ── Data sections (all optional — delete what you don't use) ─────
  style_presets: STYLE_PRESETS,
  components:    COMPONENTS,
  themes:        THEMES,
  rules:         RULES,
  audio_assets:  AUDIO_ASSETS,
  sound_schemes: SOUND_SCHEMES,
  svg_assets:    SVG_ASSETS,
  font_assets:   FONT_ASSETS,
};
