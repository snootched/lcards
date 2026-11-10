"""WebSocket API for LCARdS.

Provides the lcards/* WebSocket command namespace:

  lcards/info                 — backend probe used by IntegrationService
  lcards/storage/get          — read one key (or all)
  lcards/storage/set          — shallow-merge one or many keys
  lcards/storage/delete       — remove one key
  lcards/storage/delete_many  - remove many keys with one save
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

  Per-device scoped storage (device_id supplied by the browser; the record's
  owner is the user signed in on it, see device_access.py):
  lcards/storage/device/get   — read a device's scoped data    (owner or admin)
  lcards/storage/device/set   — write a device's scoped data (deep-merge; a
                                non-admin caller becomes the owner)
  lcards/storage/devices/list — list all stored device IDs          (admin)
  lcards/storage/devices/get  — read any device's data              (admin)
  lcards/storage/devices/set  — write any device's data             (admin)
  lcards/storage/devices/clear — remove a device record entirely    (admin)

  The four user/device set commands take ``replace: true`` to replace each
  written sub-key's value instead of deep-merging it.

  lcards/fire_event: admin, except a non-admin's reload_connection_config
  targeted at their own user id (see _own_user_event_allowed).
"""
import logging
import probatio as vol

from homeassistant.core import HomeAssistant, callback
from homeassistant.components import websocket_api

from .support import async_collect_backend_diagnostics
from .device_access import OWNER_KEY, device_read_allowed, device_write_data, record_owner

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
_DEVICE_UNAUTHORIZED_MSG = "This device record belongs to the user signed in on that device"


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


async def _owner_exists(hass: HomeAssistant, record) -> bool:
    """False when the record's owner is no longer a Home Assistant user."""
    owner = record_owner(record)
    if owner is None:
        return True
    return await hass.auth.async_get_user(owner) is not None


async def _readable_device_record(hass: HomeAssistant, connection, msg: dict, storage, device_id: str):
    """``(record,)`` when the caller may read the device record, else None (error sent).

    Admins and the record's current owner may read it; so may anyone when it
    has no (living) owner (see device_access.py).
    """
    record = await storage.async_get(f"{STORAGE_NS_DEVICE}_{device_id}")
    user = connection.user
    if not device_read_allowed(record, user.id, user.is_admin, await _owner_exists(hass, record)):
        connection.send_error(msg["id"], _UNAUTHORIZED, _DEVICE_UNAUTHORIZED_MSG)
        return None
    return (record,)


