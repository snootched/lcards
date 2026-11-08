# Animation Preset Reference

**Every built-in animation preset, with the keys it takes and their defaults.** Pick a preset with `preset:` on an entry in a card's `animations` list ([Animations](../animations.md)), and give its own keys under `params`.

- The timing keys `duration`, `ease`, `loop`, `alternate` and `delay` can go at the top of the entry or under `params`; when both are set, the top-level value wins. The defaults in the tables below are each preset's own, used when you set neither.
- On a preset that runs one anime.js animation, a timing key the preset doesn't set itself still reaches anime.js: a `loop`, `alternate` or `delay` on the entry applies even when the preset's table doesn't list it.
- Without `target`, a preset animates the whole card. Aim it at one part with `target`: `.button-bg` is a button's shape and `[data-field-id='name']` one of its text fields.
- Most presets have a playground under their table: change the keys and watch the result.

---

## Motion Presets

**Presets that move, scale, turn or fade the whole target.** They suit a button's feedback on tap, an attention loop while something is on, or an entrance on load.

### `pulse`

**A breathing effect: the target grows a little and brightens, then settles back, over and over.** Use it to draw the eye to a card while something needs attention.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: PULSE
    show: true
animations:
  - trigger: on_load
    preset: pulse
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_scale` | number | `1.15` | Peak scale (alias `scale`) |
| `max_brightness` | number | `1.4` | Peak brightness; `1` is normal |
| `duration` | number | `1200` | ms each way (out, then back with `alternate`) |
| `ease` | string | `inOutSine` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `true` | Play back the other way on each loop |

<AnimationPlayground preset="pulse" />

### `glow`

**An animated drop-shadow bloom round the target.** The shadow grows from `blur_min` to `blur_max` and back.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: GLOW
    show: true
animations:
  - trigger: on_load
    preset: glow
    params:
      color: var(--lcars-orange)
      blur_max: 14
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `var(--lcars-blue)` | Glow colour (alias `glow_color`) |
| `blur_min` | number | `0` | Smallest shadow blur, px |
| `blur_max` | number | `10` | Largest shadow blur, px |
| `duration` | number | `1500` | ms each way |
| `ease` | string | `inOutSine` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `true` | Play back the other way on each loop |

<AnimationPlayground preset="glow" />

### `shake`

**A quick side-to-side vibration that ends where it started.** Good on tap, or on an entity change that means "no".

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO SHAKE
    show: true
animations:
  - trigger: on_tap
    preset: shake
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intensity` | number | `10` | Largest displacement, px |
| `frequency` | number | `4` | Number of side-to-side shakes |
| `duration` | number | `500` | Whole shake, ms |
| `ease` | string | `inOutSine` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="shake" />

### `bounce`

**An elastic scale bounce: the target pops up and settles, a few times.**

- With more than one bounce (the default is 3), the preset sets the easing to `outQuad` and multiplies `duration` by `bounces`, so the default bounce takes 2400 ms. Your own `ease` is not used then; set `bounces: 1` for one bounce with your own easing and duration.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO BOUNCE
    show: true
animations:
  - trigger: on_tap
    preset: bounce
    params:
      scale_max: 1.1
      bounces: 2
      duration: 300
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `scale_max` | number | `1.2` | Peak scale of the first bounce; later bounces are a little lower |
| `bounces` | number | `3` | Number of bounces |
| `duration` | number | `800` | ms per bounce |
| `ease` | string | `outElastic` | Easing, used only when `bounces` is `1` or less |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="bounce" />

### `rotate`

**Turns the target round its centre.** Set `from` and `to` for any angle, or `direction` for a full turn.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO TURN
    show: true
animations:
  - trigger: on_tap
    preset: rotate
    params:
      direction: counterclockwise
```

::: details More about rotate
- **`direction` wins:** when `direction` is set, `from` and `to` are ignored. A value other than `clockwise` or `counterclockwise` logs a warning and turns clockwise.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `from` | number | `0` | Start angle, degrees |
| `to` | number | `360` | End angle, degrees |
| `direction` | string | - | `clockwise` (0 to 360) or `counterclockwise` (0 to -360) |
| `duration` | number | `1000` | ms |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="rotate" />

### `blink`

**A slow opacity blink between full and dim.**

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: BLINK
    show: true
animations:
  - trigger: on_load
    preset: blink
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_opacity` | number | `1` | Brightest opacity |
| `min_opacity` | number | `0.3` | Dimmest opacity |
| `duration` | number | `1200` | ms each way |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `true` | Play back the other way on each loop |

<AnimationPlayground preset="blink" />

### `strobe`

**A rapid opacity flicker between full and off.** The same as `blink` with a short cycle and a full fade.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: STROBE
    show: true
animations:
  - trigger: on_load
    preset: strobe
    params:
      min_opacity: 0.2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_opacity` | number | `1` | Brightest opacity |
| `min_opacity` | number | `0` | Dimmest opacity |
| `duration` | number | `100` | ms each way |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `true` | Play back the other way on each loop |

<AnimationPlayground preset="strobe" />

### `skew`

**Slants the target horizontally, vertically or both.**

- Without `from_skewX` or `from_skewY` the skew starts at `0`; set either to start from another slant.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO SKEW
    show: true
animations:
  - trigger: on_tap
    preset: skew
    loop: 1
    alternate: true
    params:
      skewX: -15
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `skewX` | number | `0` | End horizontal skew, degrees |
| `skewY` | number | `0` | End vertical skew, degrees |
| `from_skewX` | number | `0` | Start horizontal skew, degrees |
| `from_skewY` | number | `0` | Start vertical skew, degrees |
| `duration` | number | `600` | ms |
| `ease` | string | `inOutQuad` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="skew" />

---

### `fade`

**A plain opacity change from one value to another.** From `0` to `1` it is a fade-in entrance; the default dims the target to `0.3`.

- With `alternate`, the target is set back to its `from` opacity when the animation ends.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: FADE IN
    show: true
animations:
  - trigger: on_load
    preset: fade
    params:
      from: 0
      to: 1
      duration: 1500
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `from` | number | `1` | Start opacity |
| `to` | number | `0.3` | End opacity |
| `duration` | number | `1000` | ms |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="fade" />

### `slide`

**Slides the target in from one side to its place.** Use it for an entrance on load or on show.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: SLIDE IN
    show: true
animations:
  - trigger: on_load
    preset: slide
    params:
      from: left
      distance: 60
```

