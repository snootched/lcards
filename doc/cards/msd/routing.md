# Line Routing & Channels

MSD lines are routed like **cable raceways** on a circuit board: lines that travel in the same direction bundle together into evenly-spaced parallel lanes, branch apart where their destinations diverge, and avoid cutting across each other unless a crossing is genuinely the best option. This page covers how routing decides a line's path, how automatic bundling works, and how to guide it with channels.

Per-line properties (`route`, `route_hint`, `anchor_side`, `waypoints`, …) are documented in [Line Overlay](./line-overlay.md); this page covers the routing *system* and its global configuration.

::: tip Just want the mental model?
This page is the full config reference. For a short, diagram-driven overview of how the router decides a path, see [Routing Concepts](./routing-concepts.md).
:::

---

## Routing Modes

Set per line with `route:`:

| Mode | Description |
|------|-------------|
| `auto` | Default. Always full pathfinding — obstacle avoidance, trunk bundling, crossing avoidance — whether or not obstacles or channels are present. This is what `smart` means; `auto` just picks it automatically. |
| `direct` | Literal straight line between endpoints — never pathfinds, never detours |
| `manhattan` | Simple L-shaped single bend — no pathfinding, no bundling, no crossing avoidance. The explicit opt-out for the cheap, non-participating alternative to `auto` |
| `smart` | A* pathfinding plus refinement — obstacle avoidance, bundling, crossing avoidance. What `auto` resolves to |
| `grid` | Same participation as `smart` (pathfinding, bundling, crossing avoidance) without the extra local-search refinement pass — a lighter-weight opt-out for when `smart`'s refinement isn't wanted |
| `manual` | Explicit `waypoints` list — see [Manual Routing](./manual-routing.md) |

`direct`/`manhattan`/`manual` lines never move and never react to other lines, but their geometry **is still registered** — other lines will still avoid crossing them and can bundle alongside them. This makes `route: direct` (or a deliberate `route: manhattan`) useful for "wall" or backbone lines that must stay exactly where you drew them, and never get pulled into a bundle themselves.

---

## Trace Bundling (Trunk-and-Branch)

Lines whose paths run close and parallel automatically bundle — no configuration needed:

- The **first line's path becomes the trunk centerline** and never moves.
- Lines routing nearby **discover** the trunk and join it, riding evenly-spaced lanes alternating on either side of the centerline (`±line_spacing`, `±2×line_spacing`, …).
- Each line **branches away** where its own destination diverges from the trunk.
- The outcome **never depends on YAML declaration order** — the router pre-routes every line to a stable arrangement before rendering.

Bundling applies to any `auto` (the default), `smart`, or `grid` line — `manhattan`/`direct`/`manual` lines never join a bundle themselves (they can still be bundled *around*, since their geometry is still registered). Common tunables, set in the [`routing` object](#global-routing-configuration) or the Studio Routing tab's **Trace Bundling & Crossings** section:

| Option | Default | Description |
|--------|---------|-------------|
| `trunk_bundling_enabled` | `true` | Master switch for spontaneous bundling |
| `trunk_line_spacing` | `8` | Lane gap between bundled lines (viewBox units). Also sets how rounded lines' lane-separation corners can get, independent of `corner_radius` — see [Corner Size: Target vs. Forced](#corner-size-target-vs-forced) |
| `trunk_proximity` | `32` | How close a line must run to a trunk to bundle with it (viewBox units) |
| `trunk_bundle_weight` | `0.5` | How strongly joining a bundle is rewarded — higher pulls lines in from further detours |

A line only joins a trunk when doing so is actually cheaper overall than routing independently — bundling is a preference, never forced.

---

## Crossing Avoidance

A line's path is penalized for cutting orthogonally across another line's already-routed segment — *"traces never cross, unless we really really need to."* The penalty is a deterrent, not a hard block: if the only alternative is a long detour, the line crosses cleanly.

| Option | Default | Description |
|--------|---------|-------------|
| `crossing_avoid_enabled` | `true` | Master switch |
| `crossing_avoid_bias` | `4` | Penalty per crossing. Higher values accept longer detours to avoid a crossing; the default deters casual crossings but yields when a detour would be substantial |

Parallel travel is never penalized — bundle-mates riding adjacent lanes don't repel each other, and a line crossing *into* a bundle to reach an outer lane crosses the inner lanes freely (that's how a real raceway works).

---

## Corner Size: Target vs. Forced

