"""Frontend registration for LCARdS.

Registers lcards.js as a static HTTP path, injects it into every HA
frontend session via add_extra_js_url, and manages the Lovelace resource
entry for Cast / kiosk support.

Modelled closely on UIX (Lint-Free-Technology/uix) — same pattern, same
safety guards.
"""
import logging

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.resources import ResourceStorageCollection

from .const import DOMAIN, FRONTEND_SCRIPT_URL, DOMAIN_VERSION, DEFAULT_LOG_LEVEL

# Legacy resource URL prefixes that were manually added by users following the
# old installation docs (HACS frontend plugin path). The integration removes
# these automatically on first setup so lcards.js is not loaded twice.
_LEGACY_RESOURCE_PREFIXES = (
    "/hacsfiles/lcards/lcards.js",
    "/local/community/lcards/lcards.js",
)


def _get_lovelace_resources(hass: HomeAssistant):
    """Return the Lovelace resources collection, or None if unavailable.

    hass.data["lovelace"] is a LovelaceData named-tuple/dataclass — access
    .resources as an attribute, not via dict .get().
    """
    lovelace = hass.data.get("lovelace")
    if lovelace is None:
        return None
    return getattr(lovelace, "resources", None)


async def async_register_static_path(hass: HomeAssistant) -> None:
    """Register static HTTP paths for LCARdS.

    A single /{DOMAIN}/ directory registration serves the entire integration
    directory, covering the main JS bundle, source map, and all asset
    subdirectories (fonts/, sounds/, msd/, images/, brand/).

    Called from async_setup() so all paths are available from HA start,
    even before a config entry exists.
    """
    integration_dir = hass.config.path(f"custom_components/{DOMAIN}")
    try:
        await hass.http.async_register_static_paths(
            [
                # Serve the entire integration directory under /{DOMAIN}/.
                # Covers lcards.js, lcards.js.map, fonts/, sounds/, msd/,
                # images/, and brand/ in one registration.
                StaticPathConfig(
                    f"/{DOMAIN}",
                    integration_dir,
                    True,
                ),
            ]
        )
    except RuntimeError:
        # Already registered — happens when the integration is removed
        # and HA has not been fully restarted yet.
        pass
    else:
        _LOGGER.debug("LCARdS: static paths registered from %s", integration_dir)


async def async_register_frontend_script_resource(
    hass: HomeAssistant,
    log_level: str = DEFAULT_LOG_LEVEL,
) -> None:
    """Inject lcards.js into every HA frontend session.

    1. add_extra_js_url  — loads the script on every HA page automatically.
    2. Lovelace resource — makes the card available in Cast / kiosk mode.

    The log_level is appended as a ?log= query param so lcards.js can read
    it via import.meta.url at module load time, before any other code runs.

    Called from async_setup_entry() so it only runs when the integration
    is actually configured and active.
    """
    resource_url = f"/{DOMAIN}/{FRONTEND_SCRIPT_URL}?v={DOMAIN_VERSION}&log={log_level}"

    # Store the exact registered URL so async_remove_frontend_script_resource
    # can call remove_extra_js_url with the right string (it uses exact matching).
    hass.data.setdefault(DOMAIN, {})["resource_url"] = resource_url

    # 1. Inject into every HA frontend session (no Lovelace dashboard needed)
    add_extra_js_url(hass, resource_url)
    _LOGGER.info("LCARdS: registered frontend script resource: %s", resource_url)

    # 2. Register / update Lovelace resource for Cast support
    resources = _get_lovelace_resources(hass)
    if not resources:
        return

    if not resources.loaded:
        await resources.async_load()
        resources.loaded = True

    # Remove any legacy manually-added resources from the old plugin install path.
    # These would cause lcards.js to load twice alongside the integration resource.
    legacy_ids = [
        r["id"]
        for r in resources.async_items()
        if any(r["url"].startswith(prefix) for prefix in _LEGACY_RESOURCE_PREFIXES)
    ]
    for legacy_id in legacy_ids:
        if isinstance(resources, ResourceStorageCollection):
            await resources.async_delete_item(legacy_id)
        else:
            resources.data[:] = [
                r for r in resources.data
                if not any(r.get("url", "").startswith(p) for p in _LEGACY_RESOURCE_PREFIXES)
            ]

    if legacy_ids:
        _LOGGER.info(
            "LCARdS: removed %d legacy Lovelace resource(s) from the old plugin "
            "install path — lcards.js is now served by the integration.",
            len(legacy_ids),
        )

    frontend_added = False
    for r in resources.async_items():
        if r["url"].startswith(f"/{DOMAIN}/{FRONTEND_SCRIPT_URL}"):
            frontend_added = True
            # Update URL whenever it differs from the target — covers both
            # version upgrades and log level option changes.
            if r["url"] != resource_url:
                if isinstance(resources, ResourceStorageCollection):
                    await resources.async_update_item(
                        r["id"],
                        {"res_type": "module", "url": resource_url},
                    )
                else:
                    # Fallback for non-storage resource collections
                    r["url"] = resource_url

    if not frontend_added:
        if getattr(resources, "async_create_item", None):
            await resources.async_create_item(
                {"res_type": "module", "url": resource_url}
            )
        elif getattr(resources, "data", None) and getattr(
            resources.data, "append", None
        ):
            resources.data.append({"type": "module", "url": resource_url})

    # Note: the Lovelace update block above uses r["url"] != resource_url for
    # comparison — this correctly detects any change including log level shifts.


async def async_remove_frontend_script_resource(hass: HomeAssistant) -> None:
    """Remove lcards.js from extra JS URLs and Lovelace resources.

    Called from async_unload_entry() on reload/removal.

    remove_extra_js_url() uses exact URL matching, so we must pass the same
    URL that was passed to add_extra_js_url(). We stored it in hass.data[DOMAIN]
    at registration time precisely for this reason.
    """
    resource_url = (
        hass.data.get(DOMAIN, {}).get("resource_url")
        or f"/{DOMAIN}/{FRONTEND_SCRIPT_URL}?v={DOMAIN_VERSION}"
    )

    remove_extra_js_url(hass, resource_url)
    _LOGGER.debug("LCARdS: removed frontend script resource: %s", resource_url)
    # Clean up the stored URL so it isn't stale on the next setup_entry cycle.
    hass.data.get(DOMAIN, {}).pop("resource_url", None)

    resources = _get_lovelace_resources(hass)
    if not resources:
        return

    if not resources.loaded:
        await resources.async_load()
        resources.loaded = True

    for r in resources.async_items():
        if r["url"].startswith(f"/{DOMAIN}/{FRONTEND_SCRIPT_URL}"):
            if isinstance(resources, ResourceStorageCollection):
                await resources.async_delete_item(r["id"])
            else:
                resources.data.remove(r)
