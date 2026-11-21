# Anime.js v4 Complete API Reference

## animate(targets, parameters)

Animates the properties of targeted elements.

### Targets

| Type | Example |
|------|---------|
| CSS Selector | `'.class'`, `'#id'`, `'div'` |
| DOM Element | `document.querySelector('.el')` |
| NodeList | `document.querySelectorAll('.el')` |
| JavaScript Object | `{ prop: 0 }` |
| Array | `[el1, el2, { prop: 0 }]` |

### Animatable Properties

#### CSS Properties
```javascript
animate('.el', {
  opacity: 0.5,
  backgroundColor: '#FFF',
  borderRadius: '50%',
  width: '200px',
  height: '200px'
});
```

#### CSS Transforms (Individual)
```javascript
animate('.el', {
  translateX: 250,        // px by default
  translateY: '50%',
  translateZ: 100,
  rotate: '1turn',        // or deg, rad
  rotateX: 45,
  rotateY: 45,
  rotateZ: 45,
  scale: 2,
  scaleX: 1.5,
  scaleY: 1.5,
  scaleZ: 1.5,
  skewX: 30,
  skewY: 30,
  perspective: 1000
});
```

#### CSS Variables
```javascript
animate('.el', {
  '--custom-property': 100
});
```

#### JavaScript Object Properties
```javascript
const obj = { value: 0, x: 0 };
animate(obj, {
  value: 100,
  x: 500
});
```

#### HTML Attributes
```javascript
animate('input[type="range"]', {
  value: 100
});
```

#### SVG Attributes
```javascript
animate('circle', {
  cx: 100,
  cy: 100,
  r: 50
});
```

### Tween Value Types

#### Numerical (unitless)
```javascript
{ translateX: 250 }  // Becomes '250px'
{ opacity: 0.5 }     // No unit
{ rotate: 90 }       // Becomes '90deg'
```

#### Unit Conversion
```javascript
{ width: '50%' }
{ translateX: '10rem' }
{ rotate: '1turn' }
```

#### Relative Values
```javascript
{ translateX: '+=100' }  // Add 100
{ translateX: '-=100' }  // Subtract 100
{ scale: '*=2' }         // Multiply by 2
```

#### From/To
```javascript
{ translateX: [0, 250] }           // From 0 to 250
{ opacity: { from: 0, to: 1 } }    // Explicit from/to
```

#### Color Values
```javascript
{ color: '#FF0000' }
{ backgroundColor: 'rgb(255, 0, 0)' }
{ borderColor: 'hsl(0, 100%, 50%)' }
```

#### Function-Based Values
```javascript
animate('.el', {
  translateX: (el, i, targets) => i * 50,   // targets: Array since 4.4 (use targets.length for the count)
  rotate: (el, i, targets, prevTween) => {
    return utils.random(-180, 180);
  }
});
```

### Tween Parameters (Per-Property)

```javascript
animate('.el', {
  translateX: {
    to: 250,
    from: 0,
    delay: 100,
    duration: 500,
    ease: 'outExpo',
    composition: 'blend',  // 'none', 'replace', 'blend'
    modifier: v => Math.round(v)
  },
  rotate: {
    to: '1turn',
    duration: 1000
  }
});
```

### Keyframes

#### Array Keyframes
```javascript
animate('.el', {
  translateX: [0, 100, 50, 200],  // Equal duration each
  scale: [1, 1.5, 1]
});
```

#### Object Keyframes (Duration-Based)
```javascript
animate('.el', {
  translateX: [
    { to: 100, duration: 500 },
    { to: 50, duration: 300 },
    { to: 200, duration: 400 }
  ]
});
```

#### Percentage-Based Keyframes
```javascript
animate('.el', {
  keyframes: [
    { translateX: 0, at: '0%' },
    { translateX: 100, at: '25%' },
    { translateX: 50, at: '75%' },
    { translateX: 200, at: '100%' }
  ],
  duration: 2000
});
```

