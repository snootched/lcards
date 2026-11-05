/**
 * Astrometrics Card Schema
 *
 * A 3D scene (grids, volumes, globes, orbits, routes, the sky) with named
 * points that carry labels and markers. Scene units are free (pick a scale:
 * a galaxy disc of radius 100, a dome of radius 100); widths, dashes and
 * label sizes are CSS px. Bearings: 0 is north (away from the default
 * camera), clockwise seen from above.
 *
 * `objects[]` is one branch per `type` (`type` is a const in each), so the
 * validator and the published schema know which keys each type takes.
 * "Exactly one placement form per point" and references to point, object
 * and view ids are checked in scripts/lib/config-validator.js.
 *
 * Runtime: src/core/astrometrics/ (lazy). Names: src/core/astrometrics/names.js.
 *
 * @see doc/cards/astrometrics/
 */

import {
    actionSchema, simpleColorSchema, backgroundAnimationSchema, gridOptionsSchema, cardIdSchema, tagsSchema,
    cardHeightSchema, cardWidthSchema, cardMinHeightSchema, cardMinWidthSchema, cardMaxHeightSchema,
    cardMaxWidthSchema, cardZIndexSchema, rulesSchema, soundsSchema, stateColorSchema, textFieldProperties, entitySchema,
    stateClassificationSchema, triggersUpdateSchema, dataSourcesSchema
} from './common-schemas.js';
import {
    OBJECT_TYPES, GRID_SHAPES, GRID_PATTERNS, VOLUME_SHAPES, NEBULA_SHAPES, NEBULA_PRESETS, COLUMN_KINDS, LIGHTNING_MODES, IMAGE_SHAPES, MARKERS, LABEL_STYLE_NAMES, SKY_BODIES, BODY_NAMES, FILL_EFFECTS, FILL_PRESETS, MODEL_MATERIALS,
    WELL_SHAPE_NAMES, DEFORM_TYPES, BEND_MOTIONS, DEFORM_ANCHORS, UNIT_NAMES, FILE_UNIT_NAMES, COMET_ACTIVITY, CUBE_SHAPES
} from '../../core/astrometrics/names.js';
import { LABEL_POSITION_NAMES, LABEL_OMITTED_KEYS } from '../../core/astrometrics/label-text.js';
import { RATE_PATTERN } from '../../core/astrometrics/clock.js';

// ── Small building blocks ────────────────────────────────────────────────────

/** @param {string} description @param {object} [extra] */
const number = (description, extra = {}) => ({ type: 'number', description, ...extra });

/**
 * Follow an entity instead of holding a number (R4b): one shared definition,
 * so the published schema keeps it once ($defs).
 */
const settingBinding = {
    type: 'object',
    required: ['entity'],
    additionalProperties: false,
    description: 'Follow an entity: its state (or attribute) mapped from input to output (the map_range keys used across LCARdS), held at the ends. A missing or non-numeric value leaves the default.',
    properties: {
        entity: { type: 'string', pattern: '^[a-z_]+\\.[a-z0-9_]+$', description: 'The entity to follow.' },
        attribute: { type: 'string', description: 'Read this attribute instead of the state.' },
        input: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2, description: '[low, high] of the entity\'s value. Default the entity\'s min and max attributes (an input_number), else 0 to 100.' },
        output: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2, description: '[low, high] of the setting the input maps to. Leave out to use the entity\'s number as it is.' },
        clamp: { type: 'boolean', default: true, description: 'false: a value outside input carries on past the ends of output (default true: held at the ends).' },
        smooth: { type: 'number', minimum: 0, description: 'opacity, radius, size and spin ease to a new value over this many ms (default 600; 0 steps). Other keys step.' }
    }
};

/** A template for a number: JavaScript, Jinja2 or a token */
const settingTemplate = {
    type: 'string',
    // only templates: a stray word ('tilted') is still an error
    pattern: '\\[\\[\\[|\\{\\{|\\{[A-Za-z_]',
    description: 'A template that gives the number: [[[ return ... ]]], {{ ... }} or {entity.state}.'
};

/**
 * A number or [a, b] on an object: the one number can follow an entity or a
 * template, and so can either side of the pair on its own (a belt's inner and
 * outer radius each from an entity; a bound side rebuilds the object).
 * @param {string} description
 */
const settingOrPair = (description) => ({
    description,
    anyOf: [
        { type: 'number' },
        { type: 'array', items: { anyOf: [{ type: 'number' }, settingBinding, settingTemplate] }, minItems: 2, maxItems: 2 },
        settingBinding,
        settingTemplate
    ]
});

/**
 * A number on a point or object that can follow an entity or a template
 * (bindings.js). Limits apply to the plain number; description and default
 * stay at the top for the editor and docs.
 * @param {string} description
 * @param {Record<string, any>} [extra]
 */
const setting = (description, extra = {}) => {
    const { default: def, 'x-ui-hints': hints, ...limits } = extra;
    return {
        description,
        anyOf: [{ type: 'number', ...limits }, settingBinding, settingTemplate],
        ...(def !== undefined ? { default: def } : {}),
        ...(hints ? { 'x-ui-hints': hints } : {})
    };
};

/**
 * A whole number (how many of something) that can follow an entity or a
 * template, as setting() does; a bound value is rounded (WHOLE_NUMBER_KEYS in
 * names.js, bindings.js roundedSetting).
 * @param {string} description
 * @param {Record<string, any>} [extra] - limits and the default
 */
const wholeSetting = (description, extra = {}) => {
    const { default: def, ...limits } = extra;
    return {
        description,
        anyOf: [{ type: 'integer', ...limits }, settingBinding, settingTemplate],
        ...(def !== undefined ? { default: def } : {})
    };
};

/**
 * A random range [low, high] of opacities, 0 to 1: each star, particle or
 * cloud gets its own value between them (seeded). Items may be settings.
 * @param {string} description
 * @param {[number, number]} def
 * @param {boolean} [bindable]
 */
const brightness = (description, def, bindable = false) => ({
    type: 'array',
    minItems: 2,
    maxItems: 2,
    items: bindable ? setting('A brightness, 0 to 1.', { minimum: 0, maximum: 1 }) : { type: 'number', minimum: 0, maximum: 1 },
    default: def,
    description
});

/** @param {number} n @param {string} description */
const tuple = (n, description) => ({
    type: 'array', items: { type: 'number' }, minItems: n, maxItems: n, description
});

/** A number, or [a, b] @param {string} description */
const numberOrPair = (description) => ({
    description,
    oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 }]
});

/**
 * A colour with its own description. The colour grammar sits in allOf, the same
 * object everywhere, so the published schema keeps one copy of its long pattern.
 * @param {string} description
 */
const color = (description) => ({ type: 'string', description, allOf: [simpleColorSchema] });

/** A colour (or a template that gives one), shared by objectColor() */
const colorText = { type: 'string', allOf: [simpleColorSchema] };

/**
 * A colour that follows an entity (bindings.js entityColor): the state colour
 * words of the other cards plus the entity. One shared definition ($defs).
 */
const colorBinding = {
    type: 'object',
    required: ['entity'],
    description: 'Follow an entity: { entity, attribute, default, active, inactive, unavailable, zero, non_zero, above:N, below:N, between:A:B, <state>: colour }. The first key that matches its state (or attribute) gives the colour; none: the entity\'s value when it is a colour (a light\'s rgb_color), else default.',
    properties: {
        entity: { type: 'string', pattern: '^[a-z_]+\\.[a-z0-9_]+$', description: 'The entity to follow.' },
        attribute: { type: 'string', description: 'Match this attribute\'s value instead of the state (rgb_color: a light\'s own colour).' },
        default: { ...colorText, description: 'Colour when no other key matches.' },
        active: { ...colorText, description: 'Colour while the entity is on (active).' },
        inactive: { ...colorText, description: 'Colour while the entity is off (inactive).' },
        unavailable: { ...colorText, description: 'Colour while the entity is unavailable or unknown.' },
        zero: { ...colorText, description: 'Colour when the value is the number 0.' },
        non_zero: { ...colorText, description: 'Colour when the value is any other number.' }
    },
    additionalProperties: { ...colorText, description: 'Colour for a state ("heat", "red") or a range ("above:80", "below:20", "between:20:80").' }
};

/**
 * An object's colour: a colour, a template that gives one, or a state map
 * with its own entity (colorBinding). The object rebuilds when it changes.
 * @param {string} description
 */
const objectColor = (description) => ({ description, anyOf: [colorText, colorBinding] });

/**
 * A sub-part of an object (its coma, its major lines, its edges): the part's
 * settings in one object. With `toggle`, also true (on, its defaults) or false (off).
 * @param {string} description
 * @param {Record<string, any>} properties
 * @param {{ toggle?: boolean, group?: string }} [o]
 */
const part = (description, properties, { toggle = false, group = 'appearance' } = {}) => {
    const obj = { type: 'object', additionalProperties: false, properties };
    return toggle
        ? { description, 'x-ui-hints': { group }, oneOf: [{ type: 'boolean' }, obj] }
        : { ...obj, description, 'x-ui-hints': { group } };
};

/** A point id or [x, y, z] in scene units @param {string} description */
/** @param {string} description - the true form's */
const hideInSystems = (description) => ({
    description: `${description} Or a list of system ids: hidden inside those systems only (a route that belongs in the systems at its ends, not in the one it passes).`,
    oneOf: [
        { type: 'boolean' },
        { type: 'array', items: { type: 'string' }, minItems: 1, description: 'The systems (their ids) to hide it in' }
    ]
});

/** @param {string} what - what shows or hides @param {boolean} [parts] - an object: its parts switch when left out */
const objectLook = (what, parts = false) => ({
    type: 'string',
    enum: parts ? ['diagram', 'realistic', 'all'] : ['diagram', 'realistic'],
    description: parts
        ? `Which look of the card shows ${what}: diagram in the diagram and mixed looks, realistic in the realistic and mixed looks, all in every look as configured. Left out, it shows in every look, and one with a diagram part and a realistic part switches them: a sphere with an image or fill.effect is a wire globe over its plain fill in the diagram look and the bare map in the realistic look, a grid with a fill_effect shows its lines or its fill, a model with material: original is a hologram in the diagram look.`
        : `Which look of the card shows ${what}: diagram in the diagram and mixed looks, realistic in the realistic and mixed looks. Left out, it shows in every look.`,
    enumDescriptions: parts
        ? { diagram: 'The diagram look (wireframes, schematics)', realistic: 'The realistic look', all: 'Every look, as configured (no switching)' }
        : { diagram: 'The diagram look (wireframes, schematics)', realistic: 'The realistic look' }
});

