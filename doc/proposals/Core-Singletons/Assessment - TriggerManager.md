Let me search for the TriggerManager and animation management implementations across MSD and SimpleCards.Excellent question! Let me analyze the animation trigger system architecture across MSD and SimpleCard.

## Current State Analysis

### MSD Animation Architecture

**MSD has TWO animation-related classes:**

1. **`AnimationManager`** (`src/msd/animation/AnimationManager.js`)
   - Singleton in `lcardsCore` (but extended from BaseService)
   - Handles animation execution, preset resolution
   - Coordinates with DataSourceManager for reactive animations
   
2. **`TriggerManager`** (`src/msd/animation/TriggerManager.js`)
   - **Per-overlay instance** (created for each overlay)
   - Handles trigger registration (on_load, on_tap, on_hold, on_hover, etc.)
   - Sets up event listeners for non-interactive triggers
   - **Interactive triggers (on_tap, on_hold, on_hover, on_leave, on_double_tap) are delegated to ActionHelpers**

### SimpleCard Animation Architecture

**SimpleCard has NO TriggerManager:**
- Animation triggers are handled **directly in `LCARdSSimpleCard.setupActions()`**
- Each action handler (tap, hold, double_tap) manually calls animation triggers
- Pattern: `this._triggerAnimations('on_tap', element)` or `animationManager.triggerAnimations(elementId, 'on_tap')`
- Hover/leave triggers set up directly in `setupActions()` method

## The Problem

**Duplication & Inconsistency:**
- MSD uses `TriggerManager` per overlay to manage trigger-to-animation mappings
- SimpleCard re-implements the same logic inline in action handlers
- No shared abstraction for "register this animation to trigger on this event"

---

## Recommendation: Move TriggerManager to Core

### ✅ **YES, move TriggerManager to Core as a shared utility**

**Benefits:**
1. **Consistency** - Same trigger management pattern for MSD and SimpleCard
2. **Maintainability** - Single source of truth for trigger logic
3. **Extensibility** - Easy to add new triggers (on_state_change, on_datasource_change, etc.)
4. **Cleaner Code** - SimpleCard doesn't need inline trigger logic

---

## Proposed Refactor

### 1. Move TriggerManager to Core

**New Location:** `src/core/triggers/TriggerManager.js`

**Changes:**
- Keep per-element instance pattern (not a singleton)
- Remove MSD-specific assumptions (like overlay-specific logic)
- Make it work with any DOM element + AnimationManager singleton

### 2. Update SimpleCard to Use TriggerManager

**Before (current):**
```javascript
// src/base/LCARdSSimpleCard.js - setupActions()
const tapHandler = (event) => {
  // ... tap logic ...
  
  // Manual animation trigger
  if (typeof this._triggerAnimations === 'function') {
    this._triggerAnimations('on_tap', element);
  } else if (animationManager && animationManager.triggerAnimations && elementId) {
    animationManager.triggerAnimations(elementId, 'on_tap');
  }
  
  this._executeAction(actions.tap_action);
};
```

**After (proposed):**
```javascript
// src/base/LCARdSSimpleCard.js - setupActions()
// Create TriggerManager for this element
this._triggerManager = new TriggerManager(
  elementId,
  element,
  animationManager
);

// Register animations (if any)
if (this.config.animations) {
  this.config.animations.forEach(animDef => {
    this._triggerManager.register(animDef.trigger || 'on_load', animDef);
  });
}

// Action handlers just trigger via TriggerManager
const tapHandler = (event) => {
  // ... tap logic ...
  
  // Trigger animations via TriggerManager
  await animationManager.triggerAnimations(elementId, 'on_tap');
  
  this._executeAction(actions.tap_action);
};
```

### 3. Update MSD to Use Core TriggerManager

**No changes needed** - MSD already uses TriggerManager pattern, just update import path:

```javascript
// src/msd/animation/AnimationManager.js
import { TriggerManager } from '../../core/triggers/TriggerManager.js';  // Changed from ../animation/
```

