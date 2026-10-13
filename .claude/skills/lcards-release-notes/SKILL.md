---
name: lcards-release-notes
description: Draft, update or promote LCARdS release notes (doc/releases/<version>.md) and their pictures. Use when the user asks to write or update release notes, prepare a dev release or dev build, "what's new", promote or cut a stable/production release, or capture release screenshots.
---

# LCARdS release notes

The release page `doc/releases/<version>.md` is the source of truth for release notes: the docs site shows it and the `Release` GitHub workflow publishes it as the GitHub release body. You draft and maintain it; the user hand-tunes and commits. The user's side of the process (bumps, commits, workflow runs) is in `COOKBOOK.md` § Releases; the writing rules are in `.github/instructions/releases.instructions.md`. Read that guide before writing.

Never commit, stage, push or run GitHub workflows. Never claim a fix works in HA; the notes describe what the commits say and what you verified in the code.

Pick the procedure from the request:
- "update the release notes", "prepare dev release", "notes for the dev build": **A. Draft or update**.
- "promote", "stable release", "production release", "cut 2026.11.0": **B. Promote**.

## A. Draft or update (every dev build)

1. **What's new.** Run `npm run release:commits`. It prints the commits since the in-testing page's `notes_through` (or since the last released tag when no page is in testing), each with its message and the areas it touched, plus the sha to record afterwards. If it can't find the start, run `git fetch --tags` and retry. If there are 0 commits, say so and stop.
2. **The page.** If a page is in testing, update it. If not, create `doc/releases/<base>.md`, where `<base>` is `package.json`'s version without its `-dev.N` suffix. If `package.json` is already a stable version (no suffix, already released), the user has not bumped yet: tell them to run `npm run bump-version:dev` first, and stop. Frontmatter: `version` (quoted, equal to the file name), `status: testing`, no `date`, `summary`, `breaking`, `notes_through`.
3. **Read and verify each commit.** Read the full message. For every user-facing claim you put in the notes, confirm it in the code, schema or docs (grep for the option, read the docs page). Commit messages describe intent and can be wrong or superseded by later commits; when two commits touch the same thing, describe the end state. Skip what users never see: tests, CI, refactors, internal docs, typecheck baselines, unless they change behaviour.
4. **Sort it** into the page's sections (guide § Sections):
   - **Before you update:** anything a user must check or change: `feat!` / `BREAKING CHANGE`, raised minimum HA, removed or renamed options, schema deprecations, behaviour that now works differently (even when it was a bug fix), config migrations. Each item says what changed and what to do. Set `breaking: true` when this section is non-empty.
   - **New features**, **Improvements**, **Fixes** (grouped by area; `::: details All fixes` when long).
   - Fold new items into existing ones rather than appending duplicates; rewrite the intro, highlights and `summary` so they describe the whole release so far.
5. **Write for users** (guide § Who it's for): what it does and why before how; no file paths, class names, batch or session ids; config only when they must type it (YAML blocks are schema-checked); link docs pages with root-relative links and check the pages and anchors exist; issues as `[#123](https://github.com/snootched/lcards/issues/123)`, thanks as `[@handle](https://github.com/handle)`; no em dashes; one line per paragraph.
6. **Pictures** for new features users can see (a card, an editor, a studio, a panel tab):
   - Add shots to `doc/releases/shots/<version>.yaml` (options at the top of `scripts/release-shots.mjs`; the 2026.10.0 list has examples of a card, an editor, a studio opened by a method, a dialog built in `eval`, an HA page, and a video with a drag).
   - Use only `lcards_test_*` helpers (`input_boolean.lcards_test_toggle`, `input_number.lcards_test_value`, `input_select.lcards_test_mode`) or `sensor.desk_sensor_temperature`. The dev HA's other entities carry personal names (city, utility company); use them only in charts, behind `name:`, where no entity id shows.
   - Needs a current `npm run build` and the dev HA reachable with `.ha-token`. Run `npm run release:shots -- <version> <name ...>` (add `--gif` for videos, so GitHub gets a GIF).
   - **Look at every image** (Read it) before referencing it: it must show the feature, and no personal names, dashboard titles or sidebar. Re-crop or change the shot otherwise. Delete images you don't use (the check fails on unused files).
   - Reference them with `<img class="release-shot" alt="..." src="/releases/<version>/<name>.webp" />` or the `<video ... autoplay loop muted playsinline>` form, with real alt or title text.
   - If the dev HA is unreachable, write the notes anyway, leave the shot list in place and tell the user which pictures are still to capture.
7. **Record coverage:** set `notes_through` to the sha `release:commits` printed.
8. **Check:** `npm run release:check`, `node scripts/validate-doc-examples.js --strict`, `node scripts/check-doc-em-dashes.js`, `npm test`. Preview the GitHub body with `npm run release:notes -- <package.json version>`. Run `npm run docs:build` when you added links (it checks pages and anchors).
9. **Report:** what you added or changed (by section), anything you weren't sure of or couldn't verify (for the user to hand-tune), the pictures, and a commit message. Remind them of the next steps in `COOKBOOK.md` § Releases (commit and push `dev`, wait for the Docs workflow, run Release on `dev`).

## B. Promote (stable release)

1. **Catch up first:** run procedure A so the page covers every commit up to HEAD.
2. **Version:** the stable version is `package.json`'s base (`npm run bump-version` strips `-dev.N`). If the user wants a different number (for example `2026.11.0` because it ships in a new month), rename the page to `doc/releases/<new>.md`, set `version`, move `doc/public/releases/<old>/` to `<new>/` and rewrite the image paths in the page, move `doc/releases/shots/<old>.yaml`, and set `package.json` to it.
3. **Editorial pass over the whole page:** the intro and highlights describe the release as a whole, not the latest dev build; "Before you update" is complete (re-read every commit message in the range for `!`, BREAKING, deprecated, removed, minimum); `summary` and `breaking` are right; no "in testing" or dev-build wording in the body.
4. **Finalise:** `status: released`, `date:` the planned release date (ask if unsure; default today). Leave `notes_through` (it is ignored once released).
5. **Bump:** run `npm run bump-version` (or set the chosen version), then `npm run build` and `npm test`. Confirm `npm run release:notes -- <version>` prints the body without the dev-build note (exit 3 means the page is still in testing).
6. **Report** as in A.9, then the user's steps: commit on `dev`, push, PR `dev` to `main` and merge, wait for the Docs workflow on `main`, run Release on `main` (it refuses before tagging if the page is missing or still in testing). After the release, check the GitHub commit list's range (GitHub chooses the previous tag).
7. **Next cycle:** nothing to create yet. The next request after `npm run bump-version:dev` starts a new page through procedure A.
