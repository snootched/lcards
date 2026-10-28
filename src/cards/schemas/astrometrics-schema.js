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
    OBJECT_TYPES, GRID_SHAPES, GRID_PATTERNS, VOLUME_SHAPES, IMAGE_SHAPES, MARKERS, LABEL_STYLE_NAMES, SKY_BODIES, FILL_EFFECTS, FILL_PRESETS, MODEL_MATERIALS,
    WELL_SHAPE_NAMES, DEFORM_TYPES, BEND_MOTIONS, DEFORM_ANCHORS
} from '../../core/astrometrics/names.js';
import { LABEL_POSITION_NAMES, LABEL_OMITTED_KEYS } from '../../core/astrometrics/label-text.js';

// ── Small building blocks ────────────────────────────────────────────────────

/** @param {string} description @param {object} [extra] */
const number = (description, extra = {}) => ({ type: 'number', description, ...extra });

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

/** A point id or [x, y, z] in scene units @param {string} description */
const pointRef = (description) => ({
    description,
    oneOf: [
        { type: 'string', description: 'A point id' },
        { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3, description: 'Scene coordinates [x, y, z]' }
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
        view: { type: 'string', description: 'The named view shown first. Default: the first of views; with no views the camera frames the whole scene.' },
        views: {
            type: 'object',
            description: 'Named views (keys are your names). Fly between them with a tap_action (action: fly-to, view: <name>).',
            additionalProperties: viewSchema
        },
        controls: { type: 'boolean', default: true, description: 'Drag to orbit, wheel or pinch to zoom, shift-drag, right-drag or two fingers to pan, double-tap blank space to zoom in, arrow keys when focused. false: the camera only moves by fly-to and auto_rotate.' },
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
        zoom_step: number('Distance factor of one zoom step (double-tap, zoom buttons, plus and minus keys). Default 2: each step halves the distance.', { exclusiveMinimum: 1, default: 2 }),
        double_tap: {
            type: 'string',
            enum: ['zoom', 'none'],
            default: 'zoom',
            description: 'A double-tap or double-click in blank space. zoom: fly in one zoom step toward that spot, which becomes the centre (shift: zoom out). none: nothing. Taps on points and tappable objects are never affected.'
        },
        buttons: {
            description: 'On-card camera buttons: pan arrows, zoom in and out, reset (back to the start view). Press and hold repeats. true for all of them in the bottom right; an object to choose. Default off.',
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
                        pan: { type: 'boolean', default: true, description: 'Show the pan arrows.' },
                        zoom: { type: 'boolean', default: true, description: 'Show zoom in and zoom out.' },
                        reset: { type: 'boolean', default: true, description: 'Show reset (fly back to the start view).' }
                    }
                }
            ]
        },
        limits: {
            type: 'object',
            description: 'Where drag and zoom stop: [min, max] pairs. A tilt range of one value (e.g. [90, 90]) locks the tilt, and a one-finger drag then pans (a map).',
            properties: {
                tilt: tuple(2, 'Lowest and highest tilt, degrees. Default [-90, 90].'),
                distance: tuple(2, 'Nearest and farthest distance, scene units.'),
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
                                center: tuple(3, 'Sphere centre [x, y, z]. Default: the centre of the scene.'),
                                x: tuple(2, 'Box: lowest and highest x.'),
                                y: tuple(2, 'Box: lowest and highest y.'),
                                z: tuple(2, 'Box: lowest and highest z.')
                            }
                        }
                    ]
                }
            }
        },
        auto_rotate: number('Turn the camera round its target, degrees per second (negative: the other way). 0 is off. Pauses while dragging; off under reduced motion.', { default: 0 }),
        fly_duration: number('How long a fly-to takes, ms. Under reduced motion the camera jumps.', { minimum: 0, default: 1600 }),
        ease: { type: 'string', default: 'inOutCubic', description: 'Easing of a fly-to (an anime.js easing name, such as inOutCubic, outQuad, linear).' },
        warp: { type: 'boolean', default: false, description: 'Every fly-to streaks the stars and dust (warp); a view\'s own warp wins. Off under reduced motion.' }
    }
};

// ── Backdrop and labels ──────────────────────────────────────────────────────

