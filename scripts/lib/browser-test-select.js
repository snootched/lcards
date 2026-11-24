/**
 * Which browser tests (tests/browser, Playwright "component" project) a set of
 * changed files needs. Used by scripts/test-browser-changed.mjs
 * (npm run test:browser:changed); guarded by tests/core/browser-test-select.test.js.
 *
 * The browser tests load the built bundle, not src/ modules, so Playwright's own
 * --only-changed (import tracing) cannot see a src change. This map stands in for it:
 *
 * - Shared code (src/base, src/core, src/utils, the button, the editor base, the
 *   build config, the test harness) and any src file the map does not know run the
 *   full suite. That is the safe default; CI runs the full suite on every push and
 *   pull request anyway.
 * - A card's own files run its area: the spec files matching AREAS[area].specs and
 *   the cards.spec.js, editor-roundtrip.spec.js and studio-roundtrip.spec.js tests whose
 *   title matches AREAS[area].cards (each titled by its fixture).
 * - Files the bundle never sees (docs, Python, reports, build scripts) run nothing
 *   beyond ALWAYS.
 */

/**
 * @typedef {{ specs: RegExp, cards?: string }} Area
 * specs: spec file names in the area; cards: alternation (regex source) matched
 * against the start of a cards.spec.js test title (fixture tests are titled
 * "<fixture name>: renders without errors").
 */

/** @type {Record<string, Area>} */
export const AREAS = {
    alert:      { specs: /^alert-/ },
    animation:  { specs: /^(animation-|march-keyframes|on-show|reduced-motion|stagger-flash)/ },
    astro:      { specs: /^astro/, cards: 'astro' },
    background: { specs: /^(background-|borg-|screen-effects|texture-offscreen)/ },
    chart:      { specs: /^(chart-|processor-lab|card-sizing)/, cards: 'chart|invalid config' },
    connection: { specs: /^connection-/ },
    'data-grid': { specs: /^data-grid/, cards: 'data[- ]grid' },
    elbow:      { specs: /^(elbow-|short-rows)/, cards: 'elbow' },
    layout:     { specs: /^(layout-|short-rows|card-sizing)/, cards: 'layout' },
    msd:        { specs: /^(msd-|asset-source-picker|texture-offscreen)/, cards: 'msd' },
    select:     { specs: /^(select-menu|short-rows)/, cards: 'select[- ]menu' },
    slider:     { specs: /^(slider-|light-colour|card-sizing)/, cards: 'slider' },
    text:       { specs: /^text-/, cards: 'text-' },
    yaml:       { specs: /^yaml-editor/ },
};

/**
 * Spec files that only run with the full suite: they test shared behaviour
 * (startup, the core, presets, colours, the button base) that a change to one
 * card's files does not reach.
 */
export const FULL_ONLY = [
    'bundle-base', 'button-fixes', 'colours', 'editor-roundtrip', 'studio-roundtrip', 'core-audit', 'fire-dom-event',
    'ha-labels-editor', 'jinja-live', 'picker-pictures', 'listener-leaks', 'new-presets', 'presets-theme', 'provenance', 'render-count',
].map((n) => `${n}.spec.js`);

/**
 * cards.spec.js titles that only run with the full suite (the button, its components
 * and rules, the bundle fixtures), as a regex source matched at the start of a title.
 */
export const CARDS_FULL_ONLY = 'button|a component|rules?[:-]|bundle-';

/** Run whenever anything in the bundle changed: the main-chunk size budget and lazy chunks. */
export const ALWAYS = ['bundle.spec.js', 'startup-noise.spec.js'];

/** Not in the component project (screenshot baselines, npm run test:visual). */
export const NOT_COMPONENT = ['visual.spec.js'];

/** Keywords in a src file name, in match order, and their area. */
const NAME_AREAS = [
    ['alert', 'alert'], ['astro', 'astro'], ['chart', 'chart'], ['data-grid', 'data-grid'],
    ['elbow', 'elbow'], ['layout', 'layout'], ['msd', 'msd'], ['select-menu', 'select'],
    ['slider', 'slider'], ['text-field', 'text'], ['yaml', 'yaml'],
];

/** @param {string} name @returns {string | null} */
export const areaFromName = (name) => NAME_AREAS.find(([k]) => name.includes(k))?.[1] ?? null;

/**
 * Path rules, first match wins. Each returns 'all', a list of areas, or null
 * (nothing beyond ALWAYS; inBundle says whether ALWAYS applies).
 * @type {Array<[RegExp, (m: RegExpMatchArray) => 'all' | string[] | null, boolean?]>}
 */
