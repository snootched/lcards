/**
 * Provenance coverage: each card type records the layers that shaped it. Every
 * card gets a theme: colour (recorded with its field and resolution chain); cards
 * with templated fields get a template (recorded by field, with dependencies);
 * the button also gets a state-keyed colour (active branch) and a rule (patch,
 * cleared when the rule stops matching).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const THEME = 'theme:colors.ui.primary';

/** [fixture to mount, config, theme field, template field (or null)] */
const CARDS = [
    ['button-lozenge', {
        type: 'custom:lcards-button', id: 'prov_button', entity: 'switch.demo_switch', preset: 'lozenge',
        text: { label: { content: 'State {entity.state}', show: true } },
        style: { card: { color: { background: { active: THEME, inactive: '#333366' } } } },
        rules: [{ id: 'prov-rule', when: { entity: 'switch.demo_switch', state: 'on' },
            apply: { overlays: { prov_button: { style: { card: { color: { background: { active: '#cc0000' } } } } } } } }],
    }, 'style.card.color.background.active', 'text.label.content'],
    ['elbow-header-left', {
        type: 'custom:lcards-elbow', id: 'prov_elbow',
        elbow: { type: 'header-left', segment: { bar_width: 90, bar_height: 20, color: THEME } },
        text: { label: { content: 'Deck [[[ return 7 ]]]', show: true } },
    }, 'elbow.segment.color', 'text.label.content'],
    ['slider-gauge', {
        type: 'custom:lcards-slider', id: 'prov_slider', entity: 'sensor.demo_temperature', preset: 'gauge-basic',
        style: { track: { display: { min: -10, max: 40 } }, ranges: [{ min: 0, max: 20, color: THEME, label: { text: 'Cool {entity.state}' } }] },
    }, 'style.ranges[0].color', 'style.ranges[0].label.text'],
    ['chart-line', {
        type: 'custom:lcards-chart', id: 'prov_chart', sources: [{ entity: 'sensor.demo_temperature' }],
        style: { colors: { series: [THEME] } },
    }, 'style.colors.series[0]', null],
    ['data-grid-data', {
        type: 'custom:lcards-data-grid', id: 'prov_grid', data_mode: 'data',
        rows: [{ values: ['A', '[[[ return "B" ]]]'] }],
        style: { color: THEME },
    }, 'style.color', 'rows[0][1]'],
    ['select-menu', {
        type: 'custom:lcards-select-menu', id: 'prov_select', entity: 'input_select.demo_mode',
        style: { card: { color: { background: { active: THEME } } } },
    }, 'style.card.color.background.active', null],
    ['msd-viewbox-only', {
        type: 'custom:lcards-msd-card', id: 'prov_msd',
        msd: { view_box: [0, 0, 400, 200], anchors: { a: [40, 40], b: [360, 160] },
            overlays: [{ id: 'line_ab', type: 'line', anchor: 'a', attach_to: 'b', route: 'auto', style: { color: THEME } }] },
    }, 'msd.overlays[0].style.color', null],
];

/** The card element's provenance (getProvenance()). */
const provenanceOf = (card) => card.evaluate(el => el.getProvenance?.());

for (const [fixture, config, themeField, templateField] of CARDS) {
    const name = config.type.replace('custom:lcards-', '');
    test(`${name}: provenance records config layers, theme tokens${templateField ? ' and templates' : ''}`, async ({ page }) => {
        const card = await mountCase(page, fixture, name === 'chart' ? { height: '300' } : {});
        await page.evaluate((c) => window.__reconfigure(c), config);
        await expect.poll(async () => (await provenanceOf(card))?.config?.merge_order ?? []).toContain('user_config');

        // The theme: value: its field and a resolution chain
        await expect.poll(async () => {
            const tokens = (await provenanceOf(card))?.theme_tokens ?? {};
            return Object.values(tokens).flatMap(t => t.used_by_fields);
        }, { message: 'theme token field' }).toContain(themeField);
        const token = (await provenanceOf(card)).theme_tokens['colors.ui.primary'];
        expect(token.original_ref).toBe(THEME);
        expect(token.resolution_chain.map(s => s.step)[0]).toMatch(/lookup|override/);

        if (templateField) {
            await expect.poll(async () => Object.keys((await provenanceOf(card))?.templates ?? {}), { message: 'template field' })
                .toContain(templateField);
        }
        await expectNoErrors(page);
    });
}

