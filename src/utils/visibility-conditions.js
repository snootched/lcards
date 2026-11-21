/**
 * @fileoverview Home Assistant's card `visibility:` conditions, checked outside
 * Home Assistant's frontend. In Home Assistant, hui-card checks them; where there is
 * no hui-card (the docs Live Demo and live examples, the browser test harness) the
 * layout card's fallback children and the docs view mount use this.
 */

/** @param {any} v */
const asList = (v) => (Array.isArray(v) ? v : [v]).map(String);

/**
 * Whether a card's `visibility:` conditions pass, as Home Assistant checks them (all
 * must pass): state (state, state_not), numeric_state (above, below), screen
 * (media_query), and, or. Other kinds (user) count as passing.
 * @param {any[] | undefined} conditions
 * @param {any} hass
 * @returns {boolean}
 */
export function visibilityPasses(conditions, hass) {
    /** @param {any} c @returns {boolean} */
    const one = (c) => {
        const kind = c?.condition ?? (c?.entity ? 'state' : '');
        const st = c?.entity ? hass?.states?.[c.entity]?.state : undefined;
        switch (kind) {
            case 'state':
                if (c.state !== undefined && !asList(c.state).includes(String(st))) return false;
                if (c.state_not !== undefined && asList(c.state_not).includes(String(st))) return false;
                return true;
            case 'numeric_state': {
                const n = Number(st);
                if (st === undefined || !Number.isFinite(n)) return false;
                if (c.above !== undefined && !(n > Number(c.above))) return false;
                if (c.below !== undefined && !(n < Number(c.below))) return false;
                return true;
            }
            case 'screen':
                return !c.media_query || globalThis.matchMedia?.(c.media_query)?.matches !== false;
            case 'and':
                return (c.conditions ?? []).every(one);
            case 'or':
                return (c.conditions ?? []).some(one);
            default:
                return true;
        }
    };
    return (conditions ?? []).every(one);
}
