# Picard Component Visual Layout

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│  Top borders (state-aware)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│  ▓ = Blue when active (#2766FF)
│ ▓[✦]                  ░░░░        │       Gray when inactive (#9DA4B9)
│ ▓                     ░░          │  ░ = Gray border (#9DA4B9)
│                                   │  [✦] = Animated indicator (optional)
│                                   │
│        [P]        [R]    [TRACK]  │  Zones (vertical layout):
│        [R]        [A]    [       │    [P] = Progress zone (cyan bar)
│        [O]        [N]    [ PILLS │    [R] = Range zone (colored bars)
│        [G]        [G]    [   OR  │    [TRACK] = Track zone
│        [R]        [E]    [ GAUGE │                (pills/gauge)
│        [E]        [S]    [       │
│        [S]        [ ]    [       │  All zones scale proportionally
│        [S]        [F]    [       │  with container size
│                   [R]            │
│                   [A]            │
│                   [M]            │
│                   [E]            │
│                   [ ]            │
│                                  │
│                                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░│  Bottom borders
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░│  (same colors as top)
└─────────────────────────────────────┘

Reference Dimensions: 365 × 601 px
Orientation: Vertical
```

## Zone Details (at reference dimensions)

### Progress Zone (Left column)
- Position: (100, 92)
- Size: 19 × 421 px
- Content: Cyan (#00EDED) progress bar
- Fills from bottom to top based on value

### Range Zone (Middle column)
- Position: (148, 84)
- Size: 16 × 418 px
- Content: Colored range bars with labels
- Each range has:
  - Outer rect (black border)
  - Inner rect (range color)
  - 5px inset gap
- Decorative blue frame around zone

### Track Zone (Right column)
- Position: (183, 72)
- Size: 146 × 441 px
- Content: Pills or gauge (from preset)
- Largest zone for main content

## Example with Pills

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓[✦]                  ░░░░        │
│ ▓                     ░░          │
│                                   │
│        ░░░░        ┌─┐    ████   │  Value: 75%
│        ░░░░        │W│    ████   │  Progress: Cyan bar at 75%
│        ████        │A│    ████   │  Ranges: Cold/OK/Warm zones
│        ████        │R│    ████   │  Pills: Filled to 75%
│        ████        │M│    ████   │
│        ████        └─┘    ████   │
│        ████        ┌─┐    ████   │
│        ████        │O│    ░░░░   │
│        ████        │K│    ░░░░   │
│                    └─┘            │
│                    ┌─┐            │
│                    │C│            │
│                    │O│            │
│                    │L│            │
│                    │D│            │
│                    └─┘            │
│                                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░│
└─────────────────────────────────────┘

Pills mode: Segmented colored bars
Progress: Independent cyan bar shows value
Ranges: Cold (blue), OK (green), Warm (orange)
```

## Example with Gauge

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓[✦]                  ░░░░        │
│ ▓                     ░░          │
│                                   │
│        ░░░░        ┌─┐    30°─┤  │  Value: 22°C
│        ░░░░        │W│    28°─┤  │  Progress: Cyan bar at ~73%
│        ████        │A│    26°─┤  │  Ranges: Temp zones
│        ████        │R│    24°─┤  │  Gauge: Ruler with ticks
│        ████        │M│    22°─●  │         ● = indicator
│        ████        └─┘    20°─┤  │
│        ████        ┌─┐    18°─┤  │
│        ████        │O│    16°─┤  │
│        ████        │K│    14°─┤  │
│                    └─┘            │
│                    ┌─┐            │
│                    │C│            │
│                    │O│            │
│                    │L│            │
│                    │D│            │
│                    └─┘            │
│                                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░│
└─────────────────────────────────────┘

Gauge mode: Ruler with tick marks
Progress: Separate cyan bar (independent)
Indicator: ● shows current value on ruler
```

## State Changes

### Entity State: OFF (inactive)

```
┌─────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░  ░░░░░░░░░░░░│  All borders gray
│ ░░░░░░░░░░░░░░░░░░░░  ░░░░░░░░░░░░│  No animation indicator
│ ░                     ░░░░        │
│ ░                     ░░          │
│                                   │
│        (empty)                    │  Progress zone empty
│                                   │  Pills/gauge visible but
│                       ░░░░        │  not filled
│                       ░░░░        │
│                       ░░░░        │
│                                   │
│                                   │
│ ░░░░░░░░░░░░░░░░░░░░  ░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░  ░░░░░░░░░░░│
└─────────────────────────────────────┘
```

### Entity State: ON (active)

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│  Top/bottom-left blue
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│  Animation pulsing
│ ▓[✦]                  ░░░░        │
│ ▓                     ░░          │
│                                   │
│        ████                       │  Progress bar filled
│        ████       ████            │  Pills filled based on value
│        ████       ████            │
│                                   │
│                                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░│
└─────────────────────────────────────┘
```

## Customization Examples

### Custom Border Colors

```yaml
style:
  border:
    top:
      color:
        on: '#FF0000'   # Red when active
        off: '#666666'  # Dark gray when inactive
```

Result:
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│  Red borders when ON
│ ▓[✦]                  ░░░░        │  (instead of blue)
```

### No Animation

```yaml
show_animation: false
```

Result:
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓                     ░░░░        │  No [✦] indicator
```

### Rounded Corners

```yaml
style:
  border:
    radius: 12
```

Result:
```
╭─────────────────────────────────────╮  Rounded corners
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓[✦]                  ░░░░        │
...
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
╰─────────────────────────────────────╯
```

## Scaling Behavior

The component scales proportionally to fit any container size while maintaining the original aspect ratio (365:601).

```
Small (182×300):        Large (730×1202):
┌──────────────────┐    ┌─────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓  ░░░░░│    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│ ▓[✦]     ░░    │    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░░░░░│
│                 │    │ ▓[✦]                          ░░░░        │
│   [P][R] [TRACK]│    │ ▓                             ░░          │
│   [R][A] [      │    │                                           │
│   [O][N] [PILLS │    │        [P]          [R]          [TRACK] │
│   [G][G] [      │    │        [R]          [A]          [       │
│   [R][E] [      │    │        [O]          [N]          [ PILLS │
│   [E][S] [      │    │        [G]          [G]          [   OR  │
│        [ ] [      │    │        [R]          [E]          [ GAUGE │
│                 │    │        [E]          [S]          [       │
│ ▓▓▓▓▓▓▓▓  ░░░░░│    │        [S]          [ ]          [       │
│ ▓▓▓▓▓▓▓▓  ░░░░░│    │        [S]          [F]          [       │
└──────────────────┘    │                    [R]                   │
                        │                    [A]                   │
All zones scale         │                    [M]                   │
proportionally          │                    [E]                   │
                        │                    [ ]                   │
                        │                                          │
                        │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░│
                        │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ░░░░░░░░│
                        └─────────────────────────────────────────────┘
```

All dimensions scale by the same factors:
- Scale X = containerWidth / 365
- Scale Y = containerHeight / 601

This ensures the component maintains its visual appearance at any size.
