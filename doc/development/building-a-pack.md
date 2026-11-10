# Building a Pack

A pack is a plain JavaScript object that bundles content for the LCARdS registries: style presets, components, themes, rules, sounds and sound schemes, SVG backgrounds, fonts, images and 3D models. `PackManager.registerPack(pack)` hands each key to the manager that owns it. This guide is the how-to for adding one; the registration flow, the built-in pack inventory and the console API are in [Pack System](../architecture/subsystems/pack-system.md).

::: info Packs are built in, for now
Every pack ships inside the LCARdS bundle and is loaded at startup by `PackManager.loadBuiltinPacks()` (`src/core/PackManager.js`), the only place packs are loaded. There is no way yet to install a pack from outside the bundle: no pack folder, no setting, no loader. `window.lcards.core.packManager.registerPack()` is reachable from the console, but it is not a supported extension point: cards that have already processed their config don't pick up new presets, and the config checker, the published schemas and the docs only know the built-in names. To add content, add a pack to this repository.
:::

## The template

`src/core/packs/example/lcards-example-pack.js` is a commented template with every key. Its rule and preset tokens are checked by `tests/core/example-pack.test.js` (the rule compiles to a real condition and matches; every `theme:` token exists), so it stays a working starting point. It is not registered, so it never loads.

