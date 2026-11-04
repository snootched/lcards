/**
 * `type: lightning`: bolts that flash and go (`mode: strike`)
 * or held, flickering discharges floor to ceiling (`mode: column`).
 *
 * A bolt is seeded midpoint displacement with a few branches, drawn as
 * FatLines in three layers as `beam` is (a wide soft glow, a medium line,
 * a thin bright core). A strike rises in about 20 ms, fades, flickers once
 * more (real strokes restrike), then pauses. A strike inside a volume
 * nebula lights the gas round it (`setLights` on the nebula, found each
 * strike through `ctx.objects`, so a rebuilt nebula keeps being lit);
 * `lights: false` turns that off.
 *
 * Under reduced motion the runtime holds every tick: a strike never shows,
 * a column stands still and dim.
 *
 * @module core/astrometrics/objects/lightning
 */
import { Group, Vector3 } from 'three';
import { FatLine } from '../lines.js';
import { seededRandom } from '../../packs/backgrounds/webgl/scenes/scene-helpers.js';
import { built, num, sub, isOn, DEFAULT_COLORS } from './common.js';

/** Most lights a nebula takes (uniform slots) */
export const MAX_LIGHTS = 4;

/** @param {number[]} a @param {number[]} b */
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** @param {number[]} a */
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
/** @param {number[]} a @param {number[]} b */
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** @param {number[]} a */
const unit = (a) => {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * A unit vector across `d`, turned by a random angle round it.
 * @param {number[]} d - unit
 * @param {() => number} rnd
 */
function across(d, rnd) {
  const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = unit(cross(d, ref));
  const v = cross(d, u);
  const a = rnd() * Math.PI * 2;
  return [u[0] * Math.cos(a) + v[0] * Math.sin(a), u[1] * Math.cos(a) + v[1] * Math.sin(a), u[2] * Math.cos(a) + v[2] * Math.sin(a)];
}

/**
 * A jagged line from a to b: each level puts a point between every two,
 * pushed sideways by up to `jag` times half that segment's length.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} levels
 * @param {number} jag
 * @param {() => number} rnd
 * @returns {number[][]} points
 */
function jagged(a, b, levels, jag, rnd) {
  let pts = [a, b];
  for (let l = 0; l < levels; l++) {
    /** @type {number[][]} */
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1];
      const q = pts[i];
      const d = sub3(q, p);
      const L = len3(d);
      const side = across(unit(d), rnd);
      const k = (rnd() * 2 - 1) * jag * L * 0.5;
      next.push([(p[0] + q[0]) / 2 + side[0] * k, (p[1] + q[1]) / 2 + side[1] * k, (p[2] + q[2]) / 2 + side[2] * k], q);
    }
    pts = next;
  }
  return pts;
}

/**
 * One bolt: a main channel from `from` to `to` and its branches, as flat
 * xyz runs. Pure and seeded (the same seed gives the same bolt).
 * @param {number[]} from
 * @param {number[]} to
 * @param {{ jaggedness?: number, branches?: number, seed?: number, levels?: number }} [o]
 * @returns {{ main: number[], branches: number[][] }}
 */
export function boltRuns(from, to, { jaggedness = 0.5, branches = 3, seed = 1, levels = 6 } = {}) {
  const rnd = seededRandom(seed);
  const jag = Math.max(0, jaggedness);
  const main = jagged(from, to, levels, jag, rnd);
  const total = len3(sub3(to, from));
  /** @type {number[][]} */
  const out = [];
  const n = Math.max(0, Math.round(branches));
  /**
   * @param {number[][]} line
   * @param {number} length
   * @param {number} lv
   * @param {boolean} more - may split once more
   */
  const branch = (line, length, lv, more) => {
    const i = Math.floor((0.15 + rnd() * 0.6) * (line.length - 1));
    const p = line[i];
    const d = unit(sub3(line[Math.min(line.length - 1, i + 2)], p));
    const s = across(d, rnd);
    const ang = ((20 + rnd() * 25) * Math.PI) / 180;
    const L = length * (0.25 + rnd() * 0.3);
    const dir = unit([d[0] * Math.cos(ang) + s[0] * Math.sin(ang), d[1] * Math.cos(ang) + s[1] * Math.sin(ang), d[2] * Math.cos(ang) + s[2] * Math.sin(ang)]);
    const end = [p[0] + dir[0] * L, p[1] + dir[1] * L, p[2] + dir[2] * L];
    const pts = jagged(p, end, lv, jag * 1.2, rnd);
    out.push(pts.flat());
    if (more && rnd() < 0.6) branch(pts, L, Math.max(2, lv - 1), false);
  };
  for (let b = 0; b < n; b++) branch(main, total, Math.max(2, levels - 1), true);
  return { main: main.flat(), branches: out };
}

/**
 * How bright a strike is `age` ms in (0 to about 1): a 20 ms rise, a fade,
 * and a second, weaker stroke a little over half way.
 * @param {number} age
 * @param {number} flash - ms
 */
