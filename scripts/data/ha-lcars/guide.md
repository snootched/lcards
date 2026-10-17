## Installation instructions
### Prerequisites
#### I. Enable themes and install UI eXtension (UIX)

HA-LCARS injects its CSS into Home Assistant using [UI eXtension (UIX)](https://github.com/Lint-Free-Technology/uix "UI eXtension"), the in-kind successor to card-mod. (A recent Home Assistant Core update broke card-mod and no fix is planned; if you are upgrading an existing HA-LCARS install that still uses card-mod, see [Converting from card-mod to UIX](#converting-from-card-mod-to-uix) below.)

1. Install `UI eXtension` per the instructions in its [Quick Start guide](https://uix.lf.technology/quick-start "UIX Quick Start"): either through HACS (don't miss the **Download** step) or manually by copying the repository's `custom_components/uix` folder into your `custom_components` directory. **Restart** Home Assistant after installing.

2. Add the UIX service: go to ``Settings`` → ``Devices & Services`` → ``+ Add Integration`` and add **UI eXtension**, then refresh your browser. Unlike card-mod, UIX is an integration: it needs **no** `extra_module_url` entry.

3. Make sure in your ``configuration.yaml`` file you have the following:
```yaml
frontend:
  themes: !include_dir_merge_named themes
```
4. Under the Home Assistant ``config`` folder, create a new folder named ``themes``
5. **Restart** Home assistant to apply the changes.

**Converting an existing install from card-mod to UIX**

UIX is a drop-in replacement for card-mod (compatible with card-mod configuration up to 4.2.1), from the heritage of the original card-mod project. To convert an existing HA-LCARS setup:

1. **Uninstall card-mod**: in HACS, find `card-mod` and remove it (or delete `www/community/lovelace-card-mod` if you installed it manually).
2. **Remove the card-mod entry from `configuration.yaml`**: delete the `card-mod.js` line under `frontend:` → `extra_module_url:` (and the `extra_module_url:` key itself if nothing else is listed there), then **restart** Home Assistant.
3. **Install UI eXtension** and add its service per steps 1–2 above, then refresh your browser (a hard reload, e.g. Ctrl+Shift+R, is safest).
4. **Your dashboards keep working as-is**: UIX understands the existing `card_mod:` keys in your card YAML for backward compatibility. For new cards (and when touching old ones), prefer the new key, which is what the examples in this README use:

```yaml
# before (card-mod)          # after (UIX)
card_mod:                    uix:
  class: header-left           class: header-left
```

5. **Theme files need no changes**: UIX also reads card-mod's theme keys (`card-mod-theme:`, `card-mod-<thing>-yaml:`), so the HA-LCARS theme files work unchanged. If you maintain your own theme customizations you may optionally rename those keys to `uix-theme:` / `uix-<thing>-yaml:`.

> [!NOTE]
> If you use UI Lovelace Minimalist, disable its `Include custom card resources` option so it doesn't re-load the removed card-mod resource.

#### II. Add the fonts

This theme requires you to add either the `Tungsten` font or the `Antonio` font. If both are available, the theme will use Tungsten. Tungsten is the actual font used in the later seasons of *Picard*. Antonio is a very similar and is slightly less horizontally compressed.

A. Tungsten is available free for personal use from [Font Downloader](https://fontdownloader.net/tungsten-font/).
   1. Download and unzip the font files
   2. Place `Tungsten-Medium.woff2` and `Tungsten-Bold.woff2` in `<home-assistant-directory>/www/community/fonts/`
   3. Download Tungsten.css from the HA-LCARS GitHub and place it also in `<home-assistant-directory>/www/community/fonts/`
   4. Navigate to `Settings` → `Dashboards` → `3-dot menu` → `Resources` and add the following new Resources:
      `/hacsfiles/fonts/tungsten.css` and select 'stylesheet'

##### -OR-

B. Antonio is available from Google Fonts and can be added as a Dashboard Resource
   1. Navigate to `Settings` → `Dashboards` → `3-dot menu` → `Resources` and add the following new Resources:
       `https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&display=swap` and select 'stylesheet'

#### III. Add the Javascript file

This theme requires you to add a javascript file to your Dashboard Resources

A. Navigate to `Settings` → `Dashboards` → `3-dot menu` → `Resources` and add the following new Resources:
   `https://cdn.jsdelivr.net/gh/th3jesta/ha-lcars@js-main/lcars.js` and select javascript

##### -OR-

B. If you don't trust someone's random JavaScript hosted on a CDN (I get it), you can download the `lcars.js` file directly from GitHub, audit it yourself, and place it in your `<home-assistant-directory>/www/community/`.
   - **This will need to be done with every HA-LCARS update.**
   - **Do not add `/local/community/lcars.js` to `extra_module_url`; it will not work there.**

> [!WARNING]
> **IF YOU USE CLOUDFLARE IN FRONT OF YOUR SITE:**
> Purge your site cache in CloudFlare (Purge Cache under Quick Actions) anytime you update the local file or if you are using the JSDelivr link and a new version of HA-LCARS is released. This needs to happen whether you are using the JSDelivr link or putting it in your www folder. Unless you tell it not to, CloudFlare caches anything in your site that it can.
#### III. Set up the clock
In order for the clock to work, you need to set up the [Time & Date integration](https://www.home-assistant.io/integrations/time_date/).

A. From the Integations menu
   - Go to ``Settings`` → ``Devices & Services`` → ``+ Add Integration`` → ``Time & Date``
   - Select the sensor type `Time`
   - Click `Submit`

##### -OR-

B. Add the following to your configuration.yaml:
```yaml
sensor:
  - platform: time_date
    display_options:
      - 'time'
```

> [!IMPORTANT]
> You may wish to remove the new Time & Date entities from Home Assistant's Recorder integration so they don't fill you database with updates every second. Examples on how to do that: https://www.home-assistant.io/integrations/recorder/#common-filtering-examples

#### IV. Create the helper entities
This theme has toggle controls for sound and textures, number controls for border sizes and menu font size, and an optional template sensor for adding custom text to the header. Create these helper entities by going to ``Settings`` → ``Devices & Services`` → ``Helpers`` and create two of type **Toggle**, two of type **Number**, and one of type **Template** named as below:
- LCARS Sound (entity id should be `input_boolean.lcars_sound`)
  - Toggles button and tap sounds
- LCARS Texture (entity id should be `input_boolean.lcars_texture`)
  - Toggles a grain pattern and backlight effect
- LCARS Vertical (entity id should be `input_number.lcars_vertical`)
  - Sets the width of vertical borders
  - Min value: 26
  - Max value: 60
- LCARS Horizontal (entity id should be `input_number.lcars_horizontal`)
  - Sets the width of horizontal borders
  - Min value: 6
  - Max value: 60
- Optional: LCARS Menu Font (entity id should be `input_number.lcars_menu_font`)
  - Sets the font size (in px) of the sidebar menu
- Optional: LCARS Header (entity id should be `sensor.lcars_header`)
  - Add text to the clock area of the header
  - Example Template: `{{ "LCARS " + states('sensor.time') }}`

These entities can be controlled directly from viewing the entity, or you can even add buttons to your dashboard to control them, just like any other entity.

### Install the theme
Install via HACS by searching "LCARS" or download the [latest release](https://github.com/th3jesta/ha-lcars/releases/latest) and extract and drop the lcars folder into your themes folder.

### Enable theme
#### Option 1: Via profile
1. Open your Home Assistant **Profile**
2. Under **User Settings** → **Themes**, select one of the new LCARS themes

#### Option 2: Setting the default `backend-selected` theme
In order to have this theme set automatically as the backend selected default, add the following automation to your Home Assistant:
```yaml
- alias: Set Default Theme
  description: ''
  trigger:
  - event: start
    platform: homeassistant
  condition: []
  action:
  - data:
      name: LCARS Default # or whichever other theme is available, like LCARS Lower Decks
    service: frontend.set_theme
```

## Usage instructions
### Classes
The theme includes some classes that can be added to cards like this to give them special styling:
```yaml
uix:
  class: header-left
```
> [!NOTE]
> The class names are only indications of what types of cards they were intended for, but the classes can be applied to any card you like. I cannot guarantee how well they will work outside of their intended uses, however.

The classes are as follows:
1. `header-left` `header-right` `header-contained` `header-open` - top blue bar (in Default theme) meant for Markdown and Heading cards and with one `H1` line that will start a section

```yaml
type: markdown
uix:
  class: header-left
content: '# header-left'

type: markdown
uix:
  class: header-right
content: '# header-right'

type: markdown
uix:
  class: header-contained
content: '# header-contained'

type: markdown
uix:
  class: header-open
content: '# header-open'
```

2. `middle-left` `middle-right` `middle-contained` `middle-blank` -  side red bar (in Default theme) meant for non-button sections below `header` and above `footer`

```yaml
type: markdown
uix:
  class: middle-left
content: '# middle-left'

type: markdown
uix:
  class: middle-right
content: '# middle-right'

type: markdown
uix:
  class: middle-contained
content: '# middle-contained'

type: markdown
uix:
  class: middle-blank
content: '# middle-blank'
```

3. `footer-left` `footer-right` `footer-contained` `footer-open` - bottom gray bar (in Default theme) meant for the last card in a section

```yaml
type: markdown
uix:
  class: footer-left
content: '# footer-left'

type: markdown
uix:
  class: footer-right
content: '# footer-right'

type: markdown
uix:
  class: footer-contained
content: '# footer-contained'

type: markdown
uix:
  class: footer-open
content: '# footer-open'
```

4. `button-small` - squared off buttons intended to go in middle sections and horizontal-stacks and grids

```yaml
type: light
entity: light.jesse_s_desk
name: Desk Lamp
uix:
  class: button-small
```

5. `button-large` - rounded button meant to be standalone outside of `header`/`middle`/`footer` sections

```yaml
show_name: true
show_icon: true
type: button
tap_action:
  action: call-service
  service: frontend.reload_themes
  data: {}
  target: {}
show_state: true
uix:
  class: button-large
```

6. `button-lozenge-left` `button-lozenge-right` - pill-shaped button; only works on standard button cards; also works on button cards in a horizontal-stacks and grids up to two columns wide; more columns get glitchy and is not advised

```yaml
show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: switch.speakers
icon: mdi:speaker-multiple
uix:
  class: button-lozenge-left

show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: switch.lightsaber
uix:
  class: button-lozenge-right
```

7. `button-bullet-left` `button-bullet-right` - similar to the lozenge, but with a squared-off side; same column restrictions apply

```yaml
show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: light.bedroom_tree
uix:
  class: button-bullet-left

show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: switch.counter_lights
uix:
  class: button-bullet-right
```

8. `button-capped-left` `button-capped-right` - similar to the bullet, but capped on the round side; same column restrictions apply

```yaml
show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: light.bathroom
uix:
  class: button-capped-left

show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: switch.built_in
uix:
  class: button-capped-right
```

9. `button-barrel-left` `button-barrel-right` - similar to the bullet, but no rounding at all; same column restrictions apply

```yaml
show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: light.bathroom
uix:
  class: button-barrel-left

show_name: true
show_icon: true
type: button
tap_action:
  action: toggle
entity: switch.built_in
uix:
  class: button-barrel-right
```

9. `button-bar-left` `button-bar-right` - button in the style of a header bar. Uses large text and includes the icon and state of shown; same column restrictions apply

```yaml
show_name: true
show_icon: true
show_state: true
type: button
entity: light.porch_light
name: Porch
uix:
  class: button-bar-left

show_name: true
show_icon: true
show_state: true
type: button
entity: light.garage_light
name: Garage
uix:
  class: button-bar-right
```

10. `bar-left` `bar-right` `bar-large-left` `bar-large-right` - standalone header-type bar; only intended for and tested with Markdown and Heading cards. Comes with a standard and large versions, see [Tips & Tricks](#custom-bar-sizes) for custom sizing

```yaml
type: markdown
content: 'bar-left'
uix:
  class: bar-left

type: markdown
content: 'bar-large-left'
uix:
  class: bar-large-left

type: markdown
content: 'bar-right'
uix:
  class: bar-right

type: markdown
content: 'bar-large-right'
uix:
  class: bar-large-right
```

11. `list-<lozenge|bullet|capped|barrel>-<left|right>` - styled to-do lists using the `lozenge`, `bullet`, `capped`, and `barrel` styles in `left` and `right` variants similar to the `button-*` classes discussed above.

```yaml
type: todo-list
entity: todo.testing
title: To-do List
theme: LCARS Default
uix:
  class: list-capped-right

type: todo-list
entity: todo.testing
title: To-do List
theme: LCARS Lower Decks I
uix:
  class: list-lozenge-left

type: todo-list
entity: todo.testing
title: To-do List
theme: LCARS Picard II
uix:
  class: list-barrel-left
```

12. `entity-<lozenge|bullet|capped|barrel>-<left|right>` - styled entities lists (from Entities Card and [Auto-Entities Cards](https://github.com/thomasloven/lovelace-auto-entities)) using the `lozenge`, `bullet`, `capped`, and `barrel` styles in `left` and `right` variants similar to the `button-*` classes discussed above. Additionally, the icon cap can be hidden by applying the `no-cap` class. The class is applied using the `uix:` key _on each entity in the Entities Card_, or using `options:` in each filter of an auto-entities card.

Unique to this set of classes is the width of the readout area where the entity states are shown. This is can be set using a css variable `--lcars-readout-width` to one of the cards containing the entities list, as seen in the examples below. In the first example, the variable is set in the `vertical-stack` containing the entities card -- this would apply to all entities cards in that stack. In the second example, the varaible is set in the `card:` section of the auto-entities card which specifies options for the created `entities card`.

```yaml
type: vertical-stack
cards:
  - type: markdown
    content: "# Entities Card"
    uix:
      class: header-left
  - type: entities
    entities:
      - entity: sensor.mudroom_motion_temperature
        icon: none
        uix:
          class: entity-lozenge-left
      - entity: sensor.kitchen_current_temperature
        uix:
          class: entity-capped-left
      - entity: sensor.family_room_motion_temperature
        uix:
          class: entity-bullet-left
      - entity: sensor.office_motion_temperature
        uix:
          class: entity-barrel-left no-cap
      - entity: sensor.living_room_current_temperature
        uix:
          class: entity-lozenge-right
      - entity: sensor.nursery_temperature
        uix:
          class: entity-capped-right no-cap
      - entity: sensor.master_bedroom_temperature
        uix:
          class: entity-bullet-right
      - entity: sensor.foyer_motion_temperature
        uix:
          class: entity-barrel-right
    uix:
      class: middle-blank
  - type: markdown
    content: |
      # &nbsp;
    uix:
      class: footer-right
grid_options:
  rows: auto
  columns: 12
uix:
  style: |
    :host{
      --lcars-readout-width: 150px;
      --lcars-vertical-border: 40px;
    }
```

```yaml
type: vertical-stack
cards:
  - type: markdown
    content: "# Auto-Entities Card"
    uix:
      class: header-right
  - type: custom:auto-entities
    card:
      type: entities
      uix:
        class: footer-right
        style: |
          :host {
            --lcars-readout-width: 125px;
          }
    filter:
      include:
        - options:
            uix:
              class: entity-lozenge-left
          area: mudroom
          label: security_sensor
        - options:
            uix:
              class: entity-lozenge-right
          area: "Family Room"
          label: security_sensor
      exclude: []

```

### Make your own color themes
Custom themes can be created down at the bottom of `lcars.yaml`. Or, search for "===THEMES", which will take you right there. To create your own theme, copy the LCARS Default section to the bottom of the file and change the `lcars-ui-*` and `lcars-card-*` variables to your liking, using the color references at the top of the file, [The LCARS website](https://www.thelcars.com/colors.php), or define your own.

## Tips and tricks
> [!NOTE]
> If you have anything to add here, create a PR with your tip and I will review it to add to this list.

#### Stacks and stacks and stacks
Make use of Vertical Stack cards. Whether in this theme or any other theme, they are invaluable for keeping dashboards organized. In LCARS, a Vertical Stack card should contain a Markdown card first with the title of the group and the `header` class applied, then any number of `middle` class cards and `button` class single buttons or in horizontal stacks or grids, and then finally a `footer` class applied to the last card in the vertical stack. You can see this formation in all of the screenshots at the top of this page. Here's an example Vertical Stack card and all of its contents:

```yaml
type: vertical-stack
cards:
  - type: markdown
    uix:
      class: header-left
    content: '# Climate'
  - type: weather-forecast
    entity: weather.home
    uix:
      class: middle-left
  - type: thermostat
    entity: climate.dining_room
    uix:
      class: footer-left
```

Additionally, since version 4.0, vertical and horizontal stacks can be themed. Stack titles are placed in the side border. This allows multiple cards to be stacked evenly within LCARS framing:

```yaml
type: vertical-stack
title: Big Stack
cards:
  - type: heading
    heading_style: title
    heading: Stack Example
    icon: fa6-solid:cubes-stacked
    badges:
      - type: entity
        entity: input_number.lcars_horizontal
      - type: entity
        entity: input_number.lcars_vertical
      - type: entity
        entity: input_boolean.lcars_texture
    uix:
      style: ":host .title {font-size:2em;}"
  - type: horizontal-stack
    title: top
    uix:
      class: header-right
    cards:
      - show_name: true
        show_icon: true
        type: button
        entity: light.east_flood_lights
        uix:
          class: button-lozenge-left
      - show_name: true
        show_icon: true
        type: button
        entity: light.south_flood_lights
        uix:
          class: button-lozenge-right
  - type: horizontal-stack
    title: middle
    uix:
      class: middle-right
    cards:
      - show_name: true
        show_icon: true
        type: button
        entity: light.porch_light
        uix:
          class: button-lozenge-left
      - show_name: true
        show_icon: true
        type: button
        entity: light.garage_light
        uix:
          class: button-lozenge-right
  - type: horizontal-stack
    title: bottom
    uix:
      class: footer-right
    cards:
      - show_name: true
        show_icon: true
        type: button
        entity: light.front_lights
        uix:
          class: button-lozenge-left
      - show_name: true
        show_icon: true
        type: button
        entity: light.stoop_light
        uix:
          class: button-lozenge-right
grid_options:
  columns: 48
  rows: auto
uix:
  class: header-left
```

#### Button Cards in Section Layout
When using Home Assistant's Sections layout (currently the default for new dashboards), button cards are forced to be two rows tall. While LCARS button themes will work, they will look bigger than in the examples. The size can be corrected by setting the ``grid_options: rows: auto`` as such:

```yaml
type: button
show_name: true
show_icon: true
show_state: true
entity: light.front_lights
uix:
  class: button-lozenge-left
grid_options:
  columns: full

type: button
show_name: true
show_icon: true
show_state: true
entity: light.front_lights
uix:
  class: button-lozenge-left
grid_options:
  columns: full
  rows: auto
```

#### Section Layout Headings
By default, Home Assistant creates a Heading Card at the top of each Section. This card can take the header and bar classes!

```yaml
type: heading
heading_style: title
grid_options:
  columns: 18
  rows: auto
heading: LCARS Settings
icon: local:Star Trek/starfleet-star-badge
badges:
  - type: entity
    entity: input_number.lcars_horizontal
  - type: entity
    entity: input_number.lcars_vertical
  - type: entity
    entity: input_boolean.lcars_texture
uix:
  class: header-contained
  style: |
    :host .title { font-size: 2em;}

type: heading
icon: local:Star Trek/starfleet-star-badge
heading: LCARS Settings
heading_style: title
badges:
  - type: entity
    entity: input_number.lcars_vertical
  - type: entity
    entity: input_number.lcars_horizontal
  - type: entity
    entity: input_boolean.lcars_texture
uix:
  class: bar-left
grid_options:
  columns: 18
  rows: auto
```

#### Blank Headers
You can create a blank header or footer by creating a Markdown card and putting `## &nbsp;` in the Content field, and change the size by modifying the number of `#`. It looks like this:
![image](https://user-images.githubusercontent.com/38670315/210792537-f25c740d-1ad3-4ac7-8a31-59ad04cf38fb.png)

#### Font on a single dashboard
If you are only applying the theme to a dashboard or a card, the font won't render on the cards. You can brute-force loading the font on a per-card basis by adding the following style to every card:

```yaml
type: markdown
content: '# Card-level theming'
theme: LCARS Default
uix:
  class: header-left
  style: |
    ha-card > * {
      font-family: Antonio
    }
```

#### Font on air-gapped installs
If you want to host the font yourself, such as running a Home Assistant instance in a car or on an air-gapped network, you can learn how to download the font and install it from issue https://github.com/th3jesta/ha-lcars/issues/69.

#### Right-aligned text
You can switch the alignment of text in a card, such as the markdown card for `header-right`, by adding custom CSS per card like so:

```yaml
uix:
  class: header-right
  style: |
    ha-card {
      text-align: right;
    }
```

#### Button Background Colors
You can set a button's background color to the color of the light by adding custom CSS per card like so:

```yaml
uix:
  class: button-capped-right
  style: |
    ha-card {
      {% if is_state('light.terasa', 'on') %}
        {% set rgb_color = state_attr('light.terasa', 'rgb_color') %}
        background-color: rgba({{ rgb_color[0] }}, {{ rgb_color[1] }}, {{ rgb_color[2] }}, 1) !important;
        color: black;  /* or any other logic for text color */
      {% else %}
        background-color: #dd4444 !important;
        color: black;
      {% endif %}
    }
```

#### Custom Bar Sizes
You can the size of a bar card by scaling the font size of the card like so:

```yaml
type: vertical-stack
cards:
  - type: markdown
    content: Defiant Class Bar
    uix:
      class: bar-left
      style: |
        :host {
          font-size: 16px !important;
        }
  - type: markdown
    content: Constitution Class Bar
    uix:
      class: bar-left
  - type: markdown
    content: Galaxy Class Bar
    uix:
      class: bar-left
```

## Known issues
* Font and sidebar and header CSS styles only load when a dashboard has been loaded first. If you navigate directly to a non-dashboard page without loading a dashboard first, things will look pretty awful, though still functional. Simply load a dashboard and hit the back button. This is a quirk of the CSS-injection approach of [UI eXtension](https://github.com/Lint-Free-Technology/uix) (as with card-mod before it) on which this theme relies, so it's outside my ability to fix.
* Sometimes when a dashboard loads, not all CSS styles will load and all or most cards will end up looking like the `button-large` cards. This is more prevalent on large dashboards. Try reloading the page, and if that doesn't work, load a smaller dashboard and then go back to the offending dashboard.
