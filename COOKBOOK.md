# LCARdS maintainer cookbook

How we build, test, release and publish LCARdS: the recipes first, then the reference. Internal (not on the docs site). Rules for writing code live in `CLAUDE.md` and `.github/instructions/`; this file is about running things.

**Contents:** [Daily loop](#daily-loop) · [Releases](#releases) · [CI workflows](#ci-workflows) · [npm scripts](#npm-scripts) · [Tests](#tests) · [Docs site](#docs-site) · [Other maintenance](#other-maintenance) · [Gotchas](#gotchas)

---

## Daily loop

| Step | Command | Notes |
|---|---|---|
| Build | `npm run build` | Always this one (runs every validator). Writes `custom_components/lcards/lcards.js` + `chunks/` + `.br`/`.gz`. |
| See it in HA | Ctrl+Shift+R in the browser | Hard refresh is required: the stub's old chunks are deleted on every build. |
| Unit tests | `npm test` | All `tests/**/*.test.js`, about 700 tests, under a minute. |
| Types | `npm run typecheck:check` | Fails only on errors not in `scripts/tsc-baseline.txt`. |
| Browser tests | `npm run test:browser` | After `npm run build`. CI runs it too. |
| Real HA | `npm run test:ha` | Local only; needs `.ha-token`. |
| Docs | `npm run docs:serve` | Dev server with hot reload; live demos use the last `npm run build`. |
| All npm scripts | `npm run help` | Grouped, with when to run each. |

The user commits; Claude never commits, stages or pushes.

---

## Releases

### How it fits together

```
doc/releases/<version>.md  ──►  docs site /releases/        (Docs workflow, on push to dev or main)
        │
        └──►  scripts/release-notes.mjs export  ──►  GitHub release body   (Release workflow, manual)
                                                     + GitHub's own commit list underneath
```

- **One page per version** (`doc/releases/2026.11.0.md`). It is the only place notes are written. Never edit notes on GitHub; edit the page.
- **`status: testing`** while the version is in dev builds. Every `-dev.N` pre-release on GitHub carries the page with a "Dev build of the upcoming ..." note, and the docs site lists it first as "In testing". There is no separate page per dev build: the same page grows.
- **`status: released` + `date:`** when it ships. The Release workflow refuses a stable release without that, before it creates the tag.
- **`notes_through: <sha>`** in the frontmatter: the last commit the notes cover. `npm run release:commits` lists everything after it, so each update only looks at what's new.
- **Pictures** in `doc/public/releases/<version>/`, captured from the dev HA by `npm run release:shots` from `doc/releases/shots/<version>.yaml`, or dropped in by hand.
- **Writing rules:** `.github/instructions/releases.instructions.md`.

### Who does what

| Step | Who | How |
|---|---|---|
| Bump the version | you | `npm run bump-version:dev` / `npm run bump-version` |
| Write or update the notes, shot list and pictures | Claude | Ask: "update the release notes" (dev) or "promote the release" (stable). The project skill `lcards-release-notes` (`.claude/skills/`) holds the procedure. |
| Hand-tune wording, check pictures | you | Edit the page; look at every new image. |
| Commit, push, PR, merge | you | git |
| Publish | you | GitHub, then Actions, then Release, then Run workflow |

### Recipe: a dev release

1. **Bump:** `npm run bump-version:dev`. It gives `2026.11.0-dev.1`, then `-dev.2` and so on. On a stable version it starts `-dev.1` on the next base. (An old-style suffix like `-dev3` becomes `-dev.1`.)
2. **Notes:** ask Claude to "update the release notes for the dev build". Claude:
   - runs `npm run release:commits`;
   - creates the page (first dev build) or updates it;
   - verifies the claims in the code and writes in the house style;
   - adds shots and captures them (needs the dev HA, `.ha-token` and a fresh build);
   - sets `notes_through`;
   - runs the checks and reports what to hand-tune, with a commit message.
3. **Review:** read the page (`npm run docs:serve`, then `/releases/`) and every new picture. Optionally preview the GitHub body: `npm run release:notes -- 2026.11.0-dev.1`.
4. **Check:** `npm run build` and `npm test`.
5. **Commit and push `dev`.**
6. **Wait for the Docs workflow** (Actions, then Docs) to finish. The GitHub body links pictures on `lcards.unimatrix01.ca`, so they must be live first.
7. **Publish:** Actions, then Release, then Run workflow, branch **dev**. It:
   - runs the Validate workflow as a gate;
   - detects a pre-release from the `-dev` suffix;
   - exports the page;
   - tags;
   - builds and zips;
   - publishes the pre-release, named "LCARdS <version>".
8. **Check the release on GitHub:** the dev note at the top, pictures loading, the zip attached.

A dev build with no page at all still publishes, with GitHub's generated notes only.

### Recipe: a stable release

1. **Notes:** ask Claude to "promote the release". Claude:
   - first catches the page up to HEAD (as in the dev recipe);
   - does an editorial pass over the whole page (intro and highlights for the whole release, "Before you update" complete);
   - sets `status: released` and the `date` (tell it the planned day);
   - runs `npm run bump-version` (which strips `-dev.N`: `2026.11.0-dev.4` becomes `2026.11.0`);
   - runs the checks.
2. **A different version number:** say so (for example "ship it as 2026.12.0"). The page, its picture folder and the shot list are renamed to match; the tests fail until the file name, `version:` and image paths agree.
3. **Review**, then `npm run build` and `npm test`.
4. **Commit on `dev`, push, open a PR from `dev` to `main`, merge.**
5. **Wait for the Docs workflow on `main`.**
6. **Publish:** Actions, then Release, then Run workflow, branch **main**. It stops before tagging if the page is missing (exit 2) or still `status: testing` (exit 3).
7. **Check the release on GitHub,** including the commit list's "Full Changelog" range. GitHub picks the previous tag itself and may compare against the last dev tag.
8. **Next cycle:** the next `npm run bump-version:dev` starts a new version; the first "update the release notes" then creates its page.

### When something goes wrong

| Problem | Fix |
|---|---|
| Release workflow: "No release page" (exit 2) on main | Create or rename `doc/releases/<version>.md`, commit, merge, re-run. Nothing was tagged. |
| Exit 3 | The page still says `status: testing`: set `released` and `date`. Nothing was tagged. |
| Pictures broken on GitHub | The Docs workflow hadn't deployed yet, or an image isn't committed. Check `git status doc/public/releases`, wait for Docs, then reload the release. |
| Typo in published notes | Fix the page, then `npm run release:notes -- <version>` and paste the output over the GitHub release body (Edit release). The page stays the source. |
| Tag created but the release failed later | Re-run the workflow: an existing tag is reused. If the tag points at the wrong commit, delete the tag on GitHub first. |
| `release:commits` can't find the start | `git fetch --tags`, or fix `notes_through` on the page. |
| A `doc/releases` file doesn't show in `git status` | A gitignore rule is hiding it (`[Rr]eleases/` once did); `tests/docs/releases.test.js` checks this. |

### Release commands

| Command | What it does |
|---|---|
| `npm run release:commits` | Commits the notes don't cover yet, with messages and areas (`-- --brief` for subjects only). |
| `npm run release:check` | Every page: frontmatter, images exist and are used, nothing that can't export. Also in `npm test`. |
| `npm run release:notes -- <version>` | Prints the GitHub body exactly as the workflow makes it. |
| `npm run release:shots -- <version> [name ...] [--gif]` | Captures pictures from the dev HA per the shot list. `--gif` adds GitHub GIFs for videos. |
| `node scripts/release-notes.mjs import` | One-off backfill from GitHub (done 2026-10-12). Don't re-run with `--force`: it overwrites hand edits. |

---

## CI workflows

All in `.github/workflows/`.

| Workflow | Runs on | What it does |
|---|---|---|
| **Validate** (`validate-integration.yml`) | push and PR to `main`/`dev`, manual, and as the Release gate; **nightly: HACS + Hassfest only** | See the job list below. |
| **Docs** (`docs.yml`) | push to `main`/`dev` touching `doc/**`, `src/**`, `scripts/**`, the docs tests or the build config; PRs (no deploy); manual | `npm run docs:build` (dead links, anchors), `npm run test:docs` (live demos, galleries, playgrounds, labs), then deploy to GitHub Pages (`lcards.unimatrix01.ca`). A failing test stops the deploy. Both branches deploy to the same site: **the last push wins**, so the site can show `dev` docs. About 5 minutes. |
| **Release** (`release.yml`) | manual only (Run workflow, pick the branch) | Validate gate, read the version from `package.json`, pre-release if the suffix is `-dev` or the branch isn't `main`, export the release page, tag, stamp `manifest.json`/`const.py`, `build:integration`, verify the output, zip, publish with the page as the body plus GitHub's commit list. |
| **Issue template check** (`issue-template-check.yml`) | issues opened, edited or reopened | Issues that skip the forms get a `needs-template` label and one comment. Owners and collaborators are exempt; it never closes anything. |

**Validate jobs** (all except the first two are skipped on the nightly schedule):
- Hassfest and HACS validation (the routine HACS check; these run nightly).
- CSS variable lint.
- Docs examples (strict), the schema description check and the em-dash check: seconds. The docs site build and its tests are in the Docs workflow.
- **Tests and Typecheck:** `npm test`, `typecheck:check`, `build:integration`, `test:browser`.
- Version format (`YYYY.MM.SEQ[-suffix]`).
- Required files present.
- Validate Build (`build:integration` and output checks), after the others pass.

Not in CI (local only): `test:visual`, `test:ha`, `check:ha-impact`, `release:shots`.

---

## npm scripts

`npm run help` prints the same list from `scripts/help.js` (add new scripts there; it flags undocumented ones). "Inside build" means `npm run build` already runs it.

**Build**

| Script | When | What |
|---|---|---|
| `build` | every build | Doc examples (strict), schema descriptions, docs em dashes, CSS vars, HA compat, version sync, Vite build (minified, `.br`/`.gz`), asset copy. |
| `build:integration` | CI/release | Vite build and asset copy only. Never for dev. |
| `set-version` | inside build | `package.json` version into `manifest.json` (HA CalVer, no suffix) and `const.py`. |
| `bump-version` | releasing | Strip `-dev.N` (promote), or advance SEQ (reset on a new month). |
| `bump-version:dev` | each dev build | Next `-dev.N`, or `-dev.1` on the next base. |
| `typecheck` | as needed | Full sorted TypeScript error list. |
| `typecheck:check` | CI | Fails only on errors not in the baseline. After fixing some: `node scripts/check-typecheck-baseline.js --update`. |

**Validation** (all inside `build`)

| Script | What |
|---|---|
| `validate:doc-examples` / `:strict` | YAML examples in `doc/` against the card, view and MSD schemas (the list is `scripts/lib/card-schemas.js`); strict also fails on unknown keys. |
| `validate:schema-descriptions` | Fails on schema properties added without a `description`; the known backlog is `scripts/schema-description-baseline.txt`. After filling some: `npm run validate:schema-descriptions:update`. |
| `validate:css-vars` / `:verbose` | Every `--lcars-*`, `--lcards-*` and `theme:` reference is registered. |
| `validate:ha-compat` | No HA elements, attributes, CSS hooks or imports that are dead in the minimum HA. |

**Tests**

| Script | What |
|---|---|
| `test` | Every node:test suite. |
| `test:routing`, `test:data-grid` | One suite. |
| `test:browser` | Layer A, Playwright: fixture cards on the built bundle, fake hass (CI). |
| `test:visual` | Layer B: screenshot baselines (local; `-- --update-snapshots` after an intended change). |
| `test:ha` | Layer C: smoke tests on the dev HA (local; `.ha-token`). |
| `test:docs` | Live demos, galleries, playgrounds and labs on the built docs site (after `docs:build`). |

**Docs**

| Script | What |
|---|---|
| `docs:build` | LLM schema, bundle copy for demos, VitePress build (fails on dead links), anchor check. |
| `docs:serve` / `docs:serve:network` | Dev server (`--host` for other devices on the LAN). |
| `docs:preview` | Serve the built site. |
| `docs:bundle` | Build and copy the card bundle into `doc/public/lcards/` (inside `docs:build`). |
| `docs:check-anchors` | Links to missing `#anchors` (inside `docs:build`). |
| `docs:routing-diagrams` | Regenerate the MSD routing diagrams. |
| `generate:llm-schema` | Regenerate `doc/public/lcards-schema.json` (cards, the layout view, the shell strategy; MSD not yet) from `scripts/lib/card-schemas.js` (inside `docs:build`). |

**Releases:** see [Release commands](#release-commands).

**HA impact**

| Script | What |
|---|---|
| `check:ha-impact:quick` | Diff the local `frontend` (and `--include-core`) checkouts against the last analysed commit, filtered to what LCARdS uses. `--ref=<tag>` analyses a release tag; `--pull` updates the checkouts first. |
| `check:ha-impact` | The same, plus a HIGH/MEDIUM/LOW report written by the Claude Code CLI into `reports/ha-impact/`. Run after pulling HA, or periodically. |

**HA-LCARS theme maintenance**

| Script | What |
|---|---|
| `lcars:regenerate` | The whole chain below, in order. Run when ha-lcars or our palette/token maths change. |
| `lcars:palette-scale[:write]` | Canon palette to HA's 11-stop scale (dry run, or patch `paletteInjector.js` and publish the review). |
| `lcars:semantic-tokens[:write]` | HA semantic tokens for the Picard profiles (dry run, or patch the ha-lcars theme YAML). |
| `lcars:generate-themes` | Compile the themes in the sibling `../ha-lcars` repo. |
| `lcars:export-vendored` / `lcars:export-all-themes` | Vendor the Picard themes and all ha-lcars themes into `yaml/theme/`. |

**Dev tools**

| Script | What |
|---|---|
| `help` | The script list. |
| `create-editor` | Scaffold a card editor. |
| `generate-brand-icon` | **Broken:** `scripts/generate-brand-icon.js` doesn't exist. |

---

## Tests

| Layer | Command | Runs where | Needs |
|---|---|---|---|
| Unit (node:test) | `npm test` | CI + local | nothing |
| A: browser components | `npm run test:browser` | CI + local | `npm run build` |
| B: visual baselines | `npm run test:visual` | local | `npm run build` |
| C: real HA | `npm run test:ha` | local | `npm run build`, dev HA at `localhost:8123`, `.ha-token` |
| Docs site | `npm run test:docs` | CI + local | `npm run docs:build` |

Run one node test file: `node --import ./tests/setup/browser-shims.js --import ./tests/setup/vite-imports.js --test <file>`. Every fix gets a test in the right layer.

---

## Docs site

- VitePress in `doc/`, deployed by the Docs workflow. Nav and sidebars are in `doc/.vitepress/config.mts`; the Releases sidebar and the home page's "What's new" button come from the release pages' frontmatter.
- Build gates: no em dashes; YAML examples schema-valid (strict); no dead links; no missing `#anchors` (VitePress slugs turn `_` into `-`).
- Live demos (` ```yaml live `) mount the real cards from the last build; see `CLAUDE.md`.

---

## Other maintenance

- **HA compatibility:** after HA releases, run `npm run check:ha-impact:quick -- --pull` (or the full version), work through `reports/ha-impact/`, and delete each report once resolved.
- **Session handoffs:** `reports/handoffs/index.md` lists planned sessions and the backlog.

---

## Gotchas

- **Hard refresh** HA after every build, or the old stub 404s the deleted chunks.
- **Docs deploy from both branches:** whichever was pushed last is live.
- **Personal data in pictures:** the dev HA's entities and dashboards carry real names. Shots use `lcards_test_*` helpers; check every image before committing.
- **No em dashes** anywhere (docs, UI strings, commit messages).
- **CI checks out one commit** (shallow) except in Release (`fetch-depth: 0`). Tests that need git history must skip themselves when it's missing (see the `release:commits` test).
- **GitHub Actions versions:** every action runs on Node 24 (checkout v7, setup-node v7, github-script v9, action-gh-release v3, Pages actions v5/v6, as of 2026-10). When GitHub warns that an action targets a deprecated Node runtime, move to its next major after reading that major's breaking changes; don't force the old one with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`. Our own code is tested on Node 24 (`node-version: '24'`).
- **`ubuntu-latest`** moves to Ubuntu 26 from 2026-10-19. If Playwright's `install --with-deps` breaks there, pin `runs-on: ubuntu-24.04` until Playwright supports it.
- **`.gitignore`** has Visual Studio boilerplate (`[Rr]elease/`, `[Bb]in/`, ...); new folders with those names need a `!` exception.
