"""HA service (action) handlers for the LCARdS integration.

Provides the lcards.* action namespace:

  lcards.set_alert_mode   — set any alert mode by name
  lcards.red_alert        — activate red alert
  lcards.yellow_alert     — activate yellow alert
  lcards.blue_alert       — activate blue alert
  lcards.gray_alert       — activate gray alert
  lcards.black_alert      — activate black alert
  lcards.clear_alert      — return to normal (green_alert)
  lcards.reload           — fire a reload event to all connected frontends
  lcards.set_log_level    — change JS frontend log level at runtime

All services accept four optional targeting fields (all may be combined):

  target_device_ids    — list of browser device UUIDs (from lcards_device_id
                         localStorage key).
  target_device_names  — list of device display names as set in the LCARdS
                         config panel (or ?lcards_device= URL param).  Resolved
                         to UUIDs server-side.  Non-unique names hit all devices
                         sharing that name — which can be intentional for
                         identically-named kiosk groups.
  target_user_ids      — list of HA user IDs.
  target_user_names    — list of HA user display names.  Resolved to user IDs
                         server-side.  Case-insensitive.

When none of these fields are provided the service behaves as a broadcast
(existing default behaviour — fully backward-compatible).

Alert mode services — no targeting
  Call input_select.select_option on input_select.lcards_alert_mode, the
  single source of truth for global alert state.  The helper change propagates
  to ThemeManager, SoundManager, and alert overlays via their existing
  HelperManager subscriptions.

Alert mode services — with targeting
  Skip the input_select write (global state must not change) and instead fire
  a targeted lcards_event with action="set_alert_mode".  Each JS client
  self-filters on its own device/user identity and applies the alert locally
  as a transient, non-persistent state change.

The `reload` and `set_log_level` services always use the lcards_event push
channel (with optional per-device/per-user targeting).
"""
import logging
import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall

from .const import DOMAIN, LOG_LEVEL_OPTIONS, _LOG_LEVEL_MAP

_LOGGER = logging.getLogger(__name__)

# The HA input_select entity that drives alert mode across the LCARdS system.
_ALERT_MODE_ENTITY = "input_select.lcards_alert_mode"

# Valid option values (must match the input_select options in the helper registry).
_ALERT_MODES = [
    "green_alert",
    "red_alert",
    "yellow_alert",
    "blue_alert",
    "gray_alert",
    "black_alert",
]

# HA event name for the Python → JS push channel.
EVENT_LCARDS = "lcards_event"

# Optional targeting schema shared by every service.
# All four fields absent → broadcast (existing default behaviour).
# Union semantics: event accepted if client appears in EITHER resolved list.
_TARGET_FIELDS = {
    vol.Optional("target_device_ids"):   [vol.All(str, vol.Length(min=1))],
    vol.Optional("target_device_names"): [vol.All(str, vol.Length(min=1))],
    vol.Optional("target_user_ids"):     [vol.All(str, vol.Length(min=1))],
    vol.Optional("target_user_names"):   [vol.All(str, vol.Length(min=1))],
}


async def _async_resolve_targets(
    hass: HomeAssistant,
    call: ServiceCall,
) -> tuple[list[str], list[str]]:
    """Resolve all targeting fields to concrete ``(device_ids, user_ids)`` lists.

    Merges explicit UUID lists with friendly-name lookups:

    * ``target_device_ids``   — used as-is.
    * ``target_device_names`` — matched case-insensitively against the
                                ``display_name`` stored in LCARdS backend
                                storage.  Non-unique names hit *all* devices
                                sharing that display name.
    * ``target_user_ids``     — used as-is.
    * ``target_user_names``   — matched case-insensitively against the HA
                                user ``name`` / display name.

    Returns ``([], [])`` when no targeting fields are present (→ broadcast).
    """
    device_ids: list[str] = list(call.data.get("target_device_ids") or [])
    user_ids:   list[str] = list(call.data.get("target_user_ids")   or [])

    # Resolve device display names → UUIDs via LCARdS backend storage.
    device_names = call.data.get("target_device_names") or []
    if device_names:
        names_lower = {n.lower() for n in device_names}
        storage = hass.data.get(DOMAIN, {}).get("storage")
        if storage is not None:
            for dev_uuid, dev_data in storage.get_namespaced_entities("_device").items():
                dn = (dev_data.get("display_name") or "").lower()
                if dn in names_lower and dev_uuid not in device_ids:
                    device_ids.append(dev_uuid)
                    _LOGGER.debug(
                        "LCARdS targeting: resolved device name %r → %s", dn, dev_uuid
                    )
        else:
            _LOGGER.warning(
                "LCARdS targeting: target_device_names provided but storage not available"
            )

    # Resolve user display names → user IDs via HA auth.
    user_names = call.data.get("target_user_names") or []
    if user_names:
        names_lower = {n.lower() for n in user_names}
        for user in await hass.auth.async_get_users():
            uname = (user.name or "").lower()
            if uname in names_lower and user.id not in user_ids:
                user_ids.append(user.id)
                _LOGGER.debug(
                    "LCARdS targeting: resolved user name %r → %s", uname, user.id
                )

    return device_ids, user_ids


def _fire_targeted_event(
    hass: HomeAssistant,
    action: str,
    extra: dict,
    device_ids: list[str],
    user_ids: list[str],
) -> None:
    """Fire an lcards_event with optional device/user targeting.

    Omits targeting keys when the lists are empty so broadcast payloads
    stay clean (no ``target_device_ids: []``).
    """
    payload: dict = {"action": action, **extra}
    if device_ids:
        payload["target_device_ids"] = device_ids
    if user_ids:
        payload["target_user_ids"] = user_ids
    hass.bus.async_fire(EVENT_LCARDS, payload)



