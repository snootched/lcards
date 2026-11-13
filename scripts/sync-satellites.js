#!/usr/bin/env node
/**
 * sync-satellites.js - snapshot the orbits of popular Earth satellites for the
 * astrometrics card (src/core/astrometrics/satellite-data.json, read by satellites.js).
 *
 * LCARdS never downloads orbital data at runtime: live positions come from Home
 * Assistant integrations the user installed (the core ISS integration, the HACS
 * satellite tracker), and these shipped elements cover the rest. High orbits (GPS,
 * Galileo, geostationary) stay good for months; low ones (ISS, Tiangong, Hubble) keep
 * their orbit plane for weeks but not their place along it.
 *
 * Source: CelesTrak GP data (OMM JSON, https://celestrak.org). Its usage policy allows
 * one download per data set per 2-hour update and asks clients to stop at the first
 * error, so this script makes one request per group and stops on any non-200 response.
 * Run it before a release (`npm run sync:satellites`); `--check` prints the snapshot's
 * age and exits 1 when it is older than 120 days, without downloading.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/core/astrometrics/satellite-data.json');
const API = 'https://celestrak.org/NORAD/elements/gp.php';
const MAX_AGE_DAYS = 120;

/** Built-in names: [name, NORAD id, display name]. Low orbits first. */
const NAMED = [
  ['iss', 25544, 'ISS'],
  ['tiangong', 48274, 'Tiangong'],
  ['hubble', 20580, 'Hubble'],
  ['goes_east', 60133, 'GOES-19 (East)'],
  ['goes_west', 51850, 'GOES-18 (West)'],
  ['meteosat', 54743, 'Meteosat-12'],
  ['meteosat_iodc', 28912, 'Meteosat-9 (Indian Ocean)'],
  ['himawari', 41836, 'Himawari-9'],
  ['geo_kompsat', 43823, 'GEO-KOMPSAT-2A'],
  ['insat', 58990, 'INSAT-3DS'],
  ['fengyun_4a', 41882, 'Fengyun-4A'],
];
/** Groups: name -> CelesTrak group (every member) or the built-in names it lists. */
const GROUPS = {
  gps: { celestrak: 'gps-ops' },
  galileo: { celestrak: 'galileo' },
  geostationary: { names: ['goes_east', 'goes_west', 'meteosat', 'meteosat_iodc', 'himawari', 'geo_kompsat', 'insat', 'fengyun_4a'] },
  stations: { names: ['iss', 'tiangong'] },
};

const args = process.argv.slice(2);

if (args.includes('--check')) {
  if (!existsSync(OUT)) {
    console.error('sync-satellites: no snapshot yet (npm run sync:satellites)');
    process.exit(1);
  }
  const { fetched } = JSON.parse(readFileSync(OUT, 'utf8'));
  const days = Math.floor((Date.now() - Date.parse(fetched)) / 86400000);
  console.log(`sync-satellites: snapshot from ${fetched.slice(0, 10)} (${days} days old)`);
  process.exit(days > MAX_AGE_DAYS ? 1 : 0);
}

/** One CelesTrak query; any non-200 stops the script (the usage policy). */
async function get(query) {
  const res = await fetch(`${API}?${query}&FORMAT=json`, { headers: { 'User-Agent': 'lcards-sync-satellites' } });
  if (res.status !== 200) {
    console.error(`sync-satellites: CelesTrak answered ${res.status} for ${query}; stopping (usage policy: no retries)`);
    process.exit(1);
  }
  return res.json();
}

/**
 * The mean elements satellites.js uses, as one compact row:
 * [NORAD id, epoch (ms), mean motion (rev/day), eccentricity, inclination, node, perigee, mean anomaly] (degrees)
 * @param {any} o - an OMM record
 */
const row = (o) => [o.NORAD_CAT_ID, Date.parse(`${o.EPOCH}Z`), o.MEAN_MOTION, o.ECCENTRICITY, o.INCLINATION, o.RA_OF_ASC_NODE, o.ARG_OF_PERICENTER, o.MEAN_ANOMALY];

/** @type {Record<string, any>} by NORAD id */
const byId = {};
for (const [, id] of NAMED) {
  const [o] = await get(`CATNR=${id}`);
  if (!o) {
    console.error(`sync-satellites: no data for NORAD ${id}; stopping`);
    process.exit(1);
  }
  byId[id] = o;
}
/** @type {Record<string, number[]>} */
const groups = {};
for (const [g, def] of Object.entries(GROUPS)) {
  if (def.celestrak) {
    const list = await get(`GROUP=${def.celestrak}`);
    for (const o of list) byId[o.NORAD_CAT_ID] = o;
    groups[g] = list.map((/** @type {any} */ o) => o.NORAD_CAT_ID).sort((a, b) => a - b);
  } else {
    groups[g] = def.names.map((n) => /** @type {number} */ (NAMED.find(([name]) => name === n)?.[1]));
  }
}

const ids = Object.keys(byId).map(Number).sort((a, b) => a - b);
const data = {
  source: 'CelesTrak GP data (https://celestrak.org), mean elements; regenerate with npm run sync:satellites',
  fetched: new Date().toISOString(),
  fields: ['norad', 'epoch_ms', 'mean_motion', 'eccentricity', 'inclination', 'node', 'perigee', 'mean_anomaly'],
  names: Object.fromEntries(NAMED.map(([name, id, label]) => [name, { id, label }])),
  groups,
  satellites: Object.fromEntries(ids.map((id) => [id, { name: byId[id].OBJECT_NAME.trim(), elements: row(byId[id]) }])),
};
// one satellite per line: small diffs when a release refreshes it
const text = JSON.stringify(data, null, 2).replace(/\[\n\s+([^[\]{}]*?)\n\s+\]/g, (_, inner) => `[${inner.replace(/\n\s+/g, ' ')}]`);
writeFileSync(OUT, `${text}\n`);
console.log(`sync-satellites: ${ids.length} satellites in ${Object.keys(groups).length} groups -> ${OUT.slice(ROOT.length + 1)}`);
