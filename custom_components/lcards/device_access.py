"""Who may read a device record (``_device_<id>`` in LCARdS storage), and who owns it.

Pure functions with no Home Assistant imports, so the rules are unit-tested
from node (tests/support/device-access.test.js runs this file in python3).

The owner is the user currently signed in on that browser. A device id is a
random UUID that lives in the browser's localStorage, so writing a record
from that browser and knowing its id are the same thing:

- ``storage/device/set`` (the heartbeat on every page load, and device-scoped
  settings) is open to every signed-in user. A non-admin's write makes them
  the owner (``owner_user_id``). An admin's write claims a record with no
  (living) owner but leaves an existing owner alone, so an admin editing a
  kiosk's settings from the config panel does not take the kiosk over.
- ``storage/device/get`` and ``storage/get`` of a ``_device_*`` key are for
  admins and the current owner. A record without an owner (new, written
  before owners existed, or whose owner user was deleted) reads for anyone.
- ``owner_user_id`` in ``device/set`` data is ignored; an admin sets an owner
  with ``storage/devices/set``.
"""
from __future__ import annotations

from typing import Any

OWNER_KEY = "owner_user_id"


def record_owner(record: Any) -> str | None:
    """The owner user id stored in a device record, or None."""
    if isinstance(record, dict):
        owner = record.get(OWNER_KEY)
        if isinstance(owner, str) and owner:
            return owner
    return None


def device_read_allowed(record: Any, user_id: str, is_admin: bool, owner_exists: bool = True) -> bool:
    """True when the caller may read *record*.

    *owner_exists* is False when the stored owner is no longer a Home
    Assistant user (the record is then unowned).
    """
    if is_admin:
        return True
    owner = record_owner(record)
    if owner is None or not owner_exists:
        return True
    return owner == user_id


def device_write_data(record: Any, data: dict, user_id: str, is_admin: bool, owner_exists: bool = True) -> dict:
    """The data a ``storage/device/set`` call actually writes.

    Drops a caller-supplied ``owner_user_id`` and sets the owner: always the
    caller for a non-admin (the current user of that browser), and for an
    admin only when the record has no (living) owner yet.
    """
    out = {k: v for k, v in data.items() if k != OWNER_KEY}
    unowned = record_owner(record) is None or not owner_exists
    if not is_admin or unowned:
        out[OWNER_KEY] = user_id
    return out
