/**
 * F1 Earth satellites (fixture astro-satellites.yaml): shipped orbits placed on an Earth
 * sphere turned as it really is (body: earth), heights in the sphere's radii, and orbit
 * rings (type: ring, satellite: <point>). Live fixes are covered in node
 * (tests/core/astro-satellites.test.js).
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

const state = (page) => page.evaluate(() => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const s = card?._scene?.debug();
    if (!s?.world) return null;
    const earth = s.world.objects.get('earth_body');
    const at = (id) => {
        const v = s.world.places.get(id);
        if (!v || !earth) return null;
        const local = earth.node.worldToLocal(v.clone());
        const r = local.length();
        return { r, lat: Math.asin(local.y / r) * 180 / Math.PI, lon: Math.atan2(local.x, local.z) * 180 / Math.PI };
    };
    const orbit = (id) => (s.world.places.satelliteOrbit(id) ?? []).map((v) => earth.node.worldToLocal(v.clone()).length());
    // the Galileo group on the second Earth: its points and rings
    const earth2 = s.world.objects.get('earth2_body');
    const group = [...s.world.places.defs.keys()].filter((id) => String(id).startsWith('galileo.'));
    const radii = group.map((id) => { const v = s.world.places.get(id); return v ? earth2.node.worldToLocal(v.clone()).length() : null; });
    const rings = [...s.world.objects.keys()].filter((id) => String(id).endsWith('.orbit') && String(id).startsWith('galileo.'));
    return { iss: at('iss'), goes: at('goes'), gps: at('gps'), issOrbit: orbit('iss'), goesOrbit: orbit('goes'), group: group.length, radii, rings: rings.length };
});

test('satellites sit on their real orbits round the Earth sphere, with orbit rings', async ({ page }) => {
    await mountCase(page, 'astro-satellites', { width: '800' });
    await expect.poll(async () => !!(await state(page))?.goes, { timeout: 15000 }).toBe(true);
    const st = /** @type {any} */ (await state(page));
    // radius 100 is 6371 km: the ISS about 420 km up, GOES-East at 35,786 km over 75 W, GPS at 20,200 km
    expect(st.iss.r).toBeGreaterThan(105);
    expect(st.iss.r).toBeLessThan(108);
    expect(Math.abs(st.iss.lat)).toBeLessThan(52);
    expect(st.goes.r).toBeGreaterThan(655);
    expect(st.goes.r).toBeLessThan(668);
    expect(Math.abs(st.goes.lat)).toBeLessThan(1.5);
    expect(Math.abs(st.goes.lon - -75.2)).toBeLessThan(1.5);
    // GPS orbits are a little eccentric (up to 0.02: about 500 km either way)
    expect(st.gps.r).toBeGreaterThan(400);
    expect(st.gps.r).toBeLessThan(425);
    // the rings: a whole orbit at the satellite's height
    expect(st.issOrbit.length).toBe(128);
    expect(Math.min(...st.issOrbit)).toBeGreaterThan(104);
    expect(Math.max(...st.issOrbit)).toBeLessThan(108);
    expect(Math.min(...st.goesOrbit)).toBeGreaterThan(655);
    // Galileo at diagram heights: 23,222 km up is 0.75 ln(24.2) = 2.39 radii over the surface (r 339);
    // Galileo 5 and 6 were launched into an eccentric orbit (17,000 to 26,000 km: r 305 to 350)
    expect(st.group).toBeGreaterThan(20);
    expect(st.rings).toBe(st.group);
    const onOrbit = st.radii.filter((r) => r > 330 && r < 350).length;
    expect(onOrbit).toBeGreaterThanOrEqual(st.group - 2);
    for (const r of st.radii) {
        expect(r).toBeGreaterThan(300);
        expect(r).toBeLessThan(355);
    }
    await page.locator('#mount').screenshot({ path: process.env.SAT_SHOT ?? 'tmp/astro-satellites.png' });
});
