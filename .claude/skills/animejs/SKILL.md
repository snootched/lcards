---
name: animejs
description: anime.js v4 (4.5.0, the version LCARdS ships) API reference plus LCARdS animation-engine rules. Use when writing or changing code that calls anime.js in this repo: AnimationManager, AnimationRegistry, TriggerManager, animation presets and packs, resolveEasing / lcards-anim-helpers, window.lcards.anim, slider/button/MSD animations, timelines, stagger, springs, SVG draw/morph/motion paths, splitText, or when converting v3 examples (anime({ targets }), anime.timeline(), easeInOutQuad) to v4.
---

# anime.js v4 for LCARdS

Vendored from BowTiedSwan/animejs-skills (MIT) and patched for 4.5.0; see `references/UPSTREAM.md`. What changed in 4.4 and 4.5 (the vendored text predates both): `references/changes-4.4-4.5.md`. The generic API reference starts at "Core Concepts" below. Read the LCARdS rules first.

## LCARdS rules (read first)

- **Exact version is 4.5.0.** When a signature matters, the ground truth is `node_modules/animejs/dist/modules/**/*.d.ts`, not this file or online examples (most of the web is v3). Check runtime names with `node --input-type=module -e "import * as a from 'animejs'; console.log(Object.keys(a))"`.
- **Import as a namespace**: `import * as anime from 'animejs'` (no default export). The bundle does this once in `src/lcards-main.js` and exposes it as `window.lcards.anim` (`animate`, `createTimeline`, `stagger`, `spring`, `eases`, `utils`, `createScope`, `splitText`, plus the easing generators `cubicBezier`, `steps`, `linear`, `irregular` and LCARdS helpers). Reference: `doc/development/anim-api.md`.
- **v3 to v4**: `anime({ targets, ... })` becomes `animate(targets, { ... })`; `anime.timeline()` becomes `createTimeline()`; `.add({ targets })` becomes `.add(targets, { })`; `easing: 'easeInOutQuad'` becomes `ease: 'inOutQuad'`; `begin`/`update`/`complete` become `onBegin`/`onUpdate`/`onComplete`; `direction: 'alternate'` becomes `alternate: true`; `direction: 'reverse'` becomes `reversed: true`; `endDelay` becomes `loopDelay`; `.finished.then()` becomes `.then()`; `anime.path()` becomes `svg.createMotionPath()`; `anime.setDashoffset` becomes `svg.createDrawable()`.
- **Parametric eases are functions, not strings.** In 4.3 the strings `'cubicBezier(..)'`, `'steps(..)'`, `'linear(..)'`, `'irregular(..)'` were removed (warning, then no easing). Their generators are top-level exports (`anime.cubicBezier`, `anime.steps`, `anime.linear`, `anime.irregular`), not members of `anime.eases`. `anime.eases` holds only the named curves (`inQuad` ... `outInElastic`, callable for Back/Elastic params). `spring()` is the current name and `createSpring()` a deprecated alias.
- **Config easing goes through `resolveEasing()`** (`src/utils/lcards-anim-helpers.js`). Never hand a user's YAML string straight to anime.js.
- **Targets live in shadow DOM.** String selectors resolve against `document` and find nothing inside a card. Pass elements, or use `createScope({ root })`. Revert scopes and animations on disconnect (`scope.revert()`), and expect cards to re-render and replace the nodes you animated.
- **`revert()` vs `cancel()` (4.4+)**: `revert()` restores inline styles **and** SVG/DOM attributes and JS object properties to the values captured when the animation was created (`AnimationManager.stopAnimations()` relies on this to put a stopped `fill`/`stroke` loop back). Use `cancel()` to stop where it is (the slider value tween), `utils.cleanInlineStyles(anim)` for the old styles-only clean-up. A card that re-renders a new attribute value during a loop gets the creation-time value back on revert, since Lit does not rewrite an attribute it thinks is unchanged.
- **Transforms render in a fixed order (4.4+)**: perspective, translate, rotate, scale, skew, whatever order you wrote them in. `_migrateTransformAttrToStyle` copies an authored SVG `transform` into `style.transform` before animating; pure `translate(..)` and `matrix(..)` survive, authored `rotate(..)`/`scale(..)` forms do not (unitless CSS values are dropped; a known gap on 4.3 too).
- **Colours**: anime.js interpolates concrete values, so resolve LCARdS colours with `resolveColor(value, { concrete: true, element })` (`src/core/themes/resolve-color.js`), never raw `var(--x)` or `theme:` strings.
- **Where things live**: `src/core/animation/` (AnimationManager, AnimationRegistry, TriggerManager, AnimationConfigProcessor, resolveAnimParams, resolveTimelines), presets in `src/core/packs/animations/presets/`, preset param schemas in `src/cards/schemas/animation-preset-params-schemas.js`. Wiring rules: `.github/instructions/animation.instructions.md`.
- **Reduced motion**: HA's `--ha-animation-duration-*` variables collapse under `prefers-reduced-motion: reduce`, but anime.js never reads them. `AnimationManager.playAnimation()` gates every animation it creates: a finite one jumps to its end state (`complete()`), a looping one is reverted; switching the setting on settles running ones. Code that animates outside the manager (direct `anim.anime()`, WAAPI `el.animate()`, a `requestAnimationFrame` loop) asks `prefersReducedMotion()` from `src/utils/reduced-motion.js` itself (`onReducedMotionChange()` to follow a live change); `Canvas2DRenderer` and the screen effects hold one static frame.
- **A new or renamed YAML key** (a preset param, a trigger) follows the `lcards-card-option` skill.
- Logging via `lcardsLog`, never `console.log`. No em dashes in user-facing text.

