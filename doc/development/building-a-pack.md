# Building a Pack

A pack is a self-contained bundle of themed assets that a third party (or you) can distribute to extend LCARdS. A single pack can contribute any combination of style presets, components, themes, rules, audio, SVG images, and fonts — or just one of those things.

::: tip Canonical template
`src/core/packs/example/lcards-example-pack.js` is the authoritative, fully-commented template. This guide summarises the key concepts; refer to that file for the complete field reference.
:::

## Pack Object Structure

A pack is a plain JavaScript object:

```javascript
export const MY_PACK = {
  // Required identity fields
  id:          'my_pack_id',   // snake_case, globally unique
  name:        'My Pack',
  version:     '1.0.0',
  description: 'One-line description',

  // Optional data sections (omit any you don't need)
  style_presets: { … },
  components:    { … },
  themes:        { … },
  rules:         [ … ],
  audio_assets:  { … },
  sound_schemes: { … },
  svg_assets:    { … },
  font_assets:   { … },
};
```

`PackManager.registerPack(MY_PACK)` routes each key to the appropriate singleton automatically.

## Data Sections

### `style_presets`

Named style bundles routed to `StylePresetManager`. Keys are overlay types (`button`, `slider`, …):

```javascript
style_presets: {
  button: {
    'my-lozenge': {
      card: {
        color: {
          background: {
            active:      '{theme:palette.primary}',
            inactive:    '{theme:palette.inactive}',
            unavailable: '{theme:palette.unavailable}',
          }
        }
      },
      text: {
        default: {
          font_size:      '{theme:components.button.text.font_size}',
          text_transform: 'uppercase',
        }
      }
    }
  },
  slider: { /* slider presets */ }
}
```

Use `{theme:token.path}` tokens wherever possible — they resolve at render time so presets work across all themes.

### `components`

Structural component definitions routed to `ComponentManager`. Each component can carry SVG content, layout metadata, named presets, and animations:

```javascript
components: {
  'my-widget': {
    metadata: { type: 'my_type', name: 'My Widget', version: '1.0.0' },
    svg:      `<rect x="0" y="0" width="100%" height="100%" rx="8"/>`,
    presets:  { default: { segments: {} }, active: { segments: {} } },
    segments: { /* named targets within the SVG */ }
  }
}
```

`metadata.type` is required — it drives `getComponentsByType('my_type')` queries.

### `themes`

Full theme token trees routed to `ThemeManager`:

```javascript
themes: {
  'my-theme': {
    id:     'my-theme',
    name:   'My Theme',
    tokens: {
      palette: { primary: '#FF9C00', inactive: '#6688AA', … },
      components: { button: { … } }
    }
  }
}
```

See the built-in themes in `src/core/packs/themes/builtin-themes.js` for the full token schema.

### `rules`

Conditional style patches routed to `RulesEngine`. Rules fire when their conditions match and apply patches to registered overlays:

```javascript
rules: [
  {
    id:         'my-rule',
    enabled:    true,
    conditions: [
      { type: 'tag',   value: 'my-tag' },
      { type: 'state', entity: '{config.entity}', operator: '==', value: 'on' }
    ],
    patches: [
      {
        target: { tag: 'my-tag' },
        style:  { card: { color: { background: { active: '#CC0000' } } } }
      }
    ]
  }
]
```

### `audio_assets`

Individual audio files routed to `AssetManager` and exposed in the Config Panel sound picker:

```javascript
const BASE = '/hacsfiles/my-pack/sounds';

audio_assets: {
  my_beep: {
    url:         `${BASE}/beep.mp3`,
    description: 'My custom beep',
  }
}
```

### `sound_schemes`

Named schemes that map SoundManager event keys to asset keys. Selecting a scheme applies all its mappings at once:

```javascript
sound_schemes: {
  'my-scheme': {
    card_tap:    'my_beep',   // play my_beep on tap
    alert_red:   'my_beep',
    alert_clear: null,        // silence this event
    // omit events you want to inherit from the system default
  }
}
```

Supported event keys: `card_tap`, `card_hold`, `card_double_tap`, `card_hover`, `toggle_on`, `toggle_off`, `slider_grab`, `slider_release`, `slider_change`, `nav_forward`, `nav_back`, `alert_red`, `alert_yellow`, `alert_clear`.

### `svg_assets` / `font_assets`

SVG images and web fonts routed to `AssetManager`:

```javascript
svg_assets: {
  'my-bg': {
    url:      '/hacsfiles/my-pack/svg/background.svg',
    metadata: { name: 'My Background', category: 'backgrounds', tags: ['lcars'] }
  }
},
font_assets: {
  'my-font': {
    url:         '/hacsfiles/my-pack/fonts/MyFont.woff2',
    displayName: 'My Font',
    category:    'display',
  }
}
```

## Registering the Pack

### Built-in packs (included in the LCARdS bundle)

Add to `src/core/packs/loadBuiltinPacks.js`:

```javascript
import { MY_PACK } from './my-pack/lcards-my-pack.js';

export const BUILTIN_REGISTRY = {
  // …existing entries…
  my_pack_id: MY_PACK,
};

// Optional: always load without user opt-in
export const alwaysLoad = [
  // …existing entries…
  'my_pack_id',
];
```

### External / third-party packs

Call `PackManager.registerPack()` after the LCARdS core has initialized. The `lcards-init-complete` event signals readiness:

```javascript
import { MY_PACK } from './lcards-my-pack.js';

window.addEventListener('lcards-init-complete', () => {
  window.lcards.core.packManager.registerPack(MY_PACK);
}, { once: true });
```

If the core is already initialized when your script loads, the event has already fired. Guard for both cases:

```javascript
function registerMyPack() {
  window.lcards.core.packManager.registerPack(MY_PACK);
}

if (window.lcards?.core?.packManager) {
  registerMyPack();
} else {
  window.addEventListener('lcards-init-complete', registerMyPack, { once: true });
}
```

## Verifying Registration

After build and browser refresh, inspect pack state from the HA developer console:

```javascript
// List all loaded packs
window.lcards.core.packManager.getLoadedPacks()

// Check style presets from your pack
window.lcards.core.stylePresetManager.getAvailablePresets('button')

// Check a specific component
window.lcards.core.componentManager.getComponent('my-widget')
```

The **Pack Explorer** tab in any LCARdS card editor also shows a live tree of all registered packs, components, presets, themes, and assets.

## Related

- [Building a Custom Card](custom-card.md)
- [Building an Editor](building-an-editor.md)
- Pack System deep-dive: [Architecture → Pack System](../architecture/subsystems/pack-system.md)
