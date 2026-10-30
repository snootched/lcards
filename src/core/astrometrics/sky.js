/**
 * Sun and moon in the local sky, from the time and the Home Assistant
 * location (`hass.config.latitude/longitude`). Pure maths, no three.js.
 *
 * Home Assistant gives the sun (`sun.sun` `azimuth` / `elevation`, with
 * refraction) but only the moon's phase, so the moon is computed here: the
 * main lunar series, topocentric parallax, and precession back to the J2000
 * frame the sidereal time uses. Against PyEphem (2020 to 2032, random places):
 * sun 0.15 degrees median, moon 0.19 median and 0.30 max (the moon is 0.5
 * wide), illumination within 0.002. No refraction in the computed values.
 *
 * Azimuth: degrees clockwise from north. Altitude: degrees above the horizon.
 *
 * @module core/astrometrics/sky
 */

const RAD = Math.PI / 180;
const J2000 = 2451545;
const OBLIQ = 23.4397 * RAD;

/** @param {Date | number} date */
const days = (date) => date.valueOf() / 86400000 + 2440587.5 - J2000;
/** @param {number} l @param {number} b */
const raOf = (l, b) => Math.atan2(Math.sin(l) * Math.cos(OBLIQ) - Math.tan(b) * Math.sin(OBLIQ), Math.cos(l));
/** @param {number} l @param {number} b */
const decOf = (l, b) => Math.asin(Math.sin(b) * Math.cos(OBLIQ) + Math.cos(b) * Math.sin(OBLIQ) * Math.sin(l));
/** @param {number} d @param {number} lw */
const sidereal = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;

/**
 * @param {number} ra
 * @param {number} dec
 * @param {number} d
 * @param {number} lat
 * @param {number} lon
 */
function horizontal(ra, dec, d, lat, lon) {
  const H = sidereal(d, -lon * RAD) - ra;
  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { azimuth: ((az / RAD + 180) % 360 + 360) % 360, altitude: alt / RAD };
}

/** @param {number} d */
function sunEcliptic(d) {
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + RAD * 102.9372 + Math.PI;
}

/**
 * @typedef {{ azimuth: number, altitude: number }} SkyPosition
 * @typedef {SkyPosition & { distance: number, fraction: number, waxing: boolean }} MoonPosition
 */

/**
 * @param {Date | number} date
 * @param {number} lat
 * @param {number} lon
 * @returns {SkyPosition}
 */
export function sunPosition(date, lat, lon) {
  const d = days(date);
  const l = sunEcliptic(d);
  return horizontal(raOf(l, 0), decOf(l, 0), d, lat, lon);
}

/**
 * Geocentric moon: ecliptic longitude and latitude (main terms, radians,
 * J2000 equinox), distance km. Also the Moon of the ephemeris (ephemeris.js).
 * @param {number} d - days from J2000
 */
export function moonEcliptic(d) {
  const T = d / 36525;
  const Lp = RAD * (218.3164477 + 481267.88123421 * T);
  const D = RAD * (297.8501921 + 445267.1114034 * T);
  const M = RAD * (357.5291092 + 35999.0502909 * T);
  const Mp = RAD * (134.9633964 + 477198.8675055 * T);
  const F = RAD * (93.272095 + 483202.0175233 * T);
  const l = Lp + RAD * (6.288774 * Math.sin(Mp) + 1.274027 * Math.sin(2 * D - Mp) + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * Mp) - 0.185116 * Math.sin(M) - 0.114332 * Math.sin(2 * F)
    + 0.058793 * Math.sin(2 * D - 2 * Mp) + 0.057066 * Math.sin(2 * D - M - Mp) + 0.053322 * Math.sin(2 * D + Mp)
    + 0.045758 * Math.sin(2 * D - M) - 0.040923 * Math.sin(M - Mp) - 0.03472 * Math.sin(D) - 0.030383 * Math.sin(M + Mp));
  const b = RAD * (5.128122 * Math.sin(F) + 0.280602 * Math.sin(Mp + F) + 0.277693 * Math.sin(Mp - F)
    + 0.173237 * Math.sin(2 * D - F) + 0.055413 * Math.sin(2 * D - Mp + F) + 0.046271 * Math.sin(2 * D - Mp - F));
  const dist = 385000.56 - 20905.355 * Math.cos(Mp) - 3699.111 * Math.cos(2 * D - Mp) - 2955.968 * Math.cos(2 * D) - 569.925 * Math.cos(2 * Mp);
  // Of-date longitude back to the J2000 frame the sidereal time uses
  return { l: l - RAD * 1.396971 * T, b, dist };
}

