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
    cardMaxWidthSchema, cardZIndexSchema, rulesSchema, soundsSchema
} from './common-schemas.js';
import {
    OBJECT_TYPES, GRID_SHAPES, GRID_PATTERNS, VOLUME_SHAPES, IMAGE_SHAPES, MARKERS, LABEL_STYLE_NAMES, SKY_BODIES
} from '../../core/astrometrics/names.js';

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
        yaw: number('Bearing the camera looks from, degrees (0: looking north).')
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
            enum: [...actionSchema.properties.action.enum, 'fly-to'],
            description: 'Type of action. fly-to: fly the camera here (or to the named view in view); the other types run as on any card.'
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
        fov: number('Field of view, degrees (perspective only). Default 40.', { minimum: 1, maximum: 170 }),
        projection: {
            type: 'string', enum: ['perspective', 'orthographic'], default: 'perspective',
            description: 'perspective: far things look smaller. orthographic: no perspective (a flat map); distance then sets the zoom.'
        }
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
        controls: { type: 'boolean', default: true, description: 'Drag to orbit, wheel or pinch to zoom, shift-drag, right-drag or two fingers to pan. false: the camera only moves by fly-to and auto_rotate.' },
        limits: {
            type: 'object',
            description: 'Where drag and zoom stop: [min, max] pairs. A tilt range of one value (e.g. [90, 90]) locks the tilt, and a one-finger drag then pans (a map).',
            properties: {
                tilt: tuple(2, 'Lowest and highest tilt, degrees. Default [-90, 90].'),
                distance: tuple(2, 'Nearest and farthest distance, scene units.'),
                yaw: tuple(2, 'Yaw range, degrees. Default: no limit.')
            }
        },
        auto_rotate: number('Turn the camera round its target, degrees per second (negative: the other way). 0 is off. Pauses while dragging; off under reduced motion.', { default: 0 }),
        fly_duration: number('How long a fly-to takes, ms. Under reduced motion the camera jumps.', { minimum: 0, default: 1600 }),
        ease: { type: 'string', default: 'inOutCubic', description: 'Easing of a fly-to (an anime.js easing name, such as inOutCubic, outQuad, linear).' }
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
                seed: number('Random seed: the same seed places the same stars.', { default: 7 })
            }
        }
    ]
};

// ── Points ───────────────────────────────────────────────────────────────────

const pointSchema = {
    type: 'object',
    required: ['id'],
    description: 'A named point: placed once (one of xyz, polar, latlon, altaz, sky, at, cell), referenced by id from paths, rings, beams, objects and views. With a label or marker it shows on the scene.',
    properties: {
        id: { type: 'string', description: 'Unique name of the point (referenced by at, target, from, to, around, points).' },
        // placement forms
        xyz: tuple(3, 'Position [x, y, z], scene units (y is up). With on: local to that object.'),
        polar: tuple(2, 'Position on the scene plane as [distance, bearing]: bearing in degrees, 0 north, clockwise seen from above. With on: local to that object.'),
        y: number('Height above the plane for polar, scene units. Default 0.'),
        latlon: tuple(2, 'Latitude and longitude [lat, lon] in degrees on the sphere named in on. Longitude 0 faces the default camera, east to the right; the point turns with the sphere\'s spin.'),
        altaz: tuple(2, 'Azimuth and altitude [azimuth, altitude] in degrees on the dome named in on: azimuth clockwise from north, altitude up from the horizon.'),
        sky: { type: 'string', enum: [...SKY_BODIES], description: 'Follow the sun or moon on the dome named in on, from the time and the Home Assistant location (sun.sun when it exists). Updated every minute.' },
        at: { type: 'string', description: 'Place it at another point (by id); add offset to move it from there.' },
        cell: { type: 'string', description: 'The centre of a sector map cell, such as AF3, on the grid named in on (a plane grid; its axis_labels say how cells are named).' },
        on: { type: 'string', description: 'The object the point stands on (an object id). Needed by latlon (a sphere), altaz and sky (a dome grid) and cell (a plane grid); with xyz or polar the point moves and spins with the object.' },
        alt: number('Height above the surface of the object in on, scene units (latlon, altaz, sky).', { default: 0 }),
        offset: tuple(3, 'Moves the point by [x, y, z] scene units from where its form puts it.'),
        // label and marker
        label: { type: ['string', 'number'], description: 'Text shown at the point (LCARS font). Leave out for a marker only, or for a point that only anchors other things.' },
        style: { type: 'string', enum: [...LABEL_STYLE_NAMES], default: 'minor', description: 'Label size: title (34 px), major (20 px), minor (13 px) or tiny (10 px). Larger styles win when labels overlap.' },
        marker: { type: 'string', enum: [...MARKERS], default: 'none', description: 'Marker drawn at the point: dot, triangle, diamond, square, reticle (a target ring), moon_phase (the moon\'s lit part, from the sky) or none. A point with a marker can be tapped.' },
        color: color('Label and marker colour (CSS variables stay live, so alert modes recolour them). Default by style: moonlight for title and major, the theme text colour for minor and tiny.'),
        anchor: { type: 'string', enum: ['center', 'right', 'left'], description: 'Where the label sits: center on the point, right or left of it. Default right with a marker, center without.' },
        priority: number('Which label wins when two overlap (higher wins; then the nearer one). Default by style: title 100, major 80, minor 40, tiny 10.'),
        fade: tuple(2, 'Distance fade [start, end], scene units from the camera: fully shown nearer than start, gone past end.'),
        min_distance: number('Hidden when the camera is closer than this, scene units.', { minimum: 0 }),
        max_distance: number('Hidden when the camera is farther than this, scene units (detail that appears as you zoom in).', { minimum: 0 }),
        below_horizon: { type: 'string', enum: ['dim', 'hide', 'show'], description: 'altaz and sky points under the horizon: dim (default for sky), hide, or show (default for altaz).' },
        tap_action: sceneActionSchema,
        hold_action: sceneActionSchema,
        view: landingViewSchema
    }
};

