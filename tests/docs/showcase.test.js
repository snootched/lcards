/**
 * The showcase video's dashboard (doc/gallery/showcase/, scripts/marketing-video.mjs).
 * Unlike the gallery it reads real sensors of the dev HA, so it is held to the list
 * below (room names only, nothing personal). Its motion file never calls a service
 * on them: their changes are `state` steps (fake states in HA's state machine, put
 * back after recording), and services only reach lcards_test_* helpers and lcards.*.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { validateTexts } from '../../scripts/lcards-validate.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIR = join(ROOT, 'doc/gallery/showcase');
const dashboard = readFileSync(join(DIR, 'showcase.yaml'), 'utf8');
const motion = yaml.load(readFileSync(join(DIR, 'showcase.motion.yaml'), 'utf8'));

/** The dev HA's real entities the showcase may read (and fake in the motion file). */
const REAL = new Set([
    'light.living_room_overhead', 'light.kitchen_overhead', 'light.desk', 'light.front_door',
    'binary_sensor.back_door_contact', 'binary_sensor.entryway_motion',
    'sensor.office_sensor_temperature', 'sensor.office_sensor_humidity',
    'sensor.living_room_sensor_temperature', 'sensor.living_room_sensor_humidity',
    'sensor.bedroom_sensor_temperature', 'sensor.bedroom_sensor_humidity',
    'sensor.bathroom_sensor_temperature', 'sensor.bathroom_sensor_humidity',
    'sensor.patio_sensor_temperature', 'sensor.patio_sensor_humidity',
]);
const ENTITY = /\b(input_boolean|input_number|input_select|input_text|sensor|binary_sensor|light|switch|lock|camera|climate|media_player|cover|fan|alarm_control_panel|weather|person|device_tracker)\.([a-z0-9_]+)/g;
const SERVICES = new Set(['increment', 'decrement', 'set_value', 'select_option', 'toggle', 'turn_on', 'turn_off']);

test('showcase: valid config, no warnings', async () => {
    const issues = await validateTexts([{ name: 'showcase.yaml', text: dashboard }]);
    assert.deepEqual(issues.map(i => `${i.severity} ${i.path}: ${i.message}`), []);
});

test('showcase: only lcards_test_* helpers and the listed sensors', () => {
    const used = [...dashboard.matchAll(ENTITY)].filter(([, , id]) => !SERVICES.has(id)).map(m => m[0]);
    const other = used.filter(id => !id.split('.')[1].startsWith('lcards_test_') && !REAL.has(id));
    assert.deepEqual([...new Set(other)], []);
});

test('showcase: every card waits for a stage and its real-entity buttons do not act', () => {
    const view = yaml.load(dashboard).views[0];
    for (const card of view.cards.filter(c => c.type !== 'custom:lcards-alert-overlay')) {
        assert.equal(card.visibility?.[0]?.entity, 'input_number.lcards_test_stage', `${card.type} has no stage condition`);
    }
    const walk = (c) => [c, ...(c.cards ?? []).flatMap(walk)];
    for (const card of view.cards.flatMap(walk)) {
        if (REAL.has(card.entity)) assert.equal(card.tap_action?.action, 'more-info', `${card.entity} must not toggle`);
    }
});

test('showcase motion: services on helpers and lcards.* only; real entities only faked', () => {
    const steps = [...(motion.before ?? []), ...(motion.steps ?? [])];
    for (const step of steps) {
        if (step.service) {
            const [domain, , data] = step.service;
            if (domain === 'lcards') continue;
            assert.match(String(data?.entity_id ?? ''), /^[a-z_]+\.lcards_test_[a-z_]+$/, JSON.stringify(step));
        }
        if (step.state) assert.ok(REAL.has(step.state[0]), `state step on ${step.state[0]}`);
    }
    assert.ok(steps.filter(s => s.mark).length >= 5, 'has caption marks');
});

test('showcase: the docs hero exists', () => {
    for (const ext of ['webm', 'mp4', 'webp']) {
        assert.ok(existsSync(join(ROOT, `doc/public/gallery/showcase.${ext}`)), `run npm run video:showcase (doc/public/gallery/showcase.${ext} missing)`);
    }
});
