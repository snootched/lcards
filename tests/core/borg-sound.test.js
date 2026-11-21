/**
 * Borg sounds (F2): assimilate/deassimilate play their sound event through the
 * scheme by default, a `sound` option plays that file instead, `none` is silent;
 * SoundManager plays URLs as they are.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BorgAssimilationManager } from '../../src/core/borg/BorgAssimilationManager.js';
import { SoundManager, SOUND_EVENT_LABELS } from '../../src/core/sound/SoundManager.js';

/** @type {{ play: string[], source: [string, string][] }} */
let calls;

beforeEach(() => {
    calls = { play: [], source: [] };
    window.lcards = {
        core: {
            soundManager: {
                play: (e) => calls.play.push(e),
                playSource: (s, e) => calls.source.push([s, e]),
            },
        },
    };
});

/** Assimilate with no theme or screen effects, then deassimilate. */
async function run(assimilateOpts, deassimilateOpts) {
    const bam = new BorgAssimilationManager();
    await bam.assimilate({ fontSwap: false, persistentLayers: {}, ...assimilateOpts });
    await bam.deassimilate({ withOutro: false, ...deassimilateOpts });
}

test('by default the sound events play through the scheme', async () => {
    await run({}, {});
    assert.deepEqual(calls.play, ['borg_assimilate', 'borg_deassimilate']);
    assert.deepEqual(calls.source, []);
});

test('a sound option plays that file under the event', async () => {
    await run({ sound: '/local/sounds/borg.mp3' }, { sound: 'media-source://media_source/local/restore.mp3' });
    assert.deepEqual(calls.play, []);
    assert.deepEqual(calls.source, [
        ['/local/sounds/borg.mp3', 'borg_assimilate'],
        ['media-source://media_source/local/restore.mp3', 'borg_deassimilate'],
    ]);
});

test('sound: none is silent', async () => {
    await run({ sound: 'none' }, { sound: 'none' });
    assert.deepEqual(calls, { play: [], source: [] });
});

test('the Borg events are alert sounds with labels', () => {
    assert.equal(SOUND_EVENT_LABELS.borg_assimilate, 'Borg assimilation');
    assert.equal(SOUND_EVENT_LABELS.borg_deassimilate, 'Borg deassimilation');
    const sm = new SoundManager();
    const events = Object.fromEntries(sm.getEventTypes().map(e => [e.key, e.category]));
    assert.equal(events.borg_assimilate, 'alerts');
    assert.equal(events.borg_deassimilate, 'alerts');
});

test('a URL plays as is; playSource respects the category switch', () => {
    const played = [];
    const OrigAudio = globalThis.Audio;
    globalThis.Audio = class { constructor(url) { this.src = url; played.push(url); } play() { return Promise.resolve(); } };
    try {
        const sm = new SoundManager();
        let alertsOn = true;
        sm._isEnabled = () => true;
        sm._isCategoryEnabled = () => alertsOn;
        sm._getVolume = () => 1;
        sm.playSource('/local/sounds/borg.mp3', 'borg_assimilate');
        sm.playSource('https://example.com/a.mp3', 'borg_assimilate');
        alertsOn = false;
        sm.playSource('/local/sounds/other.mp3', 'borg_assimilate');
        assert.deepEqual(played, ['/local/sounds/borg.mp3', 'https://example.com/a.mp3']);
    } finally {
        globalThis.Audio = OrigAudio;
    }
});

test('lcards.play_sound offers every sound event the page knows (the Borg events were missing)', async () => {
    const fs = await import('node:fs');
    const py = fs.readFileSync(new URL('../../custom_components/lcards/services.py', import.meta.url), 'utf8');
    const yaml = fs.readFileSync(new URL('../../custom_components/lcards/services.yaml', import.meta.url), 'utf8');
    const block = /_SOUND_EVENT_TYPES = \[([\s\S]*?)\]/.exec(py)?.[1] ?? '';
    const pyEvents = [...block.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).sort();
    const sm = new SoundManager();
    const pageEvents = sm.getEventTypes().map((e) => e.key).sort();
    assert.deepEqual(pyEvents, pageEvents);
    const playSound = yaml.slice(yaml.indexOf('\nplay_sound:'), yaml.indexOf('\n', yaml.indexOf('asset_key:', yaml.indexOf('\nplay_sound:'))));
    for (const e of pageEvents) assert.match(playSound, new RegExp(`value: ${e}\\b`), `services.yaml play_sound offers ${e}`);
});
