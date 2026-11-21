/**
 * @fileoverview BorgAssimilationGLWorker — WebGL2 draw thread for the Borg
 * assimilation intro (the classic Canvas2D one is BorgAssimilationWorker.js).
 *
 * Runs from a Blob URL, so it imports nothing. The main thread sends the layout
 * (borg-layout.js) and the colours as 0-1 floats; this file only tessellates and
 * draws. Two passes:
 *   1. Into a framebuffer, additive: tendril and bridge strips, site and
 *      junction glows, the Borg cube's edges.
 *   2. Full screen: the assimilation front with Borg circuitry behind it, the
 *      front's glowing edge, the pass 1 picture, signal corruption over both.
 *
 * Messages in:
 *   { type: 'start',  canvas, layout, colors: { color, glow }, options, reducedMotion }
 *   { type: 'resize', width, height }
 *   { type: 'motion', reduced }
 *   { type: 'stop' }
 * Messages out:
 *   { type: 'ready' }            WebGL2 is drawing
 *   { type: 'fallback', reason } no WebGL2 context, a shader failed, or the context was lost
 *   { type: 'stats', fps }       every 5 s while animating
 *
 * @module core/screen-effects/effects/BorgAssimilationGLWorker
 */

// Wrapped so its names stay out of the global scope the classic worker shares
(() => {

// ─── Shaders ──────────────────────────────────────────────────────────────────

const COMMON = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_glow;
vec2 toClip(vec2 px) { return (px / u_res * 2.0 - 1.0) * vec2(1.0, -1.0); }
// Hue rotation in YIQ space (degrees)
vec3 hueShift(vec3 c, float deg) {
    const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
    const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
    vec3 yiq = toYIQ * c;
    float a = radians(deg);
    float ca = cos(a), sa = sin(a);
    yiq.yz = vec2(yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
    return clamp(toRGB * yiq, 0.0, 1.0);
}
`;

// Tendrils and bridges: strips tessellated on the CPU, growth and pulses here
const STRIP_VS = COMMON + `
in vec2 a_pos; in float a_across; in float a_t; in float a_core;
in float a_start; in float a_dur; in float a_hue; in float a_seed; in float a_kind;
out float v_across; out float v_t; out float v_core; out float v_progress; out float v_age;
out float v_hue; out float v_seed; out float v_kind;
void main() {
    v_across = a_across; v_t = a_t; v_core = a_core; v_hue = a_hue; v_seed = a_seed; v_kind = a_kind;
    v_age = u_time - a_start;
    v_progress = clamp(v_age / a_dur, 0.0, 1.0);
    gl_Position = vec4(toClip(a_pos), 0.0, 1.0);
}`;

const STRIP_FS = COMMON + `
uniform float u_pulses;
in float v_across; in float v_t; in float v_core; in float v_progress; in float v_age;
in float v_hue; in float v_seed; in float v_kind;
out vec4 o;
void main() {
    if (v_age < 0.0) discard;
    float tip = smoothstep(v_progress, v_progress - 0.015, v_t);
    if (tip <= 0.0) discard;
    float d = abs(v_across);
    float core = 1.0 - smoothstep(v_core - 0.8, v_core + 0.8, d);
    float glowR = v_kind > 0.5 ? 5.0 : 9.0;
    float halo = exp(-pow(max(d - v_core, 0.0) / glowR, 2.0) * 2.5);
    vec3 col = hueShift(u_color, v_hue);
    vec3 glo = hueShift(u_glow, v_hue);
    vec3 c;
    float a;
    if (v_kind < 0.5) {
        // Base glows, body fades toward the tip (the classic gradient)
        float along = v_t < 0.35 ? mix(0.9, 0.85, v_t / 0.35)
                    : v_t < 0.75 ? mix(0.85, 0.4, (v_t - 0.35) / 0.4)
                    : mix(0.4, 0.0, (v_t - 0.75) / 0.25);
        c = mix(glo, col, smoothstep(0.0, 0.35, v_t));
        a = along * (core + 0.45 * halo);
        // Nano-probe pulses travelling outward
        for (int i = 0; i < 6; i++) {
            if (float(i) >= u_pulses) break;
            float fi = float(i) + 1.0;
            float speed = 0.06 + 0.08 * fract(v_seed * 13.7 * fi);
            float pt = fract(v_seed * 7.13 * fi + speed * u_time / 1000.0);
            if (pt > v_progress) continue;
            float bump = exp(-pow((v_t - pt) / 0.018, 2.0));
            c = mix(c, glo, bump);
            a += bump * (0.9 * core + 0.8 * halo);
        }
    } else {
        // Bridges flash on arrival, then hold dim
        float flash = v_age < 400.0 ? 1.0 - v_age / 400.0 : 0.0;
        c = mix(col, glo, flash);
        a = max(0.3, flash) * (core + 0.5 * halo);
    }
    a *= tip;
    o = vec4(c * a, a);
}`;

// Sites and junctions: quads with a radial picture
const NODE_VS = COMMON + `
in vec2 a_center; in vec2 a_corner; in float a_extent; in float a_start; in float a_maxR;
in float a_seed; in float a_kind;
out vec2 v_local; out float v_age; out float v_maxR; out float v_seed; out float v_kind;
void main() {
    v_local = a_corner * a_extent; v_age = u_time - a_start; v_maxR = a_maxR;
    v_seed = a_seed; v_kind = a_kind;
    gl_Position = vec4(toClip(a_center + v_local), 0.0, 1.0);
}`;

const NODE_FS = COMMON + `
in vec2 v_local; in float v_age; in float v_maxR; in float v_seed; in float v_kind;
out vec4 o;
float sdHex(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p.yx);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
}
float ring(float d, float w) { return 1.0 - smoothstep(w * 0.5 - 0.8, w * 0.5 + 0.8, abs(d)); }
void main() {
    if (v_age < 0.0) discard;
    float dist = length(v_local);
    vec3 c = vec3(0.0);
    float a = 0.0;
    if (v_kind < 0.5) {
        float r = min(v_maxR, v_maxR * v_age / 400.0) * (1.0 + 0.12 * sin(u_time / 700.0 + v_seed * 6.283));
        float x = dist / max(r, 0.001);
        // Glow centre to colour at 60% to clear at the rim, plus a soft dark-green bloom
        vec3 g = mix(u_glow, u_color, smoothstep(0.0, 0.6, x));
        float ga = 1.0 - smoothstep(0.6, 1.0, x);
        c += g * ga; a += ga;
        float halo = exp(-x * x * 0.8) * 0.35;
        c += u_color * halo; a += halo;
        // Spawn hexagon
        if (v_age < 600.0) {
            float p = v_age / 600.0;
            float h = ring(sdHex(v_local, p * 52.0), 1.5) * (1.0 - p);
            c += u_glow * h; a += h;
        }
        // Hex-to-circle pulse rings once grown
        float period = 2000.0 + v_seed * 1000.0;
        float phase = mod(v_age - 400.0, period);
        if (v_age > 400.0 && phase < 1500.0) {
            float rp = phase / 1500.0;
            float R = rp * 80.0;
            float d = mix(sdHex(v_local, R * 0.866), dist - R, rp);
            float h = ring(d, 3.0) * 0.5 * (1.0 - rp);
            c += u_glow * h; a += h;
        }
    } else {
        float na = clamp(v_age / 300.0, 0.0, 1.0) * 0.85;
        float r = 8.0 + 3.0 * sin(u_time / 600.0 + v_seed * 6.283);
        float x = dist / r;
        float ga = (1.0 - smoothstep(0.0, 1.0, x)) * na;
        c += mix(u_glow, u_color, smoothstep(0.2, 0.9, x)) * ga; a += ga;
    }
    a = min(a, 1.0);
    o = vec4(c, a);
}`;

// Borg cube edges: both ends rotated and projected, widened in screen space
const CUBE_VS = COMMON + `
uniform mat3 u_rot; uniform vec2 u_center; uniform float u_size;
in vec3 a_a; in vec3 a_b; in vec2 a_corner; in float a_w;
out float v_across; out float v_core; out float v_depth; out float v_w;
const float D = 4.2;
vec3 project(vec3 p) {
    vec3 r = u_rot * p;
    float z = r.z + D;
    return vec3(u_center + r.xy * u_size * D / z, z);
}
void main() {
    vec3 pa = project(a_a), pb = project(a_b);
    vec2 dir = pb.xy - pa.xy;
    float len = length(dir);
    dir = len > 0.001 ? dir / len : vec2(1.0, 0.0);
    vec2 n = vec2(-dir.y, dir.x);
    float core = 0.4 + 1.4 * a_w;
    float half_ = core + 7.0;
    vec2 base = mix(pa.xy, pb.xy, a_corner.x);
    vec2 pos = base + n * a_corner.y * half_ + dir * (a_corner.x * 2.0 - 1.0) * half_;
    v_across = a_corner.y * half_; v_core = core; v_w = a_w;
    v_depth = mix(pa.z, pb.z, a_corner.x);
    gl_Position = vec4(toClip(pos), 0.0, 1.0);
}`;

const CUBE_FS = COMMON + `
uniform float u_alpha;
in float v_across; in float v_core; in float v_depth; in float v_w;
out vec4 o;
void main() {
    float d = abs(v_across);
    float core = 1.0 - smoothstep(v_core - 0.7, v_core + 0.7, d);
    float halo = exp(-pow(max(d - v_core, 0.0) / 6.0, 2.0) * 2.5);
    float fade = mix(1.0, 0.3, smoothstep(3.2, 5.2, v_depth));
    float a = (core * 0.9 + halo * 0.35 * v_w) * fade * u_alpha;
    vec3 c = mix(u_color, u_glow, v_w * 0.6);
    o = vec4(c * a, a);
}`;

const COMPOSITE_VS = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const COMPOSITE_FS = COMMON + `
uniform sampler2D u_tex;
uniform vec4 u_sites[20];
uniform int u_siteCount;
uniform float u_frontMs;
uniform float u_overrun;
uniform float u_corruption;
uniform float u_motion;      // 0 under reduced motion: no flicker, no tearing
uniform vec3 u_cube;         // centre x, y, darkening radius (0 = no cube)
uniform float u_detail;      // 1 = the detailed cube, ray-cast here (0 = classic wireframe from pass 1)
uniform mat3 u_rot;
uniform float u_cubeSize;
uniform float u_cubeAmt;
uniform vec4 u_spots[18];    // face, u, v, phase
uniform int u_spotCount;
out vec4 o;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
    return s;
}
float sdSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
// Connected maze traces: each cell links its centre to the edges whose shared bit is set
// x = trace, y = pad, z = plate
vec3 circuit(vec2 p, float cell, float lineW, float salt) {
    vec2 c = floor(p / cell);
    vec2 q = (fract(p / cell) - 0.5) * cell;
    bool R = hash(c + salt) > 0.45;
    bool L = hash(c - vec2(1.0, 0.0) + salt) > 0.45;
    bool Dn = hash(c + vec2(0.5, 0.25) + salt) > 0.5;
    bool Up = hash(c - vec2(0.0, 1.0) + vec2(0.5, 0.25) + salt) > 0.5;
    float h = cell * 0.5;
    float d = 1e5;
    float deg = 0.0;
    if (R)  { d = min(d, sdSeg(q, vec2(0.0), vec2(h, 0.0)));  deg += 1.0; }
    if (L)  { d = min(d, sdSeg(q, vec2(0.0), vec2(-h, 0.0))); deg += 1.0; }
    if (Dn) { d = min(d, sdSeg(q, vec2(0.0), vec2(0.0, h)));  deg += 1.0; }
    if (Up) { d = min(d, sdSeg(q, vec2(0.0), vec2(0.0, -h))); deg += 1.0; }
    float trace = 1.0 - smoothstep(lineW - 0.7, lineW + 0.7, d);
    float hc = hash(c * 1.7 + salt + 3.1);
    float pad = 0.0;
    if (deg == 1.0 || hc > 0.88) {
        vec2 aq = abs(q);
        float box = max(aq.x, aq.y);
        pad = 1.0 - smoothstep(0.6, 1.4, abs(box - lineW * 2.2));
    }
    float plate = 0.0;
    if (hc < 0.06) {
        vec2 aq = abs(q) - vec2(h * 0.8);
        plate = step(max(aq.x, aq.y), 0.0);
    }
    return vec3(trace, pad, plate);
}

// ── The detailed Borg cube: ray-cast against the box, same camera as CUBE_VS ──
const float CAM_D = 4.2;

// @borg-face-glsl: the shared face functions (borg-face-glsl.js) go here, spliced in by borg-worker-sources.js
// The cube at screen pixel px: rgb (premultiplied) and coverage; halo separately
vec4 borgCube(vec2 px, float t, out float halo) {
    halo = 0.0;
    vec2 s = (px - u_cube.xy) / (u_cubeSize * CAM_D);
    mat3 inv = transpose(u_rot);
    vec3 ro = inv * vec3(0.0, 0.0, -CAM_D);
    vec3 rd = inv * vec3(s, 1.0);
    rd += vec3(equal(rd, vec3(0.0))) * 1e-6;
    float pxUnit = 1.0 / u_cubeSize;        // cube units per pixel near the cube's centre

    // Distance from the ray to the box (convex along the ray: a ternary search finds it), for the halo
    float tc = -dot(ro, rd) / dot(rd, rd);
    float lo = tc - 2.5, hi = tc + 2.5;
    for (int i = 0; i < 10; i++) {
        float m1 = mix(lo, hi, 0.382), m2 = mix(lo, hi, 0.618);
        if (sdBox(ro + rd * m1, 1.0) < sdBox(ro + rd * m2, 1.0)) hi = m2; else lo = m1;
    }
    float sil = sdBox(ro + rd * (lo + hi) * 0.5, 1.0) / length(rd);
    float lobes = 0.6 + 0.8 * noise(normalize(s + 1e-5) * 2.2 + vec2(t * 0.00005, 0.0));
    halo = exp(-max(sil, 0.0) * 5.0 / lobes) * 0.55;

    vec3 nC, nL;
    float tIn = boxHit(ro, rd, 1.0, nC);
    float latB = 1.0 - DEPTH * 0.3;          // rails sit among the taller blocks
    float tLat = boxHit(ro, rd, latB, nL);
    if (tIn < 0.0) return vec4(0.0);

    // ── Relief march through the carved shell ──
    float tHit = -1.0;
    vec3 n = vec3(0.0);
    float t0 = tIn, t1 = tIn;
    int k0 = outsideAxis(ro + rd * (tIn + 1e-4));
    if (k0 < 0) { tHit = tIn; n = nC; }
    else {
        float dt = DEPTH / 6.0 / length(rd);
        for (int i = 0; i < 56; i++) {
            t1 = t0 + dt;
            vec3 p = ro + rd * t1;
            if (max(abs(p.x), max(abs(p.y), abs(p.z))) > 1.0001) break;   // out the far side
            int k = outsideAxis(p);
            if (k < 0) { tHit = t1; break; }
            t0 = t1; k0 = k;
        }
        if (tHit > 0.0) {
            for (int i = 0; i < 6; i++) {
                float tm = (t0 + tHit) * 0.5;
                int k = outsideAxis(ro + rd * tm);
                if (k < 0) tHit = tm; else { t0 = tm; k0 = k; }
            }
            // The face that stopped the ray: the top of a block (its depth did not change)
            // or a block's wall (the ray moved over a taller block)
            vec3 pa = ro + rd * t0, pb = ro + rd * tHit;
            float da = reliefDepth(axisUV(pa, k0), axisFace(pa, k0));
            float db = reliefDepth(axisUV(pb, k0), axisFace(pb, k0));
            if (abs(da - db) < 1e-4) {
                n[k0] = sign(pb[k0]);
            } else {
                int u = (k0 + 1) - 3 * ((k0 + 1) / 3), v = (k0 + 2) - 3 * ((k0 + 2) / 3);
                int w = abs(rd[u]) > abs(rd[v]) ? u : v;
                n[w] = -sign(rd[w]);
            }
        }
    }

    vec3 col = vec3(0.0);
    float a = 0.0;
    if (tHit > 0.0) {
        vec3 p = ro + rd * tHit;
        // The face this point belongs to: the axis it sits closest to the outside on
        vec3 ap = abs(p);
        int k = ap.x > ap.y ? (ap.x > ap.z ? 0 : 2) : (ap.y > ap.z ? 1 : 2);
        vec2 uv = axisUV(p, k);
        float face = axisFace(p, k);
        float rise = 1.0 - clamp((1.0 - ap[k]) / DEPTH, 0.0, 1.0);    // 1 on the tallest tops
        bool wall = abs(n[k]) < 0.5;
        vec3 nv = u_rot * n;                // view space: +y is down, the camera looks along +z
        vec3 faceNv = u_rot * (vec3(k == 0, k == 1, k == 2) * sign(p[k]));
        float pxUV = pxUnit * tHit / CAM_D / max(0.25, abs(faceNv.z));

        // Key light from the upper left front; the top face reads darker and greyer
        vec3 L = normalize(vec3(-0.45, -0.55, -0.7));
        float diff = max(dot(nv, L), 0.0);
        float top = smoothstep(0.35, 0.85, -faceNv.y);
        vec3 side = mix(vec3(0.2, 0.25, 0.21), u_color * 0.5, 0.6);
        vec3 metal = mix(side, vec3(0.34, 0.38, 0.35), top);
        metal *= 0.7 + 0.6 * hash(floor((uv * 0.5 + 0.5) * 14.0 + 0.37) + face);
        // Fine plating on block tops, vent stripes on walls
        vec4 fine = greebleLayer((uv * 0.5 + 0.5) * 36.0 + 0.71, face * 17.0 + 9.0);
        float fineK = 1.0 - smoothstep(0.2, 0.45, pxUV * 36.0);
        float detail = wall
            ? 0.75 + 0.25 * step(0.5, fract((1.0 - ap[k]) * 90.0))
            : (1.0 + 0.6 * fine.y * fineK) * (1.0 - 0.6 * fine.z * fineK);
        float ao = mix(0.3, 1.0, rise);
        col = metal * (0.3 + 1.0 * diff) * ao * detail;
        // Green light from inside, deepest in the recesses
        col += u_color * 0.16 * (1.0 - rise) * (1.0 - top);
        // Glow spots pulsing deep in the structure
        for (int i = 0; i < 18; i++) {
            if (i >= u_spotCount) break;
            vec4 sp = u_spots[i];
            if (abs(sp.x - face) > 0.5) continue;
            float d = length(uv - sp.yz);
            float period = 2000.0 + 3000.0 * fract(sp.w * 7.31);
            float pulse = 0.55 + 0.45 * sin(t / period * 6.2832 + sp.w * 6.2832);
            float gl = exp(-d * d / 0.03) * pulse;
            col += mix(u_color, u_glow, 0.3) * gl * (0.6 + 2.2 * (1.0 - rise) + 0.8 * diff);
        }
        a = 1.0;
    }
    // Lattice rails over the machinery in front of them
    if (tLat > 0.0 && (tHit < 0.0 || tLat < tHit)) {
        vec3 pl = ro + rd * tLat;
        float axisL;
        vec2 uvL = faceUV(pl, nL, axisL) / latB;
        float faceL = axisL * 2.0 + (dot(nL, vec3(1.0)) > 0.0 ? 1.0 : 0.0);
        float pxUVL = pxUnit * tLat / CAM_D / max(0.3, abs((u_rot * nL).z));
        float lat = lattice(uvL, faceL, pxUVL) * 0.9;
        vec3 latCol = mix(vec3(0.55, 0.6, 0.57), u_color * 0.8, 0.25) * (0.5 + 0.5 * max(dot(u_rot * nL, normalize(vec3(-0.45, -0.55, -0.7))), 0.0));
        col = latCol * lat + col * (1.0 - lat);
        a = lat + a * (1.0 - lat);
    }
    return vec4(col, a);
}

void main() {
    vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
    float t = u_time;
    float intro = u_motion * (1.0 - smoothstep(500.0, 600.0, t));

    // ── Signal corruption: bursts of block displacement, tearing, aberration ──
    float slot = floor(t / 120.0);
    float burst = step(1.0 - 0.07 * u_corruption, hash(vec2(slot, 7.0))) * u_corruption;
    float g = max(intro, burst) * u_motion;
    float bandH = 6.0 + 26.0 * hash(vec2(slot, 3.0));
    float band = floor(px.y / bandH);
    float shift = (hash(vec2(band, slot)) - 0.5) * 120.0 * g * step(0.55, hash(vec2(band + 0.5, slot)));
    float jitter = (hash(vec2(floor(px.y / 2.0), floor(t / 50.0))) - 0.5) * 3.0 * u_corruption * u_motion;
    vec2 pd = px + vec2(shift + jitter, 0.0);

    // ── Assimilation front: noise-shaped distance to the growing site discs ──
    float f = 1e5;
    for (int i = 0; i < 20; i++) {
        if (i >= u_siteCount) break;
        vec4 s = u_sites[i];
        float age = t - s.z;
        if (age <= 0.0) continue;
        float r = s.w * pow(clamp(age / u_frontMs, 0.0, 1.0), 1.35);
        float wob = (fbm(pd * 0.006 + vec2(t * 0.00004, s.z)) - 0.5) * 110.0 * min(1.0, r / 150.0);
        f = min(f, length(pd - s.xy) - r + wob);
    }
    float inside = smoothstep(2.0, -2.0, f);
    float edge = exp(-pow(f / 12.0, 2.0)) * step(f, 1e4);
    edge *= 0.55 + 0.45 * noise(pd * 0.06 + vec2(t * 0.003, -t * 0.002));

    vec3 rgb = vec3(0.0);
    float alpha = 0.0;
    if (inside > 0.001 || edge > 0.001) {
        // Light radiating outward behind the front
        float wave = pow(0.5 + 0.5 * sin(f * 0.045 + t * 0.003), 6.0);
        vec3 c1 = circuit(pd, 30.0, 1.1, 0.0);
        vec3 c2 = circuit(pd + 5.0, 12.0, 0.6, 17.0);
        float lines = max(c1.x, c1.y) + 0.35 * max(c2.x, c2.y);
        float base = inside * u_overrun;
        vec3 trace = mix(u_color, u_glow, wave * 0.8);
        rgb += u_color * 0.07 * base + u_color * 0.06 * c1.z * inside;
        float la = lines * inside * (0.35 + 0.65 * wave) * (0.4 + 0.6 * u_overrun);
        rgb += trace * la;
        alpha = max(base, la);
        rgb += u_glow * edge * 1.1;
        alpha = max(alpha, edge);
    }

    // Behind the cube: darker, so its edges read over the circuitry and tendrils
    float cubeK = 0.0;
    if (u_cube.z > 0.0 && u_detail < 0.5) {
        cubeK = (1.0 - smoothstep(0.0, u_cube.z, length(px - u_cube.xy))) * 0.6;
        rgb *= 1.0 - cubeK;
        alpha = max(alpha, cubeK);
    }

    // ── Pass 1 picture with chromatic aberration ──────────────────────────────
    float ca = (1.5 + 7.0 * g) * u_corruption * u_motion;
    vec2 uv = vec2(pd.x, u_res.y - pd.y) / u_res;
    vec2 off = vec2(ca / u_res.x, 0.0);
    vec4 mid = texture(u_tex, uv);
    vec3 tex = vec3(texture(u_tex, uv + off).r, mid.g, texture(u_tex, uv - off).b);
    rgb += tex * (1.0 - cubeK * 0.5);
    alpha = max(alpha, max(mid.a, max(tex.r, max(tex.g, tex.b))));

    // The detailed cube, in front of the tendrils, with a soft halo round it
    if (u_detail > 0.5 && u_cubeAmt > 0.0 && length(pd - u_cube.xy) < u_cube.z) {
        float halo;
        vec4 cb = borgCube(pd, t, halo);
        float h = halo * u_cubeAmt * (1.0 - cb.a);
        rgb += mix(u_color, u_glow, 0.2) * h;
        alpha = max(alpha, h);
        float ca2 = cb.a * u_cubeAmt;
        rgb = cb.rgb * u_cubeAmt + rgb * (1.0 - ca2);
        alpha = ca2 + alpha * (1.0 - ca2);
    }

    // ── Opening flicker and scan bars, scanlines ─────────────────────────────
    if (intro > 0.0) {
        float fl = step(0.5, hash(vec2(floor(t / 33.0), 1.0))) * 0.15 * intro;
        rgb += u_color * fl; alpha = max(alpha, fl);
        for (int i = 0; i < 2; i++) {
            float y = (i == 0 ? -20.0 : -60.0) + t * u_res.y / (i == 0 ? 260.0 : 320.0);
            float dy = pd.y - y;
            float b = smoothstep(-8.0, 3.0, dy) * (1.0 - smoothstep(3.0, 20.0, dy)) * 0.6 * intro;
            rgb += mix(u_glow, u_color, smoothstep(0.0, 14.0, dy)) * b; alpha = max(alpha, b);
        }
    }
    float scan = 1.0 - 0.18 * u_corruption * step(mod(px.y, 3.0), 1.0);
    rgb *= scan;

    alpha = clamp(alpha, 0.0, 1.0);
    o = vec4(min(rgb, vec3(alpha)), alpha);
}`;

// ─── GL helpers ───────────────────────────────────────────────────────────────

function _compile(gl, vs, fs) {
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error('shader: ' + gl.getShaderInfoLog(sh));
        }
        gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
    return prog;
}

/**
 * A vertex array from interleaved floats. `attrs` lists [name, size] in order.
 */
function _mesh(gl, prog, data, attrs, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const stride = attrs.reduce((n, [, size]) => n + size, 0) * 4;
    let offset = 0;
    for (const [name, size] of attrs) {
        const loc = gl.getAttribLocation(prog, name);
        if (loc >= 0) {
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
        }
        offset += size * 4;
    }
    let count = data.length / (stride / 4);
    if (indices) {
        const ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        count = indices.length;
    }
    gl.bindVertexArray(null);
    return { vao, count, indexed: !!indices };
}

/** Quads: 4 vertices each, two triangles */
function _quadIndices(n) {
    const idx = new Uint32Array(n * 6);
    for (let i = 0; i < n; i++) {
        const v = i * 4;
        idx.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], i * 6);
    }
    return idx;
}

function _bz(t, p0, p1, p2, p3) {
    const q = 1 - t;
    return q * q * q * p0 + 3 * q * q * t * p1 + 3 * q * t * t * p2 + t * t * t * p3;
}

/** Tendril and bridge curves as strips, 10 floats a vertex */
function _stripData(curves) {
    const STEPS = 32;
    const verts = new Float32Array(curves.length * (STEPS + 1) * 2 * 10);
    const idx = new Uint32Array(curves.length * STEPS * 6);
    let v = 0, k = 0, base = 0;
    for (const c of curves) {
        const p = c.p;
        const glow = c.kind === 1 ? 5 : 9;
        for (let s = 0; s <= STEPS; s++) {
            const t = s / STEPS;
            const x = _bz(t, p[0], p[2], p[4], p[6]), y = _bz(t, p[1], p[3], p[5], p[7]);
            const t0 = Math.max(0, t - 0.01), t1 = Math.min(1, t + 0.01);
            let dx = _bz(t1, p[0], p[2], p[4], p[6]) - _bz(t0, p[0], p[2], p[4], p[6]);
            let dy = _bz(t1, p[1], p[3], p[5], p[7]) - _bz(t0, p[1], p[3], p[5], p[7]);
            const len = Math.hypot(dx, dy) || 1;
            dx /= len; dy /= len;
            const core = c.kind === 1 ? c.width / 2 : Math.max(0.3, (c.width / 2) * Math.pow(1 - t, 0.6));
            const half = core + glow * 1.6;
            for (const side of [-1, 1]) {
                verts.set([x - dy * half * side, y + dx * half * side, half * side, t, core,
                    c.start, c.dur, c.hue, c.seed, c.kind], v);
                v += 10;
            }
            if (s < STEPS) {
                const a = base + s * 2;
                idx.set([a, a + 1, a + 2, a + 2, a + 1, a + 3], k);
                k += 6;
            }
        }
        base += (STEPS + 1) * 2;
    }
    return { verts, idx };
}

/** Sites and junctions as quads, 9 floats a vertex */
function _nodeData(sites, junctions) {
    const n = sites.length + junctions.length;
    const verts = new Float32Array(n * 4 * 9);
    let v = 0;
    const push = (x, y, extent, start, maxR, seed, kind) => {
        for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            verts.set([x, y, cx, cy, extent, start, maxR, seed, kind], v);
            v += 9;
        }
    };
    for (const s of sites) push(s.x, s.y, 100, s.spawnAt, s.maxR, s.seed, 0);
    for (const j of junctions) push(j.x, j.y, 16, j.appearAt, 0, j.seed, 1);
    return { verts, idx: _quadIndices(n) };
}

/** Cube segments as quads, 9 floats a vertex */
function _cubeData(segs) {
    const verts = new Float32Array(segs.length * 4 * 9);
    let v = 0;
    for (const s of segs) {
        for (const [end, side] of [[0, -1], [0, 1], [1, -1], [1, 1]]) {
            verts.set([s[0], s[1], s[2], s[3], s[4], s[5], end, side, s[6]], v);
            v += 9;
        }
    }
    return { verts, idx: _quadIndices(segs.length) };
}

function _rotation(t, cornerOn = false) {
    // Classic: a slow tumble round a tilted axis. Detailed: a corner toward the camera,
    // tilted forward so the top shows (like the reference), swaying a little either way
    const ax = cornerOn ? 0.36 : 0.42;
    const ay = cornerOn ? 0.62 + 0.3 * Math.sin(t * 0.00011) : t * 0.00021;
    const az = cornerOn ? 0 : 0.18;
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    // R = Rz * Rx * Ry, column-major for uniformMatrix3fv
    const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    const rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx];
    const rz = [cz, sz, 0, -sz, cz, 0, 0, 0, 1];
    const mul = (a, b) => {
        const o = new Array(9);
        for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
            o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
        }
        return o;
    };
    return new Float32Array(mul(rz, mul(rx, ry)));
}

// ─── Worker state ─────────────────────────────────────────────────────────────

let _canvas = null;
let _gl = null;
let _rafId = null;
let _running = false;
let _reduced = false;
let _draw = null;
let _resize = null;

function _fallback(reason) {
    _running = false;
    if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null; }
    self.postMessage({ type: 'fallback', reason: String(reason) });
}

function _start(canvas, layout, colors, options) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) { _fallback('no webgl2 context'); return; }
    _gl = gl;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); _fallback('context lost'); });

    const strip = _compile(gl, STRIP_VS, STRIP_FS);
    const node = _compile(gl, NODE_VS, NODE_FS);
    const cube = _compile(gl, CUBE_VS, CUBE_FS);
    const comp = _compile(gl, COMPOSITE_VS, COMPOSITE_FS);

    const sd = _stripData(layout.curves);
    const stripMesh = _mesh(gl, strip, sd.verts, [['a_pos', 2], ['a_across', 1], ['a_t', 1], ['a_core', 1],
        ['a_start', 1], ['a_dur', 1], ['a_hue', 1], ['a_seed', 1], ['a_kind', 1]], sd.idx);
    const nd = _nodeData(layout.sites, layout.junctions);
    const nodeMesh = _mesh(gl, node, nd.verts, [['a_center', 2], ['a_corner', 2], ['a_extent', 1],
        ['a_start', 1], ['a_maxR', 1], ['a_seed', 1], ['a_kind', 1]], nd.idx);
    const detailed = !!options.cube && options.cubeStyle !== 'classic';
    const cd = _cubeData(options.cube && !detailed ? layout.cube : []);
    const cubeMesh = _mesh(gl, cube, cd.verts, [['a_a', 3], ['a_b', 3], ['a_corner', 2], ['a_w', 1]], cd.idx);
    const fullMesh = _mesh(gl, comp, new Float32Array([-1, -1, 3, -1, -1, 3]), [['a_pos', 2]], null);

    const uniforms = (prog, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)]));
    const common = ['u_res', 'u_time', 'u_color', 'u_glow'];
    const uStrip = uniforms(strip, [...common, 'u_pulses']);
    const uNode = uniforms(node, common);
    const uCube = uniforms(cube, [...common, 'u_rot', 'u_center', 'u_size', 'u_alpha']);
    const uComp = uniforms(comp, [...common, 'u_tex', 'u_sites', 'u_siteCount', 'u_frontMs', 'u_overrun',
        'u_corruption', 'u_motion', 'u_cube', 'u_detail', 'u_rot', 'u_cubeSize', 'u_cubeAmt', 'u_spots', 'u_spotCount']);

    const siteData = new Float32Array(20 * 4);
    layout.sites.slice(0, 20).forEach((s, i) => siteData.set([s.x, s.y, s.spawnAt, s.reach], i * 4));
    const spots = (layout.cubeSpots || []).slice(0, 18);
    const spotData = new Float32Array(18 * 4);
    spots.forEach((s, i) => spotData.set(s, i * 4));

    // Pass 1 target
    let tex = null, fbo = null, fw = 0, fh = 0;
    _resize = () => {
        const w = Math.max(1, canvas.width), h = Math.max(1, canvas.height);
        if (w === fw && h === fh) return;
        fw = w; fh = h;
        if (tex) gl.deleteTexture(tex);
        if (fbo) gl.deleteFramebuffer(fbo);
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    _resize();

    const corruption = Math.min(1, Math.max(0, options.corruption));
    const overrun = Math.min(1, Math.max(0, options.overrun));
    const pulses = Math.min(6, Math.max(0, Math.round(options.particleCount)));
    const startT = performance.now();
    let frames = 0, statsAt = startT;

    const setCommon = (u, w, h, time) => {
        gl.uniform2f(u.u_res, w, h);
        gl.uniform1f(u.u_time, time);
        gl.uniform3fv(u.u_color, colors.color);
        gl.uniform3fv(u.u_glow, colors.glow);
    };

    _draw = (now) => {
        if (!_running || gl.isContextLost()) return;
        _resize();
        const w = fw, h = fh;
        const time = _reduced ? layout.settledAt : now - startT;

        // Pass 1: additive light into the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        let cubeAmt = 0;
        if (cubeMesh.count || detailed) {
            cubeAmt = Math.min(1, Math.max(0, (time - layout.cubeAt) / 3000));
            cubeAmt = cubeAmt * cubeAmt * (3 - 2 * cubeAmt);
        }
        const cubeSize = Math.min(w, h) * 0.2 * (0.35 + 0.65 * cubeAmt);
        if (cubeAmt > 0 && cubeMesh.count) {
            gl.useProgram(cube);
            setCommon(uCube, w, h, time);
            gl.uniformMatrix3fv(uCube.u_rot, false, _rotation(time, false));
            gl.uniform2f(uCube.u_center, w / 2, h / 2);
            gl.uniform1f(uCube.u_size, cubeSize);
            gl.uniform1f(uCube.u_alpha, cubeAmt);
            gl.bindVertexArray(cubeMesh.vao);
            gl.drawElements(gl.TRIANGLES, cubeMesh.count, gl.UNSIGNED_INT, 0);
        }

        gl.useProgram(strip);
        setCommon(uStrip, w, h, time);
        gl.uniform1f(uStrip.u_pulses, pulses);
        gl.bindVertexArray(stripMesh.vao);
        gl.drawElements(gl.TRIANGLES, stripMesh.count, gl.UNSIGNED_INT, 0);

        gl.useProgram(node);
        setCommon(uNode, w, h, time);
        gl.bindVertexArray(nodeMesh.vao);
        gl.drawElements(gl.TRIANGLES, nodeMesh.count, gl.UNSIGNED_INT, 0);

        // Pass 2: composite onto the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.disable(gl.BLEND);
        gl.useProgram(comp);
        setCommon(uComp, w, h, time);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(uComp.u_tex, 0);
        gl.uniform4fv(uComp.u_sites, siteData);
        gl.uniform1i(uComp.u_siteCount, Math.min(20, layout.sites.length));
        gl.uniform1f(uComp.u_frontMs, options.frontMs);
        gl.uniform1f(uComp.u_overrun, overrun);
        gl.uniform1f(uComp.u_corruption, _reduced ? 0 : corruption);
        gl.uniform1f(uComp.u_motion, _reduced ? 0 : 1);
        // The detailed cube's corners and halo reach further than the classic darkening
        gl.uniform3f(uComp.u_cube, w / 2, h / 2, cubeAmt > 0 ? cubeSize * (detailed ? 3.4 : 1.9 * cubeAmt) : 0);
        gl.uniform1f(uComp.u_detail, detailed ? 1 : 0);
        gl.uniform1f(uComp.u_cubeAmt, cubeAmt);
        gl.uniform1f(uComp.u_cubeSize, cubeSize);
        gl.uniformMatrix3fv(uComp.u_rot, false, _rotation(time, detailed));
        gl.uniform4fv(uComp.u_spots, spotData);
        gl.uniform1i(uComp.u_spotCount, spots.length);
        gl.bindVertexArray(fullMesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);

        if (_reduced) { _rafId = null; return; }
        frames++;
        if (now - statsAt >= 5000) {
            self.postMessage({ type: 'stats', fps: Math.round((frames * 1000) / (now - statsAt)) });
            frames = 0; statsAt = now;
        }
        _rafId = requestAnimationFrame(_draw);
    };

    self.postMessage({ type: 'ready' });
    _rafId = requestAnimationFrame(_draw);
}

function _redraw() {
    if (!_running || !_draw) return;
    if (_rafId !== null) cancelAnimationFrame(_rafId);
    _rafId = requestAnimationFrame(_draw);
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (e) => {
    const { type } = e.data;

    if (type === 'start') {
        _canvas = e.data.canvas;
        _running = true;
        _reduced = !!e.data.reducedMotion;
        try {
            _start(_canvas, e.data.layout, e.data.colors, e.data.options);
        } catch (err) {
            _fallback(err && err.message ? err.message : err);
        }
        return;
    }

    if (type === 'resize') {
        if (_canvas) {
            _canvas.width = Math.max(1, e.data.width);
            _canvas.height = Math.max(1, e.data.height);
        }
        // Reduced motion holds one frame: draw it again at the new size
        if (_reduced) _redraw();
        return;
    }

    if (type === 'motion') {
        _reduced = !!e.data.reduced;
        _redraw();
        return;
    }

    if (type === 'stop') {
        _running = false;
        if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null; }
        if (_gl && !_gl.isContextLost()) {
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
            _gl.clearColor(0, 0, 0, 0);
            _gl.clear(_gl.COLOR_BUFFER_BIT);
        }
    }
};

})();
