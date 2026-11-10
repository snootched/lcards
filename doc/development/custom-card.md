# Building a Custom Card

This guide walks through adding a new card to LCARdS: the class, the schema, the registration in `src/lcards-main.js`, the editor hook-up, the build and the checks that guard each step. It is the how-to; the base classes themselves (every hook, the HASS flow, rules, preview mode, cleanup) are described in [Card Foundation](../architecture/cards/lcards-card-foundation.md), and the rules card code must follow are in `.github/instructions/cards.instructions.md`.

New cards live in this repository: there is no plugin API for cards shipped outside the LCARdS bundle. Every sample below uses the real base class APIs in `src/base/LCARdSCard.js` and `src/base/LCARdSNativeCard.js`.

## Checklist

1. Create `src/cards/lcards-mycard.js` extending `LCARdSCard` ([step 1](#_1-the-card-class)).
2. Declare `static CARD_TYPE` and `static getStubConfig()`, and a lazy `static getConfigElement()`.
3. Write the schema in `src/cards/schemas/mycard-schema.js`, with a `description` on every property ([step 2](#_2-the-schema)).
4. Create the editor at `src/editor/cards/lcards-mycard-editor.js` extending `LCARdSBaseEditor`; it registers its own element ([step 3](#_3-the-editor)).
5. Register the card element, its card picker entry and its schema in `src/lcards-main.js` ([step 4](#_4-register-the-card)).
6. Add the schema to `scripts/lib/card-schemas.js` ([step 5](#_5-publish-the-schema)).
7. Run `npm run types:elements` ([step 6](#_6-element-types)).
8. Override `_getCardSize()` for pixel heights ([step 7](#_7-card-size)).
9. Write the docs page and a test, run `npm run build` and test in Home Assistant ([step 8](#_8-build-test-and-document)).

This is the same list as "Adding new cards" in `CLAUDE.md` and [Card Foundation: Adding a new card](../architecture/cards/lcards-card-foundation.md#adding-a-new-card).

## Class hierarchy

```
LitElement
  └── LCARdSNativeCard   Home Assistant card contract: setConfig, hass, getCardSize, preview detection, host size keys
        └── LCARdSCard   core singletons, config processing, entities, templates, actions, rules, cleanup
              └── LCARdSMyCard
```

Extend `LCARdSCard`. The layout card and the alert overlay extend `LitElement` directly because they use none of the foundation; a normal card needs all of it. The full tree of today's cards is in [Card Foundation: Overview](../architecture/cards/lcards-card-foundation.md#overview).

## 1. The card class

`src/cards/lcards-mycard.js`. The sample shows the card entity's state on a coloured panel, follows a second entity named in its config, runs the card's actions on tap and takes rule patches.

```javascript
import { html, css } from 'lit';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { getMyCardSchema } from './schemas/mycard-schema.js';

export class LCARdSMyCard extends LCARdSCard {

    /** CoreConfigManager's key for this card's schema and presets (no "lcards-" prefix) */
    static CARD_TYPE = 'mycard';

    /** The smallest config that renders, shown in the Home Assistant card picker */
    static getStubConfig() {
        return {
            type: 'custom:lcards-mycard',
            entity: 'light.example'
        };
    }

    /** Editors are lazy chunks: import on demand, keep them out of the main bundle */
    static async getConfigElement() {
        await import('../editor/cards/lcards-mycard-editor.js');
        return document.createElement('lcards-mycard-editor');
    }

    /** Called from src/lcards-main.js once the core has initialised */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;
        if (!configManager) {
            lcardsLog.error('[LCARdSMyCard] CoreConfigManager not available for schema registration');
            return;
        }
        configManager.registerCardSchema('mycard', getMyCardSchema(), { version: __LCARDS_VERSION__ });
    }

    static get styles() {
        return [
            super.styles,
            css`
                .my-card {
                    width: 100%;
                    height: 100%;
                    border-radius: var(--ha-border-radius-lg);
                    padding: var(--ha-space-2);
                }
            `
        ];
    }

    constructor() {
        super();
        this._cardStyle = {};
        this._secondaryState = null;
        /** @type {Array<() => void>} */
        this._extraUnsubs = [];
        /** @type {(() => void) | null} */
        this._actionCleanup = null;
        this._fullSetup = false;
    }

    // ── Lifecycle ───────────────────────────────────────────────────────

    /** Once per element, after the first render */
    _handleFirstUpdate(changedProps) {
        super._handleFirstUpdate(changedProps);

        // The card picker's gallery card never leaves the picker: skip the setup there.
        // Never skip on this._isPreviewMode: it is also true in dashboard edit mode.
        if (this._checkForAncestor(['hui-card-picker'])) return;
        this._fullSetup = true;

        this._registerOverlayForRules(
            this.config.id || `mycard-${this._cardGuid}`,  // overlay id rules target
            'mycard',                                       // type (type:mycard selectors)
            this.config.tags || []                          // tags (tag:<name> selectors)
        );
        this._resolveStyle();
        this._subscribeExtraEntities();

        // The first render was the "Loading LCARdS..." placeholder: wait for the card's DOM
        this.updateComplete.then(() => this._bindActions());
    }

    /** Every connect, including a reconnect (edit mode, view changes, moves) */
    async _onConnected() {
        super._onConnected();   // first; singletons are ready on the next line
        // A disconnect dropped every subscribeToEntity() subscription
        if (this._fullSetup) this._subscribeExtraEntities();
    }

    /** CoreConfigManager has replaced this.config with the merged config */
    _onConfigUpdated() {
        super._onConfigUpdated();
        this._resolveStyle();
        if (this._fullSetup) {
            this._subscribeExtraEntities();
            this.updateComplete.then(() => this._bindActions());
        }
    }

    /** A rule started, changed or stopped patching this card (no arguments) */
    _onRulePatchesChanged() {
        this._resolveStyle();
    }

    _onDisconnected() {
        // Card-specific teardown only; the base drops subscriptions, rules, observers
        super._onDisconnected();   // last
    }

    // ── Entities ────────────────────────────────────────────────────────

    _subscribeExtraEntities() {
        this._extraUnsubs.forEach(unsub => unsub());
        this._extraUnsubs = [];
        const id = this.config.secondary_entity;
        if (!id) return;
        // The callback is not called on subscribe: read the current state first
        this._secondaryState = this.getEntityState(id);
        this._extraUnsubs.push(this.subscribeToEntity(id, (_id, newState) => {
            this._secondaryState = newState;
            this.requestUpdate();
        }));
    }

    // ── Actions and style ───────────────────────────────────────────────

    _bindActions() {
        const el = /** @type {HTMLElement|null} */ (this.shadowRoot?.querySelector('.my-card'));
        this._actionCleanup?.();
        this._actionCleanup = el ? this.setupActions(el, {
            tap_action: this.config.tap_action,
            hold_action: this.config.hold_action,
            double_tap_action: this.config.double_tap_action
        }) : null;
    }

    _resolveStyle() {
        const style = { ...(this.config.style || {}) };
        this._cardStyle = this._getMergedStyleWithRules(style);   // rule patches last
        this.requestUpdate();                                     // always
    }

    // ── Render ──────────────────────────────────────────────────────────

    _renderCard() {
        // A colour, a theme: token or a state map; CSS stays live for alert modes
        const background = this._resolveEntityStateColor(this._cardStyle.background, 'theme:colors.ui.primary');
        return html`
            <div class="my-card" style="background: ${background}">
                <span>${this._getStateDisplay()}</span>
                ${this._secondaryState ? html`<span>${this._getStateDisplay(this._secondaryState)}</span>` : ''}
            </div>
        `;
    }
}
```

What each part relies on:

- **`CARD_TYPE`** is what `_processConfigAsync()` passes to `configManager.processConfig()` (`LCARdSCard.js`). Without it the card falls back to `config.type` and gets no schema validation and no preset merge. It is also the key of `registerCardSchema()` and the editor's `cardType`, so use the same string, without the `lcards-` prefix (the button registers `'button'`, the select menu `'select-menu'`).
- **`getStubConfig()`** includes `type` and, when the card needs one, `entity`. `getConfigElement()` is `async` and imports the editor, as every card does (`lcards-select-menu.js`, `lcards-data-grid.js`); the `size budget` test in `tests/browser/bundle.spec.js` fails if editors land in the main chunk.
- **Hooks.** `_handleFirstUpdate()` runs once per element; `_onConnected()` on every connect (call `super` first); `_onDisconnected()` calls `super` last. The full tables are in [Card Foundation: Lifecycle](../architecture/cards/lcards-card-foundation.md#lifecycle).
- **The first render is a placeholder.** `LCARdSNativeCard.render()` shows "Loading LCARdS..." until `_mountResolved`, which `firstUpdated()` sets just before it calls the hooks (`LCARdSNativeCard.js`). Query your own elements after `this.updateComplete` (the button does: `_setupButtonActions()` in `lcards-button.js`).
- **Preview mode.** `this._isPreviewMode` is also `true` on every card while the dashboard is in edit mode, and `_handleFirstUpdate()` never runs again, so a card that skipped its setup on it stays half set up after edit mode ends. Skip only in the card picker (`_checkForAncestor(['hui-card-picker'])`, as the select menu does). See [Card Foundation: Preview mode](../architecture/cards/lcards-card-foundation.md#preview-mode).

## Entities

- **Your own entity.** `this._entity` is the state object of `config.entity`, refreshed on every HASS. A change to it, or to an entity that the card's templates, rules, `on_entity_change` animations, `map_range` bindings or `triggers_update` name, re-renders the card: the base keeps those in `this._trackedEntities` (`_updateTrackedEntities()`). Render from `this._entity`; never read `this.hass.states` in `_renderCard()`.
- **Other entities: `subscribeToEntity(entityId, callback)`.** The callback gets `(entityId, newState, oldState)` when the core's systems manager sees the entity change. It is **not** called on subscribe, so read the current value with `getEntityState(entityId)` first. Subscribing also makes a change to that entity reach the core, so there is no need to add it to `_trackedEntities`. Subscriptions are dropped on disconnect, so subscribe from a method that `_onConnected()` calls again (the elbow's `_subscribeSegmentEntities()`).
- **Reacting in `_handleHassUpdate(newHass, oldHass)`.** It runs on every new HASS object, even when nothing the card uses changed. `this._entity` is already the new state there, so compare `oldHass?.states[id]` with `newHass.states[id]` (the select menu does), not with `this._entity`.
- **Display helpers.** `_getStateDisplay(entity)`, `_getEntityName(entity)`, `_getAttributeDisplay(key, entity)` format values the way Home Assistant does; never call `hass.format*()` directly.

Details: [Card Foundation: Entity access](../architecture/cards/lcards-card-foundation.md#entity-access) and [HASS flow](../architecture/cards/lcards-card-foundation.md#hass-flow).

## Actions and services

- **`setupActions(element, actions, options)`** wires tap, hold, double-tap and hover on an element of your shadow DOM through the card's own `LCARdSActionHandler`, with the card's animations and sound overrides. Never bind raw click or pointer listeners for Home Assistant actions.
- It returns a cleanup function. The base does not keep it: call the previous one before binding again (the button's `_actionCleanup`, the data grid's `_cellActionCleanups`). Bind again when Lit replaces the element.
- **`callService(domain, service, data)`** wraps `hass.callService()` with logging and error handling; use it instead of `this.hass.callService()`:

```javascript
await this.callService('light', 'turn_on', { entity_id: this.config.entity, brightness: 255 });
```

See [Action Handler](../architecture/subsystems/action-handler.md) for the supported actions.

## Rules, colours and logging

- **Rules.** `_registerOverlayForRules(overlayId, type, tags)` takes positional arguments and registers the card as a rules target once; the base registers it again after a reconnect. When a patch changes, `this.config` already carries it and `_onRulePatchesChanged()` runs; re-resolve your style there and end in `requestUpdate()`. `_getMergedStyleWithRules(style)` applies the patch's `style` last, so a rule wins over defaults the card adds. See [Card Foundation: Rules integration](../architecture/cards/lcards-card-foundation.md#rules-integration).
- **Colours.** Use `_resolveEntityStateColor(value, fallback)` for CSS (a `var()` stays live, so alert modes recolour without a re-render) and `_resolveColorValue(value, fallback)` for SVG attributes, Canvas2D and anime.js. Defaults are `theme:` tokens (`'theme:colors.ui.primary'`), never literal colours. See [Colour Resolution](colour-resolution.md).
- **CSS.** New `--lcards-*` variables go in `src/lcards-vars.js` and `--lcars-*` ones in `scripts/ha-lcars-theme-vars.js`, or `npm run validate:css-vars` fails the build. Use Home Assistant's spacing, radius and border variables (see [Home Assistant CSS Variables](ha-css-vars.md)).
- **Logging.** `lcardsLog.debug('[LCARdSMyCard] ...', { data })`, never `console.log`. Turn on debug output in the browser console with `window.lcards.setGlobalLogLevel('debug')`.
- **Animations** use the anime.js v4 API through the [Animation API](anim-api.md).
- **Zones.** Cards that place text fields in named zones override `_calculateZones(width, height)` and call `_rebuildZones(width, height)` at the top of each render; the zone text helpers are on `LCARdSButton`, not `LCARdSCard`. See `cards.instructions.md` "Zone System".

## 2. The schema

`src/cards/schemas/mycard-schema.js` exports the JSON Schema of the card config. It is used four ways: runtime validation (`CoreValidationService`, through `CoreConfigManager`), the schema-driven editor fields (`FormField`), the strict doc example check and the published schema files.

```javascript
import { entitySchema, actionSchema, cardIdSchema, tagsSchema, stateColorSchema, cardLevelProperties } from './common-schemas.js';

export function getMyCardSchema() {
    return {
        type: 'object',
        required: ['type'],
        properties: {
            type: { type: 'string', const: 'custom:lcards-mycard', description: 'Card type.' },
            id: cardIdSchema,
            tags: tagsSchema,
            entity: entitySchema,
            secondary_entity: {
                type: 'string',
                description: 'A second entity whose state is shown under the main one.',
                'x-ui-hints': { label: 'Second entity', selector: { entity: {} } }
            },
            style: {
                type: 'object',
                description: 'Panel style.',
                properties: {
                    background: {
                        ...stateColorSchema,
                        description: 'Panel colour: a colour, a theme: token or a state map. Default: theme:colors.ui.primary.'
                    }
                }
            },
            tap_action: actionSchema,
            hold_action: actionSchema,
            double_tap_action: actionSchema,
            ...cardLevelProperties   // rules, sounds, variables, zones, debug_zones
        }
    };
}
```

- Reuse the shared nodes in `src/cards/schemas/common-schemas.js` (entity, actions, sizes, `cardLevelProperties`) instead of copying them. Keys every card accepts for Home Assistant and UIX (`grid_options`, `view_layout`, `visibility`, `card_mod`, `uix`) are added by `withCardPlumbing()` (`card-plumbing.js`); don't declare them.
- Every property needs a `description`: `npm run validate:schema-descriptions` (inside `npm run build`) fails otherwise. Before naming a key, check the other cards' schemas for the same idea (see [Adding a Card Option](adding-a-card-option.md#_1-check-the-name-on-every-card)).
- Option lists the runtime passes in (presets, components, text positions) are factory parameters, as in `getSelectMenuSchema({ availablePresets })`.

## 3. The editor

`src/editor/cards/lcards-mycard-editor.js` extends `LCARdSBaseEditor`, sets `this.cardType = 'mycard'` (the editor reads the schema with `configManager.getCardSchema(this.cardType)`), renders fields with `FormField.renderField(this, 'path.to.key')` and commits through `_updateConfig()` / `_setConfigValue()`. It registers its own element in its own file:

```javascript
if (!customElements.get('lcards-mycard-editor')) {
    customElements.define('lcards-mycard-editor', LCARdSMyCardEditor);
}
```

The editor guide is [Building a Studio Editor](building-an-editor.md); the field rules are in `.github/instructions/editor.instructions.md`.

## 4. Register the card

Everything goes in `src/lcards-main.js`, never in the card file.

```javascript
// At the top, with the other card imports
import { LCARdSMyCard } from './cards/lcards-mycard.js';

// Inside initializeCustomCard().then(() => { ... }), with the other cards
if (!customElements.get('lcards-mycard')) customElements.define('lcards-mycard', LCARdSMyCard);

// In the same block, inside if (window.lcards?.core?.configManager) { ... }
if (LCARdSMyCard.registerSchema) LCARdSMyCard.registerSchema();
```

And one entry in the module-level `LCARdSCardClasses` array, which is pushed into `window.customCards` once (guarded against a second bundle evaluation):

```javascript
{
    type: 'lcards-mycard',
    name: 'LCARdS My Card',
    preview: true,
    description: 'One line for the card picker',
    documentationURL: docsUrl(DOCS.myCard),
},
```

- The elements are defined after `initializeCustomCard()` resolves, so the core singletons exist when the first card connects; the schemas register in the same block, after the core is up.
- The `customElements.get()` guard stops a second evaluation of the bundle (an old Lovelace resource left next to the integration's script) from throwing.
- `DOCS.myCard` is a new entry in `src/utils/docs-url.js` pointing at the card's docs page (`'/cards/mycard/'`); `tests/docs/docs-links.test.js` checks every `DOCS` link against the built site. `getEntitySuggestion` (optional) lets the picker suggest the card for an entity, as the button, slider and select menu do.

## 5. Publish the schema

Add the card to `getSchemaEntries()` in `scripts/lib/card-schemas.js`:

```javascript
import { getMyCardSchema } from '../../src/cards/schemas/mycard-schema.js';
// ...
{ kind: 'card', tag: 'lcards-mycard', schema: getMyCardSchema() },
```

That one list feeds the strict doc example validator, the schema description check and the published schema (`npm run generate:llm-schema`, `doc/public/schema/`). `tests/docs/schema-registry.test.js` fails when an element defined in `lcards-main.js` has no entry here. If the card config names something from a registry (a preset, component, sound, background), the config checker's `registryIssues()` needs to know it: see [Adding a Card Option: Names that must exist](adding-a-card-option.md#_5-names-that-must-exist).

## 6. Element types

```bash
npm run types:elements
```

It regenerates `src/types/elements.generated.d.ts` (one `HTMLElementTagNameMap` entry per `customElements.define()` in `src/`), so `document.createElement('lcards-mycard')` is typed as your class. `npm run typecheck`, which `npm run build` runs, starts with `generate-element-types.js --check` and fails while the file is stale. Run it again after renaming an element. See [Type Checking](typescript.md).

## 7. Card size

`LCARdSNativeCard.getCardSize()` returns `_getCardSize()`, which is `1` by default. Override it when the card is taller than one masonry row (about 50 px):

```javascript
_getCardSize() {
    return Math.ceil((this._configPx(this.config?.height) || 200) / 50);
}
```

`_configPx()` turns `400`, `"400"` or `"400px"` into a number and returns `null` for relative units (`50vh`, `%`), so those fall back to the default. For the sections view, override `getGridOptions()` (the select menu does) or `_getGridOptions()`. Sizing inside layout cards and views follows `cards.instructions.md` "Sizing in Nested Grids".

## 8. Build, test and document

```bash
npm run build
```

`npm run build` is the only build, for development and releases alike: it runs every validator (strict doc examples, schema descriptions, CSS variables, Home Assistant compatibility lint, typecheck) and writes the bundle straight into `custom_components/lcards/`: `lcards.js` (a small loader stub), the hashed `chunks/` and their `.br` / `.gz` copies. There is no `dist/` folder and no copy step.

- **See it in Home Assistant.** In the devcontainer `custom_components/lcards/` is bind-mounted into Home Assistant, so hard-refresh the browser (Ctrl+Shift+R) after a build. The hard refresh is required: each build deletes the previous chunks, and a cached loader stub would ask for a main chunk that no longer exists. Python changes need a Home Assistant restart.
- **Tests.** Every behaviour gets a test: pure logic in a node test under `tests/`, rendering in a browser fixture `tests/browser/fixtures/mycard-*.yaml` with an assertion in `tests/browser/*.spec.js`. See [Testing](testing.md).
- **Docs.** A page under `doc/cards/mycard/` in the format of the other card pages (an overview plus topic pages, each section with a live example and a Key/Type/Default/Description table; `.claude/skills/lcards-docs-writer/SKILL.md` describes it). Its YAML examples must pass the strict check, which proves the schema accepts them.
- **Demo.** A view in `demo/views/` for the `lcards-demo` dashboard (`npm run demo:push`).

The commands and the order to run them in are in `COOKBOOK.md` ("Daily loop" and "Tests") in the repository root.

## Related

- [Card Foundation](../architecture/cards/lcards-card-foundation.md): every hook, member and cleanup step of the base classes
- [Adding a Card Option](adding-a-card-option.md)
- [Building a Studio Editor](building-an-editor.md)
- [Building a Pack](building-a-pack.md)
- [Config Manager](../architecture/subsystems/config-manager.md): how `processConfig()` merges presets, themes and your config
