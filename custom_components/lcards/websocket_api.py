"""WebSocket API for LCARdS.

Provides the lcards/* WebSocket command namespace:

  lcards/info                 — backend probe used by IntegrationService
  lcards/storage/get          — read one key (or all)
  lcards/storage/set          — shallow-merge one or many keys
  lcards/storage/delete       — remove one key
  lcards/storage/reset        — wipe entire store
  lcards/storage/dump         — return full store (debug)

  Per-user scoped storage (user_id always derived server-side):
  lcards/storage/user/get     — read caller's user-scoped data
  lcards/storage/user/set     — write caller's user-scoped data (deep-merge)
  lcards/storage/user/delete  — delete a sub-key from caller's user data
  lcards/storage/users/list   — list all stored user IDs            (admin)
  lcards/storage/users/get    — read any user's data                (admin)
  lcards/storage/users/set    — write any user's data               (admin)
  lcards/storage/users/clear  — delete all overrides for a user     (admin)

  Per-device scoped storage (device_id supplied by the browser):
  lcards/storage/device/get   — read a device's scoped data
  lcards/storage/device/set   — write a device's scoped data (deep-merge)
  lcards/storage/devices/list — list all stored device IDs          (admin)
  lcards/storage/devices/get  — read any device's data              (admin)
  lcards/storage/devices/set  — write any device's data             (admin)
  lcards/storage/devices/clear — remove a device record entirely    (admin)
"""
import logging
import voluptuous as vol

from homeassistant.core import HomeAssistant, callback
from homeassistant.components import websocket_api

from .const import (
    DOMAIN,
    DOMAIN_VERSION,
    CONF_SHOW_PANEL,
    CONF_SIDEBAR_TITLE,
    CONF_SIDEBAR_ICON,
    CONF_LOG_LEVEL,
    CONF_ENABLE_PREVIEWS,
    DEFAULT_SHOW_PANEL,
    DEFAULT_SIDEBAR_TITLE,
    DEFAULT_SIDEBAR_ICON,
    DEFAULT_LOG_LEVEL,
    DEFAULT_ENABLE_PREVIEWS,
    STORAGE_NS_USER,
    STORAGE_NS_DEVICE,
)

_LOGGER = logging.getLogger(__name__)


_STORAGE_UNAVAILABLE = "storage_unavailable"
_STORAGE_UNAVAILABLE_MSG = "LCARdS storage is not initialised"
_UNAUTHORIZED = "unauthorized"
_UNAUTHORIZED_MSG = "Admin access required"


def _get_storage(hass: HomeAssistant):
    """Return the LCARdSStorage instance from hass.data, or None."""
    return hass.data.get(DOMAIN, {}).get("storage")


def _check_storage(hass: HomeAssistant, connection, msg: dict):
    """Get storage and send an error if it is not yet initialised.

    Returns the storage instance, or None if unavailable (error already sent).
    """
    storage = _get_storage(hass)
    if storage is None:
        connection.send_error(msg["id"], _STORAGE_UNAVAILABLE, _STORAGE_UNAVAILABLE_MSG)
    return storage


def _require_admin(connection, msg: dict) -> bool:
    """Check that the caller is an admin; send an error if not.

    Returns True when the caller is authorised, False when the error was sent.
    """
    if not connection.user.is_admin:
        connection.send_error(msg["id"], _UNAUTHORIZED, _UNAUTHORIZED_MSG)
        return False
    return True


