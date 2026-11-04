/**
 * The Bajoran wormhole as the station's displays draw it: a mouth (the
 * realistic swirl, or the diagram's entrance disc and funnel) dropping into a
 * twisted pipeline of strands, then the inside laid out along one axis: the
 * negative CTL region (nested shells with a cone inside), the ring
 * singularity, the positive CTL region, the point singularity (a bright cone)
 * opening into the verteron membrane, then the far mouth: rings square to the
 * axis, each wider and further on, opening like a funnel. Everything past
 * the mouth is diagram only (its inside cannot be seen); the mouth switches
 * with the card's look (`wormholeMouth`).
 *
 * Laid out along +x from the mouth at `at`, about `size` long, the mouth
 * opening upward. Pure: a fragment builder for the starters.
 *
 * @module core/astrometrics/starters/wormhole
 */
import { wormholeMouth, THROAT_LINE } from './scene-star-trek-galaxy.js';

const BLUE = 'var(--lcars-blue)';
const WHITE = 'var(--lcards-moonlight)';

/** Lobe profiles (well.profile, rim first): rounded "apples" narrowing to a neck at each end */
const NEGATIVE_LOBE = [0.1, 0.7, 0.98, 1, 0.85, 0.45, 0.1];
const POSITIVE_LOBE = [0.1, 0.85, 1, 0.95, 0.6, 0.1];
const MEMBRANE = [0.3, 0.85, 1, 0.9, 0.55, 0.25];

/** The far mouth past the membrane: [x along the axis, ring radius], layout units */
const FAR_MOUTH = [[57, 11], [62, 14], [68, 17]];

/**
 * One strand of the pipeline, offsets from the mouth (units of the layout,
 * scaled by k): straight down from the throat, a U turn, then waves into the
 * first lobe, twisting round the other strands.
 * @param {number} twist - the strand's phase round the bundle, radians
 * @param {number} k - scale
 * @returns {number[][]}
 */
export function pipelineStrand(twist, k) {
  /** @type {number[][]} */
  const path = [];
  for (let i = 0; i < 40; i++) path.push([0, -7 - 10 * (i / 39), 0]);
  for (let i = 1; i < 30; i++) {
    const a = (Math.PI * i) / 29;
    path.push([3 - 3 * Math.cos(a), -17 - 1.8 * Math.sin(a), 0]);
  }
  for (let i = 1; i < 60; i++) {
    const t = i / 59;
    path.push([6 + 14 * t, -17 + 8 * t + 2.2 * Math.sin(t * 3 * Math.PI) * (1 - t), 0]);
  }
  const n = path.length;
  const r = 0.9;
  const round = (/** @type {number} */ v) => Math.round(v * 1000) / 1000;
  return path.map(([x, y, z], i) => {
    const a = twist + (i / n) * 4 * Math.PI;
    return [round(x * k), round((y + 0.5 * r * Math.cos(a)) * k), round((z + r * Math.sin(a)) * k)];
  });
}

/**
 * The whole wormhole: the mouth and the diagram of its inside.
 * @param {{ prefix: string, at: string, size?: number, power?: string, extra?: Record<string, any>, stars?: number, labels?: boolean }} o -
 *   `size` the length of the layout (default 70); `power` an entity (0 to 100) the mouth opens with and the lobes wobble with;
 *   `extra` goes on every object (a distance range)
 * @returns {{ points: any[], objects: any[] }}
 */
