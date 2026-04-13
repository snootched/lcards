"""Config flow for LCARdS.

Single-instance only — LCARdS does not support multiple config entries.
The initial setup form requires no user input.

Post-install options (sidebar panel visibility, title, icon, log level)
are surfaced via the "Configure" button on the integration card,
handled by LCARdSOptionsFlow.
"""
import logging
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

_LOGGER = logging.getLogger(__name__)

from .const import (
    DOMAIN,
    CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL,
    CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE,
    CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON,
    CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL, LOG_LEVEL_OPTIONS,
    CONF_ENABLE_PREVIEWS, DEFAULT_ENABLE_PREVIEWS,
)


class LCARdSConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for LCARdS."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step triggered from the integrations UI."""
        # Enforce single-instance constraint
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            _LOGGER.info("LCARdS: integration configured")
            return self.async_create_entry(title="LCARdS", data={})

        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Return the options flow handler."""
        return LCARdSOptionsFlow()


class LCARdSOptionsFlow(config_entries.OptionsFlow):
    """Handle LCARdS options (accessible via Configure on the integration card)."""

    async def async_step_init(self, user_input=None):
        """Show the options form."""
        if user_input is not None:
            _LOGGER.debug(
                "LCARdS: options saved — show_panel=%s, log_level=%r, title=%r, icon=%r",
                user_input.get("show_panel"),
                user_input.get("log_level"),
                user_input.get("sidebar_title"),
                user_input.get("sidebar_icon"),
            )
            return self.async_create_entry(data=user_input)

        opts = self.config_entry.options

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_SHOW_PANEL,
                        default=opts.get(CONF_SHOW_PANEL, DEFAULT_SHOW_PANEL),
                    ): bool,
                    vol.Optional(
                        CONF_SIDEBAR_TITLE,
                        default=opts.get(CONF_SIDEBAR_TITLE, DEFAULT_SIDEBAR_TITLE),
                    ): str,
                    vol.Optional(
                        CONF_SIDEBAR_ICON,
                        default=opts.get(CONF_SIDEBAR_ICON, DEFAULT_SIDEBAR_ICON),
                    ): str,
                    vol.Required(
                        CONF_LOG_LEVEL,
                        default=opts.get(CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL),
                    ): vol.In(LOG_LEVEL_OPTIONS),
                    vol.Required(
                        CONF_ENABLE_PREVIEWS,
                        default=opts.get(CONF_ENABLE_PREVIEWS, DEFAULT_ENABLE_PREVIEWS),
                    ): bool,
                }
            ),
        )
