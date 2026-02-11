"""LCARdS Custom Integration for Home Assistant.

Provides:
- Configuration panel for LCARdS helper management
- Static file serving for panel JavaScript
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

_LOGGER = logging.getLogger(__name__)

DOMAIN = "lcards"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the LCARdS integration."""
    _LOGGER.info("Setting up LCARdS integration")

    # Register static path for panel JS
    integration_dir = Path(__file__).parent
    frontend_dir = integration_dir / "frontend"

    hass.http.register_static_path(
        "/lcards-static", str(frontend_dir), cache_headers=True
    )
    _LOGGER.debug("Registered static path: /lcards-static -> %s", frontend_dir)

    # Register the configuration panel
    await async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="LCARdS Config",
        sidebar_icon="mdi:cog",
        frontend_url_path="lcards-config",
        config={
            "_panel_custom": {
                "name": "lcards-config-panel",
                "embed_iframe": False,
                "trust_external": False,
                "js_url": "/lcards-static/lcards-config-panel.js",
            }
        },
        require_admin=False,
    )
    _LOGGER.info("Registered LCARdS configuration panel")

    return True
