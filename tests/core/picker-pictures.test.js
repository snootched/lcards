/**
 * Card picker pictures (src/utils/picker-picture.js): every card whose picker tile is
 * a picture has its file (made by `npm run picker:pictures`), none is left over, and
 * each picture is used by a card.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PICKER_PICTURES } from '../../src/utils/picker-picture-names.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// the source (the build copies it to custom_components/lcards/images/)
const DIR = join(ROOT, 'src/assets/images/picker');

test('every picker picture exists (npm run picker:pictures), and none is left over', () => {
    for (const name of PICKER_PICTURES) {
        const file = join(DIR, `${name}.webp`);
        assert.ok(existsSync(file), `${name}.webp is missing: run npm run picker:pictures`);
        assert.ok(statSync(file).size > 2000, `${name}.webp looks empty`);
    }
    const extra = readdirSync(DIR).filter((f) => !PICKER_PICTURES.includes(f.replace(/\.webp$/, '')));
    assert.deepEqual(extra, []);
});

test('each picker picture is shown by a card', () => {
    const cards = readdirSync(join(ROOT, 'src/cards')).filter((f) => f.endsWith('.js'))
        .map((f) => readFileSync(join(ROOT, 'src/cards', f), 'utf8')).join('\n');
    for (const name of PICKER_PICTURES) {
        assert.ok(cards.includes(`renderPickerPicture('${name}'`), `no card shows the ${name} picture`);
    }
});
