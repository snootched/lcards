/**
 * @fileoverview LCARdS Core Pack
 *
 * Version anchor and system identity pack.
 * Has no style/component/asset data of its own — it is the
 * root pack that all others build on.  Shows in Pack Explorer
 * as the system version reference.
 *
 * Pack system guide: doc/architecture/pack-system.md
 */

export const CORE_PACK = {
  id:          'core',
  name:        'LCARdS Core',
  version:     __LCARDS_VERSION__,
  description: 'LCARdS system core — version anchor and global defaults'
};
