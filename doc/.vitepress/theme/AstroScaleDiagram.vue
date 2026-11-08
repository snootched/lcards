<template>
  <figure class="asd" aria-label="How an astrometrics scene is sized: a galaxy in light years holds a star system in its own units, which holds a planet and a station">
    <!-- the frames: which units each level is measured in -->
    <div class="asd-frames" aria-hidden="true">
      <div class="asd-frame frame-scene">
        <span class="asd-frame-name">The card's scene</span>
        <code>units: ly</code>
      </div>
      <div class="asd-frame frame-system">
        <span class="asd-frame-name">A star system inside it, in units of its own</span>
        <code>type: system · units: km</code>
      </div>
    </div>

    <ol class="asd-levels">
      <li v-for="(lvl, i) in LEVELS" :key="lvl.id" class="asd-level" :class="`lvl-${lvl.frame}`">
        <div class="asd-pic" aria-hidden="true">
          <!-- galaxy: a spiral disc with a marked star -->
          <svg v-if="lvl.id === 'galaxy'" viewBox="0 0 120 80">
            <ellipse cx="60" cy="40" rx="54" ry="24" class="ln faint" />
            <ellipse cx="60" cy="40" rx="36" ry="16" class="ln faint" />
            <path d="M60 40 C 74 30, 96 34, 104 44 M60 40 C 46 50, 24 46, 16 36 M60 40 C 70 52, 92 58, 100 52 M60 40 C 50 28, 28 22, 20 28" class="ln arm" />
            <circle cx="60" cy="40" r="7" class="core" />
            <circle cx="88" cy="48" r="3" class="mark" />
            <rect x="80" y="40" width="16" height="16" class="zoombox" />
          </svg>
          <!-- star system: a sun with orbits and planets -->
          <svg v-else-if="lvl.id === 'system'" viewBox="0 0 120 80">
            <ellipse cx="60" cy="42" rx="50" ry="22" class="ln faint" />
            <ellipse cx="60" cy="42" rx="34" ry="15" class="ln faint" />
            <ellipse cx="60" cy="42" rx="20" ry="9" class="ln" />
            <circle cx="60" cy="42" r="6" class="core" />
            <circle cx="80" cy="42" r="3" class="mark" />
            <circle cx="30" cy="34" r="2.5" class="dot" />
            <circle cx="104" cy="48" r="2" class="dot" />
            <rect x="73" y="35" width="14" height="14" class="zoombox" />
          </svg>
          <!-- planet: a globe with an orbit ring -->
          <svg v-else-if="lvl.id === 'planet'" viewBox="0 0 120 80">
            <ellipse cx="60" cy="42" rx="48" ry="14" class="ln" stroke-dasharray="4 4" />
            <circle cx="60" cy="40" r="22" class="globe" />
            <ellipse cx="60" cy="40" rx="22" ry="8" class="ln faint" />
            <ellipse cx="60" cy="40" rx="9" ry="22" class="ln faint" />
            <circle cx="104" cy="45" r="2.5" class="mark" />
            <rect x="97" y="38" width="14" height="14" class="zoombox" />
          </svg>
          <!-- station: a ring station with docking arms -->
          <svg v-else viewBox="0 0 120 80">
            <ellipse cx="60" cy="40" rx="40" ry="14" class="ln station" />
            <ellipse cx="60" cy="40" rx="24" ry="8" class="ln station" />
            <ellipse cx="60" cy="40" rx="9" ry="9" class="core" />
            <path d="M60 26 L60 10 M60 54 L60 70 M28 34 L16 22 M92 34 L104 22 M28 46 L16 58 M92 46 L104 58" class="ln station" />
          </svg>
        </div>
        <div class="asd-title">{{ lvl.title }}</div>
        <div class="asd-size">{{ lvl.size }}</div>
        <p class="asd-what">{{ lvl.what }}</p>
        <code class="asd-key">{{ lvl.key }}</code>
        <span v-if="i < LEVELS.length - 1" class="asd-zoom" aria-hidden="true">zoom in</span>
      </li>
    </ol>

    <div class="asd-modes">
      <section class="asd-mode">
        <svg viewBox="0 0 160 70" aria-hidden="true">
          <circle cx="24" cy="35" r="12" class="core" />
          <ellipse cx="24" cy="35" rx="50" ry="18" class="ln faint" />
          <ellipse cx="24" cy="35" rx="96" ry="30" class="ln faint" />
          <circle cx="72" cy="38" r="8" class="globe" />
          <circle cx="116" cy="46" r="10" class="globe" />
        </svg>
        <div class="asd-mode-title">Built to fit</div>
        <p>Your own scene units. Sizes and distances are picked so everything shows at once. Most starters, and the easy way to start.</p>
      </section>
      <section class="asd-mode">
        <svg viewBox="0 0 160 70" aria-hidden="true">
          <circle cx="12" cy="35" r="3" class="core" />
          <circle cx="58" cy="30" r="1.2" class="mark" />
          <circle cx="104" cy="44" r="1.2" class="mark" />
          <circle cx="150" cy="36" r="1.2" class="mark" />
          <text x="58" y="22" class="lbl">EARTH</text>
          <text x="104" y="58" class="lbl">MARS</text>
          <text x="150" y="28" class="lbl" text-anchor="end">JUPITER</text>
        </svg>
        <div class="asd-mode-title">True scale</div>
        <p>Named units (<code>ly</code>, <code>pc</code>, <code>au</code>, <code>km</code>, <code>m</code>) and the real numbers. Planets are dots from across their system, so labels and markers carry the view.</p>
      </section>
    </div>
  </figure>
