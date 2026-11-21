# Tribute portrait

Makes the star portrait for the astrometrics card's tribute to Sir Patrick Stewart
(`src/core/astrometrics/tribute.js`; four quick taps on a card's reset button).

`make_portrait.py` turns a reference photo of the pose (Captain Picard, hand raised,
600 x 480 after resizing) into a stipple of about 4,400 stars and writes only that star
data to `src/core/astrometrics/tribute-portrait.js`. The photo is not kept in the repo.

- The figure is cut out by hand-drawn outlines (`HEAD`, `HAND`, `BODY`): the photo's
  beige wall and chair are too close to skin for a colour key.
- Inside it every pixel is classed: face and hand, uniform red, uniform black, gold
  (combadge; the four rank pips are placed, `PIPS`).
- Star density follows the local-contrast light of the face and hand (so the eyes,
  brows and mouth read), the uniform's folds, edges, and the seams between regions;
  serpentine Floyd-Steinberg error diffusion with a little noise spaces the stars.

```bash
python3 tools/tribute-portrait/make_portrait.py <photo.png> --preview /tmp/portrait.png
```

The outlines are in the photo's pixels: a different photo needs them redrawn.