export function bajoranWormhole({ prefix, at, size = 70, power, extra = {}, stars = 6000, labels = true }) {
  const k = size / 70;
  const id = (/** @type {string} */ name) => `${prefix}_${name}`;
  /** A point at an offset from the mouth, in layout units */
  const pt = (/** @type {string} */ name, /** @type {number[]} */ off, /** @type {Record<string, any>} */ more = {}) => ({ id: id(name), at, offset: off.map((v) => Math.round(v * k * 1000) / 1000), ...more });
  // a tap flies to the label
  const label = (/** @type {string} */ name, /** @type {number[]} */ off, /** @type {string} */ text) =>
    pt(name, off, { label: text, style: 'minor', look: 'diagram', tap_action: { action: 'fly-to' } });
  const wobbleAmp = power ? `[[[ return Number(states['${power}']?.state ?? 0) / 2000 ]]]` : 0.03;
  const wobble = [{ type: 'wobble', lobes: 0, waves: 2, period: 4, amplitude: wobbleAmp }];
  const lobe = (/** @type {string} */ name, /** @type {string} */ where, /** @type {number[]} */ profile, /** @type {number} */ radius, /** @type {number} */ depth, /** @type {number} */ opacity) => ({
    type: 'grid', id: id(name), shape: 'well', well: { profile }, at: where, face: id('east'), radius: radius * k, depth: depth * k,
    pattern: 'polar', spoke_count: 16, line_spacing: 2.4 * k, color: BLUE, opacity, look: 'diagram', deform: wobble, ...extra
  });
  const mouth = wormholeMouth({ prefix, at, aim: id('down'), radius: 9 * k, depth: 7 * k, power, extra, stars, glow: 2 });
  return {
    points: [
      ...mouth.points,
      pt('down', [0, -1000, 0]),
      pt('east', [1000, -9, 0]),
      pt('west', [-1000, -9, 0]),
      pt('negative', [20, -9, 0]),
      pt('negative_cone', [21, -9, 0]),
      pt('ring_singularity', [33, -9, 0]),
      pt('positive', [33.5, -9, 0]),
      pt('point_singularity', [52, -9, 0]),
      pt('membrane', [52, -9, 0]),
      pt('membrane_centre', [58, -9, 0]),
      pt('middle', [34, -9, 0]),
      ...FAR_MOUTH.map(([x], i) => pt(`far_mouth_${i + 1}`, [x, -9, 0])),
      ...(labels
        ? [
          label('label_pipeline', [-4, -15, 0], 'PIPELINE'),
          label('label_negative', [26, -18, 0], 'NEGATIVE CTL REGION'),
          label('label_ring', [33, 1, 0], 'RING SINGULARITY'),
          label('label_positive', [40, -19, 0], 'POSITIVE CTL REGION'),
          label('label_point', [50, -17, 0], 'POINT SINGULARITY'),
          label('label_membrane', [60, 2, 0], 'VERTERON MEMBRANE')
        ]
        : [])
    ],
    objects: [
      // the throat tube leads into the pipeline, so it shows with it (diagram only); the
      // showcase keeps it in both looks, where it joins the link across the galaxy
      ...mouth.objects.map((o) => (o.id === id('throat_tube') ? { ...o, look: 'diagram' } : o)),
      // the entrance: the flat disc the funnel drops from
      { type: 'grid', id: id('entrance'), shape: 'disc', at, radius: 9 * k, pattern: 'polar', line_spacing_deg: 20, color: BLUE, opacity: 0.8, look: 'diagram', ...extra },
      // the pipeline: three strands twisted round each other, shaded pipes with light running down them
      ...[0, 2.1, 4.2].map((twist, i) => ({
        type: 'path', id: id(`strand_${i + 1}`), at, points: pipelineStrand(twist, k), ...THROAT_LINE, width: 4, glow: 2, look: 'diagram', ...extra
      })),
      lobe('negative_outer', id('negative'), NEGATIVE_LOBE, 7, 13, 1),
      lobe('negative_inner', id('negative'), NEGATIVE_LOBE, 4.8, 13, 0.6),
      {
        type: 'grid', id: id('negative_cone_grid'), shape: 'well', well: { shape: 'cone', throat: 0.05 }, at: id('negative_cone'), face: id('east'),
        radius: 2.5 * k, depth: 11 * k, line_spacing_deg: 30, color: WHITE, opacity: 0.8, look: 'diagram', ...extra
      },
      { type: 'ring', id: id('ring_singularity_ring'), at: id('ring_singularity'), face: id('east'), radius: 1.6 * k, width: 3, glow: 2, color: WHITE, look: 'diagram', ...extra },
      lobe('positive_outer', id('positive'), POSITIVE_LOBE, 7.5, 18.5, 1),
      lobe('positive_inner', id('positive'), POSITIVE_LOBE, 5, 18.5, 0.6),
      {
        type: 'grid', id: id('point_singularity_cone'), shape: 'well', well: { shape: 'cone', throat: 0.04 }, at: id('point_singularity'), face: id('west'),
        radius: 3 * k, depth: 9 * k, line_spacing_deg: 24, color: WHITE, look: 'diagram', ...extra
      },
      { type: 'glow', id: id('point_glow'), at: id('point_singularity'), size: 5 * k, color: WHITE, look: 'diagram', ...extra },
      lobe('membrane_outer', id('membrane'), MEMBRANE, 8, 13, 1),
      lobe('membrane_inner', id('membrane'), MEMBRANE, 5.5, 13, 0.6),
      // the far mouth: coaxial rings widening along the axis (the reference draws them in perspective, so they look tilted)
      ...FAR_MOUTH.map(([, r], i) => ({
        type: 'ring', id: id(`far_mouth_ring_${i + 1}`), at: id(`far_mouth_${i + 1}`), face: id('east'), radius: r * k, width: 2, color: BLUE, opacity: 0.8, look: 'diagram', ...extra
      }))
    ]
  };
}
