/**
 * @fileoverview The Borg cube's face, shared GLSL: the box ray hit, the carved
 * machinery under each face (two stacked block layers, `reliefDepth`, and the
 * solid test `outsideAxis` the relief march uses) and the rail lattice a
 * little off each face. One copy for the screen effect's worker
 * (BorgAssimilationGLWorker.js, spliced in at its `// @borg-face-glsl` line by
 * borg-worker-sources.js, since the worker runs from a Blob and imports
 * nothing) and the astrometrics `cube` object. Cube half size 1.
 *
 * Needs `float hash(vec2)` declared before it. A test holds the assembled
 * worker byte-identical to the file before the split.
 *
 * @module core/screen-effects/effects/borg-face-glsl
 */

export const BORG_FACE_GLSL = `// Ray against an axis-aligned box of half size b: near t (or -1) and the face normal
float boxHit(vec3 ro, vec3 rd, float b, out vec3 n) {
    vec3 m = 1.0 / rd;
    vec3 k = abs(m) * b;
    vec3 t1 = -m * ro - k, t2 = -m * ro + k;
    float tN = max(max(t1.x, t1.y), t1.z);
    float tF = min(min(t2.x, t2.y), t2.z);
    n = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
    return (tN > tF || tF < 0.0) ? -1.0 : tN;
}
float sdBox(vec3 p, float b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
// Face axis and the two in-face coordinates of a hit
vec2 faceUV(vec3 p, vec3 n, out float axis) {
    vec3 an = abs(n);
    axis = an.x > 0.5 ? 0.0 : an.y > 0.5 ? 1.0 : 2.0;
    return axis == 0.0 ? p.yz : axis == 1.0 ? p.zx : p.xy;
}

// One layer of boxy machinery. Each cell splits into two blocks, raised or recessed,
// bevelled toward a light from the face's -u -v corner, with dark seams.
// x = height -1..1, y = bevel light -1..1, z = seam, w = block hash
vec4 greebleLayer(vec2 g, float salt) {
    vec2 c = floor(g), f = fract(g);
    float h1 = hash(c + salt), h2 = hash(c.yx + salt * 1.31 + 7.0);
    float cut = 0.3 + 0.4 * h2;
    vec2 lo = vec2(0.0), hi = vec2(1.0);
    float id;
    if (h1 < 0.5) { bool a = f.x < cut; lo.x = a ? 0.0 : cut; hi.x = a ? cut : 1.0; id = a ? 0.0 : 1.0; }
    else          { bool a = f.y < cut; lo.y = a ? 0.0 : cut; hi.y = a ? cut : 1.0; id = a ? 2.0 : 3.0; }
    float hb = hash(c * 1.7 + id * 3.7 + salt * 2.1);
    float height = hb * 2.0 - 1.0;
    vec2 q = f - lo, Q = hi - lo;
    float dlo = min(q.x, q.y), dhi = min(Q.x - q.x, Q.y - q.y);
    float e = min(dlo, dhi);
    float bevel = 1.0 - smoothstep(0.02, 0.1, e);
    float light = bevel * (dlo < dhi ? 1.0 : -1.0) * sign(height);
    float seam = 1.0 - smoothstep(0.0, 0.03, e);
    return vec4(height, light, seam, hb);
}

// How deep the machinery cuts into each face (cube half size is 1)
const float DEPTH = 0.15;

// Depth of the machinery under a face at in-face uv: 0 = flush with the face, DEPTH = deepest.
// Two block layers stacked (towers on platforms), piecewise constant: real walls.
float reliefDepth(vec2 uv, float face) {
    vec2 g = uv * 0.5 + 0.5;
    float salt = face * 17.0;
    float ha = greebleLayer(g * 6.0, salt).x * 0.5 + 0.5;
    float hb = greebleLayer(g * 14.0 + 0.37, salt + 5.0).x * 0.5 + 0.5;
    return (1.0 - (0.55 * ha + 0.45 * hb)) * DEPTH;
}

// In-face coordinates for axis k (same order as faceUV)
vec2 axisUV(vec3 p, int k) { return k == 0 ? p.yz : k == 1 ? p.zx : p.xy; }
float axisFace(vec3 p, int k) { return float(k) * 2.0 + (p[k] > 0.0 ? 1.0 : 0.0); }

// The axis whose carved face leaves p outside the cube (-1: p is solid). The cube is the
// intersection of three slabs, each carved by its two faces' machinery, so edges and corners
// come out ragged like the reference.
int outsideAxis(vec3 p) {
    vec3 ap = abs(p);
    for (int k = 0; k < 3; k++) {
        if (ap[k] > 1.0 - DEPTH && ap[k] > 1.0 - reliefDepth(axisUV(p, k), axisFace(p, k))) return k;
    }
    return -1;
}

// The rail lattice a little off each face: an 8 x 8 grid with seeded gaps, edges always drawn
float lattice(vec2 uv, float face, float pxUV) {
    vec2 g = (uv * 0.5 + 0.5) * 8.0;
    vec2 cell = floor(g);
    vec2 d = abs(fract(g) - 0.5);           // distance to a cell centre line, 0..0.5
    vec2 toLine = (0.5 - d) / 8.0 * 2.0;     // in face units
    float w = pxUV * 0.9;                    // about a pixel wide at any size
    // A line along v (constant u) at the cell's lower edge: gapped per segment
    float gapU = step(0.3, hash(vec2(floor(g.x + 0.5), cell.y) + face * 3.1));
    float gapV = step(0.3, hash(vec2(cell.x, floor(g.y + 0.5)) + face * 5.7 + 11.0));
    float lu = (1.0 - smoothstep(w * 0.5, w * 1.5, toLine.x)) * gapU;
    float lv = (1.0 - smoothstep(w * 0.5, w * 1.5, toLine.y)) * gapV;
    float edge = 1.0 - smoothstep(w * 0.5, w * 1.5, 1.0 - max(abs(uv.x), abs(uv.y)));
    return max(max(lu, lv) * 0.85, edge);
}

`;

/** The line in the worker source the shared GLSL replaces */
export const BORG_FACE_MARKER = '// @borg-face-glsl: the shared face functions (borg-face-glsl.js) go here, spliced in by borg-worker-sources.js\n';

/**
 * The worker source with the shared face GLSL spliced in.
 * @param {string} source - BorgAssimilationGLWorker.js as text
 */
export function withBorgFace(source) {
  if (!source.includes(BORG_FACE_MARKER)) throw new Error('Borg worker source has no @borg-face-glsl line');
  return source.replace(BORG_FACE_MARKER, () => BORG_FACE_GLSL);
}
