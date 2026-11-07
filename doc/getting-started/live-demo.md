---
description: "LCARdS running live, by topic: astrometrics scenes, WebGL backgrounds, grid surfaces, charts, data grids, alerts and animation, as real cards you can try."
aside: false
sidebar: false
pageClass: demo-wide
---

# Live Demo

LCARdS running live: every view below is made of real LCARdS cards from this version, on sample entities, laid out the way a Home Assistant sections view lays them out. Open a topic in the menu and pick a view, try the controls (the alert buttons, sliders, taps on the cards), then open **YAML of this view** to copy it, or follow the **Docs** button on the view to read about the feature. <span v-if="data.releases.length > 1">**Show** at the top of the menu picks one release: the views of what is new in <span v-text="data.release"></span>, or of an earlier release.</span>

The same views make up the demo dashboard the LCARdS developers check every release on.

<DemoBoard />

## In your own Home Assistant

Paste a view's YAML into a dashboard view (**Edit dashboard > Raw configuration editor**). The views drive `lcards_test_*` helpers (sliders, toggles, a select), so they work unchanged once those helpers exist: add this to `configuration.yaml` (or a file in your `packages/` folder) and restart Home Assistant. Afterwards you can delete the helpers again, or swap them for your own entities in the YAML.

<pre class="demo-helpers"><code>{{ data.helpers }}</code></pre>

A few views also read a real temperature sensor, `sensor.desk_sensor_temperature`: replace it with any temperature sensor of yours.

<script setup>
import { data } from '../.vitepress/theme/demo.data.js'
</script>

<style scoped>
.demo-helpers {
  overflow-x: auto;
  padding: 16px;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  font-size: 13px;
  line-height: 1.5;
}
</style>
