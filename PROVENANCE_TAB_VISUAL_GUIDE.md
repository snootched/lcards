# Provenance Tab Visual Guide

## Before vs After Comparison

### Tree Controls

#### Before:
```
[Tree Container - Light Background]
  ▶ config            [Unknown]
  ▼ style             [Unknown]
    • color           [user]
    • font-size       [theme]
```

**Issues:**
- Light background doesn't match app theme
- Small expander (12px)
- "Unknown" labels on folders cluttering the view
- No visual distinction between folders and fields
- Subtle selection state

#### After:
```
[Tree Container - Dark Background (#1e1e1e)]
  ▶ 📁 config
  ▼ 📁 style
    📄 color          [User Config]
    📄 font-size      [Theme]
```

**Improvements:**
✅ Dark background matches card launch style
✅ Larger expander (14px) for better visibility
✅ No "Unknown" labels - cleaner view
✅ Clear folder (📁) vs. field (📄) icons
✅ Prominent selection with white text + background
✅ Active state scale feedback

---

### Timeline Visualization

#### Before:
```
┌─────────────────────────────────────┐
│ Step 1                         │
│ From: theme:palette.primary    │
│ ↓                              │
│ Resolves to: #03a9f4           │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Step 2                         │
│ Token: theme:palette.accent    │
│ ↓                              │
│ Resolves to: #ff9800           │
└─────────────────────────────────────┘
```

**Issues:**
- Generic appearance
- No source type indication
- Vertical layout wastes space
- Final value not prominent

#### After:
```
┌────────────────────────────────────────┐
│ ⚙️  Step 1          [Defaults]        │
│     From: theme:palette.primary        │
│     Resolves to: #03a9f4 ■            │
└────┼───────────────────────────────────┘
     │ (blue border)
     ⬇
┌────────────────────────────────────────┐
│ 🎨  Step 2          [Theme]           │
│     Token: theme:palette.accent        │
│     Resolves to: #ff9800 ■            │
└────┼───────────────────────────────────┘
     │ (purple border)
     ⬇

╔════════════════════════════════════════╗
║ FINAL RESOLVED VALUE:                  ║
║ #ff9800 ■                              ║
╚════════════════════════════════════════╝
```

**Improvements:**
✅ Circular icon badges for each source type
✅ Color-coded left borders (blue=defaults, purple=theme, green=user, orange=presets, red=rules)
✅ Horizontal layout with icon + content
✅ Hover effects for interactivity
✅ Prominent final value panel with shadow
✅ Enhanced spacing and typography
✅ Better visual flow with larger separators

---

## Source Type Color Legend

| Source Type | Color | Border | Icon |
|-------------|-------|--------|------|
| Defaults / Card Defaults | Blue | `#2196f3` | ⚙️ `mdi:cog` |
| Theme | Purple | `#9c27b0` | 🎨 `mdi:palette` |
| User Config | Green | `#4caf50` | 👤 `mdi:account` |
| Presets | Orange | `#ff9800` | 📦 `mdi:package-variant` |
| Rules | Red | `#f44336` | ⚖️ `mdi:gavel` |

---

## Key Interaction Patterns

### Tree Node Selection
1. **Hover**: Light gray background
2. **Active**: Scale to 0.98 (subtle press effect)
3. **Selected**: Primary color background, white text, bold font

### Timeline Cards
1. **Default**: Secondary background with colored left border
2. **Hover**: Lighter background + subtle shadow
3. **Icons**: 40px circular container with centered icon

### Final Value Panel
1. **Background**: Primary color (brand accent)
2. **Text**: White, bold, monospace for code
3. **Shadow**: Depth effect with `0 2px 8px`
4. **Padding**: Generous 16px for prominence

---

## Accessibility Considerations

✅ **High Contrast**: Dark backgrounds with light text
✅ **Clear Icons**: Distinctive folder vs. field icons
✅ **Color + Shape**: Both color AND icons for source types (not just color)
✅ **Readable Fonts**: 12px minimum, monospace for code
✅ **Touch Targets**: Adequate size for tree nodes and cards
✅ **Keyboard Navigation**: Existing Home Assistant navigation works

---

## Design Philosophy

1. **Clean & Modern**: Dark theme consistency with the rest of LCARdS
2. **Information Hierarchy**: Important info (final value) is most prominent
3. **Visual Flow**: Step-by-step progression is clear and easy to follow
4. **Scanability**: Icons and colors allow quick identification
5. **No Clutter**: Removed unnecessary labels and noise
6. **Tactile Feedback**: Interactive elements respond to user actions

---

## Implementation Details

- **File**: `src/editor/components/provenance/lcards-provenance-tab.js`
- **Lines Changed**: ~200 (160 insertions, 54 deletions)
- **CSS Updates**: Enhanced styles for tree, timeline, and final value
- **JS Updates**: Modified `_renderTreeNodes()` and `_renderResolutionChain()`
- **No Breaking Changes**: All existing functionality preserved