A line's `corner_radius` (round/bevel corners) needs *room* to render at full size — enough straight leg on either side of the bend. Where that room comes from depends on `corner_radius_mode`, a per-line overlay property:

| Value | Behavior |
|-------|----------|
| `auto` (default) | `corner_radius` is a **target**. The router stays free to pick whatever departure/arrival shape crossing avoidance and bundling prefer; the rendered corner uses the full configured radius wherever the chosen path leaves room for it, and shrinks gracefully where it doesn't. |
| `forced` | `corner_radius` is a **hard requirement**. The line always reserves a straight lead-out/lead-in run of `2 × corner_radius` (floored at `min_stub_length_factor × grid_resolution`) before routing runs — guaranteeing the full radius renders everywhere, at the cost of removing that stretch from crossing avoidance's consideration entirely. Can force routing detours or unavoidable line crossings near tight geometry. |

If lines with a large `corner_radius` and an `anchor_side`/`attach_side` hint are crossing each other in places that look avoidable, that's this tradeoff in `forced`-equivalent form — `auto` (the default) is the fix. Use `forced` only where a specific line's corner must render at an exact size regardless of what else is nearby.

**Stroke width is factored into corner clearance**: a corner's rounding radius is clamped by how close the *nearest edge* of a neighboring line's stroke is, not just its centerline — so a thick line (`style.width`) gets a more conservative (smaller) effective radius near other lines than a thin one at the same spacing. This is why increasing `style.width` can visibly tighten a corner that looked fine at the default width — that's the fix for an older, worse problem (a wide stroke's inner edge rendering squared-off because the radius math ignored width entirely); if you want the original wider corner back, increase line spacing (`trunk_line_spacing` / channel `line_spacing`) rather than reducing `style.width`.

