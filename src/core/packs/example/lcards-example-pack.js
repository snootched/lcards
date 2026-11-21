/**
 * @fileoverview LCARdS Example Pack — Full-Feature Template
 *
 * This file is the canonical template for creating a new LCARdS pack.
 * It demonstrates every key the pack format supports, with inline
 * documentation for each section.  Copy this file to the packs root,
 * rename everything from 'example' to your pack name, and delete the
 * sections you don't need.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Quick-start checklist
 * ─────────────────────────────────────────────────────────────────────
 *  1. Copy this file to the packs root as
 *       src/core/packs/lcards-<your-pack-name>-pack.js
 *     (every built-in pack is one file there; this one sits in example/
 *     only so it is never loaded)
 *  2. Set  id, name, version, description  at the bottom
 *  3. Fill in only the sections that apply; delete the rest
 *  4. Put asset files under src/assets/{sounds,msd,fonts,images}/ (the
 *     build copies them next to lcards.js, served at /lcards/...)
 *  5. Import the pack in  src/core/packs/loadBuiltinPacks.js  and add it
 *     to  BUILTIN_REGISTRY, then make it load: add its id to  alwaysLoad
 *     (or to  CORE_REQUESTED_PACK_IDS ). A pack in neither list is
 *     registered nowhere and never loads.
 *  6. npm run build  →  hard-refresh Home Assistant  →  check Pack Explorer
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
     * and text.default.  Use theme tokens ('theme:<token path>', paths from
     * src/core/packs/themes/tokens/lcardsDefaultTokens.js) wherever possible
     * so the preset follows the active theme.  Real presets to copy from:
     * src/core/packs/style-presets/buttons/index.js.
     */
    'example-lozenge': {
      // Override the shape rendered by the button card
      // (maps to the 'preset' field in button config)
      height: 50,
      show_icon: true,
      card: {
        color: {
          background: {
            default:     'theme:components.button.background.default',
            active:      'theme:components.button.background.active',
            inactive:    'theme:components.button.background.inactive',
            unavailable: 'theme:components.button.background.unavailable',
            hover:       'theme:components.button.background.hover',
            pressed:     'theme:components.button.background.pressed'
          }
        }
      },
      text: {
        default: {
          font_family:    'theme:components.button.text.font_family',
          font_size:      'theme:components.button.text.font_size',
          text_transform: 'uppercase',
          color: {
            default:     'theme:components.button.text.color.active',
            inactive:    'theme:components.button.text.color.inactive',
            unavailable: 'theme:components.button.text.color.unavailable'
          }
        }
      }
    }
  },

  slider: {
    /**
     * Slider presets keep their styling under style.* (see
     * src/core/packs/style-presets/sliders/index.js).
     * Unused preset types (button, slider, …) can simply be omitted.
     */
    'example-gauge': {
      style: {
        track: {
          orientation: 'horizontal',
          height:      'theme:components.slider.track.height',
          background:  'theme:components.slider.track.background'
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
    // tokens: { colors: { ui: { primary: 'var(--lcars-orange)', … } }, components: { … } }
    // The full token tree: src/core/packs/themes/tokens/lcardsDefaultTokens.js
    // (registered by src/core/packs/builtin-themes.js).
    tokens: {}
  }
};

// ─────────────────────────────────────────────────────────────────────
// RULES
//
// Rules distributed to RulesEngine. A rule's `when` is its condition
// (entity/state, above/below, all/any/not, templates); while it matches,
// `apply.overlays` merges a config patch into every card it selects
// (by id, `tag:<name>`, `type:<card type>` or `pattern:<regex>`).
//
// User docs: doc/core/rules/ (conditions.md, changes.md)
// Engine:    doc/architecture/subsystems/rules-engine.md
// ─────────────────────────────────────────────────────────────────────
const RULES = [
  {
    id:          'example-rule',
    description: 'Turn every card tagged "example" red while the light is on',
    enabled:     true,
    // Replace light.example with a real entity
    when: { entity: 'light.example', state: 'on' },
    apply: {
      overlays: {
        'tag:example': {
          style: {
            card: { color: { background: 'var(--lcars-alert-red, var(--lcards-orange-dark))' } }
          }
        }
      }
    }
  }
];

// ─────────────────────────────────────────────────────────────────────
// AUDIO ASSETS
//
// Individual audio clips registered with AssetManager.
// Once registered, assets appear in the Config Panel "Sound" tab
// override picker for per-event assignment.
//
// URL convention (as the built-in sound packs): files in
// src/assets/sounds/<your-pack-id>/ are copied next to lcards.js and
// served at  /lcards/sounds/<your-pack-id>/<file>.mp3
//
// Access at runtime (indirect — via SoundManager):
//   window.lcards.core.soundManager.play('card_tap')
// ─────────────────────────────────────────────────────────────────────
const BASE_AUDIO_URL = '/lcards/sounds/lcards_example';

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
// Event keys (the full list with labels: SOUND_EVENT_LABELS in
// src/core/sound/SoundManager.js), for example:
//   card_tap, card_hold, card_double_tap, card_hover
//   toggle_on, toggle_off
//   slider_drag_start, slider_drag_end, slider_change
//   menu_expand, nav_page, dialog_open, dialog_close
//   alert_red, alert_yellow, alert_blue, alert_clear
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
// URL convention (as builtin-msd.js): files in src/assets/msd/ are
// served at  /lcards/msd/<file>.svg
// ─────────────────────────────────────────────────────────────────────
const BASE_SVG_URL = '/lcards/msd';

const SVG_ASSETS = {
  'example-bg': {
    url:      `${BASE_SVG_URL}/example-background.svg`,
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
// `url` is a CSS file holding the @font-face rule(s), not the font file:
// AssetManager.loadFont() adds it to the page as a <link rel="stylesheet">.
// The CSS then points at the font file. Name the font-family after the
// asset key, and start the key with lcards_: a card loads a font on demand
// when its font_family names an lcards_* key. ExampleFont.css:
//   @font-face {
//     font-family: 'lcards_example_font';
//     src: url('ExampleFont.woff2') format('woff2');
//   }
// It can be a local path (files in src/assets/fonts/ are served at
// /lcards/fonts/, as core-fonts-pack.js), or an external stylesheet URL
// such as Google Fonts (set external: true).
// ─────────────────────────────────────────────────────────────────────
const FONT_ASSETS = {
  'lcards_example_font': {
    url:         '/lcards/fonts/ExampleFont.css',
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
  description: 'Full-feature example pack: template for third-party pack authors',

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
