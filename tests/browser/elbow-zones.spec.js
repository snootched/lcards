/**
 * The elbow editor's text-zone dropdown (src/editor/cards/elbow-editor-zones.js) offers
 * exactly the zones the card builds. Frames used to offer only "body": the editor read
 * a `frame.sides` key that only exists in the card's parsed geometry, so the dropdown
 * (shown only with more than one zone) disappeared.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';
import { elbowEditorZones } from '../../src/editor/cards/elbow-editor-zones.js';

const reconfigure = (page, config) => page.evaluate((c) => window.__reconfigure(c), config);
const frame = (frameCfg, style = 'simple') => ({ type: 'custom:lcards-elbow', elbow: { type: 'frame', style, segment: { color: '#ff9900' }, frame: frameCfg } });

const CASES = [
    ['frame, all sides (defaults)', frame({ bar_width: 30 })],
    ['frame, right side off', frame({ bar_width: 30, right: { enabled: false } })],
    ['frame, top and bottom off', frame({ bar_width: 30, top: { enabled: false }, bottom: { enabled: false } })],
    ['frame, segmented', frame({ bar_width: 30, segments: { inner_frame: { bar_width: 10 } } }, 'segmented')],
    ['simple header-left', { type: 'custom:lcards-elbow', elbow: { type: 'header-left', segment: { bar_width: 90, bar_height: 20 } } }],
    ['simple footer-right', { type: 'custom:lcards-elbow', elbow: { type: 'footer-right', segment: { bar_width: 90, bar_height: 20 } } }],
    ['simple header-open', { type: 'custom:lcards-elbow', elbow: { type: 'header-open', segment: { bar_height: 20 } } }],
    ['simple footer-contained', { type: 'custom:lcards-elbow', elbow: { type: 'footer-contained', segment: { bar_width: 60, bar_height: 20 } } }],
    ['simple diagonal-cap-left', { type: 'custom:lcards-elbow', elbow: { type: 'diagonal-cap-left', segment: { bar_width: 90, bar_height: 20 } } }],
    ['segmented header-left', { type: 'custom:lcards-elbow', elbow: { type: 'header-left', style: 'segmented', segments: { gap: 4, outer_segment: { bar_width: 90, bar_height: 20 }, inner_segment: { bar_width: 30, bar_height: 10 } } } }],
];

for (const [name, config] of CASES) {
    test(`elbow editor zones match the card's zones: ${name}`, async ({ page }) => {
        await mountCase(page, 'elbow-frame');
        await reconfigure(page, config);
        // left_bar/right_bar beside vertical_bar are aliases the editor doesn't repeat.
        const cardZones = () => page.locator('lcards-elbow').evaluate(el => {
            const names = [...(el._zones?.keys() ?? [])];
            return names.filter(z => !(names.includes('vertical_bar') && (z === 'left_bar' || z === 'right_bar'))).sort();
        });
        await expect.poll(cardZones).not.toEqual([]);
        expect(await cardZones()).toEqual(Object.keys(elbowEditorZones(config.elbow)).sort());
        await expectNoErrors(page);
    });
}

test('a frame offers body, full and its side zones; body first (where unzoned text goes)', () => {
    expect(Object.keys(elbowEditorZones({ type: 'frame', frame: {} }))).toEqual(['body', 'full', 'top', 'bottom', 'left', 'right']);
    expect(Object.keys(elbowEditorZones({ type: 'frame', frame: { left: { enabled: false } } }))).toEqual(['body', 'full', 'top', 'bottom', 'right']);
    expect(Object.keys(elbowEditorZones({ type: 'header-left' }))[0]).toBe('body');
});

test('a text field with no zone lands in body on the card', async ({ page }) => {
    await mountCase(page, 'elbow-frame');
    await reconfigure(page, { ...frame({ bar_width: 30 }), text: { probe: { content: 'PROBE', show: true } } });
    await expect.poll(() => page.locator('lcards-elbow').evaluate(el =>
        el.shadowRoot.querySelector('.lcards-text-area[data-zone]')?.getAttribute('data-zone') ?? null)).toBe('body');
});
