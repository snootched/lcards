/**
 * LCARdS loader stub (the Vite entry, served as /lcards/lcards.js).
 *
 * HA loads this file as /lcards/lcards.js?v=<version>&log=<level>. Lazily loaded
 * chunks (card editors, the config panel, ApexCharts) import shared code from the
 * main chunk by its plain URL. If that shared code lived in this entry, those
 * imports would request lcards.js without the query string: a second module URL,
 * so the browser would run a second copy of the whole bundle (a second core).
 * Keeping the entry tiny and loading everything from chunks/lcards-main-*.js
 * avoids that. The only thing read here is the integration's ?log= level.
 */
let log = null;
try {
    log = new URL(import.meta.url).searchParams.get('log');
} catch (_e) {
    // Unusual module URL: fall back to the default log level.
}
window.__LCARDS_BOOT__ = { log };

import('./lcards-main.js');
