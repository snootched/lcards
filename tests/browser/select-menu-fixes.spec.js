/**
 * Select menu card fixes from the D2 docs audit (2026-11-07), each reproduced here
 * against the built bundle first: style.opacity, rule patches on the option
 * buttons, grid.rows / justify-items / align-items, the fit and 100% height modes
 * counting columns, button_template text (font size, templates), letter spacing,
 * deep style layers and an option's card-level keys.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const menu = (page) => page.locator('lcards-select-menu').first();

/** Every option button's value from its own shadow DOM, in option order. */
const perButton = (page, fn) => menu(page).evaluate((el, src) => {
    const f = new Function('b', `return (${src})(b)`);
    return [...el.shadowRoot.querySelectorAll('lcards-button')].map(b => f(b));
}, fn.toString());

const fills = (page) => perButton(page, b => {
    const bg = b.shadowRoot?.querySelector('.button-bg');
    return bg ? getComputedStyle(bg).fill : null;
});

/** Text of each visible <text> in each button. */
const texts = (page) => perButton(page, b => [...(b.shadowRoot?.querySelectorAll('text') ?? [])].map(t => t.textContent));

test('style.opacity dims the options that are not selected; the selected one stays opaque', async ({ page }) => {
    await mountCase(page, 'select-menu-opacity', { width: '600' });
    const opacity = () => perButton(page, b => getComputedStyle(b).opacity);
    // input_select.demo_mode is on Auto, the first option
    await expect.poll(opacity).toEqual(['1', '0.5', '0.5', '0.5']);
    // no style.opacity: every option opaque (what the card always drew)
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode', preset: 'lozenge', grid: { columns: 4 } }));
    await expect.poll(opacity).toEqual(['1', '1', '1', '1']);
    await expectNoErrors(page);
});

test('a rule targeting the menu\'s id recolours its option buttons, and clears again', async ({ page }) => {
    await mountCase(page, 'select-menu-rule', { width: '600' });
    const blue = 'rgb(51, 51, 102)', red = 'rgb(204, 0, 0)';
    await expect.poll(() => fills(page)).toEqual([blue, blue, blue, blue]);
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => fills(page)).toEqual([red, red, red, red]);
    await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));
    await expect.poll(() => fills(page)).toEqual([blue, blue, blue, blue]);
    await expectNoErrors(page);
});

test('grid.rows, grid.justify-items and grid.align-items reach the option grid; the card asks for the rows', async ({ page }) => {
    await mountCase(page, 'select-menu-grid-align', { width: '400' });
    const grid = () => menu(page).evaluate(el => {
        const g = getComputedStyle(el.shadowRoot.querySelector('.sm-grid'));
        return { rows: g.gridTemplateRows, justify: g.justifyItems, align: g.alignItems };
    });
    await expect.poll(grid).toEqual({ rows: '40px 40px 40px', justify: 'center', align: 'start' });
    // 3 rows of 40px + 2 gaps of 4px = 128px: 3 sections rows (2 are 56px + 8px + 56px = 120px)
    expect(await menu(page).evaluate(el => el.getGridOptions().rows)).toBe(3);
    expect(await menu(page).evaluate(el => el.getCardSize())).toBe(3);
    // the buttons show: with no width of their own they still fill their cells across (centring an
    // unsized button shrank it to nothing), and align-items: start keeps them their row's height
    const widths = () => menu(page).evaluate(el => [...el.shadowRoot.querySelectorAll('lcards-button')].map(b => {
        const r = b.getBoundingClientRect(), cell = b.parentElement.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height), Math.round(r.left - cell.left)];
    }));
    await expect.poll(async () => (await widths()).every(([w, h]) => w > 150 && h === 40)).toBe(true);
    // a button_template width: the buttons keep it and sit centred in their columns
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode', preset: 'lozenge', button_template: { width: '100px' },
        grid: { columns: 2, gap: '4px', 'grid-auto-rows': '40px', 'justify-items': 'center' } }));
    await expect.poll(async () => (await widths()).map(([w]) => w)).toEqual([100, 100, 100, 100]);
    const gap = await menu(page).evaluate(el => {
        const g = el.shadowRoot.querySelector('.sm-grid').getBoundingClientRect(), b = el.shadowRoot.querySelector('lcards-button').getBoundingClientRect();
        return Math.round(b.left - g.left);
    });
    expect(gap).toBe(Math.round((400 - 4) / 2 / 2 - 50));
    // the drawing fits the 40px row (the button preset's min_height, 56px on a real theme, spilled out)
    expect(await menu(page).evaluate(el => [...el.shadowRoot.querySelectorAll('lcards-button')].map(b =>
        [b.config.min_height, Math.round(b.shadowRoot.querySelector('svg').getBoundingClientRect().height)]))).toEqual([[0, 40], [0, 40], [0, 40], [0, 40]]);
    // a track list
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode', grid: { columns: 1, rows: '30px 50px 30px 50px' } }));
    await expect.poll(async () => (await grid()).rows).toBe('30px 50px 30px 50px');
    // 160px + 3 x 4px = 172px: 3 sections rows
    expect(await menu(page).evaluate(el => el.getGridOptions().rows)).toBe(3);
    await expectNoErrors(page);
});

