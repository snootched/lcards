/**
 * The astrometrics loading ring (shown over the scene while model files
 * load): what it says, and that it waits a moment before showing.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { ringState, createLoadingRing, RING_DELAY_MS } = await import('../../src/core/astrometrics/loading-ring.js');

test('ring text: percent with sizes, MB without, preparing while parsed, several models', () => {
  assert.deepEqual(ringState([{ loaded: 50, total: 200 }]), { fraction: 0.25, text: 'Loading model 25%' });
  assert.deepEqual(ringState([{ loaded: 3 * 1048576, total: 0 }]), { fraction: null, text: 'Loading model 3.0 MB' });
  assert.deepEqual(ringState([{ loaded: -1, total: 200 }]), { fraction: null, text: 'Preparing model' });
  // started, nothing yet
  assert.deepEqual(ringState([{ loaded: 0, total: 0 }]), { fraction: null, text: 'Loading model' });
  // one parsed, one downloading: the download
  assert.equal(ringState([{ loaded: -1, total: 200 }, { loaded: 100, total: 400 }]).text, 'Loading 2 models 25%');
  // more bytes than the size said (a compressed response): no percent
  assert.equal(ringState([{ loaded: 300, total: 200 }]).fraction, null);
});

test('the ring shows once a load has taken a moment, and goes when it is done', async () => {
  const wrap = document.createElement('div');
  document.body.append(wrap);
  const ring = createLoadingRing(wrap);
  ring.progress('a', 10, 100);
  assert.equal(ring.state().visible, false, 'not at once (a small file would flash it)');
  await new Promise((r) => setTimeout(r, RING_DELAY_MS + 50));
  assert.deepEqual(ring.state(), { visible: true, text: 'Loading model 10%' });
  ring.progress('a', 60, 100);
  assert.equal(ring.state().text, 'Loading model 60%');
  ring.done('a');
  assert.equal(ring.state().visible, false);
  // a load done before the delay never shows
  ring.progress('b', 10, 100);
  ring.done('b');
  await new Promise((r) => setTimeout(r, RING_DELAY_MS + 50));
  assert.equal(ring.state().visible, false);
  ring.dispose();
  assert.equal(wrap.querySelector('.astro-loading'), null);
});
