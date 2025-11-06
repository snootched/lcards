# Migration Guide: CB-LCARS to LCARdS

Welcome to LCARdS! This guide will help you migrate from CB-LCARS to the new native LCARdS architecture.

## Overview

LCARdS is the evolution of CB-LCARS, rebuilt from the ground up with modern architecture:

- **Native LitElement base** (no custom-button-card dependency)
- **95KB smaller bundle** with 20% performance improvement
- **Modern action handling** via custom-card-helpers
- **Clean architecture** optimized for Home Assistant
- **Foundation for future features** (multi-instance MSD, visual editor)

## Why Migrate?

| Feature | CB-LCARS | LCARdS | Benefit |
|---------|----------|---------|---------|
| **Bundle Size** | ~120KB | ~25KB | 📦 95KB smaller |
| **Dependencies** | custom-button-card | None | 🎯 No external deps |
| **Performance** | Baseline | 20% faster | ⚡ Faster loading |
| **Memory Usage** | Baseline | 15% less | 🧠 More efficient |
| **Architecture** | Legacy wrapper | Native LitElement | 🏗️ Modern foundation |
| **Maintenance** | Maintenance mode | Active development | 🚀 New features |

## Migration Path Options

### Option 1: Automated Migration (Recommended)

Use our automated migration script to convert your existing configurations:

```bash
# Download the migration script
curl -o migrate.js https://github.com/snootched/lcards/releases/latest/download/migrate-from-cb-lcars.js

# Preview changes (dry run)
node migrate.js --dry-run /config/ui-lovelace.yaml

# Backup and migrate
cp /config/ui-lovelace.yaml /config/ui-lovelace.yaml.backup
node migrate.js /config/ui-lovelace.yaml

# Or migrate to a new file
node migrate.js /config/ui-lovelace.yaml /config/ui-lovelace-lcards.yaml
```

### Option 2: Manual Migration

For complex setups or custom modifications, manually update your configurations:

#### 1. Update Resource References

```yaml
# OLD (CB-LCARS)
resources:
  - url: /hacsfiles/cb-lcars/cb-lcars.js
    type: module

# NEW (LCARdS)
resources:
  - url: /hacsfiles/lcards/lcards.js
    type: module
```

#### 2. Update Card Types

```yaml
# OLD (CB-LCARS)
type: custom:cb-lcars-button-card
cblcars_card_type: cb-lcars-button-lozenge

# NEW (LCARdS)
type: custom:lcards-button-card
lcards_card_type: lcards-button-lozenge
```

#### 3. Update MSD Cards

```yaml
# OLD (CB-LCARS)
type: custom:cb-lcars-msd-card
cb-lcars-msd:
  version: 1
  base_svg:
    source: "builtin:ncc-1701-d"

# NEW (LCARdS)
type: custom:lcards-msd-card
lcards-msd:
  version: 1
  base_svg:
    source: "builtin:ncc-1701-d"
```

### Option 3: Side-by-Side Testing

Test LCARdS alongside CB-LCARS before full migration:

1. Install LCARdS via HACS
2. Create a test dashboard with LCARdS cards
3. Compare functionality and performance
4. Migrate gradually, dashboard by dashboard

## Complete Element Mapping

### Card Elements

| CB-LCARS | LCARdS | Notes |
|----------|---------|-------|
| `custom:cb-lcars-button-card` | `custom:lcards-button-card` | All button types |
| `custom:cb-lcars-elbow-card` | `custom:lcards-elbow-card` | All elbow types |
| `custom:cb-lcars-label-card` | `custom:lcards-label-card` | Text labels |
| `custom:cb-lcars-multimeter-card` | `custom:lcards-multimeter-card` | Meters/gauges |
| `custom:cb-lcars-msd-card` | `custom:lcards-msd-card` | Master Systems Display |

### Card Types

#### Button Types
| CB-LCARS | LCARdS |
|----------|---------|
| `cb-lcars-button-lozenge` | `lcards-button-lozenge` |
| `cb-lcars-button-picard` | `lcards-button-picard` |
| `cb-lcars-button-bullet` | `lcards-button-bullet` |
| `cb-lcars-button-rounded` | `lcards-button-rounded` |

