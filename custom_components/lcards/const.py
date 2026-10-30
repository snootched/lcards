"""Constants for the LCARdS integration."""
import logging

DOMAIN = "lcards"

# Minimum supported Home Assistant (major, minor). Keep in sync with hacs.json
# "homeassistant". 2026.10: core-evaluated dashboard visibility, probatio
# validation (voluptuous only exists via HA's compat shim).
MIN_HA_VERSION = (2026, 10)

FRONTEND_SCRIPT_URL = "lcards.js"

# The LCARdS user folder: files users add (their own 3D models in models/,
# other kinds in sibling folders later). In the Home Assistant config, so
# upgrades never touch it (HACS replaces custom_components/lcards/, not www/;
# no hacs.json persistent_directory needed, that one is for a folder inside
# the integration directory), served on LCARdS's own path so it works whether
# or not /config/www existed when Home Assistant started (/local/ is only
# registered if it did).
USER_DIR = "www/lcards"
USER_URL = "/lcards-user"
MY_MODELS_DIR = f"{USER_DIR}/models"
MY_MODELS_URL = f"{USER_URL}/models"
DOMAIN_VERSION = "2026.10.0-dev.3"

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
