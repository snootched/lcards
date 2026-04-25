"""Constants for the LCARdS integration."""
import logging

DOMAIN = "lcards"
FRONTEND_SCRIPT_URL = "lcards.js"
DOMAIN_VERSION = "2026.4.25"

# Options
CONF_SHOW_PANEL = "show_panel"
DEFAULT_SHOW_PANEL = True

CONF_SIDEBAR_TITLE = "sidebar_title"
DEFAULT_SIDEBAR_TITLE = "LCARdS Config"

CONF_SIDEBAR_ICON = "sidebar_icon"
DEFAULT_SIDEBAR_ICON = "mdi:space-invaders"

CONF_LOG_LEVEL = "log_level"
DEFAULT_LOG_LEVEL = "warn"
LOG_LEVEL_OPTIONS = ["off", "error", "warn", "info", "debug", "trace"]

CONF_ENABLE_PREVIEWS = "enable_previews"
DEFAULT_ENABLE_PREVIEWS = False

# Scoped storage namespace prefixes (used by websocket_api.py handlers and
# referenced in the JS ScopedSettingsConstants.js).
# Per-user flat keys: _user_<user_uuid>
# Per-device flat keys: _device_<device_uuid>
STORAGE_NS_USER = "_user"
STORAGE_NS_DEVICE = "_device"

# Maps lcards log level names → Python logging levels.
# "off" uses CRITICAL+1 which is above every named level, silencing the logger
# without touching the global logging.disable() flag.
# "trace" maps to DEBUG — Python has no built-in TRACE level.
_LOG_LEVEL_MAP: dict[str, int] = {
    "off":   logging.CRITICAL + 1,
    "error": logging.ERROR,
    "warn":  logging.WARNING,
    "info":  logging.INFO,
    "debug": logging.DEBUG,
    "trace": logging.DEBUG,
}