::: details More about slide
- **`up` and `down`:** an older pair, also accepted, maps the opposite way to what the names suggest: `up` behaves like `bottom` and `down` like `top`. Use `left`, `right`, `top` and `bottom`.
- **An unknown side** logs a warning and slides in from the right.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `from` | string | `right` | The side it comes from: `left`, `right`, `top` or `bottom` (alias `direction`) |
| `distance` | number / string | `100` | How far it travels: px, or a string with `%` |
| `duration` | number | `600` | ms |
| `ease` | string | `outQuad` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="slide" />

### `scale`

**Scales the target from one size to another.** Short and quick by default, for button feedback.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO SCALE
    show: true
animations:
  - trigger: on_tap
    preset: scale
    loop: 1
    alternate: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `scale` | number | `1.1` | End scale |
| `from` | number | `1` | Start scale |
| `duration` | number | `200` | ms |
| `ease` | string | `outQuad` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="scale" />

### `scale-reset`

**Returns the target to its normal size from wherever it is.** Pair it with `on_leave` to undo a `scale` on `on_hover`.

- It never loops or alternates, whatever `loop` and `alternate` say.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: HOVER ME
    show: true
animations:
  # grow on hover
  - trigger: on_hover
    preset: scale
    params:
      scale: 1.1
  # back to normal when the pointer leaves
  - trigger: on_leave
    preset: scale-reset
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number | `200` | ms |
| `ease` | string | `outQuad` | Easing |

<AnimationPlayground preset="scale-reset" />

---

## Text Animation Presets

**Presets that animate a card's text character by character, word by word or line by line.** Without `target` they animate every text field of the card; `target: "[data-field-id='name']"` limits one to a single field.

### `text-reveal`

**Characters, words or lines fade and rise into place one after another.**

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: SENSOR ARRAY ONLINE
    show: true
animations:
  - trigger: on_load
    preset: text-reveal
    target: "[data-field-id='name']"
  - trigger: on_tap
    preset: text-reveal
    target: "[data-field-id='name']"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `split` | string | `chars` | The unit: `chars`, `words` or `lines` |
| `direction` | string / number | `first` | Where the stagger starts: `first`, `last`, `center`, `random`, or a unit's index |
| `stagger` | number | `50` | ms between one unit and the next |
| `duration` | number | `800` | ms per unit |
| `ease` | string | `outQuad` | Easing |
| `from_opacity` | number | `0` | Start opacity of each unit |
| `from_y` | number | `20` | Start offset below its place, px |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="text-reveal" />

### `text-decode`

**An LCARS readout decode: each text line starts as glyph noise and resolves character by character.** It is built on anime.js's [`scrambleText`](https://animejs.com/documentation/text/scrambletext). Good on `on_show`, and on `on_entity_change` for a value that decodes again when it changes.

- Stopping it puts the real text back; under reduced motion the text shows at once.

```yaml live
type: custom:lcards-button
preset: lozenge
entity: sensor.desk_sensor_temperature
tap_action:
  action: none
text:
  name:
    content: DESK SENSOR
    show: true
  state:
    show: true
animations:
  - trigger: on_show
    preset: text-decode
  # the reading decodes again when it changes
  - trigger: on_entity_change
    entity: sensor.desk_sensor_temperature
    preset: text-decode
    params:
      chars: numbers
      duration: 600
```

<CardGallery set="text-decode" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number | `1000` | ms for the whole decode of a line |
| `chars` | string | `A-Z0-9` | Scramble glyphs: a named set (`uppercase`, `lowercase`, `numbers`, `symbols`, `blocks`, `shades`, `braille`) or characters and ranges such as `A-F0-9` (put a literal `-` first or last) |
| `from` | string | `left` | Where the reveal starts: `left`, `right`, `center` or `random` |
| `reversed` | boolean | `false` | Reveal in the opposite order (`from: center` then reveals the edges first) |
| `cursor` | boolean / string | `false` | Characters at the reveal edge: `true` for `_`, or a string. Best seen on a slower decode |
| `perturbation` | number | - | `0` to `1`: random timing per character, for a less even reveal |
| `reveal_rate` | number | - | Characters per second entering the reveal (anime.js default `60`) |
| `seed` | number | - | The same scramble on every load |
| `delay` | number | `0` | ms before it starts |
| `loop` | boolean / number | `false` | Decode again on every loop |

<AnimationPlayground preset="text-decode" />

### `text-scramble`

