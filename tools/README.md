# LCARdS Schema Editor

Visual tool for editing JSON Schema files with x-ui-hints.

## Quick Start

1. **Open the tool:** Open `schema-editor.html` in any modern web browser
2. **Add a property:** Click "+ Add Property" and enter a name
3. **Configure the property:** Use the editor panel to set type, constraints, and x-ui-hints
4. **Export:** Click "Copy" to copy the JSON or "Export" to download a file

## Features

### Core Functionality

- **Visual Property Management** - Add, remove, duplicate properties with one click
- **Type System** - Support for string, number, integer, boolean, object, array, and oneOf
- **Constraint Editors** - Min/max, pattern, enum, format for type-specific validation
- **x-ui-hints Configuration** - Full support for Home Assistant selector types
- **oneOf Branch Editor** - Visual management of oneOf branches with constraints
- **Choose Selector Wizard** - Automatic choice generation from oneOf branches ⭐
- **Template Library** - 6 pre-built templates for common patterns
- **Live JSON Preview** - Real-time syntax-highlighted preview
- **Import/Export** - Load from file/clipboard, export to file/clipboard
- **Undo/Redo** - 50-step history with keyboard shortcuts
- **Validation** - Real-time error checking

### Home Assistant Selectors (16 Types)

| Icon | Selector | Description |
|------|----------|-------------|
| 📝 | `text` | Text input (multiline, placeholder, prefix/suffix) |
| 🔢 | `number` | Number input (box/slider mode, min/max, unit) |
| 🔘 | `boolean` | Toggle switch |
| 🏠 | `entity` | Entity picker (domain filters, multiple) |
| 📋 | `select` | Dropdown/list selection |
| 🎨 | `icon` | MDI icon picker |
| 🎨 | `ui_color` | Native HA color picker |
| ⚡ | `ui_action` | Action configuration editor |
| 📦 | `object` | Structured object editor |
| 🔀 | `choose` | Visual type picker for oneOf schemas |
| ⏱️ | `duration` | Time duration input |
| 🕐 | `time` | Time of day picker |
| 📅 | `date` | Date picker |
| 🧩 | `addon` | Add-on selector |
| 🏘️ | `area` | Area picker |
| 📱 | `device` | Device picker |

### Template Library

1. **🔢 Number or Theme** - Numeric value with theme binding option (slider 0-100 or theme token)
2. **🏠 Entity Selector** - Standard Home Assistant entity picker
3. **🎨 Color by State** - Simple color or state-dependent colors (default/active/inactive)
4. **🎨 Icon Picker** - MDI icon selector
5. **⚡ Action Config** - Tap/hold action configuration
6. **📐 Per Corner** - Uniform value or per-corner object (top_left, top_right, etc.)

## Usage Guide

### Creating a Simple Property

1. Click **"+ Add Property"**
2. Enter property name (e.g., `label`)
3. Select type: `string`
4. Add title and description
5. Set format: `None`
6. In x-ui-hints:
   - Label: `Label`
   - Helper: `Text to display on button`
   - Selector: `📝 Text Input`
7. Copy JSON from preview panel

### Creating a oneOf Property with Choose Selector

**Example: Creating a "gap" property that accepts pixels OR theme tokens**

1. Click **"+ Add Property"** → Name: `gap`
2. Select **Type: "oneOf (Choose)"**
3. **Configure Branch 1 (Pixels):**
   - Title: `Pixels`
   - Type: `number`
   - Min: `0`
   - Max: `50`
4. **Configure Branch 2 (Theme Token):**
   - Title: `Theme Token`
   - Type: `string`
   - Pattern: `^\{theme:.*\}$`
5. **Configure x-ui-hints:**
   - Label: `Gap`
   - Helper: `Space between segments (pixels or theme token)`
   - Selector: **`🔀 Choose`**
6. Click **"✨ Auto-Generate Choices"** ⭐
7. **Result:** Complete schema with intelligent choices:

