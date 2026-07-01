"""LCARdS — HACS Integration.

Handles:
  - Static path registration for lcards.js  (/lcards/lcards.js)
  - Frontend injection via add_extra_js_url  (auto-loads on every HA page)
  - Lovelace resource registration           (Cast / kiosk support)
  - Sidebar panel registration               (LCARdS Config)
  - WebSocket API namespace                  (lcards/*)

Architecture:
  async_setup()        → static path + WebSocket commands (runs at HA start,
                          before any config entry exists)
  async_setup_entry()  → JS injection + sidebar panel (runs when the
                          integration is active and configured)
  async_remove_entry() → cleans up JS injection + sidebar panel

No configuration.yaml changes required. Everything is automatic once the
integration is installed and set up via the HA integrations UI.
"""
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.helpers import config_validation as cv

from .const import (
    DOMAIN,
    CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL,
    CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE,
    CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON,
    CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL,
    _LOG_LEVEL_MAP,
)
from .frontend import (
    async_register_static_path,
    async_register_frontend_script_resource,
    async_remove_frontend_script_resource,
)
from .storage import LCARdSStorage
from .websocket_api import async_setup_ws
from .services import async_setup_services, async_remove_services

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up LCARdS component.

    Registers the static HTTP path and WebSocket command namespace.
    These must be available even before a config entry exists so that
    the frontend can probe lcards/info after a hot-reload.
    """
    _LOGGER.debug("LCARdS: registering static paths and WebSocket API")
    await async_register_static_path(hass)
    async_setup_ws(hass)
    # Ensure hass.data[DOMAIN] exists so storage + frontend can write to it
    # before a config entry is active (e.g. the resource_url key).
    hass.data.setdefault(DOMAIN, {})
    _LOGGER.info("LCARdS: component setup complete")
    return True


def _register_panel(
    hass: HomeAssistant,
    title: str = DEFAULT_SIDEBAR_TITLE,
    icon: str = DEFAULT_SIDEBAR_ICON,
) -> None:
    """Register the LCARdS sidebar panel with the given title and icon.

    `module_url` must be the exact same URL string that
    `async_register_frontend_script_resource` passed to `add_extra_js_url`
    (stored in `hass.data[DOMAIN]["resource_url"]`). lcards.js is already
    loaded globally on every HA page via add_extra_js_url, which also
    defines the `lcards-config-panel` custom element — the panel itself
    never needs to load the bundle again.

    Using a *different* URL (e.g. the bare, unversioned path) here makes
    the browser treat it as a second, independent ES module: a whole
    separate evaluation of lcards.js with its own singleton state (core,
    ConnectionOverlayService, etc.), registering duplicate listeners on
    the shared hass.connection object and leaving `window.lcards` pointing
    at whichever copy happened to load last. Reusing the identical
    versioned URL lets the browser's module cache collapse both loads into
    a single evaluation, exactly as the bare unversioned path coincidentally
    can for repeat loads of itself but never for the versioned one.
    """
    resource_url = hass.data.get(DOMAIN, {}).get("resource_url", f"/{DOMAIN}/lcards.js")
    _LOGGER.debug("LCARdS: registering sidebar panel (title=%r, icon=%r)", title, icon)
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=title,
        sidebar_icon=icon,
        frontend_url_path="lcards-config",
        config={
            "_panel_custom": {
                "name": "lcards-config-panel",
                "module_url": resource_url,
                "embed_iframe": False,
            }
        },
        require_admin=False,
    )


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the config entry when options are updated.

    This triggers async_unload_entry → async_setup_entry so the panel
    is registered or removed according to the new setting immediately,
    without requiring an HA restart.
    """
    _LOGGER.debug("LCARdS: options updated, reloading config entry")
    await hass.config_entries.async_reload(entry.entry_id)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up LCARdS from a config entry.

    Injects lcards.js into every HA frontend session and, if enabled in
    options, registers the LCARdS Config sidebar panel.
    Cleaned up in async_unload_entry (restart / reload / removal).
    """
    # Apply the configured log level to the Python logger hierarchy.
    # This affects all custom_components.lcards.* child loggers automatically.
    log_level = entry.options.get(CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL)
    py_level = _LOG_LEVEL_MAP.get(log_level, logging.WARNING)
    logging.getLogger(f"custom_components.{DOMAIN}").setLevel(py_level)
    _LOGGER.debug("LCARdS: backend log level set to %r (Python level %d)", log_level, py_level)

    # Initialise persistent storage (loads from .storage/lcards if it exists).
    storage = await LCARdSStorage(hass).async_load()
    hass.data.setdefault(DOMAIN, {})["storage"] = storage

    # Register HA services (lcards.red_alert, lcards.set_alert_mode, etc.)
    await async_setup_services(hass)

    # Inject lcards.js (add_extra_js_url + Lovelace resource for Cast).
    # Pass the configured log level so lcards.js reads it from import.meta.url.
    await async_register_frontend_script_resource(hass, log_level)

    # Conditionally register the sidebar panel based on user option.
    # Defaults to True (visible) on first install.
    if entry.options.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL):
        title = entry.options.get(CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE)
        icon  = entry.options.get(CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON)
        _register_panel(hass, title, icon)
    else:
        _LOGGER.debug("LCARdS: sidebar panel disabled via options")

    _LOGGER.info(
        "LCARdS: config entry active (log_level=%r, show_panel=%s)",
        log_level,
        entry.options.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL),
    )

    # Re-apply setup whenever the user saves new options.
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry.

    Called on HA restart, explicit reload, or just before removal.
    Removes JS injection and the sidebar panel so no orphaned UI elements
    remain until async_setup_entry fires again.
    """
    _LOGGER.debug("LCARdS: unloading config entry")
    async_remove_services(hass)
    await async_remove_frontend_script_resource(hass)

    try:
        async_remove_panel(hass, "lcards-config")
        _LOGGER.debug("LCARdS: sidebar panel removed")
    except Exception:  # noqa: BLE001
        # Panel may already be gone if HA is shutting down
        pass

    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Called after async_unload_entry when the integration is deleted.

    async_unload_entry already handled the cleanup — nothing extra needed.
    """