def async_setup_ws(hass: HomeAssistant) -> None:
    """Register all LCARdS WebSocket commands."""
    commands = (
        # Core probe
        ws_lcards_info,
        # Global flat storage
        ws_storage_get,
        ws_storage_set,
        ws_storage_delete,
        ws_storage_reset,
        ws_storage_dump,
        # Push channel
        ws_subscribe,
        # Per-user scoped storage (caller's own data)
        ws_storage_user_get,
        ws_storage_user_set,
        ws_storage_user_delete,
        # Per-user scoped storage (admin: any user)
        ws_storage_users_list,
        ws_storage_users_get,
        ws_storage_users_set,
        ws_storage_users_clear,
        # Per-device scoped storage
        ws_storage_device_get,
        ws_storage_device_set,
        # Per-device scoped storage (admin: any device)
        ws_storage_devices_list,
        ws_storage_devices_get,
        ws_storage_devices_set,
        ws_storage_devices_clear,
    )
    for cmd in commands:
        websocket_api.async_register_command(hass, cmd)
    _LOGGER.debug(
        "LCARdS: registered %d WebSocket command(s) under %s/*",
        len(commands), DOMAIN,
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/info",
    }
)
@websocket_api.async_response
async def ws_lcards_info(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/info.

    Returns integration availability and version.
    Frontend IntegrationService probes this on boot to determine
    whether the backend is present.
    """
    _LOGGER.debug("LCARdS: %s/info probe received", DOMAIN)

    # Storage key count (None if storage not yet initialised)
    storage = _get_storage(hass)
    storage_key_count = len(storage.dump()["data"]) if storage is not None else None

    # Options snapshot from the first config entry (None if not yet configured)
    entries = hass.config_entries.async_entries(DOMAIN)
    options: dict | None = None
    if entries:
        entry_opts = entries[0].options
        options = {
            CONF_SHOW_PANEL:       entry_opts.get(CONF_SHOW_PANEL,       DEFAULT_SHOW_PANEL),
            CONF_SIDEBAR_TITLE:    entry_opts.get(CONF_SIDEBAR_TITLE,    DEFAULT_SIDEBAR_TITLE),
            CONF_SIDEBAR_ICON:     entry_opts.get(CONF_SIDEBAR_ICON,     DEFAULT_SIDEBAR_ICON),
            CONF_LOG_LEVEL:        entry_opts.get(CONF_LOG_LEVEL,        DEFAULT_LOG_LEVEL),
            CONF_ENABLE_PREVIEWS:  entry_opts.get(CONF_ENABLE_PREVIEWS,  DEFAULT_ENABLE_PREVIEWS),
        }

    connection.send_result(
        msg["id"],
        {
            "available":         True,
            "version":           DOMAIN_VERSION,
            "storage_key_count": storage_key_count,
            "options":           options,
            # Capabilities advertised to the frontend so it can gracefully
            # degrade when running against an older backend build.
            "capabilities":      ["scoped_storage"],
        },
    )


# ---------------------------------------------------------------------------
# Storage commands
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/get",
        vol.Optional("key"): str,
    }
)
@websocket_api.async_response
async def ws_storage_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/get.

    Returns the value for *key*, or the full data dict if key is omitted.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    key = msg.get("key")
    value = await storage.async_get(key)
    connection.send_result(msg["id"], {"key": key, "value": value})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/set",
        vol.Required("data"): dict,
    }
)
@websocket_api.async_response
async def ws_storage_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/set.

    Shallow-merges *data* (a dict of key→value pairs) into the store.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    await storage.async_set(msg["data"])
    connection.send_result(msg["id"], {"ok": True, "keys": list(msg["data"].keys())})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/delete",
        vol.Required("key"): str,
    }
)
@websocket_api.async_response
async def ws_storage_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/delete.

    Deletes *key* from the store. Responds with existed=True/False.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    existed = await storage.async_delete(msg["key"])
    connection.send_result(msg["id"], {"ok": True, "existed": existed})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/reset",
    }
)
@websocket_api.async_response
async def ws_storage_reset(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/reset.

    Wipes the entire LCARdS store. Irreversible.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    await storage.async_reset()
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/dump",
    }
)
@websocket_api.async_response
async def ws_storage_dump(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/dump.

    Returns the full store contents including the schema version.
    Intended for debugging and dev-tools inspection.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    connection.send_result(msg["id"], storage.dump())


# ---------------------------------------------------------------------------
# Push-channel subscription
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/subscribe",
    }
)
@websocket_api.async_response
async def ws_subscribe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/subscribe.

    Registers a non-admin-gated subscription to the ``lcards_event`` HA bus.
    The frontend IntegrationService uses this instead of the admin-only
    ``subscribeEvents`` WS API so that non-admin dashboards also receive
    push events such as ``reload`` and ``set_log_level``.

    Each event fired on the bus is forwarded to the subscriber as a WS
    event message containing the event's data dict directly.
    """
    @callback
    def _forward(event):
        connection.send_message(
            websocket_api.event_message(msg["id"], event.data)
        )

    connection.subscriptions[msg["id"]] = hass.bus.async_listen("lcards_event", _forward)
    connection.send_result(msg["id"])
    _LOGGER.debug("LCARdS: browser session subscribed to lcards_event push channel")


# ---------------------------------------------------------------------------
# Per-user scoped storage — caller's own data
# user_id is ALWAYS derived from connection.user.id (server-side, unforgeable)
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/user/get",
        vol.Optional("key"): str,
    }
)
@websocket_api.async_response
async def ws_storage_user_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/user/get.

    Returns the caller's user-scoped data dict, or the value of a single
    sub-key if *key* is supplied.  user_id is taken from the authenticated
    connection — the client cannot supply or spoof it.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = connection.user.id
    user_data = (await storage.async_get(f"{STORAGE_NS_USER}_{user_id}")) or {}

    key = msg.get("key")
    value = user_data.get(key) if key else user_data
    connection.send_result(msg["id"], {"user_id": user_id, "key": key, "value": value})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/user/set",
        vol.Required("data"): dict,
    }
)
@websocket_api.async_response
async def ws_storage_user_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/user/set.

    Deep-merges *data* into the caller's user-scoped storage object.
    Existing sub-keys not present in *data* are preserved.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = connection.user.id
    await storage.async_deep_set(STORAGE_NS_USER, user_id, msg["data"])
    connection.send_result(msg["id"], {"ok": True, "user_id": user_id, "keys": list(msg["data"].keys())})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/user/delete",
        vol.Required("key"): str,
    }
)
@websocket_api.async_response
async def ws_storage_user_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/user/delete.

    Removes a single sub-key from the caller's user-scoped storage object.
    Responds with existed=True/False.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = connection.user.id
    existed = await storage.async_entity_delete_key(STORAGE_NS_USER, user_id, msg["key"])
    connection.send_result(msg["id"], {"ok": True, "user_id": user_id, "existed": existed})


