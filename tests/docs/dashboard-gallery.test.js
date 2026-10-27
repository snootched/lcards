/**
 * Dashboard gallery (doc/gallery/dashboards/*.yaml, doc/getting-started/dashboard-gallery.md):
 * every dashboard is valid LCARdS config with no warnings, uses only the lcards_test_*
 * helpers (plus the sample temperature sensor; the dev HA's other entities carry
 * personal names), and has its recording (looping video, still as poster) and its
 * place on the gallery page. The motion files (doc/gallery/motion/*.yaml, the state
 * changes played while recording) touch only those helpers and lcards.* actions.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTexts } from '../../scripts/lcards-validate.mjs';
import yaml from 'js-yaml';
import { disallowedEntities } from '../helpers/allowed-entities.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIR = join(ROOT, 'doc/gallery/dashboards');
const dashboards = readdirSync(DIR).filter(f => f.endsWith('.yaml')).sort();
const page = readFileSync(join(ROOT, 'doc/getting-started/dashboard-gallery.md'), 'utf8');


test('there are gallery dashboards', () => {
    assert.ok(dashboards.length >= 5, dashboards.join(', '));
});

for (const file of dashboards) {
    const name = file.replace(/\.yaml$/, '');
    test(`${name}: valid config, no warnings`, async () => {
        const issues = await validateTexts([{ name: file, text: readFileSync(join(DIR, file), 'utf8') }]);
        assert.deepEqual(issues.map(i => `${i.severity} ${i.path}: ${i.message}`), []);
    });

    test(`${name}: only lcards_test_* helpers and the sample sensor`, () => {
        const text = readFileSync(join(DIR, file), 'utf8');
        assert.deepEqual(disallowedEntities(text, ['sensor.desk_sensor_temperature']), []);
    });

    test(`${name}: recording exists and the page shows it with its YAML`, () => {
        for (const ext of ['webp', 'webm']) {
            assert.ok(existsSync(join(ROOT, `doc/public/gallery/${name}.${ext}`)), `run npm run gallery:shots (doc/public/gallery/${name}.${ext} missing)`);
        }
        assert.ok(existsSync(join(ROOT, `doc/gallery/motion/${file}`)), `no motion file doc/gallery/motion/${file}`);
        assert.ok(page.includes(`src="/gallery/${name}.webm" poster="/gallery/${name}.webp"`), `page has no video for ${name}`);
        assert.ok(page.includes(`<<< @/gallery/dashboards/${file}`), `page does not include ${file}`);
    });
}

const MOTION = join(ROOT, 'doc/gallery/motion');
for (const file of readdirSync(MOTION).filter(f => f.endsWith('.yaml'))) {
    test(`motion ${file}: only lcards_test_* helpers and lcards.* actions`, () => {
        const motion = yaml.load(readFileSync(join(MOTION, file), 'utf8'));
        const steps = [...(motion.before ?? []), ...(motion.steps ?? [])];
        assert.ok(steps.length, 'has steps');
        for (const step of steps.filter(s => s.service)) {
            const [domain, , data] = step.service;
            if (domain === 'lcards') continue;
            assert.match(String(data?.entity_id ?? ''), /^[a-z_]+\.lcards_test_[a-z_]+$/, JSON.stringify(step));
        }
    });
}