export function flashLevel(age, flash) {
  const peak = (/** @type {number} */ x) => (x < 0 ? 0 : x < 20 ? x / 20 : Math.exp(-(x - 20) / Math.max(1, flash * 0.3)));
  return Math.min(1, peak(age) + 0.7 * peak(age - flash * 0.55));
}

/**
 * A held column's motion at scene time `t` ms: which shape it shows (a new
 * one every 90 ms at speed 1) and how bright it flickers (0.65 to 1).
 * `speed` scales both: 0.5 half as fast, 0 holds it still.
 * @param {number} t
 * @param {number} speed
 */
export function columnMotion(t, speed) {
  const ts = t * speed;
  return { step: Math.floor(ts / 90), level: 0.65 + 0.35 * Math.abs(Math.sin(ts * 0.021) * Math.sin(ts * 0.0137 + 1.3)) };
}

/** Column spots: the nebula's columns' sunflower spiral (nebula-volume.js columnAt), x and z @param {number} j @param {number} n @param {number[]} half */
export function columnSpot(j, n, half) {
  const fa = j * 2.39996 + 0.7;
  const r = Math.sqrt((j + 0.5) / n) * 0.75;
  return [Math.cos(fa) * r * half[0], Math.sin(fa) * r * half[2]];
}

/**
 * @param {any} cfg
 * @param {import('./common.js').BuildContext} ctx
 * @returns {import('./common.js').BuiltObject}
 */
