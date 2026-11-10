/**
 * LCARdS loader stub (the Vite entry, served as /lcards/lcards.js).
 *
 * HA loads this file as /lcards/lcards.js?v=<version>&log=<level>. Lazily loaded
 * chunks (card editors, the config panel, ApexCharts) import shared code from the
 * main chunk by its plain URL. If that shared code lived in this entry, those
 * imports would request lcards.js without the query string: a second module URL,
 * so the browser would run a second copy of the whole bundle (a second core).
 * Keeping the entry tiny and loading everything from chunks/lcards-main-*.js
 * avoids that. The only things read here are the integration's ?log= level and
 * the stub's own folder (the bundle base).
 */
let log = null;
// The folder this stub was loaded from: built-in asset URLs (written /lcards/...)
// resolve against it (src/utils/bundle-url.js), so a copy of the bundle served
// elsewhere (the versioned docs site: /dev/lcards/) loads its own assets.
// Inlined, not imported: a module shared with the main chunk would land in this
// entry and be imported back without the query string (see above).
let base = '/lcards/';
try {
    const url = new URL(import.meta.url);
    log = url.searchParams.get('log');
    const dir = url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && dir.startsWith('/')) {
        base = url.origin === location.origin ? dir : url.origin + dir;
    }
} catch (_e) {
    // Unusual module URL: default log level, assets under /lcards/.
}
window.__LCARDS_BOOT__ = { log, base };

import('./lcards-main.js');