**Overriding the mandatory stub**: every routed line reserves a short, unsearched straight run right at departure/arrival (`stub_length` on the line overlay, viewBox units) before pathfinding starts. Leave it unset to use the router's own resolved default (grid-resolution-floored in `auto` corner mode, `2 × corner_radius` in `forced` mode — see above). Setting it below about one grid cell risks re-triggering an internal same-cell short-circuit for very short lines; check the router's own resolved value first via `window.lcards.debug.msd.routing.inspect(id).meta.debug` (see [Debugging](#debugging)) before tuning it down.

The floor underneath both of those auto-computed defaults — historically a flat 24 viewBox units, regardless of canvas size — is itself `min_stub_length_factor × grid_resolution` (card-wide, `msd.routing.min_stub_length_factor`, default `1`). A flat floor doesn't scale down with a small `view_box` the way `grid_resolution`'s own auto-scaling already does, so on a small canvas it can dominate disproportionately (e.g. force a longer lead-out than the corner_radius itself would need). Lower the factor there instead of fighting it per-line.

**Bundled lines get a shorter lead-in than `2 × corner_radius` would suggest, automatically.** When several lines separate onto their own parallel lanes before entering a shared channel/trunk, the little S-curve that does the separating has its own two corners — and those are constrained by how far apart the lanes are (`line_spacing`), not by `corner_radius`. The router accounts for this: it only reserves as much lead-in room as that S-curve can actually use, capped at whatever `2 × corner_radius` would have reserved. A large `corner_radius` (for the bigger bends elsewhere in the route) no longer forces every bundled line's lane-separation jog to travel further than it needs to just to "earn" a radius those particular corners were never going to render at anyway.

**Recovering corner room automatically** (`corner_room_weight`, `smart`/`auto` lines only): a third lever, independent of `corner_radius_mode`. A tight detour — two bends close enough together that `corner_radius` has to shrink to fit — is exactly the shape `corner_room_weight` targets: the router's own local refinement pass (the same one that nudges elbows away from obstacles under `smart_proximity`) also tries nudging elbows to recover a squashed corner's radius, accepting the nudge only when it's cheap enough to be worth it. Unlike `forced` mode's blind stub reservation, this is a real cost comparison — a route that leaves more room for the configured corner is preferred over the plain-cheapest route only when the difference in distance/bends is small, never at the cost of a much longer detour. **On by default** (`corner_room_weight: 4`, both card-wide in `msd.routing` and per-line) — the LCARS rounded-corner look is the intended out-of-the-box result. Set to `0` (card-wide or per-line) to opt out.

---

## Channels

Channels are **authored corridors**: rectangular regions with a flow direction that lines are rewarded for traveling through, penalized for entering, or forced to route through. A channel is simply a pre-seeded trunk — lines bundle through it with the same lane mechanics as spontaneous bundling.

::: warning Config location
`channels` lives directly under `msd:`, **not** under `msd.routing:`.
:::

```yaml
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 300]
  channels:
    main_bus:
      bounds: [250, 90, 300, 20]   # [x, y, width, height]
      mode: force                  # prefer | avoid | force
      direction: horizontal        # horizontal | vertical | auto (infer from shape)
      weight: 1                    # influence strength
      line_spacing: 10             # lane gap for bundled lines
      discoverable: true           # default; false = only route_channels users may ever use this channel
  anchors:
    a_start: [50, 100]
    a_end: [550, 100]
  overlays:
    - id: line_a
      type: line
      anchor: a_start
      attach_to: a_end
      route_channels: [main_bus]   # opt this line into the channel
      route: auto                  # default — always does full pathfinding
```

| Mode | Behavior |
|------|----------|
| `prefer` | The line compares "through the channel" against its plain route and takes the channel when it's cheaper overall |
| `avoid` | Entering the channel costs extra — lines route around it when reasonable |
| `force` | Lines referencing the channel **must** route through it, in the order listed in `route_channels` |

Lines opt in explicitly with `route_channels: [id, ...]` — and, separately, *any* `auto`/`smart`/`grid` line routing near a channel can also discover and bundle with it automatically, exactly like a discovered trunk, **whether or not it lists that channel in `route_channels`**. This is what makes zero-config bundling work, but it also means a channel is never scoped to only the line(s) it was authored for by default — a nearby, unrelated line can still spontaneously join it. Set `discoverable: false` on a channel to opt it out of that automatic pass entirely; it then only ever affects lines that explicitly reference it via `route_channels` (default is `true`, matching existing behavior).

**Lanes**: multiple lines through one channel get distinct, centered lanes — one line rides the channel's reference line, two ride `±line_spacing/2`, three ride `-spacing / 0 / +spacing`, and so on. Lanes are clamped to the channel's authored bounds, so make the channel at least `line_spacing × line_count` tall/wide for full separation.

---

## Obstacles

Any control overlay with `obstacle: true` is avoided by `auto`/`smart`/`grid` routing. `clearance` (global or per-line) adds padding around obstacles.

---

## Global Routing Configuration

Global defaults live in `msd.routing` (per-line properties override where applicable):

```yaml
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 300]
  routing:
    trunk_line_spacing: 10
    crossing_avoid_bias: 6
  overlays: []
```

### Common

| Field | Default | Description |
|-------|---------|-------------|
| `default_mode` | `auto` | Card-wide override for lines that don't set `route` (per-line `route:` still wins). Set to `manhattan`/`grid` to downgrade the whole card |
| `grid_resolution` | auto-scaled | Pathfinding cell size (viewBox units). Unset by default — scales to ~1/12th of the view_box's shorter dimension, clamped to `[16, 64]`; values below 5 are coerced to 32 |
| `min_stub_length_factor` | `1` | Multiplier on the resolved `grid_resolution` for the minimum mandatory lead-out/lead-in stub every line reserves before routing runs (see [Corner Size: Target vs. Forced](#corner-size-target-vs-forced)). `1` reserves at least one grid cell. Lower it on a small `view_box`, where a flat minimum would otherwise force every line to travel disproportionately far before its first turn |
| `turn_penalty` | `2` | Cost per direction change — higher = straighter paths |
| `clearance` | `0` | Padding around obstacles (viewBox units) |
| `corner_room_weight` | `4` | How strongly the refinement pass tries to recover a squashed corner's `corner_radius` (0 disables this trigger). On by default — see [Corner Size: Target vs. Forced](#corner-size-target-vs-forced). Also settable per-line. One of the two primary levers for corner appearance (the other, `corner_radius`, is per-line) |
| `trunk_bundling_enabled` | `true` | Spontaneous bundling master switch |
| `trunk_line_spacing` | `8` | Bundled lane gap (viewBox units). Also sets how rounded lines' lane-separation corners can get, independent of `corner_radius` — see [Corner Size: Target vs. Forced](#corner-size-target-vs-forced) |
| `trunk_proximity` | `32` | Bundling capture distance (viewBox units) |
| `trunk_bundle_weight` | `0.5` | Bundling reward strength |
| `crossing_avoid_enabled` | `true` | Crossing avoidance master switch |
| `crossing_avoid_bias` | `4` | Penalty per crossing |

### Advanced

Deep internals — rarely needed. Exposed in the Studio Routing tab under **Advanced Routing Configuration**.

| Field | Default | Description |
|-------|---------|-------------|
| `route_hint_penalty` | `6` | Cost for a first/last move disagreeing with `route_hint` |
| `smoothing_mode` / `smoothing_iterations` / `smoothing_max_points` | `none` / `1` / `160` | Chaikin path smoothing |
| `smart_proximity` | `0` | Obstacle proximity band for the refinement pass (0 disables this trigger; the *other* trigger, `corner_room_weight`, is a Common option — see above) |
| `smart_detour_span` / `smart_max_extra_bends` / `smart_min_improvement` / `smart_max_detours_per_elbow` | `48` / `3` / `4` / `4` | Refinement pass limits |
| `channel_force_penalty` | `800` | Cost for a route that misses a forced channel |
| `channel_avoid_multiplier` | `1.0` | Global multiplier on avoid-channel penalties |
| `channel_prefer_bias` / `channel_avoid_bias` | `0.9` / `3` | Per-cell A* discount/penalty inside prefer/avoid channels |
| `trunk_min_length` | `60` | Straight run needed to become a joinable trunk (viewBox units) |
| `trunk_min_overlap` | `60` | Shared travel needed for joining to be worthwhile (viewBox units) |
| `trunk_max_join_candidates` | `2` | Trunks one line will consider chaining through |
| `trunk_bundle_discount_cap` | `2000` | Ceiling on the distance credited toward a *discovered* trunk's cost discount (viewBox units). A generous safety bound, not a practical tuning knob — only engages on unrealistically long shared runs, and never applies to a channel you authored yourself (`mode: force`/`prefer`) |
| `trunk_discovery_max_passes` | `4` | Pre-render routing pass cap (order-independence safety limit) |
| `crossing_min_length` | `12` | Shortest segment other lines still avoid crossing (viewBox units) |
| `cost_defaults.bend` / `cost_defaults.proximity` | `10` / `4` | Route cost weights |

---

## Debugging

In the browser console:

```js
// The line's actual routed points, straight from the route cache (read-only)
window.lcards.debug.msd.routing.inspect('line_id')
// .meta.debug tells you what the router actually resolved for this line:
// { stubLength, gridResolution, cornerRadiusMode, cornerRadius }

// Router state: cache size, obstacle count, trunk/crossing registry counts
window.lcards.debug.msd.routing.stats()

// Every discovered/configured trunk on this card: id, direction, creator,
// member lines, and bounds — the same data the Studio "Discovered Trunks"
// overlay (below) renders graphically
window.lcards.debug.msd.routing.trunks('card_id')
```

In the **MSD Studio** editor's canvas toolbar, two debug overlays make this visible without the console: **Routing Grid** (amber lines — the router's own resolved pathfinding grid, distinct from the drag-snap grid) and **Discovered Trunks** (cyan bands — every spontaneously-bundled corridor currently in effect, with member counts). Both are off by default; toggle them from the overlay-toggle button group.

For the internals — how bundling, lane assignment, and the pre-render discovery loop actually work — see [Routing Engine Architecture](../../architecture/msd/routing.md).

## Known Limitations

A few rough edges are tracked and deliberately not yet fixed — not oversights, but tradeoffs where the only attempted fix caused a worse regression, or the fix is architecturally deep relative to how rarely the case comes up:

- **`trunk_proximity` is a hard cutoff, not a graduated cost.** A line either qualifies to join a nearby trunk or it doesn't — right at the boundary, a 1-unit change in geometry can flip bundling on or off abruptly rather than trading off gradually. Widening the gate to soften this was tried and reverted: it fixed the cliff in isolation but changed bundling decisions in unrelated, already-correct configs. If bundling snaps on/off unexpectedly near `trunk_proximity`'s edge, that's this — adjust `trunk_proximity` itself rather than expecting a graduated response.
- **A line with several mixed-direction trunk hops chained together** (e.g. joins a horizontal trunk, then a vertical one, then another) can occasionally pick a chain order that isn't the visually shortest one, showing up as a brief unnecessary backtrack at a chain boundary. Rare in practice — it needs several trunks chained in a row with mixed flow axes, which realistic small-to-medium diagrams don't usually produce (seen so far only in synthetic many-line stress tests).

## See Also

- [Routing Concepts](./routing-concepts.md) — the short, diagram-driven version of this page
- [Line Overlay](./line-overlay.md) — per-line properties, styling, markers
- [Manual Routing](./manual-routing.md) — explicit waypoints
- [MSD Card](./index.md) — card-level configuration
