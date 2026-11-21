// Refit the moons' L0 and P in src/core/astrometrics/ephemeris.js (MOONS) to the
// Horizons fixture: L0 at J2000, P from 2026 within half a turn of the
// sidereal period. 1950 and 2100 stay out of the fit as checks.
// Run: node tests/core/fixtures/astro-ephemeris-fit-moons.mjs
import { readFileSync } from 'node:fs';
const { MOONS, position } = await import(new URL('../../../src/core/astrometrics/ephemeris.js', import.meta.url).href);
const fx = JSON.parse(readFileSync(new URL('./astro-ephemeris-horizons.json', import.meta.url), 'utf8'));
// sidereal periods (days) as the starting guess
const SID = { phobos: 0.31891023, deimos: 1.26244, io: 1.769137786, europa: 3.551181, ganymede: 7.15455296, callisto: 16.6890184, titan: 15.945421, triton: 5.876854, charon: 6.3872273 };
const ms = (jd) => (jd - 2440587.5) * 86400000;
const ang = (p, r) => Math.acos(Math.min(1, (p[0]*r[0]+p[1]*r[1]+p[2]*r[2]) / Math.hypot(...p) / Math.hypot(...r))) * 180 / Math.PI;
for (const [name, m] of Object.entries(MOONS)) {
  const ref = fx.bodies[name].xyz, parent = m.parent;
  const err = (k) => ang(position(name, ms(fx.jd_tdb[k]), parent), ref[k]);
  m.el[6] = SID[name];
  let best = [1e9, 0];
  for (let L = 0; L < 360; L += 0.05) { m.el[3] = L; const e = err(1); if (e < best[0]) best = [e, L]; }
  for (let L = best[1] - 0.05; L < best[1] + 0.05; L += 0.0005) { m.el[3] = L; const e = err(1); if (e < best[0]) best = [e, L]; }
  m.el[3] = best[1];
  // rate: phase at 2026 within a full turn of the sidereal guess
  const d = fx.jd_tdb[2] - 2451545, P0 = SID[name], turns = d / P0;
  let bp = [1e9, P0];
  const span = P0 / turns; // one turn of phase
  for (let k = -400; k <= 400; k++) { const P = P0 + span * k / 400 * 0.5; m.el[6] = P; const e = err(2); if (e < bp[0]) bp = [e, P]; }
  for (let k = -200; k <= 200; k++) { const P = bp[1] + span * k / 200 * 0.006; m.el[6] = P; const e = err(2); if (e < bp[0]) bp = [e, P]; }
  m.el[6] = bp[1];
  console.log(name.padEnd(9), 'L0', best[1].toFixed(3), 'P', bp[1].toFixed(8), '(sid', P0 + ')', 'errs', [0,1,2,3].map((k) => err(k).toFixed(2)).join(' '));
}
