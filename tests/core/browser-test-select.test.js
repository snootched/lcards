/**
 * npm run test:browser:changed picks browser tests from the changed files
 * (scripts/lib/browser-test-select.js). These checks keep its map complete: a new
 * spec file or cards.spec.js test that no area covers would silently never run in
 * a changed-only run (CI's full run would still catch a failure, later).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import {
    AREAS, FULL_ONLY, ALWAYS, NOT_COMPONENT, CARDS_FULL_ONLY, selectBrowserTests, grepFor,
} from '../../scripts/lib/browser-test-select.js';

const DIR = new URL('../browser/', import.meta.url);
const specFiles = readdirSync(DIR).filter((f) => f.endsWith('.spec.js') && !NOT_COMPONENT.includes(f));
const inArea = (/** @type {string} */ f) => Object.values(AREAS).some((a) => a.specs.test(f));
const cardsPattern = new RegExp(`^(?:${[...Object.values(AREAS).map((a) => a.cards).filter(Boolean), CARDS_FULL_ONLY].join('|')})`);

test('every component spec file belongs to an area, the full-only list or the always list', () => {
    const missing = specFiles.filter((f) => f !== 'cards.spec.js' && !inArea(f) && !FULL_ONLY.includes(f) && !ALWAYS.includes(f));
    assert.deepEqual(missing, [], 'add these to AREAS or FULL_ONLY in scripts/lib/browser-test-select.js');
});

test('the full-only and always lists name real spec files that no area already runs', () => {
    for (const f of [...FULL_ONLY, ...ALWAYS]) {
        assert.ok(specFiles.includes(f), `${f} does not exist`);
        assert.ok(!inArea(f), `${f} is in an area and in FULL_ONLY/ALWAYS`);
    }
});

test('every cards.spec.js test and fixture is reachable from an area (or runs with the full suite)', () => {
    const src = readFileSync(new URL('cards.spec.js', DIR), 'utf8');
    const titles = [...src.matchAll(/^test\((['`])(.+?)\1/gm)].map((m) => m[2]).filter((t) => !t.includes('${'));
    assert.ok(titles.length > 30, 'the title scan found the tests');
    const fixtures = readdirSync(new URL('fixtures/', DIR)).map((f) => f.replace(/\.yaml$/, ''));
    const missing = [...titles, ...fixtures.map((f) => `${f}: renders without errors`)].filter((t) => !cardsPattern.test(t));
    assert.deepEqual(missing, [], 'give these an area `cards` pattern (or a title that starts with one)');
});

const pick = (/** @type {string[]} */ changed) => selectBrowserTests(changed, specFiles,
    (name) => specFiles.filter((f) => readFileSync(new URL(f, DIR), 'utf8').includes(`'${name}'`)));

test('shared code runs the full suite; a card file runs its own area and the size budget', () => {
    for (const path of ['src/base/LCARdSCard.js', 'src/core/themes/color-syntax.js', 'src/utils/ha-card-factory.js',
        'src/cards/lcards-button.js', 'src/editor/components/shared/lcards-form-section.js', 'src/lcards-main.js',
        'package.json', 'vite.config.js', 'tests/browser/support.js', 'src/cards/schemas/common-schemas.js',
        'src/brand-new-folder/thing.js']) {
        assert.equal(pick([path]).all, true, path);
    }
    const slider = pick(['src/cards/lcards-slider.js']);
    assert.equal(slider.all, false);
    assert.ok(slider.specs.includes('slider-ring.spec.js') && slider.specs.includes('bundle.spec.js'));
    assert.ok(!slider.specs.some((s) => s.startsWith('msd-')));
    assert.deepEqual(slider.cards, ['slider']);
    assert.ok(pick(['src/editor/dialogs/lcards-msd-studio-dialog.js']).specs.includes('msd-undo.spec.js'));
    assert.ok(pick(['src/editor/cards/lcards-elbow-editor.js']).specs.includes('elbow-zones.spec.js'));
    assert.deepEqual(pick(['src/cards/slider-ring-geometry.js']).cards, ['slider'], 'a card helper module runs its card');
    assert.equal(pick(['src/cards/button-config.js']).all, true, 'the button base runs everything');
});

test('files outside the bundle run nothing; a fixture runs its own test, not all of cards.spec.js', () => {
    const docs = pick(['doc/cards/slider.md', 'CONTRIBUTING.md', 'custom_components/lcards/__init__.py', 'scripts/release-shots.mjs']);
    assert.equal(grepFor(docs), null);
    const fixture = pick(['tests/browser/fixtures/slider-shaped.yaml']);
    assert.ok(!fixture.specs.includes('cards.spec.js'));
    assert.deepEqual(fixture.fixtures, ['slider-shaped']);
    assert.deepEqual(pick(['tests/browser/alert-overlay.spec.js']).specs, ['alert-overlay.spec.js']);
});

test('the grep matches Playwright\'s "<project> <file> <title>" strings for the selection only', () => {
    const grep = new RegExp(/** @type {string} */ (grepFor(pick(['src/cards/lcards-slider.js', 'tests/browser/fixtures/elbow-bar-slant.yaml']))));
    assert.ok(grep.test('component slider-ring.spec.js ring draws'));
    assert.ok(grep.test('component cards.spec.js slider-shaped: renders without errors'));
    assert.ok(grep.test('component cards.spec.js slider editor: picard-gauge-column is listed'));
    assert.ok(grep.test('component cards.spec.js elbow-bar-slant: renders without errors'));
    assert.ok(!grep.test('component cards.spec.js elbow-frame-thin: renders without errors'));
    assert.ok(!grep.test('component cards.spec.js button: state change switches the state colour'));
    assert.ok(!grep.test('component msd-undo.spec.js undo'));
    assert.ok(!grep.test('component alert-slider-thing.spec.js x'), 'a spec name inside another does not match');
    // the round trips run a card's own fixtures only
    assert.ok(grep.test('component editor-roundtrip.spec.js slider-ring: the editor keeps every key'));
    assert.ok(grep.test('component studio-roundtrip.spec.js elbow-bar-slant: the studio keeps every key'));
    assert.ok(!grep.test('component editor-roundtrip.spec.js button-lozenge: the editor keeps every key'));
});