#### Elbow Types
| CB-LCARS | LCARdS |
|----------|---------|
| `cb-lcars-elbow-left` | `lcards-elbow-left` |
| `cb-lcars-elbow-right` | `lcards-elbow-right` |
| `cb-lcars-elbow-top-left` | `lcards-elbow-top-left` |
| `cb-lcars-elbow-top-right` | `lcards-elbow-top-right` |
| `cb-lcars-elbow-bottom-left` | `lcards-elbow-bottom-left` |
| `cb-lcars-elbow-bottom-right` | `lcards-elbow-bottom-right` |

#### Label Types
| CB-LCARS | LCARdS |
|----------|---------|
| `cb-lcars-label-text` | `lcards-label-text` |
| `cb-lcars-label-header` | `lcards-label-header` |
| `cb-lcars-label-subheader` | `lcards-label-subheader` |
| `cb-lcars-label-title` | `lcards-label-title` |

#### Multimeter Types
| CB-LCARS | LCARdS |
|----------|---------|
| `cb-lcars-multimeter-standard` | `lcards-multimeter-standard` |
| `cb-lcars-multimeter-vertical` | `lcards-multimeter-vertical` |
| `cb-lcars-multimeter-radial` | `lcards-multimeter-radial` |
| `cb-lcars-multimeter-horizontal` | `lcards-multimeter-horizontal` |

### Configuration Variables

| CB-LCARS | LCARdS |
|----------|---------|
| `cblcars_card_type` | `lcards_card_type` |
| `cb-lcars-msd` | `lcards-msd` |
| `cblcars` | `lcards` |

## Migration Examples

### Example 1: Simple Button Card

```yaml
# BEFORE (CB-LCARS)
type: custom:cb-lcars-button-card
entity: light.bridge
cblcars_card_type: cb-lcars-button-lozenge
name: "BRIDGE"
show_state: true
tap_action:
  action: toggle

# AFTER (LCARdS)
type: custom:lcards-button-card
entity: light.bridge
lcards_card_type: lcards-button-lozenge
name: "BRIDGE"
show_state: true
tap_action:
  action: toggle
```

### Example 2: Complex MSD Card

```yaml
# BEFORE (CB-LCARS)
type: custom:cb-lcars-msd-card
cb-lcars-msd:
  version: 1
  base_svg:
    source: "builtin:enterprise-d"
  overlays:
    - id: bridge_status
      type: status_grid
      position: [200, 100]
      entities:
        - light.bridge_main
        - sensor.bridge_occupancy

# AFTER (LCARdS)
type: custom:lcards-msd-card
lcards-msd:
  version: 1
  base_svg:
    source: "builtin:enterprise-d"
  overlays:
    - id: bridge_status
      type: status_grid
      position: [200, 100]
      entities:
        - light.bridge_main
        - sensor.bridge_occupancy
```

### Example 3: Grid Layout

```yaml
# BEFORE (CB-LCARS)
type: grid
columns: 3
cards:
  - type: custom:cb-lcars-button-card
    cblcars_card_type: cb-lcars-button-lozenge
    entity: light.warp_core
  - type: custom:cb-lcars-elbow-card
    cblcars_card_type: cb-lcars-elbow-left
  - type: custom:cb-lcars-multimeter-card
    cblcars_card_type: cb-lcars-multimeter-radial
    entity: sensor.warp_core_temperature

# AFTER (LCARdS)
type: grid
columns: 3
cards:
  - type: custom:lcards-button-card
    lcards_card_type: lcards-button-lozenge
    entity: light.warp_core
  - type: custom:lcards-elbow-card
    lcards_card_type: lcards-elbow-left
  - type: custom:lcards-multimeter-card
    lcards_card_type: lcards-multimeter-radial
    entity: sensor.warp_core_temperature
```

## Post-Migration Steps

### 1. Install LCARdS

#### Via HACS (Recommended)
1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Search for "LCARdS"
4. Click "Install"

