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

/**
 * Backend key for user-created sound schemes (global flat key, not scoped —
 * read/written via IntegrationService.readStorage()/writeStorage() directly).
 * Flat map of { [fullSchemeName]: { [eventType]: assetKey|mediaSourceId|null } }.
 * Scheme names are prefixed 'custom:' to distinguish them from pack-provided
 * schemes in the Sound Scheme dropdown.
 */
export const STORAGE_KEY_CUSTOM_SOUND_SCHEMES = 'custom_sound_schemes';

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

// ---------------------------------------------------------------------------
// Connection overlay settings — flat scalar keys (one per independently
// overridable field).  Device scope wins over user scope wins over global
// at the individual field level, so a device-scoped colour does NOT clobber
// a global-scoped text value.
// Used by ConnectionOverlayService + lcards-connectivity-tab.
// ---------------------------------------------------------------------------

/** Whether the disconnect overlay is enabled. */
export const CONN_OVERLAY_ENABLED            = 'conn_overlay_enabled';
/** Whether the user can dismiss the overlay by clicking the backdrop. */
export const CONN_OVERLAY_DISMISS            = 'conn_overlay_dismiss';
/** Position of the content card within the overlay (e.g. 'center', 'top-left'). */
export const CONN_OVERLAY_POSITION           = 'conn_overlay_position';
/** CSS width for the content container ('auto' or explicit CSS value). */
export const CONN_OVERLAY_WIDTH              = 'conn_overlay_width';
/** CSS height for the content container ('auto' or explicit CSS value). */
export const CONN_OVERLAY_HEIGHT             = 'conn_overlay_height';
/** Optional HA card config object shown in card mode (null = use text message). */
export const CONN_OVERLAY_CONTENT            = 'conn_overlay_content';
/** SEM effect layers config object { backdrop, color, canvas }. */
export const CONN_OVERLAY_SEM               = 'conn_overlay_sem';
/** Message display mode: 'text' | 'card'. */
export const CONN_OVERLAY_MSG_MODE           = 'conn_overlay_msg_mode';
/** Disconnect message text. */
export const CONN_OVERLAY_MSG_TEXT           = 'conn_overlay_msg_text';
/** Disconnect message text colour. */
export const CONN_OVERLAY_MSG_COLOR          = 'conn_overlay_msg_color';
/** Disconnect message font family key. */
export const CONN_OVERLAY_MSG_FONT           = 'conn_overlay_msg_font';
/** Disconnect message font size (px). */
export const CONN_OVERLAY_MSG_SIZE           = 'conn_overlay_msg_size';
/** Disconnect message font weight (e.g. '400', '700'). */
export const CONN_OVERLAY_MSG_WEIGHT         = 'conn_overlay_msg_weight';
/** Disconnect message text transform. */
export const CONN_OVERLAY_MSG_TRANSFORM      = 'conn_overlay_msg_transform';
/** Whether to show a "connection restored" confirmation banner. */
export const CONN_OVERLAY_RECON_ENABLED      = 'conn_overlay_recon_enabled';
/** Connection-restored message text. */
export const CONN_OVERLAY_RECON_TEXT         = 'conn_overlay_recon_text';
/** Connection-restored message text colour. */
export const CONN_OVERLAY_RECON_COLOR        = 'conn_overlay_recon_color';
/** Seconds before the reconnected confirmation auto-dismisses. */
export const CONN_OVERLAY_RECON_DISMISS_SECS = 'conn_overlay_recon_dismiss_secs';
/** Connection-restored message font family key. */
export const CONN_OVERLAY_RECON_FONT         = 'conn_overlay_recon_font';
/** Connection-restored message font size (px). */
export const CONN_OVERLAY_RECON_SIZE         = 'conn_overlay_recon_size';
/** Connection-restored message font weight. */
export const CONN_OVERLAY_RECON_WEIGHT       = 'conn_overlay_recon_weight';
/** Connection-restored message text transform. */
export const CONN_OVERLAY_RECON_TRANSFORM    = 'conn_overlay_recon_transform';
/** Optional HA card config shown in card mode for the reconnect banner (null = use text). */
export const CONN_OVERLAY_RECON_CONTENT      = 'conn_overlay_recon_content';

/** Full 3-slot SEM layers config for borg assimilation mode (canvas/backdrop/color). Null = use defaults. */
export const CONN_OVERLAY_BORG_SEM = 'conn_overlay_borg_sem';

/** Milliseconds to wait after a disconnect event before showing the overlay (0 = immediate). */
export const CONN_OVERLAY_DISCONNECT_DELAY = 'conn_overlay_disconnect_delay';

/**
 * All 25 connection-overlay flat keys in a stable array.
 * Used for bulk operations (loadConfig, clearConfig, readAllScopesFull).
 */
export const CONN_OVERLAY_ALL_KEYS = [
    CONN_OVERLAY_ENABLED,
    CONN_OVERLAY_DISMISS,
    CONN_OVERLAY_POSITION,
    CONN_OVERLAY_WIDTH,
    CONN_OVERLAY_HEIGHT,
    CONN_OVERLAY_CONTENT,
    CONN_OVERLAY_SEM,
    CONN_OVERLAY_MSG_MODE,
    CONN_OVERLAY_MSG_TEXT,
    CONN_OVERLAY_MSG_COLOR,
    CONN_OVERLAY_MSG_FONT,
    CONN_OVERLAY_MSG_SIZE,
    CONN_OVERLAY_MSG_WEIGHT,
    CONN_OVERLAY_MSG_TRANSFORM,
    CONN_OVERLAY_RECON_ENABLED,
    CONN_OVERLAY_RECON_TEXT,
    CONN_OVERLAY_RECON_COLOR,
    CONN_OVERLAY_RECON_DISMISS_SECS,
    CONN_OVERLAY_RECON_FONT,
    CONN_OVERLAY_RECON_SIZE,
    CONN_OVERLAY_RECON_WEIGHT,
    CONN_OVERLAY_RECON_TRANSFORM,
    CONN_OVERLAY_RECON_CONTENT,
    CONN_OVERLAY_BORG_SEM,
    CONN_OVERLAY_DISCONNECT_DELAY,
];
