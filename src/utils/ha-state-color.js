/**
 * Home Assistant's entity state colours and active/inactive split, ported from
 * the frontend so LCARdS colours states exactly as Home Assistant's own history
 * timeline does:
 *
 * - src/common/entity/state_active.ts      stateActive()
 * - src/common/entity/state_color.ts       STATE_COLORED_DOMAIN, stateColorProperties()
 * - src/common/entity/color/battery_color.ts
 * - src/common/entity/get_states.ts        FIXED_DOMAIN_STATES
 * - src/common/const.ts                    TIMESTAMP_STATE_DOMAINS
 * - src/common/string/slugify.ts           slugify()
 * - src/components/chart/timeline-color.ts computeTimelineColor()
 *
 * tests/support/ha-state-color-parity.test.js compares the lists with the
 * frontend checkout when it is there. Pure: CSS variables are read through a
 * `readVar(name)` callback (getComputedStyle on the card).
 *
 * Not ported: the media player / vacuum shades (paused and returning drawn a
 * little lighter, a CIELAB brighten).
 *
 * @module utils/ha-state-color
 */

/** Domains Home Assistant colours by state (state_color.ts). */
export const STATE_COLORED_DOMAIN = new Set([
  'alarm_control_panel', 'alert', 'automation', 'binary_sensor', 'calendar', 'camera', 'climate',
  'cover', 'device_tracker', 'fan', 'group', 'humidifier', 'input_boolean', 'lawn_mower', 'light',
  'lock', 'media_player', 'person', 'plant', 'remote', 'schedule', 'script', 'siren', 'sun',
  'switch', 'timer', 'update', 'vacuum', 'valve', 'water_heater', 'weather'
]);

/** Domains whose state is a timestamp: active unless unavailable (const.ts). */
export const TIMESTAMP_STATE_DOMAINS = new Set([
  'ai_task', 'button', 'conversation', 'event', 'image', 'infrared', 'input_button', 'notify',
  'radio_frequency', 'scene', 'stt', 'tag', 'tts', 'wake_word', 'datetime'
]);

/** The states each domain can have, in Home Assistant's order (get_states.ts). */
export const FIXED_DOMAIN_STATES = {
  alarm_control_panel: ['armed_away', 'armed_custom_bypass', 'armed_home', 'armed_night', 'armed_vacation', 'arming', 'disarmed', 'disarming', 'pending', 'triggered'],
  alert: ['on', 'off', 'idle'],
  assist_satellite: ['idle', 'listening', 'responding', 'processing'],
  automation: ['on', 'off'],
  binary_sensor: ['on', 'off'],
  calendar: ['on', 'off'],
  camera: ['idle', 'recording', 'streaming'],
  cover: ['closed', 'closing', 'open', 'opening'],
  device_tracker: ['home', 'not_home'],
  fan: ['on', 'off'],
  humidifier: ['on', 'off'],
  input_boolean: ['on', 'off'],
  lawn_mower: ['error', 'paused', 'mowing', 'returning', 'docked', 'idle'],
  light: ['on', 'off'],
  lock: ['jammed', 'locked', 'locking', 'unlocked', 'unlocking', 'opening', 'open'],
  media_player: ['off', 'on', 'idle', 'playing', 'paused', 'standby', 'buffering'],
  person: ['home', 'not_home'],
  plant: ['ok', 'problem'],
  radio_frequency: [],
  remote: ['on', 'off'],
  schedule: ['on', 'off'],
  script: ['on', 'off'],
  siren: ['on', 'off'],
  sun: ['above_horizon', 'below_horizon'],
  switch: ['on', 'off'],
  timer: ['active', 'idle', 'paused'],
  update: ['on', 'off'],
  vacuum: ['cleaning', 'docked', 'error', 'idle', 'paused', 'returning'],
  valve: ['closed', 'closing', 'open', 'opening'],
  weather: ['clear-night', 'cloudy', 'exceptional', 'fog', 'hail', 'lightning-rainy', 'lightning', 'partlycloudy', 'pouring', 'rainy', 'snowy-rainy', 'snowy', 'sunny', 'windy-variant', 'windy']
};

/** Home Assistant's palette size (colors.ts COLORS_COUNT): --color-1 .. --color-54. */
export const COLORS_COUNT = 54;