## Core Concepts

Anime.js v4 is modular and tree-shakeable. Import only what you need:

```javascript
// Full import
import { animate, createTimeline, stagger, createDraggable } from 'animejs';

// Standalone modules for smaller bundles
import { animate } from 'animejs/animation';
import { createTimeline } from 'animejs/timeline';
import { createTimer } from 'animejs/timer';
```

## Documentation Sitemap

The complete anime.js v4 documentation structure:

### Getting Started
- Installation (NPM, CDN, Direct download)
- Module imports (ES Modules, CommonJS, UMD)
- Using with vanilla JS
- Using with React

### Timer (`createTimer`)
- **Playback Settings**: delay, duration, loop, loopDelay, alternate, reversed, autoplay, frameRate, playbackRate
- **Callbacks**: onBegin, onComplete, onUpdate, onLoop, onPause, then()
- **Methods**: play(), reverse(), pause(), restart(), alternate(), resume(), complete(), reset(), cancel(), revert(), seek(), stretch()
- **Properties**: currentTime, progress, paused, completed, etc.

### Animation (`animate`)
- **Targets**: CSS Selector, DOM Elements, JavaScript Objects, Array of targets
- **Animatable Properties**: CSS Properties, CSS transforms, CSS Variables, JS Object properties, HTML Attributes, SVG Attributes
- **Tween Value Types**: Numerical, Unit conversion, Relative (+=, -=, *=), Color, Color function, CSS variable, Function based
- **Tween Parameters**: to, from, delay, duration, ease, composition, modifier
- **Keyframes**: Tween values, Tween parameters, Duration based, Percentage based
- **Playback Settings**: delay, duration, loop, loopDelay, alternate, reversed, autoplay, frameRate, playbackRate, playbackEase, persist
- **Callbacks**: onBegin, onComplete, onBeforeUpdate, onUpdate, onRender, onLoop, onPause, then()
- **Methods**: play(), reverse(), pause(), restart(), alternate(), resume(), complete(), cancel(), revert(), reset(), seek(), stretch(), refresh()

