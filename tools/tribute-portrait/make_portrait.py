#!/usr/bin/env python3
"""
The tribute's portrait (src/core/astrometrics/tribute.js) as stars: a
stipple of the reference photo, made of a couple of thousand stars whose
density follows the picture's light and edges, coloured by what they are:
the face and hand, the red of the uniform, the black of its yoke, the gold of
the rank pips and the combadge.

The figure is cut out by hand-drawn outlines (the photo's background is a
beige wall and chair, too close to skin for a colour key), then each pixel
inside is classed by colour. Stars come from Floyd-Steinberg error diffusion
of a density map, which spaces them evenly (a stipple, not noise).

Only the star data is written (src/core/astrometrics/tribute-portrait.js);
the photo stays outside the repository.

    python3 tools/tribute-portrait/make_portrait.py <photo.png> [--preview out.png]
"""
import sys
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 600, 480
TARGET = 4500  # stars

# The four rank pips (gold, placed: too small for the colour test)
PIPS = [(270, 267), (277, 273), (284, 279), (290, 284)]

# Hand-drawn outlines (px in the 600 x 480 photo)
HEAD = [(310, 43), (337, 53), (357, 77), (370, 103), (376, 128), (384, 141), (384, 165), (376, 185), (367, 210),
        (352, 232), (360, 248), (300, 256), (250, 248), (258, 226), (247, 203), (232, 188), (223, 170), (222, 151),
        (230, 140), (230, 123), (233, 97), (247, 70), (275, 50)]
HAND = [(47, 277), (43, 260), (45, 230), (52, 203), (67, 193), (83, 183), (92, 177), (100, 160), (108, 145),
        (115, 130), (121, 136), (116, 152), (111, 168), (128, 180), (149, 182), (149, 194), (132, 214), (130, 232),
        (123, 253), (110, 267), (90, 277), (70, 282)]
BODY = [(0, 480), (0, 365), (14, 318), (30, 296), (47, 284), (90, 281), (110, 270), (130, 270), (167, 260),
        (220, 253), (250, 247), (300, 256), (373, 247), (383, 250), (440, 262), (480, 272), (510, 290), (525, 315),
        (540, 350), (555, 400), (570, 450), (580, 480)]

SKIN, RED, BLACK, GOLD = 0, 1, 2, 3


def polygon_mask(points):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return np.asarray(m) > 0