def async_setup_ws(hass: HomeAssistant) -> None:
    """Register all LCARdS WebSocket commands."""
    commands = (
        # Core probe
        ws_lcards_info,
        # Global flat storage
        ws_storage_get,
        ws_storage_set,
        ws_storage_delete,
        ws_storage_delete_many,
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
        # Browser-to-all-browsers event relay
        ws_fire_event,
        # Support / diagnostics (admin)
        ws_lcards_diagnostics,
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
            # scoped_storage_replace: the user/device set commands take `replace`.
            # own_user_reload: a non-admin may relay reload_connection_config to
            # their own sessions through lcards/fire_event.
            "capabilities":      ["scoped_storage", "scoped_storage_replace", "own_user_reload"],
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/diagnostics",
    }
)
@websocket_api.async_response
async def ws_lcards_diagnostics(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/diagnostics (admin only).

    Backend environment facts for the config panel's support section —
    the same data as HA's "Download diagnostics" (see support.py).
    """
    if not _require_admin(connection, msg):
        return
    connection.send_result(msg["id"], await async_collect_backend_diagnostics(hass))


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
    Non-admins may read global keys only: the full dict and other users'
    ``_user_<id>`` entries need an admin (their own come from storage/user/get),
    and a ``_device_<id>`` entry follows the device record rule (owner or admin).
    """
    key = msg.get("key")
    if (key is None or key.startswith(f"{STORAGE_NS_USER}_")) and not _require_admin(connection, msg):
        return
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    prefix = f"{STORAGE_NS_DEVICE}_"
    if key and key.startswith(prefix) and await _readable_device_record(hass, connection, msg, storage, key[len(prefix):]) is None:
        return
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
    Admin only: the global store holds settings every user shares.
    """
    if not _require_admin(connection, msg):
        return
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

    Deletes *key* from the store. Admin only. Responds with existed=True/False.
    """
    if not _require_admin(connection, msg):
        return
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    existed = await storage.async_delete(msg["key"])
    connection.send_result(msg["id"], {"ok": True, "existed": existed})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/delete_many",
        vol.Required("keys"): [str],
    }
)
@websocket_api.async_response
async def ws_storage_delete_many(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/delete_many.

    Deletes every key in *keys* with one save (the per-key delete writes the
    whole store each time). Admin only. Responds with the number of keys that existed.
    """
    if not _require_admin(connection, msg):
        return
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return
    removed = await storage.async_delete_many(msg["keys"])
    connection.send_result(msg["id"], {"ok": True, "removed": removed})


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

    Wipes the entire LCARdS store. Irreversible. Admin only.
    """
    if not _require_admin(connection, msg):
        return
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
    Intended for debugging and dev-tools inspection. Admin only (it includes
    every user's and device's scoped settings).
    """
    if not _require_admin(connection, msg):
        return
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
# Browser-to-all-browsers event relay (admin; non-admins: own sessions only)
# ---------------------------------------------------------------------------

# Actions a non-admin may relay, and only to their own user's sessions: after a
# user saves their own connection overlay settings, their other tabs reload them.
_OWN_USER_ACTIONS = frozenset({"reload_connection_config"})
# Payload keys a non-admin may pass along (the saving tab skips its own event).
_OWN_USER_DATA_KEYS = frozenset({"origin_device_id"})


def _own_user_event_allowed(msg: dict, user_id: str) -> bool:
    """Whether a non-admin's fire_event stays inside their own sessions.

    Allowed: an action from ``_OWN_USER_ACTIONS``, ``target_user_ids`` exactly
    the caller, no ``target_device_ids`` (a device id is not tied to a user), and
    only ``_OWN_USER_DATA_KEYS`` in ``data`` with string values (data is spread
    into the event payload, so any other key could widen the targets).
    """
    data = msg.get("data") or {}
    return (
        msg["action"] in _OWN_USER_ACTIONS
        and msg["target_user_ids"] == [user_id]
        and not msg["target_device_ids"]
        and set(data) <= _OWN_USER_DATA_KEYS
        and all(isinstance(v, str) for v in data.values())
    )

@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/fire_event",
        vol.Required("action"): str,
        vol.Optional("target_device_ids", default=[]): [str],
        vol.Optional("target_user_ids",   default=[]): [str],
        vol.Optional("data",              default={}): dict,
    }
)
@websocket_api.async_response
async def ws_fire_event(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/fire_event.

    Relays a browser-originated ``lcards_event`` to all connected browsers via
    the HA event bus.  Requires admin — the fired event can trigger actions
    (config reloads, sounds, etc.) on other users' sessions.

    One narrow exception: a non-admin may send ``reload_connection_config``
    targeted at their own user id only (see ``_own_user_event_allowed``), so
    their other tabs pick up a connection overlay setting they saved for
    themselves.  Anything wider is refused as before.

    Optional ``target_device_ids`` / ``target_user_ids`` are forwarded in the
    payload so the receiving ``IntegrationService._handleLcardsEvent()`` can
    filter events intended only for specific devices or users.
    """
    if not connection.user.is_admin and not _own_user_event_allowed(msg, connection.user.id):
        connection.send_error(msg["id"], _UNAUTHORIZED, _UNAUTHORIZED_MSG)
        return
    payload: dict = {"action": msg["action"], **msg.get("data", {})}
    if msg["target_device_ids"]:
        payload["target_device_ids"] = msg["target_device_ids"]
    if msg["target_user_ids"]:
        payload["target_user_ids"] = msg["target_user_ids"]
    hass.bus.async_fire("lcards_event", payload)
    connection.send_result(msg["id"])
    _LOGGER.debug(
        "LCARdS: fire_event relayed action=%r device_ids=%r user_ids=%r",
        msg["action"], msg["target_device_ids"], msg["target_user_ids"],
    )


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
        vol.Optional("replace", default=False): bool,
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
    Existing sub-keys not present in *data* are preserved.  With
    ``replace: true`` each sub-key in *data* replaces its stored value instead
    of being deep-merged (so a smaller map really shrinks).
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = connection.user.id
    await storage.async_deep_set(STORAGE_NS_USER, user_id, msg["data"], replace=msg["replace"])
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
        vol.Optional("replace", default=False): bool,
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
    ``replace: true`` replaces each sub-key's value, as for storage/user/set.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    user_id = msg["user_id"]
    await storage.async_deep_set(STORAGE_NS_USER, user_id, msg["data"], replace=msg["replace"])
    connection.send_result(msg["id"], {"ok": True, "user_id": user_id, "keys": list(msg["data"].keys())})


# ---------------------------------------------------------------------------
# Per-device scoped storage
# device_id is supplied by the browser (localStorage UUID). The record's owner
# (owner_user_id) is the user signed in on that browser: every non-admin write
# makes the caller the owner, and reads are for the owner and admins
# (device_access.py).
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
    device_id.  Admins read any device; a non-admin the device they currently
    own, or one with no owner (a new one reads empty), else ``unauthorized``.
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    checked = await _readable_device_record(hass, connection, msg, storage, device_id)
    if checked is None:
        return
    device_data = checked[0] or {}

    key = msg.get("key")
    value = device_data.get(key) if key else device_data
    connection.send_result(msg["id"], {"device_id": device_id, "key": key, "value": value})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/storage/device/set",
        vol.Required("device_id"): str,
        vol.Required("data"): dict,
        vol.Optional("replace", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_storage_device_set(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle lcards/storage/device/set.

    Deep-merges *data* into the device-scoped storage object for *device_id*
    (``replace: true`` replaces each sub-key's value, as for storage/user/set).
    This command doubles as the device registration/heartbeat endpoint \u2014
    browsers call it on load with ``display_name``, ``last_seen``, and
    ``user_agent`` so the device appears in the admin panel automatically.

    Open to every signed-in user: the device id lives in that browser, so the
    caller is the user signed in on it. A non-admin's write makes them the
    owner (``owner_user_id``); an admin's write claims only a record with no
    (living) owner, so editing a kiosk's settings from the panel leaves its
    owner alone (see device_access.py). ``owner_user_id`` in *data* is
    ignored here (admins set it with storage/devices/set).
    """
    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    record = await storage.async_get(f"{STORAGE_NS_DEVICE}_{device_id}")
    user = connection.user
    data = device_write_data(record, msg["data"], user.id, user.is_admin, await _owner_exists(hass, record))
    await storage.async_deep_set(STORAGE_NS_DEVICE, device_id, data, replace=msg["replace"])
    connection.send_result(msg["id"], {"ok": True, "device_id": device_id, "keys": [k for k in data if k != OWNER_KEY]})


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
            "owner_user_id": record_owner(data),
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
        vol.Optional("replace", default=False): bool,
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
    ``replace: true`` replaces each sub-key's value, as for storage/user/set.
    """
    if not _require_admin(connection, msg):
        return

    storage = _check_storage(hass, connection, msg)
    if storage is None:
        return

    device_id = msg["device_id"]
    await storage.async_deep_set(STORAGE_NS_DEVICE, device_id, msg["data"], replace=msg["replace"])
    connection.send_result(msg["id"], {"ok": True, "device_id": device_id, "keys": list(msg["data"].keys())})