### Timeline (`createTimeline`)
- Add timers, Add animations, Sync WAAPI animations, Sync timelines, Call functions
- **Time Position**: Absolute (ms), Relative (<, >, +=, -=), Labels
- **Playback Settings**: defaults, delay, loop, loopDelay, alternate, reversed, autoplay, frameRate, playbackRate, playbackEase
- **Callbacks**: onBegin, onComplete, onBeforeUpdate, onUpdate, onRender, onLoop, onPause, then()
- **Methods**: add(), set(), sync(), label(), remove(), call(), init(), play(), reset(), reverse(), pause(), restart(), alternate(), resume(), complete(), cancel(), revert(), seek(), stretch(), refresh()

### Animatable (`createAnimatable`)
- **Settings**: unit, duration, ease, modifier
- **Methods**: Getters, Setters, revert()

### Draggable (`createDraggable`)
- **Axes Parameters**: x, y, snap, modifier, mapTo
- **Settings**: trigger, container, containerPadding, containerFriction, releaseContainerFriction, releaseMass, releaseStiffness, releaseDamping, velocityMultiplier, minVelocity, maxVelocity, releaseEase, dragSpeed, dragThreshold, scrollThreshold, scrollSpeed, cursor
- **Callbacks**: onGrab, onDrag, onUpdate, onRelease, onSnap, onSettle, onResize, onAfterResize
- **Methods**: disable(), enable(), setX(), setY(), animateInView(), scrollInView(), stop(), reset(), revert(), refresh()

### Layout (`createLayout`) - NEW
- **Usage**: Specifying a root, CSS display animation, Staggered layout, DOM order animation, Enter/Exit layout animation, Swap parent animation, Modal dialog animation
- **Settings**: children, delay, duration, ease, properties
- **States**: enterFrom, leaveTo, swapAt
- **Methods**: record(), animate(), update(), revert()
- Layout id attribute, Callbacks, Properties, Common gotchas

### Scope (`createScope`)
- Add constructor function, Register method function
- **Parameters**: root, defaults, mediaQueries
- **Methods**: add(), addOnce(), keepTime(), revert(), refresh()

### Events / Scroll (`onScroll`)
- **Settings**: container, target, debug, axis, repeat
- **Thresholds**: Numeric values, Positions shorthands, Relative position values, Min max
- **Synchronisation Modes**: Method names, Playback progress, Smooth scroll, Eased scroll
- **Callbacks**: onEnter, onEnterForward, onEnterBackward, onLeave, onLeaveForward, onLeaveBackward, onUpdate, onSyncComplete, onResize
- **Methods**: link(), refresh(), revert()

### SVG Utilities
- `morphTo()` - SVG shape morphing
- `createDrawable()` - SVG line drawing animation
- `createMotionPath()` - Motion path animation

### Text Utilities (`splitText`)
- **Settings**: lines, words, chars, debug, includeSpaces, accessible
- **Split Parameters**: class, wrap, clone
- HTML template support
- **Methods**: addEffect(), revert(), refresh()

### Utilities
- `stagger()` - Time/values/timeline staggering with grid support
- `$()` - Query selector utility
- `get()` / `set()` - Get/set CSS property values
- `cleanInlineStyles()` - Remove inline styles
- `remove()` - Remove animations from targets
- `sync()` - Synchronize animations
- `keepTime()` - Time keeper utility
- `random()` / `createSeededRandom()` / `randomPick()` / `shuffle()` - Random utilities
- `round()` / `clamp()` / `snap()` / `wrap()` - Math utilities
- `mapRange()` / `lerp()` / `damp()` - Interpolation utilities
- `roundPad()` / `padStart()` / `padEnd()` - String padding
- `degToRad()` / `radToDeg()` - Angle conversion
- Chain-able utilities

