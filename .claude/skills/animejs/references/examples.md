# Anime.js v4 Examples & Recipes

## Basic Animations

### Fade In

```javascript
import { animate } from 'animejs';

animate('.element', {
  opacity: [0, 1],
  duration: 500,
  ease: 'outQuad'
});
```

### Slide In From Left

```javascript
animate('.element', {
  translateX: [-100, 0],
  opacity: [0, 1],
  duration: 600,
  ease: 'outExpo'
});
```

### Scale & Rotate

```javascript
animate('.element', {
  scale: [0, 1],
  rotate: ['45deg', '0deg'],
  duration: 800,
  ease: 'outBack'
});
```

### Bounce Effect

```javascript
animate('.element', {
  translateY: [-50, 0],
  ease: 'outBounce',
  duration: 1000
});
```

---

## Staggered Animations

### List Items Stagger

```javascript
import { animate, stagger } from 'animejs';

animate('.list-item', {
  translateX: [-50, 0],
  opacity: [0, 1],
  delay: stagger(100),
  duration: 500,
  ease: 'outQuad'
});
```

### Grid Reveal from Center

```javascript
animate('.grid-item', {
  scale: [0, 1],
  opacity: [0, 1],
  delay: stagger(50, {
    grid: [10, 10],
    from: 'center'
  }),
  duration: 400,
  ease: 'outBack'
});
```

### Wave Effect

```javascript
animate('.item', {
  translateY: [0, -30, 0],
  delay: stagger(80, { ease: 'inOutQuad' }),
  duration: 600,
  loop: true
});
```

### Random Stagger

```javascript
import { animate, stagger, random } from 'animejs';

animate('.particle', {
  translateX: () => random(-200, 200),
  translateY: () => random(-200, 200),
  scale: stagger([0.5, 1.5]),
  delay: stagger(20, { from: 'random' }),
  duration: 1000
});
```

---

## Timeline Sequences

### Basic Sequence

```javascript
import { createTimeline } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 500, ease: 'outExpo' }
});

tl.add('.box-1', { translateX: 250 })
  .add('.box-2', { translateX: 250 })
  .add('.box-3', { translateX: 250 });
```

### Overlapping Animations

```javascript
const tl = createTimeline();

tl.add('.element-1', { translateX: 100 })
  .add('.element-2', { translateY: 100 }, '<')      // Start together
  .add('.element-3', { scale: 1.5 }, '<+=200');     // 200ms after start
```

### Complex Choreography

```javascript
const tl = createTimeline({
  defaults: { duration: 600, ease: 'outQuart' }
});

tl.label('start')
  .add('.header', { translateY: [-50, 0], opacity: [0, 1] })
  .add('.nav-item', { 
    translateY: [-20, 0], 
    opacity: [0, 1],
    delay: stagger(50)
  }, '<+=200')
  .label('content')
  .add('.hero-text', { translateX: [-100, 0], opacity: [0, 1] }, 'content')
  .add('.hero-image', { scale: [0.8, 1], opacity: [0, 1] }, 'content+=100')
  .add('.cta-button', { scale: [0, 1] }, '>-=100');
```

### Looping Timeline

```javascript
const tl = createTimeline({
  loop: true,
  alternate: true,
  loopDelay: 500
});

tl.add('.spinner', { rotate: 360, duration: 1000 })
  .add('.pulse', { scale: [1, 1.2, 1], duration: 600 }, '<');
```

---

## Scroll Animations

### Reveal on Scroll

```javascript
import { animate, onScroll } from 'animejs';

animate('.reveal-element', {
  translateY: [50, 0],
  opacity: [0, 1],
  duration: 800,
  ease: 'outExpo',
  autoplay: onScroll({
    target: '.reveal-element',
    enter: 'bottom 80%'
  })
});
```

### Scroll-Synced Progress Bar

```javascript
animate('.progress-bar', {
  scaleX: [0, 1],
  autoplay: onScroll({
    container: document.documentElement,
    sync: true
  })
});
```

### Parallax Effect

```javascript
animate('.parallax-layer', {
  translateY: [0, -200],
  autoplay: onScroll({
    target: '.parallax-section',
    sync: true,
    ease: 'linear'
  })
});
```

### Horizontal Scroll Animation

```javascript
animate('.horizontal-section', {
  translateX: ['0%', '-300%'],
  autoplay: onScroll({
    container: '.scroll-wrapper',
    axis: 'x',
    sync: true
  })
});
```

---

## SVG Animations

### Line Drawing

