---
applyTo: src/editor/**
---

# LCARdS Editor Development Rules

These rules apply to all files under `src/editor/`. Follow them exactly — they supersede any conflicting generic guidance.

---

## Base Class

All card editors extend `LCARdSBaseEditor` (not `LitElement` directly):

```javascript
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

export class MyCardEditor extends LCARdSBaseEditor {
  constructor() {
    super();
    this.cardType = 'my-card'; // Must match card's static CARD_TYPE
  }

  _getTabDefinitions() {
    return [
      { label: 'Config',   content: () => this._renderConfig() },
      { label: 'YAML',     content: () => this._renderYamlTab() },
    ];
  }

  _renderConfig() {
    return html`
      <lcards-form-section label="Basic Settings">
        ${FormField.renderField(this, 'entity')}
        ${FormField.renderField(this, 'style.color', { label: 'Color' })}
      </lcards-form-section>
    `;
  }
}
```

---

## Field Rendering — `FormField.renderField()`

`LCARdSFormFieldHelper.renderField(editor, path, options?)` is the **canonical** way to render form fields. Do **not** render raw `<input>`, `<select>`, or bare `ha-selector` elements.

There is **no `type` option**. `renderField()` looks up the field's JSON Schema via `editor._getSchemaForPath(path)` and auto-generates the `ha-selector` config from the schema's type (`number`/`string`/`boolean`/etc.) plus any `x-ui-hints.selector` override declared on that schema node — the selector shape (number slider, select dropdown, entity picker, ...) is a property of the **schema**, not of the call site. `options` only carries per-call overrides:

```javascript
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// Basic — selector fully derived from schema + x-ui-hints
FormField.renderField(this, 'style.track.segments.gap')

// Override label/helper, mark required
FormField.renderField(this, 'entity', {
  label: 'Primary Entity',
  helper: 'Select the entity to control',
  required: true
})

// Override the selector entirely for this one call site
FormField.renderField(this, 'custom_field', {
  selectorOverride: { number: { mode: 'slider', min: 0, max: 100 } }
})
```

`options` keys: `label`, `helper`, `selectorOverride`, `disabled`, `required` — nothing else. To make a field a number slider, select dropdown, entity picker, etc. by default, declare it on the schema instead:

```javascript
// in the card's schema (e.g. src/cards/schemas/*.js)
preset: {
  type: 'string', default: 'default',
  'x-ui-hints': {
    label: 'Preset',
    selector: { select: { options: [
      { value: 'default', label: 'Default' },
      { value: 'compact', label: 'Compact' }
    ] } }
  }
}
```

---

## Approved Shared Components

Import from `src/editor/components/shared/` — never recreate these:

| Component | Import | Use |
|-----------|--------|-----|
| `lcards-form-section` | `../components/shared/lcards-form-section.js` | Section wrapper with label |
| `lcards-collapsible-section` | `../components/shared/lcards-collapsible-section.js` | Collapsible wrapper |
| `lcards-color-picker` | `../components/shared/lcards-color-picker.js` | Standalone color picker |
| `lcards-color-list` | `../components/shared/lcards-color-list.js` | List of color inputs |
| `renderLauncher` | `../components/shared/launcher.js` | Launcher card for a Main Engineering tool (black inset, counts, buttons) |
| `lcards-message` | `../components/shared/lcards-message.js` | Alert/info/warning message (short: see Dialogs, surfaces and messages) |
| `lcards-zone-list-editor` | `../components/lcards-zone-list-editor.js` (not under `shared/`) | Zone config editor |

## Dialogs, surfaces and messages

The studios (chart, data grid, layout, MSD, data source) and the config panel are the reference look. New or reworked UI follows them; older dialogs are being brought in line (see `reports/ui-consistency-*.md`).

**Dialog shell.** An editor dialog with a preview is a studio: `ha-dialog` with `header-title` and `flexcontent` (without it the dialog body doesn't stretch its content, so the inset shrinks to fit a short tab), `studioDialogStyles` (`src/editor/dialogs/studio-dialog-styles.js`), `.dialog-content` > `.studio-layout` (split grid) > `.config-panel` (`ha-tab-group` with icon tabs, then a scrolling `.tab-content`) and `.preview-panel`. Footer: Cancel (`appearance="plain"`) then Save (`variant="brand"`, `mdi:check`). YAML is the last tab (`lcards-studio-yaml-tab`, icon `mdi:code-braces`). Mount with `mountDialogNearHomeAssistant()`.

**Surfaces.** Group fields in `lcards-form-section` (the inset section card). Panel tabs use `surfaceStyles` from `src/editor/base/surface-styles.js` (the inset area `.studio-layout` / `.inset-surface` and its `.scrollable-body` / `.scroll-body`); never copy that CSS into a tab. Studio dialogs import `messageStyles` instead, because their own `.studio-layout` is the split grid.

**Messages and explainers.** One way for each kind of help (guarded by `tests/editor/editor-guards.test.js`):

| Need | Use |
|---|---|
| How something works, a reference, tips, examples | **Info guide**: `renderInfoGuide({ header, icon, body })` (`components/shared/info-guide.js`), an `lcards-form-section variant="guide"`: the section's shape, dark, primary colour on border and header, closed by default. Body classes: `.info-guide-example` (code), `.info-guide-tip`, `.info-guide-note`, `.info-guide-links`. A section that is itself an explainer (a reference diagram) takes `variant="guide"` directly. |
| One line about a section | the section's `description` |
| One line about a field | the field's `helper` / `.hint` (`messageStyles`) |
| Something to notice now (warning, error, "has no effect while...") | `lcards-message` warning or error, one or two sentences |
| A short contextual note | `lcards-message` info, at most 200 characters (the guard's limit); anything longer is an info guide |
| A status bar at the top of a panel tab | `.banner` (`messageStyles`: `info`, `warning`, `error`, `success`) |

No headings, bullet characters, emoji or inline styles inside messages; lists and examples belong in an info guide. `ha-alert` directly only in the `lcards-message` wrapper, developer errors in shared components, and the theme lab's previews of HA's alerts.

**Code.** Code or config text always goes in a code editor: `lcards-yaml-editor` / `lcards-studio-yaml-tab` for LCARdS YAML (schema completion), `ha-code-editor` for other text (`mode="yaml"` also suits JSON; `jinja2` for templates). Never `ha-textarea` or `<textarea>` for code.

**Plain dialogs.** Use `ha-dialog` with `header-title` (there is no LCARdS wrapper). Stop its `closed` event (`e.stopPropagation()`) so it doesn't close the editor around it, and act only when `e.target === e.currentTarget`: pickers inside fire their own `closed`. Footer: Cancel / Close `appearance="plain"`, then the main action `variant="brand"`.

**No native dialogs.** Never `confirm()`, `alert()` or `prompt()`. Use `showConfirmDeleteDialog`, `showInfoDialog` and `showPromptDialog` from `src/views/layout-edit-dialogs.js` (HA dialogs, mounted near `home-assistant`).

**Panel typography and labels.** The config panel host sets HA's panel typography (`font-family: var(--ha-font-family-body)`, as HA's `haStyle` does); without it LCARdS text inherits the page's hardcoded Roboto while HA controls follow the theme font (Antonio/Tungsten under HA-LCARS). Label a control with the selector's own `label` / `helper` (`ha-selector .label .helper`), never a separate label div beside a label-less control. Size text with HA's `--ha-font-size-*` steps (or `em`), never fixed `px` or `rem`, and keep HA's sizes: a theme that wants larger text sets `ha-font-size-scale`, which scales all of HA together. No raw `<button>`: `ha-button` for actions; a single-choice row (category filter, scope picker) is `renderFilterChips()` (`components/shared/filter-chips.js`): default-size `ha-button` pills, the selected one solid (brand, accent), the rest grey (neutral, filled). Deletes and resets confirm with `showConfirmDeleteDialog`, not an inline banner. Guarded for the panel tabs in `tests/editor/editor-guards.test.js`.

**HA controls, no emoji.** A choice is an `ha-selector` (`select` selector: `mode: 'dropdown'`, `'list'` or `'box'` for tiles with a description), never a raw `<select>`; a number slider is an `ha-selector` `number` selector with `mode: 'slider'`. Labels, headings, options and messages carry no emoji: use an `ha-icon` (mdi) beside the text, or nothing. The one exception is the 🖖 on the Main Engineering tab; log messages may keep theirs.

---

## Approved HA Elements

Use these HA-native elements where appropriate. Do **not** fabricate alternatives:

- `ha-expansion-panel` — collapsible sections
- `ha-tab-group` / `ha-tab-group-tab` — tab layouts (used internally by base). Note: `<ha-tab-panel>` used by `LCARdSBaseEditor` is **not** an HA element (never defined) — it's an unknown inline wrapper toggled with `?hidden`; don't style it expecting block layout.
- `ha-selector` — generic HA selector (entity, device, number, text, select, etc.)
- `ha-alert` — info/warning/error banners
- `ha-entity-picker` — entity ID autocomplete
- `ha-icon-button` — icon-only buttons (toolbar actions)

**Do NOT use `ha-textfield`** — it wraps a deprecated MDC component that renders at 0px height in newer HA versions. Use `ha-selector` with `{ text: {} }` for text inputs and `{ number: { mode: 'box' } }` for numeric inputs instead. Event: `@value-changed` / `e.detail.value`.

**Do NOT use `ha-formfield`** — it is still MWC-based (a likely future removal) and HA no longer registers it eagerly (only via the lazily-loaded boolean/select selectors). `ha-switch` and `ha-checkbox` are WebAwesome components with a clickable default-slot label — put the label text inside the control (HA's own pattern, see `ha-form-boolean.ts`):

```javascript
html`<ha-switch .checked=${on} @change=${(e) => this._toggle(e.target.checked)}>Invert Fill</ha-switch>`
```

**`ha-icon-button`** (WebAwesome): pass an `.path` (mdi/js SVG path) **or** an `<ha-icon icon="mdi:…">` child — it has **no `icon` property** (`icon="mdi:x"` renders an empty button). Always set `.label`. Size via `--ha-icon-button-size`; icon colour via `color:` (the icon uses `currentColor`) — `--md-icon-button-*` / `--mdc-icon-button-size` are dead. Never use `<mwc-icon-button>` (unregistered since HA 2026.3).

**Chips** (`ha-assist-chip` / `ha-filter-chip` / `ha-chip-set`, WebAwesome since HA 2026.10): still honoured — `--ha-assist-chip-filled-container-color`, `--md-assist-chip-label-text-color`, `--md-sys-color-on-surface`, `--md-filter-chip-selected-container-color`. Sizing hooks are `--ha-button-height` (chip height) and `--ha-chip-label-size`; `--md-filter-chip-*-space`, `--md-sys-color-primary` and `--ha-assist-chip-container-height` do nothing. `ha-filter-chip` toggles its own `selected` on click — for radio-style groups call `e.preventDefault()` on the click when the chip is already active, or it shows deselected.

`npm run build` runs `scripts/validate-ha-compat.js`, which fails on these known-dead elements, attributes and CSS hooks.

---

## CSS & Theming Conventions

LCARdS requires HA 2026.10+. Use HA CSS variables — no fallbacks needed unless noted.

### Box shadows — always use HA vars

| Shadow weight | Variable | Use |
|---|---|---|
| Small — hover states, tight cards | `var(--ha-box-shadow-s)` | `0 1px 2px … 0 1px 3px …` |
| Medium — floating panels, overlays | `var(--ha-box-shadow-m)` | `0 3px 6px … 0 8px 16px …` |
| Large — dialogs, full-screen overlays | `var(--ha-box-shadow-l)` | `0 6px 12px … 0 16px 32px …` |

❌ `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` — use `var(--ha-box-shadow-s)`  
✅ Decorative glow/colored shadows and `:focus` rings are intentional — leave those alone

### Border radius — always use HA vars

| Value | Variable | Notes |
|---|---|---|
| 4px | `var(--ha-border-radius-sm)` | Tags, badges, code inline |
| 8px | `var(--ha-border-radius-md)` | Toolbars, containers |
| 12px | `var(--ha-border-radius-lg)` | Same as `--ha-card-border-radius` |
| 16px | `var(--ha-border-radius-xl)` | |
| 20px | `var(--ha-border-radius-2xl)` | |
| 24px | `var(--ha-border-radius-3xl)` | Expansion panels |
| 28–36px | `--ha-border-radius-4xl` through `-6xl` | |
| pill | `var(--ha-border-radius-pill)` | 9999px |
| circle | `var(--ha-border-radius-circle)` | 50% |

No HA var for 6px, 3px, 22px — leave those hardcoded.

### Border width — always use HA vars

```css
border: var(--ha-border-width-sm) solid var(--divider-color);    /* 1px */
border: var(--ha-border-width-md) solid var(--primary-color);    /* 2px */
border: var(--ha-border-width-lg) solid var(--error-color);      /* 3px */
```

❌ `border: 1px solid …` — use `var(--ha-border-width-sm) solid …`  
❌ `border: 2px solid …` — use `var(--ha-border-width-md) solid …`

### Spacing — always use HA vars

`--ha-space-N` where the value = N×4px:

| px | Variable | px | Variable |
|---|---|---|---|
| 4px | `var(--ha-space-1)` | 24px | `var(--ha-space-6)` |
| 8px | `var(--ha-space-2)` | 28px | `var(--ha-space-7)` |
| 12px | `var(--ha-space-3)` | 32px | `var(--ha-space-8)` |
| 16px | `var(--ha-space-4)` | 40px | `var(--ha-space-10)` |
| 20px | `var(--ha-space-5)` | 48px | `var(--ha-space-12)` |

No HA var for 2px, 6px, 10px, 14px — leave those hardcoded. For shorthands mixing var and non-var values (e.g. `padding: 2px 8px`), use separate properties or leave as-is.

### Animation duration — always use HA vars (prefers-reduced-motion aware)

All `--ha-animation-duration-*` vars collapse to 1ms automatically when `prefers-reduced-motion: reduce` is set.

```css
transition: all var(--ha-animation-duration-fast);           /* 150ms = 0.15s — exact match */
transition: all var(--ha-animation-duration-normal, 0.2s);   /* 250ms ≈ 0.2s — include fallback */
transition: all var(--ha-animation-duration-slow, 0.3s);     /* 350ms ≈ 0.3s — include fallback */
```

❌ `transition: all 0.15s` — use `var(--ha-animation-duration-fast)`  
❌ `transition: all 0.2s` — use `var(--ha-animation-duration-normal, 0.2s)`

### Semi-transparent backgrounds — always `color-mix`

**Inside dialogs/cards** (works with HA-LCARS where `card-background-color = secondary-background-color`):
```css
/* Default state */
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 30%,
    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
);

