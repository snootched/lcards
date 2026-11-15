// text-fit (reports/text-fit-plan.md): shrink, then wrap, then cut, with a fake
// measurer (every character is 0.5 em wide).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitText, fitOptions } from '../../src/utils/text-fit.js';

const measure = (text, size) => text.length * size * 0.5;
const fit = (text, width, height, fontSize = 20, fitValue = true) =>
    fitText({ text, width, height, fontSize, options: fitOptions(fitValue, fontSize), measure });

test('fitOptions: true takes the defaults; an object overrides; never above the font size', () => {
    assert.deepEqual(fitOptions(true, 20), { minFontSize: 12, maxLines: 2, overflow: 'ellipsis' });
    assert.deepEqual(fitOptions(true, 10), { minFontSize: 8, maxLines: 2, overflow: 'ellipsis' });
    assert.deepEqual(fitOptions({ min_font_size: 30, max_lines: 3, overflow: 'clip' }, 20), { minFontSize: 20, maxLines: 3, overflow: 'clip' });
    assert.equal(fitOptions(false, 20), null);
    assert.equal(fitOptions(undefined, 20), null);
});

test('text that fits keeps its size and one line', () => {
    assert.deepEqual(fit('LAMP', 100, 30), { fontSize: 20, lines: ['LAMP'], cut: false });
});

test('a little too wide: shrinks on one line', () => {
    // 12 chars at 20 = 120 wide; fits 100 at <= 16.66
    const r = fit('ENGINEERING1', 100, 30);
    assert.equal(r.lines.length, 1);
    assert.ok(r.fontSize <= 100 / 6 && r.fontSize >= 16, String(r.fontSize));
});

test('much too wide: wraps into two lines when the height allows', () => {
    // 'LCARDS TEST SHIELDS' at 12 (min) = 114 wide > 80; two lines fit 80 x 40 at about 13
    const r = fit('LCARDS TEST SHIELDS', 80, 40);
    assert.equal(r.cut, false);
    assert.equal(r.lines.length, 2);
    for (const l of r.lines) assert.ok(measure(l, r.fontSize) <= 80, l);
    assert.ok(r.lines.length * r.fontSize * 1.15 <= 40);
});

test('no room for two lines: the minimum size, cut with an ellipsis (or clipped)', () => {
    const r = fit('LCARDS TEST SHIELDS', 80, 16);
    assert.equal(r.fontSize, 12);
    assert.equal(r.lines.length, 1);
    assert.ok(r.lines[0].endsWith('…'), r.lines[0]);
    assert.ok(measure(r.lines[0], 12) <= 80);
    const clip = fit('LCARDS TEST SHIELDS', 80, 16, 20, { overflow: 'clip' });
    assert.ok(!clip.lines[0].endsWith('…') && measure(clip.lines[0], 12) <= 80, clip.lines[0]);
});

test('max_lines: 1 shrinks only, then cuts', () => {
    const r = fit('LCARDS TEST SHIELDS', 80, 100, 20, { max_lines: 1 });
    assert.equal(r.lines.length, 1);
    assert.equal(r.cut, true);
});

test('more lines than allowed: the last allowed line carries the rest, cut', () => {
    const r = fit('ONE TWO THREE FOUR FIVE SIX', 40, 200, 20, { max_lines: 2 });
    assert.equal(r.lines.length, 2);
    assert.ok(r.lines[1].endsWith('…'));
    for (const l of r.lines) assert.ok(measure(l, r.fontSize) <= 40, l);
});

test('nothing to fit: empty text or no width is left alone', () => {
    assert.deepEqual(fit('', 50, 20), { fontSize: 20, lines: [''], cut: false });
    assert.deepEqual(fitText({ text: 'X', width: 0, fontSize: 20, options: fitOptions(true, 20), measure }), { fontSize: 20, lines: ['X'], cut: false });
});
