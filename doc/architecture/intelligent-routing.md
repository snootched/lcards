# Intelligent Routing Mode Selection

## Overview

LCARdS now includes intelligent automatic routing mode selection that upgrades lines from simple Manhattan routing to smart multi-bend routing when complexity is detected. This eliminates the need for manual `route_mode_full: smart` configuration in most cases.

## Features

### 1. Automatic Mode Upgrade

Lines with `route_channels` specified automatically upgrade from `manhattan` to `smart` mode, enabling multi-bend channel routing without manual configuration.

**Before (Manual):**
```yaml
overlays:
  - id: line1
    type: line
    anchor: a1
    attach_to: a2
    route_channels: [bus1]
    route_mode_full: smart  # ❌ Required manual configuration
```

**After (Automatic):**
```yaml
overlays:
  - id: line1
    type: line
    anchor: a1
    attach_to: a2
    route_channels: [bus1]
    # ✅ Automatically upgrades to smart mode
```

### 2. Global Routing Defaults

Set default routing behavior for all lines in your MSD card:

```yaml
msd:
  routing:
    default_mode: smart  # Apply to all lines unless overridden
    auto_upgrade_simple_lines: true  # Enable automatic upgrades
    
    # Optional: Set global channel defaults
    channel_target_coverage: 0.75
    channel_shaping_max_attempts: 20
    channel_shaping_span: 64
```

**Available `default_mode` options:**
- `manhattan` - Simple L-shaped paths (1 bend maximum)
- `smart` - Multi-bend intelligent routing with channel support
- `grid` - A* grid-based pathfinding
- `auto` - Let the system decide (same as omitting)

### 3. Waypoint Channels

Force lines to pass through specific regions using waypoint channels:

```yaml
routing:
  channels:
    critical_junction:
      bounds: [400, 300, 100, 100]
      type: waypoint  # ✅ Forces paths through this region
      
overlays:
  - id: mandatory_line
    type: line
    anchor: start
    attach_to: end
    route_channels: [critical_junction]
    route_channel_mode: force  # Ensures waypoint coverage
```

**Channel Types:**

| Type | Behavior | Penalty if Missed |
|------|----------|-------------------|
| `bundling` | Soft preference (rewards inside) | None |
| `avoiding` | Soft avoidance (penalizes inside) | None |
| `waypoint` | **Hard requirement** | **High penalty** |

### 4. MSD Studio Integration

When drawing channels in MSD Configuration Studio:

1. Draw a channel rectangle (Draw Channel mode)
2. Studio automatically detects intersecting lines
3. Click **"Route Through (Prefer)"** to auto-configure all affected lines
4. Lines are updated with optimal settings:
   - `route_mode_full: smart`
   - `route_channel_mode: prefer`
   - `channel_shaping_max_attempts: 20`
   - `channel_shaping_span: 64`

## Auto-Upgrade Logic

The system automatically upgrades to smart routing when:

1. **Channels are present**: Line has `route_channels` array with at least one channel
2. **Obstacles exist**: Line has obstacles in the scene (unless using `avoid` mode)
3. **Global default**: `routing.default_mode` is set to `smart`

**Conditions that prevent auto-upgrade:**
- Explicit `route_mode_full` is set (user choice is respected)
- `auto_upgrade_simple_lines: false` is configured
- Line explicitly set to `route_mode_full: manhattan`

## Route Metadata

Auto-upgraded routes include debugging metadata:

```javascript
const router = document.querySelector('lcards-msd')._msdPipeline.coordinator.router;
const routeInfo = router.inspect('line_id');

console.log(routeInfo.meta);
// {
//   strategy: 'grid-smart-preface',
//   modeAutoUpgraded: true,
//   autoUpgradeReason: 'channels_present',
//   cost: 450,
//   channel: { ... }
// }
```

## Performance

Auto-upgrade detection adds minimal overhead:
- Runs once per route request at build time
- Only checks channel/obstacle presence (fast)
- Results are cached by RouterCore
- Performance counters: `routing.mode.auto_upgrade.channels`, `routing.mode.auto_upgrade.obstacles`

## Migration

**Breaking Changes:** None - auto-upgrade is opt-in via detection or explicit config.

**Existing Configurations:** Lines with explicit `route_mode_full` settings continue to work exactly as before.

## Testing

Auto-upgrade scenarios are available in the browser console:

```javascript
// Run all auto-upgrade tests
window.__msdScenarios.autoUpgrade.runAll()

// List available tests
window.__msdScenarios.autoUpgrade.list()

// Run specific test
window.__msdScenarios.autoUpgrade.run('channels-auto-upgrade')
```

## Configuration Examples

### Example 1: Simple Auto-Upgrade
```yaml
msd:
  overlays:
    - id: line1
      type: line
      anchor: source
      attach_to: dest
      route_channels: [main_bus]
      # Automatically uses smart routing
```

### Example 2: Global Smart Default
```yaml
msd:
  routing:
    default_mode: smart
    auto_upgrade_simple_lines: true
  
  overlays:
    - id: line1
      type: line
      anchor: a
      attach_to: b
      # Uses smart mode from global default
```

### Example 3: Disable Auto-Upgrade
```yaml
msd:
  routing:
    auto_upgrade_simple_lines: false
    
  overlays:
    - id: line1
      type: line
      anchor: a
      attach_to: b
      route_channels: [bus1]
      route_mode_full: smart  # Must specify explicitly when disabled
```

### Example 4: Waypoint Routing
```yaml
msd:
  routing:
    channels:
      checkpoint_1:
        bounds: [200, 300, 80, 80]
        type: waypoint
      checkpoint_2:
        bounds: [600, 400, 80, 80]
        type: waypoint
        
  overlays:
    - id: critical_line
      type: line
      anchor: start
      attach_to: end
      route_channels: [checkpoint_1, checkpoint_2]
      route_channel_mode: force
      # Line must pass through both waypoints
```

## Debug Tools

### Console Inspection
```javascript
// Get routing instance
const router = document.querySelector('lcards-msd')._msdPipeline.coordinator.router;

// Inspect specific line
router.inspect('line_id');

// Check router stats
router.stats();
```

### Enable Debug Logging
```javascript
window.lcards.setGlobalLogLevel('debug')
```

Look for log messages like:
```
[RouterCore] Auto-upgraded route line1 to smart mode (channels present)
[RouterCore] Route missed 1 waypoint(s): critical_junction
```

## Related Documentation

- [MSD Routing Architecture](../architecture/subsystems/routing.md)
- [Channel-Based Routing](../user/guides/channel-routing.md)
- [MSD Configuration Studio](../user/guides/msd-studio.md)
