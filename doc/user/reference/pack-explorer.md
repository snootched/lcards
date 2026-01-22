# Pack Explorer Reference

> **Visual tool for discovering LCARdS assets**
> Browse themes, style presets, animations, and components

## Overview

The **Pack Explorer** is a visual tool for discovering and browsing all assets available in loaded LCARdS packs. It provides an organized view of themes, style presets, animations, SVG assets, and components, making it easy to find and use the right asset for your card configuration.

## Opening the Pack Explorer

There are two ways to access the Pack Explorer:

### Method 1: From Theme Browser
1. Open the Home Assistant Lovelace UI
2. Edit a LCARdS card (any card type)
3. Navigate to the **Theme** tab in the card editor
4. Click the **"Browse All Packs"** button

### Method 2: Direct Access (Future Enhancement)
- Settings menu integration (planned)
- Developer tools panel (planned)

## Interface Overview

The Pack Explorer uses a **split-pane layout**:

```
┌────────────────────────────────────────────────────────┐
│  Pack Explorer                                    [X]  │
├────────────────┬───────────────────────────────────────┤
│ Tree View      │  Detail Panel                         │
│ (300px)        │  (flex: 1)                            │
│                │                                       │
│ Pack Loaded Packs│  [Selected Asset Details]             │
│  ├─ Themes Themes  │                                       │
│  │  ├─ Classic │  • Metadata                           │
│  │  ├─ DS9     │  • Description                        │
│  │  └─ Voyager │  • Version info                       │
│  ├─ Presets Presets │  • Preview (when available)           │
│  │  ├─ Buttons │  • Config reference                   │
│  │  │  ├─Lozenge│  • Copy button                        │
│  │  │  └─ Bullet│                                       │
│  │  └─ Sliders │                                       │
└────────────────┴───────────────────────────────────────┘
```

### Left Panel: Tree View
- **Hierarchical navigation** showing all loaded packs and their contents
- **Expandable categories** for themes, presets, and other asset types
- **Item counts** displayed next to each category (e.g., "Themes (4)")
- **Search box** at the top to filter by name (coming soon)

### Right Panel: Detail View
- **Asset metadata** (name, description, version, pack source)
- **Live previews** for themes (color swatches) and presets (dummy cards)
- **Config reference** showing the exact YAML syntax to use
- **Copy to Clipboard** button for quick insertion

## Using the Pack Explorer

### Browsing Packs

1. **Expand a pack** by clicking on it (e.g., `Pack builtin_themes`)
2. **Explore categories** within the pack (Themes, Presets, etc.)
3. **Select an asset** to view its details in the right panel

### Viewing Asset Details

Each asset type displays specific information:

#### Themes
- **Name**: User-friendly theme name
- **Description**: Theme purpose and style notes
- **Version**: Theme version number
- **Token Count**: Number of design tokens in the theme
- **Config Reference**: `theme: "theme-id"`

#### Style Presets
- **Name**: Preset identifier
- **Type**: Overlay type (button, slider, etc.)
- **Pack**: Source pack name
- **Extends**: Parent preset (if applicable)
- **Preview**: Visual preview of the preset (MVP: placeholder)
- **Config Reference**: `preset: "preset-name"`

#### Animations (Future)
- **Name**: Animation name
- **Duration**: Animation length in milliseconds
- **Easing**: Timing function
- **Loop**: Whether animation repeats

### Copying Configuration

1. **Select an asset** in the tree view
2. **Review the "Config Reference"** section in the detail panel
3. **Click "Copy to Clipboard"**
4. **Paste** into your card's YAML configuration

**Example workflow:**
```yaml
# Before: Basic button card
type: custom:lcards-button
entity: light.kitchen

# After: Button with lozenge preset copied from Pack Explorer
type: custom:lcards-button
entity: light.kitchen
preset: "lozenge"  # ← Copied from Pack Explorer
```

## Asset Types

### 1. Themes
Themes define the overall design language for LCARdS cards:
- Color palettes (LCARS colors, alert mode variants)
- Typography (font sizes, weights)
- Spacing & sizing tokens
- Component-specific defaults

**Usage:**
```yaml
type: custom:lcards-button
theme: "lcars-voyager"  # Voyager theme colors
```

### 2. Style Presets
Reusable style bundles for specific overlay types:
- **Button Presets**: `lozenge`, `bullet`, `capped`
- **Slider Presets**: `picard-vertical`, `lcars-horizontal`
- **Grid Presets**: (future)

**Usage:**
```yaml
type: custom:lcards-button
preset: "lozenge"
```

### 3. SVG Assets (Future)
MSD background images and decorative assets:
- Starship schematics (1701-A, Enterprise-D)
- Shuttlecraft diagrams
- Custom backgrounds

### 4. Animations (Future)
Pre-configured animation presets:
- Alert mode transitions
- Button hover effects
- MSD line animations

### 5. Components (Future)
Reusable UI components:
- D-pad controls
- Sliders
- Button variants

## Tips & Tricks

### Finding the Right Preset
1. Use the **search box** to filter by keyword
2. **Expand multiple packs** to compare available options
3. Check the **"Extends"** field to understand preset hierarchy

### Understanding Pack Sources
- `builtin_themes`: Official LCARdS themes
- `lcards_buttons`: Button style presets
- `lcards_sliders`: Slider style presets
- Custom packs: User-installed or third-party packs

### Troubleshooting

**Pack Explorer shows no packs:**
- Ensure LCARdS core is initialized (open any LCARdS card first)
- Check browser console for errors
- Reload Home Assistant dashboard

**Copy button doesn't work:**
- Ensure browser clipboard permissions are enabled
- Try manually copying from the config reference display

**Preview not showing:**
- MVP version shows placeholders for previews
- Full previews coming in future release

## Keyboard Shortcuts

(Planned features)
- `Ctrl+F` / `Cmd+F`: Focus search box
- `Esc`: Close dialog
- `↑` / `↓`: Navigate tree items
- `→`: Expand node
- `←`: Collapse node

## Future Enhancements

### Phase 2: Advanced Previews
- **Live theme swatches** with actual colors from theme tokens
- **Interactive preset previews** (clickable buttons, movable sliders)
- **Animation playback** with play/pause/restart controls
- **SVG zoom/pan** for detailed asset inspection

### Phase 3: Pack Management
- **Upload pack files** (`.json`) for preview before installation
- **Scan filesystem** for available packs in `/local/lcards-packs/`
- **Load/unload packs** dynamically without restart
- **Pack versioning** and update notifications

### Phase 4: Search & Filtering
- **Full-text search** across all asset names, descriptions, and metadata
- **Category filters** (themes only, presets only, etc.)
- **Pack filters** (show only builtin, hide custom packs)
- **Tag-based filtering** (LCARS-style, modern, retro)

## Related Documentation

- [Pack System Guide](../architecture/pack-system-guide.md) - Technical details of pack structure
- [Theme System](../architecture/subsystems/theme-system.md) - How themes work
- [Style Presets Guide](../development/style-presets.md) - Creating custom presets
- [Theme Creation Tutorial](advanced/theme_creation_tutorial.md) - Building custom themes

## Support

If you encounter issues with the Pack Explorer:
1. Check the GitHub Issues page
2. Review browser console for error messages
3. Report bugs with browser version, Home Assistant version, LCARdS version, and steps to reproduce

---

## See Also

- [Theme Creation Tutorial](./advanced/theme_creation_tutorial.md) - Building custom themes
- [Token Reference Card](./advanced/token_reference_card.md) - All theme tokens

---

[← Back to Reference](./README.md) | [User Guide →](../README.md)
