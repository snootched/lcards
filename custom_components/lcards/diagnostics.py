"""Diagnostics for LCARdS (Settings → Devices & services → LCARdS → ⋮ → Download diagnostics).

HA adds its own system information (HA version, installation type, custom
integrations) to the downloaded file; this contributes the LCARdS-specific
environment facts shared with the config panel's support section.
"""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .support import async_collect_backend_diagnostics


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for the LCARdS config entry."""
    return await async_collect_backend_diagnostics(hass)
