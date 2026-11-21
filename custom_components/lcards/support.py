"""Backend support / diagnostics collection for LCARdS.

Shared by the ``lcards/diagnostics`` WebSocket command (shown in the LCARdS
config panel's support section) and HA's standard "Download diagnostics"
(diagnostics.py), so both report exactly the same facts.

Only environment facts are collected — versions, resource registrations,
frontend module URLs, related integrations and option values. Stored user
data is reported as counts, never contents.
"""
from __future__ import annotations

from typing import Any

from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    DOMAIN_VERSION,
    MIN_HA_VERSION,
    FRONTEND_SCRIPT_URL,
)
from .frontend import _LEGACY_RESOURCE_PREFIXES, _get_lovelace_resources

# Frontend key under which HA keeps `frontend: extra_module_url` entries
# (homeassistant.components.frontend.DATA_EXTRA_MODULE_URL, a UrlManager).
_EXTRA_MODULE_URL_KEY = "frontend_extra_module_url"

_CARD_MOD_MARKERS = ("card-mod", "card_mod")
_LCARDS_SCRIPT_PREFIX = f"/{DOMAIN}/{FRONTEND_SCRIPT_URL}"


def _is_card_mod(url: str) -> bool:
    lowered = url.lower()
    return any(marker in lowered for marker in _CARD_MOD_MARKERS)


def _resource_summary(hass: HomeAssistant) -> dict[str, Any]:
    """Lovelace resources relevant to LCARdS support (LCARdS + card-mod only)."""
    lovelace = hass.data.get("lovelace")
    resources = _get_lovelace_resources(hass)
    summary: dict[str, Any] = {
        "mode": getattr(lovelace, "resource_mode", None),
        "entries": [],
        "lcards_count": 0,
        "legacy_lcards": False,
        "card_mod": False,
    }
    if resources is None:
        return summary
    try:
        items = resources.async_items()
    except Exception:  # noqa: BLE001 — resources not loaded yet (yaml mode / early boot)
        return summary

    for item in items:
        url = str(item.get("url", ""))
        is_lcards = url.startswith(_LCARDS_SCRIPT_PREFIX) or url.startswith(_LEGACY_RESOURCE_PREFIXES)
        is_card_mod = _is_card_mod(url)
        if not (is_lcards or is_card_mod):
            continue
        legacy = url.startswith(_LEGACY_RESOURCE_PREFIXES)
        summary["entries"].append({"url": url, "type": item.get("type"), "legacy": legacy})
        if is_lcards:
            summary["lcards_count"] += 1
        summary["legacy_lcards"] = summary["legacy_lcards"] or legacy
        summary["card_mod"] = summary["card_mod"] or is_card_mod
    return summary


def _extra_module_urls(hass: HomeAssistant) -> list[str]:
    """`frontend: extra_module_url` entries, minus LCARdS's own injected URL."""
    manager = hass.data.get(_EXTRA_MODULE_URL_KEY)
    urls = getattr(manager, "urls", None) or ()
    return sorted(u for u in urls if not str(u).startswith(_LCARDS_SCRIPT_PREFIX))


async def async_collect_backend_diagnostics(hass: HomeAssistant) -> dict[str, Any]:
    """Collect backend environment facts for support."""
    extra_urls = _extra_module_urls(hass)
    components = hass.config.components

    entries = hass.config_entries.async_entries(DOMAIN)
    options = dict(entries[0].options) if entries else None

    storage = hass.data.get(DOMAIN, {}).get("storage")
    storage_info = None
    if storage is not None:
        dump = storage.dump()
        storage_info = {"schema_version": dump.get("version"), "key_count": len(dump.get("data", {}))}

    return {
        "versions": {
            "integration": DOMAIN_VERSION,
            "home_assistant": HA_VERSION,
            "min_home_assistant": ".".join(str(p) for p in MIN_HA_VERSION),
        },
        "safe_mode": bool(getattr(hass.config, "safe_mode", False)),
        "recovery_mode": bool(getattr(hass.config, "recovery_mode", False)),
        "resources": _resource_summary(hass),
        "extra_module_urls": extra_urls,
        "card_mod_in_extra_module_url": any(_is_card_mod(u) for u in extra_urls),
        "components": {
            "uix": "uix" in components,
            "hacs": "hacs" in components,
            "card_mod": "card_mod" in components,
        },
        "config_entry": {"present": bool(entries), "options": options},
        "storage": storage_info,
    }