# ---------------------------------------------------------------------------
# Per-user scoped storage — admin: any user
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/users/list",
    }
)
@websocket_api.async_response
async def ws_storage_users_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/users/list.

    Returns a mapping of user_id \u2192 sub-key count for all users with stored data.
    Requires admin.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    entities = storage.get_namespaced_entities(STORAGE_NS_USER)
    summary = {uid: {"key_count": len(data) if isinstance(data, dict) else 0}
               for uid, data in entities.items()}
    connection.send_result(msg["id"], {"users": summary})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/users/get",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_storage_users_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/users/get.

    Returns the full data dict for any user.  Requires admin.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = msg["user_id"]
    value = (await storage.async_get(f"{STORAGE_NS_USER}_{user_id}")) or {}
    connection.send_result(msg["id"], {"user_id": user_id, "value": value})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/users/set",
        vol.Required("user_id"): str,
        vol.Required("data"): dict,
    }
)
@websocket_api.async_response
async def ws_storage_users_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/users/set.

    Deep-merges *data* into any user's scoped storage.  Requires admin.
    Useful for copying global settings to a specific user from the panel.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = msg["user_id"]
    await storage.async_deep_set(STORAGE_NS_USER, user_id, msg["data"])
    connection.send_result(msg["id"], {"ok": True, "user_id": user_id, "keys": list(msg["data"].keys())})