test('grid.height fit counts repeat(N, ...) columns', async ({ page }) => {
    await mountCase(page, 'select-menu-fit-repeat', { width: '600' });
    const height = () => menu(page).evaluate(el => el.getBoundingClientRect().height);
    // 4 options in 4 columns: one 40px row
    await expect.poll(height).toBe(40);
    // grid-template-columns counts too
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode', grid: { 'grid-template-columns': 'repeat(2, 1fr)', gap: '4px', 'grid-auto-rows': '40px', height: 'fit' } }));
    await expect.poll(height).toBe(84);
    await expectNoErrors(page);
});

test('grid.height 100% shares the container between rows, not options', async ({ page }) => {
    await mountCase(page, 'select-menu-fill-columns', { width: '600', height: '300' });
    const rowHeights = () => perButton(page, b => Math.round(b.getBoundingClientRect().height));
    // 2 rows in 300px: (300 - 4) / 2 = 148, capped at the 120px maximum
    await expect.poll(rowHeights).toEqual([120, 120, 120, 120]);
    await expectNoErrors(page);
});

test('button_template text: the label\'s font size applies, and name and state resolve their templates', async ({ page }) => {
    await mountCase(page, 'select-menu-template-text', { width: '600' });
    const label = () => perButton(page, b => {
        const t = b.shadowRoot?.querySelector('text[data-field-id="label"]');
        return t ? t.getAttribute('font-size') : null;
    });
    await expect.poll(label).toEqual(['30', '30', '30', '30']);
    const all = (await texts(page)).flat();
    expect(all.some(t => t.includes('{'))).toBe(false);
    // name: the entity's friendly name; state: the real state (not an on/off view of it)
    expect(all.filter(t => /demo mode/i.test(t))).toHaveLength(4);
    const states = await perButton(page, b => b.shadowRoot?.querySelector('text[data-field-id="state"]')?.textContent ?? null);
    expect(states.map(t => String(t).toLowerCase())).toEqual(['auto', 'auto', 'auto', 'auto']);
    await expectNoErrors(page);
});

test('style.text.default letter_spacing, font_size and colour reach the option labels', async ({ page }) => {
    await mountCase(page, 'select-menu-letter-spacing', { width: '600' });
    const label = () => perButton(page, b => {
        const t = b.shadowRoot?.querySelector('text[data-field-id="label"]');
        return t ? { spacing: t.getAttribute('letter-spacing'), size: t.getAttribute('font-size'), fill: t.getAttribute('fill') } : null;
    });
    await expect.poll(async () => (await label())[0]).toMatchObject({ spacing: '6px', size: '22' });
    // the card's text colour beats the lozenge preset's black (Auto is selected)
    await expect.poll(async () => (await label()).map(l => l?.fill?.toLowerCase())).toEqual(['#00ff00', '#ff0000', '#ff0000', '#ff0000']);
    await expectNoErrors(page);
});

test('a plain button draws style.text.default letter_spacing too', async ({ page }) => {
    await mountCase(page, 'button-letter-spacing', { width: '400' });
    await expect.poll(() => page.locator('lcards-button').first().evaluate(el => el.shadowRoot?.querySelector('text[data-field-id="label"]')?.getAttribute('letter-spacing') ?? null))
        .toBe('6px');
    await expectNoErrors(page);
});

test('style layers merge key by key: button_template.style < card style < option style', async ({ page }) => {
    await mountCase(page, 'select-menu-style-layers', { width: '600' });
    const orange = 'rgb(255, 153, 0)', blue = 'rgb(51, 102, 204)';
    // Auto is selected: the card's active colour; the others keep the template's inactive one
    await expect.poll(() => fills(page)).toEqual([orange, blue, blue, blue]);
    // Cool's own style.border adds to the card's style; its colours stay
    const style = await perButton(page, b => b._buttonStyle && { border: b._buttonStyle.border?.width, bg: b._buttonStyle.card?.color?.background?.inactive });
    expect(style[1]).toMatchObject({ border: 2, bg: '#3366cc' });
    await expectNoErrors(page);
});

test('an option\'s variables, zones and rules reach that option\'s button', async ({ page }) => {
    await mountCase(page, 'select-menu-option-keys', { width: '600' });
    // variables: the label template resolves on that option's button
    await expect.poll(async () => (await texts(page))[0]).toContain('BRIDGE');
    const zones = await perButton(page, b => Object.keys(b.config?.zones ?? {}));
    expect(zones[1]).toContain('strip');
    expect(zones[0]).not.toContain('strip');
    // the option's rule loads and patches the menu it targets
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => fills(page)).toEqual(Array(4).fill('rgb(204, 0, 0)'));
    await expectNoErrors(page);
});