### Easings
- **Built-in (string names)**: `linear`, `in`, `out`, `inOut`, `outIn`, each with Quad, Cubic, Quart, Quint, Sine, Expo, Circ, Back, Elastic, Bounce variants (`'outExpo'`, never v3 `'easeOutExpo'`). Parametric ones are callable: `eases.outBack(1.7)`, `eases.outElastic(1, 0.3)`.
- **Custom generators (top-level exports, NOT on `eases`)**: `cubicBezier(x1, y1, x2, y2)`, `linear(...points)`, `steps(count, fromStart)`, `irregular(steps, randomness)`. Pass the returned function; the string forms (`'steps(5)'`) were removed in v4.3.
- **Spring**: `spring({ stiffness, damping, mass, velocity })` or `spring({ duration, bounce })` (`createSpring` is a deprecated alias)

### WAAPI (Web Animation API)
- When to use WAAPI vs JS animation
- Hardware-accelerated animations
- Improvements to native WAAPI
- API differences (iterations, direction, easing, finished)
- `waapi.convertEase()`

### Engine Configuration
- **Parameters**: timeUnit (ms/s), speed, fps, precision, pauseOnDocumentHidden
- **Methods**: update(), pause(), resume()
- Engine defaults

## Quick Reference

### Basic Animation
```javascript
import { animate } from 'animejs';

animate('.element', {
  translateX: 250,
  rotate: '1turn',
  duration: 800,
  ease: 'outExpo'
});
```

### Timeline
```javascript
import { createTimeline } from 'animejs';

const tl = createTimeline({ defaults: { duration: 500 } });
tl.add('.box1', { x: 100 })
  .add('.box2', { x: 100 }, '<')  // Start with previous
  .add('.box3', { x: 100 }, '-=200');  // 200ms before end
```

### Stagger
```javascript
import { animate, stagger } from 'animejs';

animate('.item', {
  translateY: [-20, 0],
  opacity: [0, 1],
  delay: stagger(100, { from: 'center' }),
  duration: 600
});
```

### Scroll Animation
```javascript
import { animate, onScroll } from 'animejs';

animate('.element', {
  translateX: [0, 500],
  autoplay: onScroll({
    target: '.element',
    sync: true
  })
});
```

### SVG Line Drawing
```javascript
import { animate, createDrawable } from 'animejs';

animate(createDrawable('path'), {
  draw: ['0 0', '0 1'],
  duration: 2000,
  ease: 'inOutQuad'
});
```

### Draggable
```javascript
import { createDraggable, spring } from 'animejs';

createDraggable('.draggable', {
  container: '.container',
  releaseEase: spring({ stiffness: 200, damping: 20 })
});
```

### Function-Based Values
```javascript
animate('.element', {
  translateX: (el, i, targets) => i * 50,       // 3rd arg is the targets array since 4.4 (was the count); 4th is the previous tween
  rotate: (el, i) => utils.random(-180, 180),   // import { utils } from 'animejs'
  delay: (el, i) => i * 100
});
```

### Keyframes
```javascript
animate('.element', {
  translateX: [
    { to: 100, duration: 500 },
    { to: 0, duration: 500, delay: 200 }
  ],
  rotate: ['0turn', '1turn', '0turn']
});
```

## Lit / Shadow DOM Integration

String selectors resolve against `document`, so they cannot reach inside a shadow root. Pass elements, or give `createScope` a `root` so selectors inside `.add()` resolve against it.

```javascript
import * as anime from 'animejs';

class MyCard extends LitElement {
  firstUpdated() {
    this._scope = anime.createScope({ root: this.shadowRoot }).add(() => {
      anime.animate(this.shadowRoot.querySelector('.bar'), { scaleX: [0, 1], duration: 400 });
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._scope?.revert();   // stops every animation created in the scope and restores styles and attributes
  }
}
```

## Additional Resources

- Official Documentation: https://animejs.com/documentation
- Easing Editor: https://animejs.com/easing-editor
- CodePen Examples: https://codepen.io/collection/Poerqa
- GitHub: https://github.com/juliangarnier/anime

For detailed API parameters, code examples, and advanced patterns, see the references files:
- `references/api-reference.md` - Complete API documentation
- `references/examples.md` - Common animation patterns and recipes
