---
description: "Sample LCARdS screens showing layouts and the LCARS look (bridge, engineering, environmental, security, alert mode, Picard-era operations and sciences screens, and ten screens built from the design guide), with the YAML and a recording of each."
---

# Dashboard Gallery

**Sample screens that show LCARS layouts and the look, each a whole view built from LCARdS cards on a [Layout View](../cards/layout-view/).** Each was recorded in Home Assistant while its entities change (lights switch, levels move, alerts sound). Borrow layouts and sections from them; to build your own dashboard, the [LCARdS skill](ai-assistance) composes one for your entities.

- The dashboards use `lcards_test_*` helpers and one temperature sensor, `sensor.desk_sensor_temperature`. The [Live Demo](live-demo#in-your-own-home-assistant) page has the YAML that creates those helpers, if you want to try a dashboard unchanged first.

::: warning The colours are picked by hand
With test helpers there are no real states to colour by, so every block and button in these samples is given a theme role by hand, including its on and off colours. That shows the look, but it is not how a working dashboard is usually coloured: there, controls bound to your entities normally take the theme's state colours, and copying the hand-picked colours means removing them from every card later. Decide first; see [Colours by state or by hand](lcars-design#colours-by-state-or-by-hand).
:::

To use one:

1. Create a dashboard (**Settings > Dashboards > Add dashboard**), open it, then **Edit dashboard > Raw configuration editor**.
2. Paste the YAML and save.
3. Replace the `lcards_test_*` helpers and the sample temperature sensor with your own entities.
4. If something doesn't work, paste your version into [Check Your Config](config-checker).

## Bridge

A classic [display over controls](lcars-design#screen-archetypes) in the LCARS TNG theme. A thick sweep carries labelled segments and the title; the display charts power and shields (hourly averages) in a thin nested sweep, beside a ship status [readings table](lcars-patterns#readings-table) and a live warp factor. The display's sidebar sweeps into a closing bar, and the next bar sweeps down into a control deck: [pill groups](lcars-patterns#pill-grid-classic) led by big live numbers whose pills set levels or switch helpers, a power slider and shield gauge, main lights, a mode [select menu](../cards/select-menu/) and red alert.

<video class="doc-video" src="/gallery/bridge.webm" poster="/gallery/bridge.webp" title="Bridge: a thick peach sweep with a violet title, a chart of power and shields beside a ship status table, and a control deck of pastel pill groups led by large numbers" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/bridge.yaml
:::

## Engineering

The [master systems display](lcars-design#screen-archetypes) in the Picard look: the built-in NCC-1701-A blueprint fills the screen as a dimmed [MSD](../cards/msd/) schematic, ringed by shield arcs that turn from blue to yellow below 50% and red below 20%. Eight callouts above and below the ship are small blocks joined to the ship's own markers by routed lines; four of them switch helpers and their labels carry live readings. Round it: a [code-block column](lcars-patterns#code-block-column) with power and shield gauges, [utility pills](lcars-patterns#utility-pills), a systems table with [flagged blocks](lcars-patterns#flagged-blocks), a mode selector, and toggle tabs over readings tables.

<video class="doc-video" src="/gallery/engineering.webm" poster="/gallery/engineering.webp" title="Engineering: a grey starship plan inside blue shield arcs with eight labelled callouts on routed lines, gauge columns and utility pills on the left, a systems table and blocks on the right, readings tables along the bottom" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/engineering.yaml
:::

## Environmental

A [data screen](lcars-design#screen-archetypes) in the Picard look. The upper band holds a climate and a life support [readings table](lcars-patterns#readings-table) and the title, with toggle tabs and a shaped slider for the cabin set point under them. Two thin sweeps meet at a segmented band; under it a 24-hour temperature trace fills the display, beside a humidity [gauge column](lcars-patterns#gauge-bank) with dry, nominal and humid bands and a sidebar of code blocks with set point and ambient gauges.

<video class="doc-video" src="/gallery/environmental.webm" poster="/gallery/environmental.webp" title="Environmental: two small readings tables and a blue set point slider over a 24-hour temperature trace, with a humidity gauge column and grey code blocks with gauges at the sides" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/environmental.yaml
:::

## Security

A classic [sweep console](lcars-design#screen-archetypes) in the LCARS Classic theme: one thick header sweep, with a sidebar of toggle blocks that sweeps into a segmented bottom bar, and the mode [select menu](../cards/select-menu/) in the title row. The camera group is a D-pad: left and right step a pan helper (a stand-in for a camera), and the pan value leads it as a big number. Pill rows switch the doors, exterior lights and intruder alert, point the camera and run the alert actions; four sector tiles take the accent while their sector is active, beside a sector status table and the screen's one number cascade.

<video class="doc-video" src="/gallery/security.webm" poster="/gallery/security.webp" title="Security: a thick yellow sweep with a red title, a D-pad camera group, rows of pills led by large numbers, four framed sector tiles, a sector status table and a number cascade" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/security.yaml
:::

## Alert mode

A classic [display with side columns](lcars-design#screen-archetypes) in the LCARS Modern theme, set on the view. Two sweeps face each other across the top and their arms run down both sides; the left arm's blocks raise and clear an [alert mode](../core/alert-mode) through the `lcards.*` [actions](../configuration/ha-actions) (red, yellow, blue, gray and black alert, and stand down). Between them is an everyday systems screen: a 24-hour chart with live readouts, a ship status [readings table](lcars-patterns#readings-table) and deck control pills led by live numbers. During an alert the whole view recolours, its own theme included, and the [alert overlay](../cards/alert-overlay/) covers it with the symbol for the alert: red, then yellow.

<video class="doc-video" src="/gallery/alert.webm" poster="/gallery/alert.webp" title="Alert status: lavender and gold sweeps down both sides with coloured alert buttons, a chart, a ship status table and deck control pills; red alert turns the screen red under the red overlay, then yellow alert turns it yellow" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/alert.yaml
:::

## Picard era

Later LCARS screens (as in *Star Trek: Picard*) use thinner frames, square-ended blocks, cooler blues and greys, and dense readouts with small accents. These two use the same cards in that style.

### Operations

The [switchable display](lcars-design#screen-archetypes): the frame, columns and strips stay while the centre changes. A [select menu](../cards/select-menu/) along the bottom picks one of three displays, each a card with a visibility condition: EPS power (a chart of hourly averages), the Enterprise as a hologram with leader-line callouts carrying live readings ([astrometrics](../cards/astrometrics/)), or a tactical polar plot. Round it: a [code-block column](lcars-patterns#code-block-column) with toggles, a ship status table over a [gauge bank](lcars-patterns#gauge-bank), readout bars and [utility pills](lcars-patterns#utility-pills).

<video class="doc-video" src="/gallery/picard-operations.webm" poster="/gallery/picard-operations.webp" title="Operations: grey Picard frames round a centre that switches between a power chart, a hologram of the Enterprise with labelled callouts and a tactical plot, with code blocks, a status table over three gauges, readout bars and utility pills" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/picard-operations.yaml
:::

### Sciences

A [bracket screen](lcars-design#screen-archetypes) in the Picard look: capped top and bottom bars in segments and a numbered sidebar of code blocks, three of which switch helpers. The readout fills the bracket in labelled sections: a 24-hour temperature history (the line and its hourly mean as steps) with a [readings table](lcars-patterns#readings-table), four ring gauges that set levels, a sensor log, and hourly means as columns.

<video class="doc-video" src="/gallery/sciences.webm" poster="/gallery/sciences.webp" title="Sciences: a grey bracket with a numbered sidebar of blocks round a temperature history and readings, four blue and grey ring gauges, a sensor log and a column chart of hourly means" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/sciences.yaml
:::

## Built from the design guide

Ten sample screens composed from the [archetypes](lcars-design#screen-archetypes) in Designing LCARS Screens and the [LCARS Patterns](lcars-patterns), five Picard and five classic. They show layouts to start from rather than finished dashboards: build your own with the [LCARdS skill](ai-assistance), swapping the decorative parts for your own controls and readings. Each starts from a different layout, so together they show how varied the same design language can be. Every colour is a theme role picked by hand (see the note at the top): they follow your HA-LCARS theme, and the classic ones set a classic theme on their view.

### Picard: display with side columns

A Titan.DS-style deck plan built as modules whose slots take a decorative part or a control: [utility pills](lcars-patterns#utility-pills) in a bracket open on the left with gauge groups in its slot, one [display sweep](lcars-patterns#display-sweep) whose header bar turns down over a [code-block column](lcars-patterns#code-block-column), a dimmed ship schematic with leader lines, a [gauge bank](lcars-patterns#gauge-bank) of `picard-gauge-column` sliders beside a column of flagged readings, and [toggle tabs](lcars-patterns#toggle-tab-strip) with [readout rows](lcars-patterns#readout-rows) along the bottom.

<video class="doc-video" src="/gallery/picard-console.webm" poster="/gallery/picard-console.webp" title="Picard console: a grey sweep down the left over columns of small code blocks, utility pills and gauges in a bracket, a dimmed ship deck plan with labelled leader lines, three tall gauges, toggle tabs and readout bars along the bottom, blue accents on what is on" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/picard-console.yaml
:::

### Picard: display over controls

One [display sweep](lcars-patterns#display-sweep), open on the right, round a large ship side profile with a [labelled schematic](lcars-patterns#labelled-schematic) in the bracket style (three labels are live readings, one a fault). The LEADERS block switches its leader lines between angled ones from labels above and below the ship and level ones from labels in two columns beside it. The sweep's bars run on as segments. Under it, a deck of small parts: a [code-block column](lcars-patterns#code-block-column), a [gauge bank](lcars-patterns#gauge-bank), [toggle tabs](lcars-patterns#toggle-tab-strip), two [readings tables](lcars-patterns#readings-table), one [number cascade](lcars-patterns#number-cascade-filler), a [selector strip](lcars-patterns#selector-strip), [flagged blocks](lcars-patterns#flagged-blocks) and [utility pills](lcars-patterns#utility-pills).

<video class="doc-video" src="/gallery/picard-display.webm" poster="/gallery/picard-display.webp" title="Picard display: a grey sweep round a large grey starship side profile with labelled leader lines, under it columns of small code blocks, four tall gauges, toggle tabs, two tables of readings, a number column, a mode selector and utility pills" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/picard-display.yaml
:::

### Picard: split screen

A split header in the Picard style: two [segmented elbows](lcars-patterns#concentric-sweep) (a thin outer band with a large curve around an inner block as wide as the block column) face each other across a cut through the screen, each band running on as labelled segments. Utility pills sit inside the upper curve and [flagged blocks](lcars-patterns#flagged-blocks) inside the lower one, around a [readings table](lcars-patterns#readings-table), [readout rows](lcars-patterns#readout-rows), a gauge pair beside toggle blocks, a labelled ship schematic and [fleet tiles](lcars-patterns#fleet-tiles).

<video class="doc-video" src="/gallery/picard-split.webm" poster="/gallery/picard-split.webp" title="Picard split screen: two grey segmented sweeps facing across a cut through the screen, pills in the upper curve, flagged code blocks in the lower, a table of readings, thin readout bars, two gauges, a dimmed blue ship with labelled leader lines, fleet tiles and toggle tabs" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/picard-split.yaml
:::

### Picard: portrait panel

For a phone or an upright tablet: a [header bar](lcars-patterns#header-bar-with-a-title) with the title, a sweep down the left edge into a segmented closing bar, a [labelled schematic](lcars-patterns#labelled-schematic) of the ship, code blocks beside a condition [readings table](lcars-patterns#readings-table), a [gauge bank](lcars-patterns#gauge-bank) beside signal readings, [utility pills](lcars-patterns#utility-pills) and toggle tabs. Recorded at 600 by 1000.

<video class="doc-video" src="/gallery/picard-portrait.webm" poster="/gallery/picard-portrait.webp" title="Picard portrait: a MISSION OPS header bar, a grey starship plan with labelled leader lines, code blocks beside a table of condition readings, four gauges beside signal readings, utility pills and toggle tabs" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/picard-portrait.yaml
:::

### Picard: tile wall

The [tile wall](lcars-design#screen-archetypes): nine sections of the Enterprise, each a framed tile built the same way (deck code and name on the thick top bar, a [readings table](lcars-patterns#readings-table) on the left, a slot on the right, a control row at the bottom). The slots vary: setting gauges, a big live number, 12-hour charts, readout bars and a shield slider, a view selector, transporter pads, and the screen's one [number cascade](lcars-patterns#number-cascade-filler). A tile's frame takes the accent while its section is active. Round the wall: a shipwide summary under the header bar, a [code-block column](lcars-patterns#code-block-column) with a gauge pair, and [utility pills](lcars-patterns#utility-pills) with an index whose blocks switch the live sections.

<video class="doc-video" src="/gallery/picard-tiles.webm" poster="/gallery/picard-tiles.webp" title="Picard tile wall: nine grey framed tiles for sections of the Enterprise, each with readings, a gauge, chart or control slot and a control row, some lit blue while active, between a code-block column and utility pills" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/picard-tiles.yaml
:::

### Classic: sweep console

A helm-style console: two thick [sweeps facing](lcars-patterns#facing-sweeps-header) across the top, their arms running down the middle as stacked coded blocks. On the left, four [pill groups](lcars-patterns#pill-grid-classic) led by big numbers: the first group's numbers are live levels its pills set, the second's pills switch helpers, and a warp slider takes the place of three pills. On the right, the title, a framed chart, a [readings table](lcars-patterns#readings-table) and the screen's one [number cascade](lcars-patterns#number-cascade-filler). The view sets `theme: LCARS Default`, so the roles come out in the TNG pastels whatever your profile theme is.

<video class="doc-video" src="/gallery/classic-console.webm" poster="/gallery/classic-console.webp" title="Classic console: two peach and violet sweeps facing across the top with stacked blocks down the middle, rows of pastel pills led by large numbers, a warp slider, a framed chart, a readings table and a column of numbers" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/classic-console.yaml
:::

### Classic: data screen

The classic data screen: an upper band with a sweep, a [readings table](lcars-patterns#readings-table) of the environment beside the screen's one small [number cascade](lcars-patterns#number-cascade-filler), the big title and a [pill group](lcars-patterns#pill-grid-classic) led by big numbers; a divider of [segmented bars](lcars-patterns#segmented-bar-classic-arms); a sidebar of blocks beside a long range scan ([astrometrics](../cards/astrometrics/)) with a bearing scale and a systems readings table. Every number is a labelled reading except the one cascade. The view sets `theme: LCARS Default`.

<video class="doc-video" src="/gallery/classic-data.webm" poster="/gallery/classic-data.webp" title="Classic data screen: violet and peach sweeps, a table of labelled temperature, humidity, lights and doors readings, a big red LONG RANGE SCAN title, pills led by big numbers, a sidebar of blocks and a gridded star scan with a probe track and a table of power, shields and warp readings" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/classic-data.yaml
:::

### Classic: bracket screen

A [bracket](lcars-patterns#bracket-frame-classic) round a shuttlecraft cutaway in colour, its top bar running on as short coded segments into the title, and a thick sidebar of coded blocks (two of them switch helpers). Seven [labels on leader lines](lcars-patterns#labelled-schematic) point into the cutaway, five of them live. Beside it, a ten-row [readings table](lcars-patterns#readings-table), three thin [readout rows](lcars-patterns#readout-rows) that set helpers, and a pill group led by numbers. The view uses `theme: LCARS Zeldaar`.

<video class="doc-video" src="/gallery/classic-bracket.webm" poster="/gallery/classic-bracket.webp" title="Classic bracket screen: violet bracket bars broken into short coded segments, a thick sidebar of coloured blocks, a colourful shuttlecraft cutaway with labelled leader lines, a readings list, three thin gauges and a pill group led by numbers" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/classic-bracket.yaml
:::

### Classic: list

A [split header](lcars-patterns#split-header-classic) whose two bars continue as segments, three short [readings tables](lcars-patterns#readings-table) up top (shifts, environment, helper states), a 14-row duty roster [list](lcars-patterns#list) coloured by shift, where the medical officer's status follows a helper, labelled counts on the right and four pill rows along the bottom whose first pills are toggles. The view uses `theme: LCARS Nemesis Blue`.

<video class="doc-video" src="/gallery/classic-list.webm" poster="/gallery/classic-list.webp" title="Classic list: a tan upper sweep over three small readings tables and a blue lower sweep, a duty roster coloured by shift, a column of labelled counts and four rows of pills led by numbers" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/classic-list.yaml
:::


### Classic: wings

The [wings](lcars-design#screen-archetypes) layout: the Enterprise's warp propulsion, port and starboard nacelles round what they share, in the LCARS Nemesis Blue theme. Two thick sweeps face each other across the top and two thin ones close the wings at the bottom. Each wing is the same module mirrored, its big numbers on the outer edge: the side's flow, [pill rows](lcars-patterns#pill-grid-classic) led by live numbers that set its levels and switch its injector and vent, its own readings table and a flow slider. Port is wheat and starboard blue throughout; the centre charts both flows in those colours over shared readings and a pill group that engages warp.

<video class="doc-video" src="/gallery/classic-wings.webm" poster="/gallery/classic-wings.webp" title="Classic wings: wheat sweeps and pills on the port side and blue on the starboard side, mirrored round a centre chart of both nacelles' flow, with shared readings and warp pills under it" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/classic-wings.yaml
:::