test('button: the active state branch, rule patches while the rule matches, and component presets', async ({ page }) => {
    const card = await mountCase(page, 'button-lozenge');
    await page.evaluate((c) => window.__reconfigure(c), CARDS[0][1]);
    const runtime = async (field) => (await provenanceOf(card))?.runtime?.[field] ?? [];
    const branch = async () => (await runtime('style.card.color.background')).find(l => l.layer === 'state')?.detail?.state;

    await expect.poll(branch).toBe('inactive');
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(branch).toBe('active');

    await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));

    // A rule (the fixture's own id, so the rule targets it): its patch is recorded
    // against the unpatched value while the rule matches, and goes when it stops
    const ruled = await mountCase(page, 'button-rule');
    const patches = async () => (await provenanceOf(ruled))?.rule_patches ?? {};
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(async () => (await patches())['style.card.color.background']?.rule_id).toBe('rule-button-on');
    const patch = (await patches())['style.card.color.background'];
    expect(patch.patched_value).toBe('#cc0000');
    expect(patch.original_value).toBe('#333366');
    await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));
    await expect.poll(async () => Object.keys(await patches())).toEqual([]);

    // A component preset's segments and text are recorded as runtime layers
    await mountCase(page, 'button-lozenge');
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', id: 'prov_alert', component: 'alert', preset: 'condition_red' }));
    const alert = page.locator('#mount > *').first();
    await expect.poll(async () => {
        const all = (await provenanceOf(alert))?.runtime ?? {};
        return [...new Set(Object.values(all).flat().map(l => l.layer))].sort();
    }).toEqual(expect.arrayContaining(['component', 'component-preset']));
    await expectNoErrors(page);
});

test('button: built-in defaults, preset defaults and the card-wide context are recorded', async ({ page }) => {
    const card = await mountCase(page, 'button-lozenge');
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-button', id: 'prov_defaults', entity: 'switch.demo_switch',
        animations: [{ trigger: 'on_tap', preset: 'pulse' }],
    }));
    const prov = () => provenanceOf(card);
    // No colour in the config: the card's theme default stands in, as 'built-in'
    await expect.poll(async () => (await prov())?.runtime?.['style.card.color.background.inactive']?.find(l => l.layer === 'built-in')?.detail?.token)
        .toBe('components.button.background.inactive');
    // The pulse preset filled in its own parameters
    await expect.poll(async () => (await prov())?.runtime?.['animations[0].params.max_scale']?.[0]?.detail?.preset).toBe('pulse');
    const context = (await prov()).context;
    expect(context).toMatchObject({ card_type: 'button', entity: 'switch.demo_switch', entity_state: 'off' });
    expect(context.theme).toBeTruthy();
    // Change events: a subscriber hears about a state change
    const heard = await card.evaluate((el) => new Promise((resolve) => {
        const off = el.subscribeProvenance(() => { off(); resolve(true); });
        setTimeout(() => resolve(false), 3000);
        window.__setState('switch.demo_switch', 'on');
    }));
    expect(heard).toBe(true);
    await expectNoErrors(page);
});

test('chart: its theme defaults are recorded as built-in, with the tokens they read', async ({ page }) => {
    const card = await mountCase(page, 'chart-line', { height: '300' });
    await expect.poll(async () => {
        const runtime = (await provenanceOf(card))?.runtime ?? {};
        return Object.values(runtime).flat().filter(l => l.layer === 'built-in').length;
    }).toBeGreaterThan(0);
    const tokens = (await provenanceOf(card)).theme_tokens;
    expect(Object.values(tokens).some(t => t.used_by_fields.includes('style (chart defaults)'))).toBe(true);
    await expectNoErrors(page);
});
