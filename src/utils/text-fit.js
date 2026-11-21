/**
 * @fileoverview Fit a text into a box: shrink, then wrap, then cut (reports/text-fit-plan.md).
 *
 * Pure: the caller passes a measurer (width of a string at a font size), so the
 * same search serves card text (px) and component zones (viewBox units), and node
 * tests run it with a fake measurer.
 */

/**
 * @typedef {{ min_font_size?: number, max_lines?: number, overflow?: 'ellipsis'|'clip' }} FitOptions
 * @typedef {{ fontSize: number, lines: string[], cut: boolean }} FitResult
 */

/** Line height as a multiple of the font size. */
export const FIT_LINE_HEIGHT = 1.15;
const ELLIPSIS = '…';

/**
 * Normalise a field's `fit` value: `true` takes the defaults, an object overrides them.
 * @param {boolean|FitOptions|undefined|null} fit
 * @param {number} fontSize - the field's font size
 * @returns {{ minFontSize: number, maxLines: number, overflow: 'ellipsis'|'clip' }|null}
 */
export function fitOptions(fit, fontSize) {
    if (!fit) return null;
    const o = fit === true ? {} : fit;
    const min = Number(o.min_font_size);
    return {
        minFontSize: Math.min(fontSize, Number.isFinite(min) && min > 0 ? min : Math.max(8, fontSize * 0.6)),
        maxLines: Math.max(1, Math.floor(Number(o.max_lines) || 2)),
        overflow: o.overflow === 'clip' ? 'clip' : 'ellipsis',
    };
}

/**
 * Greedy line breaking at spaces; a word wider than the width stays on its own line.
 * @param {string[]} words
 * @param {number} width
 * @param {(s: string) => number} w - width at the size being tried
 */
function breakLines(words, width, w) {
    /** @type {string[]} */
    const lines = [];
    let line = '';
    for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (!line || w(next) <= width) line = next;
        else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines;
}

/**
 * Cut a line to fit the width, ending in an ellipsis (or not, for clip).
 * @param {string} line
 * @param {number} width
 * @param {(s: string) => number} w
 * @param {boolean} ellipsis
 */
function cutLine(line, width, w, ellipsis) {
    const tail = ellipsis ? ELLIPSIS : '';
    if (w(line + tail) <= width && !ellipsis) return line;
    let lo = 0;
    let hi = line.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (w(line.slice(0, mid).trimEnd() + tail) <= width) lo = mid;
        else hi = mid - 1;
    }
    return line.slice(0, lo).trimEnd() + tail;
}

/**
 * Fit `text` into `width` x `height`: the largest size from `fontSize` down to
 * `minFontSize` where it fits on one line; else the largest size where it fits in
 * as many lines as the height and `maxLines` allow; else the minimum size, the
 * lines that fit, the last one cut.
 * @param {{ text: string, width: number, height?: number, fontSize: number,
 *   options: { minFontSize: number, maxLines: number, overflow: 'ellipsis'|'clip' },
 *   measure: (text: string, fontSize: number) => number }} args
 * @returns {FitResult}
 */
export function fitText({ text, width, height = Infinity, fontSize, options, measure }) {
    const content = String(text ?? '');
    if (!(width > 0) || !content) return { fontSize, lines: [content], cut: false };
    const { minFontSize, maxLines, overflow } = options;
    const step = Math.max(0.25, fontSize / 40);
    const sizes = [];
    for (let s = fontSize; s > minFontSize; s -= step) sizes.push(s);
    sizes.push(minFontSize);
    const linesFor = (/** @type {number} */ size) => Math.max(1, Math.min(maxLines, Math.floor(height / (size * FIT_LINE_HEIGHT)) || 1));

    // 1. one line, shrinking
    for (const s of sizes) if (measure(content, s) <= width) return { fontSize: s, lines: [content], cut: false };
    // 2. wrapped, from the full size down
    const words = content.split(/\s+/).filter(Boolean);
    if (maxLines > 1 && words.length > 1) {
        for (const s of sizes) {
            const w = (/** @type {string} */ x) => measure(x, s);
            const lines = breakLines(words, width, w);
            if (lines.length <= linesFor(s) && lines.every(l => w(l) <= width)) return { fontSize: s, lines, cut: false };
        }
    }
    // 3. the minimum size, the lines that fit, the last one cut
    const s = minFontSize;
    const w = (/** @type {string} */ x) => measure(x, s);
    const n = maxLines > 1 ? linesFor(s) : 1;
    const all = n > 1 ? breakLines(words, width, w) : [content];
    const lines = all.slice(0, n);
    const rest = all.slice(n - 1).join(' ');
    lines[lines.length - 1] = cutLine(all.length > n ? rest : lines[lines.length - 1], width, w, overflow === 'ellipsis');
    return { fontSize: s, lines: lines.map((l, i) => (i < lines.length - 1 && w(l) > width ? cutLine(l, width, w, overflow === 'ellipsis') : l)), cut: true };
}
