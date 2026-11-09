# Banner (B1)

The README / docs banner is real LCARdS cards (an `lcards-layout-card` with an astrometrics scene and an LCARS frame) rendered in the browser test harness, captured frame by frame and encoded. Current banner: `e-wormhole-b-blue` (`doc/public/img/lcards-banner.gif`, `.mp4`, `.webp` poster).

## Files

- `make-concepts.py`: writes every config in `concepts/` (stills for D Badlands and E Wormhole, A and B layouts, red and blue; the `*-anim.yaml` animated versions) and the review views `demo/views/b1-banners-{red,blue}.yaml`. Edit the scene here, never the generated YAML.
- `render.mjs`: mounts one config at banner size. Still: `render.mjs <config.yaml> <out.png> [--size 1200x300] [--wait ms]`. Frames: `render.mjs <config.yaml> <framesDir> --capture <ms>` (PNG frames + `frames.txt` timestamps + `box.json`).
- `encode-gif.mjs`: `encode-gif.mjs <framesDir> <out.gif|out.mp4> [--fps] [--colors] [--crossfade ms] [--start ms] [--end ms]`; `GIF_DITHER=none` turns dithering off. MP4 is H.264 with faststart.

Banner-only config keys (stripped before mounting): `banner_profile` (HA-LCARS theme profile name: the red or blue LCARdS accent profile), `banner_states` (entity values at mount), `banner_after_mount` (values set right after mount: objects are built at full size, then shrunk, because a bound size grown from near zero scales wrongly), `banner_timeline` (`[{at: ms, states}]` during capture).

## Rebuild the current banner

```bash
npm run build                    # render.mjs serves the built bundle
python3 scripts/banner/make-concepts.py
S=/tmp/banner                    # any scratch dir
node scripts/banner/render.mjs scripts/banner/concepts/e-wormhole-b-blue-anim.yaml $S/cap-worm --wait 6000 --capture 9500
node scripts/banner/encode-gif.mjs $S/cap-worm doc/public/img/lcards-banner.gif --fps 12 --colors 192 --crossfade 1000
node scripts/banner/encode-gif.mjs $S/cap-worm doc/public/img/lcards-banner.mp4 --fps 30 --crossfade 1000
```

The `.webp` poster is one frame of the capture (ffmpeg, a frame where the wormhole is open). GitHub shows GIFs up to 10 MB; the current one is about 7 MB, the MP4 about 2 MB.

## Make the red version

Only the blue animations exist; the red stills do (`concepts/*-red.yaml`). In `make-concepts.py`, the `*-anim.yaml` blocks call `banner(..., PROFILES['blue'], ...)` and write `*-blue-anim.yaml`: copy the block for the one you want with `PROFILES['red']` and a `-red-anim.yaml` file name, run it, then render and encode as above. The profile recolours the frame (title, bars, URL); the scene's own colours (`var(--lcards-blue-*)` in the vortex and nebula) stay unless you change them in the scene too.

All candidates and their GIF/MP4 renders are kept in `reports/banner/` (gitignored).