export const PATH_RULES = [
    // the build and the harness
    [/^(package(-lock)?\.json|vite\.config\.js|playwright\.config\.js|tsconfig\.json)$/, () => 'all'],
    [/^tests\/browser\/(support\.js|serve\.mjs|www\/)/, () => 'all'],
    [/^tests\/helpers\/(card-env|fake-hass)\.js$/, () => 'all'],
    // a card's own files
    [/^src\/cards\/lcards-button\.js$/, () => 'all'],
    [/^src\/cards\/schemas\/([a-z-]+)-schema\.js$/, (m) => one(m[1])],
    [/^src\/cards\/lcards-([a-z-]+)\.js$/, (m) => one(m[1])],
    // a card's helper modules (slider-ring-geometry.js); button-config.js names no area: full suite
    [/^src\/cards\/([a-z-]+)\.js$/, (m) => one(m[1])],
    [/^src\/charts\//, () => ['chart']],
    [/^src\/data-grid\//, () => ['data-grid']],
    [/^src\/msd\//, () => ['msd']],
    [/^src\/assets\/msd\//, () => ['msd']],
    [/^src\/(views|strategies)\//, () => ['layout']],
    [/^src\/core\/astrometrics\//, () => ['astro']],
    [/^src\/assets\/models\//, () => ['astro']],
    [/^src\/core\/(borg|screen-effects)\//, () => ['background', 'connection']],
    [/^src\/core\/services\/(ConnectionOverlayService|connection-overlay-[a-z-]+)\.js$/, () => ['connection']],
    [/^src\/editor\/cards\/([a-z-]+)\.js$/, (m) => one(m[1])],
    [/^src\/editor\/dialogs\/(alert-studio)\//, () => ['alert']],
    [/^src\/editor\/dialogs\/([a-z-]+)\.js$/, (m) => one(m[1])],
    [/^src\/editor\/components\/(?:[a-z-]+\/)*([a-z0-9-]+)\.js$/, (m) => one(m[1])],
    // bundled but untested in the browser layer: only the size budget
    [/^src\/(panels|types)\//, () => [], true],
    [/^src\/assets\/sounds\//, () => [], true],
    // everything else in src (base, core, utils, editor base, main): the full suite
    [/^src\//, () => 'all'],
];

/** One area from a file name, or the full suite when the name names none. */
function one(/** @type {string} */ name) {
    const area = areaFromName(name);
    return area ? [area] : 'all';
}

/**
 * The tests a set of changed files needs.
 * @param {string[]} changed - repo-relative paths
 * @param {string[]} specFiles - every component spec file name (tests/browser/*.spec.js)
 * @param {(fixture: string) => string[]} [specsUsingFixture] - spec files that mount a fixture
 * @returns {{ all: boolean, specs: string[], cards: string[], fixtures: string[], reasons: string[] }}
 */
export function selectBrowserTests(changed, specFiles, specsUsingFixture = () => []) {
    const specs = new Set();
    const cards = new Set();
    const fixtures = new Set();
    const reasons = [];
    let inBundle = false;
    const addArea = (/** @type {string} */ area) => {
        const a = AREAS[area];
        for (const f of specFiles) if (a.specs.test(f)) specs.add(f);
        if (a.cards) cards.add(a.cards);
    };
    for (const path of changed) {
        let m;
        if ((m = path.match(/^tests\/browser\/([a-z0-9-]+\.spec\.js)$/))) {
            if (!NOT_COMPONENT.includes(m[1])) specs.add(m[1]);
            reasons.push(`${path}: itself`);
            continue;
        }
        if ((m = path.match(/^tests\/browser\/fixtures\/([a-z0-9-]+)\.yaml$/))) {
            fixtures.add(m[1]);
            // cards.spec.js names every fixture; its test for this one comes from `fixtures`
            for (const s of specsUsingFixture(m[1])) if (s !== 'cards.spec.js') specs.add(s);
            reasons.push(`${path}: the fixture and the specs that mount it`);
            continue;
        }
        const rule = PATH_RULES.find(([re]) => re.test(path));
        if (!rule) continue; // docs, Python, reports, scripts: the bundle never sees them
        const result = rule[1](/** @type {RegExpMatchArray} */ (path.match(rule[0])));
        inBundle = inBundle || path.startsWith('src/');
        if (result === 'all') {
            return { all: true, specs: [], cards: [], fixtures: [], reasons: [`${path}: shared code, full suite`] };
        }
        for (const area of result ?? []) addArea(area);
        reasons.push(`${path}: ${result?.length ? result.join(', ') : 'bundle only'}`);
    }
    if (inBundle) for (const f of ALWAYS) if (specFiles.includes(f)) specs.add(f);
    return { all: false, specs: [...specs].sort(), cards: [...cards].sort(), fixtures: [...fixtures].sort(), reasons };
}

/** @param {string} s */
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The --grep for a selection (null when it is empty). Playwright matches it against
 * "<project> <file> <title>", e.g. "component cards.spec.js slider-shaped: renders ...".
 * @param {{ specs: string[], cards: string[], fixtures: string[] }} sel
 */
export function grepFor(sel) {
    const parts = [];
    if (sel.specs.length) parts.push(`(?:^| )(?:${sel.specs.map(escape).join('|')}) `);
    const titles = [...sel.cards, ...sel.fixtures.map((f) => `${escape(f)}: `)];
    // cards.spec.js and the editor and studio round trips title each test by its fixture
    // ("elbow-bar-slant: ..."), so one card's area runs only its own fixtures there
    if (titles.length) parts.push(`(?:^| )(?:cards|editor-roundtrip|studio-roundtrip)\\.spec\\.js (?:${titles.join('|')})`);
    return parts.length ? parts.join('|') : null;
}
