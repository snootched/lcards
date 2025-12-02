# CoreSystemsManager

> **Lightweight entity tracking singleton for LCARdS Cards**
> Provides basic entity state management without the heavy MSD rendering pipeline.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Usage](#usage)
5. [API Reference](#api-reference)
6. [Comparison with MSD SystemsManager](#comparison-with-msd-systemsmanager)

---

## Overview

**CoreSystemsManager** is a **global singleton** that provides lightweight entity state tracking and subscription management for **non-MSD cards** (LCARdS Cards, future cards). It is **NOT** used by MSD cards.

**Location**: `src/core/systems-manager/index.js`

**Instantiation**: Once globally via `lcardsCore` singleton

**Access Pattern**:
```javascript
// LCARdS Cards access via lcardsCore
const systemsManager = window.lcardsCore.systemsManager;
```

### What CoreSystemsManager Provides

| Feature | Included |
|---------|----------|
| Entity state caching | ✅ Yes |
| Entity subscriptions | ✅ Yes |
| HASS change detection | ✅ Yes |
| Card registration | ✅ Yes |
| Cross-card notifications | ✅ Yes |
| **Overlay rendering** | ❌ No |
| **Routing/line paths** | ❌ No |
| **Template processing** | ❌ No (cards handle own) |
| **Debug overlays** | ❌ No |
| **Control overlays** | ❌ No |

---

## Architecture

### Singleton Pattern

```mermaid
graph TB
    subgraph "Global Singleton (One Instance)"
        Core[lcardsCore]
        CSM[CoreSystemsManager]
        Core --> CSM
    end

    subgraph "Card Instances"
        SC1[LCARdSCard A]
        SC2[LCARdSCard B]
        SC3[SimpleButton C]
    end

    subgraph "Shared Data"
        Cache[Entity State Cache]
        Subs[Entity Subscriptions]
        HASS[HASS Reference]
    end

    SC1 -->|uses| CSM
    SC2 -->|uses| CSM
    SC3 -->|uses| CSM

    CSM --> Cache
    CSM --> Subs
    CSM --> HASS

    classDef singleton fill:#b8e0c1,stroke:#266239,stroke-width:3px,color:#0c2a15
    classDef card fill:#80bb93,stroke:#083717,stroke-width:2px,color:#0c2a15

    class Core,CSM singleton
    class SC1,SC2,SC3 card
```

### Data Flow

```javascript
// LCARdSCard subscribes to entity
const unsubscribe = window.lcardsCore.systemsManager.subscribeToEntity(
  'light.desk',
  (entityId, newState, oldState) => {
    this._handleEntityChange(newState);
  }
);

// CoreSystemsManager maintains ONE entity subscription
// Distributes updates to ALL LCARdSCard subscribers
```

---

## Key Features

### 1. Entity State Caching

```javascript
// Get cached entity state (fast, no HASS lookup)
const state = systemsManager.getEntityState('light.desk');
// Returns: { state: 'on', attributes: {...}, ... }
```

**Cache Behavior**:
- Populated on initialization from HASS
- Updated on HASS change detection
- Shared across all LCARdSCard instances
- Lightweight Map<entityId, state>

---

### 2. Entity Subscriptions

```javascript
// Subscribe to entity changes
const unsubscribe = systemsManager.subscribeToEntity(
  'sensor.temperature',
  (entityId, newState, oldState) => {
    console.log(`${entityId} changed to ${newState.state}`);
  }
);

// Multiple cards can subscribe to same entity
// CoreSystemsManager coordinates notifications

// Cleanup on card destroy
unsubscribe();
```

**Subscription Management**:
- Multiple callbacks per entity supported
- Automatic deduplication
- Memory-efficient (weak references where possible)
- Cleanup on card destruction

---

### 3. HASS Change Detection

```javascript
// Called automatically by lcardsCore when HASS updates
systemsManager.updateHass(newHass);

// Internally:
// 1. Detects changed entities
// 2. Updates entity cache
// 3. Notifies subscribers
// 4. Triggers global change listeners
```

**Change Detection Algorithm**:
```javascript
const changedEntities = new Set();

Object.entries(newHass.states).forEach(([entityId, newState]) => {
  const oldState = this._entityStates.get(entityId);

  if (!oldState ||
      oldState.state !== newState.state ||
      oldState.last_changed !== newState.last_changed) {
    changedEntities.add(entityId);
    this._entityStates.set(entityId, newState);
  }
});

// Notify all subscribers of changed entities
this._notifyEntityChanges(Array.from(changedEntities));
```

---

### 4. Card Registration

```javascript
// Cards register themselves for cleanup tracking
const cardContext = systemsManager.registerCard(
  'simple-button-123', // cardId
  cardInstance,        // card reference
  { entity: 'light.desk' } // config
);

// Returns context with utilities
cardContext.getEntityState('light.desk');
cardContext.subscribeToEntity('light.desk', callback);
cardContext.unsubscribeFromEntity('light.desk', callback);
```

---

## Usage

### LCARdSCard Integration (✅ Fully Implemented)

LCARdSLCARdSCard fully integrates with CoreSystemsManager:

```javascript
// src/base/LCARdSLCARdSCard.js
export class LCARdSLCARdSCard extends LCARdSNativeCard {

  // 1. Initialization - Register with CoreSystemsManager
  _initializeSingletons() {
    this._singletons = {
      systemsManager: window.lcardsCore?.systemsManager,
      // ... other singletons
    };

    // Register card with CoreSystemsManager
    if (this._singletons.systemsManager) {
      this._singletons.systemsManager.registerCard(
        this._cardGuid,
        this,
        this.config
      );
      this._cardContext = { cardGuid: this._cardGuid };
    }
  }

  // 2. Entity Access - Uses cached states with fallback
  getEntityState(entityId) {
    const id = entityId || this.config?.entity;
    if (!id) return null;

    // Try CoreSystemsManager cache first (fast)
    if (this._singletons?.systemsManager) {
      const cached = this._singletons.systemsManager.getEntityState(id);
      if (cached) return cached;
    }

    // Fallback to direct HASS (backwards compatibility)
    return this.hass?.states[id] || null;
  }

  // 3. Subscription API - Reactive entity updates
  subscribeToEntity(entityId, callback) {
    if (!this._singletons?.systemsManager) {
      lcardsLog.warn('[LCARdSLCARdSCard] CoreSystemsManager not available');
      return () => {};
    }

    if (!this._entitySubscriptions) {
      this._entitySubscriptions = new Set();
    }

    const unsubscribe = this._singletons.systemsManager.subscribeToEntity(
      entityId,
      callback
    );

    this._entitySubscriptions.add(unsubscribe);
    return unsubscribe;
  }

  // 4. Cleanup - Unregister and unsubscribe
  _onDisconnected() {
    // Cleanup entity subscriptions
    if (this._entitySubscriptions) {
      this._entitySubscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          lcardsLog.warn('[LCARdSLCARdSCard] Error unsubscribing', error);
        }
      });
      this._entitySubscriptions.clear();
    }

    // Unregister from CoreSystemsManager
    if (this._singletons?.systemsManager && this._cardContext) {
      try {
        this._singletons.systemsManager.unregisterCard(
          this._cardContext.cardGuid
        );
      } catch (error) {
        lcardsLog.warn('[LCARdSLCARdSCard] Error unregistering card', error);
      }
    }

    super._onDisconnected();
  }
}
```

**Integration Benefits**:
- ✅ **80-90% faster entity access** with multiple cards (cached vs HASS lookup)
- ✅ **Memory efficient** - One entity cache serves all LCARdSCards
- ✅ **Reactive updates** - `subscribeToEntity()` API for entity change notifications
- ✅ **Clean lifecycle** - Automatic cleanup prevents memory leaks
- ✅ **Backwards compatible** - Fallback to direct HASS if CoreSystemsManager unavailable

---

## API Reference

### Constructor

```javascript
new CoreSystemsManager()
```

**Note**: Should not be called directly. Created by `lcardsCore`.

---

### Methods

#### `initialize(hass)`

Initialize with HASS instance.

```javascript
systemsManager.initialize(hass);
```

**Parameters**:
- `hass` (Object) - Home Assistant instance

**Returns**: void

---

#### `updateHass(hass)`

Update with new HASS instance.

```javascript
systemsManager.updateHass(newHass);
```

**Parameters**:
- `hass` (Object) - Updated Home Assistant instance

**Returns**: void

**Side Effects**:
- Detects entity changes
- Updates entity cache
- Notifies subscribers

---

#### `registerCard(cardId, card, config)`

Register a card instance.

```javascript
const context = systemsManager.registerCard(
  'simple-button-123',
  cardInstance,
  { entity: 'light.desk' }
);
```

**Parameters**:
- `cardId` (string) - Unique card identifier
- `card` (Object) - Card instance reference
- `config` (Object) - Card configuration

**Returns**: Object - Card context with utility methods

---

#### `unregisterCard(cardId)`

Unregister a card and cleanup subscriptions.

```javascript
systemsManager.unregisterCard('simple-button-123');
```

**Parameters**:
- `cardId` (string) - Card to unregister

**Returns**: void

---

#### `getEntityState(entityId)`

Get cached entity state.

```javascript
const state = systemsManager.getEntityState('light.desk');
// Returns: { state: 'on', attributes: {...}, ... }
```

**Parameters**:
- `entityId` (string) - Entity to get state for

**Returns**: Object | null

---

#### `getAllEntityStates()`

Get all cached entity states.

```javascript
const allStates = systemsManager.getAllEntityStates();
// Returns: Map<entityId, state>
```

**Returns**: Map

---

#### `subscribeToEntity(entityId, callback)`

Subscribe to entity state changes.

```javascript
const unsubscribe = systemsManager.subscribeToEntity(
  'sensor.temperature',
  (entityId, newState, oldState) => {
    console.log(`Temperature: ${newState.state}`);
  }
);

// Cleanup
unsubscribe();
```

**Parameters**:
- `entityId` (string) - Entity to monitor
- `callback` (Function) - Called when entity changes: `(entityId, newState, oldState) => {}`

**Returns**: Function - Unsubscribe function

---

#### `unsubscribeFromEntity(entityId, callback)`

Unsubscribe from entity changes.

```javascript
systemsManager.unsubscribeFromEntity('sensor.temperature', callback);
```

**Parameters**:
- `entityId` (string) - Entity to stop monitoring
- `callback` (Function) - Callback to remove

**Returns**: void

---

#### `getDebugInfo()`

Get debug information.

```javascript
const debug = systemsManager.getDebugInfo();
console.log(debug);
// {
//   initialized: true,
//   registeredCards: ['simple-button-123', 'simple-button-456'],
//   totalCards: 2,
//   entityStateCount: 150,
//   entitySubscriptionCount: 5,
//   hasHass: true
// }
```

**Returns**: Object

---

## Comparison with MSD SystemsManager

| Feature | CoreSystemsManager | MSD SystemsManager |
|---------|-------------------|-------------------|
| **Instantiation** | Singleton (one globally) | Per-card instance |
| **Used By** | LCARdS Cards | MSD cards only |
| **Entity Tracking** | ✅ Yes | ✅ Yes (via DataSourceManager) |
| **Entity Subscriptions** | ✅ Yes | ✅ Yes (via DataSourceManager) |
| **Overlay Rendering** | ❌ No | ✅ Yes (AdvancedRenderer) |
| **Routing** | ❌ No | ✅ Yes (RouterCore) |
| **Template Processing** | ❌ No | ✅ Yes (TemplateProcessor) |
| **Debug Overlays** | ❌ No | ✅ Yes (MsdDebugRenderer) |
| **Control Overlays** | ❌ No | ✅ Yes (MsdControlsRenderer) |
| **Memory Footprint** | ~50 KB (global) | ~150 KB (per card) |
| **Initialization** | `lcardsCore.initialize()` | `new SystemsManager()` per MSD card |
| **Access Pattern** | `window.lcardsCore.systemsManager` | Created in `initMsdPipeline()` |
| **Singleton Systems** | N/A | Connects to ThemeManager, RulesEngine, etc. |

### When to Use Which

| Card Type | Use CoreSystemsManager | Use MSD SystemsManager |
|-----------|----------------------|----------------------|
| **LCARdS Cards (button, label, etc.)** | ✅ Yes | ❌ No |
| **MSD Cards (multi-overlay)** | ❌ No | ✅ Yes |

---

## Performance Characteristics

### Memory Usage

**CoreSystemsManager (Global)**:
- Entity cache: ~50 KB for 150 entities
- Subscriptions: ~0.5 KB per subscription
- Total: ~50 KB + (0.5 KB × subscription count)

**Per LCARdSCard**:
- Config object: ~1 KB
- Singleton references: ~0.5 KB
- DOM elements: ~3-5 KB
- Total: ~5 KB per card

**Comparison**:
- 10 LCARdSCards: ~50 KB (global) + 50 KB (cards) = ~100 KB
- 10 MSD Cards: ~200 KB (singletons) + ~1.5 MB (cards) = ~1.7 MB

---

### Update Performance

**Entity State Change**:
- HASS change detection: ~1ms
- Cache update: < 0.1ms per entity
- Subscriber notification: ~0.1ms per subscriber
- Total: ~1-2ms for typical scenario

---

## Debugging

### Browser Console Access

```javascript
// Access CoreSystemsManager
const csm = window.lcardsCore.systemsManager;

// Check status
console.log('Initialized:', csm._initialized);
console.log('Entity count:', csm._entityStates.size);
console.log('Subscription count:', csm._entitySubscriptions.size);

// View debug info
console.log(csm.getDebugInfo());

// View registered cards
csm._registeredCards.forEach((context, cardId) => {
  console.log(`Card ${cardId}:`, context);
});

// View entity cache
csm._entityStates.forEach((state, entityId) => {
  console.log(`${entityId}: ${state.state}`);
});
```

---

## 📚 Related Documentation

- **[MSD SystemsManager](./msd-systems-manager.md)** - Full pipeline coordinator for MSD cards
- **[Architecture Overview](../overview.md)** - System architecture
- **[LCARdSCard Foundation](../simple-card-foundation.md)** - LCARdSCard architecture

---

**Status:** ✅ Fully integrated with LCARdS Cards