/* Focused/active state */
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 45%,
    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
);
```

**Page-level backgrounds** (outside cards, where secondary ≠ card background):
```css
background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
```

**Light/white overlay tints** (inline code highlights, subtle overlays):
```css
background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
```

**Error/danger zone backgrounds:**
```css
border-top: 1px solid color-mix(in srgb, var(--error-color) 40%, transparent);
background: color-mix(in srgb, var(--error-color) 5%, transparent);
```

❌ `rgba(60, 60, 60, 0.5)` — hardcoded dark, breaks HA-LCARS light themes  
❌ `rgba(255, 255, 255, 0.1)` — hardcoded light, use `color-mix` with `--primary-text-color`  
❌ `color-mix(in srgb, var(--secondary-background-color) 50%, transparent)` alone inside cards — in HA-LCARS `card-background-color = secondary-background-color`, resulting in zero contrast; always anchor with `--primary-background-color` too

### ha-button variants — use semantic variants, never CSS overrides

```html
<!-- Destructive: delete, remove, reset, clear -->
<ha-button variant="danger">Delete</ha-button>

<!-- Cautionary: reset to defaults, irreversible but non-destructive -->
<ha-button variant="warning">Reset</ha-button>

<!-- Primary/confirm: save, apply -->
<ha-button variant="brand">Apply</ha-button>
```

❌ `style="--mdc-theme-primary: var(--error-color)"` — dead MDC var in HA 2026.6  
❌ `appearance="accent"` without `variant` — dead MDC pattern

### ha-input and ha-textarea (HA 2026.6+)

```html
<ha-input label="Value" .value=${x} @input=${e => this._x = e.target.value}></ha-input>