</template>

<script setup>
// The levels of a scene, from the outside in. Sizes are the real ones the
// true-scale starters use (Milky Way, the Solar System to Neptune, Earth and
// its geostationary orbit, Deep Space 9).
const LEVELS = [
  { id: 'galaxy', frame: 'scene', title: 'Galaxy', size: '100,000 ly across', what: 'Territories, nebulas, routes and named stars.', key: 'type: galaxy' },
  { id: 'system', frame: 'system', title: 'Star system', size: '9 billion km to Neptune', what: 'A scene at a point of the galaxy: a sun, orbits and planets.', key: 'type: system' },
  { id: 'planet', frame: 'system', title: 'Planet', size: '6,371 km radius', what: 'A globe with its map, moons and orbits.', key: 'type: sphere' },
  { id: 'station', frame: 'system', title: 'Ship or station', size: 'about 1.5 km', what: 'A 3D model; its length is always in metres.', key: 'type: model' }
]
</script>

<style scoped>
.asd {
  --asd-scene: #b85400;
  --asd-system: #2f6db8;
  --asd-ink: var(--vp-c-text-2);
  margin: 20px 0 24px;
  font-size: 14px;
  container-type: inline-size;
}
:global(html.dark) .asd {
  --asd-scene: #ff9c3a;
  --asd-system: #7ea9ff;
}

/* frame brackets: the scene spans the first level, the system the other three */
.asd-frames { display: grid; grid-template-columns: 1fr 3fr; gap: 12px; margin-bottom: 8px; }
.asd-frame {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px;
  padding: 4px 12px 6px;
  border-top: 6px solid var(--frame);
  border-radius: 14px 14px 0 0;
  background: color-mix(in srgb, var(--frame) 8%, var(--vp-c-bg));
}
.frame-scene { --frame: var(--asd-scene); }
.frame-system { --frame: var(--asd-system); }
.asd-frame-name {
  font-family: Antonio, var(--vp-font-family-base);
  font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--frame);
}
.asd-frame code { font-size: 12px; }

.asd-levels { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.asd-level {
  position: relative; margin: 0;
  display: flex; flex-direction: column; gap: 4px;
  padding: 10px 12px 12px;
  border: 1px solid color-mix(in srgb, var(--lvl) 45%, transparent);
  border-left: 8px solid var(--lvl);
  border-radius: 14px 6px 6px 14px;
  background: color-mix(in srgb, var(--lvl) 5%, var(--vp-c-bg));
}
.lvl-scene { --lvl: var(--asd-scene); }
.lvl-system { --lvl: var(--asd-system); }
.asd-pic { background: #000; border-radius: 6px; padding: 4px; }
.asd-pic svg { display: block; width: 100%; height: auto; }
.asd-title {
  font-family: Antonio, var(--vp-font-family-base);
  font-size: 17px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--lvl);
}
.asd-size { font-weight: 600; color: var(--vp-c-text-1); }
.asd-what { margin: 0; color: var(--asd-ink); line-height: 1.45; flex: 1; }
.asd-key { align-self: flex-start; font-size: 12px; }
.asd-zoom {
  position: absolute; top: 52px; right: -6px; transform: translate(50%, -50%);
  z-index: 1; padding: 1px 6px; border-radius: 999px;
  background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider);
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--asd-ink); white-space: nowrap;
}

/* drawing: lines in the level colour on a black screen */
.ln { fill: none; stroke: var(--lvl, var(--asd-system)); stroke-width: 1.4; }
.ln.faint { opacity: 0.45; }
.ln.arm { stroke: var(--asd-scene); stroke-width: 2; opacity: 0.8; }
.ln.station { stroke: #c9c9d6; stroke-width: 2; }
.core { fill: #ffc766; }
.globe { fill: color-mix(in srgb, var(--asd-system) 55%, #000); stroke: var(--asd-system); stroke-width: 1.2; }
.mark { fill: #fff; }
.dot { fill: #c9c9d6; }
.zoombox { fill: none; stroke: #fff; stroke-width: 1; stroke-dasharray: 3 2; }
.lbl { fill: #c9c9d6; font: 600 8px Antonio, sans-serif; letter-spacing: 0.04em; }

.asd-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.asd-mode {
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.asd-mode svg { display: block; width: 100%; height: auto; max-height: 90px; background: #000; border-radius: 6px; margin-bottom: 6px; }
.asd-mode .ln { stroke: var(--asd-system); }
.asd-mode-title {
  font-family: Antonio, var(--vp-font-family-base);
  font-size: 16px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--vp-c-text-1);
}
.asd-mode p { margin: 4px 0 0; color: var(--asd-ink); line-height: 1.45; }

/* narrow content: two columns, the frames become labels on each level */
@container (max-width: 560px) {
  .asd-frames { display: none; }
  .asd-levels { grid-template-columns: 1fr 1fr; }
  .asd-zoom { display: none; }
  .asd-level::before {
    content: 'scene, ly';
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--lvl);
  }
  .lvl-system::before { content: 'system, km'; }
}
@container (max-width: 400px) {
  .asd-levels, .asd-modes { grid-template-columns: 1fr; }
  .asd-pic svg { max-height: 110px; }
}
</style>
