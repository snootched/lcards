/**
 * Browser test harness: mounts one LCARdS card from tests/browser/fixtures/<case>.yaml
 * against a fake hass, using the built bundle served at /lcards/lcards.js. The card
 * environment (HA stubs, sample hass, HA-style state updates, mounting) is shared
 * with the docs site: tests/helpers/card-env.js.
 *
 * URL: /harness.html?case=<fixture>[&freeze=1][&width=480][&height=300][&now=<ms>][&seed=<n>][&log=<level>][&connectFirst=1]
 *      [&historyDelay=<entity_id>:<ms>]  (answer that entity's history late)
 *
 * Exposes for Playwright:
 *   window.__ready      true once the card rendered and fonts loaded (or 'error')
 *   window.__errors     console.error / uncaught error messages
 *   window.__card       the mounted card element
 *   window.__hass       the current hass snapshot (hass.serviceCalls records service calls)
 *   window.__events     hass-more-info / show-dialog / location-changed events seen
 *   window.__setState(id, state | {state, attributes})  push a new state to the card
 *   window.__reconfigure(config)  setConfig on the live card with a frozen config
 */
import yaml from '/vendor/js-yaml/dist/js-yaml.mjs';
import { defineHaStubs, createDemoEnv, deepFreeze } from '/helpers/card-env.js';
import { SAMPLE_ENTITIES, samplePoints, sampleStatistics } from '/demo-data.js';

const params = new URLSearchParams(location.search);
const caseName = params.get('case');
window.__ready = false;
window.__errors = [];
window.__events = [];

const origError = console.error.bind(console);
console.error = (...args) => {
    window.__errors.push(args.map(a => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    origError(...args);
};
window.addEventListener('error', (e) => window.__errors.push(`uncaught: ${e.message}`));
window.addEventListener('unhandledrejection', (e) => window.__errors.push(`unhandled: ${e.reason?.message ?? e.reason}`));

if (params.get('freeze')) document.documentElement.classList.add('freeze');
const mountEl = document.getElementById('mount');
if (params.get('width')) mountEl.style.width = `${params.get('width')}px`;
// A definite height, like an HA sections grid cell (cards that size to 100% need it).
if (params.get('height')) mountEl.style.height = `${params.get('height')}px`;

defineHaStubs();

// ?now=<ms> pins the sample data (values follow a daily curve) for visual baselines.
const env = createDemoEnv({
    sample: { SAMPLE_ENTITIES, samplePoints, sampleStatistics },
    now: Number(params.get('now')) || Date.now(),
    historyDelay: Object.fromEntries(params.getAll('historyDelay').map(v => { const [id, ms] = v.split(':'); return [id, Number(ms)]; })),
});
Object.defineProperty(window, '__hass', { get: () => env.hass, configurable: true });

for (const type of ['hass-more-info', 'show-dialog', 'location-changed', 'hass-action']) {
    window.addEventListener(type, (e) => window.__events.push({ type, detail: e.detail }));
    document.addEventListener(type, (e) => window.__events.push({ type, detail: e.detail }));
}

window.__setState = (entityId, value) => { env.setState(entityId, value); };

/** Give the live card a new config, deep-frozen like HA does (editor changes, refreshes). */
window.__reconfigure = (config) => {
    window.__card.setConfig(deepFreeze(structuredClone(config)));
};

async function mount() {
    // Like HA: /lcards/lcards.js?v=<version>&log=<level> (?log=<level> via the harness).
    const scriptQuery = new URLSearchParams({ v: 'test' });
    if (params.get('log')) scriptQuery.set('log', params.get('log'));
    await import(`/lcards/lcards.js?${scriptQuery}`);
    await customElements.whenDefined('lcards-button');
    if (!caseName) { window.__ready = true; return; }

    const res = await fetch(`/fixtures/${caseName}.yaml`);
    if (!res.ok) throw new Error(`fixture ${caseName} not found`);
    const config = yaml.load(await res.text());

    // ?seed=<n>: seeded Math.random from here on, so generated values (decorative
    // grids) depend only on the card, not on how much randomness core startup used.
    if (params.get('seed')) {
        let seed = Number(params.get('seed')) >>> 0;
        Math.random = () => {
            seed = (seed + 0x6d2b79f5) >>> 0;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ?connectFirst=1: attach and give hass before setConfig, the order HA uses when
    // it reconfigures a live card (core services are then ready during setConfig).
    const card = await env.mount(mountEl, config, { connectFirst: !!params.get('connectFirst') });
    window.__card = card;
    if (card.__setConfigError) window.__setConfigError = card.__setConfigError;
    window.__ready = true;
}

mount().catch((error) => {
    window.__errors.push(`harness: ${error.message}`);
    window.__ready = 'error';
});
