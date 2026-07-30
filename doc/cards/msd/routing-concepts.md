# Routing Concepts

MSD lines route themselves like **cable raceways** on a circuit board: they find their own way around obstacles, bundle together when they're heading the same direction, and avoid cutting across each other when a small detour is cheap enough. This page is the short version of *how the router decides a path* — a mental model, not the full config reference.

::: tip Just want the config knobs?
This page explains the concepts. For every mode, field, and tunable default, see [Line Routing & Channels](./routing.md).
:::

---

## The Decision Flow

For every line, on every recompute, the router works through the same sequence:

```mermaid
flowchart TD
    A[Line needs a route] --> B{route mode?}
    B -->|direct / manhattan / manual| C[Fixed shape<br/>no pathfinding]
    B -->|auto, smart, or grid| D{Obstacle<br/>in the way?}
    D -->|yes| E[Detour around it]
    D -->|no| F{Force channel<br/>referenced?}
    E --> F
    F -->|yes| G[Must route through it]
    F -->|no| H{Nearby trunk or channel<br/>worth joining?}
    H -->|yes, cheaper overall| I[Bundle into a shared lane]
    H -->|no, or not worth it| J[Route independently]
    G --> K{Would this cross<br/>another line's path?}
    I --> K
    J --> K
    K -->|yes, small detour avoids it| L[Step around the crossing]
    K -->|no, or detour too costly| M[Final path]
    L --> M
    C --> M
    M --> N[Registered<br/>other lines can now discover and bundle with this one]
```

Two things worth calling out that a flowchart's yes/no boxes can't fully capture: bundling and crossing-avoidance are always **cost comparisons**, never hard rules — a line only joins a bundle or takes a detour when doing so is genuinely cheaper than the alternative. And this whole sequence runs for *every* line, repeatedly, until the arrangement settles — so the order you declared your lines in never affects the outcome.

---

## Obstacles

Any control with `obstacle: true` is something every `auto`/`smart`/`grid` line routes around automatically — no per-line config needed.

![A line detouring around an obstacle box](/img/msd-routing-obstacle-avoidance.svg)

---

## Automatic Bundling

Lines heading the same general direction, running close enough to each other, merge into a shared corridor — riding evenly-spaced lanes — and branch apart again where their destinations actually diverge. This is entirely automatic: no channel, no config, just lines that happen to be going the same way.

![Three lines merging into a shared lane-separated corridor, then branching apart at their destinations](/img/msd-routing-trunk-bundling.svg)

---

## Channels

A channel is an **authored** corridor — a region you draw yourself that lines are rewarded for traveling through (`mode: prefer`), penalized for entering (`avoid`), or required to use (`force`). Where automatic bundling only happens between lines that are already naturally close, a channel can pull a line off a path it wouldn't otherwise take, when the discount makes it worthwhile.

![A line bending off its natural path to ride through an authored prefer channel](/img/msd-routing-channel-prefer.svg)

---

## Crossing Avoidance

A line's path is penalized for cutting across another already-routed line's segment. It's a deterrent, not a wall — when stepping around is cheap, the router takes the detour; when the only alternative is a long way around, it crosses cleanly instead.

![A line stepping around another line's path instead of crossing straight through it](/img/msd-routing-crossing-avoidance.svg)

---

## Where to Go Next

- [Line Routing & Channels](./routing.md) — every mode, field, and tunable default
- [Line Overlay](./line-overlay.md) — per-line properties, styling, markers
- [MSD Quick Start](./quick-start.md) — build your first MSD, UI-only
- [Routing Engine Architecture](../../architecture/msd/routing.md) — internals: registries, lane assignment, the discovery loop
