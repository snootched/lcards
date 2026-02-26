# Slider Components

> SVG-based slider components for LCARdS slider cards

## Available Components

| Component | Description | Orientation | Features |
|-----------|-------------|-------------|----------|
| **default** | Simple slider with clean layout | Auto | Basic zones, border support |
| **picard** | Star Trek LCARS styled slider | Vertical | State-aware borders, animations, decorative frame |
| **demo** | Feature showcase (development) | Auto | All zones, all options, debug markers |
| **shaped** | Generic clip-path fill slider | Auto | Exterior label bands, configurable shape (lozenge/rect/rounded/diamond/hexagon/polygon/path) |

## Component Files

- [default.js](./default.js) - Base component implementation
- [picard.js](./picard.js) - Styled LCARS component with animations
- [demo.js](./demo.js) - Comprehensive demo showing all features
- [shaped.js](./shaped.js) - Generic clip-path component (lozenge, diamond, hexagon, etc.)
- [shapes.js](./shapes.js) - Shape clip-path builders used by shaped.js
- [index.js](./index.js) - Component registry

## Creating New Components

See **[COMPONENT_API.md](./COMPONENT_API.md)** for complete authoring guide:

- Component structure (`render`, `calculateZones`, `metadata`)
- Zone system (track, control, progress, range, text)
- Render context API
- Color resolution
- Configurable options
- Registration process

**Quick Start**: Use [demo.js](./demo.js) as a template - it demonstrates all available interfaces.

## Testing Components

Enable debug visualization with `show_zone_markers` config option to see zone boundaries.

```yaml
type: custom:lcards-slider
component: demo
entity: light.kitchen
show_zone_markers: true  # Shows colored zone outlines
show_grid: true          # Shows layout grid
```

## Architecture

Components use a **render function pattern** - they generate SVG shells with `data-zone` markers where the slider card injects dynamic content (pills, gauge, progress bars, text).

**Component**: Defines visual structure and zones
**Card**: Populates zones with state-driven content
**User**: Configures behavior via presets and options

---

For system architecture docs, see [/doc/architecture/](../../../../doc/architecture/)
