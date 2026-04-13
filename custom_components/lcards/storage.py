"""Persistent storage for LCARdS.

Wraps HA's Store with a flat key/value namespace:

    { "data": { "<key>": <any JSON-serialisable value> } }

The Store version (STORAGE_VERSION = 1) is managed by HA and written to
.storage/lcards in the HA config directory.  Data persists across HA
restarts and HACS upgrades — it lives outside custom_components/.

Lifecycle:
  LCARdSStorage is created and loaded in async_setup_entry(), stored on
  hass.data[DOMAIN]["storage"].  WebSocket commands look it up there at
  call time, so they work correctly across config-entry reloads.

Scoped storage namespaces:
  Per-user settings are stored under flat key ``_user_<user_id>``.
  Per-device settings are stored under flat key ``_device_<device_id>``.
  The ``async_deep_set`` method handles sub-key merging within these
  flat keys so that updating one setting does not overwrite all others
  stored for the same user/device (avoiding the shallow-merge clobber
  problem that ``async_set`` has at the top-level namespace).

  Example layout after two users have written settings::

      {
        "sound_overrides": {...},          # legacy global key
        "_user_abc": {"sound_enabled": true, "sound_scheme": "lcars_beeps"},
        "_user_xyz": {"sound_volume": 0.3},
        "_device_cafe": {"sound_volume": 0.8, "display_name": "Kitchen Tablet"},
      }
"""
import logging
from collections.abc import Mapping
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
_STORAGE_KEY = DOMAIN  # written to .storage/lcards


class LCARdSStorage:
    """Flat key/value persistent store for LCARdS."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store = Store(hass, STORAGE_VERSION, _STORAGE_KEY)
        self._data: dict[str, Any] = {}

    async def async_load(self) -> "LCARdSStorage":
        """Load data from disk into the in-memory cache. Returns self."""
        stored = await self._store.async_load()
        if stored:
            self._data = stored.get("data", {})
        _LOGGER.debug("LCARdS: storage loaded (%d key(s))", len(self._data))
        return self

    async def _async_save(self) -> None:
        """Persist the current in-memory state to disk (debounced by HA)."""
        await self._store.async_save({"data": self._data})

    async def async_get(self, key: str | None = None) -> Any:
        """Return a single key's value, or the full data dict if key is None.

        Returns None for a missing key (not an error).
        """
        if key is None:
            return dict(self._data)
        return self._data.get(key)

    async def async_set(self, updates: dict[str, Any]) -> None:
        """Shallow-merge *updates* into the store and persist."""
        self._data.update(updates)
        await self._async_save()
        _LOGGER.debug(
            "LCARdS: storage set %d key(s): %s", len(updates), list(updates)
        )

    async def async_deep_set(
        self, namespace: str, entity_id: str, data: dict[str, Any]
    ) -> None:
        """Deep-merge *data* into a namespaced entity key and persist.

        The flat storage key is ``f"{namespace}_{entity_id}"`` (e.g.
        ``_user_abc123`` or ``_device_cafe1234``).  The caller's *data* dict
        is recursively merged into whatever is already stored under that key,
        so updating one sub-key does not clobber sibling keys written earlier.

        This is safe from concurrent-write races because HA's event loop
        serialises WebSocket handlers — at most one handler is running at a
        time per connection.

        Args:
            namespace: Key prefix, e.g. ``_user`` or ``_device``.
            entity_id: The user UUID or device UUID that forms the suffix.
            data: Sub-key/value pairs to merge into the existing entity dict.
        """
        flat_key = f"{namespace}_{entity_id}"
        existing = self._data.get(flat_key) or {}
        merged = _deep_merge(existing, data)
        self._data[flat_key] = merged
        await self._async_save()
        _LOGGER.debug(
            "LCARdS: storage deep-set %r (%d sub-key(s)): %s",
            flat_key, len(data), list(data)
        )

    async def async_entity_delete_key(
        self, namespace: str, entity_id: str, key: str
    ) -> bool:
        """Delete a single sub-key from a namespaced entity object.

        Returns True if the key existed in the entity object, False otherwise.
        The entity object itself is preserved even if it becomes empty.

        Args:
            namespace: e.g. ``_user`` or ``_device``.
            entity_id: User UUID or device UUID.
            key: Sub-key to remove from the entity's dict.
        """
        flat_key = f"{namespace}_{entity_id}"
        entity = self._data.get(flat_key)
        if not isinstance(entity, dict) or key not in entity:
            return False
        del entity[key]
        await self._async_save()
        _LOGGER.debug("LCARdS: storage deleted sub-key %r from %r", key, flat_key)
        return True

    def get_namespaced_entities(self, namespace: str) -> dict[str, Any]:
        """Return a dict of all entity IDs → their data for *namespace*.

        Scans for top-level keys that start with ``f"{namespace}_"`` and
        returns them indexed by the entity ID suffix.

        Args:
            namespace: e.g. ``_user`` or ``_device``.

        Returns:
            Mapping of entity_id → stored data dict.
        """
        prefix = f"{namespace}_"
        return {
            k[len(prefix):]: v
            for k, v in self._data.items()
            if k.startswith(prefix)
        }

    async def async_clear_entity(self, namespace: str, entity_id: str) -> bool:
        """Remove the entire namespaced entity for *entity_id*.

        Equivalent to deleting the flat key ``f"{namespace}_{entity_id}"``
        from the store.  Returns True if the entry existed.

        Args:
            namespace: e.g. ``_user`` or ``_device``.
            entity_id: User UUID or device UUID.
        """
        flat_key = f"{namespace}_{entity_id}"
        removed = await self.async_delete(flat_key)
        if removed:
            _LOGGER.debug("LCARdS: cleared entity %r", flat_key)
        return removed

    async def async_delete(self, key: str) -> bool:
        """Delete *key* from the store. Returns True if the key existed."""
        if key not in self._data:
            return False
        del self._data[key]
        await self._async_save()
        _LOGGER.debug("LCARdS: storage deleted key %r", key)
        return True

    async def async_reset(self) -> None:
        """Wipe the entire data store and persist."""
        count = len(self._data)
        self._data = {}
        await self._async_save()
        _LOGGER.info("LCARdS: storage reset (%d key(s) removed)", count)

    def dump(self) -> dict:
        """Return the full in-memory store contents (synchronous, for debug)."""
        return {"version": STORAGE_VERSION, "data": dict(self._data)}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _deep_merge(base: dict, override: dict) -> dict:
    """Return a new dict that deep-merges *override* into *base*.

    Mapping values at the same key are merged recursively; all other types
    (lists, scalars, None) are replaced by the *override* value.  Neither
    *base* nor *override* is mutated.

    Args:
        base: The existing data (read from storage).
        override: Incoming data to merge on top of *base*.

    Returns:
        New dict containing the merged result.
    """
    result = dict(base)
    for key, value in override.items():
        if isinstance(value, Mapping) and isinstance(result.get(key), Mapping):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result
