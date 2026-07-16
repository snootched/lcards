"""Media Source platform for LCARdS.

Exposes the bundled ``images/``, ``sounds/``, and ``msd/`` (builtin ship
blueprint SVGs) directories — already served read-only via the ``/{DOMAIN}``
static path registered in frontend.py — as a browsable "LCARdS" folder in
Home Assistant's native media browser (sidebar panel, any media-picker
dialog, every ``ha-selector`` of type ``media``).

This is auto-discovered by HA's own ``media_source`` integration via its
generic "integration platform" scan (see
``homeassistant/components/media_source/__init__.py`` ->
``async_process_integration_platforms``) the moment this module exists —
no manifest.json changes or explicit registration call are required.

Read-only by design: these are files shipped with the integration, not user
uploads, so there is no upload/delete machinery here (contrast with HA core's
``local_source.py``, which manages a writable directory).
"""
from __future__ import annotations

import logging
import mimetypes
from pathlib import Path

from homeassistant.components.media_player import BrowseError, MediaClass
from homeassistant.components.media_source import (
    BrowseMediaSource,
    MediaSource,
    MediaSourceItem,
    PlayMedia,
    Unresolvable,
)
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

# Top-level browsable directories — all already served by the existing
# /{DOMAIN} static path registered in frontend.py.
_ROOT_DIRS = ("images", "sounds", "msd")
_ROOT_TITLES = {"images": "Images", "sounds": "Sounds", "msd": "Ship Blueprints"}
_ROOT_MEDIA_CLASS = {"images": MediaClass.IMAGE, "sounds": MediaClass.MUSIC, "msd": MediaClass.IMAGE}


async def async_get_media_source(hass: HomeAssistant) -> LCARdSMediaSource:
    """Set up the LCARdS media source."""
    _LOGGER.debug("LCARdS: media source registered — bundled images/sounds browsable via HA media")
    return LCARdSMediaSource(hass)


class LCARdSMediaSource(MediaSource):
    """Expose LCARdS's bundled images/sounds as a browsable HA media source."""

    name = "LCARdS"

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the LCARdS media source."""
        super().__init__(DOMAIN)
        self.hass = hass
        self._base_dir = Path(hass.config.path(f"custom_components/{DOMAIN}")).resolve()

    async def async_resolve_media(self, item: MediaSourceItem) -> PlayMedia:
        """Resolve an identifier to a playable/displayable URL."""
        path = await self.hass.async_add_executor_job(self._validate_file, item.identifier)
        mime_type, _ = mimetypes.guess_type(str(path))
        if not mime_type:
            raise Unresolvable(f"Could not determine MIME type for {item.identifier}")
        return PlayMedia(url=f"/{DOMAIN}/{item.identifier}", mime_type=mime_type)

    async def async_browse_media(self, item: MediaSourceItem) -> BrowseMediaSource:
        """Browse the LCARdS bundled asset tree."""
        return await self.hass.async_add_executor_job(self._browse, item.identifier)

    # -- browsing (runs in executor thread — filesystem I/O) -----------------

    def _browse(self, identifier: str | None) -> BrowseMediaSource:
        """Browse a single identifier, dispatching root vs. subdirectory."""
        if not identifier:
            return self._browse_root()

        root = identifier.split("/", 1)[0]
        if root not in _ROOT_DIRS:
            raise BrowseError(f"Unknown LCARdS media root: {root}")

        full_dir = self._base_dir / identifier
        if not full_dir.is_dir():
            raise BrowseError(f"LCARdS media path not found: {identifier}")

        return self._build_directory_node(identifier, full_dir, root)

    def _browse_root(self) -> BrowseMediaSource:
        """Build the "LCARdS" root node — Images / Sounds categories."""
        base = BrowseMediaSource(
            domain=self.domain,
            identifier=None,
            media_class=MediaClass.DIRECTORY,
            media_content_type="",
            title=self.name,
            can_play=False,
            can_expand=True,
            children_media_class=MediaClass.DIRECTORY,
        )
        base.children = [
            self._build_directory_node(root, self._base_dir / root, root)
            for root in _ROOT_DIRS
            if (self._base_dir / root).is_dir()
        ]
        return base

    def _build_directory_node(self, identifier: str, full_dir: Path, root: str) -> BrowseMediaSource:
        """Build a directory node with one level of (file or subfolder) children."""
        children_class = _ROOT_MEDIA_CLASS.get(root, MediaClass.DIRECTORY)
        title = _ROOT_TITLES.get(identifier, full_dir.name.replace("_", " ").title())

        # media_content_type="" (not None) — the frontend's accept-filter calls
        # .toLowerCase() on every child's media_content_type before its own null
        # check, so a None here crashes ha-media-player-browse.ts when browsing
        # with an `accept` filter set (as LCARdS's own media pickers do).
        node = BrowseMediaSource(
            domain=self.domain,
            identifier=identifier,
            media_class=MediaClass.DIRECTORY,
            media_content_type="",
            title=title,
            can_play=False,
            can_expand=True,
            children_media_class=children_class,
        )

        children: list[BrowseMediaSource] = []
        for child in sorted(full_dir.iterdir(), key=lambda p: p.name.lower()):
            if child.name.startswith("."):
                continue
            child_identifier = f"{identifier}/{child.name}"

            if child.is_dir():
                children.append(self._build_directory_node(child_identifier, child, root))
                continue

            mime_type, _ = mimetypes.guess_type(child.name)
            if not mime_type or mime_type.split("/", 1)[0] not in ("image", "audio"):
                continue

            children.append(
                BrowseMediaSource(
                    domain=self.domain,
                    identifier=child_identifier,
                    media_class=children_class,
                    media_content_type=mime_type,
                    title=child.stem.replace("_", " ").title(),
                    can_play=mime_type.startswith("audio/"),
                    can_expand=False,
                    thumbnail=f"/{DOMAIN}/{child_identifier}" if mime_type.startswith("image/") else None,
                )
            )

        node.children = children
        return node

    def _validate_file(self, identifier: str) -> Path:
        """Resolve *identifier* to a real file path, guarding against traversal."""
        if not identifier:
            raise Unresolvable("Empty identifier")
        if identifier.split("/", 1)[0] not in _ROOT_DIRS:
            raise Unresolvable(f"Unknown LCARdS media root: {identifier}")

        full_path = (self._base_dir / identifier).resolve()
        try:
            full_path.relative_to(self._base_dir)
        except ValueError as err:
            raise Unresolvable("Invalid path") from err

        if not full_path.is_file():
            raise Unresolvable(f"File not found: {identifier}")

        return full_path
