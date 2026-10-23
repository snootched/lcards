# Upstream

- Source: https://github.com/BowTiedSwan/animejs-skills
- Commit: `cf2bed8` (2026-01-26)
- License: MIT (declared in the upstream README; the repo has no LICENSE file)
- Vendored: `SKILL.md` (from "Core Concepts" down), `references/api-reference.md`, `references/examples.md`. Not vendored: `README.md`, `install.sh`.
- The v3 to v4 callback/parameter rows in the LCARdS rules section are adapted from almeidamarcell/claude-code-skills `animejs` (Apache-2.0).
- `references/changes-4.4-4.5.md` is ours, not vendored: written 2026-10-22 for the 4.3.6 to 4.5.0 upgrade from the upstream release notes and the 4.5.0 `.d.ts` (the vendored text stops at January 2026, before 4.4).

## Local patches (re-apply after a re-vendor)

1. Frontmatter, title, install section replaced with the LCARdS description and "LCARdS rules" section.
2. String parametric eases (`'cubicBezier(..)'`, `'steps(..)'`) replaced with the generator functions; these strings were removed from core in anime.js 4.3.
3. `createSpring` replaced with `spring` (deprecated alias in 4.3).
4. Easing sitemap rewritten: v4 names (`in`/`out`/`inOut`/`outIn`) and generators as top-level exports, not on `eases`.
5. `anime.random` in named-import examples replaced with `utils.random`.
6. "React Integration" and "Bundle Sizes" replaced with "Lit / Shadow DOM Integration".
7. (2026-10-22, upgrade to 4.5.0) Version lines; function-value examples take `(el, i, targets)` (4.4 changed the third argument from the count to the targets array); `revert()` described as restoring attributes and object props too.

## Why this one

Compared 2026-10-21 against the installed animejs 4.3.6: freshtechbro/claudedesignskills is v3 syntax; INERATE/atelier is a 50-line stub; davidosemwegie/animejs-best-practices is WAAPI/React-first and imports names 4.3.6 does not export; almeidamarcell's teaches string spring/steps eases. Every candidate needed the 4.3 easing patch.

## Updating

When bumping `animejs` in `package.json`: run `tests/core/animejs-skill.test.js` (fails if the skill teaches a name the installed version no longer exports, or if the "Exact version" line names a different version than the one installed), then diff upstream for new content and re-apply the patches above, and add the release's changes to `references/changes-*.md`.
