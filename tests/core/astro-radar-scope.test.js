/**
 * G1: the Radar scope starter. The sweep is a fan of lines from the centre to points riding
 * one spinning ring; it turns clockwise seen from above (a negative spin), so the fainter
 * lines trail behind the leading one (at smaller bearings). Every reference resolves.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import radarScope from '../../src/core/astrometrics/starters/scene-radar-scope.js';
import { STARTERS } from '../../src/core/astrometrics/starters/index.js';

test('the radar scope is a starter: a clockwise sweep with a trailing afterglow, contacts, range labels', () => {
  assert.ok(STARTERS.includes(radarScope));
  const f = radarScope.build({ speed: 45 });
  const ring = f.objects.find((o) => o.id === 'sweep_ring');
  assert.equal(ring.spin, -45, 'clockwise seen from above');
  assert.equal(ring.opacity, 0, 'the ring it rides is unseen');
  const fan = f.points.filter((p) => /^sweep_\d+$/.test(p.id));
  const lines = f.objects.filter((o) => /^sweep_line_\d+$/.test(o.id));
  assert.equal(fan.length, lines.length);
  for (let i = 0; i < fan.length; i++) {
    assert.equal(fan[i].object, 'sweep_ring');
    assert.equal(lines[i].from, 'centre');
    assert.equal(lines[i].to, fan[i].id);
    // behind the leading line (a smaller bearing) and fainter
    if (i > 0) {
      assert.ok(fan[i].polar[1] < fan[i - 1].polar[1], `${fan[i].id} trails`);
      assert.ok(lines[i].opacity < lines[i - 1].opacity, `${lines[i].id} is fainter`);
    }
  }
  assert.equal(f.points.filter((p) => /^contact_\d+$/.test(p.id)).length, 3);
  assert.deepEqual(f.points.filter((p) => /^range_\d+$/.test(p.id)).map((p) => p.label), ['25', '50', '75', '100']);
  const ids = new Set([...f.points.map((p) => p.id), ...f.objects.map((o) => o.id).filter(Boolean)]);
  for (const o of f.objects) for (const k of ['at', 'from', 'to', 'object']) if (typeof o[k] === 'string') assert.ok(ids.has(o[k]), `${o.id}.${k}`);
  for (const p of f.points) if (typeof p.object === 'string') assert.ok(ids.has(p.object), `${p.id}.object`);
  // the default speed
  assert.equal(radarScope.build({}).objects.find((o) => o.id === 'sweep_ring').spin, -60);
});