### Playback Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `delay` | Number/Function | 0 | Delay before animation starts (ms) |
| `duration` | Number/Function | 1000 | Animation duration (ms) |
| `loop` | Number/Boolean | false | Number of loops, or true for infinite |
| `loopDelay` | Number | 0 | Delay between loops (ms) |
| `alternate` | Boolean | false | Alternate direction on loop |
| `reversed` | Boolean | false | Play in reverse |
| `autoplay` | Boolean/ScrollObserver | true | Auto-start animation |
| `frameRate` | Number | undefined | Limit frame rate |
| `playbackRate` | Number | 1 | Playback speed multiplier |
| `playbackEase` | String/Function | undefined | Easing for entire playback |
| `persist` | Boolean | true | (WAAPI) Keep styles after animation |

### Callbacks

```javascript
animate('.el', {
  translateX: 250,
  onBegin: (anim) => console.log('Started'),
  onComplete: (anim) => console.log('Completed'),
  onUpdate: (anim) => console.log(anim.progress),
  onLoop: (anim) => console.log('Looped'),
  onPause: (anim) => console.log('Paused'),
  onBeforeUpdate: (anim) => {},  // Before each frame
  onRender: (anim) => {}         // After render
}).then(anim => {
  console.log('Promise resolved');
});
```

### Animation Methods

```javascript
const anim = animate('.el', { translateX: 250 });

anim.play();          // Start/resume
anim.pause();         // Pause
anim.restart();       // Restart from beginning
anim.reverse();       // Reverse direction
anim.alternate();     // Toggle direction
anim.resume();        // Resume from paused
anim.complete();      // Jump to end
anim.reset();         // Reset to initial state
anim.cancel();        // Cancel and clear
anim.revert();        // Cancel and restore styles, attributes and object props (4.4+)
anim.seek(500);       // Seek to 500ms
anim.seek('50%');     // Seek to 50%
anim.stretch(2000);   // Stretch to new duration
anim.refresh();       // Refresh targets/values
```

### Animation Properties

```javascript
anim.currentTime      // Current time in ms
anim.progress         // Progress 0-1
anim.paused           // Is paused
anim.began            // Has begun
anim.completed        // Is completed
anim.reversed         // Is reversed
anim.duration         // Total duration
anim.targets          // Target elements
```

---

## createTimeline(parameters)

Creates a timeline to synchronize multiple animations.

### Basic Usage

```javascript
import { createTimeline } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 500, ease: 'outExpo' },
  loop: true,
  alternate: true
});

tl.add('.box1', { translateX: 100 })
  .add('.box2', { translateX: 100 })
  .add('.box3', { translateX: 100 });
```

### Time Position

| Position | Description | Example |
|----------|-------------|---------|
| Absolute | Milliseconds from start | `500` |
| `'<'` | Start of previous | `'<'` |
| `'>'` | End of previous | `'>'` |
| `'<+=100'` | 100ms after previous start | `'<+=100'` |
| `'<-=100'` | 100ms before previous start | `'<-=100'` |
| `'>=+100'` | 100ms after previous end | `'>=+100'` |
| Label | Jump to label | `'myLabel'` |

```javascript
tl.label('intro')
  .add('.a', { x: 100 })
  .add('.b', { x: 100 }, '<')        // Same time as .a
  .add('.c', { x: 100 }, '<+=200')   // 200ms after .a starts
  .add('.d', { x: 100 }, 'intro')    // At label position
  .add('.e', { x: 100 }, 1000);      // At 1000ms absolute
```

### Timeline Methods

```javascript
tl.add(target, params, position);   // Add animation
tl.add(timerParams, position);      // Add timer
tl.set(target, params, position);   // Instant set
tl.call(fn, position);              // Call function
tl.sync(otherTimeline, position);   // Sync timeline
tl.label('name', position);         // Add label
tl.remove(animation);               // Remove animation
tl.init();                          // Initialize

// Playback controls (same as animation)
tl.play() / pause() / restart() / reverse() / etc.
```