When you copy it, put the pack file at the `src/core/packs/` root, next to the others (the template sits in `example/` only so it never loads), and register it as in [Register it](#register-it): a pack in neither `alwaysLoad` nor `CORE_REQUESTED_PACK_IDS` never loads. Its asset URLs follow the built-in packs (`/lcards/sounds/...`, `/lcards/msd/...`, `/lcards/fonts/...`); the files themselves go under `src/assets/` (see [Assets](#assets)).

## Pack shape

```javascript
// src/core/packs/lcards-my-pack.js
export const MY_PACK = {
    // Identity: id is required (snake_case); a pack without one is skipped with a warning
    id:          'my_pack',
    name:        'My Pack',                 // shown in the Pack Explorer
    version:     __LCARDS_VERSION__,        // built-in packs use the LCARdS version
    description: 'What this pack adds',

    // Content: every key is optional
    style_presets: { /* StylePresetManager */ },
    components:    { /* ComponentManager */ },
    themes:        { /* ThemeManager */ },
    rules:         [ /* RulesEngine */ ],
    svg_assets:    { /* AssetManager */ },
    font_assets:   { /* AssetManager */ },
    image_assets:  { /* AssetManager */ },
    model_assets:  { /* AssetManager */ },
    audio_assets:  { /* AssetManager */ },
    sound_schemes: { /* SoundManager */ },
};
```

`registerPack()` (`src/core/PackManager.js`) reads these keys and nothing else, in this order: `themes`, `style_presets`, `rules`, the five asset keys, `sound_schemes`, `components`. The retired keys `overlays`, `anchors`, `routing`, `palettes` and `profiles` log a warning and are ignored. Packs carry no animation presets: the built-in ones are registered by `registerBuiltinAnimationPresets()` (`src/core/packs/animations/`), outside the pack format.

Big content lives in its own module and the pack file imports it, as `lcards-buttons-pack.js` does with `style-presets/buttons/index.js`.

## Register it

In `src/core/packs/loadBuiltinPacks.js`:

```javascript
import { MY_PACK } from './lcards-my-pack.js';

const BUILTIN_REGISTRY = {
    // ...existing entries
    my_pack: MY_PACK,
};
```

Then add `'my_pack'` to the `alwaysLoad` list inside `loadBuiltinPacks()` (most packs: themes, sounds, backgrounds, images) or to `CORE_REQUESTED_PACK_IDS` (the packs the core asks for: `core`, `lcards_buttons`, `lcards_sliders`, `builtin_themes`). A pack in neither list is never loaded. `BUILTIN_REGISTRY` and `alwaysLoad` are module-local; only `BUILTIN_PACK_IDS`, `CORE_REQUESTED_PACK_IDS` and `loadBuiltinPacks()` are exported. An unknown id in either list logs a warning.

## Style presets

**A preset is a partial card config that a card's `preset:` key merges under the user's config.** Keys of `style_presets` are card types (`button`, `slider`); each holds `{ presetName: preset }`.

```javascript
style_presets: {
    button: {
        'my-lozenge': {
            extends: 'button.lozenge',
            card: {
                color: {
                    background: {
                        active:   'theme:colors.card.buttonOn',
                        inactive: 'theme:colors.card.buttonOff'
                    }
                }
            },
            text: {
                default: { text_transform: 'uppercase' }
            }
        }
    }
}
```

- **Same schema as the card.** A preset has the structure of the card config it applies to, plus three registry-only keys that are stripped before the merge: `extends`, `description` and `compatibleComponents`.
- **`extends: '<type>.<name>'`** names a parent. The parent's own chain is resolved first and the child is deep-merged over it; a circular chain logs a warning. A preset named `base` exists only to be extended and is left out of the preset lists (the built-in `button.base`).
- **Theme tokens, not colours.** Values that come from the theme are `theme:` tokens with a path from the token tree (`src/core/packs/themes/tokens/lcardsDefaultTokens.js`): `'theme:colors.card.buttonOn'`, `'theme:components.button.text.font_size'`. No braces (`{theme:...}` is the text template form) and no literal hex colours, so the preset follows the active theme and alert modes. The token namespaces are listed in [Theme System: Theme Tokens](../architecture/subsystems/theme-system.md#theme-tokens).
- **Copy from the real ones**: `src/core/packs/style-presets/buttons/index.js` and `sliders/index.js`. Slider presets keep their styling under `style.*`.

The built-in option lists the schemas publish (`BUILTIN_OPTIONS` in `scripts/lib/card-schemas.js`) read the button and slider preset modules directly, and `tests/docs/schema-registry.test.js` checks them against what `StylePresetManager` holds after loading the built-in packs. So a new button or slider preset belongs in `style-presets/buttons/index.js` or `style-presets/sliders/index.js`; a preset added elsewhere fails that test. `tests/core/presets-doc.test.js` then wants it in the tables of `doc/core/presets.md`.

Details: [Style Preset Manager: Preset Shape](../architecture/subsystems/style-preset-manager.md#preset-shape).

## Components

**A component is a named structural piece a card draws: an SVG shell with segments for the button, a renderer for the slider, a path generator for the elbow.** Every definition needs `metadata.type`, the group `getComponentsByType()` returns it in.

```javascript
components: {
    'my-widget': {
        svg: '<svg viewBox="0 0 100 40"><rect id="body" width="100" height="40" rx="8"/></svg>',
        segments: {
            body: { style: { fill: 'theme:components.button.background.active' } }
        },
        presets: { default: {} },
        metadata: { type: 'my_widget', card_type: 'button', name: 'My Widget', version: '1.0.0' }
    }
}
```

The shape depends on the card that renders it (button, slider and elbow components differ); see [Component Manager: Component Definition Shapes](../architecture/subsystems/component-manager.md#component-definition-shapes). The built-in components are collected in `src/core/packs/components/index.js`, which the config checker's registries read (`scripts/lib/registries.js`); a component added elsewhere is unknown to `npm run validate:config`.

## Themes

```javascript
themes: {
    'my-theme': {
        id: 'my-theme',
        name: 'My Theme',
        description: 'What it changes',
        tokens: { colors: { ui: { primary: 'var(--lcars-orange)' } }, components: { /* ... */ } }
    }
}
```

`ThemeManager.registerThemesFromPack()` stores each theme with the pack id. `tokens` is the whole token tree: start from a copy of `lcardsDefaultTokens` and change values, because a missing path resolves to its fallback. Note that the core always activates `lcards-default` and nothing selects another theme today; a pack theme can be tried from the console with `window.lcards.core.themeManager.activateTheme('my-theme')`. Users change colours with theme overrides (the Theme Studio), not with a new theme. See [Theme System](../architecture/subsystems/theme-system.md).

## Rules

Pack rules use the same grammar as the `rules:` of a card: `when` is the condition, `apply.overlays` the patch per target.

```javascript
rules: [
    {
        id: 'my_pack_light_on',            // required: rules without an id are skipped
        enabled: true,
        when: { entity: 'light.example', state: 'on' },
        apply: {
            overlays: {
                'tag:my_pack': {
                    style: { card: { color: { background: 'theme:colors.alert.red' } } }
                }
            }
        }
    }
]
```

- Targets under `apply.overlays` are a card `id`, `tag:<name>`, `type:<card type>` or `pattern:<regex>`.
- `registerPack()` adds them to the shared engine (`rules`, `rulesById`), then builds the dependency index, compiles them and marks every rule dirty. A card's own rule with the same id does not replace a pack rule.
- A pack rule that names a specific entity only does something on an installation that has it, so built-in packs rarely carry rules.

The grammar is in the user docs, [Rules](../core/rules/); the engine in [Rules Engine](../architecture/subsystems/rules-engine.md).

## Assets

```javascript
svg_assets: {
    my_deck_plan: { url: '/lcards/msd/my-deck-plan.svg', metadata: { name: 'My deck plan', category: 'backgrounds' } }
},
image_assets: {
    my_nebula: { url: '/lcards/images/my-nebula.webp', label: 'My nebula', category: 'backgrounds' }
},
model_assets: {
    my_ship: { url: '/lcards/models/my-ship.glb', label: 'My ship', parts: ['saucer', 'nacelle_port'] }
},
audio_assets: {
    my_beep: { url: '/lcards/sounds/my_pack/beep.mp3', description: 'Short beep' }
},
font_assets: {
    lcards_my_font: { url: '/lcards/fonts/MyFont.css', displayName: 'My Font', category: 'display' }
}
```

- **Files.** Built-in asset files go under `src/assets/` in `fonts/`, `msd/`, `sounds/`, `images/` or `models/`. `scripts/copy-assets.js` (the last step of `npm run build`) copies them to `custom_components/lcards/`, which the integration serves at `/lcards/`.
- **URLs are written `/lcards/...` and resolved at load time.** Pack `url` values keep the `/lcards/...` form; `AssetManager` and `SoundManager` pass them through `bundleUrl()` (`src/utils/bundle-url.js`) when they fetch, link or play them, which maps `/lcards/` onto the folder the bundle was loaded from. In Home Assistant that folder is `/lcards/`, so nothing changes; on the versioned docs site (`/dev/lcards/`, `/v/<version>/lcards/`) each version loads its own files. Code that uses such a URL directly (an `<img src>`, a `fetch`) wraps it in `bundleUrl()` too (`tests/core/bundle-url.test.js` guards it).
- **Nothing is fetched at registration.** `AssetManager.preloadFromPack()` registers each entry (with the pack id) and loads it on first use. Entries without `url` are skipped, except SVG, which can be an inline string or `{ content }`.
- **References.** Images and models are referenced in card config as `builtin:<key>` (an image `source`, an astrometrics model `src`); MSD backgrounds as `builtin:<key>` in `base_svg.source`; audio assets by key in `sounds:` and sound schemes.
- **Fonts.** A font's `url` is a CSS file with the `@font-face` rule, not the `.woff2`: `loadFont()` adds it to the page as a stylesheet, and the CSS points at the font file (or use an external stylesheet such as Google Fonts with `external: true`). Write the CSS `url()`s relative to the stylesheet (`url('MyFont.woff2')`), never `/lcards/fonts/...`, so the font works wherever the bundle is served. Name the `font-family` after the key and start the key with `lcards_`: a card loads a font on demand when its `font_family` names an `lcards_*` key. `autoLoad: true` loads it at startup (only Antonio does).

```css
/* src/assets/fonts/MyFont.css, served as /lcards/fonts/MyFont.css */
@font-face {
    font-family: 'lcards_my_font';
    src: url('MyFont.woff2') format('woff2');
}
```

Every field per asset type: [Asset Manager: Pack Registration](../architecture/subsystems/asset-manager.md#pack-registration). The config checker knows the built-in MSD backgrounds, images, models and sounds from the packs it imports in `scripts/lib/registries.js` (`builtin-msd.js`, `lcards-images-pack.js` and each pack with `audio_assets`): a new pack with assets a config can name needs its import there. New 3D models follow the `lcards-models` project skill.

## Sound schemes

```javascript
sound_schemes: {
    my_scheme: {
        card_tap:    'my_beep',
        alert_red:   'my_beep',
        alert_clear: null           // silence this event
        // events left out fall through to the default
    }
}
```

A scheme maps sound events to audio asset keys; the Sound tab of the config panel picks the active scheme. The events (`EVENT_CATEGORY` in `src/core/sound/SoundManager.js`):

| Group | Events |
|---|---|
| Cards | `card_tap`, `card_hold`, `card_double_tap`, `card_hover`, `toggle_on`, `toggle_off`, `slider_drag_start`, `slider_drag_end`, `slider_change`, `more_info_open` |
| Interface | `menu_expand`, `nav_page`, `dialog_open`, `dialog_close`, `dashboard_edit_start`, `dashboard_edit_save` |
| Alerts and system | `alert_red`, `alert_yellow`, `alert_blue`, `alert_gray`, `alert_black`, `alert_clear`, `system_ready`, `error`, `notification`, `borg_assimilate`, `borg_deassimilate` |

See [Sound System](../architecture/subsystems/sound-system.md).

## Check it

After `npm run build` and a hard refresh (Ctrl+Shift+R), in the browser console:

```javascript
window.lcards.core.packManager.getLoadedPackIds()            // your id is in the list
window.lcards.core.stylePresetManager.getAvailablePresets('button')
window.lcards.core.componentManager.getComponent('my-widget')
window.lcards.core.assetManager.getRegistry('image')         // registered images
window.lcards.debug.singleton('packManager')                 // PackManager.getDebugInfo()
```

The **Pack Explorer** tab of the LCARdS config panel shows every registered pack with its presets, components, themes and assets; a card editor opens it from the Theme launcher's Pack Explorer button.

Then:

- Run `npm test`: `schema-registry`, `presets-doc` and `packs` cover the built-in packs, and a name a config can use should get a case in `tests/docs/config-validator.test.js`.
- Check a config that uses the new content: `npm run validate:config -- my-test.yaml`.
- Document user-visible content where users look for it (`doc/core/presets.md`, the MSD backgrounds page, the sounds page), with a live example.

## Related

- [Pack System](../architecture/subsystems/pack-system.md): registration flow, inventory, console access
- [Building a Custom Card](custom-card.md)
- [Building a Studio Editor](building-an-editor.md)
- [Adding a Card Option](adding-a-card-option.md)
- [Assets and SVG API](assets-api.md)
