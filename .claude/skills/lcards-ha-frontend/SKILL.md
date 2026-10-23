---
name: lcards-ha-frontend
description: How the Home Assistant frontend's own ha-frontend-* skills apply to LCARdS, a custom card bundle outside HA's source tree. Load it whenever any ha-frontend-* skill loads or would load in this repo (dialogs, ha-button, ha-alert, ha-form, Lovelace cards, CSS/styling/motion, Lit state, events, contexts, UI strings, review), and when reviewing LCARdS UI code against HA conventions. Says which upstream rules to follow, which to translate to LCARdS equivalents, and which to ignore.
---

# HA frontend skills, applied to LCARdS

The HA frontend checkout (`~/code/frontend`) is attached to LCARdS sessions, so its 13 `ha-frontend-*` skills load here. They are written for code inside HA's tree: TypeScript, `pnpm`, HA's `src/common` helpers, `en.json` translations. LCARdS is a plain-JS (JSDoc-typed) Vite bundle that can only use what HA registers at runtime (custom elements, CSS variables, Lit contexts on `<home-assistant>`). Load the upstream skill for its domain knowledge, then apply this table.

Upstream files: `~/code/frontend/.agents/skills/<name>/SKILL.md` (`.claude/skills` there is a symlink). They change upstream; `npm run check:ha-impact` reports changes under `.agents/skills/`, and when it does, re-check the matching row here. `tests/core/ha-frontend-skill.test.js` fails if an upstream skill has no row.

LCARdS rules win over upstream ones: CLAUDE.md, `.github/instructions/*.instructions.md`, and the other project skills.

## Fit table

| Upstream skill | Fit | Follow | Translate or ignore |
|---|---|---|---|
| `ha-frontend-styling` | Applies | Theme variables, `--ha-space-*`, `--ha-animation-duration-*`, scoped styles, mobile-first, RTL-safe logical properties, clear hover/active/focus/disabled/loading/error/unavailable states, WCAG AA contrast, no new `mwc-*` | CLAUDE.md already lists the token tables (radius, border width, spacing, durations). `withViewTransition()` is HA-internal: don't import it |
| `ha-frontend-components` | Partly | `ha-button` axes (`variant`, `appearance`, `size`), `appearance="plain"` for cancel, `variant="danger"` for destructive; `ha-alert` types and slots; `ha-dialog` `header-title`/`header-subtitle`; standard dialog widths; `autofocus` on the first field; cards validate config in `setConfig()` and handle loading, error, unavailable and missing-entity states | Dialogs: no `DialogMixin`, no `show-dialog` fireEvent (both HA-internal). Create the element and mount it with `mountDialogNearHomeAssistant()` (`src/utils/lcards-shared-helpers.js`), never `document.body`. Footer: `<ha-dialog-footer slot="footer">` with `secondaryAction` / `primaryAction` slots (registered on dashboards and the config panel: confirmed by the maintainer, 2026-10-22); imperative dialogs use `createDialogFooter()` (`src/utils/lcards-shared-helpers.js`). Rules in `editor.instructions.md` ("Plain dialogs"). `ShortcutManager`, `ha-form` `computeLabel` with `localize`: not available; LCARdS editors use `FormField` (`editor.instructions.md`) |
| `ha-frontend-contexts` | Watch | Know the direction: HA leaf components are moving from broad `hass` to narrow contexts. `reducedMotionContext` exists | `consume`, `@transform`, `consumeEntityState` live in HA `src/common`: not importable. LCARdS gets state through `subscribeToEntity()` and `LCARdSCore.ingestHass()`. What matters to us: HA pickers inside our dialogs need the contexts `<home-assistant>` provides, hence `mountDialogNearHomeAssistant()` |
| `ha-frontend-lit` | Partly | `@property` for public API vs `@state` for internal (in JS: `static properties` with `state: true`); render-local values for cheap derivations, `willUpdate()` for values other code reads; memoize only with a real benefit; `@query`-style caching only when the node can't be replaced | TypeScript decorator mode, `useDefineForClassFields`: not applicable (plain JS) |
| `ha-frontend-events` | Mostly no | Events bubble and cross shadow roots | `fireEvent`, `HASSDomEvents`, `HASSDomCurrentTargetEvent` are HA TS internals. LCARdS dispatches `new CustomEvent(name, { detail, bubbles: true, composed: true })`; editors commit through `_updateConfig()`, never by firing `config-changed` by hand |
| `ha-frontend-types` | Partly | Shape a type on the producer (Core, WebSocket handler, the element's exported contract), not on current consumers; narrow assertions with a stated invariant | `import type`, `PropertyValues<this>`: TS-only. LCARdS types via JSDoc; HA elements in `src/types/ha-elements.d.ts`, ours generated into `src/types/elements.generated.d.ts`; `@ts-expect-error <reason>` only (`doc/development/typescript.md`) |
| `ha-frontend-user-facing-text` | Partly | Sentence case for titles, buttons and labels; Delete (permanent) vs Remove (reversible); Create (new) vs Add (existing); active voice; "you"; "like" over "e.g."; no all caps for emphasis | No localization: LCARdS has no i18n, so strings stay inline. No em dashes anywhere (CLAUDE.md). "Home Assistant" in full: adopted 2026-10-22 and enforced (CLAUDE.md, "User-facing text"). Sentence case: new strings only; about 395 existing Title Case editor labels stay until a deliberate sweep |
| `ha-frontend-review` | Partly | The "Recurring review issues" list: transitions in both directions, restore valid defaults when controls reappear, guard stale async responses, readiness, memo invalidation, null guards, cleanup of listeners/timers/observers/subscriptions, labels and touch targets | PR template, Needs UX label, `pnpm lint`, Copilot thread rules: HA repo process. LCARdS reviews use `/code-review` and the project test layers |
| `ha-frontend-ux-readiness` | No | | HA's UX-label gate for core PRs |
| `ha-frontend-testing` | No | Its rule "don't add rendering tests for the look of a component" is not ours: LCARdS keeps browser and visual layers (`COOKBOOK.md`) | vitest, `pnpm`, HA e2e |
| `ha-frontend-demo` | No | | HA's `demo/` app |
| `ha-frontend-gallery` | No | Useful as a reference for how an HA component should look and behave (`~/code/frontend/gallery/src/pages/`) | HA's gallery build |
| `ha-frontend-query-params` | No | | HA panel URL state |

## Known LCARdS gaps against these rules

Tracked in `reports/ha-frontend-skills-audit.md`. Don't fix them in passing in unrelated work; fix one when the work touches it or the user picks it.
