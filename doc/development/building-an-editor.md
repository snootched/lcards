# Building a Card Editor

LCARdS ships a visual editor for every built-in card. This guide shows how to add one to your own card.

## Overview

All editors extend `LCARdSBaseEditor`, which provides:

- Tab system (`ha-tab-group` / `ha-tab-panel`)
- Declarative config-form renderer
- Free utility tabs: YAML, Developer, Data Sources, Templates, Rules, Theme Browser, Provenance
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

customElements.define('lcards-mycard-editor', LCARdSMyCardEditor);
```

## 2. Link the Editor from the Card

In `src/cards/lcards-mycard.js`, add a static method:

```javascript
static getConfigElement() {
  return document.createElement('lcards-mycard-editor');
}
```

HA calls `getConfigElement()` when opening the visual editor panel. The returned element must already be registered as a custom element — importing the editor file at the top of the card file is one way to guarantee that.

```javascript
// src/cards/lcards-mycard.js
import '../editor/cards/lcards-mycard-editor.js';  // side-effect import — registers the element
```

Or, if preferred, import both from `src/lcards.js` instead.

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

## 5. Utility Tabs

`this._getUtilityTabs()` returns a pre-built array of tabs. Spread it at the end of your `_getTabDefinitions()` return value:

```javascript
_getTabDefinitions() {
  return [
    { label: 'Config', content: () => ... },
    ...this._getUtilityTabs(),   // YAML, Developer, Data Sources, Templates, Rules, Theme Browser, Provenance
  ];
}
```

You get these tabs for free — no additional code required.

## 6. Register in `src/lcards.js`

Import the editor file so it is included in the bundle (the `customElements.define` call inside the editor file does the registration):

```javascript
// src/lcards.js
import './editor/cards/lcards-mycard-editor.js';
```

If the editor is already imported from the card file via a side-effect import (step 2), no additional import in `lcards.js` is needed.

## Related

- [Building a Custom Card](custom-card.md)
- [Building a Pack](building-a-pack.md)
