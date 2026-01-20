# Pack Explorer Dialog - UI Mockup

## Visual Layout

The Pack Explorer Dialog uses a **split-pane layout** inspired by the DataSource Browser pattern:

```
┌──────────────────────────────────────────────────────────────────┐
│  Pack Explorer                                             [X]   │
├─────────────────────┬────────────────────────────────────────────┤
│                     │                                            │
│  [Search box...]    │  📦 builtin_themes v1.0.0                  │
│                     │  Official LCARS theme definitions          │
│  📦 builtin_themes  │  ─────────────────────────────────────────│
│    ▶ 🎨 Themes (4)  │                                            │
│                     │  Statistics:                               │
│  📦 lcards_buttons  │  ┌──────────┬──────────┬──────────┬───────┐│
│    ▼ 🎛️ Presets (8) │  │ Themes   │ Presets  │ Rules    │Assets ││
│       ▶ button (5)  │  │    4     │    0     │    0     │   0   ││
│       ▶ slider (3)  │  └──────────┴──────────┴──────────┴───────┘│
│                     │                                            │
│  📦 lcards_sliders  │                                            │
│    ▼ 🎛️ Presets (6) │                                            │
│       ▶ button (0)  │                                            │
│       ▶ slider (6)  │                                            │
│                     │                                            │
│  📦 builtin_msd_bg  │                                            │
│    ▶ 🖼️ SVG (12)    │                                            │
│                     │                                            │
└─────────────────────┴────────────────────────────────────────────┘
      300px                         flex: 1
```

## Theme Detail View

When a theme is selected:

```
┌────────────────────────────────────────────────────────────────┐
│  lcars-classic                                                 │
│  ────────────────────────────────────────────────────────────│
│                                                                │
│  Description:                                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Classic LCARS theme with authentic Star Trek colors       ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Pack:        builtin_themes                                   │
│  Version:     1.0.0                                            │
│  Token Count: 247 tokens                                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Theme Preview                                              ││
│  │ Theme contains 247 design tokens.                          ││
│  │ Includes custom CSS file.                                  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Config Reference:                                             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ theme: "lcars-classic"                                     ││
│  └──────────────────────────────────────────────────────────┘│
│  [Copy to Clipboard]                                           │
└────────────────────────────────────────────────────────────────┘
```

## Preset Detail View

When a style preset is selected:

```
┌────────────────────────────────────────────────────────────────┐
│  lozenge                                                       │
│  ────────────────────────────────────────────────────────────│
│                                                                │
│  Description:                                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Rounded lozenge-style button with LCARS aesthetics        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Type:     button                                              │
│  Pack:     lcards_buttons                                      │
│  Extends:  button.base                                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Preset Preview                                             ││
│  │ This is a button preset.                                   ││
│  │ Extends: button.base                                       ││
│  │                                                            ││
│  │ ╔════════════════════════════╗                            ││
│  │ ║ [Live preview coming soon] ║                            ││
│  │ ╚════════════════════════════╝                            ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Config Reference:                                             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ preset: "lozenge"                                          ││
│  └──────────────────────────────────────────────────────────┘│
│  [Copy to Clipboard]                                           │
└────────────────────────────────────────────────────────────────┘
```

## Color Scheme

The Pack Explorer follows existing LCARdS editor styling:

- **Background**: `var(--card-background-color)` - Light theme: white, Dark theme: dark gray
- **Dividers**: `var(--divider-color)` - Subtle separator lines
- **Primary Text**: `var(--primary-text-color)` - Main content text
- **Secondary Text**: `var(--secondary-text-color)` - Labels and metadata
- **Accent**: `var(--primary-color)` - Buttons, selected items, stat values
- **Secondary BG**: `var(--secondary-background-color)` - Cards, stat boxes, preview areas

## Responsive Behavior

**Desktop (>768px):**
- Split pane: 300px tree | remaining detail panel
- Both panels visible side-by-side

**Mobile (<768px):**
- Stacked layout: Tree on top, detail on bottom
- Tree max height: 300px with scroll
- Detail panel below with full width

## Interaction States

**Tree Node:**
- Default: Normal background
- Hover: `var(--secondary-background-color)`
- Selected: `var(--primary-color)` background, `var(--text-primary-color)` text
- Expanded: Triangle rotated 90°

**Copy Button:**
- Default: Primary color background
- Hover: 90% opacity
- Clicked: Shows "✓ Copied!" for 2 seconds

**Search Box:**
- Focus: Border highlight with primary color
- Active filtering: Shows "X results" below box

## Icons

Uses Home Assistant Material Design Icons (mdi):

- 📦 Pack: `mdi:package-variant`
- 🎨 Theme: `mdi:palette`
- 🎛️ Preset: `mdi:tune` or `mdi:cog`
- 🖼️ SVG: `mdi:image`
- ✨ Animation: `mdi:animation`
- 📐 Component: `mdi:puzzle`

## Example Tree States

**Collapsed Pack:**
```
📦 lcards_buttons
  ▶ 🎛️ Presets (8)
```

**Expanded Pack:**
```
📦 lcards_buttons
  ▼ 🎛️ Presets (8)
     ▶ button (5)
     ▶ slider (3)
```

**Fully Expanded:**
```
📦 lcards_buttons
  ▼ 🎛️ Presets (8)
     ▼ button (5)
        lozenge
        bullet
        capped
        base
        picard
     ▶ slider (3)
```

## CSS Classes

Key CSS classes used:

- `.explorer-container` - Main grid container
- `.tree-panel` - Left navigation panel
- `.detail-panel` - Right content panel
- `.tree-node` - Individual tree item
- `.tree-node.selected` - Selected tree item
- `.tree-node.expanded` - Expanded tree item
- `.detail-card` - Detail content card
- `.detail-header` - Asset name header
- `.detail-section` - Metadata section
- `.detail-value` - Monospace value display
- `.copy-button` - Copy action button
- `.stat-card` - Statistics display box
- `.preview-label` - Preview section title
- `.preview-placeholder` - Coming soon placeholder

---

**Note:** This is a text-based mockup. For actual screenshots, deploy to Home Assistant and capture with browser dev tools.
