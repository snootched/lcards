/**
 * Device record ownership (custom_components/lcards/device_access.py): the
 * owner is the user signed in on that browser. Any signed-in user may write
 * (a non-admin's write makes them the owner; an admin's write claims only an
 * unowned record); reads are for admins and the current owner. The rules are
 * pure Python with no Home Assistant imports, so this runs them in python3
 * against a table of cases. The WebSocket wiring is the Layer C test in tests/ha/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULE = fileURLToPath(new URL('../../custom_components/lcards/device_access.py', import.meta.url));
const python = spawnSync('python3', ['--version']);

/** Run `expr` (Python, with the module as `m`) for each args list; return the JSON results. */
function run(expr, cases) {
    const script = [
        'import importlib.util, json, sys',
        'spec = importlib.util.spec_from_file_location("device_access", sys.argv[1])',
        'm = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)',
        'cases = json.loads(sys.stdin.read())',
        `print(json.dumps([(lambda a: ${expr})(a) for a in cases]))`,
    ].join('\n');
    const r = spawnSync('python3', ['-I', '-c', script, MODULE], { input: JSON.stringify(cases), encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
}

const OWNED = { owner_user_id: 'alice', display_name: 'Kitchen' };

test('who may read a device record', { skip: python.status !== 0 && 'python3 not available' }, () => {
    // [record, user_id, is_admin, owner_exists, expected]
    const cases = [
        [null, 'bob', false, true, true],                       // new device: reads empty
        [{}, 'bob', false, true, true],                         // empty record
        [{ display_name: 'Old' }, 'bob', false, true, true],    // written before owners existed
        [OWNED, 'alice', false, true, true],                    // the current owner
        [OWNED, 'bob', false, true, false],                     // another non-admin
        [OWNED, 'bob', true, true, true],                       // an admin
        [OWNED, 'bob', false, false, true],                     // the owner user was deleted
        [{ owner_user_id: '' }, 'bob', false, true, true],      // a blank owner is no owner
        ['not a dict', 'bob', false, true, true],
    ];
    const got = run('m.device_read_allowed(a[0], a[1], a[2], a[3])', cases);
    assert.deepEqual(got, cases.map((c) => c[4]));
});

test('a device write makes a non-admin the owner; an admin only claims an unowned record; the client never sets it', { skip: python.status !== 0 && 'python3 not available' }, () => {
    // [record, data, user_id, is_admin, owner_exists, expected]
    const cases = [
        [null, { display_name: 'Tablet' }, 'bob', false, true, { display_name: 'Tablet', owner_user_id: 'bob' }],
        [{ display_name: 'Old' }, { last_seen: 't' }, 'bob', false, true, { last_seen: 't', owner_user_id: 'bob' }],
        [OWNED, { last_seen: 't' }, 'alice', false, true, { last_seen: 't', owner_user_id: 'alice' }],
        [OWNED, { last_seen: 't' }, 'bob', false, true, { last_seen: 't', owner_user_id: 'bob' }],          // kiosk: the next user takes it
        [OWNED, { last_seen: 't', owner_user_id: 'mallory' }, 'bob', false, true, { last_seen: 't', owner_user_id: 'bob' }],
        [OWNED, { sound_volume: 0.5 }, 'admin', true, true, { sound_volume: 0.5 }],                        // admin edits a kiosk: owner kept
        [null, { display_name: 'Admin PC' }, 'admin', true, true, { display_name: 'Admin PC', owner_user_id: 'admin' }],
        [OWNED, { last_seen: 't' }, 'admin', true, false, { last_seen: 't', owner_user_id: 'admin' }],     // owner deleted
        [OWNED, { owner_user_id: 'mallory' }, 'admin', true, true, {}],
    ];
    const got = run('m.device_write_data(a[0], a[1], a[2], a[3], a[4])', cases);
    assert.deepEqual(got, cases.map((c) => c[5]));
});
