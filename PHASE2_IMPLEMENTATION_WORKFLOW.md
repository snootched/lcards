# Phase 2 Datasource CRUD - Implementation Workflow

## Visual Workflow Guide

### 1. Adding a New Datasource

```
┌─────────────────────────────────────────────────────────┐
│  Datasource Editor Tab                                  │
├─────────────────────────────────────────────────────────┤
│  [Card Sources] [+ Add Source] [Global Sources]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User clicks "+ Add Source"                             │
│         ↓                                                │
│  Dialog Opens (lcards-datasource-dialog)                │
│                                                          │
│  ┌────────────────────────────────────────┐            │
│  │ Add Datasource                   [×]   │            │
│  ├────────────────────────────────────────┤            │
│  │ Name *: [________________]             │            │
│  │                                         │            │
│  │ Entity *: [sensor.temperature ▼]       │            │
│  │                                         │            │
│  │ Attribute: [(State) ▼]                 │            │
│  │                                         │            │
│  │ ▶ Timing Settings                      │            │
│  │   Window Seconds: [60]                 │            │
│  │   Min Emit (ms): [100]                 │            │
│  │   ...                                   │            │
│  │                                         │            │
│  │ ▶ History Preload                      │            │
│  │   □ Preload History                    │            │
│  │                                         │            │
│  │        [Cancel]         [Create]       │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  User fills form and clicks "Create"                    │
│         ↓                                                │
│  • Config updated via editor._setConfigValue           │
│  • DataSourceManager.createDataSource() called          │
│  • Dialog closes                                        │
│  • Tab switches to "Card Sources" view                 │
└─────────────────────────────────────────────────────────┘
```

### 2. Editing an Existing Datasource

```
┌─────────────────────────────────────────────────────────┐
│  Card Sources View                                      │
├─────────────────────────────────────────────────────────┤
│  ▼ temperature_sensor                                   │
│     sensor.living_room_temperature                      │
│  ├─────────────────────────────────────────────────────┤
│  │ Entity: sensor.living_room_temperature              │
│  │ Window: 60s                                          │
│  │                                                       │
│  │ [Edit]  [Remove]  ← User clicks "Edit"              │
│  └─────────────────────────────────────────────────────┘
│         ↓                                                │
│  Dialog Opens (Edit Mode)                               │
│                                                          │
│  ┌────────────────────────────────────────┐            │
│  │ Edit Datasource: temperature_sensor    │            │
│  ├────────────────────────────────────────┤            │
│  │ Name: temperature_sensor (disabled)    │            │
│  │                                         │            │
│  │ Entity *: [sensor.temp_living ▼]       │            │
│  │                                         │            │
│  │ Attribute: [(State) ▼]                 │            │
│  │                                         │            │
│  │ ... (editable fields)                  │            │
│  │                                         │            │
│  │        [Cancel]          [Save]        │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  User modifies values and clicks "Save"                 │
│         ↓                                                │
│  • Config updated with new values                      │
│  • Dialog closes                                        │
└─────────────────────────────────────────────────────────┘
```

### 3. Deleting a Datasource (No Dependencies)

```
┌─────────────────────────────────────────────────────────┐
│  Card Sources View                                      │
├─────────────────────────────────────────────────────────┤
│  ▼ unused_sensor                                        │
│     sensor.unused                                       │
│  ├─────────────────────────────────────────────────────┤
│  │ Entity: sensor.unused                               │
│  │                                                       │
│  │ [Edit]  [Remove]  ← User clicks "Remove"            │
│  └─────────────────────────────────────────────────────┘
│         ↓                                                │
│  DataSourceManager.getSourceDependents() returns []     │
│         ↓                                                │
│  • Datasource removed immediately                       │
│  • Config updated                                       │
│  • Tracking updated                                     │
└─────────────────────────────────────────────────────────┘
```

### 4. Deleting a Datasource (WITH Dependencies)

```
┌─────────────────────────────────────────────────────────┐
│  Card Sources View                                      │
├─────────────────────────────────────────────────────────┤
│  ▼ shared_sensor                                        │
│     sensor.important                                    │
│  ├─────────────────────────────────────────────────────┤
│  │ Entity: sensor.important                            │
│  │                                                       │
│  │ [Edit]  [Remove]  ← User clicks "Remove"            │
│  └─────────────────────────────────────────────────────┘
│         ↓                                                │
│  DataSourceManager.getSourceDependents() returns        │
│  ["card-123", "card-456"]                               │
│         ↓                                                │
│  Warning Dialog Appears                                 │
│                                                          │
│  ┌────────────────────────────────────────┐            │
│  │ ⚠️ Destructive Action                  │            │
│  ├────────────────────────────────────────┤            │
│  │ ╔══════════════════════════════╗       │            │
│  │ ║ ⚠️ This will break other cards! ║    │            │
│  │ ╚══════════════════════════════╝       │            │
│  │                                         │            │
│  │ Deleting datasource "shared_sensor"    │            │
│  │ will:                                   │            │
│  │ 1. Remove it from THIS card's config   │            │
│  │ 2. Destroy the global DataSource       │            │
│  │    singleton on page reload            │            │
│  │                                         │            │
│  │ The following cards depend on this:    │            │
│  │ • card-123                              │            │
│  │ • card-456                              │            │
│  │                                         │            │
│  │ ⚠️ These cards WILL ERROR until you    │            │
│  │    update their configurations.        │            │
│  │    This action cannot be undone.       │            │
│  │                                         │            │
│  │  [Cancel]  [Delete and Break Dependencies] │        │
│  └────────────────────────────────────────┘            │
│                                                          │
│  IF User clicks "Cancel":                               │
│    • No changes made                                    │
│                                                          │
│  IF User clicks "Delete and Break Dependencies":        │
│    • Datasource removed from config                    │
│    • Tracking updated                                   │
│    • Dependent cards will error (as warned)            │
└─────────────────────────────────────────────────────────┘
```