def sobel(gray):
    g = np.pad(gray, 1, mode='edge')
    gx = (g[:-2, 2:] + 2 * g[1:-1, 2:] + g[2:, 2:]) - (g[:-2, :-2] + 2 * g[1:-1, :-2] + g[2:, :-2])
    gy = (g[2:, :-2] + 2 * g[2:, 1:-1] + g[2:, 2:]) - (g[:-2, :-2] + 2 * g[:-2, 1:-1] + g[:-2, 2:])
    return np.hypot(gx, gy)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    img = Image.open(sys.argv[1]).convert('RGB').resize((W, H))
    rgb = np.asarray(img).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    soft = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
    edges = sobel(soft)
    edges = np.clip(edges / np.percentile(edges, 99), 0, 1)

    head, hand, body = polygon_mask(HEAD), polygon_mask(HAND), polygon_mask(BODY)
    flesh = (head | hand)
    figure = flesh | body

    # what each pixel is
    region = np.full((H, W), -1, dtype=np.int8)
    red = (r > g + 45) & (r > b + 15)
    gold = (r > 140) & (g > 110) & (b < 110) & (r > b + 50) & body & ~red
    silver = (lum > 150) & body & ~red & (np.abs(r - b) < 40)
    region[figure] = SKIN
    region[body & red] = RED
    region[body & ~red & ~gold & ~silver] = BLACK
    region[body & (gold | silver)] = GOLD
    region[flesh & ~body] = SKIN
    # the hand over the sleeve and the neck over the collar stay skin where they look like skin
    skinlike = (r > 110) & (r > g) & (g > b - 10) & ~red
    region[(hand | head) & skinlike] = SKIN

    # density: the light of the face and hand (local contrast raised, so the eyes, brows and mouth read),
    # the uniform's red by its folds, the yoke sparse; edges, the figure's outline and the uniform's seams add detail
    light = soft / 255.0
    wide = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32)
    local = np.clip((soft + 2.4 * (soft - wide)) / 255.0, 0, 1)
    d = np.zeros((H, W), dtype=np.float32)
    s = region == SKIN
    d[s] = 0.02 + 0.98 * local[s] ** 2.2
    d[region == RED] = 0.05 + 0.30 * np.clip((r[region == RED] - 60) / 150.0, 0, 1)
    d[region == BLACK] = 0.05 + 0.12 * light[region == BLACK]
    d[region == GOLD] = 0.95
    d += edges * (region >= 0) * np.where(s, 1.1, np.where(region == BLACK, 0.35, 0.6))
    # the outline and the seams between regions
    reg = region.astype(np.int16)
    seam = np.zeros((H, W), dtype=bool)
    seam[:, 1:] |= reg[:, 1:] != reg[:, :-1]
    seam[1:, :] |= reg[1:, :] != reg[:-1, :]
    seam = np.asarray(Image.fromarray((seam * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    d += 0.55 * seam
    d *= figure
    # scale to the target number of stars
    d *= TARGET / max(1e-6, d.sum())
    d = np.clip(d, 0, 1)

    # Floyd-Steinberg error diffusion, serpentine with a little noise: evenly spaced stars, no rows of worms
    rng = np.random.default_rng(1940)
    acc = d.copy()
    stars = []
    for y in range(H):
        right = y % 2 == 0
        xs = range(W) if right else range(W - 1, -1, -1)
        step = 1 if right else -1
        for x in xs:
            old = acc[y, x]
            new = 1.0 if old >= 0.5 + (rng.random() - 0.5) * 0.25 else 0.0
            err = old - new
            if new:
                stars.append((x, y))
            if 0 <= x + step < W:
                acc[y, x + step] += err * 7 / 16
            if y + 1 < H:
                if 0 <= x - step < W:
                    acc[y + 1, x - step] += err * 3 / 16
                acc[y + 1, x] += err * 5 / 16
                if 0 <= x + step < W:
                    acc[y + 1, x + step] += err * 1 / 16

    out = []
    for x, y in stars:
        k = int(region[y, x])
        if k < 0:
            continue
        if k == SKIN:
            bright = int(np.clip(70 + 185 * local[y, x], 0, 255))
        elif k == RED:
            bright = int(np.clip(150 + 105 * (r[y, x] - 60) / 150.0, 0, 255))
        elif k == BLACK:
            bright = int(np.clip(150 + 300 * light[y, x], 0, 255))
        else:
            bright = 255
        size = 1 if (k == SKIN and local[y, x] < 0.55) or k == BLACK else 2 if k != GOLD else 2
        out.extend([x, y, k, size, bright])
    for x, y in PIPS:
        out.extend([x, y, GOLD, 3, 255])

    js = (
        "/**\n"
        " * The tribute portrait's stars (tribute.js), made by tools/tribute-portrait/make_portrait.py:\n"
        " * x, y (px in a 600 x 480 frame, y down), kind (0 face and hand, 1 uniform red, 2 uniform black,\n"
        " * 3 pips and combadge), size (1 to 3), brightness (0 to 255), five numbers a star.\n"
        " * Generated: do not edit by hand.\n"
        " * @module core/astrometrics/tribute-portrait\n"
        " */\n"
        f"export const PORTRAIT = {json.dumps(out, separators=(',', ':'))};\n"
    )
    with open('src/core/astrometrics/tribute-portrait.js', 'w') as f:
        f.write(js)
    print(f'{len(out) // 5} stars')

    if '--preview' in sys.argv:
        path = sys.argv[sys.argv.index('--preview') + 1]
        colors = {SKIN: (255, 236, 214), RED: (220, 70, 80), BLACK: (90, 110, 150), GOLD: (255, 204, 102)}
        prev = Image.new('RGB', (W * 2, H * 2), (0, 0, 0))
        dr = ImageDraw.Draw(prev)
        for i in range(0, len(out), 5):
            x, y, k, s, bb = out[i:i + 5]
            c = tuple(int(v * (0.35 + 0.65 * bb / 255)) for v in colors[k])
            rr = s * 0.9
            dr.ellipse([x * 2 - rr, y * 2 - rr, x * 2 + rr, y * 2 + rr], fill=c)
        prev.save(path)


if __name__ == '__main__':
    main()