const starsSchema = {
    description: 'Stars at infinity: they turn with the camera and never move when it pans. true for the defaults, or settings (the starfield background preset\'s names).',
    oneOf: [
        { type: 'boolean' },
        {
            type: 'object',
            properties: {
                count: number('How many stars.', { minimum: 0, maximum: 50000, default: 2000 }),
                min_radius: number('Smallest star radius, px.', { minimum: 0, default: 0.4 }),
                max_radius: number('Largest star radius, px.', { minimum: 0, default: 1.2 }),
                min_opacity: number('Faintest star opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.35 }),
                max_opacity: number('Brightest star opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
                color: color('Star colour. Default var(--lcards-moonlight).'),
                colors: { type: 'array', items: simpleColorSchema, description: 'Several star colours, picked at random per star (wins over color).' },
                opacity: number('Opacity of the whole star layer, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
                seed: number('Random seed: the same seed places the same stars.', { default: 7 }),
                streak: number('How long stars and dust streak during a warp fly-to (camera.warp or a view\'s warp); 0: never.', { minimum: 0, default: 1 }),
                spectrum: { type: 'boolean', default: false, description: 'Streaks split into colour: a Doppler shift of each star\'s own colour, violet toward the tail and red toward the head (white stars show the whole rainbow).' },
                spectrum_direction: { type: 'string', enum: ['doppler', 'reverse'], default: 'doppler', description: 'doppler: violet toward the tail, as a real Doppler shift. reverse: violet toward the head.' }
            }
        }
    ]
};

const dustSchema = {
    description: 'Dust: faint particles round the scene that stay put as the camera moves, so every move shows depth; they streak in a warp fly-to. true for the defaults, or settings.',
    oneOf: [
        { type: 'boolean' },
        {
            type: 'object',
            properties: {
                count: number('How many particles.', { minimum: 0, maximum: 50000, default: 400 }),
                radius: number('They fill a ball this big round the scene centre, scene units. Default 1.5 x the scene\'s radius.', { exclusiveMinimum: 0 }),
                min_radius: number('Smallest particle radius, px.', { minimum: 0, default: 0.4 }),
                max_radius: number('Largest particle radius, px.', { minimum: 0, default: 1 }),
                min_opacity: number('Faintest particle, 0 to 1.', { minimum: 0, maximum: 1, default: 0.35 }),
                max_opacity: number('Brightest particle, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
                color: color('Particle colour. Default var(--lcards-moonlight).'),
                colors: { type: 'array', items: simpleColorSchema, description: 'Several colours, picked at random per particle (wins over color).' },
                opacity: number('Opacity of the whole layer, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
                seed: number('Random seed.', { default: 7 }),
                spectrum: { type: 'boolean', default: false, description: 'Streaks split into colour (a Doppler shift, as on the stars).' },
                spectrum_direction: { type: 'string', enum: ['doppler', 'reverse'], default: 'doppler', description: 'doppler: violet toward the tail. reverse: violet toward the head.' }
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
    description: 'Text keys for these labels (font, size, colour, background, ...): text.default applies to every one.',
    properties: { default: { ...labelFieldSchema, description: 'Text keys every label of this set takes.' } }
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
        polar: bindable(2, 'Position on the scene plane as [distance, bearing]: bearing in degrees, 0 north, clockwise seen from above; alt lifts it. With object: local to that object. Or { entity, attributes: [distance, bearing] }.', {
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
        sky: { type: 'string', enum: [...SKY_BODIES], description: 'Follow the sun or moon on the dome named in object, from the time and the Home Assistant location (sun.sun when it exists). Updated every minute.' },
        at: { type: 'string', description: 'Place it at another point (by id); add offset to move it from there.' },
        cell: { type: 'string', description: 'The centre of a sector map cell, such as AF3, on the grid named in object (a plane grid; its axis_labels say how cells are named).' },
        object: { type: 'string', description: 'The object the point stands on (an object id). Needed by latlon (a sphere), altaz and sky (a dome grid), cell (a plane grid) and part (a model); with xyz or polar the point moves and spins with the object (on a model: in the file\'s coordinates).' },
        part: { type: 'string', description: 'A named part (node) of the model in object: the point sits on it and follows it; xyz is an offset in the part\'s coordinates.' },
        alt: number('Height above the surface of the object in object (latlon, altaz, sky), or above the plane (polar), scene units.', { default: 0 }),
        offset: tuple(3, 'Moves the point by [x, y, z] scene units from where its form puts it.'),
        // label and marker
        entity: { ...entitySchema, description: 'The point\'s entity: its templates read it as entity, state colour maps follow its state, more-info and toggle actions use it, and latlon / altaz / xyz / polar can take their values from it.' },
        tags: { ...tagsSchema, description: 'Tags for rules: a rule on tag:<name> patches every point with the tag.' },
        label: { type: ['string', 'number'], description: 'Text shown at the point: short for text.label.content. Leave out for a marker only, or for a point that only anchors other things.' },
        text: pointTextSchema,
        style: styleNameSchema('Label style: a built-in (title 34 px, major 20 px, minor 13 px, tiny 10 px; larger ones win when labels overlap) or one of yours in labels.styles. Default minor.'),
        marker: { type: 'string', enum: [...MARKERS], default: 'none', description: 'Marker drawn at the point: dot, triangle, diamond, square, reticle (a target ring), moon_phase (the moon\'s lit part, from the sky) or none. A point with a marker can be tapped.' },
        color: { ...stateColorSchema, description: 'The point\'s colour: the marker, and the default for its text fields. A colour or a state map by the point\'s entity (a selected key while it is selected). CSS variables stay live, so alert modes recolour. Default by style: moonlight for title and major, the theme text colour for minor and tiny.' },
        visible: { type: 'boolean', default: true, description: 'false hides the label, marker and card (the point still places other things). Rules use it to hide and show points.' },
        opacity: number('Opacity of the label and marker, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
        priority: number('Which label wins when two overlap (higher wins; then the nearer one). Default by style: title 100, major 80, minor 40, tiny 10 (labels.styles can set its own).'),
        overlap: { type: 'boolean', description: 'When labels overlap, this one is never hidden: it still moves to the other side of its point when that is free, else it shows where it is (over the other one). Default: the style\'s, else labels.overlap (false).' },
        fade: tuple(2, 'Distance fade [start, end], scene units from the camera: fully shown nearer than start, gone past end.'),
        min_distance: number('Hidden when the camera is closer than this, scene units.', { minimum: 0 }),
        max_distance: number('Hidden when the camera is farther than this, scene units (detail that appears as you zoom in).', { minimum: 0 }),
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
    at: pointRef('Where the object sits: a point id (it follows the point) or [x, y, z]. Default the origin.'),
    rotation: tuple(3, 'Turn the object [x, y, z] in degrees: y is a bearing (clockwise from above), x tips it toward the camera, z rolls it.'),
    spin: number('Turn round the object\'s own vertical axis, degrees per second (positive is prograde). Off under reduced motion.', { default: 0 }),
    visible: { type: 'boolean', default: true, description: 'false hides the object (its points still work).' },
    opacity: number('Opacity of the whole object, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
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

/** The scan band (the background grid's keys) */
const scanKeys = {
    scan_period: number('Seconds per scan band sweep (0: none). A sphere sweeps north pole to south pole, a dome top to rim, a cylinder top to bottom, a polar disc rings out from the centre, a plane runs south to north. Off under reduced motion.', { minimum: 0, default: 0 }),
    scan_color: color('Scan band colour. Default var(--lcards-moonlight).')
};

/** An animated fill painted on a sphere's body or under a grid's lines (the plasma, fluid and contour-field background presets) */
const fillEffectSchema = {
    type: 'object',
    additionalProperties: false,
    description: 'An animated fill on the surface, from the background presets: plasma (two-colour bands), fluid (a one-colour wash) or contour (topographic bands); or bands (latitude belts, a gas giant). Seamless round a sphere, and it turns with spin. On a sphere it paints the body over fill, in place of image (the body still hides what is behind it). A preset is a planet type to start from; the keys you set win over it.',
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
        type: { type: 'string', enum: [...FILL_EFFECTS], description: 'plasma, fluid, contour (the contour-field preset) or bands (belts round the latitude, from the object\'s y axis). Default the preset\'s type, else plasma.' },
        color_a: color('plasma: first colour. Default var(--lcars-blue).'),
        color_b: color('plasma: second colour. Default var(--lcars-orange).'),
        color: color('fluid: wash colour (its alpha is how strong). Default var(--lcars-blue).'),
        colors: {
            description: 'contour: one colour, or stops spread over the bands from low to high. bands: the belt colours, repeated from the south pole to the north. Default blue to orange.',
            oneOf: [color('A colour.'), { type: 'array', items: color('A colour.'), minItems: 1 }]
        },
        base_frequency: number('Noise detail per scene unit: lower is larger features. Default about 3 noise cells across the radius.', { minimum: 0 }),
        num_octaves: { type: 'integer', minimum: 1, maximum: 8, description: 'Layers of finer detail (1 smooth, 8 rough). Default plasma 3, fluid 4, contour 2.' },
        num_bands: number('contour: how many bands (low is bold steps, high is near smooth). bands: how many belts pole to pole.', { minimum: 2, maximum: 64, default: 5 }),
        turbulence: number('bands: how much the belt edges swirl, 0 (straight) to 1 (stormy).', { minimum: 0, maximum: 1, default: 0.3 }),
        fill_level: number('contour: flood the lowest bands, 0 to 0.95 (0: none).', { minimum: 0, maximum: 0.95, default: 0 }),
        fill_color: color('contour: colour over the flooded bands. Default see-through.'),
        blend_colors: { type: 'boolean', default: true, description: 'contour and bands: colours fade between bands (false: flat bands with hard edges).' },
        speed: number('How fast the pattern flows through the object, scene units per second (0: still). Off under reduced motion.', { default: 0 }),
        opacity: number('Fill opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 })
    }
};

/** Grid look: the background grid effect's names, in scene units */
const gridLook = {
    pattern: { type: 'string', enum: [...GRID_PATTERNS], description: 'Line pattern (the background grid effect\'s names): both (rows and columns, default), horizontal, vertical, diagonal, hexagonal, dots, polar (rings and spokes; default on a disc).' },
    line_spacing: number('Distance between lines, scene units. On curved shapes line_spacing_deg is usually easier.', { exclusiveMinimum: 0 }),
    major_row_interval: { type: 'integer', minimum: 0, default: 0, description: 'A major (brighter, wider) line every N rows (rings on a disc); 0 for none.' },
    major_col_interval: { type: 'integer', minimum: 0, default: 0, description: 'A major line every N columns (spokes on a disc); 0 for none.' },
    line_width: number('Line width, px.', { minimum: 0, default: 1 }),
    line_width_major: number('Major line width, px. Default 1.5 x line_width (at least 1.5).', { minimum: 0 }),
    color: color('Line colour. Default theme:colors.ui.tertiary.'),
    color_major: color('Major line colour. Default: color, brighter.'),
    back_opacity: number('Opacity of the far side seen through the surface, 0 to 1 (0 hides it).', { minimum: 0, maximum: 1 }),
    blend: blendAdd,
    ...scanKeys
};

/** One `deform:` entry on a grid: a warp of its surface (core/astrometrics/deform.js) */
const deformSchema = {
    type: 'object',
    required: ['type'],
    additionalProperties: false,
    description: 'A deformation of the surface. Round the axis on a cylinder, sphere, dome or well; up and down on a plane or disc. The lines, the edges and the points on it move with it. Still unless period (or drift for noise) is set; holds still under reduced motion.',
    properties: {
        type: { type: 'string', enum: [...DEFORM_TYPES], description: 'wobble (bulges travelling round, or ripples across a flat grid), bend (the axis bends or sways; a flat grid curls), twist (turns more toward the far end; a flat grid swirls like a whirlpool) or noise (smooth random lumps).', enumDescriptions: { wobble: 'Travelling bulges or ripples', bend: 'Bending or swaying axis', twist: 'Twist or whirlpool', noise: 'Smooth random lumps' } },
        amplitude: number('wobble, bend, noise: how far the surface moves, as a fraction of the grid\'s size (its radius, or half a plane\'s longer side). Default wobble 0.08, bend 0.25, noise 0.05.'),
        lobes: { type: 'integer', minimum: 0, default: 3, description: 'wobble: bulges round the circumference (0: the whole ring swells at once; on a flat grid, ripples ring out from the centre).' },
        waves: number('wobble: waves along the axis (or out from the centre of a flat grid) between bulges, so they spiral.', { default: 1 }),
        period: number('wobble, bend, twist: seconds per cycle (a bulge travels round once, a sway goes to and fro, the bend turns once, the twist swings). 0: a still shape.', { minimum: 0, default: 0 }),
        drift: number('noise: how fast the lumps drift through the grid, scene units per second; 0 holds them still.', { default: 0 }),
        bearing: number('bend: direction the axis bends toward, degrees (0 north, clockwise from above).', { default: 0 }),
        motion: { type: 'string', enum: [...BEND_MOTIONS], default: 'sway', description: 'bend: sway (bends to and fro), circle (the bend turns round, a tornado) or none (a still bend).', enumDescriptions: { sway: 'Bends to and fro', circle: 'The bend turns round', none: 'Still bend' } },
        angle: number('twist: degrees turned at the far end (at the centre of a flat grid). With speed the twist swings between plus and minus this.', { default: 90 }),
        anchor: { type: 'string', enum: [...DEFORM_ANCHORS], default: 'bottom', description: 'bend, twist round an axis: the end that stays put (middle: both ends move).' },
        base_frequency: number('noise: detail per scene unit, lower is larger lumps (as on fill_effect). Default about 3 lumps across the grid\'s size.', { exclusiveMinimum: 0 }),
        num_octaves: { type: 'integer', minimum: 1, maximum: 6, default: 2, description: 'noise: layers of finer detail (as on fill_effect).' },
        seed: number('noise: changes the pattern.', { default: 0 })
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
        shape: { type: 'string', enum: [...GRID_SHAPES], default: 'plane', description: 'plane (size), disc (radius, or [inner, outer] for a hole in the middle), dome (a half sphere, radius), sphere (radius), cylinder (radius, height) or well (a funnel down from its rim: radius, depth, well_shape).' },
        size: numberOrPair('plane: width and depth [w, d], scene units (one number for a square). Default 200.'),
        radius: {
            description: 'disc, dome, sphere, cylinder, well (its rim): radius, scene units. A disc also takes [inner, outer] for a hole in the middle. Default 100.',
            oneOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2, maxItems: 2 }]
        },
        height: number('cylinder: height, scene units. Default the radius.', { exclusiveMinimum: 0 }),
        depth: number('well: depth below the rim, scene units (the rim is at the object\'s position). Default the radius.', { exclusiveMinimum: 0 }),
        well_shape: { type: 'string', enum: [...WELL_SHAPE_NAMES], default: 'trumpet', description: 'well: profile from the rim down. trumpet (a gravity well: flat at the rim, plunging to the throat), cone, bowl or wormhole (two trumpets throat to throat, the throat halfway down). well_profile replaces it.', enumDescriptions: { trumpet: 'Gravity well', cone: 'Straight sides', bowl: 'Rounded bottom', wormhole: 'Hourglass' } },
        well_throat: number('well: throat diameter as a fraction of the rim (well_shape).', { minimum: 0.02, maximum: 1, default: 0.15 }),
        well_profile: { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 2, maxItems: 32, description: 'well: any profile, diameters as fractions of the rim from the rim down, evenly spaced along the depth; a smooth curve passes through each. [1, 0.4, 0.2, 0.15] is a trumpet, [1, 0.2, 1] an hourglass. Replaces well_shape.' },
        deform: { type: 'array', items: deformSchema, description: 'Deformations of the surface, applied in order: wobble, bend, twist, noise. A wobbling cylinder is jelly; a well with bend (motion: circle) and twist is a tornado; a disc with twist is a whirlpool.' },
        line_spacing_deg: number('disc: a spoke every N degrees; dome, sphere, cylinder, well: rings and meridians every N degrees (a whole number fits round). Default 15 on curved shapes.', { exclusiveMinimum: 0 }),
        ...gridLook,
        fill_color: color('Colour filling the cells behind the lines. Default none.'),
        fill_effect: fillEffectSchema,
        spoke_count: { type: 'integer', minimum: 0, default: 36, description: 'pattern polar: spokes round the centre (meridians on a curved shape). line_spacing_deg wins on a disc.' },
        hex_radius: number('pattern hexagonal: hexagon size, scene units. Default line_spacing.', { exclusiveMinimum: 0 }),
        dot_radius: number('pattern dots: dot radius, scene units. Default 8% of line_spacing.', { exclusiveMinimum: 0 }),
        edges: { type: 'boolean', default: true, description: 'Outline the open edges: the rim of a disc, dome or well, the ends of a cylinder, the frame of a plane.' },
        edge_width: number('Edge width, px. Default line_width_major.', { minimum: 0 }),
        edge_color: color('Edge colour. Default color_major.'),
        ring_labels: {
            type: 'object',
            description: 'disc or dome: bearing labels round the edge (0, 10, 20, ...).',
            properties: {
                step: number('A label every N degrees.', { exclusiveMinimum: 0, default: 10 }),
                radius: number('Distance of the labels from the centre, scene units. Default 1.06 x radius.', { minimum: 0 }),
                start: number('First bearing labelled, degrees.', { default: 0 }),
                alt: number('Height of the labels above the plane, scene units.', { default: 0 }),
                style: styleNameSchema('Label style (built-in or labels.styles). Default minor.'),
                color: color('Label colour.'),
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
                offset: number('Distance of the labels outside the edge, scene units. Default 0.6 x line_spacing.', { minimum: 0 }),
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
                    color: color('Fill colour. Default var(--lcars-blue).'),
                    opacity: number('Fill opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.25 }),
                    shade: number('Per-cell brightness variation, 0 to 1 (a printed sector map look); the same cell always gets the same shade.', { minimum: 0, maximum: 1, default: 0 }),
                    seed: number('Changes which cells are lighter and darker with shade.', { default: 0 }),
                    edges: {
                        description: 'An outline round the range: true, or { width, color, opacity }.',
                        oneOf: [
                            { type: 'boolean' },
                            {
                                type: 'object',
                                properties: {
                                    width: number('Outline width, px.', { minimum: 0, default: 1.5 }),
                                    color: color('Outline colour. Default the fill colour.'),
                                    opacity: number('Outline opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.9 })
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
    description: 'A see-through box of grid cells (a territory): a sector of a disc, or a box.',
    properties: {
        type: { type: 'string', const: 'volume', description: 'volume: a see-through cell box.' },
        shape: { type: 'string', enum: [...VOLUME_SHAPES], default: 'sector', description: 'sector: between two radii, two bearings and two heights round the centre. box: size centred on at.' },
        radius: tuple(2, 'sector: inner and outer radius [r0, r1], scene units. Default [50, 100].'),
        angle: tuple(2, 'sector: from and to bearing [a0, a1], degrees clockwise from north. Default [0, 90].'),
        height: tuple(2, 'sector: bottom and top [y0, y1], scene units. Default [0, 10].'),
        size: {
            description: 'box: [width, height, depth], scene units, or one number for a cube. Default 20.',
            oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 }]
        },
        cells: {
            type: 'object',
            description: 'Grid cell size on the faces, per direction.',
            properties: {
                ring: number('sector: radial cell size, scene units. Default a quarter of the depth.', { exclusiveMinimum: 0 }),
                angle: number('sector: cell width round, degrees.', { exclusiveMinimum: 0, default: 10 }),
                layer: number('sector: cell height, scene units. Default half the height.', { exclusiveMinimum: 0 }),
                width: number('box: cell size across (x), scene units. Default a quarter of the width.', { exclusiveMinimum: 0 }),
                height: number('box: cell size up (y), scene units. Default a quarter of the height.', { exclusiveMinimum: 0 }),
                depth: number('box: cell size along z, scene units. Default a quarter of the depth.', { exclusiveMinimum: 0 })
            }
        },
        color: color('Colour of the faces (and the edges, unless edge_color). Default var(--lcars-blue).'),
        face_opacity: number('Opacity of the face grid lines (the edges stay brighter), 0 to 1.', { minimum: 0, maximum: 1, default: 0.45 }),
        line_width: number('Face line width, px.', { minimum: 0, default: 1 }),
        edges: { type: 'boolean', default: true, description: 'Draw the outline edges.' },
        edge_width: number('Edge width, px.', { minimum: 0, default: 1.5 }),
        edge_color: color('Edge colour. Default color.'),
        back_opacity: number('Opacity of the far faces, 0 to 1 (1: a wireframe, nothing hidden).', { minimum: 0, maximum: 1, default: 1 }),
        blend: blendAdd,
        scan_period: number('Seconds per scan band sweep down the walls, top to bottom (0: none). Off under reduced motion.', { minimum: 0, default: 0 }),
        scan_color: scanKeys.scan_color
    }
};

const sphereObject = {
    type: 'object',
    title: 'sphere',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A planet or globe: latitude and longitude lines over a solid body that hides what is behind it (labels too), with an optional map image. For a see-through wireframe ball use a grid with shape: sphere.',
    properties: {
        type: { type: 'string', const: 'sphere', description: 'sphere: a planet or globe.' },
        radius: number('Radius, scene units.', { exclusiveMinimum: 0, default: 10 }),
        line_spacing_deg: number('A latitude and a longitude line every N degrees (longitude rounded to fit round), as on curved grids.', { minimum: 1, default: 15 }),
        lat_step: number('Latitude lines every N degrees, when different from line_spacing_deg.', { minimum: 1 }),
        lon_step: number('Longitude lines every N degrees, when different from line_spacing_deg (rounded to fit round).', { minimum: 1 }),
        ...gridLook,
        fill_color: color('Body colour. Default black.'),
        fill_opacity: number('Body opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.85 }),
        image: { type: 'string', description: 'A texture for the body instead of fill: an equirectangular map, longitude 0 in the middle. Built in (NASA and USGS maps, public domain): builtin:earth_blue_marble, builtin:moon_lroc, builtin:mars_viking, builtin:mercury_messenger, builtin:venus_magellan (the surface under the clouds), builtin:jupiter_cassini, builtin:pluto_new_horizons. Or your own, e.g. /local/mars.jpg. Planets without a map: fill_effect presets.', examples: ['builtin:earth_blue_marble', 'builtin:mars_viking', '/local/mars.jpg'] },
        image_opacity: number('Texture opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
        occlude: { type: 'boolean', default: true, description: 'Hide labels behind the sphere.' },
        fill_effect: fillEffectSchema,
        deform: { type: 'array', items: deformSchema, description: 'Deformations of the planet, applied in order (as on a grid sphere): wobble, bend, twist, noise. The body, lines and points on it move with them.' }
    }
};

/** Moving dashes and pulses along a line (the flow background preset) */
const flowKeys = {
    flow_speed: number('Move the dashes (and pulses) along the line, px per second; negative runs backwards. Default 0, or 80 with a pulse. Off under reduced motion.'),
    pulse: {
        description: 'Bright pulses travelling along the line: true, or their settings.',
        oneOf: [
            { type: 'boolean' },
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    length: number('Pulse length, px.', { exclusiveMinimum: 0, default: 14 }),
                    gap: number('Space between pulses, px.', { minimum: 0, default: 90 }),
                    width: number('Pulse width, px. Default the line width + 1.', { minimum: 0 }),
                    color: color('Pulse colour. Default var(--lcards-moonlight).'),
                    speed: number('px per second when flow_speed is not set.', { default: 80 })
                }
            }
        ]
    }
};

const lineCommon = {
    width: number('Line width, px.', { minimum: 0, default: 1.5 }),
    dash: pxDash,
    color: color('Line colour.'),
    color_to: color('Colour at the far end: the line fades from color to color_to.'),
    glow: {
        description: 'A soft glow under the line: true (4 x the width) or a width factor.',
        oneOf: [{ type: 'boolean' }, { type: 'number', minimum: 1 }]
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
        radius: numberOrPair('Radius, scene units, or [a, b] for an ellipse (a along the line of nodes). Default 100.'),
        inclination: number('Tilt of the ring\'s plane, degrees, about the line of nodes.', { default: 0 }),
        node: number('Bearing of the line of nodes (where an inclined ring crosses the plane), degrees.', { default: 0 }),
        arc: tuple(2, 'Only part of the ring: [from, to] in degrees round it.'),
        image: { type: 'string', description: 'A flat band from inner_radius out to radius, textured across its width: the image\'s left edge is the inner rim, its right edge the outer (its height is not used). builtin:saturn_rings is Saturn\'s rings, D ring to F ring (radius 2.33 and inner_radius 1.11 times the planet\'s radius). The line is drawn too only when width is set.', examples: ['builtin:saturn_rings', '/local/rings.png'] },
        inner_radius: numberOrPair('image: the band\'s inner radius, scene units, or [a, b] for an ellipse. Default half the radius.'),
        image_opacity: number('image: the band\'s opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
        image_color: color('image: a colour the texture is multiplied by (a tint). Default none (the image\'s own colours).'),
        ...lineCommon,
        color: color('Line colour. Default theme:colors.ui.secondary.')
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
        points: { type: 'array', items: pointRef('A point id or [x, y, z].'), description: 'The points the line passes through, in order (ids or [x, y, z]).' },
        from: pointRef('Start (instead of points).'),
        to: pointRef('End (instead of points).'),
        arc: number('Arch each leg upward by this height at its middle, scene units (0: straight).', { default: 0 }),
        sky: { type: 'string', enum: [...SKY_BODIES], description: 'Draw today\'s track of the sun or moon on the dome named in object, split where it goes under the horizon.' },
        object: { type: 'string', description: 'sky: the dome grid the track is drawn on.' },
        span: { type: 'string', enum: ['today'], description: 'sky: which track (only today, midnight to midnight local time).' },
        alt: number('sky: height above the dome, scene units.', { default: 0 }),
        ...lineCommon,
        color: color('Line colour. Default var(--lcars-orange).')
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
        width: number('Glow width, px (the core stays thin).', { minimum: 0, default: 12 }),
        color: color('Beam colour. Default theme:colors.ui.secondary.'),
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
        src: { type: 'string', description: 'Image URL, e.g. /local/galaxy.jpg.' },
        size: numberOrPair('Width and depth [w, d], scene units (one number for a square); a disc takes the width as its diameter. Default 200.'),
        shape: { type: 'string', enum: [...IMAGE_SHAPES], default: 'plane', description: 'plane (a rectangle) or disc.' },
        alt: number('Height above the plane, scene units (just under it by default, so grids draw over it).', { default: -0.01 }),
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
        size: number('Diameter, scene units.', { minimum: 0, default: 60 }),
        color: color('Colour. Default var(--lcards-moonlight).'),
        opacity: number('Opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.9 }),
        falloff: number('How fast it fades from the middle: higher is a tighter, brighter core.', { minimum: 0.25, default: 2 }),
        blend: { type: 'string', enum: ['add', 'normal'], default: 'add', description: 'add (default): light adds up. normal: drawn over what is behind.' }
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
        radius: number('The clouds sit inside a ball this big round the object, scene units. Default 100.', { exclusiveMinimum: 0 }),
        size: {
            description: 'Or inside a box [width, height, depth] (one number for a cube), scene units. Replaces radius.',
            oneOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'array', items: { type: 'number', exclusiveMinimum: 0 }, minItems: 3, maxItems: 3 }]
        },
        cloud_count: { type: 'integer', minimum: 1, maximum: 10, default: 4, description: 'How many clouds the seed places (the background preset\'s key).' },
        clouds: {
            type: 'array',
            maxItems: 10,
            description: 'Clouds placed by hand, instead of cloud_count and the seed.',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    xyz: tuple(3, 'Where the cloud sits [x, y, z], scene units from the object.'),
                    radius: number('Cloud radius, scene units. Default between min_radius and max_radius.', { exclusiveMinimum: 0 }),
                    color: color('This cloud\'s colour. Default from colors.'),
                    opacity: number('Opacity, 0 to 1. Default between min_opacity and max_opacity.', { minimum: 0, maximum: 1 })
                }
            }
        },
        min_radius: number('Smallest cloud radius, scene units. Default 0.15 of the region.', { exclusiveMinimum: 0 }),
        max_radius: number('Largest cloud radius, scene units. Default 0.4 of the region.', { exclusiveMinimum: 0 }),
        min_opacity: number('Dimmest cloud, 0 to 1.', { minimum: 0, maximum: 1, default: 0.3 }),
        max_opacity: number('Brightest cloud, 0 to 1.', { minimum: 0, maximum: 1, default: 0.8 }),
        colors: {
            description: 'Cloud colour, or a list the seed picks from per cloud. Default var(--lcars-violet).',
            oneOf: [color('A colour.'), { type: 'array', items: color('A colour.'), minItems: 1 }]
        },
        turbulence: number('How ragged the cloud edges are, 0 to 1.', { minimum: 0, maximum: 1, default: 0.5 }),
        noise_scale: number('Detail of the gas per scene unit: lower is larger, smoother wisps. Default about 1.5 noise cells across a cloud.', { minimum: 0 }),
        drift: numberOrPair('How fast the gas churns, scene units per second: one number, or [x, y] across the clouds. Default 0 (still). Off under reduced motion.'),
        seed: number('Random seed: the same seed places the same clouds.', { default: 1 }),
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
        src: { type: 'string', description: 'The file: builtin:constitution (a starship shipped with LCARdS) or your own .glb / .gltf. Meshopt compression works, Draco does not.' },
        size: number('Largest extent, scene units (the file is scaled and centred).', { exclusiveMinimum: 0, default: 50 }),
        material: { type: 'string', enum: [...MODEL_MATERIALS], default: 'hologram', description: 'hologram (default): a glow with a bright rim and scanlines. original: the file\'s materials, lit.' },
        color: color('Hologram body colour. Default var(--lcars-blue).'),
        rim_color: color('Hologram rim colour. Default var(--lcards-moonlight).'),
        opacity: number('Opacity, 0 to 1 (a hologram\'s brightness).', { minimum: 0, maximum: 1, default: 0.85 }),
        scanlines: number('Scanline strength, 0 (none) to 1.', { minimum: 0, maximum: 1, default: 0.5 }),
        scan_period: number('Seconds per scan band sweep along the model (0: none).', { minimum: 0, default: 0 }),
        scan_color: color('Scan band colour. Default var(--lcards-moonlight).'),
        solid: { type: 'boolean', default: true, description: 'false: see-through.' },
        blend: { type: 'string', enum: ['add', 'normal'], default: 'add', description: 'Hologram blending: add (default) or normal.' },
        edges: { type: 'boolean', description: 'Draw feature edges. Default true for hologram.' },
        edge_angle: number('Edges where faces meet at more than this angle, degrees.', { minimum: 0, maximum: 180, default: 30 }),
        edge_color: color('Edge colour. Default the rim colour.'),
        animation: {
            description: 'Clips to loop: all, a name or a list. None when left out.',
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }]
        },
        occlude: { type: 'boolean', default: true, description: 'Hide labels behind it.' },
        max_file_size: number('The largest file to load, MB.', { exclusiveMinimum: 0, default: 20 })
    }
};

const OBJECT_SCHEMAS = { model: modelObject, grid: gridObject, volume: volumeObject, sphere: sphereObject, ring: ringObject, path: pathObject, beam: beamObject, image: imageObject, glow: glowObject, nebula: nebulaObject };

/** One scene object (published as its own shared file, scripts/lib/schema-publish.js) */
export const objectSchema = {
    description: `What the scene draws. type picks one of: ${OBJECT_TYPES.join(', ')}.`,
    type: 'object',
    required: ['type'],
    // ajv (validator, tests) picks the branch by type and reports only its errors
    discriminator: { propertyName: 'type' },
    oneOf: OBJECT_TYPES.map((t) => OBJECT_SCHEMAS[t])
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
                default: { ...labelFieldSchema, description: 'Text keys every label on this card inherits (font_family, text_transform, letter_spacing, ...), over the built-in styles.' },
                styles: {
                    type: 'object',
                    description: 'Label styles by name: change a built-in (title, major, minor, tiny) or add your own; a point picks one with style.',
                    additionalProperties: {
                        type: 'object',
                        description: 'A label style: text keys (font_size, color, font_weight, ...) and priority.',
                        properties: {
                            ...labelFieldProperties,
                            priority: number('Which label wins when two overlap (higher wins).'),
                            overlap: { type: 'boolean', description: 'Labels of this style are never hidden by another label (they still move to a free side when they can).' }
                        }
                    }
                },
                overlap: { type: 'boolean', default: false, description: 'Every label on the card: never hidden when labels overlap (each still moves to a free side of its point when it can). false hides the lower-priority one, which keeps busy scenes readable. A style or a point can set its own.' },
                snap: { type: 'boolean', default: false, description: 'Round label positions to whole px (crisper text on weak devices; fast motion looks steppier). Default: sub-pixel.' }
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