export function buildLightning(cfg, ctx) {
  const node = new Group();
  node.name = `lightning:${cfg.id ?? ''}`;
  const column = cfg.mode === 'column';
  const coreColor = ctx.color(cfg.color, DEFAULT_COLORS.glow);
  const glow = sub(cfg.glow);
  const glowOn = isOn(cfg.glow, true);
  const glowColor = glow.color !== undefined ? ctx.color(glow.color, DEFAULT_COLORS.glow) : coreColor;
  // the gas lights between the core and glow colours (a white core brightens the gas in its own hue)
  const lightColor = [0, 1, 2].map((i) => (coreColor[i] + glowColor[i]) / 2);
  const width = Math.max(0.5, num(cfg.width, 2));
  // the soft glow's width, times the bolt's
  const glowK = glowOn ? Math.max(0, num(glow.width, 6)) : 0;
  const rate = Math.max(0, num(cfg.rate, 0.5));
  const flash = Math.max(30, num(cfg.flash, 150));
  // column: how fast the held bolts crawl and flicker (1 as drawn, 0 still)
  const speed = Math.max(0, num(cfg.speed, 1));
  const jaggedness = num(cfg.jaggedness, column ? 0.25 : 0.5);
  const branchCount = num(cfg.branches, column ? 1 : 3);
  const brightness = Math.max(0, num(cfg.brightness, 1));
  const lights = cfg.lights !== false;
  const seed0 = Math.round(num(cfg.seed, 1));
  // the region: a box from size, else a ball of radius (strike ends inside it)
  const half = Array.isArray(cfg.size)
    ? [0, 1, 2].map((k) => Math.max(1e-3, num(cfg.size[k], num(cfg.size[0], 100)) / 2))
    : (() => {
        const R = Math.max(1e-3, num(cfg.radius, cfg.size !== undefined ? num(cfg.size, 100) / 2 : 50));
        return [R, R, R];
      })();

  // main channel: wide soft glow, medium, thin bright core; branches: the same, thinner
  /** @param {number} w @param {number} k */
  const layers = (w, k) => [
    new FatLine([], { color: glowColor, width: w * glowK || 0.01, opacity: (glowK ? 0.22 : 0) * k, additive: true, soft: true }),
    new FatLine([], { color: glowColor, width: w * 2.5, opacity: (glowOn ? 0.5 : 0) * k, additive: true, soft: true }),
    new FatLine([], { color: coreColor, width: w, opacity: 0.95 * k, additive: true })
  ];
  const mainLines = layers(width, 1);
  const branchLines = layers(width * 0.55, 0.75);
  const all = [...mainLines, ...branchLines];
  const out = built(cfg, node, { radius: Math.hypot(half[0], half[1], half[2]) });
  for (const l of all) {
    l.object.renderOrder = 3.5;
    node.add(l.object);
    out.lines.push(l);
  }
  /** @type {number[]} each line's opacity at full flash */
  const baseOpacity = all.map((l) => l.material.opacity);
  /** @param {number} k */
  const setLevel = (k) => {
    all.forEach((l, i) => (l.material.opacity = baseOpacity[i] * k));
    node.visible = k > 0.003;
  };

  /** @param {number[]} a @param {number[]} b @param {number} seed */
  const drawBolt = (a, b, seed) => {
    const bolt = boltRuns(a, b, { jaggedness, branches: branchCount, seed });
    mainLines.forEach((l) => l.setRuns([bolt.main]));
    branchLines.forEach((l) => l.setRuns(bolt.branches));
    return bolt;
  };

  const rnd = seededRandom(seed0 * 7919 + 3);
  /** @returns {[number[], number[]]} a strike's ends, local: mostly top to bottom, sometimes across */
  const strikeEnds = () => {
    const at = (/** @type {number} */ y0, /** @type {number} */ y1) => [(rnd() * 2 - 1) * half[0] * 0.9, (y0 + rnd() * (y1 - y0)) * half[1], (rnd() * 2 - 1) * half[2] * 0.9];
    if (rnd() < 0.7) {
      const a = at(0.2, 0.9);
      // near vertical: the foot within about the drop of the start
      const drop = half[1] * (0.6 + rnd() * 0.9);
      const b = [a[0] + (rnd() * 2 - 1) * drop * 0.6, Math.max(-half[1], a[1] - drop), a[2] + (rnd() * 2 - 1) * drop * 0.6];
      return [a, b];
    }
    return [at(-0.6, 0.6), at(-0.6, 0.6)];
  };

  // ---- lighting the gas
  const key = {};
  const wp = new Vector3();
  /** @param {{ at: number[], radius: number, level: number }[]} spots - local */
  const pushLights = (spots) => {
    if (!lights) return;
    const objects = ctx.objects?.();
    if (!objects) return;
    node.updateWorldMatrix(true, false);
    const world = spots.map((s) => ({ at: node.localToWorld(wp.set(s.at[0], s.at[1], s.at[2])).toArray(), radius: s.radius * node.matrixWorld.getMaxScaleOnAxis(), color: lightColor, level: s.level * brightness }));
    for (const o of objects.values()) {
      if (typeof o.setLights !== 'function') continue;
      const mine = o.contains ? world.filter((l) => /** @type {any} */ (o).contains(l.at)) : world;
      o.setLights(key, mine);
    }
  };

  /** column mode: the bolts and where they light */
  /** @type {{ a: number[], b: number[] }[]} */
  const cols = [];
  const colCount = Math.max(1, Math.round(num(cfg.count, 1)));
  if (column) {
    for (let j = 0; j < colCount; j++) {
      const [x, z] = colCount === 1 ? [0, 0] : columnSpot(j, colCount, half);
      cols.push({ a: [x, -half[1], z], b: [x, half[1], z] });
    }
  }
  /** @param {number} seed */
  const drawColumns = (seed) => {
    /** @type {number[][]} */
    const mains = [];
    /** @type {number[][]} */
    const brs = [];
    cols.forEach((c, j) => {
      const bolt = boltRuns(c.a, c.b, { jaggedness, branches: branchCount, seed: seed * 31 + j });
      mains.push(bolt.main);
      brs.push(...bolt.branches);
    });
    mainLines.forEach((l) => l.setRuns(mains));
    branchLines.forEach((l) => l.setRuns(brs));
  };

  if (column) {
    drawColumns(seed0);
    // still (reduced motion, or before the first tick): dim
    setLevel(0.5);
    let lastShape = -1;
    out.tick = (_dt, t) => {
      // the channel crawls: a new shape every 90 ms / speed, the light flickering
      const { step, level: k } = columnMotion(t, speed);
      if (step !== lastShape) {
        lastShape = step;
        drawColumns(seed0 + step);
      }
      setLevel(k);
      pushLights(cols.map((c) => ({ at: [(c.a[0] + c.b[0]) / 2, 0, (c.a[2] + c.b[2]) / 2], radius: half[1] * 0.9, level: 0.6 * k })));
      return true;
    };
  } else {
    setLevel(0);
    /** the current strike: when it started (scene ms), its light spots; null between strikes */
    /** @type {{ t0: number, spots: { at: number[], radius: number }[] } | null} */
    let strike = null;
    /** @type {number | null} */
    let nextAt = null;
    let n = 0;
    out.tick = (_dt, t) => {
      if (rate <= 0) return false;
      if (nextAt === null) nextAt = t + (0.2 + rnd()) * (1000 / rate) * 0.5;
      if (!strike && t >= nextAt) {
        const [a, b] = strikeEnds();
        n++;
        drawBolt(a, b, seed0 * 1009 + n);
        const L = len3(sub3(b, a));
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        // a broad patch of cloud round the channel, brightest at its middle
        strike = { t0: t, spots: [{ at: mid, radius: Math.max(L * 0.9, half[1] * 0.5) }, { at: b, radius: L * 0.5 }] };
      }
      if (strike) {
        const age = t - strike.t0;
        const k = flashLevel(age, flash);
        setLevel(k);
        pushLights(strike.spots.map((s) => ({ ...s, level: k })));
        if (age > flash * 1.8) {
          strike = null;
          setLevel(0);
          pushLights([]);
          // the pause: random round the mean gap
          nextAt = t + (0.3 + rnd() * 1.4) * (1000 / rate);
        }
      }
      return true;
    };
  }
  out.dispose = () => pushLights([]);
  return out;
}
