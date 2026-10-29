/**
 * The Borg face GLSL is shared between the screen effect's WebGL worker and
 * the astrometrics cube (E8). The worker, assembled from its file and the
 * shared block, must stay byte-identical to the worker before the split.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { withBorgFace, BORG_FACE_GLSL } from '../../src/core/screen-effects/effects/borg-face-glsl.js';

/** sha256 of BorgAssimilationGLWorker.js at 568855c1, before the face GLSL moved out */
const BEFORE = '968865cc939296620cfc80c57df4ac516d49d9759ffbed2bebf10eb8a355ad2c';

test('the assembled Borg worker is byte-identical to the worker before the split', () => {
  const src = readFileSync(new URL('../../src/core/screen-effects/effects/BorgAssimilationGLWorker.js', import.meta.url), 'utf8');
  const assembled = withBorgFace(src);
  assert.equal(createHash('sha256').update(assembled).digest('hex'), BEFORE);
  assert.ok(!src.includes('float reliefDepth('), 'the worker file no longer carries its own copy');
});

test('the shared block has the face functions the cube uses', () => {
  for (const fn of ['float boxHit(', 'float reliefDepth(', 'int outsideAxis(', 'float lattice(', 'vec4 greebleLayer(', 'const float DEPTH']) {
    assert.ok(BORG_FACE_GLSL.includes(fn), fn);
  }
});