/**
 * @param {Date | number} date
 * @param {number} lat
 * @param {number} lon
 * @returns {MoonPosition}
 */
export function moonPosition(date, lat, lon) {
  const d = days(date);
  const m = moonEcliptic(d);
  const ra = raOf(m.l, m.b);
  const dec = decOf(m.l, m.b);
  const h = horizontal(ra, dec, d, lat, lon);
  // Topocentric parallax (the moon is close: up to about 1 degree)
  const altitude = h.altitude - (Math.asin(6378.14 / m.dist) / RAD) * Math.cos(h.altitude * RAD);
  // Illumination from the sun-moon elongation
  const sl = sunEcliptic(d);
  const sra = raOf(sl, 0);
  const sdec = decOf(sl, 0);
  const phi = Math.acos(Math.sin(sdec) * Math.sin(dec) + Math.cos(sdec) * Math.cos(dec) * Math.cos(sra - ra));
  const inc = Math.atan2(149598000 * Math.sin(phi), m.dist - 149598000 * Math.cos(phi));
  const fraction = (1 + Math.cos(inc)) / 2;
  // Waxing while the moon is east of the sun
  const waxing = Math.sin(ra - sra) > 0;
  return { azimuth: h.azimuth, altitude, distance: m.dist, fraction, waxing };
}

/**
 * The sun from `sun.sun` when the entity has numeric `azimuth` and
 * `elevation` (it includes refraction and updates every few minutes).
 * @param {any} hass
 * @returns {SkyPosition | null}
 */
export function sunFromHass(hass) {
  const a = hass?.states?.['sun.sun']?.attributes;
  const azimuth = Number(a?.azimuth);
  const altitude = Number(a?.elevation);
  if (a?.azimuth === undefined || a?.elevation === undefined || !Number.isFinite(azimuth) || !Number.isFinite(altitude)) return null;
  return { azimuth, altitude };
}

/**
 * @typedef {Object} SkyState
 * @property {SkyPosition & { source: 'entity' | 'computed' }} sun
 * @property {MoonPosition & { illumination: number }} moon - illumination in whole percent
 * @property {{ latitude: number, longitude: number }} location
 * @property {number} time - ms
 */

/**
 * Sun and moon now, for the Home Assistant location (0, 0 without one).
 * @param {any} hass
 * @param {Date | number} [date]
 * @param {{ entity?: boolean }} [opts] - entity: false computes the sun even when sun.sun has it (a date other than now)
 * @returns {SkyState}
 */
export function skyState(hass, date = Date.now(), { entity = true } = {}) {
  const latitude = Number(hass?.config?.latitude) || 0;
  const longitude = Number(hass?.config?.longitude) || 0;
  const fromEntity = entity ? sunFromHass(hass) : null;
  const sun = fromEntity
    ? { ...fromEntity, source: /** @type {const} */ ('entity') }
    : { ...sunPosition(date, latitude, longitude), source: /** @type {const} */ ('computed') };
  const moon = moonPosition(date, latitude, longitude);
  return { sun, moon: { ...moon, illumination: Math.round(moon.fraction * 100) }, location: { latitude, longitude }, time: date.valueOf() };
}

/**
 * A body's path across the local day (midnight to midnight in the browser's
 * time zone), sampled every `stepMin` minutes.
 * @param {'sun' | 'moon'} body
 * @param {number} lat
 * @param {number} lon
 * @param {Date | number} [date] - any time on the day
 * @param {number} [stepMin]
 * @returns {SkyPosition[]}
 */
export function dayPath(body, lat, lon, date = Date.now(), stepMin = 5) {
  const day = new Date(date.valueOf());
  day.setHours(0, 0, 0, 0);
  const fn = body === 'moon' ? moonPosition : sunPosition;
  /** @type {SkyPosition[]} */
  const out = [];
  for (let m = 0; m <= 1440; m += stepMin) {
    const p = fn(day.valueOf() + m * 60000, lat, lon);
    out.push({ azimuth: p.azimuth, altitude: p.altitude });
  }
  return out;
}