---

## createTimer(parameters)

Alternative to setTimeout/setInterval that stays in sync with animations.

```javascript
import { createTimer } from 'animejs';

const timer = createTimer({
  duration: 1000,
  loop: 5,
  onUpdate: (self) => console.log(self.currentTime),
  onComplete: () => console.log('Done')
});
```

---

## stagger(value, parameters)

Creates staggered values for multiple targets.

### Time Staggering

```javascript
animate('.el', {
  translateX: 250,
  delay: stagger(100)              // 0, 100, 200, 300...
});

animate('.el', {
  translateX: 250,
  delay: stagger(100, { start: 500 })  // 500, 600, 700...
});
```

### Values Staggering

```javascript
animate('.el', {
  scale: stagger([0.5, 1.5]),     // Range from 0.5 to 1.5
  rotate: stagger([-45, 45])
});
```

### Stagger Parameters

| Parameter | Description |
|-----------|-------------|
| `start` | Starting value |
| `from` | Origin: 'first', 'last', 'center', index, [x, y] |
| `reversed` | Reverse order |
| `ease` | Easing function |
| `grid` | Grid dimensions [cols, rows] |
| `axis` | Grid axis: 'x', 'y' |
| `modifier` | Transform function |

```javascript
// Grid stagger from center
animate('.grid-item', {
  scale: [0, 1],
  delay: stagger(50, {
    grid: [10, 10],
    from: 'center',
    ease: 'outQuad'
  })
});
```

---

## onScroll(parameters)

Creates scroll-triggered animations.

```javascript
import { animate, onScroll } from 'animejs';

// Play on scroll enter
animate('.el', {
  translateX: 250,
  autoplay: onScroll({
    target: '.el',
    enter: 'bottom right'
  })
});

// Sync with scroll position
animate('.el', {
  translateX: [0, 500],
  autoplay: onScroll({
    target: '.scroll-container',
    sync: true
  })
});
```

### ScrollObserver Settings

| Parameter | Description |
|-----------|-------------|
| `container` | Scroll container (default: window) |
| `target` | Element to observe |
| `axis` | 'y' or 'x' |
| `debug` | Show debug markers |
| `repeat` | Repeat on re-enter |
| `enter` | Enter threshold |
| `leave` | Leave threshold |
| `sync` | Synchronize with scroll position |

### ScrollObserver Callbacks

```javascript
onScroll({
  target: '.el',
  onEnter: (self) => {},
  onEnterForward: (self) => {},
  onEnterBackward: (self) => {},
  onLeave: (self) => {},
  onLeaveForward: (self) => {},
  onLeaveBackward: (self) => {},
  onUpdate: (self) => {},
  onSyncComplete: (self) => {}
});
```

---

## createDraggable(target, parameters)

Creates draggable elements.

```javascript
import { createDraggable, spring } from 'animejs';

const draggable = createDraggable('.element', {
  container: '.container',
  x: { snap: 50 },
  y: { snap: 50 },
  releaseEase: spring({ stiffness: 200, damping: 20 }),
  onGrab: (self) => {},
  onDrag: (self) => {},
  onRelease: (self) => {},
  onSnap: (self) => {},
  onSettle: (self) => {}
});

// Methods
draggable.setX(100);
draggable.setY(100);
draggable.disable();
draggable.enable();
draggable.reset();
draggable.revert();
```

---

## SVG Utilities

### morphTo(shape)

```javascript
import { animate, morphTo } from 'animejs';

animate('path#shape1', {
  d: morphTo('path#shape2')
});
```

### createDrawable(path)

```javascript
import { animate, createDrawable } from 'animejs';

const drawable = createDrawable('path.line');
animate(drawable, {
  draw: ['0 0', '0 1'],  // [start, end] normalized
  duration: 2000
});
```

