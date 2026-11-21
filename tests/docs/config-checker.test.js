/**
 * The Check Your Config docs page (doc/.vitepress/theme/config-checker-core.js):
 * the real checker with results per card, in plain words, with lines and docs
 * links. The page's broken sample reports exactly its intended mistakes and the
 * fixed sample is clean, so neither drifts from the schema.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createChecker, splitPath, friendlyIssues, BROKEN_SAMPLE, FIXED_SAMPLE, SAMPLE_FIXES } from '../../doc/.vitepress/theme/config-checker-core.js';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';

const checker = createChecker({ entries: getSchemaEntries(), registries: await buildRegistries() });
const only = (text) => {
    const r = checker.check(text);
    assert.equal(r.parseError, null);
    return r.cards.flatMap(c => c.issues);
};

test('the broken sample reports each mistake once, at its line', () => {
    const issues = only(BROKEN_SAMPLE);
    assert.deepEqual(issues.map(i => i.path).sort(), SAMPLE_FIXES.map(f => f.path).sort(), JSON.stringify(issues, null, 1));
    const lines = BROKEN_SAMPLE.split('\n');
    for (const issue of issues) {
        const key = String(splitPath(issue.path).at(-1));
        assert.ok(lines[issue.line - 1].includes(key), `${issue.path} at line ${issue.line}: "${lines[issue.line - 1]}"`);
        assert.ok(issue.docs, `${issue.path} has a docs link`);
    }
    const byPath = Object.fromEntries(issues.map(i => [i.path, i]));
    assert.match(byPath['text.label.colour'].message, /did you mean "color"/);
    assert.match(byPath.preset.message, /did you mean "lozenge-right"/);
    assert.match(byPath['animations[0].preset'].message, /did you mean "pulse"/);
    assert.match(byPath['style.card.color.background.inactive'].message, /did you mean "theme:colors.status.success"/);
    assert.match(byPath['style.card.color.background.active'].message, /theme: prefix/);
});

test('the fixed sample is clean', () => {
    assert.deepEqual(only(FIXED_SAMPLE), []);
    assert.equal(FIXED_SAMPLE.split('\n').length, BROKEN_SAMPLE.split('\n').length, 'same lines, so the page can pair them');
});

test('a card nested in a dashboard is found, with its path', () => {
    const r = checker.check('views:\n  - type: custom:lcards-layout-view\n    cards:\n      - type: custom:lcards-button\n        presett: lozenge\n');
    const card = r.cards.find(c => c.tag === 'lcards-button');
    assert.equal(card.path, 'views[0].cards[0]');
    assert.equal(card.line, 4);
    assert.deepEqual(card.issues.map(i => [i.path, i.line]), [['presett', 5]]);
    assert.match(card.issues[0].message, /did you mean "preset"/);
    assert.equal(r.errors, 1);
});

test('a YAML syntax error is reported with its line', () => {
    const r = checker.check('type: custom:lcards-button\n  bad: : x\n');
    assert.equal(r.parseError.line, 2);
    assert.deepEqual(r.cards, []);
});

test('one line per problem: oneOf noise is dropped and type alternatives merge', () => {
    const issues = only('type: custom:lcards-slider\nentity: input_number.x\nheight: tall\n');
    assert.equal(issues.length, 1, JSON.stringify(issues));
    assert.match(issues[0].message, /should be a number, or text/);
    assert.deepEqual(friendlyIssues([
        { path: 'a', severity: 'error', code: 'schema', message: 'must be string' },
        { path: 'a.b', severity: 'error', code: 'schema', message: 'must pass "pattern" keyword validation' },
        { path: 'a', severity: 'error', code: 'schema', message: 'must match exactly one schema in oneOf' },
    ]).map(i => i.path), ['a.b']);
});

test('every docs link the checker can give is a docs page', () => {
    const issues = only(BROKEN_SAMPLE);
    for (const link of issues.map(i => i.docs)) {
        const page = link.split('#')[0].replace(/\/$/, '/index').replace(/^\//, 'doc/');
        assert.ok(existsSync(`${page}.md`), `${link} -> ${page}.md`);
    }
});