const SLUG_FROM = 'àáâäæãåāăąабçćčđďдèéêëēėęěеёэфğǵгḧхîïíīįìıİийкłлḿмñńǹňнôöòóœøōõőоṕпŕřрßśšşșсťțтûüùúūǘůűųувẃẍÿýыžźżз·';
const SLUG_TO = 'aaaaaaaaaaabcccdddeeeeeeeeeeefggghhiiiiiiiiijkllmmnnnnnoooooooooopprrrsssssstttuuuuuuuuuuvwxyyyzzzz';
const SLUG_PATTERN = new RegExp(SLUG_FROM.split('').join('|'), 'g');
/** @type {Record<string, string>} */
const COMPLEX_CYRILLIC = { ж: 'zh', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ю: 'iu', я: 'ia' };

/**
 * Home Assistant's slugify (state names in CSS variable names).
 * @param {string} value
 * @param {string} [delimiter='_']
 * @returns {string}
 */
export function slugify(value, delimiter = '_') {
  if (value === '') return '';
  const to = SLUG_TO + delimiter;
  const slug = String(value)
    .toLowerCase()
    .replace(SLUG_PATTERN, (c) => to.charAt(SLUG_FROM.indexOf(c)))
    .replace(/[а-я]/g, (c) => COMPLEX_CYRILLIC[c] || '')
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/[^a-z0-9]+/g, delimiter)
    .replace(new RegExp(`(${delimiter})\\1+`, 'g'), '$1')
    .replace(new RegExp(`^${delimiter}+`), '')
    .replace(new RegExp(`${delimiter}+$`), '');
  return slug === '' ? 'unknown' : slug;
}

/** @param {string} entityId */
const domainOf = (entityId) => String(entityId ?? '').split('.')[0];

/**
 * @typedef {{ entity_id: string, state?: string, attributes?: Record<string, any> }} StateObj
 */

/**
 * Whether a state counts as active, as Home Assistant decides it (state_active.ts).
 * @param {StateObj} stateObj
 * @param {string} [state] - Another state of the same entity (default: its current one)
 * @returns {boolean}
 */
export function stateActive(stateObj, state) {
  const domain = domainOf(stateObj?.entity_id);
  const s = state !== undefined ? state : stateObj?.state;
  if (TIMESTAMP_STATE_DOMAINS.has(domain)) return s !== 'unavailable';
  if (s === 'unavailable' || s === 'unknown') return false;
  if (s === 'off' && domain !== 'alert') return false;
  switch (domain) {
    case 'alarm_control_panel': return s !== 'disarmed';
    case 'alert': return s !== 'idle';
    case 'cover': return s !== 'closed';
    case 'device_tracker':
    case 'person': return s !== 'not_home';
    case 'lawn_mower': return !['docked', 'paused', 'idle'].includes(String(s));
    case 'lock': return s !== 'locked';
    case 'media_player': return s !== 'standby';
    case 'vacuum': return !['idle', 'docked', 'paused'].includes(String(s));
    case 'valve': return s !== 'closed';
    case 'plant': return s === 'problem';
    case 'group': return ['on', 'home', 'open', 'locked', 'problem'].includes(String(s));
    case 'timer': return s === 'active';
    case 'camera': return ['streaming', 'recording'].includes(String(s));
  }
  return true;
}

/**
 * The state's class for state filters and colour maps: unavailable (unknown
 * too, as LCARdS state colours count it), else active or inactive by
 * Home Assistant's stateActive().
 * @param {StateObj|null|undefined} stateObj
 * @param {string} state
 * @returns {'active'|'inactive'|'unavailable'}
 */
export function stateClass(stateObj, state) {
  if (state === 'unavailable' || state === 'unknown') return 'unavailable';
  return stateActive(stateObj ?? { entity_id: '' }, state) ? 'active' : 'inactive';
}

/**
 * @param {string} state
 * @returns {string|undefined}
 */
function batteryStateColorProperty(state) {
  const value = Number(state);
  if (isNaN(value)) return undefined;
  if (value >= 70) return '--state-sensor-battery-high-color';
  if (value >= 30) return '--state-sensor-battery-medium-color';
  return '--state-sensor-battery-low-color';
}

/**
 * @param {string} domain
 * @param {string|undefined} deviceClass
 * @param {string} state
 * @param {boolean} active
 * @returns {string[]}
 */
