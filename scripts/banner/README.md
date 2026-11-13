# Banner (B1)

The README / docs banner is real LCARdS cards (an `lcards-layout-card` with an astrometrics scene and an LCARS frame) rendered in the browser test harness, captured frame by frame and encoded. Current banner: **v4d** (`e-wormhole-b-blue-anim-v4d`, since 2026-11-13) at `doc/public/img/lcards-banner.gif`, `.mp4` and `.webp` (the README, What is LCARdS and the release notes link these names, so a new banner keeps them). Every version, v1 included, is kept in `reports/banner/versions/lcards-banner-<version>.*` (gitignored, not shipped).

## Files

- `make-concepts.py`: writes every config in `concepts/` (stills for D Badlands and E Wormhole, A and B layouts, red and blue; the `*-anim.yaml` animated versions) and the review views `demo/views/b1-banners-{red,blue}.yaml`. Edit the scene here, never the generated YAML.
- `render.mjs`: mounts one config at banner size. Still: `render.mjs <config.yaml> <out.png> [--size 1200x300] [--wait ms]`. Frames: `render.mjs <config.yaml> <framesDir> --capture <ms>` (PNG frames + `frames.txt` timestamps + `box.json`).
- `encode-gif.mjs`: `encode-gif.mjs <framesDir> <out.gif|out.mp4> [--fps] [--colors] [--crossfade ms] [--start ms] [--end ms]`; `GIF_DITHER=none` turns dithering off. MP4 is H.264 with faststart.

Banner-only config keys (stripped before mounting): `banner_profile` (HA-LCARS theme profile name: the red or blue LCARdS accent profile), `banner_states` (entity values at mount), `banner_after_mount` (values set right after mount: objects are built at full size, then shrunk, because a bound size grown from near zero scales wrongly), `banner_timeline` (`[{at: ms, states}]` during capture).

## Rebuild v1 (the first banner)

```bash
npm run build                    # render.mjs serves the built bundle
python3 scripts/banner/make-concepts.py
S=/tmp/banner                    # any scratch dir
node scripts/banner/render.mjs scripts/banner/concepts/e-wormhole-b-blue-anim.yaml $S/cap-worm --wait 6000 --capture 9500
node scripts/banner/encode-gif.mjs $S/cap-worm reports/banner/versions/lcards-banner-v1.gif --fps 12 --colors 192 --crossfade 1000
node scripts/banner/encode-gif.mjs $S/cap-worm reports/banner/versions/lcards-banner-v1.mp4 --fps 30 --crossfade 1000
```

The `.webp` poster is one frame of the capture (ffmpeg, a frame where the wormhole is open). GitHub shows GIFs up to 10 MB; the current one is about 7 MB, the MP4 about 2 MB.

## Banner v2 (the wormhole really opens)

`e-wormhole-b-blue-anim-v2` (`reports/banner/versions/lcards-banner-v2.gif`, `.mp4`, `.webp`, 2026-11-13): the same frame and timeline as v1, but the funnel opens out of the flash instead of fading in: `well.morph` runs from a needle (`well.to: { profile: [0.02, 0.02] }`) to the trumpet while `depth` grows from 0.2 to 11, both following `input_number.banner_aperture` and eased in place. v1 stays as it is.

```bash
node scripts/banner/render.mjs scripts/banner/concepts/e-wormhole-b-blue-anim-v2.yaml $S/cap-v2 --wait 6000 --capture 9500
node scripts/banner/encode-gif.mjs $S/cap-v2 reports/banner/versions/lcards-banner-v2.gif --fps 12 --colors 192 --crossfade 1000
node scripts/banner/encode-gif.mjs $S/cap-v2 reports/banner/versions/lcards-banner-v2.mp4 --fps 30 --crossfade 1000
```

The poster `.webp` is the frame at 4 s (ffmpeg, `-quality 85`).

## Banner v3 (staged like the DS9 wormhole)

`e-wormhole-b-blue-anim-v3` (`reports/banner/versions/lcards-banner-v3.*`): v2's morph, staged on three values with their own timing. Opening: the flash, the disc blooms fast (`banner_aperture`), then the funnel's mouth widens (`banner_mouth`: `well.morph`) and its throat deepens (`banner_throat`: `depth`). Closing in reverse: the throat pulls back, the mouth narrows into the disc, the disc collapses into the core, the last flash. Render with `--capture 10500` (see v4a) and encode as v2 with `-v3` names.

## Banner v4 (3D gas)

`e-wormhole-b-blue-anim-v4` (`reports/banner/versions/lcards-banner-v4.*`): v3's staging, with the disc's bands as real 3D gas (a volume nebula, `shape: whirlpool`, blooming with `banner_aperture`); the galaxy's stars stay, faint, for sparkle. The GIF needs `--colors 144` to stay under GitHub's 10 MB (192 gives 10.3 MB).

## Banner v4a (a faster tunnel)

`e-wormhole-b-blue-anim-v4a` (`reports/banner/versions/lcards-banner-v4a.*`): v4 with the tunnel faster than the mouth: its depth eases in 350 ms (v4: 1100) against the mouth's 700, shooting down just behind the widening mouth and snapping back first on closing.

**Capture v3, v4 and v4a for 10.5 s** (`--capture 10500`): the loop crossfade blends the clip's last second over its first, and with a 9.5 s capture that last second held the closing flash, which then showed for a moment at the start. The extra second is quiet space.

## Banner v4b (an overlapping, snapping close)

`e-wormhole-b-blue-anim-v4b` (`reports/banner/versions/lcards-banner-v4b.*`): v4a's opening; the close overlaps (the tunnel collapses, the mouth narrows 150 ms later, the disc 100 ms after that) and the disc and gas snap into the flash in about 250 ms. Their easing is 250 ms both ways, so the opening steps its target up (45, 80, 100) to bloom as v4a does. Capture 10.5 s.

## Banners v4c and v4d (tilted)

`e-wormhole-b-blue-anim-v4c` and `-v4d` (`reports/banner/versions/lcards-banner-v4c.*`, `-v4d.*`): v4b with the wormhole's axis leaning back and to the left, so the mouth looks more toward the camera while the tunnel still shows behind it. Every part faces one `down` point (the funnel, the galaxy and the whirlpool gas, which faces down its axis since F2): v4c `[-150, -1000, -150]` (about 12 degrees), v4d `[-300, -1000, -250]` (about 21), v4e `[-350, -1000, -400]` (about 28: the mouth almost faces the camera, `-v4e.*`). Capture 10.5 s.

## Make a version the banner

Render and encode it into `reports/banner/versions/` as above, then copy its `.gif`, `.mp4` and `.webp` over `doc/public/img/lcards-banner.*` (GIF under 10 MB for GitHub: `--colors 144` for the gas versions).

## Make the red version

Only the blue animations exist; the red stills do (`concepts/*-red.yaml`). In `make-concepts.py`, the `*-anim.yaml` blocks call `banner(..., PROFILES['blue'], ...)` and write `*-blue-anim.yaml`: copy the block for the one you want with `PROFILES['red']` and a `-red-anim.yaml` file name, run it, then render and encode as above. The profile recolours the frame (title, bars, URL); the scene's own colours (`var(--lcards-blue-*)` in the vortex and nebula) stay unless you change them in the scene too.

All candidates and their GIF/MP4 renders are kept in `reports/banner/` (gitignored).