---

## Implementation Plan

### Step 1: Extract TriggerManager to Core

````javascript name=src/core/triggers/TriggerManager.js
/**
 * TriggerManager - Handles animation triggers for any element
 *
 * Unified trigger management for both MSD overlays and SimpleCards.
 *
 * Responsibilities:
 * - Register animations with specific triggers
 * - Handle non-interactive triggers (on_load, on_datasource_change, etc.)
 * - Coordinate with AnimationManager for animation execution
 * - Cleanup resources on destroy
 *
 * NOTE: Interactive triggers (on_tap, on_hold, on_hover, on_double_tap) are
 * handled by action handlers (ActionHelpers for MSD, setupActions for SimpleCard).
 * TriggerManager only stores the registration and provides query methods.
 *
 * Supported Triggers:
 * - on_load: Execute when element is first rendered
 * - on_datasource_change: Execute when datasource value changes (MSD only)
 * - on_state_change: Execute when HA entity state changes
 * - Interactive (handled by action systems): on_tap, on_hold, on_hover, on_leave, on_double_tap
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

export class TriggerManager {
  /**
   * Create a TriggerManager for an element
   * 
   * @param {string} elementId - Element identifier (overlay ID or card element ID)
   * @param {HTMLElement} element - DOM element
   * @param {AnimationManager} animationManager - Animation manager singleton
   */
  constructor(elementId, element, animationManager) {
    this.elementId = elementId;
    this.element = element;
    this.animationManager = animationManager;

    // Maps trigger type to animation definitions
    this.registrations = new Map(); // trigger -> animDef[]

    // Maps trigger type to cleanup function
    this.listeners = new Map(); // trigger -> cleanup function

    lcardsLog.debug(`[TriggerManager] Created for element: ${elementId}`);
  }

  /**
   * Register an animation with a specific trigger
   *
   * @param {string} trigger - Trigger type (on_load, on_tap, etc.)
   * @param {Object} animDef - Animation definition
   */
  register(trigger, animDef) {
    // Initialize registration array for this trigger if needed
    if (!this.registrations.has(trigger)) {
      this.registrations.set(trigger, []);

      // Setup trigger listener (except for on_load which is handled immediately)
      if (trigger !== 'on_load') {
        this.setupTriggerListener(trigger);
      }
    }

    // Add animation definition to this trigger
    this.registrations.get(trigger).push(animDef);

    lcardsLog.debug(`[TriggerManager] Registered animation for ${this.elementId} on trigger: ${trigger}`);
  }

  /**
   * Setup event listener for a specific trigger type
   *
   * @param {string} trigger - Trigger type
   */
  setupTriggerListener(trigger) {
    // Interactive triggers (tap, hold, hover, leave, double_tap) are handled by action systems
    const interactiveTriggers = ['on_tap', 'on_hold', 'on_hover', 'on_leave', 'on_double_tap'];
    if (interactiveTriggers.includes(trigger)) {
      lcardsLog.debug(`[TriggerManager] ${trigger} handled by action system (skipping listener setup)`);
      return;
    }

    switch(trigger) {
      case 'on_datasource_change':
        // Handled by AnimationManager via DataSourceManager subscriptions
        lcardsLog.debug(`[TriggerManager] on_datasource_change will be handled by AnimationManager`);
        break;

      case 'on_state_change':
        // Handled by AnimationManager via HA state subscriptions
        lcardsLog.debug(`[TriggerManager] on_state_change will be handled by AnimationManager`);
        break;

      default:
        lcardsLog.warn(`[TriggerManager] Unknown trigger type: ${trigger}`);
    }
  }

  /**
   * Get all registered triggers for this element
   *
   * @returns {Array<string>} Array of trigger names
   */
  getRegisteredTriggers() {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get animation count for a specific trigger
   *
   * @param {string} trigger - Trigger type
   * @returns {number} Number of animations registered
   */
  getAnimationCount(trigger) {
    return (this.registrations.get(trigger) || []).length;
  }

  /**
   * Check if a specific trigger is registered
   *
   * @param {string} trigger - Trigger type
   * @returns {boolean}
   */
  hasTrigger(trigger) {
    return this.registrations.has(trigger);
  }

  /**
   * Cleanup all event listeners and resources
   */
  destroy() {
    lcardsLog.debug(`[TriggerManager] 🗑️ Destroying trigger manager for ${this.elementId}`);

    // Execute all cleanup functions
    this.listeners.forEach((cleanup, trigger) => {
      try {
        cleanup();
        lcardsLog.debug(`[TriggerManager] Cleaned up listener for trigger: ${trigger}`);
      } catch (error) {
        lcardsLog.error(`[TriggerManager] Failed to cleanup listener for ${trigger}:`, error);
      }
    });

    // Clear all maps
    this.listeners.clear();
    this.registrations.clear();

    // Remove cursor pointer if it was added
    if (this.element && this.element.style) {
      this.element.style.cursor = '';
    }

    lcardsLog.debug(`[TriggerManager] ✅ Trigger manager destroyed for ${this.elementId}`);
  }
}
````

