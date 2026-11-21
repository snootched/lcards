/**
 * CoreValidationService's result cache: keyed small and bounded.
 *
 * Cards validate against their schema object (inline, not by name). The cache key
 * used to hold the whole schema's JSON (megabytes for the button schema) and the
 * cache never dropped anything, so a page that showed many cards (the docs Live
 * Demo cycling through dashboards) grew by hundreds of MB per dashboard until the
 * tab was killed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreValidationService } from '../../src/core/validation-service/index.js';

/** A large inline schema, as a card's own is. */
const bigSchema = () => ({
    type: 'object',
    properties: Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`key_${i}`, { type: 'string', description: 'x'.repeat(200) }])),
});

test('an inline schema is keyed by identity, not its JSON: keys stay small', () => {
    const service = new CoreValidationService();
    const schema = bigSchema();
    assert.ok(JSON.stringify(schema).length > 400_000, 'the schema is large');
    service.validate({ key_1: 'a' }, schema);
    const [key] = service.validationCache.keys();
    assert.ok(key.length < 200, `cache key ${key.length} chars`);
});

test('the same data and schema object hit the cache; another schema object does not', () => {
    const service = new CoreValidationService();
    const schema = bigSchema();
    const first = service.validate({ key_1: 'a' }, schema);
    assert.equal(service.validate({ key_1: 'a' }, schema), first);
    assert.equal(service.stats.cacheHits, 1);
    // an equal but separate schema object gets its own entry (never a stale result)
    service.validate({ key_1: 'a' }, bigSchema());
    assert.equal(service.stats.cacheHits, 1);
    assert.equal(service.validationCache.size, 2);
});

test('the cache keeps at most MAX_CACHED results, dropping the least recently used', () => {
    const service = new CoreValidationService();
    const schema = { type: 'object', properties: { n: { type: 'number' } } };
    const max = CoreValidationService.MAX_CACHED;
    const keep = service.validate({ n: 0 }, schema);
    for (let i = 1; i <= max + 50; i++) {
        service.validate({ n: i }, schema);
        // keep the first one in use, so it is never the least recently used
        if (i % 100 === 0) assert.equal(service.validate({ n: 0 }, schema), keep);
    }
    assert.equal(service.validationCache.size, max);
    assert.equal(service.validate({ n: 0 }, schema), keep, 'the recently used result is still cached');
    const hits = service.stats.cacheHits;
    service.validate({ n: 1 }, schema);
    assert.equal(service.stats.cacheHits, hits, 'the oldest unused result was dropped');
});