// ── Objects ──────────────────────────────────────────────────────────────────

/** Keys every object takes */
const objectCommon = {
    id: { type: 'string', description: 'Name of the object, for points (on), paths and rings. Default type#n (grid#1, ...).' },
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

/** Grid look: the background grid effect's names, in scene units */
const gridLook = {
    pattern: { type: 'string', enum: [...GRID_PATTERNS], description: 'Line pattern (the background grid effect\'s names): both (rows and columns, default), horizontal, vertical, diagonal, hexagonal, dots, polar (rings and spokes; default on a disc).' },
    line_spacing: number('Distance between lines, scene units. On curved shapes line_spacing_deg is usually easier.', { exclusiveMinimum: 0 }),
    major_row_interval: { type: 'integer', minimum: 0, default: 0, description: 'A major (brighter, wider) line every N rows (rings on a disc); 0 for none.' },
    major_col_interval: { type: 'integer', minimum: 0, default: 0, description: 'A major line every N columns (spokes on a disc); 0 for none.' },
    line_width: number('Line width, px.', { minimum: 0, default: 1 }),
    line_width_major: number('Major line and edge width, px. Default 1.5 x line_width (at least 1.5).', { minimum: 0 }),
    color: color('Line colour. Default theme:colors.ui.tertiary.'),
    color_major: color('Major line and edge colour. Default: color, brighter.'),
    back_opacity: number('Opacity of the far side seen through the surface, 0 to 1 (0 hides it).', { minimum: 0, maximum: 1 }),
    blend: blendAdd
};

const gridObject = {
    type: 'object',
    title: 'grid',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A grid surface: plane (a sector map), disc (a galaxy disc), dome (a sky), sphere or cylinder.',
    properties: {
        type: { type: 'string', const: 'grid', description: 'grid: a grid surface.' },
        shape: { type: 'string', enum: [...GRID_SHAPES], default: 'plane', description: 'plane (size), disc (radius, inner_radius), dome (a half sphere, radius), sphere (radius) or cylinder (radius, height).' },
        size: numberOrPair('plane: width and depth [w, d], scene units (one number for a square). Default 200.'),
        radius: number('disc, dome, sphere, cylinder: radius, scene units. Default 100.', { exclusiveMinimum: 0 }),
        inner_radius: number('disc: radius of the hole in the middle, scene units. Default 0.', { minimum: 0 }),
        height: number('cylinder: height, scene units. Default the radius.', { exclusiveMinimum: 0 }),
        line_spacing_deg: number('disc: a spoke every N degrees; dome, sphere, cylinder: rings and meridians every N degrees (a whole number fits round). Default 15 on curved shapes.', { exclusiveMinimum: 0 }),
        ...gridLook,
        fill_color: color('Colour filling the cells behind the lines. Default none.'),
        spoke_count: { type: 'integer', minimum: 0, default: 36, description: 'pattern polar: spokes round the centre (meridians on a curved shape). line_spacing_deg wins on a disc.' },
        hex_radius: number('pattern hexagonal: hexagon size, scene units. Default line_spacing.', { exclusiveMinimum: 0 }),
        dot_radius: number('pattern dots: dot radius, scene units. Default 8% of line_spacing.', { exclusiveMinimum: 0 }),
        border: { type: 'boolean', default: true, description: 'Edge lines on the open edges (the rim of a disc or dome, the frame of a plane) in color_major and line_width_major.' },
        ring_labels: {
            type: 'object',
            description: 'disc or dome: bearing labels round the edge (0, 10, 20, ...).',
            properties: {
                step: number('A label every N degrees.', { exclusiveMinimum: 0, default: 10 }),
                radius: number('Distance of the labels from the centre, scene units. Default 1.06 x radius.', { minimum: 0 }),
                start: number('First bearing labelled, degrees.', { default: 0 }),
                y: number('Height of the labels, scene units.', { default: 0 }),
                style: { type: 'string', enum: [...LABEL_STYLE_NAMES], default: 'minor', description: 'Label size.' },
                color: color('Label colour.')
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
                style: { type: 'string', enum: [...LABEL_STYLE_NAMES], default: 'tiny', description: 'Label size.' },
                color: color('Label colour.')
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
                    border: {
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
                x: number('box: cell size along x, scene units. Default a quarter of the width.', { exclusiveMinimum: 0 }),
                y: number('box: cell size along y. Default a quarter of the height.', { exclusiveMinimum: 0 }),
                z: number('box: cell size along z. Default a quarter of the depth.', { exclusiveMinimum: 0 })
            }
        },
        color: color('Colour of the faces and edges. Default var(--lcars-blue).'),
        face_opacity: number('Opacity of the face grid lines (the edges stay brighter), 0 to 1.', { minimum: 0, maximum: 1, default: 0.45 }),
        line_width: number('Face line width, px.', { minimum: 0, default: 1 }),
        edges: { type: 'boolean', default: true, description: 'Draw the outline edges.' },
        edge_width: number('Edge width, px.', { minimum: 0, default: 1.5 }),
        back_opacity: number('Opacity of the far faces, 0 to 1 (1: a wireframe, nothing hidden).', { minimum: 0, maximum: 1, default: 1 }),
        blend: blendAdd
    }
};

const sphereObject = {
    type: 'object',
    title: 'sphere',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A planet or globe: latitude and longitude lines over a dark body that hides what is behind it.',
    properties: {
        type: { type: 'string', const: 'sphere', description: 'sphere: a planet or globe.' },
        radius: number('Radius, scene units.', { exclusiveMinimum: 0, default: 10 }),
        lat_step: number('A latitude line every N degrees.', { minimum: 1, default: 15 }),
        lon_step: number('A longitude line every N degrees (rounded to fit round).', { minimum: 1, default: 15 }),
        ...gridLook,
        fill: color('Body colour. Default black.'),
        fill_opacity: number('Body opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 0.85 }),
        image: { type: 'string', description: 'Your own texture for the body (an equirectangular map URL, e.g. /local/mars.jpg), instead of fill. Longitude 0 is the middle of the image.' },
        image_opacity: number('Texture opacity, 0 to 1.', { minimum: 0, maximum: 1, default: 1 }),
        occlude: { type: 'boolean', default: true, description: 'Hide labels behind the sphere.' }
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
    blend: blendAdd
};

const ringObject = {
    type: 'object',
    title: 'ring',
    required: ['type'],
    allOf: [objectCommonSchema],
    description: 'A circle or ellipse: an orbit, a rim, a range ring.',
    properties: {
        type: { type: 'string', const: 'ring', description: 'ring: a circle or ellipse.' },
        around: pointRef('Centre: a point id (the ring follows it) or [x, y, z]. Default the origin.'),
        radius: numberOrPair('Radius, scene units, or [a, b] for an ellipse (a along the line of nodes). Default 100.'),
        inclination: number('Tilt of the ring\'s plane, degrees, about the line of nodes.', { default: 0 }),
        node: number('Bearing of the line of nodes (where an inclined ring crosses the plane), degrees.', { default: 0 }),
        arc: tuple(2, 'Only part of the ring: [from, to] in degrees round it.'),
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
        sky: { type: 'string', enum: [...SKY_BODIES], description: 'Draw today\'s track of the sun or moon on the dome in on, split where it goes under the horizon.' },
        on: { type: 'string', description: 'sky: the dome grid the track is drawn on.' },
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
        color: color('Beam colour. Default theme:colors.ui.secondary.')
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
        y: number('Height, scene units (just under the plane by default, so grids draw over it).', { default: -0.01 }),
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

const OBJECT_SCHEMAS = { grid: gridObject, volume: volumeObject, sphere: sphereObject, ring: ringObject, path: pathObject, beam: beamObject, image: imageObject, glow: glowObject };

const objectSchema = {
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
            properties: { stars: starsSchema }
        },
        background_animation: backgroundAnimationSchema,
        labels: {
            type: 'object',
            description: 'How labels are drawn.',
            properties: {
                snap: { type: 'boolean', default: false, description: 'Round label positions to whole px (crisper text on weak devices; fast motion looks steppier). Default: sub-pixel.' }
            }
        },
        points: { type: 'array', description: 'Named points with optional labels and markers (the placement system).', items: pointSchema },
        objects: { type: 'array', description: 'What is drawn: grids, volumes, spheres, rings, paths, beams, images and glows, in this order.', items: objectSchema },

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
        variables: {
            type: 'object',
            description: 'Your own named values, available to templates as variables.<name> and {variables.<name>}.',
            additionalProperties: true
        }
    }
};