<!-- Auto-resizing textarea -->
<ha-textarea label="Template" .value=${x} resize="auto" rows="3"
    @input=${e => this._x = e.target.value}></ha-textarea>
```

❌ `ha-textfield` — deprecated MDC component, renders at 0px height in HA 2026.6

### Helper/hint text — never `helper-text`

`helper-text` is the deprecated MDC/`ha-textfield` attribute name. It doesn't exist on either current component, so it's silently ignored — no error, no rendered text. Confirmed via the vendored `frontend` checkout:

```html
<!-- ha-input / ha-textarea: hint, not helper-text -->
<ha-input label="Value" hint="Shown below the field" .value=${x} @input=${e => this._x = e.target.value}></ha-input>

<!-- ha-selector: helper, not helper-text -->
<ha-selector .hass=${this.hass} .selector=${{ number: { mode: 'box' } }} .value=${x} .label=${'Value'}
    helper="Shown below the field" @value-changed=${e => this._x = e.detail.value}></ha-selector>
```

❌ `helper-text="..."` on either element — a whole editor dialog (`lcards-msd-studio-dialog.js`) shipped 51 instances of this before it was caught; none of that helper text was ever rendering. `lcards-filter-editor.js` and `lcards-processor-editor.js` had the same bug (4 sites total) — also fixed. If you find more, they get the same treatment: `hint` on `ha-input`/`ha-textarea`, `helper` on `ha-selector`.

### ha-spinner (HA 2026.7+)

```html
<ha-spinner size="small"></ha-spinner>
```

`size`: `tiny` | `small` | `medium` | `large` (no `indeterminate`/`active` attribute — spinners are indeterminate-only).

❌ `ha-circular-progress` — removed from HA's frontend entirely as of this version; confirmed via the vendored `frontend` checkout (zero references anywhere) and empirically in a real browser: it renders as an unregistered custom element with `0×0` layout, not a visible error, so it fails silently. Was itself the replacement documented here for an earlier `size="small"`-broken `ha-circular-progress` — that guidance is now doubly stale. If you see `ha-circular-progress` anywhere, it's a leftover from before this rename; replace it.

---

## Required Styles

Every editor **must** include `editorStyles` in `static get styles()`:

```javascript
import { editorStyles } from '../base/editor-styles.js';