const pointRef = (description) => ({
    description,
    oneOf: [
        { type: 'string', description: 'A point id' },
        { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Scene coordinates [x, y, z], scene units' }
    ]
});

const pxDash = {
    type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2,
    description: 'Dash pattern in px along the line: [on, off] (more pairs repeat). Holds its size at any distance.'
};

/** Keys to land on when flown to: a point's own close-up */
const landingViewSchema = {
    type: 'object',
    description: 'Camera keys to land on when this is flown to (by a tap or a fly-to action). Leave out keys to keep the current ones; the distance defaults to a close-up.',
    properties: {
        distance: number('Camera distance from the point, scene units.', { minimum: 0 }),
        tilt: number('Camera height angle, degrees: 0 level, 90 straight down.'),
        yaw: number('Bearing the camera looks from, degrees (0: looking north).'),
        warp: { type: 'boolean', description: 'Stars and dust streak while the camera flies here (warp). Default camera.warp.' }
    }
};

/** tap_action / hold_action: the normal action shape plus fly-to */
const sceneActionSchema = {
    ...actionSchema,
    description: 'Action on a tap or hold: any card action (more-info, toggle, perform-action, navigate, url, ...), or fly-to. fly-to flies the camera to this point or object, or to the named view in view.',
    properties: {
        ...actionSchema.properties,
        action: {
            ...actionSchema.properties.action,
            description: 'Type of action. fly-to: fly the camera here (or to the named view in view, or the point in point; with card, another astrometrics card\'s camera); the other types run as on any card.'
        },
        view: { type: 'string', description: 'fly-to only: fly to this named view (camera.views) instead of the point or object.' }
    }
};

// ── Camera ───────────────────────────────────────────────────────────────────

const viewSchema = {
    type: 'object',
    description: 'A named camera view. The camera orbits a target: yaw turns round it, tilt raises it, distance moves away.',
    properties: {
        target: pointRef('What the camera looks at: a point id or [x, y, z]. Default: where the camera looked before.'),
        yaw: number('Bearing the camera looks from, degrees: 0 looks north (the default camera), 90 looks east. Default 0.'),
        tilt: number('Camera height angle, degrees: 0 level with the target, 90 straight down. Default 35.', { minimum: -90, maximum: 90 }),
        distance: number('Distance from the target, scene units.', { minimum: 0 }),
        fov: number('Vertical field of view, degrees (perspective only). Default 40. On a card wider than 2:1 it narrows so the view is never wider than on a 2:1 card (no wide-angle stretching at the sides).', { minimum: 1, maximum: 170 }),
        projection: {
            type: 'string', enum: ['perspective', 'orthographic'], default: 'perspective',
            description: 'perspective: far things look smaller. orthographic: no perspective (a flat map); distance then sets the zoom.'
        },
        warp: { type: 'boolean', description: 'Stars and dust streak while the camera flies here (warp). Default camera.warp.' }
    }
};

const cameraSchema = {
    type: 'object',
    description: 'The camera: the view shown first, named views to fly between, drag and zoom controls and their limits.',
    properties: {
        view: {
            description: 'The named view shown first. Default: the first of views; with no views the camera frames the whole scene. Or a guided tour: { entity, views } flies to views[n] when the entity\'s value is n (from 0), or to the view its text state names.',
            anyOf: [
                { type: 'string' },
                {
                    type: 'object',
                    required: ['entity'],
                    additionalProperties: false,
                    description: 'A guided tour: the camera follows an entity (an input_number stage, an input_select of view names).',
                    properties: {
                        entity: { type: 'string', pattern: '^[a-z_]+\\.[a-z0-9_]+$', description: 'The entity whose value picks the view.' },
                        attribute: { type: 'string', description: 'Read this attribute instead of the state.' },
                        views: {
                            type: 'array',
                            description: 'The stops in order: a number n flies to the nth (from 0, rounded, clamped). A stop is a view name, or { view, date, rate } to set the scene clock there too. Leave out when the state names the view.',
                            items: {
                                anyOf: [
                                    { type: 'string' },
                                    {
                                        type: 'object',
                                        required: ['view'],
                                        additionalProperties: false,
                                        properties: {
                                            view: { type: 'string', description: 'The named view to fly to.' },
                                            date: { type: 'string', 'x-ui-hints': { widget: 'date' }, description: 'Set the scene date there: now or an ISO date.' },
                                            rate: { 'x-ui-hints': { widget: 'rate' }, description: 'Set the date\'s rate there: live, days per second, or with a unit as the time slider shows it (1 h/s, 30 d/s, 1 y/s).', anyOf: [{ type: 'number' }, { type: 'string', enum: ['live'] }, { type: 'string', pattern: RATE_PATTERN }] }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        },
        views: {
            type: 'object',
            description: 'Named views (keys are your names). Fly between them with a tap_action (action: fly-to, view: <name>).',
            additionalProperties: viewSchema
        },
        controls: { type: 'boolean', default: true, description: 'Drag to orbit, mouse wheel or pinch to zoom, shift-drag, right-drag, middle-drag, a touchpad two-finger swipe or two fingers on a touch screen to pan, double-tap blank space to zoom in, arrow keys when focused. false: the camera only moves by fly-to and auto_rotate.' },
        drag: {
            type: 'string',
            enum: ['orbit', 'pan'],
            default: 'orbit',
            description: 'What a one-finger or left-button drag does. orbit: turn round the target (shift or right button pans). pan: move the view (shift or right button orbits). A locked tilt always pans.'
        },
        pan: {
            type: 'string',
            enum: ['screen', 'ground'],
            default: 'screen',
            description: 'What panning moves along. screen: the screen\'s left, right, up and down, so a side view pans up and down. ground: across the ground plane only, the target keeps its height.'
        },
        zoom_to: {
            type: 'string',
            enum: ['cursor', 'target'],
            default: 'cursor',
            description: 'Where the wheel and pinch zoom toward. cursor: the spot under the pointer stays put. target: straight in and out from the centre.'
        },
        wheel: {
            type: 'string',
            enum: ['auto', 'zoom', 'pan'],
            default: 'auto',
            description: 'What wheel events do. auto: a mouse wheel zooms and a touchpad two-finger swipe pans (shift: orbits), told apart by the events. zoom: every wheel event zooms. pan: every wheel event pans. A pinch always zooms.'
        },
        follow: {
            type: 'boolean',
            default: true,
            description: 'After a fly-to lands on a point (a tap, a fly-to action, a view that targets it), the camera keeps the point at its centre while it moves; orbit and zoom still work round it. A pan, a double-tap zoom, a tap on blank space or another fly-to lets go. false: the camera stays where it landed.'
        },
        zoom_step: number('Distance factor of one zoom step (double-tap, zoom buttons, plus and minus keys). Default 2: each step halves the distance.', { exclusiveMinimum: 1, default: 2 }),
        double_tap: {
            type: 'string',
            enum: ['zoom', 'none'],
            default: 'zoom',
            description: 'A double-tap or double-click. In blank space, zoom flies in one zoom step toward that spot, which becomes the centre (shift: zoom out); on a point, it flies in close to the largest object standing there (a few times its size). none: nothing. Taps on tappable objects are never affected.'
        },
        buttons: {
            description: 'On-card camera buttons: an LCARdS D-pad in the theme\'s D-pad colours (the arms pan, the centre resets to the start view, the corners zoom in and out (left) and fly forward and back (right)), with the time slider under it. Press and hold keeps moving. true for all of them in the bottom right; an object to choose. Default off.',
            anyOf: [
                { type: 'boolean' },
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        position: {
                            type: 'string',
                            enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'],
                            default: 'bottom-right',
                            description: 'Where the buttons sit on the card.'
                        },
                        size: number('How big the D-pad is, px across. Default 180.', { minimum: 64, maximum: 320, default: 180 }),
                        pan: { type: 'boolean', default: true, description: 'The arms pan. false: they are dimmed and do nothing.' },
                        zoom: { type: 'boolean', default: true, description: 'The left corners zoom in (top) and out (bottom). false: they are dimmed and do nothing.' },
                        travel: { type: 'boolean', default: true, description: 'The right corners fly forward (top) and back (bottom): camera and target move together along the view, as the W and S keys. false: they are dimmed and do nothing.' },
                        reset: { type: 'boolean', default: true, description: 'The centre resets (flies back to the start view). false: it is dimmed and does nothing.' },
                        scale: { type: 'boolean', default: true, description: 'The model size button beside the pad: real size or visible size (model_scale), as the V key. Shown only when a model is drawn at its real size. false hides it.' },
                        time: {
                            description: 'The time slider. speed: how fast the scene\'s motion runs (time_scale: spins, scans, drift), from held to four times as fast. date: the scene clock (clock), with the date, its rate from a year a second backward to a year a second forward, and NOW. both: either, with a switch. true (the default): both when the card has a clock, else speed. false hides it. It changes the view only, not the config.',
                            oneOf: [{ type: 'boolean' }, { type: 'string', enum: ['speed', 'date', 'both'] }],
                            default: true
                        },
                        hide: {
                            type: 'string',
                            enum: ['idle', 'never', 'toggle'],
                            default: 'idle',
                            description: 'When the buttons hide. idle: they fade out after a few seconds without input on the card and come back on any pointer movement, touch or key. never: always shown. toggle: a small button folds them away and back.'
                        }
                    }
                }
            ]
        },
        limits: {
            type: 'object',
            description: 'Where drag and zoom stop: [min, max] pairs. A tilt range of one value (e.g. [90, 90]) locks the tilt, and a one-finger drag then pans (a map).',
            properties: {
                tilt: tuple(2, 'Lowest and highest tilt, degrees. Default [-90, 90].'),
                distance: tuple(2, 'Nearest and farthest distance, scene units. Default: 1 to 100,000, widened for a scene at true scale (down to half its smallest object, out to 20 times its size).'),
                yaw: tuple(2, 'Yaw range, degrees. Default: no limit.'),
                target: {
                    description: 'Where the point the camera looks at may go, so panning cannot lose the scene. A sphere ({ radius, center }) or a box ({ x, y, z } ranges, an axis left out is free); false for no limit. Default: a sphere 1.5 times the size of the scene round its centre.',
                    anyOf: [
                        { type: 'boolean', const: false },
                        {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                radius: number('Sphere radius, scene units.', { exclusiveMinimum: 0 }),
                                center: tuple(3, 'Sphere centre [x, y, z], scene units. Default: the centre of the scene.'),
                                x: tuple(2, 'Box: lowest and highest x, scene units.'),
                                y: tuple(2, 'Box: lowest and highest y, scene units.'),
                                z: tuple(2, 'Box: lowest and highest z, scene units.')
                            }
                        }
                    ]
                }
            }
        },
        auto_rotate: number('Turn the camera round its target, degrees per second (negative: the other way). 0 is off. Pauses while dragging; off under reduced motion.', { default: 0 }),
        fly_duration: number('How long a fly-to takes, ms. Under reduced motion the camera jumps.', { minimum: 0, default: 1600 }),
        ease: { type: 'string', default: 'inOutCubic', description: 'Easing of a fly-to (an anime.js easing name, such as inOutCubic, outQuad, linear).' },
        warp: {
            description: 'Every fly-to streaks the stars and dust (warp); a view\'s own warp wins. Or { entity } (and attribute): fly-tos streak while it is on (on, true, or a number above 0), such as an input_boolean. Off under reduced motion.',
            oneOf: [
                { type: 'boolean', default: false },
                {
                    type: 'object',
                    description: 'Warp fly-tos from an entity',
                    properties: {
                        entity: { type: 'string', description: 'The entity that makes fly-tos streak while it is on.' },
                        attribute: { type: 'string', description: 'Read this attribute instead of the state.' }
                    },
                    required: ['entity'],
                    additionalProperties: false
                }
            ]
        }
    }
};

// ── Backdrop and labels ──────────────────────────────────────────────────────

const starsSchema = {
    description: 'Stars at infinity: they turn with the camera and never move when it pans. true for the defaults, or settings.',
    oneOf: [
        { type: 'boolean' },
        {
            type: 'object',
            properties: {
                count: number('How many stars.', { minimum: 0, maximum: 50000, default: 2000 }),
                min_radius: number('Smallest star radius, px.', { minimum: 0, default: 0.4 }),
                max_radius: number('Largest star radius, px.', { minimum: 0, default: 1.2 }),
                brightness: brightness('Each star\'s brightness is picked at random between these [faintest, brightest], 0 to 1 (the seed picks the same ones every time). Default [0.35, 1].', [0.35, 1]),
                color: color('Star colour. Default var(--lcards-moonlight).'),
                colors: { type: 'array', items: simpleColorSchema, description: 'Several star colours, picked at random per star (wins over color).' },
                opacity: number('Fades the whole star layer, 0 to 1: every star\'s brightness is multiplied by it.', { minimum: 0, maximum: 1, default: 1 }),
                seed: number('Random seed: the same seed places the same stars.', { default: 7 }),
                streak: number('How long stars and dust streak during a warp fly-to (camera.warp or a view\'s warp), a multiple of the usual length; 0: never.', { minimum: 0, default: 1 }),
                spectrum: part('Streaks split into colour: a Doppler shift of each star\'s own colour, violet toward the tail and red toward the head (white stars show the whole rainbow). true, or { direction }. Default off.', {
                    direction: { type: 'string', enum: ['doppler', 'reverse'], default: 'doppler', description: 'doppler: violet toward the tail, as a real Doppler shift. reverse: violet toward the head.' }
                }, { toggle: true })
            }
        }
    ]
};

const dustSchema = {
    description: 'Depth dust: faint particles that fill the space round the camera wherever it goes. They stay put as it moves, so every move shows depth, and streak in a warp fly-to. true for the defaults, or settings.',
    oneOf: [
        { type: 'boolean' },
        {
            type: 'object',
            properties: {
                count: number('How many particles (about half of them are within reach of the camera at any time).', { minimum: 0, maximum: 50000, default: 800 }),
                radius: number('How far round the camera the dust reaches (it fades out there), scene units. Smaller is denser and shows depth on smaller moves. Default 1.5 x the scene\'s radius.', { exclusiveMinimum: 0 }),
                min_radius: number('Smallest particle radius, px.', { minimum: 0, default: 0.4 }),
                max_radius: number('Largest particle radius, px.', { minimum: 0, default: 1 }),
                brightness: brightness('Each particle\'s brightness is picked at random between these [faintest, brightest], 0 to 1. Default [0.35, 1].', [0.35, 1]),
                color: color('Particle colour. Default var(--lcards-moonlight).'),
                colors: { type: 'array', items: simpleColorSchema, description: 'Several colours, picked at random per particle (wins over color).' },
                opacity: number('Fades the whole dust layer, 0 to 1: every particle\'s brightness is multiplied by it.', { minimum: 0, maximum: 1, default: 1 }),
                seed: number('Random seed.', { default: 7 }),
                spectrum: part('Streaks split into colour (a Doppler shift, as on the stars). true, or { direction }. Default off.', {
                    direction: { type: 'string', enum: ['doppler', 'reverse'], default: 'doppler', description: 'doppler: violet toward the tail. reverse: violet toward the head.' }
                }, { toggle: true })
            }
        }
    ]
};

// ── Label text (the LCARdS text system) ─────────────────────────────────────

/** A label style name: a built-in or one declared in labels.styles */
const styleNameSchema = (/** @type {string} */ description) => ({
    type: 'string',
    description,
    examples: [...LABEL_STYLE_NAMES]
});

/** The text-field keys a point label takes, worded for labels round a point */
const labelFieldProperties = textFieldProperties({
    positionEnum: LABEL_POSITION_NAMES,
    omit: [...LABEL_OMITTED_KEYS],
    descriptions: {
        content: 'Text of this field. Templates are evaluated (the point\'s entity is entity; sky and point are available too); template: false shows it as written.',
        position: 'Where this field sits round the point: center (on it), center-right (right of the marker), top-left, bottom-center, ... (right, left, top, bottom are short for the middle ones). Fields with the same position stack. Default center-right with a marker, center without.',
        padding: 'Moves the field, px: a number for every side, or { top, right, bottom, left }.',
        color: 'Text colour: a colour or a state map by the point\'s entity (default, active, inactive, unavailable, a state name, above:N, ...). A selected key colours the field while the point is selected. CSS variables stay live, so alert modes recolour.',
        background: 'A box behind the text (the LCARS bar-break label): a colour or a state map, as color.',
        background_padding: 'Space between the text and the sides of its background box, px.',
        rotation: 'Turn the field, degrees.',
        font_size: 'Font size: px (a number) or a CSS size (14px, 1.2rem, var(--lcars-text-size)).'
    }
});

/**
 * The keys a label style takes (labels.default, labels.styles): how labels
 * look, not what they say (no content, show, template or display_format).
 */
const labelStyleProperties = Object.fromEntries(Object.entries(labelFieldProperties)
    .filter(([k]) => !['content', 'show', 'template', 'display_format'].includes(k)));

/** One label field, or text.default */
const labelFieldSchema = {
    type: 'object',
    description: 'A text field of the label (the LCARdS text-field keys: content, font, colour, background, position round the point).',
    properties: labelFieldProperties
};

/** A point's text: fields by name, with default under them */
const pointTextSchema = {
    type: 'object',
    description: 'The label\'s text fields, as on other LCARdS cards: default holds keys every field inherits; every other key is a field (label is the main one; label: on the point is short for text.label.content).',
    properties: { default: { ...labelFieldSchema, description: 'Keys every text field of this point inherits (not drawn itself).' } },
    additionalProperties: labelFieldSchema
};

/** Generated labels (ring_labels, axis_labels): one field, styled by default */
const generatedTextSchema = {
    type: 'object',
    'x-ui-hints': { widget: 'textDefault' },
    description: 'Text keys for these labels (font, size, colour, background, ...): text.default applies to every one.',
    properties: { default: { type: 'object', properties: labelStyleProperties, description: 'Text keys every label of this set takes (their text is generated).' } }
};

// ── Points ───────────────────────────────────────────────────────────────────

const bindingEntity = { ...entitySchema, description: 'The entity to read. Default: the point\'s entity.' };
const attributeName = (/** @type {string} */ description) => ({ type: 'string', description });

/**
 * A placement form: the numbers, or where to read them (an entity's attributes).
 * @param {number} n
 * @param {string} description
 * @param {Record<string, any>} binding - the binding's own keys
 */
const bindable = (n, description, binding) => ({
    description,
    oneOf: [
        { type: 'array', items: { type: 'number' }, minItems: n, maxItems: n, description: 'The numbers.' },
        {
            type: 'object',
            description: 'Read the numbers from an entity\'s attributes (state for its state). The point moves when they change and is hidden while one is missing.',
            properties: { entity: bindingEntity, ...binding },
            additionalProperties: false
        }
    ]
});

/** xyz / polar bindings: the attribute names in tuple order */
const attributeList = (/** @type {number} */ n, /** @type {string} */ description) => ({
    type: 'array', items: { type: 'string' }, minItems: n, maxItems: n, description
});

/** A Lovelace card pinned to a point */
const pointCardSchema = {
    type: 'object',
    required: ['card'],
    additionalProperties: false,
    description: 'A Lovelace card (any card: tile, entities, an LCARdS card) pinned to the point. It follows the point, and hides when the point is off screen, behind an object or out of its distance range.',
    properties: {
        show: { type: 'string', enum: ['tap', 'always'], default: 'tap', description: 'tap: a tap on the point opens the card and selects the point (one card open at a time; a tap elsewhere or Escape closes it); the tap_action then runs only when it is fly-to. always: the card is always shown.' },
        position: { type: 'string', enum: [...LABEL_POSITION_NAMES], default: 'center-right', description: 'Where the card sits round the point (the label position names). It stays inside the scene.' },
        offset: tuple(2, 'Moves the card by [x, y] px from where position puts it.'),
        width: number('Card width, px; its height follows the card.', { minimum: 80, default: 280 }),
        card: {
            type: 'object',
            required: ['type'],
            additionalProperties: true,
            description: 'The card config, as on a dashboard (type and its own keys). Its visibility conditions apply.',
            properties: { type: { type: 'string', description: 'The card type, such as tile or custom:lcards-button.' } }
        }
    }
};

const pointSchema = {
    type: 'object',
    required: ['id'],
    description: 'A named point: placed once (one of xyz, polar, latlon, altaz, sky, at, cell, or part on a model), referenced by id from paths, rings, beams, objects and views. With a label or marker it shows on the scene.',
    properties: {
        id: { type: 'string', description: 'Unique name of the point (referenced by at, target, from, to, around, points).' },
        // placement forms
        xyz: bindable(3, 'Position [x, y, z], scene units (y is up). With object: local to that object. Or { entity, attributes: [x, y, z] } to read it from an entity.', {
            attributes: attributeList(3, 'The attributes holding x, y and z. Default [x, y, z].')
        }),
        polar: bindable(2, 'Position on the scene plane as [distance, bearing]: distance in scene units, bearing in degrees, 0 north, clockwise seen from above; alt lifts it. With object: local to that object. Or { entity, attributes: [distance, bearing] }.', {
            attributes: attributeList(2, 'The attributes holding the distance and bearing. Default [distance, bearing].')
        }),
        latlon: bindable(2, 'Latitude and longitude [lat, lon] in degrees on the sphere named in object. Longitude 0 faces the default camera, east to the right; the point turns with the sphere\'s spin. Or { entity } for a person, device tracker or zone (its latitude and longitude attributes).', {
            latitude: attributeName('The attribute holding the latitude. Default latitude.'),
            longitude: attributeName('The attribute holding the longitude. Default longitude.')
        }),
        altaz: bindable(2, 'Azimuth and altitude [azimuth, altitude] in degrees on the dome named in object: azimuth clockwise from north, altitude up from the horizon. Or { entity } (sun.sun: its azimuth and elevation attributes).', {
            azimuth: attributeName('The attribute holding the azimuth. Default azimuth.'),
            altitude: attributeName('The attribute holding the altitude. Default elevation.')
        }),
        sky: { type: 'string', enum: [...SKY_BODIES], description: 'Follow the sun or moon on the dome named in object, from the time and the Home Assistant location (sun.sun when it exists). Updated every minute. With a clock, the scene date instead of now.' },
        body: { type: 'string', enum: [...BODY_NAMES], description: 'Where a real Sun, planet, dwarf planet or moon is at the scene clock\'s date (clock; JPL elements), on its tilted, elliptical orbit. The Sun sits at the origin of the point\'s frame (the scene, or its system), in that frame\'s units: name them (units: km or au) or au is assumed. A moon is placed from the Sun too (its planet plus its own orbit).' },
        center: { type: 'string', enum: [...BODY_NAMES], description: 'body only: measure from this body instead of the Sun, so it sits at the origin (a Jupiter-centred scene of its moons).' },
        at: { type: 'string', description: 'Place it at another point (by id); add offset to move it from there.' },
        cell: { type: 'string', description: 'The centre of a sector map cell, such as AF3, on the grid named in object (a plane grid; its axis_labels say how cells are named).' },
        object: { type: 'string', description: 'The object the point stands on (an object id). Needed by latlon (a sphere), altaz and sky (a dome grid), cell (a plane grid) and part (a model); with xyz or polar the point moves and spins with the object (on a model: in the file\'s coordinates).' },
        part: { type: 'string', description: 'A named part (node) of the model in object: the point sits on it and follows it; xyz is an offset in the part\'s coordinates.' },
        alt: setting('Height above the surface of the object in object (latlon, altaz, sky), or above the plane (polar), scene units.', { default: 0 }),
        offset: tuple(3, 'Moves the point by [x, y, z] scene units from where its form puts it.'),
        // label and marker
        entity: { ...entitySchema, description: 'The point\'s entity: its templates read it as entity, state colour maps follow its state, more-info and toggle actions use it, and latlon / altaz / xyz / polar can take their values from it.' },
        tags: { ...tagsSchema, description: 'Tags for rules: a rule on tag:<name> patches every point with the tag.' },
        hide_in_systems: hideInSystems('Hide the label and marker while the camera is inside a star system (a system object), so galaxy-scale names step aside in the close-ups.'),
        look: objectLook('the label and marker'),
        label: { type: ['string', 'number'], description: 'Text shown at the point: short for text.label.content. Leave out for a marker only, or for a point that only anchors other things.' },
        text: pointTextSchema,
        style: styleNameSchema('Label style: a built-in (title 34 px, major 20 px, minor 13 px, tiny 10 px; larger ones win when labels overlap) or one of yours in labels.styles. Default minor.'),
        marker: { type: 'string', enum: [...MARKERS], default: 'none', description: 'Marker drawn at the point: dot, triangle, diamond, square, reticle (a target ring), ship (a starship from above), starbase (a station: stands in for a model far away), moon_phase (the moon\'s lit part, from the sky) or none. A point with a marker can be tapped.' },
        color: { ...stateColorSchema, description: 'The point\'s colour: the marker, and the default for its text fields. A colour or a state map by the point\'s entity (a selected key while it is selected). CSS variables stay live, so alert modes recolour. Default by style: moonlight for title and major, the theme text colour for minor and tiny.' },
        visible: { type: 'boolean', default: true, description: 'false hides the label, marker and card (the point still places other things). Rules use it to hide and show points.' },
        opacity: setting('Opacity of the label and marker, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
        priority: setting('Which label wins when two overlap (higher wins; then the nearer one). Default by style: title 100, major 80, minor 40, tiny 10 (labels.styles can set its own).'),
        leader: { type: 'boolean', default: true, description: 'With a model, globe or cube sitting at the point (its at: names the point), the label stands off the object\'s edge on screen; true draws a thin line from the edge to the label, false leaves it out.' },
        overlap: { type: 'boolean', description: 'When labels overlap, this one is never hidden: it still moves to the other side of its point when that is free, else it shows where it is (over the other one). Default: the style\'s, else labels.overlap (false).' },
        fade: tuple(2, 'Distance fade [start, end], scene units from the camera: fully shown nearer than start, gone past end.'),
        min_distance: setting('Hidden when the camera is closer than this, scene units.', { minimum: 0 }),
        max_distance: setting('Hidden when the camera is farther than this, scene units (detail that appears as you zoom in).', { minimum: 0 }),
        below_horizon: { type: 'string', enum: ['dim', 'hide', 'show'], description: 'altaz and sky points under the horizon: dim (default for sky), hide, or show (default for altaz).' },
        tap_action: sceneActionSchema,
        hold_action: sceneActionSchema,
        view: landingViewSchema,
        card: pointCardSchema
    }
};

// ── Objects ──────────────────────────────────────────────────────────────────

/** Keys every object takes */
const objectCommon = {
    id: { type: 'string', description: 'Name of the object: points stand on it (object), rules target it. Default type#n (grid#1, ...).' },
    tags: { ...tagsSchema, description: 'Tags for rules: a rule on tag:<name> patches every object with the tag.' },
    at: pointRef('Where the object sits: a point id (it follows the point) or [x, y, z] in scene units. Default the origin.'),
    rotation: tuple(3, 'Turn the object [x, y, z] in degrees: y is a bearing (clockwise from above), x tips it toward the camera, z rolls it.'),
    spin: setting('Turn round the object\'s own vertical axis, degrees per second (positive is prograde). Off under reduced motion.', { default: 0 }),
    face: {
        type: 'string',
        pointWords: ['motion'],
        examples: ['motion'],
        description: 'motion: an object at a moving point turns its +z (a built-in model\'s bow) toward where the point is going, upright. Before the point first moves (and under reduced motion) a point on a spinning object faces along the spin. A point id: the object turns toward that point, wherever it is in the scene: its +z, or for an object round an axis (a grid other than a plane, a ring, a belt, a galaxy) down its axis, so a well\'s throat leads to it. rotation applies on top. Default: the object keeps its rotation.'
    },
    visible: { type: 'boolean', default: true, description: 'false hides the object (its points still work).' },
    hide_in_systems: hideInSystems('Hide it while the camera is inside a star system (a system object: within a few times its size, the camera works in its units): galaxy-scale lines and volumes then step aside instead of crossing the close-ups. Outside every system it shows as usual.'),
    look: objectLook('the object', true),
    opacity: setting('Opacity of the whole object, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
    fade: tuple(2, 'Distance fade [start, end], scene units from the camera to the nearest edge of the object (0 inside it; a flat plane or disc grid is measured to its surface): fully shown nearer than start, gone past end.'),
    min_distance: setting('Hidden when the camera is closer than this to the object\'s nearest edge, scene units (fades in over the last 10%).', { minimum: 0 }),
    max_distance: setting('Hidden when the camera is farther than this from the object\'s nearest edge, scene units: a planet that appears as you close in on its system (fades out over 10% past it).', { minimum: 0 }),
    tap_action: sceneActionSchema,
    hold_action: sceneActionSchema,
    view: landingViewSchema
};

/**
 * The common keys as one schema every object branch includes through allOf: the
 * same object in every branch, so the published schema keeps one copy.
 */
const objectCommonSchema = { type: 'object', properties: objectCommon };

const blendAdd = { type: 'string', enum: ['add', 'normal'], default: 'normal', description: 'add: light adds up where lines cross (a glow). Default normal.' };

/**
 * A bright band sweeping across the object
 * @param {string} periodDescription - how it sweeps on this type
 */
const scanPart = (periodDescription) => part('A bright scan band sweeping across it: { period, color }. Off under reduced motion.', {
    period: setting(`Seconds per sweep (0: none). ${periodDescription}`, { minimum: 0, default: 0 }),
    color: objectColor('Band colour. Default var(--lcards-moonlight).')
});

/** An animated fill painted on a sphere's body or under a grid's lines (the plasma, fluid and contour-field background presets) */
const fillEffectSchema = {
    type: 'object',
    additionalProperties: false,
    description: 'An animated fill on the surface, from the background presets: plasma (two-colour bands), fluid (a one-colour wash) or contour (topographic bands); or bands (latitude belts, a gas giant) or swirl (gas spiralling in, a whirlpool or a wormhole\'s mouth). Seamless round a sphere, and it turns with spin. On a sphere it paints the body over fill, in place of image (the body still hides what is behind it). A preset is a planet type to start from; the keys you set win over it.',
    properties: {
        preset: {
            type: 'string',
            enum: [...FILL_PRESETS],
            description: 'A planet type to start from (its type, colours and detail; your own keys win): gas_giant (Jupiter), ringed_giant (Saturn), ice_giant (Uranus), storm_giant (Neptune), clouds (Venus), lava, ice, rocky, terran (oceans and land).',
            enumDescriptions: {
                gas_giant: 'Orange and cream belts, stormy edges',
                ringed_giant: 'Pale gold belts, calm',
                ice_giant: 'Pale blue, faint belts',
                storm_giant: 'Deep blue belts, streaked',
                clouds: 'A cream cloud deck',
                lava: 'Dark crust, glowing cracks',
                ice: 'White and pale blue ice',
                rocky: 'Grey highlands and plains',
                terran: 'Oceans, land and ice caps'
            }
        },
        type: { type: 'string', enum: [...FILL_EFFECTS], description: 'plasma, fluid, contour (the contour-field preset), bands (belts round the latitude, from the object\'s y axis) or swirl (gas spiralling in round the y axis, faster near the middle, streaked along the spiral with dark lanes, a rippled heart and a ragged edge: a whirlpool, an accretion disc, a wormhole\'s mouth on a disc or well grid). Default the preset\'s type, else plasma.' },
        color_a: objectColor('plasma: first colour. Default var(--lcars-blue).'),
        color_b: objectColor('plasma: second colour. Default var(--lcars-orange).'),
        color: objectColor('fluid: wash colour (its alpha is how strong). Default var(--lcars-blue).'),
        colors: {
            description: 'contour: one colour, or stops spread over the bands from low to high. bands: the belt colours, repeated from the south pole to the north. swirl: stops from the middle out to the rim. Default blue to orange.',
            oneOf: [objectColor('A colour.'), { type: 'array', items: objectColor('A colour.'), minItems: 1 }]
        },
        base_frequency: setting('Noise detail per scene unit: lower is larger features. Default about 3 noise cells across the radius.', { minimum: 0 }),
        num_octaves: wholeSetting('Layers of finer detail (1 smooth, 8 rough). Default plasma 3, fluid 4, contour 2.', { minimum: 1, maximum: 8 }),
        num_bands: setting('contour: how many bands (low is bold steps, high is near smooth). bands: how many belts pole to pole.', { minimum: 2, maximum: 64, default: 5 }),
        turbulence: setting('bands: how much the belt edges swirl, 0 (straight) to 1 (stormy). swirl: how much the gas clumps and how ragged its outer edge is (wisps trailing off).', { minimum: 0, maximum: 1, default: 0.3 }),
        fill_level: setting('contour: flood the lowest bands, 0 to 0.95 (0: none).', { minimum: 0, maximum: 0.95, default: 0 }),
        fill_color: objectColor('contour: colour over the flooded bands. Default see-through.'),
        blend_colors: { type: 'boolean', default: true, description: 'contour and bands: colours fade between bands (false: flat bands with hard edges).' },
        speed: setting('How fast the pattern flows through the object, scene units per second (0: still). swirl: how fast the gas turns at the rim (faster toward the middle). Off under reduced motion.', { default: 0 }),
        opacity: setting('Fill opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 })
    }
};

/** Grid look: the background grid effect's names, in scene units */
const gridLook = {
    pattern: { type: 'string', enum: [...GRID_PATTERNS], description: 'Line pattern (the background grid effect\'s names): both (rows and columns, default), horizontal, vertical, diagonal, hexagonal, dots, polar (rings and spokes; default on a disc).' },
    line_spacing: setting('Distance between lines, scene units. On curved shapes line_spacing_deg is usually easier.', { exclusiveMinimum: 0 }),
    line_width: setting('Line width, px.', { minimum: 0, default: 1 }),
    color: objectColor('Line colour. Default theme:colors.ui.tertiary.'),
    major: part('Major lines: brighter, wider lines every few rows and columns (rings and spokes on a disc).', {
        row_interval: wholeSetting('A major line every N rows (rings on a disc); 0 for none.', { minimum: 0, default: 0 }),
        col_interval: wholeSetting('A major line every N columns (spokes on a disc); 0 for none.', { minimum: 0, default: 0 }),
        line_width: setting('Major line width, px. Default 1.5 x line_width (at least 1.5).', { minimum: 0 }),
        color: objectColor('Major line colour. Default: color, brighter.')
    }),
    back_opacity: setting('Opacity of the far side seen through the surface, 0 to 1 (0 hides it).', { minimum: 0, maximum: 1 }),
    blend: blendAdd,
    scan: scanPart('A sphere sweeps north pole to south pole, a dome top to rim, a cylinder top to bottom, a polar disc rings out from the centre, a plane runs south to north.')
};

/** One `deform:` entry on a grid: a warp of its surface (core/astrometrics/deform.js) */
const deformSchema = {
    type: 'object',
    required: ['type'],
    additionalProperties: false,
    description: 'A deformation of the surface. Round the axis on a cylinder, sphere, dome or well; up and down on a plane or disc. The lines, the edges and the points on it move with it. Still unless period (or drift for noise) is set; holds still under reduced motion.',
    properties: {
        type: { type: 'string', enum: [...DEFORM_TYPES], description: 'wobble (bulges travelling round, or ripples across a flat grid), bend (the axis bends or sways; a flat grid curls), twist (turns more toward the far end; a flat grid swirls like a whirlpool) or noise (smooth random lumps).', enumDescriptions: { wobble: 'Travelling bulges or ripples', bend: 'Bending or swaying axis', twist: 'Twist or whirlpool', noise: 'Smooth random lumps' } },
        amplitude: setting('wobble, bend, noise: how far the surface moves, as a fraction of the grid\'s size (its radius, or half a plane\'s longer side). Default wobble 0.08, bend 0.25, noise 0.05.'),
        lobes: wholeSetting('wobble: bulges round the circumference (0: the whole ring swells at once; on a flat grid, ripples ring out from the centre).', { minimum: 0, default: 3 }),
        waves: setting('wobble: waves along the axis (or out from the centre of a flat grid) between bulges, so they spiral.', { default: 1 }),
        period: setting('wobble, bend, twist: seconds per cycle (a bulge travels round once, a sway goes to and fro, the bend turns once, the twist swings). 0: a still shape.', { minimum: 0, default: 0 }),
        drift: setting('noise: how fast the lumps drift through the grid, scene units per second; 0 holds them still.', { default: 0 }),
        bearing: setting('bend: direction the axis bends toward, degrees (0 north, clockwise from above).', { default: 0 }),
        motion: { type: 'string', enum: [...BEND_MOTIONS], default: 'sway', description: 'bend: sway (bends to and fro), circle (the bend turns round, a tornado) or none (a still bend).', enumDescriptions: { sway: 'Bends to and fro', circle: 'The bend turns round', none: 'Still bend' } },
        angle: setting('twist: degrees turned at the far end (at the centre of a flat grid). With speed the twist swings between plus and minus this.', { default: 90 }),
        anchor: { type: 'string', enum: [...DEFORM_ANCHORS], default: 'bottom', description: 'bend, twist round an axis: the end that stays put (middle: both ends move).' },
        base_frequency: setting('noise: detail per scene unit, lower is larger lumps (as on fill.effect). Default about 3 lumps across the grid\'s size.', { exclusiveMinimum: 0 }),
        num_octaves: wholeSetting('noise: layers of finer detail (as on fill.effect).', { minimum: 1, maximum: 6, default: 2 }),
        seed: setting('noise: changes the pattern.', { default: 0 })
    }
};

const gridObject = {
    type: 'object',
    title: 'grid',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A see-through grid surface: plane (a sector map), disc (a galaxy disc), dome (a sky), sphere (a wireframe ball; for a solid planet use sphere), cylinder or well (a funnel, a wormhole), optionally deformed (deform).',
    properties: {
        type: { type: 'string', const: 'grid', description: 'grid: a grid surface.' },
        shape: { type: 'string', enum: [...GRID_SHAPES], 'x-ui-hints': { widget: 'shape' }, default: 'plane', description: 'plane (size), disc (radius, or [inner, outer] for a hole in the middle), dome (a half sphere, radius), sphere (radius), cylinder (radius, height) or well (a funnel down from its rim: radius, depth, well).' ,
            enumDescriptions: { plane: 'Flat rectangle', disc: 'Flat circle', dome: 'Half sphere', sphere: 'Globe', cylinder: 'Tube', well: 'Funnel down from a rim' } },
        size: settingOrPair('plane: width and depth [w, d], scene units (one number for a square). Default 200.'),
        radius: {
            description: 'disc, dome, sphere, cylinder, well (its rim): radius, scene units. A disc also takes [inner, outer] for a hole in the middle. Default 100.',
            anyOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2, maxItems: 2 }, settingBinding, settingTemplate]
        },
        height: setting('cylinder: height, scene units. Default the radius.', { exclusiveMinimum: 0 }),
        depth: setting('well: depth below the rim, scene units (the rim is at the object\'s position). Default the radius.', { exclusiveMinimum: 0 }),
        well: part('well: the funnel\'s profile from the rim down: a named shape and its throat, or any profile.', {
            shape: { type: 'string', enum: [...WELL_SHAPE_NAMES], default: 'trumpet', description: 'trumpet (a gravity well: flat at the rim, plunging to the throat), cone, bowl or wormhole (two trumpets throat to throat, the throat halfway down). profile replaces it.', enumDescriptions: { trumpet: 'Gravity well', cone: 'Straight sides', bowl: 'Rounded bottom', wormhole: 'Hourglass' } },
            throat: setting('Throat diameter as a fraction of the rim (shape).', { minimum: 0.02, maximum: 1, default: 0.15 }),
            profile: { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2, maxItems: 32, description: 'Any profile: diameters as fractions of the rim from the rim down, evenly spaced along the depth; a smooth curve passes through each. [1, 0.4, 0.2, 0.15] is a trumpet, [1, 0.2, 1] an hourglass. Replaces shape.' }
        }, { group: 'main' }),
        deform: { type: 'array', items: deformSchema, description: 'Deformations of the surface, applied in order: wobble, bend, twist, noise. A wobbling cylinder is jelly; a well with bend (motion: circle) and twist is a tornado; a disc with twist is a whirlpool.' },
        line_spacing_deg: setting('disc: a spoke every N degrees; dome, sphere, cylinder, well: rings and meridians every N degrees (a whole number fits round). Default 15 on curved shapes.', { exclusiveMinimum: 0 }),
        ...gridLook,
        fill: part('What fills the cells behind the lines: a colour, or an animated effect.', {
            color: objectColor('Fill colour. Default none.'),
            effect: fillEffectSchema
        }),
        spoke_count: wholeSetting('pattern polar: spokes round the centre (meridians on a curved shape). line_spacing_deg wins on a disc.', { minimum: 0, default: 36 }),
        hex_radius: setting('pattern hexagonal: hexagon size, scene units. Default line_spacing.', { exclusiveMinimum: 0 }),
        dot_radius: setting('pattern dots: dot radius, scene units. Default 8% of line_spacing.', { exclusiveMinimum: 0 }),
        edges: part('Outline the open edges: the rim of a disc, dome or well, the ends of a cylinder, the frame of a plane. true (default), false, or { width, color }.', {
            width: setting('Edge width, px. Default the major line width.', { minimum: 0 }),
            color: objectColor('Edge colour. Default the major line colour.')
        }, { toggle: true }),
        ring_labels: {
            type: 'object',
            description: 'disc or dome: bearing labels round the edge (0, 10, 20, ...).',
            properties: {
                step: setting('A label every N degrees.', { exclusiveMinimum: 0, default: 10 }),
                radius: setting('Distance of the labels from the centre, scene units. Default 1.06 x radius.', { minimum: 0 }),
                start: setting('First bearing labelled, degrees.', { default: 0 }),
                alt: setting('Height of the labels above the plane, scene units.', { default: 0 }),
                style: styleNameSchema('Label style (built-in or labels.styles). Default minor.'),
                color: objectColor('Label colour.'),
                text: generatedTextSchema
            }
        },
        axis_labels: {
            type: 'object',
            description: 'plane: a lettered sector map. Column and row labels along the top and left edges, and cell names for cells and cell: placements (AF3 is column AF, row 3).',
            properties: {
                columns: { type: 'string', enum: ['letters', 'numbers'], default: 'letters', description: 'How columns are named.' },
                rows: { type: 'string', enum: ['letters', 'numbers'], default: 'numbers', description: 'How rows are named.' },
                column_start: { type: ['string', 'number'], description: 'Name of the first column (AD, or a number). Default A or 1.' },
                row_start: { type: ['string', 'number'], description: 'Name of the first row. Default 1 or A.' },
                pad: { type: 'integer', minimum: 0, description: 'Zero-pad numbers to this many digits. Default: the widest label, at least 2 (01, 02, ...); 0 turns it off.' },
                every: { type: 'integer', minimum: 1, default: 1, description: 'Label every Nth column and row.' },
                offset: setting('Distance of the labels outside the edge, scene units. Default 0.6 x line_spacing.', { minimum: 0 }),
                style: styleNameSchema('Label style (built-in or labels.styles). Default tiny.'),
                color: color('Label colour.'),
                text: generatedTextSchema
            }
        },
        cells: {
            type: 'array',
            description: 'plane with axis_labels: filled cell ranges (territories), by cell name.',
            items: {
                type: 'object',
                description: 'A filled rectangle of cells, from one corner cell to the other.',
                properties: {
                    from: { type: 'string', description: 'First corner cell, such as AF3.' },
                    to: { type: 'string', description: 'Opposite corner cell. Default: from (one cell).' },
                    cell: { type: 'string', description: 'One cell (instead of from and to).' },
                    color: objectColor('Fill colour. Default var(--lcars-blue).'),
                    opacity: setting('Fill opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.25 }),
                    shade: setting('Per-cell brightness variation, 0 to 1 (a printed sector map look); the same cell always gets the same shade.', { minimum: 0, maximum: 1, default: 0 }),
                    seed: setting('Changes which cells are lighter and darker with shade.', { default: 0 }),
                    edges: {
                        description: 'An outline round the range: true, or { width, color, opacity }.',
                        oneOf: [
                            { type: 'boolean' },
                            {
                                type: 'object',
                                properties: {
                                    width: setting('Outline width, px.', { minimum: 0, default: 1.5 }),
                                    color: objectColor('Outline colour. Default the fill colour.'),
                                    opacity: setting('Outline opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.9 })
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
};

const volumeObject = {
    type: 'object',
    title: 'volume',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A see-through box of grid cells (a territory): a sector of a disc, a box, or a prism of any outline.',
    properties: {
        type: { type: 'string', const: 'volume', description: 'volume: a see-through cell box.' },
        shape: { type: 'string', enum: [...VOLUME_SHAPES], 'x-ui-hints': { widget: 'shape' }, default: 'sector', description: 'sector: between two radii, two bearings and two heights round the centre. box: size centred on at. prism: the outline (any polygon, a territory\'s border) between two heights.' ,
            enumDescriptions: { sector: 'Wedge between radii, bearings and heights', box: 'Box', prism: 'Any outline between two heights' } },
        outline: {
            type: 'array',
            minItems: 3,
            items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            description: 'prism: the border as [x, z] points in order, scene units from the object\'s position (z is south: -z north, as bearings 0). At least 3.'
        },
        radius: tuple(2, 'sector: inner and outer radius [r0, r1], scene units. Default [50, 100].'),
        angle: tuple(2, 'sector: from and to bearing [a0, a1], degrees clockwise from north. Default [0, 90].'),
        height: tuple(2, 'sector and prism: bottom and top [y0, y1], scene units. Default [0, 10].'),
        size: {
            description: 'box: [width, height, depth], scene units, or one number for a cube. Default 20.',
            anyOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 }, settingBinding, settingTemplate]
        },
        cells: {
            type: 'object',
            description: 'Grid cell size on the faces, per direction.',
            properties: {
                ring: setting('sector: radial cell size, scene units. Default a quarter of the depth.', { exclusiveMinimum: 0 }),
                angle: setting('sector: cell width round, degrees.', { exclusiveMinimum: 0, default: 10 }),
                layer: setting('sector: cell height, scene units. Default half the height.', { exclusiveMinimum: 0 }),
                width: setting('box and prism: cell size across (x, and along a prism\'s walls), scene units. Default a quarter of the width (an eighth of a prism\'s).', { exclusiveMinimum: 0 }),
                height: setting('box and prism: cell size up (y), scene units. Default a quarter of the height (half a prism\'s).', { exclusiveMinimum: 0 }),
                depth: setting('box and prism: cell size along z, scene units. Default a quarter of the depth (an eighth of a prism\'s).', { exclusiveMinimum: 0 })
            }
        },
        color: objectColor('Colour of the faces (and the edges, unless edges.color). Default var(--lcars-blue).'),
        line_width: setting('Face line width, px.', { minimum: 0, default: 1 }),
        faces: part('The grid lines on the faces.', {
            opacity: setting('Opacity of the face grid lines (the edges stay brighter), 0 to 1.', { minimum: 0, maximum: 1, default: 0.45 })
        }),
        edges: part('Draw the outline edges: true (default), false, or { width, color }.', {
            width: setting('Edge width, px.', { minimum: 0, default: 1.5 }),
            color: objectColor('Edge colour. Default color.')
        }, { toggle: true }),
        back_opacity: setting('Opacity of the far faces, 0 to 1 (1: a wireframe, nothing hidden).', { minimum: 0, maximum: 1, default: 1 }),
        blend: blendAdd,
        scan: scanPart('It sweeps down the walls, top to bottom.')
    }
};

/** A sphere's map: an equirectangular image */
const imageSrc = { type: 'string', assetSource: 'image', description: 'An equirectangular map, longitude 0 in the middle. Built in (NASA and USGS maps, public domain): builtin:earth_blue_marble, builtin:moon_lroc, builtin:mars_viking, builtin:mercury_messenger, builtin:venus_magellan (the surface under the clouds), builtin:jupiter_cassini, builtin:pluto_new_horizons, builtin:sun_sdo, builtin:phobos_viking, builtin:ceres_dawn, builtin:io_galileo, builtin:europa_galileo, builtin:ganymede_galileo, builtin:callisto_galileo, builtin:titan_cassini (the surface under the haze), builtin:triton_voyager, builtin:charon_new_horizons. Or your own: /local/mars.jpg, or a Home Assistant media item (media-source://...). Planets without a map: fill.effect presets.', examples: ['builtin:earth_blue_marble', 'builtin:mars_viking', '/local/mars.jpg'] };

const sphereObject = {
    type: 'object',
    title: 'sphere',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A planet or globe: latitude and longitude lines over a solid body that hides what is behind it (labels too), with an optional map image. For a see-through wireframe ball use a grid with shape: sphere.',
    properties: {
        type: { type: 'string', const: 'sphere', description: 'sphere: a planet or globe.' },
        radius: setting('Radius, scene units.', { exclusiveMinimum: 0, default: 10 }),
        line_spacing_deg: setting('A latitude and a longitude line every N degrees (longitude rounded to fit round), as on curved grids.', { minimum: 1, default: 15 }),
        lat_step: setting('Latitude lines every N degrees, when different from line_spacing_deg.', { minimum: 1 }),
        lon_step: setting('Longitude lines every N degrees, when different from line_spacing_deg (rounded to fit round).', { minimum: 1 }),
        ...gridLook,
        fill: part('The body under the lines: a colour, or an animated effect (it paints the body in place of image).', {
            color: objectColor('Body colour. Default black.'),
            opacity: setting('Body opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.85 }),
            effect: fillEffectSchema
        }),
        image: {
            description: 'A map on the body instead of fill: the image, or { src, opacity }.',
            'x-ui-hints': { group: 'appearance' },
            anyOf: [imageSrc, {
                type: 'object',
                additionalProperties: false,
                properties: {
                    src: imageSrc,
                    opacity: setting('Map opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 })
                }
            }]
        },
        occlude: { type: 'boolean', default: true, description: 'Hide labels behind the sphere.' },
        deform: { type: 'array', items: deformSchema, description: 'Deformations of the planet, applied in order (as on a grid sphere): wobble, bend, twist, noise. The body, lines and points on it move with them.' },
        body: { type: 'string', enum: [...BODY_NAMES], description: 'Turn the sphere as this real body is turned at the scene clock\'s date (IAU rotation models): its north pole where the body\'s points, its day the real sidereal day, and longitude 0 of its map where the body\'s prime meridian is, so latlon points sit over the real places. spin and rotation do not apply. Pair it with a point that has the same body.' }
    }
};

/** Moving dashes and pulses along a line (the flow background preset) */
/** Dashes along a line, and how fast they (and its pulses) move */
const dashKey = {
    dash: {
        description: 'Dash pattern in px along the line: [on, off] (more pairs repeat), holding its size at any distance; or { pattern, speed } to move the dashes (and pulses) along the line.',
        'x-ui-hints': { group: 'appearance' },
        anyOf: [pxDash, {
            type: 'object',
            additionalProperties: false,
            properties: {
                pattern: pxDash,
                speed: setting('Move the dashes (and pulses) along the line, px per second; negative runs backwards. Default 0. Off under reduced motion.')
            }
        }]
    }
};

const flowKeys = {
    pulse: {
        description: 'Bright pulses travelling along the line: true, or their settings.',
        oneOf: [
            { type: 'boolean' },
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    length: setting('Pulse length, px.', { exclusiveMinimum: 0, default: 14 }),
                    gap: setting('Space between pulses, px.', { minimum: 0, default: 90 }),
                    width: setting('Pulse width, px. Default the line width + 1.', { minimum: 0 }),
                    color: objectColor('Pulse colour. Default var(--lcards-moonlight).'),
                    speed: setting('px per second when dash.speed is not set. Off under reduced motion.', { default: 80 })
                }
            }
        ]
    }
};

const lineCommon = {
    width: setting('Line width, px.', { minimum: 0, default: 1.5 }),
    ...dashKey,
    color: objectColor('Line colour.'),
    colors: { type: 'array', items: objectColor('A colour.'), minItems: 2, maxItems: 2, description: 'A gradient [from, to]: the line fades from the first colour to the second along its length (wins over color).' },
    glow: {
        description: 'A soft glow under the line: true (4 x the width) or a width factor.',
        oneOf: [{ type: 'boolean' }, { type: 'number', minimum: 1 }]
    },
    line_look: {
        type: 'string',
        enum: ['flat', 'tube'],
        default: 'flat',
        description: 'flat: one brightness across the line. tube: shaded as a lit cylinder across its width (dark edges, a bright stripe), so a wide line reads as a pipe (from 6 px or so); pulses on it become bands of light round it. The glow stays soft.',
        enumDescriptions: { flat: 'One brightness', tube: 'Shaded pipe' }
    },
    blend: blendAdd,
    ...flowKeys
};

const ringObject = {
    type: 'object',
    title: 'ring',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A circle or ellipse: an orbit, a rim, a range ring. at is its centre (a point id: the ring follows it).',
    properties: {
        type: { type: 'string', const: 'ring', description: 'ring: a circle or ellipse.' },
        radius: settingOrPair('Radius, scene units, or [a, b] for an ellipse (a along the line of nodes). Default 100.'),
        inclination: setting('Tilt of the ring\'s plane, degrees, about the line of nodes.', { default: 0 }),
        node: setting('Bearing of the line of nodes (where an inclined ring crosses the plane), degrees.', { default: 0 }),
        arc: tuple(2, 'Only part of the ring: [from, to] in degrees round it.'),
        band: part('A flat textured band from band.inner_radius out to radius (Saturn\'s rings): { image, inner_radius, opacity, color }. The line is drawn too only when width is set.', {
            image: { type: 'string', assetSource: 'image', description: 'The band\'s texture, across its width: the image\'s left edge is the inner rim, its right edge the outer (its height is not used). builtin:saturn_rings is Saturn\'s rings, D ring to F ring (radius 2.33 and inner_radius 1.11 times the planet\'s radius).', examples: ['builtin:saturn_rings', '/local/rings.png'] },
            inner_radius: settingOrPair('The band\'s inner radius, scene units, or [a, b] for an ellipse. Default half the radius.'),
            opacity: setting('The band\'s opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
            color: objectColor('A colour the texture is multiplied by (a tint). Default none (the image\'s own colours).')
        }),
        body: { type: 'string', enum: [...BODY_NAMES], description: 'Lay the ring in this real body\'s equator at the scene clock\'s date (Saturn\'s rings: body: saturn on a ring at Saturn). inclination and node tilt it from there; rotation does not apply.' },
        orbit: { type: 'string', enum: BODY_NAMES.filter((b) => b !== 'sun'), description: 'Draw this real body\'s orbit at the scene clock\'s date (JPL elements): an ellipse with its parent at a focus, tilted and turned as it really is, in the frame\'s units. Put the ring at the parent\'s point (at: jupiter for Io; nothing for a planet, the Sun sits at the origin). radius, inclination, node, arc and band do not apply.' },
        ...lineCommon,
        color: objectColor('Line colour. Default theme:colors.ui.secondary.')
    }
};

const pathObject = {
    type: 'object',
    title: 'path',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A line through points (a route), an arched route between two points, or the day track of the sun or moon.',
    properties: {
        type: { type: 'string', const: 'path', description: 'path: a line through points.' },
        points: { type: 'array', items: pointRef('A point id or [x, y, z].'), description: 'The points the line passes through, in order (ids or [x, y, z]). With at, each [x, y, z] is an offset from at, turned with rotation and face (a shape drawn in its own place); ids stay where they are.' },
        from: pointRef('Start (instead of points).'),
        to: pointRef('End (instead of points).'),
        arc: setting('Arch each leg upward by this height at its middle, scene units (0: straight).', { default: 0 }),
        sky: { type: 'string', enum: [...SKY_BODIES], description: 'Draw today\'s track of the sun or moon on the dome named in object, split where it goes under the horizon.' },
        object: { type: 'string', description: 'sky: the dome grid the track is drawn on.' },
        span: { type: 'string', enum: ['today'], description: 'sky: which track (only today, midnight to midnight local time).' },
        alt: setting('sky: height above the dome, scene units.', { default: 0 }),
        ...lineCommon,
        color: objectColor('Line colour. Default var(--lcars-orange).')
    }
};

const beamObject = {
    type: 'object',
    title: 'beam',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A glowing straight line (a soft wide glow round a thin bright core).',
    properties: {
        type: { type: 'string', const: 'beam', description: 'beam: a glowing straight line.' },
        from: pointRef('One end: a point id or [x, y, z].'),
        to: pointRef('The other end.'),
        width: setting('Glow width, px (the core stays thin).', { minimum: 0, default: 12 }),
        color: objectColor('Beam colour. Default theme:colors.ui.secondary.'),
        ...flowKeys
    }
};

const cubeObject = {
    type: 'object',
    title: 'cube',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A Borg cube (shape borg, the default: carved machinery, a rail lattice, green light from inside and pulsing glow spots, as in the Borg screen effect) or a plain shaded box. Hides labels behind it.',
    properties: {
        type: { type: 'string', const: 'cube', description: 'cube: a Borg cube or a plain box.' },
        shape: { type: 'string', enum: [...CUBE_SHAPES], default: 'borg', description: 'borg (default): the Borg cube. box: a shaded box with its edges.', enumDescriptions: { borg: 'The Borg cube, ray-marched machinery under a rail lattice', box: 'A shaded box with its edges drawn' } },
        size: {
            description: 'Its size, scene units: one number for a cube, or [x, y, z] for a box. Default 20.',
            anyOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'array', items: { type: 'number', exclusiveMinimum: 0 }, minItems: 3, maxItems: 3 }, settingBinding, settingTemplate]
        },
        color: objectColor('borg: the light from inside and the tint of the hull (default var(--lcards-green-medium)). box: the box colour (default var(--lcards-gray-medium)).'),
        glow: part('borg: the glow spots.', {
            color: objectColor('Glow spot colour. Default var(--lcards-green-lightest).')
        }),
        detail: { type: 'boolean', default: true, description: 'borg: true (default) carves the machinery into the faces (ray-marched, about as costly as the screen effect\'s cube); false draws flat faces with the lattice, for slow graphics hardware.' },
        seed: { type: 'integer', default: 1, description: 'borg: where the glow spots sit. A different number moves them.' },
        edges: part('box: draw the edges: true (default), false, or { color }.', {
            color: objectColor('Edge colour. Default theme:colors.ui.secondary.')
        }, { toggle: true }),
        opacity: setting('box: opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
        occlude: { type: 'boolean', default: true, description: 'Hide labels and cards behind it.' }
    }
};

const trailObject = {
    type: 'object',
    title: 'trail',
    required: ['type', 'point'],
    allOf: [objectCommonSchema],
    description: 'A line behind a moving point showing where it has been (a ship\'s wake, a planet\'s recent orbit), built while the card is open.',
    properties: {
        type: { type: 'string', const: 'trail', description: 'trail: where a moving point has been.' },
        point: { type: 'string', description: 'The id of the point to follow: one that moves (on a spinning ring, on a model part, or placed from an entity).' },
        length: setting('How far back the trail reaches, seconds of the point\'s motion.', { exclusiveMinimum: 0, default: 10 }),
        fade_tail: { type: 'boolean', default: true, description: 'Fade from the colour at the point to black at the tail (the background, in space). false: one colour all along.' },
        width: lineCommon.width,
        ...dashKey,
        color: objectColor('Trail colour (at the point). Default var(--lcars-orange).'),
        blend: blendAdd,
        ...flowKeys
    }
};

const imageObject = {
    type: 'object',
    title: 'image',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'Your own picture (a galaxy photo, a chart) lying on the scene plane.',
    properties: {
        type: { type: 'string', const: 'image', description: 'image: a picture on the scene plane.' },
        src: { type: 'string', assetSource: 'image', description: 'The image: a built-in one (builtin:<name>), a path or URL (/local/galaxy.jpg), or a Home Assistant media item (media-source://...).' },
        size: settingOrPair('Width and depth [w, d], scene units (one number for a square); a disc takes the width as its diameter. Default 200.'),
        shape: { type: 'string', enum: [...IMAGE_SHAPES], 'x-ui-hints': { widget: 'shape' }, default: 'plane', description: 'plane (a rectangle) or disc.' },
        alt: setting('Height above the plane, scene units (just under it by default, so grids draw over it).', { default: -0.01 }),
        blend: { ...blendAdd, description: 'add: black in the image becomes see-through (a photo of space on black). Default normal.' }
    }
};

const glowObject = {
    type: 'object',
    title: 'glow',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A soft light that always faces the camera: a galactic core, a star, a beacon.',
    properties: {
        type: { type: 'string', const: 'glow', description: 'glow: a soft camera-facing light.' },
        size: setting('Diameter, scene units.', { minimum: 0, default: 60 }),
        color: objectColor('Colour. Default var(--lcards-moonlight).'),
        opacity: setting('Opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.9 }),
        falloff: setting('How fast it fades from the middle: higher is a tighter, brighter core.', { minimum: 0.25, default: 2 }),
        blend: { type: 'string', enum: ['add', 'normal'], default: 'add', description: 'add (default): light adds up. normal: drawn over what is behind.' }
    }
};

const beltObject = {
    type: 'object',
    title: 'belt',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'An asteroid belt: a band of low-poly rocks round the object\'s centre (at), lit from the centre as by its star. Seeded, so the same config always gives the same belt.',
    properties: {
        type: { type: 'string', const: 'belt', description: 'belt: an asteroid belt.' },
        radius: settingOrPair('[inner, outer] radius of the band, scene units; one number is the outer radius (the inner is 0.8 of it). Default [80, 100].'),
        thickness: setting('How far the rocks spread above and below the plane, scene units. Default 0.15 of the band\'s width.', { minimum: 0 }),
        count: wholeSetting('How many rocks (at most 5000).', { minimum: 0, maximum: 5000, default: 600 }),
        size: settingOrPair('Rock size [smallest, largest], scene units (many small ones, a few large); one number is the largest (the smallest is a quarter of it). Default [0.4, 1.6].'),
        seed: { type: 'integer', default: 1, description: 'A different number gives a different belt.' },
        period: setting('Seconds for the inner edge to go round once (the outer rocks take longer, as real orbits do). 0: still. Off under reduced motion.', { minimum: 0, default: 0 }),
        tumble: setting('How fast the rocks turn on their own axes, degrees per second (each a little faster or slower). 0: still. Off under reduced motion.', { minimum: 0, default: 30 }),
        color: objectColor('Rock colour (varied a little per rock). Default var(--lcards-gray-light).'),
        colors: { type: 'array', items: objectColor('A rock colour.'), description: 'Several rock colours: each rock takes one, picked by the seed (wins over color).' }
    }
};

/** What lights an asteroid or a comet: a point id or [x, y, z] */
const lightRef = (/** @type {string} */ what) => pointRef(`Where the light comes from (its star): a point id, or [x, y, z] in the frame it is in. ${what} Default the origin of its frame (a system's star; the scene's origin outside systems).`);

const asteroidObject = {
    type: 'object',
    title: 'asteroid',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'One irregular rock for a close look (lumps, craters, stretched its own way), tumbling, lit from its star (light). Seeded, so the same config always gives the same rock. Far away it shows as a dot. For many rocks round a centre use belt.',
    properties: {
        type: { type: 'string', const: 'asteroid', description: 'asteroid: one tumbling rock.' },
        size: setting('Largest extent, scene units.', { exclusiveMinimum: 0, default: 4 }),
        seed: { type: 'integer', default: 1, description: 'A different number gives a different rock.' },
        tumble: setting('How fast it turns on its own (seeded) axis, degrees per second. 0: still. Off under reduced motion.', { default: 10 }),
        light: lightRef('The side facing it is lit, the far side dark.'),
        color: objectColor('Rock colour (lit side). Default var(--lcards-gray-light).'),
        occlude: { type: 'boolean', default: true, description: 'Hide labels and cards behind it.' }
    }
};

const cometObject = {
    type: 'object',
    title: 'comet',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A comet: a small dark nucleus, a glowing coma round it and two tails pointing away from its star (light): a straight ion tail and a broader dust tail that bends back along the comet\'s path as it moves. Seeded. With activity.mode: distance it brightens and grows its tails as it nears its star.',
    properties: {
        type: { type: 'string', const: 'comet', description: 'comet: a nucleus, a coma and tails.' },
        nucleus: part('The nucleus: the small dark rock at the heart.', {
            size: setting('Its largest extent, scene units.', { exclusiveMinimum: 0, default: 2 }),
            color: objectColor('Its colour. Default var(--lcards-gray-medium-dark).'),
            tumble: setting('How fast it turns on its own axis, degrees per second. 0: still. Off under reduced motion.', { default: 10 })
        }, { group: 'main' }),
        coma: part('The coma: the glowing cloud round the nucleus.', {
            size: setting('Its diameter, scene units.', { minimum: 0, default: 10 }),
            color: objectColor('Its colour. Default color.')
        }),
        tail: part('Both tails.', {
            length: setting('How far the tails reach away from the star, scene units (the dust tail fades sooner).', { minimum: 0, default: 60 })
        }, { group: 'main' }),
        ion_tail: part('The straight ion tail: true (default), false, or { color }.', {
            color: objectColor('Its colour. Default var(--lcards-blue-medium).')
        }, { toggle: true }),
        dust_tail: part('The broad dust tail that bends back along the comet\'s path: true (default), false, or { color }.', {
            color: objectColor('Its colour. Default color.')
        }, { toggle: true }),
        glow: setting('Opacity of the coma and the tails, 0 to 1 (the nucleus stays).', { minimum: 0, maximum: 1, default: 1 }),
        light: lightRef('The tails point away from it, and the nucleus is lit from it.'),
        activity: part('How the coma and tails change with the distance to the star.', {
            mode: { type: 'string', enum: [...COMET_ACTIVITY], default: 'fixed', description: 'fixed: the coma, tails and glow as set. distance: scaled by the distance to the star every frame, full at range\'s near end, falling with the square of the distance, gone at its far end.', enumDescriptions: { fixed: 'As set', distance: 'Grows and brightens near its star' } },
            range: tuple(2, '[near, far] distance from the star for mode: distance, scene units (the frame\'s, in a system). Default [50, 300].')
        }, { group: 'main' }),
        seed: { type: 'integer', default: 1, description: 'A different number gives a different nucleus and tail.' },
        color: objectColor('Colour of the coma and the dust tail (unless they set their own). Default var(--lcards-moonlight).')
    }
};

const galaxyObject = {
    type: 'object',
    title: 'galaxy',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A spiral galaxy in 3D: seeded stars along a bar, a bulge, spiral arms and a thin disc, with soft glow on the arms and the core and dust lanes, at their real places (parallax as the camera moves). The Milky Way by default: the bar, Scutum-Centaurus and Perseus, Sagittarius and Norma, and the Orion spur; the Sun\'s place is 0.52 of the radius toward bearing 180.',
    properties: {
        type: { type: 'string', const: 'galaxy', description: 'galaxy: a spiral galaxy.' },
        radius: setting('Radius of the disc, scene units. Default the Milky Way\'s, 50000 light years: 50000 in scene units or ly, converted when the units are named (km, au, pc).', { exclusiveMinimum: 0 }),
        thickness: setting('The disc\'s thickness as a fraction of the radius.', { minimum: 0, maximum: 0.5, default: 0.02 }),
        seed: { type: 'integer', default: 3, description: 'A different number gives a different scatter of stars.' },
        arms: part('The spiral arms: the Milky Way\'s unless count is set.', {
            count: wholeSetting('A spiral of this many equal arms instead of the Milky Way\'s (leave out for the Milky Way).', { minimum: 1, maximum: 8 }),
            pitch: setting('How tightly the arms wind, degrees (the Milky Way\'s are about 12; larger opens them).', { minimum: 4, maximum: 45, default: 12 }),
            color: objectColor('Colour the arm stars lean toward, and the arms\' glow. Default var(--lcars-blue).')
        }, { group: 'main' }),
        bar: part('The central bar.', {
            length: setting('The central bar\'s half-length as a fraction of the radius (0: no bar).', { minimum: 0, maximum: 0.8, default: 0.32 }),
            angle: setting('Bearing of the bar\'s near end, degrees; the arms start at its ends and turn with it. Default 153: 27 degrees off the line from the centre to the Sun\'s place, as in the Milky Way.', { default: 153 })
        }, { group: 'main' }),
        stars: part('The stars.', {
            count: wholeSetting('How many stars (at most 100,000). Far away fewer of them draw.', { minimum: 0, maximum: 100000, default: 40000 }),
            color: objectColor('Their base colour. Default var(--lcards-moonlight).')
        }, { group: 'main' }),
        core: part('The bulge and the core\'s glow.', {
            color: objectColor('Colour of the bulge and bar stars and the core\'s glow. Default var(--lcars-yellow).')
        }),
        glow: setting('Opacity of the soft glow along the arms and at the core, 0 to 1 (0: none).', { minimum: 0, maximum: 1, default: 0.6 }),
        dust: part('The dark dust lanes on the arms\' inner edges.', {
            amount: setting('Their opacity, 0 to 1 (0: none).', { minimum: 0, maximum: 1, default: 0.5 }),
            color: objectColor('Their colour. Default the background colour.')
        })
    }
};

/** A bolt's look and timing: the lightning object's keys, and a nebula's own lightning */
const lightningLook = {
    color: objectColor('The bolt\'s colour (its bright core). Default var(--lcards-moonlight).'),
    glow: part('The soft glow round the bolt: true (default), false, or { color, width }.', {
        color: objectColor('Glow colour. Default the bolt\'s colour.'),
        width: setting('How wide the glow is, times the bolt\'s width.', { minimum: 0, default: 6 })
    }, { toggle: true }),
    width: setting('The bolt\'s width, px (its branches are about half as wide).', { minimum: 0.5, default: 2 }),
    rate: setting('strike: about how many strikes a second (the pauses vary round it). 0: none. Off under reduced motion.', { minimum: 0, default: 0.5 }),
    flash: setting('strike: how long a strike shows, ms: a quick rise, a fade and a weaker second stroke.', { minimum: 30, default: 150 }),
    jaggedness: setting('How far the channel zigzags, 0 (straight) to 1. Default 0.5 for a strike, 0.25 for a column.', { minimum: 0, maximum: 1 }),
    branches: wholeSetting('Forks off the main channel (each may fork once more). Default 3 for a strike, 1 for a column.', { minimum: 0, maximum: 8 }),
    brightness: setting('How strongly it lights the gas of a volume nebula, 0 (not at all) to 2.', { minimum: 0, maximum: 2, default: 1 }),
    seed: { type: 'integer', default: 1, description: 'Where the strikes fall and how the bolts are shaped: a different number gives different ones.' }
};

const lightningObject = {
    type: 'object',
    title: 'lightning',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'Lightning: jagged forked bolts that flash and go at random places in a region (mode: strike), or held flickering columns from its floor to its ceiling (mode: column). A bolt inside a volume nebula lights the gas round it.',
    properties: {
        type: { type: 'string', const: 'lightning', description: 'lightning: flashing bolts or held columns.' },
        mode: {
            type: 'string',
            enum: [...LIGHTNING_MODES],
            default: 'strike',
            enumDescriptions: { strike: 'Bolts that flash and go', column: 'Held, flickering columns' },
            description: 'strike (default): a bolt flashes at a random place in the region, mostly from high to low, then a pause (rate). column: count bolts held from the region\'s floor to its ceiling, crawling and flickering. Under reduced motion strikes never show and columns stand still and dim.'
        },
        radius: setting('The region: a ball this big round the object, scene units. Default 50.', { exclusiveMinimum: 0 }),
        size: {
            description: 'Or a box [width, height, depth] (one number for a cube), scene units. Replaces radius.',
            anyOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'array', items: { type: 'number', exclusiveMinimum: 0 }, minItems: 3, maxItems: 3 }, settingBinding, settingTemplate]
        },
        count: wholeSetting('column: how many columns, spread over the region.', { minimum: 1, maximum: 10, default: 1 }),
        speed: setting('column: how fast the held bolts crawl (take a new shape) and flicker: 1 (default) as drawn, 0.5 half as fast, 0 still. Strikes are timed by rate and flash.', { minimum: 0, default: 1 }),
        lights: { type: 'boolean', default: true, description: 'Light the gas of every volume nebula a bolt is inside (true, default). false: the bolts only.' },
        ...lightningLook
    }
};

const nebulaObject = {
    type: 'object',
    title: 'nebula',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'Clouds of gas in the scene (the nebula background preset in 3D): they shift against each other and the grids as the camera turns, and fade as you fly into them.',
    properties: {
        type: { type: 'string', const: 'nebula', description: 'nebula: clouds of gas.' },
        preset: {
            type: 'string',
            enum: [...NEBULA_PRESETS],
            enumDescriptions: { badlands: 'The Badlands (Deep Space Nine): liquid fire, a bright band, fire columns', badlands_voyager: 'The Badlands (Voyager): mauve layers, pink lightning columns, strikes', nexus: 'The Nexus (Generations): a white-hot ribbon trailing pink gas' },
            description: 'A named nebula to start from; the keys you set win over it (in band, columns, lightning, ribbon and wake, key by key). badlands: two sheets of liquid fire in yellow, orange and red, an orange band glowing between them and fire columns, thick and thin (Deep Space Nine). badlands_voyager: mauve and peach layers, held pink lightning columns and strikes that light the gas (Voyager). Both are render: volume, shape: layers in a 500 wide box. nexus: a white-hot ribbon waving across a 2000 long box, a wake of pink and red gas trailing it and small discharges crawling off it (Generations); render: volume, shape: wake. Set size to change the box.'
        },
        render: {
            type: 'string',
            enum: ['puffs', 'volume'],
            default: 'puffs',
            enumDescriptions: { puffs: 'Soft puffs facing the camera', volume: 'One body of gas you can fly into' },
            description: 'How the gas is drawn. puffs (default): a few soft puffs a cloud, facing the camera. volume: the same clouds as one body of gas filling the region, fading out at its edges; seen from inside, there is gas all round.'
        },
        density: setting('render: volume only: how thick the gas is (1 default; 2 twice as thick).', { minimum: 0, default: 1 }),
        shape: {
            type: 'string',
            enum: [...NEBULA_SHAPES],
            'x-ui-hints': { widget: 'shape' },
            default: 'clouds',
            enumDescriptions: { clouds: 'Clouds', shell: 'A hollow sphere', bipolar: 'An hourglass', filaments: 'Thin strands', cavity: 'A hollow open on one side', layers: 'A floor and a ceiling with a gap', wake: 'A ribbon trailing a sheet of gas' },
            description: 'render: volume only: the form of the gas. clouds (default): the clouds themselves. shell: a thin hollow sphere (the Ring nebula). bipolar: an hourglass along the object\'s y axis, two hollow lobes joined at a narrow waist (the Butterfly). filaments: long thin strands running along the object\'s x axis (the Veil). cavity: a thick cup round a hollow that opens on the object\'s +z side (a blister, as in Orion). layers: a floor and a ceiling of gas across the region with a gap between (the Badlands): colors run from each sheet\'s surface into its depth; gap, veins, band and columns shape it. wake: a bright ribbon waving along the object\'s x axis near the bottom of the region and a sheet of gas trailing it upward (the Nexus): colors run from the ribbon out; ribbon and wake shape it. In every shape but clouds the clouds give the clumps and colours inside the form; turn it with rotation.'
        },
        gap: setting('shape: layers only: how much of the height is open between the floor and the ceiling, 0 (they touch) to 0.9.', { minimum: 0, maximum: 0.9, default: 0.56 }),
        veins: setting('shape: layers only: bright fine veins in the sheets\' surfaces with darker gas between (liquid fire), 0 (none) to 1.', { minimum: 0, maximum: 1, default: 0 }),
        band: part('shape: layers only: a band of light glowing in the gap, brightest in a thin sheet at its middle: true, false (default), or { brightness, width, color }.', {
            brightness: setting('How bright, 0 to 3.', { minimum: 0, maximum: 3, default: 1 }),
            width: setting('How far its glow reaches from the middle, a fraction of half the height.', { minimum: 0.01, maximum: 0.5, default: 0.08 }),
            color: objectColor('Its colour. Default var(--lcards-moonlight).')
        }, { toggle: true }),
        columns: part('shape: layers only: columns standing from the floor to the ceiling, spread over the region.', {
            count: wholeSetting('How many.', { minimum: 1, maximum: 10, default: 4 }),
            kind: { type: 'string', enum: [...COLUMN_KINDS], default: 'fire', enumDescriptions: { fire: 'Rising flame', vortex: 'A twisting funnel', lightning: 'A held bolt' }, description: 'fire (default): rising flame, wide at the foot with a splash ring on the floor. vortex: a twisting funnel, narrow at its middle (waist), dark at its rim. lightning: a held, crawling bolt that lights the gas round it.' },
            width: settingOrPair('fire and vortex: how thick, times the usual: one number, or [thinnest, thickest] and each column gets its own width between them (thick columns and thin strands together). Default 1.'),
            waist: setting('vortex: how wide the middle is against the ends, 0.05 (two funnels meeting at a point) to 1 (one straight column).', { minimum: 0.05, maximum: 1, default: 0.2 }),
            color: objectColor('Their colour: the fire\'s white-hot heart (its edge takes the sheets\' surface colour), the vortex, or the bolt. Default var(--lcards-moonlight).'),
            speed: setting('lightning: how fast the bolts crawl and flicker: 1 (default) as drawn, 0.5 half as fast, 0 still.', { minimum: 0, default: 1 }),
            glow: part('lightning: the glow round the bolts.', {
                color: objectColor('Glow colour. Default the column colour.')
            })
        }),
        ribbon: part('shape: wake only: the bright line the wake trails, and the curve it follows: true (default), false (the gas only), or { waves, amplitude, speed, width, color, glow }.', {
            waves: setting('How many waves along it, end to end.', { minimum: 0, default: 2.5 }),
            amplitude: setting('How far it waves, a fraction of half the region\'s height (a little less in depth).', { minimum: 0, maximum: 0.5, default: 0.2 }),
            speed: setting('How fast the waves run along it, scene units a second (the wake streams out from it as fast); negative runs the other way. Default 0: still. Off under reduced motion.', { default: 0 }),
            width: setting('The line\'s width, px.', { minimum: 0.5, default: 6 }),
            color: objectColor('The line\'s colour, and the gas right at it (white-hot). Default var(--lcards-moonlight).'),
            glow: part('The glow round the line, and the gas near it: true (default), false, or { color, width }.', {
                color: objectColor('Glow colour. Default the first of colors.'),
                width: setting('How wide the outer glow is, times the line\'s width.', { minimum: 0, default: 8 })
            }, { toggle: true })
        }, { toggle: true }),
        wake: part('shape: wake only: the sheet of gas trailing the ribbon.', {
            side: { type: 'string', enum: ['up', 'down'], default: 'up', enumDescriptions: { up: 'Above the ribbon', down: 'Below the ribbon' }, description: 'Which way it trails: up (default, the ribbon near the bottom of the region) or down (the ribbon near the top). Turn the whole object with rotation to trail it another way.' },
            lean: setting('How far it leans along the ribbon as it goes out, -1 to 1 (a fan trailing to one side seen from afar). Default 0: straight out.', { minimum: -1, maximum: 1, default: 0 })
        }),
        lightning: part('render: volume only: lightning in the gas, lighting it: true (default settings), false (default), or the settings of a lightning object\'s strikes; with shape: wake, mode: crawl sets discharges crawling off the ribbon instead.', {
            mode: { type: 'string', enum: ['strike', 'crawl'], default: 'strike', enumDescriptions: { strike: 'Bolts that flash and go', crawl: 'Discharges crawling off the ribbon' }, description: 'strike (default): bolts flash at random places in the gas. crawl (shape: wake only): count short bolts and small loops stand off the ribbon, flicker and jump along it.' },
            count: wholeSetting('crawl: how many discharges at once.', { minimum: 1, maximum: 40, default: 6 }),
            reach: setting('crawl: how far they stand off the ribbon, a fraction of half the region\'s height.', { minimum: 0.01, maximum: 1, default: 0.35 }),
            speed: setting('crawl: how fast they flicker, reshape and jump: 1 (default) as drawn, 0.5 half as fast.', { minimum: 0, default: 1 }),
            ...lightningLook
        }, { toggle: true }),
        stretch: setting('Seeded clouds: how drawn out each one is, 0 (round, default) to 1 (long and flat), each turned its own way. Hand-placed clouds take size and rotation instead.', { minimum: 0, maximum: 1, default: 0 }),
        core: part('The gas deep inside (in a shape other than clouds: near its middle).', {
            color: objectColor('Colour there, running out to the cloud colours at the edges. Default none: the cloud colours throughout.')
        }),
        dust: part('render: volume only: dark dust clouds that hide the gas behind them.', {
            amount: setting('How dark they are, 0 to 1.', { minimum: 0, maximum: 1, default: 0.8 }),
            count: wholeSetting('How many the seed lays across the gas clouds (their own seed stream: adding dust moves no gas cloud).', { minimum: 0, maximum: 4, default: 0 }),
            color: objectColor('Their colour. Default black. With blend: add the dust darkens only this nebula\'s gas behind it; with blend: normal it also hides what is behind the nebula.')
        }),
        radius: setting('The clouds sit inside a ball this big round the object, scene units. Default 100.', { exclusiveMinimum: 0 }),
        size: {
            description: 'Or inside a box [width, height, depth] (one number for a cube), scene units. Replaces radius.',
            anyOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'array', items: { type: 'number', exclusiveMinimum: 0 }, minItems: 3, maxItems: 3 }, settingBinding, settingTemplate]
        },
        count: wholeSetting('How many clouds the seed places (the background preset\'s key).', { minimum: 1, maximum: 10, default: 4 }),
        clouds: {
            type: 'array',
            maxItems: 10,
            description: 'Clouds placed by hand, instead of count and the seed.',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    xyz: tuple(3, 'Where the cloud sits [x, y, z], scene units from the object.'),
                    radius: setting('Cloud radius, scene units. Default between min_radius and max_radius.', { exclusiveMinimum: 0 }),
                    color: objectColor('This cloud\'s colour. Default from colors.'),
                    opacity: setting('Opacity, 0 to 1. Default random within brightness.', { minimum: 0, maximum: 1 }),
                    size: tuple(3, 'Or an ellipsoid [width, height, depth], scene units (replaces radius).'),
                    rotation: tuple(3, 'Turn the ellipsoid [x, y, z] in degrees, as an object\'s rotation.'),
                    dust: { type: 'boolean', default: false, description: 'render: volume only: a dark dust cloud that hides the gas behind it (dust.amount, dust.color) instead of glowing.' }
                }
            }
        },
        min_radius: setting('Smallest cloud radius, scene units. Default 0.15 of the region.', { exclusiveMinimum: 0 }),
        max_radius: setting('Largest cloud radius, scene units. Default 0.4 of the region.', { exclusiveMinimum: 0 }),
        brightness: brightness('Each cloud\'s opacity is picked at random between these [dimmest, brightest], 0 to 1 (a cloud\'s own opacity wins). Default [0.3, 0.8].', [0.3, 0.8], true),
        colors: {
            description: 'Cloud colour, or a list the seed picks from per cloud. Default var(--lcars-violet).',
            oneOf: [objectColor('A colour.'), { type: 'array', items: objectColor('A colour.'), minItems: 1 }]
        },
        turbulence: setting('How ragged the cloud edges are, 0 to 1.', { minimum: 0, maximum: 1, default: 0.5 }),
        noise_scale: setting('Detail of the gas per scene unit: lower is larger, smoother wisps. Default about 1.5 noise cells across a cloud.', { minimum: 0 }),
        drift: settingOrPair('How fast the gas churns, scene units per second: one number, or [x, y] across the clouds. Default 0 (still). Off under reduced motion.'),
        seed: setting('Random seed: the same seed places the same clouds.', { default: 1 }),
        blend: { type: 'string', enum: ['add', 'normal'], default: 'add', description: 'add (default): light adds up, no sorting needed. normal: drawn over what is behind.' }
    }
};

const modelObject = {
    type: 'object',
    title: 'model',
    required: ['type', 'src'],
    allOf: [objectCommonSchema],
    description: 'A glTF / GLB model. Points stand on it with object: (and xyz or part).',
    properties: {
        type: { type: 'string', const: 'model', description: 'model: a glTF / GLB model.' },
        src: { type: 'string', assetSource: 'model', description: 'The file: a model shipped with LCARdS (builtin:constitution, a starship; builtin:deep_space_nine, builtin:earth_spacedock, builtin:utopia_planitia_drydock, starbases) or your own .glb / .gltf: from the My models folder (/config/www/lcards/models, media-source://lcards/my_models/<file>), or a path or URL. Meshopt compression works, Draco does not.' },
        size: setting('Largest extent, scene units (the file is scaled and centred). Leave it out to draw the model at its real size (length, else what the file measures in file_units) in the scene\'s units (or its system\'s); a scene without units draws it at 50.', { exclusiveMinimum: 0 }),
        length: { type: 'number', exclusiveMinimum: 0, 'x-ui-hints': { label: 'Length (m)' }, description: 'The real length in metres (the model\'s largest extent), for a file not made at its true scale (many downloads): drawn that long, whatever the file measures, in the scene\'s units. size, when set, wins; a scene without units draws it at 50.' },
        file_units: { type: 'string', enum: [...FILE_UNIT_NAMES], default: 'm', description: 'The units the file was made in, for its real size (no size or length set): m (default; glTF files and the built-in models are in metres), cm, mm, km, ft or in.' },
        material: { type: 'string', enum: [...MODEL_MATERIALS], default: 'hologram', description: 'hologram (default): a glow with a bright rim and scanlines. original: the file\'s materials, lit.' },
        color: objectColor('Hologram body colour. Default var(--lcars-blue).'),
        rim: part('The hologram\'s bright rim.', {
            color: objectColor('Rim colour. Default var(--lcards-moonlight).')
        }),
        opacity: setting('Opacity, 0 to 1 (a hologram\'s brightness).', { minimum: 0, maximum: 1, default: 0.85 }),
        scanlines: setting('Scanline strength, 0 (none) to 1.', { minimum: 0, maximum: 1, default: 0.5 }),
        scan: scanPart('It sweeps along the model.'),
        solid: { type: 'boolean', default: true, description: 'false: see-through.' },
        blend: { type: 'string', enum: ['add', 'normal'], default: 'add', description: 'Hologram blending: add (default) or normal.' },
        edges: part('Feature edges: true, false, or { angle, color }. Default on for hologram, except on a model over 250,000 triangles (working them out freezes the page for seconds); true or an object draws them anyway.', {
            angle: setting('Edges where faces meet at more than this angle, degrees.', { minimum: 0, maximum: 180, default: 30 }),
            color: objectColor('Edge colour. Default the rim colour.')
        }, { toggle: true }),
        animation: {
            description: 'Clips to loop: all, a name or a list. None when left out.',
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }]
        },
        occlude: { type: 'boolean', default: true, description: 'Hide labels behind it.' }
    }
};

const OBJECT_SCHEMAS = { lightning: lightningObject, model: modelObject, grid: gridObject, volume: volumeObject, sphere: sphereObject, ring: ringObject, path: pathObject, beam: beamObject, image: imageObject, glow: glowObject, nebula: nebulaObject, belt: beltObject, asteroid: asteroidObject, comet: cometObject, galaxy: galaxyObject, trail: trailObject, cube: cubeObject };

/** Object types a system can hold: every type but another system (one level) */
const DRAWN_TYPES = OBJECT_TYPES.filter((t) => t !== 'system');

/** An object inside a system: the same branches, without system */
const systemMemberSchema = {
    description: `An object inside the system, in the system's units. type picks one of: ${DRAWN_TYPES.join(', ')} (a system holds no other system).`,
    type: 'object',
    required: ['type'],
    discriminator: { propertyName: 'type' },
    oneOf: DRAWN_TYPES.map((t) => OBJECT_SCHEMAS[/** @type {keyof typeof OBJECT_SCHEMAS} */ (t)])
};

const unitsSchema = (/** @type {string} */ description, /** @type {string} */ empty) => ({
    type: 'string',
    enum: [...UNIT_NAMES],
    description,
    'x-ui-hints': { empty },
    enumDescriptions: { m: 'Metres', km: 'Kilometres', au: 'Astronomical units (149,597,870.7 km)', ly: 'Light years', pc: 'Parsecs (3.26 light years)' }
});

const systemObject = {
    type: 'object',
    title: 'system',
    required: ['type'],
    description: 'A star system at true scale inside a larger scene: a solar system in km at a point of a galaxy in light years. Its points and objects are in its own units (positions, sizes, offsets, fade, min_distance and max_distance) and keep their precision however small they are next to the scene; the camera works in the system\'s units while it is near. Ids are card-wide: views, fly-to, rules and paths name its points and objects as any others. Not rotated: its axes are the scene\'s.',
    properties: {
        type: { type: 'string', const: 'system', description: 'system: points and objects in units of their own.' },
        id: { type: 'string', description: 'Name of the system. Default system#n.' },
        at: pointRef('Where the system\'s origin sits: a point of the scene (it stays there) or [x, y, z] in scene units. Default the origin.'),
        units: unitsSchema('What one unit inside the system is (m, km, au, ly or pc). Needs the scene\'s units. Default: the scene\'s units (or scale).', '(The scene\'s units)'),
        scale: setting('How many of the scene\'s units one unit inside the system is (a ratio), when the units have no name. Wins over units.', { exclusiveMinimum: 0 }),
        visible: { type: 'boolean', default: true, description: 'false hides everything in the system (its points still work).' },
        points: { type: 'array', description: 'The system\'s points, in its units (polar: [149597870.7, 30] puts Earth 1 AU out in km).', items: pointSchema },
        objects: { type: 'array', description: 'The system\'s objects, in its units.', items: systemMemberSchema }
    }
};
Object.assign(OBJECT_SCHEMAS, { system: systemObject });

/** One scene object (published as its own shared file, scripts/lib/schema-publish.js) */
export const objectSchema = {
    description: `What the scene draws. type picks one of: ${OBJECT_TYPES.join(', ')}.`,
    type: 'object',
    required: ['type'],
    // ajv (validator, tests) picks the branch by type and reports only its errors
    discriminator: { propertyName: 'type' },
    oneOf: OBJECT_TYPES.map((t) => /** @type {Record<string, any>} */ (OBJECT_SCHEMAS)[t])
};

// ── The card ─────────────────────────────────────────────────────────────────

export const astrometricsSchema = {
    type: 'object',
    required: ['type'],
    properties: {
        type: {
            type: 'string',
            const: 'custom:lcards-astrometrics-card',
            description: 'custom:lcards-astrometrics-card: a 3D astrometrics scene.',
            'x-ui-hints': { hidden: true }
        },
        camera: cameraSchema,
        backdrop: {
            type: 'object',
            description: 'What is behind the scene objects.',
            properties: { stars: starsSchema, dust: dustSchema }
        },
        background_animation: backgroundAnimationSchema,
        labels: {
            type: 'object',
            description: 'How labels are drawn: text defaults for every label, your own label styles, pixel snapping.',
            properties: {
                default: { type: 'object', properties: labelStyleProperties, description: 'Text keys every label on this card inherits (font_family, text_transform, letter_spacing, ...), over the built-in styles.' },
                styles: {
                    type: 'object',
                    description: 'Label styles by name: change a built-in (title, major, minor, tiny) or add your own; a point picks one with style.',
                    additionalProperties: {
                        type: 'object',
                        description: 'A label style: text keys (font_size, color, font_weight, ...) and priority.',
                        properties: {
                            ...labelStyleProperties,
                            priority: number('Which label wins when two overlap (higher wins).'),
                            overlap: { type: 'boolean', description: 'Labels of this style are never hidden by another label (they still move to a free side when they can).' }
                        }
                    }
                },
                overlap: { type: 'boolean', default: false, description: 'Every label on the card: never hidden when labels overlap (each still moves to a free side of its point when it can). false hides the lower-priority one, which keeps busy scenes readable. A style or a point can set its own.' },
                snap: { type: 'boolean', default: false, description: 'Round label positions to whole px (crisper text on weak devices; fast motion looks steppier). Default: sub-pixel.' }
            }
        },
        units: unitsSchema('What one scene unit is (m, km, au, ly or pc): positions, sizes and distances are in it. Optional: a scene can use any units of its own (scene units); naming them lets a system (type: system) give its own, models and starter parts start at their real size, and bodies (planet:) sit at real distances. Naming them does not rescale what is already there.', '(Scene units)'),
        model_scale: {
            type: 'string',
            enum: ['real', 'visible'],
            enumDescriptions: { real: 'Models at their real size', visible: 'Small models drawn larger' },
            'x-ui-hints': { widget: 'pills' },
            default: 'real',
            description: 'How models drawn at their real size (no size of their own) start: real (the default) keeps them in proportion, however small that is on screen; visible draws each at least 40 px across, real again once it is larger. The size button by the camera buttons, the V key and set-model-scale actions switch it on screen; that is not saved.'
        },
        look: {
            'x-ui-hints': { widget: 'pills' },
            default: 'mixed',
            description: 'Draw the scene as an LCARS diagram, realistically, or both: diagram shows the objects and points with look: diagram, realistic those with look: realistic, mixed (the default) both; ones without a look always show. A change crossfades. Or { entity } (and attribute) whose state names the look, such as an input_select with the options diagram, realistic and mixed (any case).',
            oneOf: [
                { type: 'string', enum: ['diagram', 'realistic', 'mixed'], enumDescriptions: { diagram: 'Wireframes and schematics', realistic: 'Realistic objects', mixed: 'Both' } },
                {
                    type: 'object',
                    description: 'The look from an entity',
                    properties: {
                        entity: { type: 'string', description: 'The entity whose state (or attribute) names the look.' },
                        attribute: { type: 'string', description: 'Read this attribute instead of the state.' }
                    },
                    required: ['entity'],
                    additionalProperties: false
                }
            ]
        },
        warp: {
            description: 'Go to warp: the backdrop stars and dust streak along the view and the warp starfield (spectrum streaks) streams past behind the scene, at warp_factor; false drops out of warp. Or { entity } (and attribute): at warp while it is on (on, true, or a number above 0), such as an input_boolean. Nothing under reduced motion. (camera.warp is different: streaks during a fly-to.)',
            oneOf: [
                { type: 'boolean' },
                {
                    type: 'object',
                    description: 'Warp from an entity',
                    properties: {
                        entity: { type: 'string', description: 'The entity that engages warp while it is on.' },
                        attribute: { type: 'string', description: 'Read this attribute instead of the state.' }
                    },
                    required: ['entity'],
                    additionalProperties: false
                }
            ]
        },
        warp_factor: setting('How fast the stars stream at warp, 1 to 9.9 (default 6). Can follow an entity ({ entity, to }), such as a slider, or a template.', { minimum: 1, maximum: 9.9, default: 6 }),
        time_scale: setting('Speed of the scene\'s motion (orbits, spins, drift, scans, trails): 1 as configured, 0.5 half speed, 2 twice as fast, 0 holds it still. Faster than 4 can be typed. The sky, the scene clock (clock) and the camera are not affected. The time slider (camera.buttons.time) changes it on screen. Can follow an entity ({ entity, to }) or a template.', {
            minimum: 0, default: 1, 'x-ui-hints': { selector: { number: { mode: 'slider', min: 0, max: 4, step: 0.05 } } }
        }),
        clock: {
            type: 'object',
            additionalProperties: false,
            description: 'The scene\'s date: it starts at date and runs on at rate. Body points, body spheres and rings, orbit rings and the sky follow it. The time slider (camera.buttons.time: date), set-clock actions and lcards.set_clock change it on screen.',
            properties: {
                date: {
                    'x-ui-hints': { widget: 'date' },
                    description: 'The date the scene starts at: now (the default) or a date and time. In YAML an ISO date or date and time (2026-10-30, 2026-10-30T12:00:00Z; a date alone is midnight UTC). Or { entity } to follow a date and time helper (an input_datetime), or a template.',
                    anyOf: [{ type: 'string' }, settingBinding],
                    default: 'now',
                    examples: ['now', '2026-10-30', '1969-07-20T20:17:00Z']
                },
                rate: {
                    'x-ui-hints': { widget: 'rate' },
                    description: 'How fast the date runs: live (real time, the default), paused (0), or an amount of time per second. In YAML days per second (1 is a day a second, 30 a month, 365.25 a year; 0 holds it; negative runs back), or with a unit as the time slider shows it: 1 h/s (an hour a second), 30 d/s, 1 y/s, -1 d/s (units s, min, h, d, w, mo, y). Or { entity, to } to follow an entity, or a template.',
                    anyOf: [{ type: 'number' }, { type: 'string', enum: ['live'] }, { type: 'string', pattern: RATE_PATTERN }, settingBinding, settingTemplate],
                    default: 'live'
                }
            }
        },
        points: { type: 'array', description: 'Named points with optional labels and markers (the placement system).', items: pointSchema },
        objects: { type: 'array', description: 'What is drawn: grids, volumes, spheres, models, images, glows, nebulae, rings, paths and beams.', items: objectSchema },

        // ── Identity & sizing ───────────────────────────────────────────────
        id: cardIdSchema,
        tags: tagsSchema,
        grid_options: gridOptionsSchema,
        height: { ...cardHeightSchema, description: 'Card height. Bare integer = px (default 400); CSS units accepted (50vh). The scene fills the card.' },
        width: cardWidthSchema,
        min_height: cardMinHeightSchema,
        min_width: cardMinWidthSchema,
        max_height: cardMaxHeightSchema,
        max_width: cardMaxWidthSchema,
        z_index: cardZIndexSchema,
        rules: rulesSchema,
        sounds: soundsSchema,
        state_classification: stateClassificationSchema,
        triggers_update: triggersUpdateSchema,
        data_sources: dataSourcesSchema,
        variables: {
            type: 'object',
            description: 'Your own named values, available to templates as variables.<name> and {variables.<name>}.',
            additionalProperties: true
        }
    }
};
