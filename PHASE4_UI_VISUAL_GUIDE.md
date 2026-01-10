# Phase 4: Lines Tab - UI Visual Guide

This document provides ASCII art mockups of the implemented UI components for the Lines Tab.

---

## 1. Lines Tab - Empty State

```
╔══════════════════════════════════════════════════════════════╗
║ 📋 Line Overlays                                             ║
║ Connect controls and anchors with lines                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ℹ️  No line overlays defined yet.                          ║
║                                                              ║
║      Line overlays connect anchors and controls on your     ║
║      MSD canvas. Click "Add Line" to create your first      ║
║      connection.                                             ║
║                                                              ║
║  [+ Add Line]  [🎯 Enter Connect Mode]                       ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ℹ️  About Line Overlays:                                   ║
║  • Lines connect anchors and controls to show relationships  ║
║  • Use "Enter Connect Mode" to click source → target         ║
║  • Routing modes: direct, manhattan, bezier, etc.           ║
║  • Customize: color, width, dash pattern, markers, animations║
╚══════════════════════════════════════════════════════════════╝
```

---

## 2. Lines Tab - With Lines

```
╔══════════════════════════════════════════════════════════════╗
║ 📋 Line Overlays                                             ║
║ Connect controls and anchors with lines                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐║
║  │ [SVG]  power_line_1        [manhattan]                   │║
║  │  ━━━   anchor:engine_core → anchor:shields               │║
║  │ #FF9900  [✏️ Edit] [👁️ Highlight] [🗑️ Delete]            │║
║  └─────────────────────────────────────────────────────────┘║
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐║
║  │ [SVG]  data_line_1         [direct]                      │║
║  │  ━ ━   control:button_1@right → control:gauge_1@left    │║
║  │ #00CCFF  [✏️ Edit] [👁️ Highlight] [🗑️ Delete]            │║
║  └─────────────────────────────────────────────────────────┘║
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐║
║  │ [SVG]  curved_conn        [bezier]                       │║
║  │  ━━━   anchor:nav → [100, 200]                          │║
║  │ #FFCC00  [✏️ Edit] [👁️ Highlight] [🗑️ Delete]            │║
║  └─────────────────────────────────────────────────────────┘║
║                                                              ║
║  [+ Add Line]  [🎯 Enter Connect Mode]                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Line Item Components**:
- **[SVG]**: 40x40px visual preview showing actual line style
- **Line ID**: Bold text (e.g., "power_line_1")
- **Routing Badge**: Colored pill showing mode (e.g., [manhattan])
- **Connection**: Source → Target formatted string
- **Actions**: Edit, Highlight, Delete icon buttons

---

## 3. Line Form Dialog - Connection & Routing Tab

```
╔══════════════════════════════════════════════════════════════╗
║ Add Line                                              [×]    ║
╠══════════════════════════════════════════════════════════════╣
║ [Connection & Routing]  Style & Animation                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Line ID: [power_line_1                    ] (disabled)      ║
║           Unique identifier for this line                    ║
║                                                              ║
║  ┌─ Source Point ──────────────────────────────────────────┐║
║  │ Set where the line source connects                       │║
║  │                                                          │║
║  │ Connection Type                                          │║
║  │ [Named Anchor           ▼]                               │║
║  │                                                          │║
║  │ Anchor                                                   │║
║  │ [engine_core            ▼]                               │║
║  │                                                          │║
║  │ Gap (pixels)                                             │║
║  │ [5                      ]                                │║
║  │ Distance from connection point                           │║
║  └──────────────────────────────────────────────────────────┘║
║                                                              ║
║  ┌─ Target Point ──────────────────────────────────────────┐║
║  │ Set where the line target connects                       │║
║  │                                                          │║
║  │ Connection Type                                          │║
║  │ [Control Overlay        ▼]                               │║
║  │                                                          │║
║  │ Control                                                  │║
║  │ [shields                ▼]                               │║
║  │                                                          │║
║  │ Attachment Point                                         │║
║  │ [Center                 ▼]                               │║
║  │                                                          │║
║  │ Gap (pixels)                                             │║
║  │ [5                      ]                                │║
║  │ Distance from connection point                           │║
║  └──────────────────────────────────────────────────────────┘║
║                                                              ║
║  ┌─ Routing ───────────────────────────────────────────────┐║
║  │ Configure how the line is drawn between points           │║
║  │                                                          │║
║  │ Routing Mode                                             │║
║  │ [Manhattan (90° angles) ▼]                               │║
║  │                                                          │║
║  │ [✓] Avoid Obstacles                                      │║
║  │                                                          │║
║  │ Channel (optional)                                       │║
║  │ [main_power             ]                                │║
║  │ Assign to a routing channel                              │║
║  └──────────────────────────────────────────────────────────┘║
║                                                              ║
║  [🎯 Enter Connect Mode]                                     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                            [💾 Save]  [✕ Cancel]             ║
╚══════════════════════════════════════════════════════════════╝
```

**Connection Type Options**:
1. **Named Anchor** → Shows anchor dropdown
2. **Control Overlay** → Shows control dropdown + attachment point selector
3. **Coordinates** → Shows X/Y number inputs

**Attachment Point Options** (9-point grid):
```
Top Left    Top Center    Top Right
Middle Left Center        Middle Right
Bottom Left Bottom Center Bottom Right
```

**Routing Mode Options**:
- Direct (straight line)
- Manhattan (90° angles)
- Orthogonal (right angles)
- Bezier (curved)
- Smart (auto-route)
- Grid-aligned

---

## 4. Line Form Dialog - Style & Animation Tab

```
╔══════════════════════════════════════════════════════════════╗
║ Add Line                                              [×]    ║
╠══════════════════════════════════════════════════════════════╣
║ Connection & Routing  [Style & Animation]                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─ Line Style ─────────────────────────────────────────────┐║
║  │ Configure the visual appearance of the line              │║
║  │                                                          │║
║  │ Color                                                    │║
║  │ [🎨 #FF9900] ◄── Color picker                            │║
║  │                                                          │║
║  │ Stroke Width                                             │║
║  │ ├──────●──────┤  3px                                     │║
║  │ 1              10                                        │║
║  │                                                          │║
║  │ Line Style                                               │║
║  │ [Dashed                 ▼]                               │║
║  │ Options: Solid, Dashed, Dotted, Dash-Dot                │║
║  │                                                          │║
║  │ Markers                                                  │║
║  │ [Arrow at End           ▼]                               │║
║  │ Options: None, Arrow at End, Start, Both Ends           │║
║  └──────────────────────────────────────────────────────────┘║
║                                                              ║
║  ┌─ Animation ─────────────────────────────────────────────┐║
║  │ Add motion effects to the line                           │║
║  │                                                          │║
║  │ Animation Preset                                         │║
║  │ [Data Flow              ▼]                               │║
║  │ Options: None, Data Flow, Pulse, Glow                   │║
║  │                                                          │║
║  │ Speed                                                    │║
║  │ ├────●────────────┤  2.0                                 │║
║  │ 0.1            5.0                                       │║
║  └──────────────────────────────────────────────────────────┘║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                            [💾 Save]  [✕ Cancel]             ║
╚══════════════════════════════════════════════════════════════╝
```

**Line Style Patterns**:
- **Solid**: `━━━━━━━━━`
- **Dashed**: `━━━ ━━━ ━━━`
- **Dotted**: `━ ━ ━ ━ ━`
- **Dash-Dot**: `━━━━ ━ ━━━━ ━`

**Marker Options**:
- **None**: `━━━━━━━`
- **Arrow at End**: `━━━━━▶`
- **Arrow at Start**: `◀━━━━━`
- **Both Ends**: `◀━━━━━▶`

**Animation Presets**:
- **None**: Static line
- **Data Flow**: Moving dashes along path
- **Pulse**: Fading in/out
- **Glow**: Glowing effect

---

## 5. Connection Point Selector - Anchor Type

```
┌─ Source Point ────────────────────────────────────────┐
│ Set where the line source connects                    │
│                                                       │
│ Connection Type                                       │
│ [Named Anchor           ▼]                            │
│                                                       │
│ Anchor                                                │
│ [engine_core            ▼] ◄── Dropdown of anchors    │
│                                                       │
│ Gap (pixels)                                          │
│ [5                      ]                             │
│ Distance from connection point                        │
└───────────────────────────────────────────────────────┘
```

---

## 6. Connection Point Selector - Control Type

```
┌─ Target Point ────────────────────────────────────────┐
│ Set where the line target connects                    │
│                                                       │
│ Connection Type                                       │
│ [Control Overlay        ▼]                            │
│                                                       │
│ Control                                               │
│ [shields                ▼] ◄── Dropdown of controls   │
│                                                       │
│ Attachment Point                                      │
│ [Center                 ▼] ◄── 9-point selector       │
│ • Top Left, Top, Top Right                           │
│ • Middle Left, Center, Middle Right                  │
│ • Bottom Left, Bottom, Bottom Right                  │
│                                                       │
│ Gap (pixels)                                          │
│ [5                      ]                             │
│ Distance from connection point                        │
└───────────────────────────────────────────────────────┘
```

**9-Point Attachment Grid Visual**:
```
┌───────┬───────┬───────┐
│  TL   │   T   │  TR   │  TL = Top Left
├───────┼───────┼───────┤  T  = Top Center
│  ML   │   C   │  MR   │  TR = Top Right
├───────┼───────┼───────┤  ML = Middle Left
│  BL   │   B   │  BR   │  C  = Center
└───────┴───────┴───────┘  MR = Middle Right
                           BL = Bottom Left
                           B  = Bottom Center
                           BR = Bottom Right
```

---

## 7. Connection Point Selector - Coordinates Type

```
┌─ Source Point ────────────────────────────────────────┐
│ Set where the line source connects                    │
│                                                       │
│ Connection Type                                       │
│ [Coordinates            ▼]                            │
│                                                       │
│ ┌─────────────────┬─────────────────┐                │
│ │ X               │ Y               │                │
│ │ [100          ] │ [200          ] │                │
│ └─────────────────┴─────────────────┘                │
│                                                       │
│ Gap (pixels)                                          │
│ [5                      ]                             │
│ Distance from connection point                        │
└───────────────────────────────────────────────────────┘
```

---

## 8. Control Dialog - Card Config Tab (Fixed)

**BEFORE (Phase 3 - Broken)**:
```
┌─────────────────────────────────────────────────────┐
│ Card Configuration                                  │
│ [▼ Generic UI Card Editor... nothing visible]      │
│                                                     │
│ ℹ️  Select a card type to configure                │
│    Use the selector above...                       │
└─────────────────────────────────────────────────────┘
```

**AFTER (Phase 4 - Fixed)**:
```
┌─────────────────────────────────────────────────────┐
│ ┌─ Card Type ──────────────────────────────────────┐│
│ │ Select the type of HA card to display           ││
│ │                                                  ││
│ │ Card Type                                        ││
│ │ [LCARdS Button          ▼]                       ││
│ │                                                  ││
│ │ Options:                                         ││
│ │ • Button Card                                    ││
│ │ • Entities Card                                  ││
│ │ • Entity Card                                    ││
│ │ • Glance Card                                    ││
│ │ • Light Card                                     ││
│ │ • LCARdS Button ✓                                ││
│ │ • LCARdS Gauge                                   ││
│ │ • LCARdS Slider                                  ││
│ │ • LCARdS Label                                   ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ ┌─ Card Configuration ─────────────────────────────┐│
│ │ Configure the card properties using HA UI editor ││
│ │                                                  ││
│ │ [Full HA Card Editor appears here...]           ││
│ │ • Entity selector                                ││
│ │ • Name field                                     ││
│ │ • Icon selector                                  ││
│ │ • etc...                                         ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 9. Cursor Feedback (Fixed)

**Mode Toolbar**:
```
┌────────────────────────────────────────────────────┐
│ [👁️ View] [📍 Place Anchor] [🎛️ Place Control]     │
│ [━ Connect Line] [📦 Draw Channel]                 │
│                                                    │
│ 👁️ Mode: View                                      │
└────────────────────────────────────────────────────┘
```

**Cursor States**:
- **View Mode**: `→` (default arrow cursor)
- **Place Anchor**: `✚` (crosshair)
- **Place Control**: `✚` (crosshair)
- **Connect Line**: `✚` (crosshair)
- **Draw Channel**: `✚` (crosshair)

**CSS Applied**:
```css
.preview-panel.mode-view { cursor: default; }
.preview-panel.mode-place_anchor { cursor: crosshair; }
.preview-panel.mode-place_control { cursor: crosshair; }
.preview-panel.mode-connect_line { cursor: crosshair; }
```

---

## 10. Grid Overlay (Fixed)

**BEFORE (Phase 3 - Invisible)**:
```
┌──────────────────────────────────────┐
│                                      │
│  [Can't see grid - too faint]        │
│                                      │
│         (no visible lines)           │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

**AFTER (Phase 4 - Visible)**:
```
┌──────────────────────────────────────┐
│ 0   50  100 150 200 250 300 350 400 │
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │ 0
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │ 50
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │ 100
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │
│ ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊   ┊  │ 150
└──────────────────────────────────────┘
```

**Grid Settings**:
- **Stroke Width**: 2px (was 0.5px)
- **Opacity**: 0.8 (was 0.2)
- **Color**: `rgba(255, 255, 255, 0.8)` (bright white)
- **Spacing**: Configurable (10, 20, 50, 100px)
- **Labels**: Show coordinates every 2 intervals

---

## Summary

All UI components have been implemented with:
- ✅ Professional appearance
- ✅ Clear visual hierarchy
- ✅ Helpful placeholder text
- ✅ Proper validation feedback
- ✅ Responsive layouts
- ✅ Consistent spacing (12px grid)
- ✅ Icon usage for actions
- ✅ Color-coded badges
- ✅ Visual previews
- ✅ Keyboard accessibility

**Total UI Components**: 10+ screens/dialogs
**Forms**: 2 major forms (Control, Line)
**Selectors**: 5 types (anchor, control, coords, routing, style)
**Visual Feedback**: Cursors, badges, previews, empty states