SERVICE_SET_ALERT_MODE = "set_alert_mode"
SERVICE_RED_ALERT      = "red_alert"
SERVICE_YELLOW_ALERT   = "yellow_alert"
SERVICE_BLUE_ALERT     = "blue_alert"
SERVICE_GRAY_ALERT     = "gray_alert"
SERVICE_BLACK_ALERT    = "black_alert"
SERVICE_CLEAR_ALERT    = "clear_alert"
SERVICE_RELOAD         = "reload"
SERVICE_SET_LOG_LEVEL  = "set_log_level"

_ALL_SERVICES = [
    SERVICE_SET_ALERT_MODE,
    SERVICE_RED_ALERT,
    SERVICE_YELLOW_ALERT,
    SERVICE_BLUE_ALERT,
    SERVICE_GRAY_ALERT,
    SERVICE_BLACK_ALERT,
    SERVICE_CLEAR_ALERT,
    SERVICE_RELOAD,
    SERVICE_SET_LOG_LEVEL,
]


async def _async_set_alert_mode(hass: HomeAssistant, mode: str) -> None:
    """Set alert mode by writing to input_select.lcards_alert_mode.

    Delegates to the standard input_select.select_option service so that
    the full LCARdS pipeline (theme, sound, overlay) fires via the helper
    subscription mechanism already wired up in JS.
    """
    _LOGGER.debug("LCARdS service: setting alert mode → %r", mode)
    try:
        await hass.services.async_call(
            "input_select",
            "select_option",
            {"entity_id": _ALERT_MODE_ENTITY, "option": mode},
            blocking=True,
        )
    except Exception as exc:  # noqa: BLE001
        _LOGGER.warning(
            "LCARdS: failed to set alert mode %r — is %s defined? (%s)",
            mode, _ALERT_MODE_ENTITY, exc,
        )


async def async_setup_services(hass: HomeAssistant) -> None:
    """Register all LCARdS HA services.

    Called from async_setup_entry.  Services are removed in
    async_remove_services (called from async_unload_entry).
    """

    async def handle_set_alert_mode(call: ServiceCall) -> None:
        mode = call.data["mode"]
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": mode}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, mode)

    async def handle_red_alert(call: ServiceCall) -> None:
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": "red_alert"}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, "red_alert")

    async def handle_yellow_alert(call: ServiceCall) -> None:
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": "yellow_alert"}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, "yellow_alert")

    async def handle_blue_alert(call: ServiceCall) -> None:
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": "blue_alert"}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, "blue_alert")

    async def handle_gray_alert(call: ServiceCall) -> None:
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": "gray_alert"}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, "gray_alert")

    async def handle_black_alert(call: ServiceCall) -> None:
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": "black_alert"}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, "black_alert")

    async def handle_clear_alert(call: ServiceCall) -> None:
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        if device_ids or user_ids:
            _fire_targeted_event(hass, "set_alert_mode", {"mode": "green_alert"}, device_ids, user_ids)
        else:
            await _async_set_alert_mode(hass, "green_alert")

    async def handle_reload(call: ServiceCall) -> None:
        """Fire a reload push event to connected LCARdS frontends (targeted or all)."""
        _LOGGER.info("LCARdS service: firing reload event to connected frontends")
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        _fire_targeted_event(hass, "reload", {}, device_ids, user_ids)

    async def handle_set_log_level(call: ServiceCall) -> None:
        """Update log level on Python backend and push to JS frontends (targeted or all)."""
        level = call.data["level"]
        _LOGGER.info("LCARdS service: setting log level → %r", level)
        # Update Python logger hierarchy immediately (always — it is process-wide)
        py_level = _LOG_LEVEL_MAP.get(level, logging.WARNING)
        logging.getLogger(f"custom_components.{DOMAIN}").setLevel(py_level)
        # Push to connected JS frontends via the lcards_event channel
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        _fire_targeted_event(hass, "set_log_level", {"level": level}, device_ids, user_ids)

    # --- Register all services ---

    hass.services.async_register(
        DOMAIN, SERVICE_SET_ALERT_MODE, handle_set_alert_mode,
        schema=vol.Schema({vol.Required("mode"): vol.In(_ALERT_MODES), **_TARGET_FIELDS}),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_RED_ALERT,    handle_red_alert,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_YELLOW_ALERT, handle_yellow_alert,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_BLUE_ALERT,   handle_blue_alert,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_GRAY_ALERT,   handle_gray_alert,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_BLACK_ALERT,  handle_black_alert,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR_ALERT,  handle_clear_alert,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_RELOAD,       handle_reload,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SET_LOG_LEVEL, handle_set_log_level,
        schema=vol.Schema({vol.Required("level"): vol.In(LOG_LEVEL_OPTIONS), **_TARGET_FIELDS}),
    )

    _LOGGER.debug(
        "LCARdS: registered %d service(s) under %s.*",
        len(_ALL_SERVICES), DOMAIN,
    )


def async_remove_services(hass: HomeAssistant) -> None:
    """Remove all LCARdS HA services.

    Called from async_unload_entry so services disappear cleanly when the
    integration is reloaded or removed.
    """
    for service in _ALL_SERVICES:
        hass.services.async_remove(DOMAIN, service)
    _LOGGER.debug("LCARdS: removed %d service(s)", len(_ALL_SERVICES))