### Step 2: Update MSD AnimationManager

**Change import only:**

```javascript
// src/msd/animation/AnimationManager.js

// OLD:
// import { TriggerManager } from './TriggerManager.js';

// NEW:
import { TriggerManager } from '../../core/triggers/TriggerManager.js';

// Rest of AnimationManager stays the same
```

### Step 3: Update SimpleCard to Use TriggerManager

```javascript
// src/base/LCARdSSimpleCard.js

import { TriggerManager } from '../core/triggers/TriggerManager.js';

export class LCARdSSimpleCard extends LCARdSNativeCard {
  
  constructor() {
    super();
    this._triggerManager = null;  // Will be created in setupActions
  }
  
  setupActions(element, actions, options = {}) {
    // ... existing setup ...
    
    const animationManager = options.animationManager || this._singletons?.animationManager;
    const elementId = options.elementId || element.id || element.getAttribute('data-overlay-id');
    
    // Create TriggerManager for this element
    if (animationManager && elementId) {
      this._triggerManager = new TriggerManager(elementId, element, animationManager);
      
      // Register animations if provided in config
      if (this.config.animations) {
        this.config.animations.forEach(animDef => {
          this._triggerManager.register(animDef.trigger || 'on_load', animDef);
        });
      }
    }
    
    // Tap action handler
    if (actions.tap_action) {
      const tapHandler = async (event) => {
        // ... existing tap logic ...
        
        // Trigger animations via AnimationManager
        if (animationManager && elementId) {
          await animationManager.triggerAnimations(elementId, 'on_tap');
        }
        
        this._executeAction(actions.tap_action);
      };
      
      element.addEventListener('click', tapHandler);
      cleanupFunctions.push(() => element.removeEventListener('click', tapHandler));
    }
    
    // ... rest of action handlers (hold, double_tap, hover) ...
    
    // Cleanup TriggerManager on card destruction
    cleanupFunctions.push(() => {
      if (this._triggerManager) {
        this._triggerManager.destroy();
        this._triggerManager = null;
      }
    });
    
    return () => {
      cleanupFunctions.forEach(fn => fn());
    };
  }
}
```

---

## Summary

### ✅ **YES - Move TriggerManager to Core**

**File Moves:**
- `src/msd/animation/TriggerManager.js` → `src/core/triggers/TriggerManager.js`

**Benefits:**
1. ✅ Unified trigger management for MSD + SimpleCard
2. ✅ Single source of truth for animation triggers
3. ✅ Easier to extend with new trigger types
4. ✅ Cleaner SimpleCard code (no inline trigger logic)
5. ✅ Maintains per-element instance pattern (not a singleton)

**Impact:**
- Low risk - TriggerManager is already generic
- MSD just updates import path
- SimpleCard gets cleaner, more maintainable code
- Future cards (V2) can use same pattern

Would you like me to create the complete refactored files for this change?
