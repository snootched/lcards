# LCARdS Examples Directory

This directory contains comprehensive examples for LCARdS components and cards.

## Data Grid Card Examples

### 📋 [data-grid-css-grid-comprehensive.yaml](./data-grid-css-grid-comprehensive.yaml)
**Full CSS Grid Feature Demonstration**
- Mixed track sizing (repeat, minmax, fr units, fixed sizes)
- Container alignment (justify-content, align-content)
- Separate gap controls (row-gap vs column-gap)
- Dense packing with grid-auto-flow
- Implicit grid sizing (grid-auto-columns/rows)
- Item alignment (justify-items, align-items)
- Complex layouts combining all features

**Use when:** Learning CSS Grid properties, implementing advanced layouts

---

### 🎨 [data-grid-hierarchical-styling.yaml](./data-grid-hierarchical-styling.yaml)
**5-Level Style Hierarchy Examples**
- Grid-wide base styling
- Row-level overrides
- Cell-level fine-grained control
- Spreadsheet mode with column/row/cell hierarchy
- Complete hierarchy demonstration

**Style Priority:** Grid → Header → Column → Row → Cell (lowest to highest)

**Use when:** Building complex styled grids, understanding style precedence

---

### 🎭 [data-grid-theme-tokens.yaml](./data-grid-theme-tokens.yaml)
**Theme Token Integration**
- Direct theme tokens (`theme:colors.lcars.blue`)
- Computed functions:
  - `alpha()` - Apply opacity
  - `darken()` / `lighten()` - Adjust brightness
  - `saturate()` / `desaturate()` - Adjust saturation
  - `mix()` - Blend two colors
- All 10 LCARS palette colors
- Complex token composition

**Use when:** Implementing theme-aware designs, using dynamic colors

---

### ⚡ [data-grid-performance.yaml](./data-grid-performance.yaml)
**Large Grid & Performance Optimization**
- 20×20 grid (400 cells) with full features
- 25×25 grid (625 cells) - extreme test
- High-frequency updates with performance limits
- Change detection optimization
- Performance comparison with/without animation
- Best practices and recommendations

**Tested Limits:**
- ✅ 400 cells: Smooth with animation + change detection
- ✅ 625 cells: Works, disable change detection recommended
- 📊 Recommended maximum: 500 cells with full features

**Use when:** Building large dashboards, optimizing performance

---

### 🔄 [data-grid-backward-compatibility.yaml](./data-grid-backward-compatibility.yaml)
**Legacy Format Support & Migration**
- Old format examples (rows/columns)
- Migration guide from legacy to CSS Grid
- Side-by-side comparison
- Benefits of CSS Grid format

**Note:** Legacy format still works but generates deprecation warnings

**Use when:** Migrating old configs, understanding format evolution

---

## Other Component Examples

### 🎮 [component-dpad-examples.yaml](./component-dpad-examples.yaml)
**D-Pad Component**
- 9-segment interactive control
- Media player integration
- Full remote control layouts
- Directional navigation

---

### 🖼️ [button-svg-background.yaml](./button-svg-background.yaml)
**Button with SVG Backgrounds**
- Custom SVG button styling
- Background integration examples

---

## Quick Start

1. **Copy examples** to your Home Assistant config directory
2. **Edit entity IDs** to match your setup (for datasource/template modes)
3. **Customize styling** using theme tokens or direct CSS
4. **Test in dashboard** - examples use `---` separators for multiple cards

## Documentation

- **Full Documentation:** `/doc/user/configuration/cards/data-grid.md`
- **Test Summary:** `/doc/DATA_GRID_COMPLETE_TEST_SUMMARY.md`
- **Architecture:** `/doc/architecture/`

## Tips

- Start with simple examples and build complexity
- Use theme tokens for consistency (`theme:colors.*`)
- Monitor performance with large grids (check console)
- Leverage style hierarchy to avoid repetition
- Test on actual devices for real-world performance

## Build Version

Examples tested with **LCARdS v1.9.51** (December 7, 2025)
