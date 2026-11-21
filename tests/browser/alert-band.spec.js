/**
 * Alert overlay `display: band` (Layer A, built bundle): a row of dashes across
 * the screen with the alert symbol in the middle. The dashboard under it stays
 * usable (clicks pass through), a click on the symbol dismisses, and the dashes
 * follow the screen size.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const showBand = (page, config = {}) => page.evaluate(async (cfg) => {
    // Something under the band to click, like a dashboard card.
    const under = document.createElement('div');
    under.id = 'under';
    Object.assign(under.style, { position: 'fixed', inset: '0', zIndex: '1' });
    window.__clicks = 0;
    under.addEventListener('click', () => { window.__clicks++; });
    document.body.appendChild(under);

    await customElements.whenDefined('lcards-alert-overlay');
    const el = document.createElement('lcards-alert-overlay');
    el.setConfig({ type: 'custom:lcards-alert-overlay', display: 'band', ...cfg });
    el.hass = window.__hass;
    document.body.appendChild(el);
    window.__overlay = el;
    window.__setState('input_select.lcards_alert_mode', {
        state: 'red_alert',
        attributes: { options: ['green_alert', 'red_alert', 'yellow_alert'] },
    });
    el.hass = window.__hass;
}, config);

const band = (page) => page.evaluate(() => {
    const el = window.lcards.core.portalOverlayManager._slots.get('alert-overlay')?.contentElement;
    if (!el || el.localName !== 'lcards-alert-band') return null;
    const root = el.renderRoot;
    const box = (e) => e ? (({ x, y, width, height }) => ({ x, y, width, height }))(e.getBoundingClientRect()) : null;
    return { dashes: root.querySelectorAll('.dash').length, band: box(root.querySelector('.band')), emblem: box(root.querySelector('.emblem')), emblemCard: !!root.querySelector('.emblem lcards-button') };
});

test('the band spans the screen with the symbol in the middle', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await showBand(page);
    await expect.poll(async () => (await band(page))?.dashes ?? 0, { timeout: 10_000 }).toBeGreaterThan(40);
    const b = await band(page);
    expect(b.band.width).toBe(1200);
    // Centred by default.
    expect(Math.round(b.band.y + b.band.height / 2)).toBe(400);
    expect(Math.round(b.emblem.x + b.emblem.width / 2)).toBe(600);
    await expect.poll(async () => (await band(page)).emblemCard).toBe(true);
    await expectNoErrors(page);
});

test('clicks pass through the band; a click on the symbol dismisses it', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await showBand(page);
    await expect.poll(async () => (await band(page))?.dashes ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
    const b = await band(page);
    // On a dash, well away from the symbol: the page underneath gets the click.
    await page.mouse.click(40, b.band.y + b.band.height / 2);
    // Elsewhere on the screen too.
    await page.mouse.click(600, 100);
    expect(await page.evaluate(() => window.__clicks)).toBe(2);
    // The symbol dismisses.
    await page.mouse.click(b.emblem.x + b.emblem.width / 2, b.emblem.y + b.emblem.height / 2);
    await expect.poll(() => page.evaluate(() => window.lcards.core.portalOverlayManager.has('alert-overlay'))).toBe(false);
    expect(await page.evaluate(() => window.__clicks)).toBe(2);
});

test('position, and the dashes follow the screen size', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await showBand(page, { band: { position: '75%', emblem: false, height: '40px' } });
    await expect.poll(async () => (await band(page))?.dashes ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
    const wide = await band(page);
    expect(Math.round(wide.band.y + wide.band.height / 2)).toBe(600);
    expect(wide.emblem).toBeNull();
    await page.setViewportSize({ width: 600, height: 800 });
    await expect.poll(async () => (await band(page)).dashes).toBeLessThan(wide.dashes);
});

test('the symbol is centred on the band; radius and grow reach the dashes', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await showBand(page, { band: { dash_radius: 'pill', grow: 1.8, animation: 'none' } });
    await expect.poll(async () => (await band(page))?.emblemCard ?? false, { timeout: 10_000 }).toBe(true);
    const shape = () => page.evaluate(() => {
        const el = window.lcards.core.portalOverlayManager._slots.get('alert-overlay').contentElement;
        const btn = el.renderRoot.querySelector('.emblem lcards-button');
        const s = btn?.shadowRoot?.querySelector('#alert-shape');
        if (!s) return null;
        const r = s.getBoundingClientRect();
        const dash = el.renderRoot.querySelector('.dash');
        const b = el.renderRoot.querySelector('.band').getBoundingClientRect();
        return { shapeMid: r.y + r.height / 2, bandMid: b.y + b.height / 2, rx: Number(dash.getAttribute('rx')), width: Number(dash.getAttribute('width')),
            grow: getComputedStyle(el.renderRoot.querySelector('.band')).getPropertyValue('--band-grow').trim() };
    });
    await expect.poll(async () => (await shape()) !== null).toBe(true);
    const s = await shape();
    // The drawn symbol (not just its box) sits on the band's centre line.
    expect(Math.abs(s.shapeMid - s.bandMid)).toBeLessThan(2);
    expect(s.rx).toBe(s.width / 2);
    expect(s.grow).toBe('1.8');
});

test('inward sweep and speed: delays reversed, cycle shortened, the symbol bars follow', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await showBand(page, { band: { direction: 'inward', speed: 2 } });
    await expect.poll(async () => (await band(page))?.emblemCard ?? false, { timeout: 10_000 }).toBe(true);
    const info = await page.evaluate(() => {
        const el = window.lcards.core.portalOverlayManager._slots.get('alert-overlay').contentElement;
        const dashes = [...el.renderRoot.querySelectorAll('.dash')];
        const delay = (d) => parseInt(d.style.animationDelay, 10);
        const centre = dashes.reduce((a, b) => (Math.abs(+a.getAttribute('x') - 600) < Math.abs(+b.getAttribute('x') - 600) ? a : b));
        const edge = dashes[0];
        const btn = el.renderRoot.querySelector('.emblem lcards-button');
        return {
            cycle: getComputedStyle(el.renderRoot.querySelector('.band')).getPropertyValue('--band-cycle').trim(),
            centre: delay(centre), edge: delay(edge),
            emblemAnims: (btn.config.animations ?? []).filter(a => a.id?.startsWith('bars-')).map(a => a.params?.duration),
        };
    });
    expect(info.cycle).toBe('1000ms');
    expect(info.edge).toBe(0);
    expect(info.centre).toBeGreaterThan(400);
    expect(info.emblemAnims).toEqual([1000, 1000]);
});

test('phase locks the band to the symbol bar sweep', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await showBand(page, { band: { phase: 180 } });
    await expect.poll(async () => (await band(page))?.emblemCard ?? false, { timeout: 10_000 }).toBe(true);
    const offsets = () => page.evaluate(() => {
        const el = window.lcards.core.portalOverlayManager._slots.get('alert-overlay').contentElement;
        const bar = el.renderRoot.querySelector('.emblem lcards-button')?.shadowRoot?.querySelector('#bar-1');
        const ref = bar?.getAnimations().find(a => a.startTime !== null);
        if (!ref) return null;
        return [...el.renderRoot.querySelectorAll('.dash')].slice(0, 5)
            .map(d => Math.round(d.getAnimations()[0].startTime - ref.startTime));
    });
    // 180 degrees of the 2000 ms cycle, less the 8% keyframe offset of the sweep peak.
    await expect.poll(offsets, { timeout: 5000 }).toEqual([840, 840, 840, 840, 840]);
});