```javascript
import { animate, createDrawable } from 'animejs';

const path = createDrawable('path.svg-line');

animate(path, {
  draw: ['0 0', '0 1'],
  duration: 2000,
  ease: 'inOutQuad'
});
```

### Multiple Paths with Stagger

```javascript
const paths = document.querySelectorAll('path');

animate(paths.map(p => createDrawable(p)), {
  draw: ['0 0', '0 1'],
  delay: stagger(200),
  duration: 1500,
  ease: 'inOutQuad'
});
```

### Shape Morphing

```javascript
import { animate, morphTo } from 'animejs';

animate('#shape', {
  d: morphTo('#target-shape'),
  duration: 1000,
  ease: 'inOutQuad'
});
```

### Motion Path

```javascript
import { animate, createMotionPath } from 'animejs';

animate('.car', {
  ...createMotionPath('#road-path'),
  duration: 5000,
  ease: 'linear',
  loop: true
});
```

### SVG Fill & Stroke

```javascript
animate('svg path', {
  fill: ['#3498db', '#e74c3c'],
  stroke: ['#2980b9', '#c0392b'],
  strokeWidth: [2, 4],
  duration: 1000,
  alternate: true,
  loop: true
});
```

---

## Draggable Examples

### Basic Draggable

```javascript
import { createDraggable } from 'animejs';

createDraggable('.drag-me', {
  container: '.container'
});
```

### Snap to Grid

```javascript
createDraggable('.grid-item', {
  x: { snap: 100 },
  y: { snap: 100 },
  container: '.grid-container'
});
```

### Spring Physics

```javascript
import { createDraggable, spring } from 'animejs';

createDraggable('.bouncy', {
  releaseEase: spring({
    stiffness: 150,
    damping: 10,
    mass: 1
  })
});
```

### Carousel/Slider

```javascript
const carousel = createDraggable('.carousel-track', {
  x: true,
  y: false,
  snap: (x) => Math.round(x / slideWidth) * slideWidth,
  onSnap: (self) => {
    const slideIndex = Math.abs(self.x / slideWidth);
    updateIndicator(slideIndex);
  }
});
```

### Draggable with Callbacks

```javascript
createDraggable('.element', {
  container: '.bounds',
  onGrab: (self) => {
    self.target.classList.add('dragging');
  },
  onDrag: (self) => {
    console.log(`Position: ${self.x}, ${self.y}`);
  },
  onRelease: (self) => {
    self.target.classList.remove('dragging');
  },
  onSettle: (self) => {
    console.log('Animation complete');
  }
});
```

---

## Text Animations

### Character by Character

```javascript
import { splitText, animate, stagger } from 'animejs';

const { chars } = splitText('.title', { chars: true });

animate(chars, {
  translateY: [20, 0],
  opacity: [0, 1],
  delay: stagger(30),
  duration: 500,
  ease: 'outQuad'
});
```

### Word by Word Reveal

```javascript
const { words } = splitText('.paragraph', { words: true });

animate(words, {
  translateY: [30, 0],
  opacity: [0, 1],
  delay: stagger(50, { from: 'first' }),
  duration: 600,
  ease: 'outExpo'
});
```

### Line by Line

```javascript
const { lines } = splitText('.text-block', { lines: true });

animate(lines, {
  translateX: [-50, 0],
  opacity: [0, 1],
  delay: stagger(100),
  duration: 800,
  ease: 'outQuart'
});
```

### Typewriter Effect

```javascript
const { chars } = splitText('.typewriter', { chars: true });

chars.forEach(c => c.style.opacity = 0);

animate(chars, {
  opacity: [0, 1],
  delay: stagger(50),
  duration: 10,
  ease: steps(1)   // import { steps } from 'animejs'; string form removed in v4.3
});
```

---

## UI Component Patterns

### Modal Open/Close

```javascript
// Open
function openModal() {
  animate('.modal-backdrop', {
    opacity: [0, 1],
    duration: 300
  });
  
  animate('.modal-content', {
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 400,
    ease: 'outBack'
  });
}

// Close
function closeModal() {
  const tl = createTimeline();
  
  tl.add('.modal-content', {
    scale: [1, 0.9],
    opacity: [1, 0],
    duration: 200
  })
  .add('.modal-backdrop', {
    opacity: [1, 0],
    duration: 200
  }, '<+=100');
  
  return tl;
}
```

### Accordion

