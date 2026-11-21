/**
 * The routing lab (2026-11-19): small MSD scenes, one routing situation each, used
 * twice. scripts/make-routing-lab.mjs writes them as the dev board's
 * `msd-routing-lab` view (demo/views/msd-routing-lab.yaml) to look at, and
 * tests/routing/routing-lab.test.js routes the same scenes through RouterCore and
 * checks the general rules on every one: lines don't touch or cross unless the scene
 * says so, discovery settles, no reversals, diagonals or self-crossings, nested
 * corners widen from the inside out.
 *
 * Endpoints are named points (with explicit sides where a scene needs them), so the
 * node harness routes exactly what the card draws.
 *
 * Scene keys: id, title, expect (what it should look like, shown on the view),
 * viewBox, routing (msd.routing), channels (msd.channels), obstacles
 * ({ id, at: centre, size, label }), lines ({ id, from, to, ...line keys }),
 * checks ({ crossings: { 'a|b': n }, nested: [[outer, ..., inner]], known: 'why' }).
 */

const W = 3;

/** @type {any[]} */
export const LAB_SCENES = [
    {
        id: 'lab_comb_in',
        title: 'Converging lines',
        expect: 'Four lines from rows far apart to points close together on the right: each steps across to its own point clear of the others, the lowest under the obstacle.',
        viewBox: [0, 0, 600, 300],
        routing: { trunk_line_spacing: 10, clearance: 10 },
        obstacles: [{ id: 'ob', at: [330, 170], size: [140, 70], label: 'OBSTACLE' }],
        lines: [
            { id: 'a', from: [40, 50], to: [560, 40], anchor_side: 'right', attach_side: 'left' },
            { id: 'b', from: [40, 120], to: [560, 60], anchor_side: 'right', attach_side: 'left' },
            { id: 'c', from: [40, 190], to: [560, 80], anchor_side: 'right', attach_side: 'left' },
            { id: 'd', from: [40, 260], to: [560, 100], anchor_side: 'right', attach_side: 'left' },
        ],
        checks: {},
    },
    {
        id: 'lab_fan_out',
        title: 'Fan out into a row',
        expect: 'Three lines run together, then turn down into a row of points, each clear of the next; no outer turn tighter than the one inside it.',
        viewBox: [0, 0, 600, 300],
        routing: { trunk_line_spacing: 10 },
        lines: [
            { id: 'a', from: [40, 50], to: [540, 220], anchor_side: 'right', attach_side: 'top' },
            { id: 'b', from: [40, 60], to: [510, 220], anchor_side: 'right', attach_side: 'top' },
            { id: 'c', from: [40, 70], to: [480, 220], anchor_side: 'right', attach_side: 'top' },
        ],
        checks: { nested: [['a', 'b', 'c']] },
    },
    {
        id: 'lab_l_turn',
        title: 'A bundle turning a corner',
        expect: 'Three lines run right, turn down together and stay in their lanes round the bend, the corners nested.',
        viewBox: [0, 0, 600, 300],
        routing: { trunk_line_spacing: 12 },
        lines: [
            { id: 'a', from: [40, 40], to: [460, 280], anchor_side: 'right', attach_side: 'top' },
            { id: 'b', from: [40, 60], to: [440, 280], anchor_side: 'right', attach_side: 'top' },
            { id: 'c', from: [40, 80], to: [420, 280], anchor_side: 'right', attach_side: 'top' },
        ],
        checks: { nested: [['a', 'b', 'c']], known: 'B is pulled 8 units into C\'s trunk lane though its own row already clears both neighbours: a pointless step near its start' },
    },
    {
        id: 'lab_cross_bundles',
        title: 'Two bundles crossing',
        expect: 'A horizontal bundle and a vertical bundle cross once each, square, and nowhere else.',
        viewBox: [0, 0, 600, 300],
        routing: { trunk_line_spacing: 10 },
        lines: [
            { id: 'h1', from: [40, 130], to: [560, 130], anchor_side: 'right', attach_side: 'left' },
            { id: 'h2', from: [40, 145], to: [560, 145], anchor_side: 'right', attach_side: 'left' },
            { id: 'h3', from: [40, 160], to: [560, 160], anchor_side: 'right', attach_side: 'left' },
            { id: 'v1', from: [280, 20], to: [280, 280], anchor_side: 'bottom', attach_side: 'top' },
            { id: 'v2', from: [300, 20], to: [300, 280], anchor_side: 'bottom', attach_side: 'top' },
            { id: 'v3', from: [320, 20], to: [320, 280], anchor_side: 'bottom', attach_side: 'top' },
        ],
        checks: {
            crossings: Object.fromEntries(['h1', 'h2', 'h3'].flatMap(h => ['v1', 'v2', 'v3'].map(v => [`${h}|${v}`, 1]))),
            known: 'H2 and H3 run 15 apart and are pulled into 10-apart lanes and back: a small step at each end',
        },
    },
    {
        id: 'lab_forced_channel',
        title: 'A forced channel',
        expect: 'The orange lines are forced through the band and run in its lanes; the blue line routes freely and stays clear of them.',
        viewBox: [0, 0, 600, 300],
        channels: { bus: { bounds: [200, 120, 220, 30], mode: 'force', direction: 'horizontal', line_spacing: 10 } },
        lines: [
            { id: 'f1', from: [40, 40], to: [560, 260], anchor_side: 'right', attach_side: 'left', route_channels: ['bus'], color: 'var(--lcards-orange)' },
            { id: 'f2', from: [40, 260], to: [560, 40], anchor_side: 'right', attach_side: 'left', route_channels: ['bus'], color: 'var(--lcards-orange)' },
            { id: 'free', from: [40, 200], to: [560, 200], anchor_side: 'right', attach_side: 'left' },
        ],
        checks: { crossings: { 'f1|free': 1, 'f2|free': 1, 'f1|f2': 1 } },
    },
    {
        id: 'lab_obstacles',
        title: 'Round two obstacles',
        expect: 'Each line finds its own way between and round the two blocks, keeping clear of them and of each other.',
        viewBox: [0, 0, 600, 300],
        routing: { clearance: 12 },
        obstacles: [
            { id: 'o1', at: [220, 110], size: [90, 120], label: 'BLOCK 1' },
            { id: 'o2', at: [400, 190], size: [90, 120], label: 'BLOCK 2' },
        ],
        lines: [
            { id: 'a', from: [40, 60], to: [560, 250], anchor_side: 'right', attach_side: 'left' },
            { id: 'b', from: [40, 250], to: [560, 60], anchor_side: 'right', attach_side: 'left' },
        ],
        checks: { crossings: { 'a|b': 1 } },
    },
    {
        id: 'lab_spacing_tight',
        title: 'Tight lanes (6 apart)',
        expect: 'The same converging bundle with lanes 6 apart: close, but every line still clear of the next.',
        viewBox: [0, 0, 600, 200],
        routing: { trunk_line_spacing: 6 },
        lines: [
            { id: 'a', from: [40, 30], to: [560, 90], anchor_side: 'right', attach_side: 'left' },
            { id: 'b', from: [40, 90], to: [560, 100], anchor_side: 'right', attach_side: 'left' },
            { id: 'c', from: [40, 150], to: [560, 110], anchor_side: 'right', attach_side: 'left' },
        ],
        checks: {},
    },
    {
        id: 'lab_spacing_wide',
        title: 'Wide lanes (20 apart)',
        expect: 'The same bundle with lanes 20 apart: clearly separate lanes, the bends still smooth.',
        viewBox: [0, 0, 600, 200],
        routing: { trunk_line_spacing: 20 },
        lines: [
            { id: 'a', from: [40, 30], to: [560, 80], anchor_side: 'right', attach_side: 'left' },
            { id: 'b', from: [40, 90], to: [560, 100], anchor_side: 'right', attach_side: 'left' },
            { id: 'c', from: [40, 150], to: [560, 120], anchor_side: 'right', attach_side: 'left' },
        ],
        checks: {},
    },
    {
        id: 'lab_radii',
        title: 'Corner radius 10, 34 and 60',
        expect: 'Three separate lines with the same shape and different corner_radius: small, default and large rounded corners.',
        viewBox: [0, 0, 600, 300],
        lines: [
            { id: 'r10', from: [40, 40], to: [180, 260], anchor_side: 'right', attach_side: 'top', corner_radius: 10 },
            { id: 'r34', from: [220, 40], to: [380, 260], anchor_side: 'right', attach_side: 'top', corner_radius: 34 },
            { id: 'r60', from: [420, 40], to: [580, 260], anchor_side: 'right', attach_side: 'top', corner_radius: 60 },
        ],
        checks: {},
    },
    {
        id: 'lab_stacked_targets',
        title: 'Targets stacked on one vertical',
        expect: 'Four lines to points one above the other, reached from above: known limitation, the lines come down onto the points together.',
        viewBox: [0, 0, 600, 300],
        routing: { trunk_line_spacing: 10, clearance: 10 },
        obstacles: [{ id: 'ob', at: [300, 150], size: [140, 70], label: 'OBSTACLE' }],
        lines: [
            { id: 'a', from: [105, 50], to: [570, 110], anchor_side: 'right' },
            { id: 'b', from: [105, 115], to: [570, 135], anchor_side: 'right' },
            { id: 'c', from: [105, 185], to: [570, 160], anchor_side: 'right' },
            { id: 'd', from: [105, 250], to: [570, 185], anchor_side: 'right' },
        ],
        checks: { known: 'every line descends one shared vertical onto points stacked on it' },
    },
];

/** Line colours, in turn */
export const LAB_COLORS = ['var(--lcards-blue)', 'var(--lcards-orange)', 'var(--lcards-moonlight)', 'var(--lcards-blue-light)', 'var(--lcards-orange-light)', 'var(--lcards-gray-medium-light)'];

export const LAB_LINE_WIDTH = W;