### createMotionPath(path)

```javascript
import { animate, createMotionPath } from 'animejs';

animate('.element', {
  ...createMotionPath('path.curve'),
  duration: 3000
});
```

---

## splitText(target, parameters)

Splits text into animatable elements.

```javascript
import { splitText, animate, stagger } from 'animejs';

const { lines, words, chars } = splitText('h1', {
  lines: true,
  words: true,
  chars: true
});

animate(chars, {
  translateY: [20, 0],
  opacity: [0, 1],
  delay: stagger(30)
});
```

---

## Easings

### Built-in Easings

| In | Out | InOut |
|----|-----|-------|
| `inQuad` | `outQuad` | `inOutQuad` |
| `inCubic` | `outCubic` | `inOutCubic` |
| `inQuart` | `outQuart` | `inOutQuart` |
| `inQuint` | `outQuint` | `inOutQuint` |
| `inSine` | `outSine` | `inOutSine` |
| `inExpo` | `outExpo` | `inOutExpo` |
| `inCirc` | `outCirc` | `inOutCirc` |
| `inBack` | `outBack` | `inOutBack` |
| `inElastic` | `outElastic` | `inOutElastic` |
| `inBounce` | `outBounce` | `inOutBounce` |

### Custom Easings

```javascript
// v4.3+: string syntax for parametric eases ('cubicBezier(...)', 'steps(...)',
// 'linear(...)', 'irregular(...)') was REMOVED from core. It logs a warning and
// falls back to no easing. Import the generator and pass the function instead.
// These generators are TOP-LEVEL exports; they are NOT on the `eases` object.
import { cubicBezier, steps, linear, irregular } from 'animejs';

// Cubic Bezier
{ ease: cubicBezier(0.5, 0, 0.5, 1) }

// Steps
{ ease: steps(5) }
{ ease: steps(10, true) }        // fromStart

// Multi-point linear and irregular
{ ease: linear(0, 0.25, 1) }
{ ease: irregular(10, 1) }       // steps, randomness

// Spring (spring() is the current name; createSpring() is a deprecated alias)
import { spring } from 'animejs';
{
  ease: spring({
    stiffness: 100,
    damping: 10,
    mass: 1,
    velocity: 0
  })
}

// Custom function
{ ease: t => t * t }
```

---

## Utility Functions

```javascript
import {
  $, get, set, remove, sync,
  random, randomPick, shuffle,
  round, clamp, snap, wrap,
  mapRange, lerp, damp,
  degToRad, radToDeg
} from 'animejs';

// DOM utilities
$('.selector');                    // Query selector
get('.el', 'translateX');          // Get value
set('.el', { translateX: 100 });   // Set value
remove('.el');                     // Remove animations

// Math utilities
random(0, 100);                    // Random number
randomPick([1, 2, 3]);             // Random from array
shuffle([1, 2, 3]);                // Shuffle array
round(3.14159, 2);                 // Round to 2 decimals
clamp(value, 0, 100);              // Clamp between min/max
snap(47, 10);                      // Snap to nearest 10 (50)
wrap(370, 0, 360);                 // Wrap to 0-360 (10)
mapRange(0.5, 0, 1, 0, 100);       // Map 0.5 -> 50
lerp(0, 100, 0.5);                 // Linear interp -> 50
degToRad(180);                     // Degrees to radians
radToDeg(Math.PI);                 // Radians to degrees
```

---

## Engine Configuration

```javascript
import { engine } from 'animejs';

// Configure
engine.timeUnit = 's';              // 's' or 'ms'
engine.speed = 1;                   // Global speed
engine.fps = 60;                    // Frame rate limit
engine.precision = 4;               // Decimal precision
engine.pauseOnDocumentHidden = true;

// Methods
engine.update();                    // Manual update
engine.pause();                     // Pause all
engine.resume();                    // Resume all
```