```javascript
function toggleAccordion(panel) {
  const isOpen = panel.classList.contains('open');
  const content = panel.querySelector('.content');
  
  if (isOpen) {
    animate(content, {
      height: [content.scrollHeight, 0],
      opacity: [1, 0],
      duration: 300,
      ease: 'outQuad'
    });
  } else {
    animate(content, {
      height: [0, content.scrollHeight],
      opacity: [0, 1],
      duration: 400,
      ease: 'outQuart'
    });
  }
  
  panel.classList.toggle('open');
}
```

### Hamburger Menu Toggle

```javascript
function toggleMenu(isOpen) {
  const tl = createTimeline();
  
  if (isOpen) {
    tl.add('.hamburger .line:nth-child(1)', { 
      rotate: 45, 
      translateY: 8 
    })
    .add('.hamburger .line:nth-child(2)', { 
      opacity: 0 
    }, '<')
    .add('.hamburger .line:nth-child(3)', { 
      rotate: -45, 
      translateY: -8 
    }, '<');
  } else {
    tl.add('.hamburger .line', {
      rotate: 0,
      translateY: 0,
      opacity: 1
    });
  }
  
  return tl;
}
```

### Button Hover

```javascript
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    animate(btn, {
      scale: 1.05,
      duration: 200,
      ease: 'outQuad'
    });
  });
  
  btn.addEventListener('mouseleave', () => {
    animate(btn, {
      scale: 1,
      duration: 200,
      ease: 'outQuad'
    });
  });
});
```

### Loading Spinner

```javascript
const spinner = createTimeline({ loop: true });

spinner
  .add('.spinner-dot', {
    scale: [1, 1.5, 1],
    opacity: [1, 0.5, 1],
    delay: stagger(100),
    duration: 600
  });
```

---

## React Integration

### useAnime Hook

```jsx
import { useRef, useEffect } from 'react';
import { animate, createScope } from 'animejs';

function useAnime(animationFn, deps = []) {
  const scope = useRef(null);
  const root = useRef(null);
  
  useEffect(() => {
    scope.current = createScope({ root: root.current });
    scope.current.add(animationFn);
    
    return () => scope.current.revert();
  }, deps);
  
  return root;
}

// Usage
function AnimatedComponent() {
  const containerRef = useAnime(() => {
    animate('.box', {
      translateX: 100,
      duration: 500
    });
  });
  
  return (
    <div ref={containerRef}>
      <div className="box" />
    </div>
  );
}
```

### Animated List with React

```jsx
import { useRef, useEffect } from 'react';
import { animate, stagger, createScope } from 'animejs';

function AnimatedList({ items }) {
  const containerRef = useRef(null);
  const scopeRef = useRef(null);
  
  useEffect(() => {
    scopeRef.current = createScope({ root: containerRef.current });
    
    scopeRef.current.add(() => {
      animate('.list-item', {
        translateX: [-50, 0],
        opacity: [0, 1],
        delay: stagger(50),
        duration: 400
      });
    });
    
    return () => scopeRef.current.revert();
  }, [items]);
  
  return (
    <ul ref={containerRef}>
      {items.map(item => (
        <li key={item.id} className="list-item">{item.name}</li>
      ))}
    </ul>
  );
}
```

---

## Advanced Patterns

### Chained Animations with Promises

```javascript
async function animationSequence() {
  await animate('.step-1', { translateX: 100 }).then();
  await animate('.step-2', { translateY: 100 }).then();
  await animate('.step-3', { scale: 1.5 }).then();
  console.log('All complete!');
}
```

### Dynamic Value Updates

```javascript
const obj = { value: 0 };

animate(obj, {
  value: 100,
  duration: 2000,
  onUpdate: () => {
    document.querySelector('.counter').textContent = Math.round(obj.value);
  }
});
```

### Responsive Animations with Scope

```javascript
import { createScope, animate } from 'animejs';

const scope = createScope({
  mediaQueries: {
    mobile: '(max-width: 768px)',
    desktop: '(min-width: 769px)'
  }
});

scope.add(({ matches }) => {
  if (matches.mobile) {
    animate('.hero', {
      translateY: [50, 0],
      duration: 500
    });
  } else {
    animate('.hero', {
      translateX: [-100, 0],
      duration: 800
    });
  }
});
```

### Animation with Custom Modifier

```javascript
animate('.element', {
  translateX: {
    to: 500,
    modifier: (value) => Math.round(value / 10) * 10  // Snap to 10px
  }
});
```

### Blend Composition for Smooth Transitions

```javascript
// First animation
animate('.element', {
  translateX: 100,
  composition: 'blend'
});

// Second animation interrupts smoothly
animate('.element', {
  translateY: 100,
  composition: 'blend'  // Blends with existing animation
});
```
