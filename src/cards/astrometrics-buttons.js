/**
 * The astrometrics card's on-card camera buttons (`camera.buttons`): which
 * buttons show and their grid areas, with `hide: toggle`'s fold button.
 * Pure (no Lit), so it is tested in node.
 *
 * @module cards/astrometrics-buttons
 */

/** On-card camera buttons: command, grid area, label, SVG path (24 x 24) */
export const CAMERA_BUTTONS = {
    pan: [
        ['pan-up', 'up', 'Pan up', 'M6 15l6-6 6 6'],
        ['pan-left', 'left', 'Pan left', 'M15 6l-6 6 6 6'],
        ['pan-right', 'right', 'Pan right', 'M9 6l6 6-6 6'],
        ['pan-down', 'down', 'Pan down', 'M6 9l6 6 6-6']
    ],
    zoom: [
        ['zoom-out', 'zout', 'Zoom out', 'M6 12h12'],
        ['zoom-in', 'zin', 'Zoom in', 'M6 12h12M12 6v12']
    ],
    reset: [['reset', 'reset', 'Reset view', 'M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4']]
};

/** `buttons.hide: toggle`: fold (shown while open) and unfold (a four-way arrow) */
const FOLD_BUTTON = {
    open: ['fold', 'fold', 'Hide camera buttons', 'M7 7l10 10M17 7L7 17'],
    folded: ['unfold', 'fold', 'Show camera buttons', 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3']
};

/** The time slider's stops: how fast the scene's motion runs (0 holds it) */
export const TIME_STOPS = [0, 0.1, 0.25, 0.5, 1, 2, 4];

/**
 * The slider stop nearest a time scale.
 * @param {number} scale
 */
export function timeStop(scale) {
    let best = 0;
    for (let i = 1; i < TIME_STOPS.length; i++) if (Math.abs(TIME_STOPS[i] - scale) < Math.abs(TIME_STOPS[best] - scale)) best = i;
    return best;
}

/** `buttons.hide: idle`: the buttons fade out after this long (ms) without input on the card */
export const BUTTONS_IDLE_MS = 3000;

/**
 * The button grid for `camera.buttons`: which buttons, and the grid areas.
 * With `hide: toggle` a fold button sits in the corner nearest the card's
 * edge (a row of its own); folded, only it shows.
 * @param {any} cfg - `camera.buttons`
 * @param {{ folded?: boolean }} [state]
 * @returns {{ position: string, areas: string, buttons: string[][], hide: 'idle' | 'never' | 'toggle' } | null}
 */
export function cameraButtonLayout(cfg, { folded = false } = {}) {
    if (!cfg) return null;
    const o = cfg === true ? {} : cfg;
    const pan = o.pan !== false;
    const zoom = o.zoom !== false;
    const reset = o.reset !== false;
    const time = o.time !== false;
    const hide = o.hide === 'never' || o.hide === 'toggle' ? o.hide : 'idle';
    const position = typeof o.position === 'string' ? o.position : 'bottom-right';
    /** @type {string[]} */
    const rows = [];
    if (pan) rows.push('". up ."', `"left ${reset ? 'reset' : '.'} right"`, '". down ."');
    if (zoom) rows.push(`"zout ${reset && !pan ? 'reset' : '.'} zin"`);
    if (!pan && !zoom && reset) rows.push('". reset ."');
    if (time) rows.push('"time time time"');
    if (!rows.length) return null;
    const buttons = [...(pan ? CAMERA_BUTTONS.pan : []), ...(zoom ? CAMERA_BUTTONS.zoom : []), ...(reset ? CAMERA_BUTTONS.reset : []), ...(time ? [['time', 'time', 'Time speed', '']] : [])];
    if (hide !== 'toggle') return { position, areas: rows.join(' '), buttons, hide };
    const foldRow = position.endsWith('left') ? '"fold . ."' : position.endsWith('right') ? '". . fold"' : '". fold ."';
    const fold = folded ? FOLD_BUTTON.folded : FOLD_BUTTON.open;
    if (folded) return { position, areas: foldRow, buttons: [fold], hide };
    const areas = position.startsWith('top') ? [foldRow, ...rows] : [...rows, foldRow];
    return { position, areas: areas.join(' '), buttons: [...buttons, fold], hide };
}
