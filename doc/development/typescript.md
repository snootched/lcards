# Type Checking: Developer Guide

LCARdS is written in plain JavaScript, and TypeScript checks it. Nothing is compiled: `tsc` reads the `.js` files and their JSDoc comments, reports mistakes and writes no output. The Vite build ignores types entirely, so type annotations cost nothing at runtime. This page covers how the checker is set up, what it expects of new code, and how to fix the errors it reports.

---

## Why a Checker on JavaScript

The checker finds mistakes that no test happened to cover. When the backlog was cleared (2026-10) it turned up a variable that didn't exist in the data-source percent format, a dialog method HA's `ha-dialog` doesn't have, an un-awaited confirm that let MSD Studio's Reset skip its question, and a dead duplicate of `ingestHass()`. The same engine powers editor tooling: go to definition, find references and hover types.

We don't convert files to `.ts`: JSDoc gives the same checking without touching every file.

## Running It

| Command | What it does |
|---|---|
| `npm run typecheck` | Checks the generated element map is current, then runs `tsc`. Zero errors or it fails. |
| `npm run build` | Runs `typecheck` before the Vite step. |
| `npm run types:elements` | Regenerates `src/types/elements.generated.d.ts` after adding or renaming a custom element. |

CI runs `npm run typecheck` on every push. There is no baseline: every error is a failure.

## The Settings (`tsconfig.json`)

| Setting | Value | Why |
|---|---|---|
| `allowJs`, `checkJs`, `noEmit` | on | Check our JavaScript, write nothing. |
| `noImplicitReturns` | on | A function that returns a value on some paths must return on all of them. |
| `noFallthroughCasesInSwitch` | on | A `case` that falls into the next one is an error. |
| `strictNullChecks` | off (for now) | Planned next step: flags values that may be `null` or `undefined` where an object is used. |
| `noImplicitAny` | off, on purpose | It would demand a type on every parameter TypeScript can't infer (about 12,600 places). In a JavaScript codebase that's busywork with little bug-finding value. |

## Rules for New Code

- **No `@ts-ignore` or `@ts-nocheck`.** They silence errors forever, even after the code changes. `tests/core/typecheck-hygiene.test.js` fails on either.
- **Fix the type, don't silence it.** Most errors are a missing declaration or a cast at the right spot (see below).
- **A genuine typing gap** (a third-party library typed wrong, a Vite `?raw` import) gets `// @ts-expect-error <reason>`. Unlike `@ts-ignore`, it becomes an error itself the day the problem goes away, so it can't rot. The hygiene test requires a reason.

## Common Fixes

### A custom element's properties "don't exist"

`document.createElement('lcards-chart')` and `querySelector('lcards-chart')` are typed through `HTMLElementTagNameMap`.

- **Our elements** are generated from the `customElements.define()` calls: run `npm run types:elements` after adding one (the class must be exported).
- **Home Assistant's elements** (`ha-dialog`, `ha-button`, `hui-card`, `hui-card-picker`, ...) are declared by hand in `src/types/ha-elements.d.ts`, listing only the properties we use, named as in HA's frontend source. Add a property there rather than casting at the call site.
- **A card whose tag is only known at runtime** (`createElement(cardType)`): cast to `LovelaceCardElement`.

```js
const card = /** @type {LovelaceCardElement} */ (document.createElement(cardType));
card.setConfig(config);
```

### `this.hass` doesn't exist on a Lit component

Properties declared only in `static properties` are invisible to the checker. Declare the type in the constructor without assigning (assigning can interfere with values HA sets before the element upgrades):

```js
constructor() {
    super();
    /** @type {any} */
    this.hass;
}
```

### `e.detail` doesn't exist on `Event`

HA's `config-changed` and `value-changed` events are declared in `src/types/ha-elements.d.ts`, so `addEventListener('value-changed', e => e.detail.value)` is typed. For a handler method, document the parameter as `@param {CustomEvent} e`.

### `.style`, `.value` or `.focus()` doesn't exist on `Element` / `EventTarget`

`querySelector()` returns `Element`, and `event.target` is an `EventTarget`. Cast once where you know more:

```js
const input = /** @type {HTMLInputElement} */ (ev.target);
const grid = /** @type {HTMLElement | null} */ (this.renderRoot.querySelector('#grid'));
const tab = /** @type {HaTabGroupElement} */ (event.target).activeTab;
```

### A render helper returns `''`

A helper documented `@returns {TemplateResult}` that also returns `''` should say so: `@returns {TemplateResult|string}`. (Lit's `nothing` is the idiom for new code, but it is truthy where `''` isn't, so don't swap one for the other in existing code without checking the callers.)

### An override is "incorrectly extending" its base class

A subclass method tagged `@private` that overrides a base method fails: overrides can't narrow access. Tag it `@protected`.

## Limits

- The checker doesn't look inside Lit `html` templates, so a stale attribute in markup (for example `.heading=` on `ha-dialog`) isn't caught. Grep for it.
- Calls through untyped objects (`window.lcards.core.*`, `coordinator.router`) aren't connected to their classes, so "find references" misses them. Grep before concluding nothing calls a method.