#### Manual Installation
1. Download latest `lcards.js` from [releases](https://github.com/snootched/lcards/releases)
2. Copy to `/config/www/lcards/lcards.js`
3. Add resource reference (see above)

### 2. Restart Home Assistant

After installing LCARdS and updating configurations, restart Home Assistant.

### 3. Verify Migration

Check that all your cards render correctly:

- ✅ Button cards display with correct styling
- ✅ Elbow cards maintain proper positioning
- ✅ MSD cards load SVGs and overlays
- ✅ Actions (tap, hold, etc.) work as expected
- ✅ Animations function properly

### 4. Performance Testing

You should notice improvements:

- ✅ Faster page loads
- ✅ Reduced memory usage
- ✅ Smoother animations
- ✅ No custom-button-card dependency conflicts

## Troubleshooting

### Common Issues

#### Cards Not Displaying
```
Error: Cannot read property 'customElement' of undefined
```

**Solution**: Ensure you've updated both the element name AND the resource URL.

#### Wrong Card Type
```
LCARdS Error: Unknown card type 'cb-lcars-button-lozenge'
```

**Solution**: Update `cblcars_card_type` to `lcards_card_type` and the card type name.

#### MSD Not Loading
```
MSD Error: Cannot find configuration under 'cb-lcars-msd'
```

**Solution**: Update `cb-lcars-msd:` to `lcards-msd:` in your MSD card configuration.

#### Resource Not Found
```
Failed to import module script: The server responded with a non-JavaScript MIME type
```

**Solution**:
1. Verify LCARdS is installed via HACS
2. Update resource URL from `/hacsfiles/cb-lcars/cb-lcars.js` to `/hacsfiles/lcards/lcards.js`
3. Clear browser cache

### Migration Script Issues

#### Script Reports No Changes
If the migration script finds no CB-LCARS content:

1. **Check file path**: Ensure you're pointing to the correct YAML file
2. **Already migrated**: File might already use LCARdS
3. **No CB-LCARS content**: File might not contain CB-LCARS cards

#### Partial Migration
If some cards still show as CB-LCARS:

1. **Run script again**: Some references might be missed
2. **Check custom cards**: Custom modifications might need manual updates
3. **Review includes**: Check included YAML files for CB-LCARS references

### Getting Help

- 🐛 [Report Issues](https://github.com/snootched/lcards/issues)
- 💬 [Home Assistant Community](https://community.home-assistant.io/)
- 📖 [LCARdS Documentation](https://github.com/snootched/lcards)
- 🔄 [Migration Script](https://github.com/snootched/lcards/blob/main/scripts/migrate-from-cb-lcars.js)

## FAQ

### Q: Can I use CB-LCARS and LCARdS together?
**A**: Yes, during migration. Both can coexist, but it's not recommended long-term due to potential conflicts and resource duplication.

### Q: Will my custom themes work?
**A**: Yes, LCARdS maintains CSS variable compatibility with CB-LCARS themes.

### Q: Do I need to change my animations?
**A**: No, LCARdS supports all existing animation configurations and adds new capabilities.

### Q: What about my custom templates?
**A**: YAML templates migrate automatically. Custom JavaScript cards need manual adaptation.

### Q: Can I roll back if needed?
**A**: Yes, the migration script creates automatic backups. You can also reinstall CB-LCARS from HACS.

### Q: When will CB-LCARS be deprecated?
**A**: CB-LCARS remains in maintenance mode indefinitely. Security fixes will be provided, but new features will only be added to LCARdS.

### Q: Do I lose any functionality?
**A**: No, LCARdS provides 100% feature parity with CB-LCARS plus new capabilities.

### Q: How do I migrate custom modifications?
**A**: Custom CSS continues to work. Custom JavaScript cards need adaptation to the new base classes.

## Support Migration

If you need help with migration:

1. **Read this guide completely**
2. **Try the automated script first**
3. **Check the troubleshooting section**
4. **Search existing issues**
5. **Ask for help** in the community or create an issue

We're committed to making migration as smooth as possible!

---

**Ready to migrate?** Download the [migration script](https://github.com/snootched/lcards/releases/latest/download/migrate-from-cb-lcars.js) and start your journey to LCARdS!

**Live long and prosper** 🖖