/**
 * @fileoverview ScopedSettingsConstants — shared string constants for scoped storage
 *
 * Centralises all storage key names and namespace prefixes used by the
 * per-user / per-device settings system.  Importing from here rather than
 * using inline strings ensures typos are caught by IDE tooling and prevents
 * the Python and JS sides from drifting apart.
 *
 * Python equivalents live in ``custom_components/lcards/const.py``
 * (``STORAGE_NS_USER``, ``STORAGE_NS_DEVICE``).
 *
 * @module core/services/ScopedSettingsConstants
 */

// ---------------------------------------------------------------------------
// Storage namespace prefixes
// Flat backend key = `${namespace}_${entityId}`, e.g. "_user_abc123"
// ---------------------------------------------------------------------------

/** Prefix for per-user scoped storage keys. */
export const STORAGE_NS_USER = '_user';

/** Prefix for per-device scoped storage keys. */
export const STORAGE_NS_DEVICE = '_device';

// ---------------------------------------------------------------------------
// Sound settings storage keys (used by SoundManager + ScopedSettingsService)
// ---------------------------------------------------------------------------

/** Backend key for per-event sound overrides (Object: eventType → assetKey). */
export const STORAGE_KEY_SOUND_OVERRIDES = 'sound_overrides';

/** Backend key for master volume override (0.0–1.0). */
export const STORAGE_KEY_SOUND_VOLUME = 'sound_volume';

/** Backend key for master sound enabled override (boolean). */
export const STORAGE_KEY_SOUND_ENABLED = 'sound_enabled';

/** Backend key for per-category enabled overrides (Object: category → boolean). */
export const STORAGE_KEY_SOUND_CATEGORY_ENABLED = 'sound_category_enabled';

/** Backend key for active sound scheme override (string: scheme name). */
export const STORAGE_KEY_SOUND_SCHEME = 'sound_scheme';

// ---------------------------------------------------------------------------
// Theme settings storage keys (used by ThemeManager + ScopedSettingsService)
// ---------------------------------------------------------------------------

/**
 * Backend key for theme token overrides.
 * Flat map of { [tokenPath]: value } stored per scope.
 * Merge order at runtime: { ...global, ...user, ...device } — device wins.
 * Values are raw strings or numbers; CSS variables are supported and
 * remain reactive to alert mode changes (recommended for colour tokens).
 *
 * @example
 * // Global override stored value:
 * { 'colors.card.button': 'var(--lcars-orange)', 'typography.fontSize.base': 16 }
 */
export const STORAGE_KEY_THEME_OVERRIDES = 'theme_overrides';

// ---------------------------------------------------------------------------
// Device identity keys (stored inside the device's namespaced object)
// ---------------------------------------------------------------------------

/** Sub-key for the human-readable device display name. */
export const DEVICE_KEY_DISPLAY_NAME = 'display_name';

/** Sub-key for the last-seen timestamp (ms since epoch). */
export const DEVICE_KEY_LAST_SEEN = 'last_seen';

/** Sub-key for the browser user-agent string. */
export const DEVICE_KEY_USER_AGENT = 'user_agent';

// ---------------------------------------------------------------------------
// URL parameter names (consistent with lcards_log_level convention)
// ---------------------------------------------------------------------------

/**
 * URL parameter to pre-set a device's display name.
 * Append ``?lcards_device=kitchen-tablet`` to the HA URL to name the current
 * browser's device on load \u2014 ideal for kiosk bookmarks.
 *
 * Example: ``http://homeassistant.local:8123/lcards?lcards_device=kitchen-tablet``
 */
export const URL_PARAM_DEVICE_NAME = 'lcards_device';

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

/** localStorage key storing this browser's stable device UUID. */
export const LOCALSTORAGE_DEVICE_ID = 'lcards_device_id';
