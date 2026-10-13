# Building a Card Editor

LCARdS ships a visual editor for every built-in card. This guide shows how to add one to your own card.

## Overview

All editors extend `LCARdSBaseEditor`, which provides:

- Tab system (`ha-tab-group` / `ha-tab-panel`)
- Declarative config-form renderer
- Free utility tabs: YAML, plus a single "🖖 Main Engineering" (Developer) tab with Data Sources / Rules / Theme / Provenance / Templates as sub-tabs
- Config change dispatch (`config-changed` event)
- Built-in YAML validation against registered schemas

## 1. Create the Editor File

Create `src/editor/cards/lcards-mycard-editor.js`:

```javascript
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { html }             from 'lit';

export class LCARdSMyCardEditor extends LCARdSBaseEditor {

  constructor() {
    super();
    // Must match the type suffix used in customElements.define for the card.
    // e.g. 'lcards-mycard' → cardType = 'mycard'
    this.cardType = 'mycard';
  }

  // ── Tab definitions ────────────────────────────────────────────────────

  /**
   * Return an array of tab definitions.
   * Each entry: { label: string, content: () => TemplateResult }
   * Spread ...this._getUtilityTabs() at the end for free YAML/debug tabs.
   */
  _getTabDefinitions() {
    return [
      { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) },
      { label: 'Style',  content: () => this._renderStyleTab()  },
      ...this._getUtilityTabs(),
    ];
  }

  // ── Config tab ─────────────────────────────────────────────────────────

  _getConfigTabConfig() {
    return this._buildConfigTab({
      modeSections: [
        {
          type:   'section',
          header: 'Entity',
          children: [
            {
              type:  'custom',
              render: () => html`
                <ha-selector
                  label="Entity"
                  .hass=${this.hass}
                  .selector=${{ entity: {} }}
                  .value=${this._config?.entity || ''}
                  @value-changed=${(e) => this._updateConfig({ entity: e.detail.value }, 'entity-selector')}
                ></ha-selector>
              `,
            },
            {
              type:  'custom',
              render: () => html`
                <ha-selector
                  label="Name"
                  .hass=${this.hass}
                  .selector=${{ text: {} }}
                  .value=${this._config?.name || ''}
                  @value-changed=${(e) => this._updateConfig({ name: e.detail.value }, 'name-field')}
                ></ha-selector>
              `,
            },
          ],
        },
        {
          type:   'section',
          header: 'Display',
          children: [
            {
              type:  'custom',
              render: () => html`
                <ha-selector
                  label="Height"
                  .hass=${this.hass}
                  .selector=${{ number: { min: 20, max: 200, mode: 'box', unit_of_measurement: 'px' } }}
                  .value=${this._config?.height ?? 56}
                  @value-changed=${(e) => this._updateConfig({ height: e.detail.value }, 'height-field')}
                ></ha-selector>
              `,
            },
          ],
        },
      ],
    });
  }

  // ── Optional: custom Style tab ─────────────────────────────────────────

  _renderStyleTab() {
    return html`
      <div style="padding: 16px;">
        <!-- custom style fields go here -->
      </div>
    `;
  }
}

// Unlike cards (registered centrally in src/lcards-main.js), editors self-register
// in their own file, guarded the same way:
if (!customElements.get('lcards-mycard-editor')) {
  customElements.define('lcards-mycard-editor', LCARdSMyCardEditor);
}
```

## 2. Link the Editor from the Card

In `src/cards/lcards-mycard.js`, add an async static method that loads the editor on demand:

```javascript
static async getConfigElement() {
  await import('../editor/cards/lcards-mycard-editor.js');
  return document.createElement('lcards-mycard-editor');
}
```

HA awaits `getConfigElement()` when it opens the visual editor. The dynamic `import()` loads the editor module (which registers its element) only at that moment, so editor code stays out of the bundle every dashboard loads. Do not import the editor at the top of the card file: a static import puts the whole editor back into the main chunk.

## 3. `_buildConfigTab` Reference

`_buildConfigTab({ modeSections })` generates the rendered config tab from a declarative description.

Each entry in `modeSections` is one of:

| `type` | Description |
|--------|-------------|
| `section` | A collapsible form group with a `header` string and `children` array |
| `custom` | Raw Lit template via `render: () => html\`...\`` |

### Common `ha-selector` types

| Selector | Usage |
|----------|-------|
| `{ entity: {} }` | Entity picker |
| `{ entity: { domain: 'light' } }` | Domain-filtered entity picker |
| `{ text: {} }` | Free text input |
| `{ number: { min, max, unit_of_measurement } }` | Number spinner |
| `{ select: { options: ['a','b','c'] } }` | Dropdown |
| `{ boolean: {} }` | Toggle switch |
| `{ color_rgb: {} }` | Color picker |
| `{ icon: {} }` | MDI icon picker |

## 4. Updating Config

Call `this._updateConfig(partialConfig, source)` to merge a partial update and fire the `config-changed` event:

```javascript
@value-changed=${(e) => this._updateConfig({ entity: e.detail.value }, 'entity-selector')}
```

The second argument (`source`) is a debug label stored in provenance tracking. Use a short descriptive string.

For nested paths, spread manually:

```javascript
this._updateConfig({
  style: {
    ...this._config?.style,
    background: e.detail.value,
  }
}, 'background-color');
```

## 5. Bundle Inclusion

Every built-in editor is reached only through its card's `getConfigElement()` dynamic import (step 2), so Vite emits it as a separate lazy chunk (`chunks/lcards-<card>-editor-<hash>.js`) that loads the first time the editor opens. The editor's own guarded `customElements.define()` call registers it. No further wiring is needed.

`tests/browser/bundle.spec.js` checks this: every card's `getConfigElement()` must define its editor, rendering cards must load no editor chunk, and the main chunk must stay under its size ceiling.

## Related

- [Building a Custom Card](custom-card.md)
- [Building a Pack](building-a-pack.md)