# ---------------------------------------------------------------------------
# Per-device scoped storage
# device_id is supplied by the browser (localStorage UUID).
# We trust it as a routing key, not as an auth credential.
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/device/get",
        vol.Required("device_id"): str,
        vol.Optional("key"): str,
    }
)
@websocket_api.async_response
async def ws_storage_device_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/device/get.

    Returns the device-scoped data dict (or a single sub-key) for the given
    device_id.  Any authenticated user may read their own device data.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    device_data = (await storage.async_get(f"{STORAGE_NS_DEVICE}_{device_id}")) or {}

    key = msg.get("key")
    value = device_data.get(key) if key else device_data
    connection.send_result(msg["id"], {"device_id": device_id, "key": key, "value": value})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/device/set",
        vol.Required("device_id"): str,
        vol.Required("data"): dict,
    }
)
@websocket_api.async_response
async def ws_storage_device_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/device/set.

    Deep-merges *data* into the device-scoped storage object for *device_id*.
    This command doubles as the device registration/heartbeat endpoint \u2014
    browsers call it on load with ``display_name``, ``last_seen``, and
    ``user_agent`` so the device appears in the admin panel automatically.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    await storage.async_deep_set(STORAGE_NS_DEVICE, device_id, msg["data"])
    connection.send_result(msg["id"], {"ok": True, "device_id": device_id, "keys": list(msg["data"].keys())})


# ---------------------------------------------------------------------------
# Admin clear commands — remove entire scoped entries
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/users/clear",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_storage_users_clear(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/users/clear.

    Deletes the entire scoped-storage entry for *user_id*.  Requires admin.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    removed = await storage.async_clear_entity(STORAGE_NS_USER, msg["user_id"])
    connection.send_result(msg["id"], {"ok": True, "removed": removed, "user_id": msg["user_id"]})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/devices/clear",
        vol.Required("device_id"): str,
    }
)
@websocket_api.async_response
async def ws_storage_devices_clear(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/devices/clear.

    Deletes the entire scoped-storage entry for *device_id*.  Requires admin.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    removed = await storage.async_clear_entity(STORAGE_NS_DEVICE, msg["device_id"])
    connection.send_result(msg["id"], {"ok": True, "removed": removed, "device_id": msg["device_id"]})

# ---------------------------------------------------------------------------
# Per-device scoped storage — admin: any device
# ---------------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/devices/list",
    }
)
@websocket_api.async_response
async def ws_storage_devices_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/devices/list.

    Returns all registered device IDs with display_name, last_seen summary.
    Requires admin.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    entities = storage.get_namespaced_entities(STORAGE_NS_DEVICE)
    summary = {
        did: {
            "display_name": data.get("display_name") if isinstance(data, dict) else None,
            "last_seen":    data.get("last_seen")    if isinstance(data, dict) else None,
            "user_agent":   data.get("user_agent")   if isinstance(data, dict) else None,
            "key_count":    len(data) if isinstance(data, dict) else 0,
        }
        for did, data in entities.items()
    }
    connection.send_result(msg["id"], {"devices": summary})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/devices/get",
        vol.Required("device_id"): str,
    }
)
@websocket_api.async_response
async def ws_storage_devices_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/devices/get.

    Returns the full data dict for any device.  Requires admin.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    value = (await storage.async_get(f"{STORAGE_NS_DEVICE}_{device_id}")) or {}
    connection.send_result(msg["id"], {"device_id": device_id, "value": value})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/devices/set",
        vol.Required("device_id"): str,
        vol.Required("data"): dict,
    }
)
@websocket_api.async_response
async def ws_storage_devices_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/devices/set.

    Deep-merges *data* into any device's scoped storage.  Requires admin.
    Useful for renaming a device or copying settings from the admin panel.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    await storage.async_deep_set(STORAGE_NS_DEVICE, device_id, msg["data"])
    connection.send_result(msg["id"], {"ok": True, "device_id": device_id, "keys": list(msg["data"].keys())})