function domainColorProperties(domain, deviceClass, state, active) {
  const stateKey = slugify(state, '_');
  const activeKey = active ? 'active' : 'inactive';
  const properties = [];
  if (deviceClass) properties.push(`--state-${domain}-${deviceClass}-${stateKey}-color`);
  properties.push(`--state-${domain}-${stateKey}-color`, `--state-${domain}-${activeKey}-color`, `--state-${activeKey}-color`);
  return properties;
}

/**
 * The CSS variables a state's colour comes from, most specific first, or
 * undefined for a domain Home Assistant doesn't colour by state (state_color.ts).
 * @param {StateObj} stateObj
 * @param {string} [state]
 * @returns {string[]|undefined}
 */
export function stateColorProperties(stateObj, state) {
  const s = state !== undefined ? state : String(stateObj?.state);
  const domain = domainOf(stateObj?.entity_id);
  const dc = stateObj?.attributes?.device_class;
  if (domain === 'sensor' && dc === 'battery') {
    const property = batteryStateColorProperty(s);
    if (property) return [property];
  }
  if (domain === 'group') {
    const ids = stateObj?.attributes?.entity_id ?? [];
    const domains = [...new Set(ids.map(domainOf))];
    const groupDomain = domains.length === 1 ? domains[0] : undefined;
    if (groupDomain && STATE_COLORED_DOMAIN.has(groupDomain)) {
      return domainColorProperties(groupDomain, dc, s, stateActive(stateObj, s));
    }
  }
  if (STATE_COLORED_DOMAIN.has(domain)) return domainColorProperties(domain, dc, s, stateActive(stateObj, s));
  return undefined;
}

/**
 * Colours states as Home Assistant's history timeline does
 * (timeline-color.ts computeTimelineColor):
 *
 * 1. unavailable (or no entity): --history-unavailable-color; unknown: --history-unknown-color
 * 2. the theme's state colours (stateColorProperties), person / device_tracker zones only
 *    by their own --state-<domain>-<zone>-color
 * 3. a state of a fixed list (FIXED_DOMAIN_STATES, select and input_select options, enum
 *    sensors): --graph-color-N by its place in the list
 * 4. anything else: the next graph colour, the same for that state from then on
 *
 * Step 4 remembers each state's index (not its colour), so a theme or alert mode change
 * recolours on the next call. One colourer per chart keeps its colours stable.
 *
 * @param {(name: string) => string} readVar - A CSS custom property's value ('' when unset)
 * @returns {(state: string, stateObj?: StateObj|null) => string}
 */
export function createTimelineColorer(readVar) {
  /** @type {Map<string, number>} */
  const generic = new Map();
  const read = (/** @type {string} */ name) => (name.endsWith('-color') ? String(readVar(name) ?? '').trim() : '');
  const first = (/** @type {string[]} */ names) => {
    for (const name of names) {
      const value = read(name);
      if (value) return value;
    }
    return undefined;
  };
  const graphColor = (/** @type {number} */ index) =>
    String(readVar(`--graph-color-${index + 1}`) ?? '').trim()
    || String(readVar(`--color-${(index % COLORS_COUNT) + 1}`) ?? '').trim();

  return (state, stateObj = null) => {
    if (!stateObj || state === 'unavailable') return read('--history-unavailable-color') || 'transparent';
    if (state === 'unknown') return read('--history-unknown-color') || 'transparent';

    const domain = domainOf(stateObj.entity_id);
    /** @type {string|undefined} */
    let color;
    if ((domain === 'person' || domain === 'device_tracker') && !FIXED_DOMAIN_STATES[domain].includes(state)) {
      color = read(`--state-${domain}-${slugify(state, '_')}-color`) || undefined;
    } else {
      const properties = stateColorProperties(stateObj, state);
      if (properties) color = first(properties);
    }
    if (color) return color;

    const attrs = stateObj.attributes ?? {};
    const list = /** @type {Record<string, readonly string[]>} */ (FIXED_DOMAIN_STATES)[domain]
      ?? (((domain === 'sensor' && attrs.device_class === 'enum') || domain === 'select' || domain === 'input_select') ? attrs.options : undefined)
      ?? [];
    const index = list.indexOf(state);
    if (index !== -1) return graphColor(index);

    if (!generic.has(state)) generic.set(state, generic.size);
    return graphColor(/** @type {number} */ (generic.get(state)));
  };
}
