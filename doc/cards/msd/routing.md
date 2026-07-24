# Line Routing & Channels

MSD lines are routed like **cable raceways** on a circuit board: lines that travel in the same direction bundle together into evenly-spaced parallel lanes, branch apart where their destinations diverge, and avoid cutting across each other unless a crossing is genuinely the best option. This page covers how routing decides a line's path, how automatic bundling works, and how to guide it with channels.

Per-line properties (`route`, `route_hint`, `anchor_side`, `waypoints`, …) are documented in [Line Overlay](./line-overlay.md); this page covers the routing *system* and its global configuration.

---

## Routing Modes

Set per line with `route:`:

| Mode | Description |
|------|-------------|
| `auto` | Default. Resolves to `manhattan` for simple layouts, and upgrades to `smart` automatically when obstacles exist (`obstacle: true` controls) or the line references channels |
| `direct` | Literal straight line between endpoints — never pathfinds, never detours |
| `manhattan` | Simple L-shaped single bend |
| `smart` | A* pathfinding plus refinement — obstacle avoidance, bundling, crossing avoidance |
| `grid` | A* pathfinding without the refinement pass |
| `manual` | Explicit `waypoints` list — see [Manual Routing](./manual-routing.md) |

::: warning `auto` is only smart when something triggers the upgrade
With no obstacles and no channels, `route: auto` renders a plain manhattan elbow — and **manhattan lines never bundle or avoid crossings** (there is no pathfinding to influence). If you want trace bundling or crossing avoidance in a layout without obstacles, set `route: smart` explicitly.
:::

`direct` lines never move, but their geometry **is still registered** — other lines will still avoid crossing them and can bundle alongside them. This makes `route: direct` useful for "wall" or backbone lines that must stay exactly where you drew them.

---

## Trace Bundling (Trunk-and-Branch)

Lines whose paths run close and parallel automatically bundle — no configuration needed:

- The **first line's path becomes the trunk centerline** and never moves.
- Lines routing nearby **discover** the trunk and join it, riding evenly-spaced lanes alternating on either side of the centerline (`±line_spacing`, `±2×line_spacing`, …).
- Each line **branches away** where its own destination diverges from the trunk.
- The outcome **never depends on YAML declaration order** — the router pre-routes every line to a stable arrangement before rendering.

Bundling applies to `smart`/`grid` lines (and `auto` once upgraded). Common tunables, set in the [`routing` object](#global-routing-configuration) or the Studio Routing tab's **Trace Bundling & Crossings** section:

| Option | Default | Description |
|--------|---------|-------------|
| `trunk_bundling_enabled` | `true` | Master switch for spontaneous bundling |
| `trunk_line_spacing` | `8` | Lane gap between bundled lines (px) |
| `trunk_proximity` | `32` | How close a line must run to a trunk to bundle with it (px) |
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
  anchors:
    a_start: [50, 100]
    a_end: [550, 100]
  overlays:
    - id: line_a
      type: line
      anchor: a_start
      attach_to: a_end
      route_channels: [main_bus]   # opt this line into the channel
      route: auto                  # channels auto-upgrade auto -> smart
```

| Mode | Behavior |
|------|----------|
| `prefer` | The line compares "through the channel" against its plain route and takes the channel when it's cheaper overall |
| `avoid` | Entering the channel costs extra — lines route around it when reasonable |
| `force` | Lines referencing the channel **must** route through it, in the order listed in `route_channels` |

Lines opt in explicitly with `route_channels: [id, ...]` — and a line routing *near* a channel can also discover and bundle with it automatically, exactly like a discovered trunk.

**Lanes**: multiple lines through one channel get distinct, centered lanes — one line rides the channel's reference line, two ride `±line_spacing/2`, three ride `-spacing / 0 / +spacing`, and so on. Lanes are clamped to the channel's authored bounds, so make the channel at least `line_spacing × line_count` tall/wide for full separation.

---

## Obstacles

Any control overlay with `obstacle: true` is avoided by `smart`/`grid` routing (and triggers `auto`'s upgrade). `clearance` (global or per-line) adds padding around obstacles.

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
| `default_mode` | `manhattan` | Routing mode for lines that don't set `route` |
| `auto_upgrade_simple_lines` | `true` | Let `auto`/`manhattan` upgrade to `smart` when obstacles/channels exist |
| `clearance` | `0` | Padding around obstacles (px) |
| `trunk_bundling_enabled` | `true` | Spontaneous bundling master switch |
| `trunk_line_spacing` | `8` | Bundled lane gap (px) |
| `trunk_proximity` | `32` | Bundling capture distance (px) |
| `trunk_bundle_weight` | `0.5` | Bundling reward strength |
| `crossing_avoid_enabled` | `true` | Crossing avoidance master switch |
| `crossing_avoid_bias` | `4` | Penalty per crossing |

### Advanced

Deep internals — rarely needed. Exposed in the Studio Routing tab under **Advanced Routing Configuration**.

| Field | Default | Description |
|-------|---------|-------------|
| `grid_resolution` | `64` | Pathfinding cell size (px); values below 5 are coerced to 32 |
| `turn_penalty` | `2` | Cost per direction change — higher = straighter paths |
| `route_hint_penalty` | `6` | Cost for a first/last move disagreeing with `route_hint` |
| `smoothing_mode` / `smoothing_iterations` / `smoothing_max_points` | `none` / `1` / `160` | Chaikin path smoothing |
| `smart_proximity` | `0` | Obstacle proximity band for the refinement pass (0 disables refinement) |
| `smart_detour_span` / `smart_max_extra_bends` / `smart_min_improvement` / `smart_max_detours_per_elbow` | `48` / `3` / `4` / `4` | Refinement pass limits |
| `channel_force_penalty` | `800` | Cost for a route that misses a forced channel |
| `channel_avoid_multiplier` | `1.0` | Global multiplier on avoid-channel penalties |
| `channel_prefer_bias` / `channel_avoid_bias` | `0.9` / `3` | Per-cell A* discount/penalty inside prefer/avoid channels |
| `trunk_min_length` | `60` | Straight run needed to become a joinable trunk (px) |
| `trunk_min_overlap` | `60` | Shared travel needed for joining to be worthwhile (px) |
| `trunk_max_join_candidates` | `2` | Trunks one line will consider chaining through |
| `trunk_discovery_max_passes` | `4` | Pre-render routing pass cap (order-independence safety limit) |
| `crossing_min_length` | `12` | Shortest segment other lines still avoid crossing (px) |
| `cost_defaults.bend` / `cost_defaults.proximity` | `10` / `4` | Route cost weights |

---

## Debugging

In the browser console:

```js
// The line's actual routed points, straight from the route cache (read-only)
window.lcards.debug.msd.routing.inspect('line_id')

// Router state: cache size, obstacle count, trunk/crossing registry counts
window.lcards.debug.msd.routing.stats()
```

For the internals — how bundling, lane assignment, and the pre-render discovery loop actually work — see [Routing Engine Architecture](../../architecture/msd/routing.md).

## See Also

- [Line Overlay](./line-overlay.md) — per-line properties, styling, markers
- [Manual Routing](./manual-routing.md) — explicit waypoints
- [MSD Card](./index.md) — card-level configuration
