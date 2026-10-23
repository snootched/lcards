# anime.js 4.4 and 4.5: what changed since the vendored reference

Written by LCARdS (not vendored) on 2026-10-22, from the upstream release notes (https://github.com/juliangarnier/anime/releases, v4.4.0 2026-04-29, v4.4.1 2026-04-30, v4.5.0 2026-06-22) and the 4.5.0 `.d.ts` files. The rest of this skill was written against 4.3; where it disagrees with this page, this page wins. Ground truth stays `node_modules/animejs/dist/modules/**/*.d.ts`.

## Breaking (4.4.0)

| Change | Before (4.3) | Now | LCARdS impact |
|---|---|---|---|
| `revert()` scope | Cleared inline styles and transforms only | Also restores DOM/SVG attributes and JS object properties to their pre-animation values. `utils.cleanInlineStyles(anim)` keeps the old styles-only behaviour | `AnimationManager.stopAnimations()` now puts a stopped `fill`/`stroke`/`stroke-dashoffset` loop back to its original value (`tests/browser/animation-revert.spec.js`). The slider value tween uses `cancel()` instead. |
| Transform order | Rendered in the order you wrote the properties | Always `perspective` > `translate` > `rotate` > `scale` > `skew` | Presets that combine translate and rotate (motionpath, chaos) already use that order. Authored SVG transforms copied into `style.transform`: pure `translate` and `matrix` survive; `rotate`/`scale` forms are a known gap (see SKILL.md). |
| `matrix`, `matrix3d` | Animatable | Not animatable; preserved when read from inline styles, settable with `transform: 'matrix(..)'` | Nothing animates them. |
| Function-based value args | `(target, index, total)` | `(target, index, targets, prevTween)`: `targets` is the Array, use `targets.length` for the count | No LCARdS callback reads the third argument. |
| `stagger({ use })` callback args | `(target, i, total)` | `(target, i, targets)` | `lcards-anim-helpers.js` passes plain stagger options only. |
| DevTools | `AnimeJSDevTools` | Removed | Not used. |

4.4.1 fixed timeline `.call()` not firing (a 4.4.0 regression). Skip 4.4.0.

## Behaviour changes (4.5.0)

- **Colour tweens blend RGB in pseudo-linear space.** Intermediate colours differ slightly from 4.3 (smoother, more even). Start and end colours are unchanged. No LCARdS visual baseline changed on the upgrade.
- Fixes for flicker between reversed/alternate loop iterations, timeline seeks with delayed children, keyframe scrubbing, `stretch()` with keyframes, frame scheduling under rAF jitter.

## New API (not used by LCARdS yet)

| Since | API | Notes |
|---|---|---|
| 4.4 | `scrambleText()` | Function-based value for a character scramble/reveal. LCARdS's own `text-scramble` preset predates it. |
| 4.4 | `stagger(v, { grid: true })` | Auto-grid from element positions or `{x, y}` objects. `from: [x, y]` normalised origin. |
| 4.4 | `priority` | On timers, animations, timelines: order within one engine tick. |
| 4.4 | Transform shorthands | Output groups `translateX`+`translateY` into `translate(x, y)`, `scaleX`+`scaleY` into `scale(x, y)` (and the 3D forms). Inline parsing reads multi-argument functions and nested `calc()`. |
| 4.4 | `globals`, `utils.forEachChildren`, `utils.addChild`, `utils.removeChild` | Exports; `globals.editor` hooks for an external editor. |
| 4.4 | `createLayout({ id })` | |
| 4.5 | `registerAdapter()` | Extends `animate()` and `utils.set()` to non-DOM targets. Built-in three.js adapter at `animejs/adapters/three` (optional `three` peer dependency). |
| 4.5 | `stagger` 3D grids, `jitter`, `seed` | `grid: [c, r, d]`, `from: [x, y, z]`, `axis: 'z'`; `jitter: n` or `[start, end]`; `seed` makes `jitter` and `from: 'random'` reproducible. |

Follow-ups worth considering are listed in `reports/handoffs/animejs-upgrade-4.5.md`.