**The same decode as [`text-decode`](#text-decode) under its original name, with its original timing keys.** Each character scrambles for `duration`, and characters start `stagger` ms apart, so a line takes `duration` + (characters - 1) × `stagger` ms.

- Every `text-decode` key works here too (`from`, `cursor`, `perturbation`, `reveal_rate`, `seed`, ...).

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO SCRAMBLE
    show: true
animations:
  - trigger: on_tap
    preset: text-scramble
    params:
      stagger: 30
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number | `800` | ms each character spends scrambling |
| `stagger` | number | `40` | ms between characters starting |
| `characters` | string | `A-Z0-9!@#$%^&*` | Scramble glyphs, as `text-decode`'s `chars` (`chars` works too) |
| `delay` | number | `0` | ms before it starts |
| `loop` | boolean / number | `false` | Scramble again on every loop |
| `settle_at` | number | - | Deprecated and no longer used: the decode settles each character itself |

<AnimationPlayground preset="text-scramble" />

### `text-glitch`

**Characters jitter out of place for a glitch or malfunction effect.**

- The easing is always `inOutQuad`; an `ease` you set is not used.
- `color_shift` works on HTML text only (a data grid's cells); a card's SVG text ignores it.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: SUBSPACE INTERFERENCE
    show: true
animations:
  - trigger: on_load
    preset: text-glitch
    target: "[data-field-id='name']"
    loop: true
    params:
      intensity: 3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intensity` | number | `5` | Largest displacement, px or SVG units |
| `duration` | number | `300` | ms per glitch |
| `stagger` | number | `50` | ms between characters |
| `color_shift` | boolean | `false` | Also shift each character's hue (HTML text only) |
| `seed` | number | - | The same jitter on every load |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="text-glitch" />

### `text-typewriter`

**Characters appear one at a time at a steady speed, like a typed message.**

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: INCOMING TRANSMISSION
    show: true
animations:
  - trigger: on_load
    preset: text-typewriter
    target: "[data-field-id='name']"
  - trigger: on_tap
    preset: text-typewriter
    target: "[data-field-id='name']"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `speed` | number | `100` | ms per character |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="text-typewriter" />

---

## Visual Effect Presets

**Presets for shimmer, flicker, ripple and glitch effects.**

### `shimmer`

**Fades the target's opacity and, optionally, its colour, back and forth.**

- The colour animates only when both `color_from` and `color_to` are set; otherwise only the opacity moves.
- It animates the CSS `color`, which shows on HTML text (a data grid's cells), not on a card's SVG shapes.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: SHIMMER
    show: true
animations:
  - trigger: on_load
    preset: shimmer
    params:
      opacity_to: 0.6
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color_from` | colour | - | Start colour |
| `color_to` | colour | - | End colour (alias `shimmer_color`) |
| `opacity_from` | number | `1` | Start opacity |
| `opacity_to` | number | `0.5` | End opacity |
| `duration` | number | `1500` | ms each way |
| `ease` | string | `inOutSine` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `true` | Play back the other way on each loop |

<AnimationPlayground preset="shimmer" />

### `flicker`

**A random opacity flicker, like a failing panel light.**

- Each loop draws a new random pattern, unless `seed` fixes it. Targets with the same seed flicker the same way.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: FLICKER
    show: true
animations:
  - trigger: on_load
    preset: flicker
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_opacity` | number | `1` | Brightest opacity, and where it ends |
| `min_opacity` | number | `0.3` | Dimmest opacity |
| `duration` | number | `1000` | ms per flicker pattern |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `seed` | number | - | The same random pattern on every load |

<AnimationPlayground preset="flicker" />

### `cascade`

**One property animated across several targets, each starting a little after the last.** Aim it at a group with `target`, such as a data grid's cells.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(8, 1fr)
  grid-template-rows: repeat(4, auto)
animations:
  - trigger: on_load
    preset: cascade
    target: .grid-cell
    params:
      stagger: 40
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `stagger` | number | `100` | ms between one target and the next |
| `property` | string | `opacity` | The property to animate |
| `from` | number | `0` | Start value |
| `to` | number | `1` | End value |
| `duration` | number | `1000` | ms per target |
| `ease` | string | `outExpo` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="cascade" />

### `ripple`

**The target grows and fades out, like a ripple spreading.**

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO RIPPLE
    show: true
animations:
  - trigger: on_tap
    preset: ripple
    loop: 1
    alternate: true
    params:
      scale_max: 1.2
      opacity_min: 0.3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `scale_max` | number | `1.5` | End scale |
| `opacity_min` | number | `0` | End opacity |
| `duration` | number | `1000` | ms |
| `ease` | string | `outExpo` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="ripple" />

### `glitch`

**Random jumps in position and hue for a malfunction effect.**

- The easing is always `linear`; an `ease` you set is not used.
- Each loop draws a new random pattern, unless `seed` fixes it. Targets with the same seed glitch the same way.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO GLITCH
    show: true
animations:
  - trigger: on_tap
    preset: glitch
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intensity` | number | `5` | Largest displacement, px |
| `frequency` | number | `10` | Number of glitch steps |
| `duration` | number | `1000` | ms |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `seed` | number | - | The same random pattern on every load |

<AnimationPlayground preset="glitch" />

---

## Color Animation Presets

**Presets that animate a colour.** On a card's SVG shapes animate `fill` or `stroke`; the CSS `color` shows only on HTML text such as a data grid's cells.

### `color-shift`

**Animates one colour property from one colour to another.**

- On a card, aim it at the shape with `target`: without one it runs on the card's outer element, where `fill` changes nothing. A button's shape is `.button-bg` (a `rect`, or a `path` when the corners differ).

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO SHIFT
    show: true
animations:
  - trigger: on_tap
    preset: color-shift
    target: .button-bg
    loop: 1
    alternate: true
    params:
      property: fill
      color_from: var(--lcars-orange)
      color_to: var(--lcars-blue)
      duration: 600
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color_from` | colour | required | Start colour; without it (or `color_to`) nothing animates |
| `color_to` | colour | required | End colour |
| `property` | string | `color` | `fill` or `stroke` for a card's SVG shapes; `color` or `background-color` for HTML targets |
| `duration` | number | `1000` | ms |
| `ease` | string | `inOutQuad` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="color-shift" />

### `cascade-color`

**The LCARS colour cascade: the target holds one colour, snaps to a second and flashes a third, then repeats.** It is made for a data grid's cells, where the card runs it row by row ([data grid cascade](../../cards/data-grid/styling.md#the-cascade)), with `params.pattern` for the row timing.

- The default `property` is `color`, which suits a data grid's HTML cells; on a card's SVG shapes set `fill` or `stroke`.
- One `cascade-color` on a whole set of targets changes them all together. The row-by-row waterfall comes from one animation per row, each with its own `delay` and `duration`, which the data grid sets up for you.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(8, 1fr)
  grid-template-rows: repeat(4, auto)
animations:
  - trigger: on_load
    preset: cascade-color
```

::: details More about cascade-color
- **The cycle:** the first colour holds for 75% of `duration`, the second for about 15%, and the third shows for the last 10%.
- **`mode`:** both modes run on anime.js; `animejs` adds the per-target stagger (`stagger_from`, `stagger_delay`, `axis`) and the hover pause (`interactive`). Setting `interactive`, `stagger_from` or an `axis` other than `row` switches to `animejs` even when `mode` says `css`. The animation editor doesn't show `mode`; set it in YAML.
- **`delay`:** one start offset for the whole cascade, not a step between targets (that is `stagger_delay`).
- **`axis` without `stagger_from`** has no effect.
- **The data grid's keys:** `pattern`, `speed_multiplier` and `timing` are read by the data grid card, not by this preset; see the [data grid cascade](../../cards/data-grid/styling.md#the-cascade).
- **The playground** below sets `stagger_from` so a single animation shows a stagger; that isn't the preset's default.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `colors` | list | the theme's cascade colours | Three colours: `[start, mid, end]`; extra entries are ignored |
| `property` | string | `color` | The property to animate |
| `mode` | string | `css` | `css` or `animejs`; see the details above |
| `duration` | number | `5000` | ms per full cycle |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `true` | Play back the other way on each loop |
| `delay` | number | `0` | ms before the whole cascade starts |
| `stagger_delay` | number | `100` | ms between targets, `animejs` mode only |
| `stagger_from` | string | - | Where the stagger starts: `first`, `last`, `center` or `random` |
| `axis` | string | `row` | With `stagger_from`: `row` follows the order of the targets; `column` staggers by layout position, row by row downward |
| `interactive` | boolean | `false` | Pause on hover and resume on leave; with `stagger_from`, hovering any target pauses the whole cascade |

<AnimationPlayground preset="cascade-color" />

---

## SVG-Specific Presets

**Presets that need an SVG shape or line: drawing it in, marching its dashes, morphing it or moving along it.** An [MSD card](../../cards/msd/animations.md)'s lines and shapes are the natural place, so the examples here use one.

### `draw`

**Draws a line or outline in from one end, as if a pen traced it.** Put it on an MSD line or shape, or aim it at an SVG `path`.

- It animates the stroke only; a filled shape keeps its fill.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 400, 160]
  overlays:
    - id: conduit
      type: line
      anchor: [40, 40]
      attach_to: [360, 120]
      style:
        color: var(--lcars-orange)
        width: 6
      animations:
        - trigger: on_load
          preset: draw
          loop: true
          alternate: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `reverse` | boolean | `false` | Draw from the other end |
| `draw` | list | `['0 0', '0 1']` | anime.js draw values `[start, end]`, each the visible start and end as fractions of the length; wins over `reverse` |
| `duration` | number | `2000` | ms |
| `ease` | string | `inOutSine` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="draw" />

### `march`

**Dashes march along a line, like power flowing through a conduit.** It runs as a CSS animation rather than anime.js, so it costs little to leave running.

- A line with its own `dash_array` keeps its dashes, and the march follows the whole pattern.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 400, 160]
  overlays:
    - id: power_feed
      type: line
      anchor: [40, 40]
      attach_to: [360, 120]
      style:
        color: var(--lcars-blue)
        width: 6
        dash_array: [14, 8]
      animations:
        - trigger: on_load
          preset: march
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dash_length` | number | `10` | Dash length; read from the line's own dashes when it has them |
| `gap_length` | number | `5` | Gap length; read from the line's own dashes when it has them |
| `speed` | number | `2` | Seconds per cycle. Without it, `duration` (ms) sets the cycle; `speed` wins when both are set |
| `direction` | string | `forward` | `forward` or `reverse` |
| `loop` | boolean / number | `true` | `true` marches forever, `false` plays once, a number plays that many times |

<AnimationPlayground preset="march" />

### `morph`

**One SVG shape becomes another, with anime.js's [`morphTo`](https://animejs.com/documentation/svg/morphto).** For example, a status indicator that turns into a warning sign while an alert is on.

- The animated shape is the target, or the first path inside it, so an MSD shape or line overlay works. `to` names the shape it becomes, anywhere in the same card; that shape can be hidden.
- Both shapes must be a `<path>`, `<polygon>` or `<polyline>`: on an MSD that is a `kind: polyline` shape or a line. `rect` and `circle` shapes draw native rectangles and ellipses, which don't morph.
- Stopping puts the original shape back, and `loop` with `alternate` flips between the two.

```yaml live
type: custom:lcards-msd-card
msd:
  base_svg:
    source: none
  view_box: [0, 0, 400, 200]
  overlays:
    - id: status_shape
      type: shape
      kind: polyline
      closed: true
      points:
        - [150, 40]
        - [250, 40]
        - [250, 140]
        - [150, 140]
      corner_style: miter
      style:
        color: var(--lcars-orange)
        fill: var(--lcars-orange)
      animations:
        - trigger: on_load
          preset: morph
          loop: true
          alternate: true
          params:
            to: '[data-overlay-id="warn_shape"]'
            duration: 1200
    - id: warn_shape
      type: shape
      kind: polyline
      closed: true
      points:
        - [200, 40]
        - [250, 140]
        - [150, 140]
      corner_style: miter
      style:
        color: transparent
        fill: transparent
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `to` | string | required | CSS selector of the shape to become, e.g. `[data-overlay-id="warn_shape"]` (older name `morph_to_selector`) |
| `precision` | number | `0.33` | Points sampled per SVG unit of length; higher is smoother. `0` interpolates the raw geometry, which works only when both shapes use the same path commands |
| `duration` | number | `800` | ms |
| `ease` | string | `inOutQuad` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Morph back on each loop |

