/**
 * Home Assistant locale helpers: the time zone and first weekday a user's
 * profile asks for, resolved the way Home Assistant's own frontend does
 * (`src/common/datetime/resolve-time-zone.ts` and `first_weekday.ts`).
 *
 * - `hass.locale.time_zone`: `server` uses the Home Assistant zone
 *   (`hass.config.time_zone`), `local` the browser's.
 * - `hass.locale.first_weekday`: `language` derives the day from
 *   `hass.locale.language`; `monday`..`sunday` are explicit.
 * - `hass.locale.time_format`: 12 or 24 hour clock (`use_am_pm.ts`).
 *
 * Pure; no imports. Without hass the result is the browser's zone and Monday.
 *
 * @module utils/ha-locale
 */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Regions whose week starts on Sunday, Saturday or Friday (CLDR weekData), for
 * browsers without `Intl.Locale` week info. Everything else starts on Monday.
 */
const SUNDAY_REGIONS = new Set(('AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH '
  + 'KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW').split(' '));
const SATURDAY_REGIONS = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));
const FRIDAY_REGIONS = new Set(['MV']);

/** @type {Map<string, boolean>} */
const validZones = new Map();

/**
 * True when the runtime knows the IANA zone name.
 * @param {string} zone
 * @returns {boolean}
 */
function isValidTimeZone(zone) {
  let valid = validZones.get(zone);
  if (valid === undefined) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone });
      valid = true;
    } catch {
      valid = false;
    }
    validZones.set(zone, valid);
  }
  return valid;
}

/**
 * The IANA time zone calendar windows should use, or undefined for the
 * browser's own zone (profile set to `local`, no hass, or an unknown zone).
 * @param {any} hass
 * @returns {string|undefined}
 */
export function resolveTimeZone(hass) {
  if (hass?.locale?.time_zone !== 'server') return undefined;
  const zone = hass?.config?.time_zone;
  return typeof zone === 'string' && zone && isValidTimeZone(zone) ? zone : undefined;
}

/**
 * First day of the week a language uses (0 = Sunday .. 6 = Saturday).
 * @param {string|undefined} language - BCP 47 tag, e.g. `en`, `en-GB`, `de`
 * @returns {number}
 */
export function languageWeekStart(language) {
  if (!language) return 1;
  try {
    const locale = /** @type {any} */ (new Intl.Locale(language));
    const info = typeof locale.getWeekInfo === 'function' ? locale.getWeekInfo() : locale.weekInfo;
    if (info && Number.isFinite(info.firstDay)) return info.firstDay % 7;
    const region = locale.maximize?.().region;
    if (region && SUNDAY_REGIONS.has(region)) return 0;
    if (region && SATURDAY_REGIONS.has(region)) return 6;
    if (region && FRIDAY_REGIONS.has(region)) return 5;
  } catch {
    // Unknown tag: fall through to Monday.
  }
  return 1;
}

/**
 * First day of the week from the user's profile (0 = Sunday .. 6 = Saturday);
 * Monday when unset or unknown, as Home Assistant does.
 * @param {any} hass
 * @returns {number}
 */
export function firstWeekdayIndex(hass) {
  const option = hass?.locale?.first_weekday;
  if (option === 'language') return languageWeekStart(hass?.locale?.language);
  const index = WEEKDAYS.indexOf(option);
  return index === -1 ? 1 : index;
}

/**
 * True when times show on a 12 hour clock (`hass.locale.time_format`): `12`
 * yes, `24` no, `language` / `system` as the language (or the browser) writes
 * 22:00, as Home Assistant's `use_am_pm.ts` does. False without hass.
 * @param {any} hass
 * @returns {boolean}
 */
export function useAmPm(hass) {
  const option = hass?.locale?.time_format;
  if (option === '12') return true;
  if (option !== 'language' && option !== 'system') return false;
  const language = option === 'language' ? hass?.locale?.language : undefined;
  try {
    return new Date(2023, 0, 1, 22).toLocaleString(language).includes('10');
  } catch {
    return false;
  }
}

/**
 * The browser's own IANA zone, or undefined when the runtime cannot tell.
 * @returns {string|undefined}
 */
export function browserTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isValidTimeZone(zone) ? zone : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The calendar a time window aligns to: zone (undefined = browser) and week start.
 * @param {any} hass
 * @returns {{timeZone: string|undefined, weekStart: number}}
 */
export function localeCalendar(hass) {
  return { timeZone: resolveTimeZone(hass), weekStart: firstWeekdayIndex(hass) };
}