```json
{
  "gap": {
    "oneOf": [
      {
        "type": "number",
        "title": "Pixels",
        "minimum": 0,
        "maximum": 50
      },
      {
        "type": "string",
        "title": "Theme Token",
        "pattern": "^\\{theme:.*\\}$"
      }
    ],
    "x-ui-hints": {
      "label": "Gap",
      "helper": "Space between segments (pixels or theme token)",
      "selector": {
        "choose": {
          "choices": {
            "pixels": {
              "selector": {
                "number": {
                  "mode": "slider",
                  "min": 0,
                  "max": 50,
                  "step": 1,
                  "unit_of_measurement": "px"
                }
              }
            },
            "theme_token": {
              "selector": {
                "text": {
                  "placeholder": "{theme:}"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Using Templates

1. Click on any template in the **Templates** section (left panel)
2. Enter a property name when prompted
3. The template schema is inserted automatically
4. Modify as needed using the editor panel
5. Copy the final JSON

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save schema (in-memory) |
| `Ctrl/Cmd + Z` | Undo last change |
| `Ctrl/Cmd + Shift + Z` | Redo change |
| `Ctrl/Cmd + D` | Duplicate selected property |
| `Delete` | Delete selected property (with confirmation) |
| `Ctrl/Cmd + /` | Toggle help modal (coming soon) |

## Choose Selector Auto-Generation

The **Auto-Generate Choices** feature is the most powerful part of this tool. It automatically creates the `choices` object for `ha-selector-choose` based on your oneOf branches.

### Choice Key Generation Logic

1. **From Title:** Converts branch title to snake_case
   - `"Pixels"` → `"pixels"`
   - `"Theme Token"` → `"theme_token"`
   - `"Per Corner"` → `"per_corner"`

2. **From Type Pattern:** Analyzes branch type and patterns
   - Number → `"number"`
   - String with `{theme:` pattern → `"theme"`
   - Object → `"object"`

3. **Fallback:** Sequential numbering
   - `"option_1"`, `"option_2"`, etc.

### Selector Generation Logic

For each branch, the tool generates an appropriate selector:

- **Number (max ≤ 100):** Slider mode with `unit_of_measurement: "px"`
- **Number (max > 100):** Box mode
- **String with theme pattern:** Text input with `placeholder: "{theme:}"`
- **String with format:** Appropriate selector (icon, entity, color)
- **String with enum:** Select dropdown with options
- **Boolean:** Boolean switch
- **Object:** Object editor

## Import/Export

### Import

**From File:**
1. Click **"📁 Load ▼"** → **"From File"**
2. Select a `.json` file
3. Schema is loaded and replaces current content

**From Clipboard:**
1. Copy JSON schema to clipboard
2. Click **"📁 Load ▼"** → **"From Clipboard"**
3. Schema is parsed and loaded

### Export

**To File:**
1. Click **"📤 Export ▼"** → **"To File"**
2. File downloads as `untitled.json` (or current filename)

**To Clipboard:**
1. Click **"📤 Export ▼"** → **"To Clipboard"**
2. OR click **"📋 Copy"** in JSON Preview panel
3. JSON is copied to clipboard

## Validation

The tool validates your schema in real-time:

✅ **Valid Schemas:**
- All properties have `type` or `oneOf`
- Number constraints: `minimum ≤ maximum`
- `choose` selector has corresponding `oneOf`
- `oneOf` arrays are not empty

❌ **Invalid Schemas:**
- Missing `type` or `oneOf` → Error: "Missing type or oneOf"
- `minimum > maximum` → Error: "Minimum > Maximum"
- `choose` selector without `oneOf` → Error: "choose selector requires oneOf"
- Empty `oneOf` array → Error: "oneOf is empty"

Click **"✓ Validate"** to run full validation and see all errors.

## Tips & Best Practices

### Naming Properties

- Use lowercase with underscores: `border_radius`, `font_size`
- Be descriptive: `gap` not `g`, `label` not `lbl`
- Match existing LCARdS conventions

### oneOf Branches

- Always provide meaningful titles: `"Pixels"`, `"Theme Token"`, not `"Option 1"`
- Order branches by likelihood of use (most common first)
- Use constraints to clarify valid ranges

### x-ui-hints

- Always provide `label` - it's the user-facing name
- Use `helper` text to explain what the field does
- Choose the right selector type for the best UX

### Choose Selector

- Use for 2-3 common alternatives (pixels vs theme, simple vs per-corner)
- Don't overuse - too many choices confuses users
- Let auto-generation do the work - it handles the complex `choices` object

## Troubleshooting

### Problem: Auto-Generate Choices button is disabled

**Solution:** The `choose` selector requires a `oneOf` schema. Make sure:
1. Property type is set to `oneOf (Choose)`
2. At least one branch exists
3. The `🔀 Choose` selector is selected

### Problem: JSON Preview shows "properties": {}

**Solution:** No properties have been added yet. Click **"+ Add Property"** to get started.

### Problem: Validation shows errors but JSON looks correct

**Solution:** Some validation rules are strict:
- Ensure all `oneOf` branches have unique identifiable types
- Check that `minimum` is less than or equal to `maximum`
- Verify `choose` selector has a corresponding `oneOf`

### Problem: Undo/Redo not working

**Solution:** Undo/Redo only works after you've made changes that trigger `pushHistory()`:
- Adding/removing properties
- Changing types or constraints
- Modifying x-ui-hints

## Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome/Edge (Chromium) | ✅ Fully supported |
| Firefox | ✅ Fully supported |
| Safari | ✅ Fully supported |
| IE11 | ❌ Not supported (use modern browser) |

## Technical Details

- **Framework:** None (vanilla JavaScript)
- **Dependencies:** Zero runtime dependencies
- **File Size:** 47KB (uncompressed)
- **Lines of Code:** ~1,250 lines (500 CSS, 200 HTML, 500 JS)
- **Architecture:** Single-page application with class-based state management

## Related Documentation

- [LCARdS x-ui-hints Documentation](../doc/editor/schema-ui-hints.md)
- [Home Assistant Selector Reference](https://www.home-assistant.io/docs/blueprint/selectors/)
- [JSON Schema Specification](https://json-schema.org/)
- [LCARdS FormFieldHelper](../src/editor/components/shared/lcards-form-field.js)

## License

Part of the LCARdS project. See main LICENSE file for details.

---

**Questions?** Open an issue on GitHub or refer to the LCARdS documentation.