---

## Stagger Presets

**Presets that animate a group of targets, each one starting a step later than the one before.** They use anime.js's `stagger()`, so they need several elements matched by `target` or `targets`; on a single element there is no visible stagger.

- In these presets `delay` is the step between targets, not one start offset for the animation.
- `stagger-grid` is not the removed `grid-stagger`; to move an old `grid-stagger` config across, see [`grid-stagger` (removed)](#grid-stagger-removed-in-2026-07-x).

### `stagger-grid`

**A wave across a grid of targets, from a corner, the centre, the edges or a cell you pick.** Give the grid's size in `grid` as `[cols, rows]`.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(8, 1fr)
  grid-template-rows: repeat(4, auto)
animations:
  - trigger: on_tap
    preset: stagger-grid
    target: .grid-cell
    params:
      grid: [8, 4]
      from: center
      delay: 50
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `grid` | list | `[1, 1]` | Grid size `[cols, rows]`; a value of another shape logs a warning and nothing animates |
| `from` | string / list | `first` | Wave origin: `first` (top-left), `last`, `center` (outward), `edges` (inward), `random`, `pointer` (where the card was tapped, see [`tap-ripple`](#tap-ripple)), or a `[col, row]` cell counted from `0`. `start` and `end` are aliases of `first` and `last` |
| `axis` | string | - | Stagger along one axis only: `x` (or `row`) delays by column, `y` (or `column`) by row |
| `delay` | number | `100` | ms between one target and the next |
| `reversed` | boolean | `false` | Run the stagger in the opposite order |
| `jitter` | number / list | - | Random ms added to or taken from each target's delay; `[start, end]` ramps it along the stagger order |
| `seed` | number | - | The same jitter and `random` order on every load |
| `property` | string | `scale` | The property to animate |
| `from_value` | number | `0.8` | Start value |
| `to_value` | number | `1` | End value |
| `duration` | number | `600` | ms per target |
| `ease` | string | `outQuad` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="stagger-grid" />

### `stagger-wave`

**A wave rolls through a row of targets: each one lifts and drops back in turn.**

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(10, 1fr)
  grid-template-rows: repeat(2, auto)
animations:
  - trigger: on_tap
    preset: stagger-wave
    target: .grid-cell
    params:
      delay: 60
      amplitude: -12
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `delay` | number | `100` | ms between one target and the next |
| `reversed` | boolean | `false` | Run the wave from the last target |
| `direction` | string | `normal` | `reverse` is the same as `reversed: true` |
| `jitter` | number / list | - | Random ms added to or taken from each target's delay; `[start, end]` ramps it along the stagger order |
| `seed` | number | - | The same jitter on every load |
| `property` | string | `translateY` | The property to animate |
| `amplitude` | number | `-20` | Peak displacement: each target goes `0`, then `amplitude`, then back to `0` |
| `duration` | number | `800` | ms per target |
| `ease` | string | `outElastic` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Play back the other way on each loop |

<AnimationPlayground preset="stagger-wave" />

### `stagger-radial`

**A stagger that spreads outward from a point, measured on where the targets really are.** Use it for a ripple across a group, from the centre, a corner or the tap.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(8, 1fr)
  grid-template-rows: repeat(4, auto)
animations:
  # from the top-left corner, with a little random spread that is the same on every load
  - trigger: on_tap
    preset: stagger-radial
    target: .grid-cell
    params:
      from: [0, 0]
      delay: 40
      jitter: 25
      seed: 7
      property: opacity
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `from` | string / list | `center` | Where the ripple starts: `center`, `first`, `last`, `random`, `pointer` (where the card was tapped, see [`tap-ripple`](#tap-ripple)), or an `[x, y]` point as fractions of the group (`0` to `1`, `[0, 0]` is top-left) |
| `reversed` | boolean | `false` | Run the stagger in the opposite order |
| `jitter` | number / list | - | Random ms added to or taken from each target's delay; `[start, end]` ramps it along the stagger order |
| `seed` | number | - | The same jitter and `random` order on every load |
| `delay` | number | `50` | ms between one ring of targets and the next |
| `property` | string | `scale` | The property to animate |
| `from_value` | number | `0` | Start value |
| `to_value` | number | `1` | End value |
| `duration` | number | `800` | ms per target |
| `ease` | string | `outExpo` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="stagger-radial" />

### `stagger-flash`

**A bright colour sweeps across the targets and leaves a dim one behind, like an LCARS alert bar.** It runs on the browser's own animations rather than anime.js, and each target loops on its own.

- The default `property` is `stroke`, for SVG lines and outlines; for HTML text such as a data grid's cells, set `color`.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(10, 1fr)
  grid-template-rows: repeat(1, auto)
animations:
  - trigger: on_load
    preset: stagger-flash
    target: .grid-cell
    params:
      property: color
      lead_color: var(--lcars-orange)
      trail_color: var(--lcars-blue)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `lead_color` | colour | `var(--primary-color)` | Colour at the front of the sweep |
| `trail_color` | colour | `#444444` | Colour left behind |
| `lead_pct` | number | `20` | Share of each cycle spent going from the lead colour to the trail colour, percent (`1` to `50`) |
| `duration` | number | `2000` | ms per cycle |
| `delay` | number | `duration / 12` | ms between one target and the next |
| `from` | string | `first` | `first`, `last` or `center` |
| `property` | string | `stroke` | The property to animate |
| `with_opacity` | boolean | `true` | Also dim the opacity as the sweep passes |
| `trail_opacity` | number | `0.25` | Opacity left behind, with `with_opacity` |
| `loop` | boolean | `true` | `true` (or any number) sweeps forever; `false` sweeps once |
| `grid` | list | - | `[cols, rows]`; accepted but has no effect on the sweep order |

<AnimationPlayground preset="stagger-flash" />

---

### `tap-ripple`

**A pulse spreads across a group of targets from where the card was tapped.** Each target scales up, dims (and optionally flashes a colour) and settles back, later the further it is from the tap.

- Positions are read from the layout, so it works on data grid cells without a grid size.
- Use it on `on_tap` (also `on_hold` or `on_double_tap`); any other trigger starts it from the centre. On a data grid, a tap anywhere on the grid fires the card's `on_tap` animations, alongside any cell actions.
- `from: pointer` works on `stagger-grid` and `stagger-radial` too, for any stagger that should start at the tap.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid:
  grid-template-columns: repeat(8, 1fr)
  grid-template-rows: repeat(4, auto)
animations:
  - trigger: on_tap
    preset: tap-ripple
    target: .grid-cell
    params:
      color: var(--lcars-orange)
      jitter: 30
```

<CardGallery set="tap-ripple" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `spread` | number | `400` | ms for the wave to reach the farthest target, whatever the layout |
| `scale` | number | `1.08` | Peak scale of each target |
| `opacity_min` | number | `0.4` | Lowest opacity of each target during its pulse |
| `color` | colour | - | Flash colour at the peak of each pulse (theme token, CSS variable or colour) |
| `property` | string | `color` | What `color` sets: `color` for HTML text such as data grid cells, `fill` or `stroke` for SVG shapes |
| `from` | string | `pointer` | Where the wave starts: `pointer`, `center`, `first`, `last` or `random` |
| `reversed` | boolean | `false` | Run the wave inward, ending at the tap point |
| `jitter` | number / list | - | Random extra delay per target (ms, or a `[start, end]` ramp) for a less even wave |
| `seed` | number | - | The same jitter on every load |
| `grid` | list | - | `[cols, rows]` to measure by grid cell instead of by layout position |
| `duration` | number | `500` | ms of one target's pulse |
| `ease` | string | `outQuad` | Easing |

---

## Timeline Presets

**Animations of several steps on one anime.js timeline.** Each step sets its own timing and easing, so the top-level `duration` and `ease` do nothing here. `loop`, `alternate` and `delay` apply to the whole timeline: repeat it, play it back, or wait before it starts.

### `timeline-cascade`

**A timeline of steps you write yourself, each animating any part of the card.**

- A step without `targets` animates the animation's own target.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO RUN
    show: true
animations:
  - trigger: on_tap
    preset: timeline-cascade
    params:
      steps:
        # the shape dims and comes back
        - targets: .button-bg
          params:
            opacity: [1, 0.3, 1]
          duration: 600
        # then the label grows and settles
        - targets: "[data-field-id='name']"
          params:
            scale: [1, 1.2, 1]
          duration: 400
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `steps` | list | required | The steps, at least one |
| `steps[].targets` | string | the animation's target | CSS selector inside the card |
| `steps[].params` | object | - | anime.js properties for the step, such as `scale` or `opacity` with `[from, to]` values |
| `steps[].duration` | number | - | ms |
| `steps[].offset` | number / string | after the previous step | When the step starts; see [step positions](#sequence) |
| `loop` | boolean / number | `false` | Loop the whole timeline |

<AnimationPlayground preset="timeline-cascade" />

### `timeline-attention`

**A fixed three-part "look at me": the target grows, shakes, then settles back.**

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP FOR ATTENTION
    show: true
animations:
  - trigger: on_tap
    preset: timeline-attention
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `scale_max` | number | `1.15` | Peak scale in the first part |
| `shake_intensity` | number | `5` | Largest sideways displacement in the shake, px |
| `duration_scale` | number | `200` | ms to grow |
| `duration_shake` | number | `300` | ms to shake |
| `duration_settle` | number | `400` | ms to settle back |
| `loop` | boolean / number | `false` | Loop the whole sequence |

<AnimationPlayground preset="timeline-attention" />

---

## Effect Presets

**Effects with several parts on one timeline.** Each is one tracked animation: stopping it, or reduced motion, leaves the card as it was.

### `boot-sequence`

**The card powers up: stroked shapes draw in, filled shapes come on, then the text decodes from glyph noise ([`text-decode`](#text-decode)).** Best on `on_show` (each time the card appears) or `on_load`.

- It works on whatever the target has, so a lozenge without a border skips the draw and an elbow without text skips the decode.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: WARP CORE
    show: true
animations:
  - trigger: on_show
    preset: boot-sequence
    params:
      fill: sweep
  - trigger: on_tap
    preset: boot-sequence
    params:
      fill: sweep
```

<CardGallery set="boot-sequence" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number | `1200` | ms for the whole sequence |
| `fill` | string | `flicker` | How filled shapes come on: `flicker` (a panel powering up), `sweep` (wipes in from the `from` side) or `fade` |
| `from` | string | `left` | The side a sweep starts from: `left`, `right`, `top` or `bottom` |
| `draw` | boolean | `true` | Draw stroked shapes in |
| `decode` | boolean | `true` | Decode the text; with `false` the text just appears |
| `chars` | string | `A-Z0-9` | Decode glyphs, as in [`text-decode`](#text-decode) |
| `stagger` | number | `60` | ms between one shape coming on and the next |
| `seed` | number | - | The same decode on every load |
| `delay` | number | `0` | ms before it starts |

### `sensor-sweep`

**A rotating scanner wedge with a ring that pings outward on each turn.** It draws its own shapes, centred on the target (or on `center`), and removes them when it stops; nothing in the card changes.

- On an elbow or an MSD, set `center` and `radius` to put it on a corner or a spot of the ship.

```yaml live
type: custom:lcards-msd-card
msd:
  base_svg:
    source: none
  view_box: [0, 0, 400, 200]
  overlays:
    - id: scanner
      type: shape
      kind: circle
      position: [130, 30]
      size: [140, 140]
      style:
        color: var(--lcars-blue)
        width: 2
      animations:
        - trigger: on_load
          preset: sensor-sweep
          params:
            color: var(--lcars-orange)
```

<CardGallery set="sensor-sweep" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number | `3000` | ms per turn (and per ping) |
| `radius` | number | half the shorter side | SVG units |
| `center` | list | the target's centre | `[x, y]` in the target's SVG units |
| `angle` | number | `40` | Wedge width, degrees (`1` to `359`) |
| `direction` | string | `cw` | `cw` or `ccw` |
| `color` | colour | `theme:colors.ui.primary` | Wedge colour |
| `ring_color` | colour | `color` | Ping ring colour |
| `opacity` | number | `0.35` | Wedge opacity; the ring starts at 2.5 times this (at most `1`) and fades out |
| `ring` | boolean | `true` | Show the ping ring |
| `ring_width` | number | `2` | Ring stroke width, SVG units |
| `delay` | number | `0` | ms before it starts |
| `loop` | boolean / number | `true` | Keep sweeping |

---

## Utility Presets

**Presets for setting values at once, writing raw anime.js, and moving along a path.**

### `set`

**Sets properties at once, without animating.** Use it to put a target in its starting state before other animations run.

- `duration` is always `0`, so `ease` does nothing. A `delay` still waits before the properties are set.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: DIMMED
    show: true
animations:
  - trigger: on_load
    preset: set
    target: .button-bg
    params:
      properties:
        opacity: 0.5
        fill: var(--lcars-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `properties` | object | `{}` | The properties to set, such as `opacity` or `fill` |

<AnimationPlayground preset="set" />

### `custom`

**Raw anime.js v4 animation properties, passed straight to `animate()`: anything a preset doesn't cover.** `params` holds the properties; the element comes from the animation's own `target` or `targets` (a `targets` key inside `params` is ignored).

- Colours (theme tokens, CSS variables) are resolved and the [reduced-motion gate](./timing-and-easing#reduced-motion) applies, as for every preset. The animation editor's **Use custom anime.js code** switch writes this shape.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO WOBBLE
    show: true
animations:
  - trigger: on_tap
    preset: custom
    params:
      scale: [1, 1.08, 1]
      rotate: [0, 3, -3, 0]
      duration: 600
      ease: outQuad
```

::: details More about custom
- **What YAML can't do:** function values and callbacks can't be written in YAML, so stagger, `onComplete` and the like aren't available here; use a [stagger preset](#stagger-presets) or [`sequence`](#sequence) for those.
- **Older configs:** configs from older editors (`type: custom` with an `animejs:` block) still run, but the config checker reports them (they have no `preset`). The editor rewrites them to `preset: custom` when you edit them, or change them by hand.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| any anime.js v4 property | - | - | `opacity`, `scale`, `translateX`, `rotate`, `fill`, `keyframes`, ... with anime.js v4 values (`[from, to]`, keyframe lists, `'+=10'`) |
| `duration` | number | `1000` | ms (anime.js's default) |
| `ease` | string | `out(2)` | Easing (anime.js's default), with the same names as every preset (`outQuad`, `inOutSine`, ...) |
| `loop` | boolean / number | `false` | As in anime.js |
| `alternate` | boolean | `false` | As in anime.js |
| `delay` | number | `0` | As in anime.js |

### `motionpath`

**Moves something along the route of an SVG line or shape, with anime.js v4's `createMotionPath()`.** It works in two ways:

- **Move an element:** set `target` or `targets` to the element that travels, and `params.path` to a different element that is the route (a line's id, for example). Pointing `path` at the element being animated logs a warning and does nothing.
- **A tracer:** set `params.shape` and leave out `target`; the preset makes a small dot, square or diamond and moves it along `path`, for energy flowing along a line. It can sit on the line's own `animations`, with `path` naming that line. If `shape` and a `target` are both set, `shape` wins (with a warning).

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 400, 160]
  overlays:
    - id: route
      type: line
      anchor: [40, 40]
      attach_to: [360, 120]
      style:
        color: var(--lcars-blue)
        width: 4
      animations:
        # a dot travels the line and back
        - trigger: on_load
          preset: motionpath
          duration: 3000
          loop: true
          alternate: true
          params:
            path: "#route"
            shape:
              type: circle
              size: 14
              fill: var(--lcars-orange)
```

::: details More about motionpath
- **The route:** `path` is looked up inside the card when it starts with `#` or `.`. It can be any SVG geometry (`path`, `circle`, `rect`, `ellipse`, `line`, `polyline`, `polygon`); when it names a wrapper group instead (such as an MSD line's `<g id="...">`), the drawn geometry inside it is used.
- **Moving a control along a line:** `target: "#my-control-id"` with `params.path: "#line_2"` moves the control and leaves the line as it is.
- **The shape keys** mirror line markers' (`marker_start`, `marker_end`) styling.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `path` | string | required | CSS selector (`#id` or `.class`) of the route |
| `duration` | number | `4000` | ms for one pass along the path |
| `ease` | string | `linear` | Easing |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |
| `alternate` | boolean | `false` | Travel back on each loop |
| `rotate` | boolean | `true` | Turn the element or shape to face the way it travels |
| `anchor` | string | `50% 50%` | CSS `transform-origin`: the point it turns round |
| `shape.type` | string | `circle` | Tracer shape: `circle`, `rect` or `diamond` |
| `shape.size` | number | `10` | Diameter (circle, diamond), or width and height (rect), px |
| `shape.width` | number | `shape.size` | `rect` only: width |
| `shape.height` | number | `shape.size` | `rect` only: height |
| `shape.fill` | colour | `currentColor` | Fill colour |
| `shape.stroke` | colour | `none` | Stroke colour |
| `shape.stroke_width` | number | `0` | Stroke width, px |

<AnimationPlayground preset="motionpath" />

---

## Advanced Presets

**Timelines of raw steps, random motion and spring physics.**

### `sequence`

**A timeline of steps, each with its own anime.js properties, target and start time.** One sequence can move between parts of a card: draw a line, then light a control, then fade in a label.

- Each step can name its own `target`, a CSS selector resolved inside the card; without one, a step animates the animation's own target. In an MSD card the selector reaches every overlay of the card, for example `[data-overlay-id="line_1"]`.
- The whole sequence is one timeline, however many elements it animates.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO REPLAY
    show: true
animations:
  # the fill fades in, then the label
  - trigger: on_show
    preset: sequence
    params:
      steps:
        - target: .button-bg
          opacity: [0, 1]
          duration: 400
        - target: "[data-field-id='name']"
          opacity: [0, 1]
          duration: 300
          offset: "-=150"
  - trigger: on_tap
    preset: sequence
    params:
      steps:
        - target: .button-bg
          opacity: [0, 1]
          duration: 400
        - target: "[data-field-id='name']"
          opacity: [0, 1]
          duration: 300
          offset: "-=150"
```

Step positions (`offset`):

| Value | Starts |
|---|---|
| (none) | When the previous step ends |
| `500` | At 500 ms from the start of the sequence |
| `'+=200'` / `'-=200'` | 200 ms after / before the previous step ends |
| `'<'` | When the previous step ends |
| `'<<'` | Together with the previous step |

::: details More about sequence
- **`at`:** an older name for `offset`, still accepted; `offset` wins when a step sets both.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `steps` | list | required | The steps, at least one; each takes the properties of an anime.js `animate()` call |
| `steps[].target` | string | the animation's target | CSS selector inside the card |
| `steps[].offset` | number / string | after the previous step | When the step starts; see the step positions above |
| `steps[].duration` | number | the sequence's `duration` | ms |
| `steps[].ease` | string | the sequence's `ease` | Easing |
| `duration` | number | `2000` | ms of a step that doesn't set its own |
| `ease` | string | `outQuad` | Easing of a step that doesn't set its own |
| `loop` | boolean / number | `false` | Loop the whole sequence |

<AnimationPlayground preset="sequence" />

### `grid-stagger` (removed in 2026.07.x)

**`grid-stagger` was removed in 2026.07.x; use [`stagger-grid`](#stagger-grid) instead.** It never staggered: every element got the same timing whatever the config. `preset: grid-stagger` in an existing config no longer runs.

- The move to `stagger-grid` is not a plain rename; the table below maps the keys. See the 2026.07.x release notes for the full entry.

::: danger Removed: migrate to `stagger-grid`
| `grid-stagger` key | `stagger-grid` equivalent | Notes |
|---|---|---|
| `stagger_duration` | `delay` | Renamed: `stagger-grid` uses `delay` for the step between elements |
| `wave_duration` | `duration` | Renamed: `stagger-grid` does read `duration` |
| `from: center` | `from: center` | Same |
| `from: first` | `from: start` | Renamed value |
| `from: last` | `from: end` | Renamed value |
| `from: random` | - | No equivalent |
| - | `from: edges` | `stagger-grid` only |
| `grid`, `property`, `from_value`, `to_value`, `loop`, `alternate` | same names | The names match, but the defaults differ |
:::

### `chaos`

**Random motion on several properties at once, for error states and malfunction effects.** Each loop moves to new random values.

- The top-level `duration` isn't used: each move takes a random time between `duration_min` and `duration_max`.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: CONTAINMENT FAILING
    show: true
animations:
  - trigger: on_load
    preset: chaos
    params:
      range:
        x: [-6, 6]
        "y": [-3, 3]
        rotate: [-2, 2]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `properties` | list | `['x', 'y', 'rotate']` | Properties to randomise; `x` and `y` are `translateX` and `translateY` |
| `range` | object | - | `[min, max]` per property; keys you leave out keep their defaults |
| `range.x` | list | `[-50, 50]` | px |
| `range.y` | list | `[-50, 50]` | px |
| `range.rotate` | list | `[-15, 15]` | Degrees |
| `duration_min` | number | `200` | Shortest move, ms |
| `duration_max` | number | `800` | Longest move, ms |
| `composition` | string | `blend` | `blend` or `replace` |
| `ease` | string | `inOutQuad` | Easing |
| `loop` | boolean / number | `true` | Loop forever, or a number of extra plays |
| `seed` | number | - | The same random motion on every load; targets with the same seed move the same way |

<AnimationPlayground preset="chaos" />

### `physics-spring`

**A spring-physics animation: the value overshoots and settles like a real spring.** It gives more natural motion than an easing curve.

- The spring sets the easing and the length of the animation, so `ease` and `duration` aren't used.

```yaml live
type: custom:lcards-button
preset: lozenge
tap_action:
  action: none
text:
  name:
    content: TAP TO SPRING
    show: true
animations:
  - trigger: on_tap
    preset: physics-spring
    params:
      from: 0.9
      to: 1
      damping: 6
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `property` | string | `scale` | The property to animate |
| `from` | number / string | required | Start value (a colour string works for a colour property) |
| `to` | number / string | required | End value |
| `stiffness` | number | `100` | Higher is snappier |
| `damping` | number | `10` | Higher bounces less |
| `mass` | number | `1` | Higher is slower |
| `velocity` | number | `0` | Starting velocity |
| `loop` | boolean / number | `false` | Loop forever, or a number of extra plays |

<AnimationPlayground preset="physics-spring" />

---

## See Also

- [Animations overview](../animations.md): structure, triggers, options, easing reference
- [Entity Change Triggers](entity-change-triggers.md): `on_entity_change` deep-dive
- [Rule-based Animations](rule-based-animations.md): triggering presets via the Rules Engine
