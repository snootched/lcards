/**
 * Home Assistant's Jinja2 templates outside Home Assistant, for the docs Live Demo
 * and the card pages' live examples (no server to answer render_template): nunjucks
 * (Jinja-compatible) with the Home Assistant functions and filters the demos use.
 *
 * Functions: states('id') (and states.domain.object.state), state_attr, is_state,
 * is_state_attr, has_value, now() (hour, minute, ..., strftime, isoformat), iif.
 * Filters: float, int (with a default), round (precision, default), plus nunjucks' own
 * (default, lower, upper, title, replace, ...).
 *
 * Not Home Assistant's whole template language: a template using something missing
 * renders an error note instead of hanging. Browser-safe.
 *
 * @module tests/helpers/ha-jinja
 */
import nunjucks from 'nunjucks';

const UNKNOWN = 'unknown';

/** A number, or the default when it is not one (float(0) in Home Assistant). */
function toNumber(value, fallback, parse) {
    const n = parse(String(value ?? '').trim());
    if (Number.isFinite(n)) return n;
    if (fallback === undefined) throw new Error(`could not convert '${value}' to a number (give a default)`);
    return fallback;
}

/** now() as Home Assistant's datetime: the fields and strftime the demos read. */
function haNow(date = new Date()) {
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const codes = {
        H: () => pad(date.getHours()), M: () => pad(date.getMinutes()), S: () => pad(date.getSeconds()),
        d: () => pad(date.getDate()), m: () => pad(date.getMonth() + 1), Y: () => String(date.getFullYear()),
        y: () => pad(date.getFullYear() % 100), I: () => pad(((date.getHours() + 11) % 12) + 1),
        p: () => (date.getHours() < 12 ? 'AM' : 'PM'), A: () => DAYS[date.getDay()], a: () => DAYS[date.getDay()].slice(0, 3),
        B: () => MONTHS[date.getMonth()], b: () => MONTHS[date.getMonth()].slice(0, 3), '%': () => '%',
    };
    return {
        year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(),
        hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(),
        weekday: () => (date.getDay() + 6) % 7,
        timestamp: () => date.getTime() / 1000,
        isoformat: () => date.toISOString(),
        strftime: (fmt) => String(fmt).replace(/%(.)/g, (m, c) => (codes[c] ? codes[c]() : m)),
        toString: () => date.toISOString(),
    };
}

/**
 * A renderer for Home Assistant templates over a set of states.
 * @param {() => Record<string, { state: string, attributes?: Record<string, any> }>} getStates
 * @returns {(template: string, variables?: Record<string, any>) => string}
 */
export function createHaJinja(getStates) {
    const env = new nunjucks.Environment(null, { autoescape: false, throwOnUndefined: false });
    env.addFilter('float', (v, d) => toNumber(v, d, Number.parseFloat));
    env.addFilter('int', (v, d) => Math.trunc(toNumber(v, d, Number.parseFloat)));
    env.addFilter('round', (v, precision = 0, method = 'common', d) => {
        const n = toNumber(v, d, Number.parseFloat);
        const k = 10 ** Number(precision);
        const fn = method === 'floor' ? Math.floor : method === 'ceil' ? Math.ceil : Math.round;
        return fn(n * k) / k;
    });

    /** states('id'), and states.domain.object (a state object) */
    function statesGlobal() {
        const all = getStates();
        const fn = (id) => all[id]?.state ?? UNKNOWN;
        for (const [id, s] of Object.entries(all)) {
            const [domain, object] = id.split('.');
            fn[domain] ??= {};
            fn[domain][object] = { entity_id: id, ...s, attributes: s.attributes ?? {} };
        }
        return fn;
    }

    return (template, variables = {}) => {
        const all = getStates();
        const ctx = {
            ...variables,
            states: statesGlobal(),
            state_attr: (id, attr) => all[id]?.attributes?.[attr] ?? null,
            is_state: (id, s) => (Array.isArray(s) ? s.includes(all[id]?.state) : all[id]?.state === String(s)),
            is_state_attr: (id, attr, v) => all[id]?.attributes?.[attr] === v,
            has_value: (id) => !!all[id] && !['unknown', 'unavailable'].includes(all[id].state),
            now: () => haNow(),
            iif: (cond, a = true, b = false) => (cond ? a : b),
        };
        return env.renderString(template, ctx);
    };
}
