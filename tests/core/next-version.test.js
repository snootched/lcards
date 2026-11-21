import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion } from '../../scripts/lib/next-version.js';

const nov = new Date(2026, 10, 21);
const dec = new Date(2026, 11, 2);

test('dev bumps: next -dev.N, -dev.1 on the next base, an old-style suffix', () => {
    assert.equal(nextVersion('2026.11.0-dev.3', { dev: true, now: nov }), '2026.11.0-dev.4');
    assert.equal(nextVersion('2026.11.0', { dev: true, now: nov }), '2026.11.1-dev.1');
    assert.equal(nextVersion('2026.11.0', { dev: true, now: dec }), '2026.12.0-dev.1');
    assert.equal(nextVersion('2026.09.1-dev3', { dev: true, now: nov }), '2026.09.1-dev.1');
});

test('stable bumps: promote a dev build, or advance SEQ (reset on a new month)', () => {
    assert.equal(nextVersion('2026.11.0-dev.3', { now: nov }), '2026.11.0');
    assert.equal(nextVersion('2026.11.0', { now: nov }), '2026.11.1');
    assert.equal(nextVersion('2026.11.0', { now: dec }), '2026.12.0');
});

test('a target base: next release right after a stable one, still in the old month', () => {
    assert.equal(nextVersion('2026.11.0', { dev: true, target: '2026.12.0', now: nov }), '2026.12.0-dev.1');
    assert.equal(nextVersion('2026.11.0', { target: '2026.12.0', now: nov }), '2026.12.0');
    // on that base's dev builds, the target is the usual bump
    assert.equal(nextVersion('2026.12.0-dev.1', { dev: true, target: '2026.12.0', now: nov }), '2026.12.0-dev.2');
});

test('a target must be a later YYYY.MM.SEQ', () => {
    assert.throws(() => nextVersion('2026.11.0', { dev: true, target: '2026.11.0', now: nov }), /not after/);
    assert.throws(() => nextVersion('2026.11.0', { dev: true, target: '2026.10.5', now: nov }), /not after/);
    assert.throws(() => nextVersion('2026.11.0', { dev: true, target: '2026.12', now: nov }), /YYYY\.MM\.SEQ/);
    assert.throws(() => nextVersion('banana', { dev: true }), /YYYY\.MM\.SEQ/);
});
