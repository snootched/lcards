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
  lcards.trigger_effect   — fire a named screen effect on target devices/users

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
SERVICE_TRIGGER_EFFECT = "trigger_effect"
SERVICE_CLEAR_EFFECT   = "clear_effect"
SERVICE_SHOW_PORTAL_CARD  = "show_portal_card"
SERVICE_CLEAR_PORTAL_CARD = "clear_portal_card"
SERVICE_BORG_ASSIMILATE   = "borg_assimilate"    # Easter egg
SERVICE_BORG_DEASSIMILATE = "borg_deassimilate"  # Easter egg — restores normal state

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
    SERVICE_TRIGGER_EFFECT,
    SERVICE_CLEAR_EFFECT,
    SERVICE_SHOW_PORTAL_CARD,
    SERVICE_CLEAR_PORTAL_CARD,
    SERVICE_BORG_ASSIMILATE,
    SERVICE_BORG_DEASSIMILATE,
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
    async def handle_trigger_effect(call: ServiceCall) -> None:
        """Fire layered screen effects on target LCARdS frontends.

        ``layers`` — per-slot effect config dict (required):
          { backdrop: { preset, ...params }, color: { preset, ...params }, canvas: { preset, ...params } }

        ``duration`` (optional int ms) auto-clears all effects after that delay.
        """
        layers   = call.data.get("layers") or {}
        duration = call.data.get("duration") or None
        _LOGGER.info("LCARdS service: triggering screen effect layers %r", layers)
        payload: dict = {"layers": layers}
        if duration:
            payload["duration"] = duration
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        _fire_targeted_event(hass, "trigger_effect", payload, device_ids, user_ids)
    async def handle_clear_effect(call: ServiceCall) -> None:
        """Clear screen effects on target LCARdS frontends.

        ``slot`` (optional) — if provided, clears only that slot
        (``'backdrop'``, ``'canvas'``, or ``'color'``).  Omit to clear all
        active screen effects.
        """
        slot = call.data.get("slot") or None
        _LOGGER.info("LCARdS service: clearing screen effect (slot=%r)", slot)
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        payload = {"slot": slot} if slot else {}
        _fire_targeted_event(hass, "clear_effect", payload, device_ids, user_ids)

    async def handle_show_portal_card(call: ServiceCall) -> None:
        """Show a portal card overlay on target LCARdS frontends."""
        _LOGGER.info("LCARdS service: show_portal_card")
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        payload = {
            "content":  call.data.get("content"),
            "layers":   call.data.get("layers"),
            "position": call.data.get("position", "center"),
            "width":    call.data.get("width", "auto"),
            "height":   call.data.get("height", "auto"),
            "duration": call.data.get("duration"),
            "dismiss":  call.data.get("dismiss", True),
        }
        _fire_targeted_event(hass, "show_portal_card", payload, device_ids, user_ids)

    async def handle_clear_portal_card(call: ServiceCall) -> None:
        """Clear the portal card overlay on target LCARdS frontends."""
        _LOGGER.info("LCARdS service: clear_portal_card")
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        _fire_targeted_event(hass, "clear_portal_card", {}, device_ids, user_ids)

    async def handle_borg_assimilate(call: ServiceCall) -> None:
        """Trigger the Borg assimilation Easter egg on target LCARdS frontends.

        Fires a ``borg_assimilate`` lcards_event which the JS
        BorgAssimilationManager picks up and orchestrates into the full
        palette-swap + canvas intro + persistent effects sequence.
        """
        _LOGGER.info("LCARdS service: borg_assimilate — resistance is futile")
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        payload: dict = {}

        if call.data.get("intro_duration")   is not None:
            payload["intro_duration"]   = call.data["intro_duration"]
        if call.data.get("transition_style") is not None:
            payload["transition_style"] = call.data["transition_style"]

        # Flat shortcuts → canvas params; intro_layers object wins on overlap.
        site_count      = call.data.get("site_count")
        tendrils        = call.data.get("tendrils_per_site")
        tendril_length  = call.data.get("tendril_length")
        particle_count  = call.data.get("particle_count")
        canvas_overrides: dict = {}
        if site_count     is not None: canvas_overrides["siteCount"]       = site_count
        if tendrils       is not None: canvas_overrides["tendrilsPerSite"] = tendrils
        if tendril_length is not None: canvas_overrides["tendrilLength"]   = tendril_length
        if particle_count is not None: canvas_overrides["particleCount"]   = particle_count

        intro_layers = call.data.get("intro_layers")
        if canvas_overrides:
            if intro_layers is not None:
                # Flat fields are the base; intro_layers.canvas keys override.
                merged_canvas = {**canvas_overrides, **(intro_layers.get("canvas") or {})}
                payload["intro_layers"] = {**intro_layers, "canvas": merged_canvas}
            else:
                payload["intro_layers"] = {"canvas": canvas_overrides}
        elif intro_layers is not None:
            payload["intro_layers"] = intro_layers

        # suppress_persistent is ignored when persistent_layers is explicitly set.
        persistent_layers = call.data.get("persistent_layers")
        if persistent_layers is not None:
            payload["persistent_layers"] = persistent_layers
        elif call.data.get("suppress_persistent"):
            payload["persistent_layers"] = {}

        _fire_targeted_event(hass, "borg_assimilate", payload, device_ids, user_ids)

    async def handle_borg_deassimilate(call: ServiceCall) -> None:
        """Reverse the Borg assimilation on target LCARdS frontends.

        Fires a ``borg_deassimilate`` lcards_event which BorgAssimilationManager
        handles by playing an optional glitch outro, reverting the palette and
        font, and clearing all persistent screen effects.
        """
        _LOGGER.info("LCARdS service: borg_deassimilate — systems restoring")
        device_ids, user_ids = await _async_resolve_targets(hass, call)
        payload: dict = {}
        if call.data.get("with_outro") is not None:
            payload["with_outro"] = call.data["with_outro"]
        if call.data.get("outro_layers") is not None:
            payload["outro_layers"] = call.data["outro_layers"]
        if call.data.get("revert_transition_style") is not None:
            payload["revert_transition_style"] = call.data["revert_transition_style"]
        _fire_targeted_event(hass, "borg_deassimilate", payload, device_ids, user_ids)

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
    hass.services.async_register(
        DOMAIN, SERVICE_TRIGGER_EFFECT, handle_trigger_effect,
        schema=vol.Schema({
            vol.Required("layers"):   dict,
            vol.Optional("duration"): vol.All(int, vol.Range(min=100)),
            **_TARGET_FIELDS,
        }),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR_EFFECT, handle_clear_effect,
        schema=vol.Schema({
            vol.Optional("slot"): vol.In(["backdrop", "canvas", "color"]),
            **_TARGET_FIELDS,
        }),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SHOW_PORTAL_CARD, handle_show_portal_card,
        schema=vol.Schema({
            vol.Required("content"): dict,
            vol.Optional("layers"):  dict,
            vol.Optional("position"): vol.In([
                "top-left", "top", "top-right",
                "left", "center", "right",
                "bottom-left", "bottom", "bottom-right",
            ]),
            vol.Optional("width"):    str,
            vol.Optional("height"):   str,
            vol.Optional("duration"): vol.All(int, vol.Range(min=100)),
            vol.Optional("dismiss"):  bool,
            **_TARGET_FIELDS,
        }),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_CLEAR_PORTAL_CARD, handle_clear_portal_card,
        schema=vol.Schema(_TARGET_FIELDS),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_BORG_ASSIMILATE, handle_borg_assimilate,
        schema=vol.Schema({
            vol.Optional("intro_duration"):    vol.All(int, vol.Range(min=1000, max=60000)),
            vol.Optional("transition_style"):  vol.In(["flash", "fade_only", "blur_fade", "off"]),
            vol.Optional("site_count"):        vol.All(int, vol.Range(min=1, max=20)),
            vol.Optional("tendrils_per_site"): vol.All(int, vol.Range(min=1, max=20)),
            vol.Optional("tendril_length"):    vol.All(int, vol.Range(min=100, max=1200)),
            vol.Optional("particle_count"):    vol.All(int, vol.Range(min=0, max=6)),
            vol.Optional("suppress_persistent"): bool,
            vol.Optional("intro_layers"):      dict,
            vol.Optional("persistent_layers"): dict,
            **_TARGET_FIELDS,
        }),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_BORG_DEASSIMILATE, handle_borg_deassimilate,
        schema=vol.Schema({
            vol.Optional("with_outro"):             bool,
            vol.Optional("outro_layers"):           dict,
            vol.Optional("revert_transition_style"): vol.In(["flash", "fade_only", "blur_fade", "off"]),
            **_TARGET_FIELDS,
        }),
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
