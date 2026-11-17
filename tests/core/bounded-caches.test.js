/**
 * Caches keyed by live values must stay bounded (2026-11-17, the same class of bug
 * as the validation cache in 0891369e):
 * - the text measurement cache is keyed by the text itself, so a clock or a sensor
 *   value measured with text fit adds keys forever;
 * - the image cache is keyed by URL, and template URLs (a camera's entity_picture,
 *   album art) change for good. A failed load must not stay cached either.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('the text measurement cache keeps the most recently used 2000 entries', async () => {
    const savedDocument = globalThis.document;
    let measured = 0;
    // only a canvas is needed (node has no document)
    globalThis.document = /** @type {any} */ ({
        createElement: () => ({ getContext: () => ({ font: '', measureText: (/** @type {string} */ t) => { measured++; return { width: t.length, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }; } }) }),
    });
    try {
        const { RendererUtils } = await import('../../src/msd/renderer/RendererUtils.js');
        RendererUtils.clearTextMeasureCache();
        RendererUtils.measureText('KEEP', '16px Antonio');
        for (let i = 0; i < 5000; i++) {
            RendererUtils.measureText(`${i}.5 °C`, '16px Antonio');
            if (i % 100 === 0) RendererUtils.measureText('KEEP', '16px Antonio'); // used often: stays
        }
        assert.equal(RendererUtils.getTextMeasureCacheStats().size, 2000);
        const before = measured;
        RendererUtils.measureText('KEEP', '16px Antonio');
        assert.equal(measured, before, 'a recently used entry is still cached');
        RendererUtils.measureText('0.5 °C', '16px Antonio');
        assert.equal(measured, before + 1, 'the oldest entries were dropped');
    } finally {
        globalThis.document = savedDocument;
    }
});

test('the image cache is bounded and forgets failed loads', async () => {
    const SavedImage = globalThis.Image;
    let loads = 0;
    /** URLs containing "bad" fail */
    globalThis.Image = /** @type {any} */ (class {
        set src(/** @type {string} */ v) {
            loads++;
            queueMicrotask(() => (v.includes('bad') ? this.onerror?.() : this.onload?.()));
        }
    });
    try {
        const { loadImage } = await import('../../src/core/packs/shared/ImageLoader.js');
        const first = await loadImage('/local/cam.jpg?token=0');
        for (let i = 1; i <= 100; i++) await loadImage(`/local/cam.jpg?token=${i}`);
        const count = loads;
        await loadImage('/local/cam.jpg?token=100');
        assert.equal(loads, count, 'a recent URL is served from the cache');
        const again = await loadImage('/local/cam.jpg?token=0');
        assert.notEqual(again, first, 'an old URL was dropped and loads again');

        await assert.rejects(loadImage('/local/bad.jpg'));
        const afterFail = loads;
        await assert.rejects(loadImage('/local/bad.jpg'));
        assert.equal(loads, afterFail + 1, 'a failed load is tried again');
    } finally {
        globalThis.Image = SavedImage;
    }
});
