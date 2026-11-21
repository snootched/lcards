/**
 * The issue forms (.github/ISSUE_TEMPLATE/) list every LCARdS card by its tag, so a
 * reporter can always pick the card they mean. The astrometrics card was missing
 * from both (2026-11-20) and the MSD was listed as lcards-msd.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const yaml = createRequire(import.meta.url)('js-yaml');
const ROOT = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

/** Every card element lcards-main.js registers (editors are not cards; the view is checked apart). */
const cards = [...read('src/lcards-main.js').matchAll(/customElements\.define\('(lcards-[a-z-]+)'/g)]
    .map((m) => m[1])
    .filter((tag) => !tag.endsWith('-editor') && tag !== 'lcards-layout-view');

const options = (file, id) => {
    const form = yaml.load(read(`.github/ISSUE_TEMPLATE/${file}`));
    const field = form.body.find((f) => f.id === id);
    assert.ok(field, `${file} has the ${id} dropdown`);
    return field.attributes.options;
};

test('the scan found the cards', () => {
    assert.ok(cards.length >= 10, cards.join(', '));
    assert.ok(cards.includes('lcards-astrometrics-card') && cards.includes('lcards-msd-card'));
});

for (const [file, id] of [['bug_report.yml', 'card_type'], ['feature_request.yml', 'area']]) {
    test(`${file}: every card is an option, by its real tag, plus the layout view and the strategies`, () => {
        const opts = options(file, id);
        assert.deepEqual(cards.filter((tag) => !opts.includes(tag)), [], 'add these cards to the dropdown');
        assert.ok(opts.some((o) => o.startsWith('lcards-layout-view')), 'the layout view');
        assert.ok(opts.some((o) => /strateg/i.test(o)), 'the dashboard and section strategies');
        const unknown = opts.filter((o) => /^lcards-[a-z-]+$/.test(o) && !cards.includes(o));
        assert.deepEqual(unknown, [], 'options naming a card tag that does not exist');
    });
}
