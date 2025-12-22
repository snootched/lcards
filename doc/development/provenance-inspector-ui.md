# Provenance Inspector UI Design

## Tab Content (Collapsed State)

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  🔍 Provenance Inspector                                 │
│                                                           │
│  127 fields tracked across 5 layers                      │
│  23 theme tokens resolved                                │
│                                                           │
│  Explore where each configuration value comes from:      │
│  defaults, theme, user config, presets, or dynamic       │
│  rules.                                                   │
│                                                           │
│  ┌─────────────────────────────────────┐                │
│  │  📁  Open Provenance Inspector      │                │
│  └─────────────────────────────────────┘                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Dialog (Config Tree View)

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Provenance Inspector                                            [Close]  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [Config Tree (127)]  [Theme Tokens (23)]  [Statistics]                  │
│  ────────────────────                                                     │
│                                                                           │
│  Card: lcards-button     Tracked: 127 fields     Layers: 5              │
│                                                                           │
│  🔍  Search fields... (Ctrl+F)                          [×]              │
│      Showing 42 of 127 fields                                            │
│                                                                           │
│  [All] [Defaults (35)] [Theme (18)] [User (12)] [Presets (8)] [Rules]   │
│                                                                           │
│  🔄 Refresh  ☑ Auto-refresh every [5] seconds                           │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ▼ Defaults                    DEFAULTS      15 fields                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Field Path         │ Value          │ Source        │ Actions       │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ label              │ "Button"       │ Defaults      │ 📋 📋        │ │
│  │ color              │ orange         │ Defaults      │ 📋 📋        │ │
│  │ style.width        │ 100%           │ Defaults      │ 📋 📋        │ │
│  │ ...                │ ...            │ ...           │ ...          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▼ Theme Overrides              THEME        8 fields                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ style.color        │ theme:colors.  │ Theme         │ 📋 📋        │ │
│  │                    │ primary        │               │              │ │
│  │ style.background   │ theme:colors.  │ Theme         │ 📋 📋        │ │
│  │                    │ background     │               │              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▼ User Config                   USER       12 fields                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ label              │ "My Button"    │ User          │ 📋 📋        │ │
│  │ entity             │ light.bedroom  │ User          │ 📋 📋        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▶ Presets                    PRESETS       0 fields                     │
│                                                                           │
│  ▶ Dynamic Rules                RULES       7 fields                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Dialog (Theme Tokens View)

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Provenance Inspector                                            [Close]  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [Config Tree]  [Theme Tokens (23)]  [Statistics]                        │
│                 ───────────────────                                       │
│                                                                           │
│  Card: lcards-button     Tracked: 127 fields     Layers: 5              │
│                                                                           │
│  🔍  Search tokens... (Ctrl+F)                          [×]              │
│      Showing 8 of 23 tokens                                              │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Token Path          │ Used By        │ Resolved  │ Preview │ Actions│ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ theme:colors.       │ style.color    │ #ff9800   │ [████]  │ 📋 📋 │ │
│  │ primary             │                │           │         │        │ │
│  │                     │                │           │         │        │ │
│  │ theme:colors.       │ style.         │ #000000   │ [████]  │ 📋 📋 │ │
│  │ background          │ background     │           │         │        │ │
│  │                     │ label.color    │           │         │        │ │
│  │                     │                │           │         │        │ │
│  │ theme:fonts.        │ label.font     │ Antonio   │         │ 📋 📋 │ │
│  │ primary             │                │           │         │        │ │
│  │                     │                │           │         │        │ │
│  │ theme:sizes.        │ style.width    │ 200px     │         │ 📋 📋 │ │
│  │ medium              │ style.height   │           │         │        │ │
│  │                     │                │           │         │        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Dialog (Statistics View)

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Provenance Inspector                                            [Close]  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [Config Tree]  [Theme Tokens]  [Statistics]                             │
│                                 ────────────                              │
│                                                                           │
│  Card: lcards-button     Tracked: 127 fields     Layers: 5              │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ TOTAL FIELDS     │  │ ACTIVE LAYERS    │  │ THEME TOKENS     │      │
│  │                  │  │                  │  │                  │      │
│  │      127         │  │       5          │  │       23         │      │
│  │                  │  │                  │  │                  │      │
│  │ Configuration    │  │ Configuration    │  │ Resolved tokens  │      │
│  │ fields tracked   │  │ layers           │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
│  ┌──────────────────┐                                                    │
│  │ USER OVERRIDES   │                                                    │
│  │                  │                                                    │
│  │      12          │                                                    │
│  │                  │                                                    │
│  │ Custom           │                                                    │
│  │ configurations   │                                                    │
│  └──────────────────┘                                                    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER DISTRIBUTION                                                  │ │
│  │                                                                     │ │
│  │  Defaults    ████████████████████████████████████       35         │ │
│  │  Theme       ███████████████                            18         │ │
│  │  User        ██████████                                 12         │ │
│  │  Presets     ██████                                      8         │ │
│  │  Rules       ████                                        5         │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ TOP THEME TOKENS                                                    │ │
│  │                                                                     │ │
│  │  Token Path              │ Usage Count │ Resolved Value           │ │
│  │  theme:colors.primary    │      8      │ #ff9800                  │ │
│  │  theme:colors.background │      6      │ #000000                  │ │
│  │  theme:fonts.primary     │      4      │ Antonio                  │ │
│  │  theme:sizes.medium      │      3      │ 200px                    │ │
│  │  theme:colors.text       │      2      │ #ffffff                  │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Color Coding

### Layer Badges
- **Defaults** - Gray (#9e9e9e) - Base configuration
- **Theme** - Blue (#2196f3) - Theme token overrides
- **User** - Green (#4caf50) - User's custom config
- **Presets** - Orange (#ff9800) - Style preset values
- **Rules** - Red (#f44336) - Dynamic rule patches

### Visual Hierarchy
```
┌─ Section Header (Secondary background, bold)
│  ▼ Layer Name          BADGE      Count
├─────────────────────────────────────────
│  Table (Primary background)
│  ┌─────────────────────────────────────┐
│  │ Path (Monospace)  │ Value │ Actions │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────
```

## Interactive Elements

### Buttons
- **Primary action**: Raised button with icon
- **Chip filters**: Rounded rectangles, active state highlighted
- **Icon buttons**: Copy, refresh, clear (Material icons)
- **Tab buttons**: Underline on active state

### Hover States
- Table rows: Subtle background on hover
- Buttons: Slight color change
- Color previews: Border highlight

### Click Actions
- **Copy icons**: Show toast notification
- **Color previews**: Copy color value
- **Column headers**: Toggle sort
- **Section headers**: Expand/collapse
- **Tab buttons**: Switch view

## Keyboard Shortcuts

- **Ctrl+F / Cmd+F**: Focus search input
- **ESC**: Close dialog
- **Enter** (in search): No action (real-time search)
- **Tab**: Navigate between elements

## Responsive Behavior

### Dialog Size
- **Width**: 90vw (90% of viewport width)
- **Max width**: 1400px (don't go too wide)
- **Height**: 60-80vh (60-80% of viewport height)
- **Min height**: 400px

### Table Overflow
- Horizontal scroll if content too wide
- Vertical scroll within dialog body
- Sticky table headers

### Mobile Considerations
- Search bar full width
- Filter chips wrap to multiple rows
- Stat cards stack vertically
- Reduce padding on small screens

---

**Design Philosophy**: Follow Material Design principles, match Home Assistant UI patterns, maintain consistency with Theme Token Browser, prioritize usability over aesthetics.
