/**
 * _registerLineSegments used to match a line's own straight runs against
 * existing trunks in pure POSITIONAL (flow-position) order, greedily
 * letting whichever run reached a matching trunk FIRST claim it via
 * `touchedTrunks` — even when a later, much longer run was the more
 * correct match for that same trunk. A short, purely artifactual leg (a
 * corridor-approach's own lead-in/nudge segment, never meant to
 * independently represent trunk-riding — see _pushBundledApproachLegs) can
 * coincidentally sit within trunk_proximity of an existing trunk's own
 * centerline, exactly like a genuine trunk-riding contribution would. If
 * that short leg happens to be processed first, it steals the match,
 * forcing the REAL, much longer trunk-riding run (processed later, in
 * flow-position order) to spawn its own spurious new trunk instead.
 *
 * Confirmed as a real, PRE-EXISTING bug, independent of any single feature
 * this session: reproduced here with an already-shipped, entirely natural
 * corridorOffset!=0 corridor join (a joiner whose stub lands outside a
 * trunk's own flow bounds, so its lead-in nudge is genuinely long) — no
 * grace-zone/taper mechanism involved at all. It was originally noticed
 * because a LATER taper fix (see lane-assignment.test.js and the
 * project's own memory) made an existing nudge leg long enough to trigger
 * it far more often, but the underlying ordering bug predates that
 * entirely.
 *
 * Fixed in _registerLineSegments: trunk-match candidates are now
 * collected first and matched in LENGTH-DESCENDING order (not positional
 * order) — crossing registration (an entirely separate registry with no
 * "steal the match" concern, since every qualifying run gets its own
 * independent entry) is untouched. Run length is a strictly better signal
 * of "this line genuinely rides this trunk" than "whichever run happened
 * to come first in the polyline."
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRouter, makeLine, runDiscoveryLoop } from './helpers/router-harness.js';

test('a long lead-in nudge no longer steals a trunk match from the real, longer trunk-riding run behind it', () => {
  const router = makeRouter({ trunk_line_spacing: 8 });
  // Creator's own trunk only spans x:200-500.
  const creator = makeLine('line_creator', [200, 100], [500, 100]);
  // Joiner's stub lands at x=50 — OUTSIDE the trunk's flow bounds, so its
  // own entry clamps from 50 to 200: a genuine, long (150px) lead-in nudge
  // leg, well past trunk_min_length (60). Its own natural y (120) sits
  // within trunk_proximity (32, default) of the creator's y=100 — exactly
  // the coincidental-proximity shape that lets the nudge leg compete for
  // the same trunk match as the real trunk-riding run behind it.
  const joiner = makeLine('line_joiner', [50, 120], [500, 120]);
  const { results } = runDiscoveryLoop(router, [creator, joiner]);

  assert.deepEqual(results.get('line_creator').pts, [[200, 100], [500, 100]],
    'creator must be completely unaffected by a joiner that arrives from outside its own flow span');

  const trunk = router._trunks.find(t => t.id === 'trunk:line_creator:0');
  assert.ok(trunk, 'the creator\'s own trunk must still exist');
  assert.ok(trunk.members.has('line_joiner'),
    `the real, long trunk-riding run must match the creator's own trunk, not spawn a separate one: members = ${[...trunk.members.keys()]}`);
  assert.equal(trunk.crossCenter, 100, 'the creator\'s own trunk centerline must be untouched by the joiner');
});

test('creator holds its own centerline even when a joiner\'s own lead-in nudge is long enough to independently qualify for trunk registration', () => {
  // The original trunk-lanes.test.js fixture, at a scale where the
  // joiner's own lead-in nudge (governed by the default corner_radius=34,
  // i.e. stubLengthFor => 68px) is comfortably long enough to independently
  // pass trunk_min_length (60) — the exact shape that exposed this bug via
  // the (separately reverted-then-fixed) grace-zone taper attempt.
  const router = makeRouter({ trunk_line_spacing: 8 });
  const creator = makeLine('line_creator', [50, 100], [500, 100], { corner_radius: 34, corner_style: 'round' });
  const joiner = makeLine('line_joiner', [50, 120], [500, 120], { corner_radius: 34, corner_style: 'round' });
  const { results } = runDiscoveryLoop(router, [creator, joiner]);
  assert.equal(results.get('line_creator').pts[0][1], 100, 'creator stays on its own centerline');
  assert.deepEqual(results.get('line_creator').pts, [[50, 100], [500, 100]],
    'creator must route as a plain, unbundled straight line');
});