### 5. Entity Validation with Suggestions

```
┌─────────────────────────────────────────────────────────┐
│  Add Datasource Dialog                                  │
├─────────────────────────────────────────────────────────┤
│  Name *: [my_sensor]                                    │
│                                                          │
│  Entity *: [sensor.tempratue] ← Typo!                  │
│                                                          │
│  ╔══════════════════════════════════════════╗           │
│  ║ ⚠️ Entity "sensor.tempratue" not found  ║           │
│  ║                                           ║           │
│  ║ Did you mean:                            ║           │
│  ║ • sensor.temperature                     ║           │
│  ║ • sensor.temperature_2                   ║           │
│  ║ • sensor.temp_living                     ║           │
│  ╚══════════════════════════════════════════╝           │
│                                                          │
│  User clicks suggestion "sensor.temperature"            │
│         ↓                                                │
│  Entity field updated to "sensor.temperature"           │
│  Validation passes ✓                                    │
│  Attribute picker loads with entity's attributes        │
└─────────────────────────────────────────────────────────┘
```

## Code Flow Diagrams

### Add Flow
```
User Action          Component                 Config System
    │                    │                           │
    ├─ Click + Add ──────►                           │
    │                    │                           │
    │               Open Dialog                      │
    │                (Add Mode)                      │
    │                    │                           │
    ├─ Fill Form ────────►                           │
    │                    │                           │
    ├─ Click Create ─────►                           │
    │                    │                           │
    │               Validate                         │
    │                    │                           │
    │               Fire 'save' event                │
    │                    │                           │
    │                    ├─ editor._setConfigValue ──►
    │                    │                           │
    │                    │                      Update Config
    │                    │                           │
    │                    ├─ DataSourceManager ───────►
    │                    │   .createDataSource()     │
    │                    │                           │
    │               Close Dialog                     │
    │                    │                           │
    │               Switch to Card View              │
    │                    │                           │
```

### Delete Flow (With Dependencies)
```
User Action          Component                 DataSourceManager
    │                    │                           │
    ├─ Click Remove ─────►                           │
    │                    │                           │
    │               Fire 'delete-datasource'         │
    │                    │                           │
    │                    ├─ getSourceDependents() ───►
    │                    │                           │
    │                    │◄──── ["card-123", ...] ───┤
    │                    │                           │
    │               Show Warning Dialog              │
    │                    │                           │
    ├─ Click Confirm ────►                           │
    │                    │                           │
    │               Update Config                    │
    │                (remove datasource)             │
    │                    │                           │
    │                    ├─ removeCardFromSource() ──►
    │                    │                           │
    │                    │                      Update Tracking
    │                    │                           │
```

## Form Validation States

### Valid Form
```
Name: ✓ my_sensor (valid identifier)
Entity: ✓ sensor.temperature (exists in HASS)
Attribute: ✓ (State) (always valid)

[Create] button: ENABLED
```

### Invalid Form (Name)
```
Name: ✗ my-sensor (contains hyphen)
      Error: "Name must be a valid identifier"
Entity: ✓ sensor.temperature

[Create] button: DISABLED
```

### Invalid Form (Entity)
```
Name: ✓ my_sensor
Entity: ✗ sensor.nonexistent (not found)
        Warning: "Entity not found"
        Suggestions: sensor.temp, sensor.temperature

[Create] button: DISABLED
```

## Integration with DataSourceManager

```javascript
// Phase 0 APIs Used:

// 1. Get dependencies before delete
const dependents = dsManager.getSourceDependents(sourceName);
// Returns: ["card-guid-1", "card-guid-2", ...]

// 2. Create new datasource
dsManager.createDataSource(
  name,           // "my_sensor"
  config,         // { entity: "sensor.temp", ... }
  cardId,         // this.config.id || this.editor._cardGuid
  false           // autoCreated = false (explicit)
);

// 3. Remove card from tracking
dsManager.removeCardFromSource(
  sourceName,     // "my_sensor"
  cardId          // this.config.id || this.editor._cardGuid
);
```

## User Experience Highlights

✅ **Intuitive Navigation**: Ribbon tabs make it clear where to go
✅ **Clear Validation**: Real-time feedback prevents errors
✅ **Smart Suggestions**: Typo detection helps users correct mistakes
✅ **Safety First**: Deletion warnings prevent accidental breakage
✅ **Responsive Design**: Works on mobile and desktop
✅ **Graceful Degradation**: Fallbacks for missing HA components
✅ **Phase 3 Ready**: Clear indicators for upcoming features

## Testing Scenarios

### Functional Tests
- [x] Add datasource with valid entity
- [x] Add datasource with invalid entity (see suggestions)
- [x] Edit datasource (name immutable)
- [x] Delete datasource without dependencies
- [x] Delete datasource with dependencies (see warning)
- [x] Cancel operations (no changes)
- [x] Attribute picker updates on entity change
- [x] History section toggle works
- [x] Form validation prevents invalid submissions

### Edge Cases
- [x] Multiple cards using same datasource
- [x] Special characters in names (blocked by validation)
- [x] Entity with no attributes (defaults to State)
- [x] Missing DataSourceManager (graceful handling)
- [x] Missing HA components (fallback rendering)

## Conclusion

Phase 2 provides a complete, user-friendly CRUD interface for datasources
with intelligent validation, dependency tracking, and safety features.

The implementation is production-ready and sets a strong foundation for
Phase 3's transformation and aggregation editors.
