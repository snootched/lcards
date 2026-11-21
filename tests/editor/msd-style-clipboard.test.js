/**
 * MSD Studio style clipboard (src/editor/dialogs/msd-studio/msd-style-clipboard.js):
 * copy a label's look (with its leader) or a line's, paste onto others,
 * mirrored to the side each label faces; never positions, ends or text.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';
import { createConfigValidator } from '../../scripts/lib/config-validator.js';
import { buildQuickLabel } from '../../src/editor/dialogs/msd-studio/msd-quick-label.js';
import { copyStyle, pasteStyle, labelSide } from '../../src/editor/dialogs/msd-studio/msd-style-clipboard.js';

const checker = createConfigValidator({ entries: getSchemaEntries(), registries: await buildRegistries() });

/** Build labels one after another so ids stay unique. */
function scene(specs) {
    const overlays = [];
    for (const spec of specs) {
        const { label, line } = buildQuickLabel({ unitsPerPx: 2, overlays, text: 'LABEL', ...spec });
        overlays.push(label, line);
    }
    return overlays;
}
const byId = (overlays, id) => overlays.find(o => o.id === id);

test('a bracket pasted onto classic labels: bar, colour and bar end follow each label\'s side', () => {
    const overlays = scene([
        { style: 'bracket', bracketKind: 'angled', labelPoint: [100, 300], target: [400, 120], text: 'SOURCE' }, // right side, part above
        { style: 'classic', labelPoint: [700, 300], target: [400, 120], text: 'LEFT ONE' },                      // left side, part above
        { style: 'classic', labelPoint: [100, 50], target: [400, 120], text: 'BELOW' }                           // right side, part below
    ]);
    const src = byId(overlays, 'lbl_1');
    // Hand-tuned colour on the source, the point of copying.
    src.card.style.border.color = 'theme:colors.ui.primary';
    byId(overlays, 'ln_1').style.color = 'theme:colors.ui.primary';

    const clip = copyStyle(src, overlays);
    assert.equal(clip.kind, 'label');
    assert.equal(clip.side, 'right');
    const out = pasteStyle(overlays, ['lbl_2', 'lbl_3'], clip);

    const left = byId(out, 'lbl_2');
    assert.deepEqual(Object.keys(left.card.style.border.width), ['left']);  // mirrored
    assert.equal(left.card.text.label.position, 'center-left');
    assert.equal(left.card.text.label.content, 'LEFT ONE');                // text kept
    assert.deepEqual(left.position, byId(overlays, 'lbl_2').position);    // position kept
    const leftLine = byId(out, 'ln_2');
    assert.equal(leftLine.anchor_side, 'top-left');
    assert.equal(leftLine.route, 'angled');
    assert.equal(leftLine.style.color, 'theme:colors.ui.primary');
    assert.deepEqual(leftLine.attach_to, [400, 120]);                       // end kept
    assert.equal(leftLine.anchor_gap, undefined);                          // classic gap removed: the source has none

    assert.equal(byId(out, 'ln_3').anchor_side, 'bottom-right');           // part below: the bar's bottom end
    // The source and the input are untouched.
    assert.equal(byId(out, 'lbl_1'), src);
    assert.equal(byId(overlays, 'lbl_2').card.preset, 'text-only');
    assert.equal(byId(overlays, 'ln_2').route, 'manhattan');

    const issues = checker.validateConfig({
        type: 'custom:lcards-msd-card',
        msd: { base_svg: { source: 'builtin:enterprise-d-shuttlecraft15-anomaly' }, view_box: [0, 0, 1000, 600], overlays: out }
    }).filter(i => i.severity === 'error');
    assert.deepEqual(issues, []);
});

test('a classic pasted onto a bracket removes the bar and leaves the side, not a corner', () => {
    const overlays = scene([
        { style: 'classic', labelPoint: [100, 300], target: [400, 120] },
        { style: 'bracket', labelPoint: [100, 500], target: [400, 450] }
    ]);
    const out = pasteStyle(overlays, ['lbl_2'], copyStyle(byId(overlays, 'lbl_1'), overlays));
    assert.equal(byId(out, 'lbl_2').card.style, undefined);
    assert.equal(byId(out, 'ln_2').anchor_side, 'right');
    assert.equal(byId(out, 'ln_2').corner_style, undefined);
    assert.ok(byId(out, 'ln_2').anchor_gap > 0);
});

test('a bigger font resizes the box to its own text', () => {
    const overlays = scene([
        { style: 'classic', labelPoint: [100, 300], target: [400, 120], unitsPerPx: 4, text: 'BIG' },
        { style: 'classic', labelPoint: [100, 500], target: [400, 450], text: 'SMALL TEXT' }
    ]);
    const before = byId(overlays, 'lbl_2');
    const after = byId(pasteStyle(overlays, ['lbl_2'], copyStyle(byId(overlays, 'lbl_1'), overlays)), 'lbl_2');
    assert.equal(after.card.text.label.font_size, byId(overlays, 'lbl_1').card.text.label.font_size);
    assert.ok(after.size[0] > before.size[0]);
    assert.equal(after.size[1], byId(overlays, 'lbl_1').size[1]);
});

test('line styles: copied from a line, pasted onto lines; a label clip restyles lines too', () => {
    const overlays = [
        { id: 'a', type: 'line', anchor: 'x', attach_to: [1, 2], anchor_side: 'top', style: { color: 'red', width: 4, dash_array: '4,2' }, corner_radius: 9, route: 'smart' },
        { id: 'b', type: 'line', anchor: 'y', attach_to: 'z', anchor_side: 'left', attach_side: 'right', waypoints: [[5, 5]], style: { color: 'blue' }, smoothing_mode: 'chaikin' }
    ];
    const clip = copyStyle(overlays[0], overlays);
    assert.equal(clip.kind, 'line');
    const b = byId(pasteStyle(overlays, ['b'], clip), 'b');
    assert.deepEqual(b.style, { color: 'red', width: 4, dash_array: '4,2' });
    assert.equal(b.corner_radius, 9);
    assert.equal(b.route, 'smart');
    assert.equal(b.smoothing_mode, undefined);
    // Wiring stays: ends, sides, waypoints.
    assert.deepEqual([b.anchor, b.attach_to, b.anchor_side, b.attach_side, b.waypoints], ['y', 'z', 'left', 'right', [[5, 5]]]);
    // Only labels and lines copy.
    assert.equal(copyStyle({ id: 's', type: 'control', card: { type: 'custom:lcards-slider' } }, []), null);
});

test('a label\'s side comes from its leader, else its attachment or text', () => {
    assert.equal(labelSide({}, { anchor_side: 'bottom-left' }), 'left');
    assert.equal(labelSide({ attachment: 'left' }), 'left');
    assert.equal(labelSide({ card: { text: { label: { position: 'center-left' } } } }), 'left');
    assert.equal(labelSide({}), 'right');
});