static get styles() {
  return [
    editorStyles,
    css`
      /* card-specific additions only */
    `
  ];
}
```

`editorStyles` provides: `.editor-container`, `.form-row`, `.form-row.two-controls`, `.form-control`, `.helper-text`, `.error-message`, `.warning-message`, `.section`, `.section-header`. Use these classes — do not redefine them.

---

## Committing Config Changes

Always use `this._updateConfig(partial)` — it deep-merges, validates, syncs the YAML tab, and fires `config-changed` to HA with debounce:

```javascript
_handleColorChange(ev) {
  this._updateConfig({ style: { color: ev.detail.value } });
}
```

❌ **Never** assign `this.config` directly or dispatch `config-changed` manually:

```javascript
// WRONG — bypasses YAML sync and validation
this.config = { ...this.config, color: ev.detail.value };
fireEvent(this, 'config-changed', { config: this.config });
```

---

## Firing HA Events

Always use `fireEvent` from `custom-card-helpers`. Never use `dispatchEvent(new CustomEvent(...))` for HA-facing events:

```javascript
import { fireEvent } from 'custom-card-helpers';
fireEvent(this, 'hass-more-info', { entityId: this.config.entity });
```

---

## Anti-Patterns

❌ Don't render bare `<input>`, `<select>`, or `<textarea>` — use `FormField.renderField()`
❌ Don't skip `editorStyles` — inconsistent styling results
❌ Don't call `fireEvent(this, 'config-changed', ...)` directly — use `_updateConfig()`
❌ Don't hand-roll field lists that duplicate `FormField.renderField()`'s schema-driven rendering. Note: `_getConfigTabConfig()` itself is still alive as a documented extension point in `LCARdSBaseEditor` (built on `_buildConfigTab()`/`modeSections`, used by `lcards-slider-editor.js`, `lcards-button-editor.js`, `lcards-elbow-editor.js`) — it's not removed, but its returned field specs should still be rendered via `FormField.renderField()`, not raw elements
❌ Don't import `LitElement` directly in editor files — extend `LCARdSBaseEditor` instead
