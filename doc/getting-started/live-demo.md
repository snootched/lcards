---
description: "The new features of this LCARdS release, live: astrometrics scenes, WebGL backgrounds, grid surfaces, warp spectrum, animation presets, the ring gauge and the alert band, as real cards you can try."
aside: false
---

# Live Demo

What is new in LCARdS {{ data.release }}, running live: every view below is made of real LCARdS cards from this version, on sample entities, laid out the way a Home Assistant sections view lays them out. Pick a view, try the controls (the alert buttons, sliders, taps on the cards), then open **YAML of this view** to copy it, or follow the **Docs** button on the view to read about the feature.

The same views make up the demo dashboard the LCARdS developers check every release on. In your own Home Assistant, paste a view's YAML into a dashboard view (**Edit dashboard > Raw configuration editor**), and swap the sample `lcards_test_*` entities for your own.

<DemoBoard />

<script setup>
import { data } from '../.vitepress/theme/demo.data.js'
</script>
