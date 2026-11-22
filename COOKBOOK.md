# LCARdS maintainer cookbook

How we build, test, release and publish LCARdS: the recipes first, then the reference. Internal (not on the docs site). Rules for writing code live in `CLAUDE.md` and `.claude/rules/` (path-scoped, loaded by Claude Code); this file is about running things.

**Contents:** [Daily loop](#daily-loop) · [Releases](#releases) · [CI workflows](#ci-workflows) · [npm scripts](#npm-scripts) · [Tests](#tests) · [Docs site](#docs-site) · [Other maintenance](#other-maintenance) · [Gotchas](#gotchas)

---

## Daily loop

| Step | Command | Notes |
|---|---|---|
| Build | `npm run build` | Always this one (runs every validator). Writes `custom_components/lcards/lcards.js` + `chunks/` + `.br`/`.gz`. |
| See it in HA | Ctrl+Shift+R in the browser | Hard refresh is required: the stub's old chunks are deleted on every build. |
| Unit tests | `npm test` | All `tests/**/*.test.js`, about 700 tests, under a minute. |
| Types | `npm run typecheck` | Zero TypeScript errors or it fails (also inside `npm run build`). |
| Browser tests | `npm run test:browser:changed` | After `npm run build`. Only the tests the changed files need; shared code runs the full suite. |
| All browser tests | `npm run test:browser` | About 15 minutes. CI runs it on every push and pull request. |
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
- **Two tiers:** the docs page is the full notes; the GitHub body (also Home Assistant's update dialog and HACS) is a slim export of it: intro, Before you update, the features named in the page's `highlights:` (without their `::: details` blocks), links to the rest and the reported-issue fixes. `npm run release:notes -- <version>` prints it, `--full` the whole page.
- **Writing rules:** `.claude/rules/releases.md`.

### Who does what

| Step | Who | How |
|---|---|---|
| Bump the version | you | `npm run bump-version:dev` / `npm run bump-version` |
| Write or update the notes, shot list and pictures | Claude | Ask: "update the release notes" (dev) or "promote the release" (stable). The project skill `lcards-release-notes` (`.claude/skills/`) holds the procedure. |
| Hand-tune wording, check pictures | you | Edit the page; look at every new image. |
| Commit, push, PR, merge | you | git |
| Publish | you | GitHub, then Actions, then Release, then Run workflow |

### Recipe: a dev release

1. **Bump, then build:** `npm run bump-version:dev`, then `npm run build`. The bump gives `2026.11.0-dev.1`, then `-dev.2` and so on. On a stable version it starts `-dev.1` on the next base. (An old-style suffix like `-dev3` becomes `-dev.1`.) The bump changes only `package.json`; the build copies the version into `custom_components/lcards/const.py` (`DOMAIN_VERSION`, full string) and `manifest.json` (HA CalVer without the suffix, so it only changes on a new base or a stable bump), and updates the bundle your dev HA loads.
2. **Notes:** ask Claude to "update the release notes for the dev build". Claude:
   - runs `npm run release:commits`;
   - creates the page (first dev build) or updates it;
   - verifies the claims in the code and writes in the house style;
   - adds shots and captures them (needs the dev HA, `.ha-token` and a fresh build);
   - sets `notes_through`;
   - runs the checks and reports what to hand-tune, with a commit message.
3. **Review:** read the page (`npm run docs:serve`, then `/releases/`) and every new picture. Preview the slim GitHub body: `npm run release:notes -- 2026.11.0-dev.1` (add `--full` for the whole page).
4. **Check:** `npm run build` and `npm test`.
5. **Commit and push `dev`:** one commit with `package.json`, `custom_components/lcards/const.py` (and `manifest.json` if it changed), the release page, and its pictures and shot list. The built bundle (`lcards.js`, `chunks/`) is gitignored and never committed.
6. **Wait for the Docs workflow** (Actions, then Docs) to finish. The GitHub body links pictures at `lcards.unimatrix01.ca/releases/<version>/`; a `dev` deploy publishes those picture folders at the site root too (`scripts/docs-deploy.mjs`), so they must be live first.
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
3. **Review**, then `npm run build` (copies the new version into `const.py` and `manifest.json`), `npm run plugin:tree` (the Claude plugin claude.ai reads from `main`) and `npm test` (it fails while `plugins/lcards/` is stale).
4. **Commit on `dev`** (`package.json`, `const.py`, `manifest.json`, `plugins/lcards/`, the release page and pictures), **push, open a PR from `dev` to `main`, merge.**
5. **Wait for the Docs workflow on `main`.**
6. **Publish:** Actions, then Release, then Run workflow, branch **main**. It stops before tagging if the page is missing (exit 2) or still `status: testing` (exit 3).
7. **Check the release on GitHub,** including the commit list's "Full Changelog" range. GitHub picks the previous tag itself and may compare against the last dev tag.
8. **Branch flow:** `dev` goes to `main` one way, by the release pull request; nothing needs merging back after a release (everything on `main` came from `dev`). Only when a change lands on `main` directly (a pull request from a branch cut off `main`, a hotfix, an edit on GitHub), merge `main` into `dev` right after it (`git merge origin/main`), not a cherry-pick: the branches then share `main`'s tip, so the next release pull request shows only `dev`'s new work.
9. **Next cycle:** the next `npm run bump-version:dev` starts a new version; the first "update the release notes" then creates its page. Right after a stable release, still in its month, name the next release so `dev` (and the `/dev/` docs) move ahead of stable: `npm run bump-version:dev -- 2026.12.0` gives `2026.12.0-dev.1` (without a target it would be `2026.11.1-dev.1`).

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
| `npm run release:notes -- <version>` | Prints the GitHub body exactly as the workflow makes it (the slim body for a page with `highlights:`; `--full` for the whole page). |
| `npm run release:shots -- <version> [name ...] [--gif]` | Captures pictures from the dev HA per the shot list. `--gif` adds GitHub GIFs for videos. Other shot lists: `--list <file> --out <dir>` (the card overview pictures: `doc/cards/shots/cards.yaml` into `doc/public/img/cards`). |
| `node scripts/release-notes.mjs import` | One-off backfill from GitHub (done 2026-10-12). Don't re-run with `--force`: it overwrites hand edits. |

---

## CI workflows

All in `.github/workflows/`.

| Workflow | Runs on | What it does |
|---|---|---|
| **Validate** (`validate-integration.yml`) | push to `dev`, PRs to `main`/`dev`, manual, nightly, and as the Release gate; **not on push to `main`** (the release PR already tested that tree, and Release runs Validate as its gate) | See the job list below. **Browser tests:** a push to `dev` runs the ones its changes need (the `test:browser:changed` picker, `--github-output`, against the last `dev` commit Validate passed on, so a cancelled run's changes are still covered); shared code runs them all. Pull requests (the release PR included), the Release gate, manual runs and a nightly run with new commits run them all. Either way they are split over 4 runners (Playwright `--shard`), about 5 minutes. A doc-only push runs no browser tests but still the node tests (several check `doc/` and `demo/`). Nightly: Hassfest and HACS always (the HACS check wants this workflow passing); the rest only when `main` has moved since the last scheduled run. A newer push to the same pull request or to `dev` cancels the older run (CodeQL too); manual, scheduled and Release runs always finish. A PR also lists the check runs of the `dev` push of its head commit, so a cancelled `dev` run shows red on the PR; `main` requires no status checks (only CodeQL code scanning), so it doesn't block. |
| **Docs** (`docs.yml`) | push to `main`/`dev` touching `doc/**`, `src/**`, `scripts/**`, the docs tests or the build config; PRs (no deploy); manual (optionally `archive_tag`); called by Release | Versioned site on `lcards.unimatrix01.ca`: `main` builds the root `/` (stable line), `dev` builds `/dev/`, a stable release builds `/v/<version>/` once (frozen). Each is `npm run docs:build` with its own `DOCS_BASE` (dead links, anchors, links escaping the base). **Site tests** (`npm run test:docs`: live demos, galleries, playgrounds; split over 3 runners) run on the release PR (`dev` into `main`), on a manual run of a branch, and on a push that changes the docs site itself (`doc/.vitepress/`, `tests/docs-site/`, `playwright.docs.config.js`, the demo environment in `tests/helpers/`); a failing test stops the deploy. Other pushes build and deploy (a card change shows on `/dev/` and is tested on the release PR). The deploy merges the build into the `gh-pages` branch (storage, one force-pushed commit) with `scripts/docs-deploy.mjs` (keeps the other channels, keeps root `/lcards/` card assets and `/releases/<version>/` pictures as a union (GitHub release bodies link pictures at the root), writes `versions.json`, prunes `/v/` to 8 versions), then publishes the whole tree. Pages source stays "GitHub Actions". Bootstrap: until a root exists on `gh-pages`, a `dev` push builds the root. About 5 minutes. |
| **Release** (`release.yml`) | manual only (Run workflow, pick the branch) | Validate gate, read the version from `package.json`, pre-release if the suffix is `-dev` or the branch isn't `main`, export the release page, tag, stamp `manifest.json`/`const.py`, `build:integration`, verify the output, zip (source maps only in a dev pre-release; a stable release builds with `LCARDS_SOURCEMAP=hidden`, so no file points at a map, and leaves the maps out: rebuild the tag locally to read a stable stack trace), package the JSON Schemas (`lcards-schema.json`, `lcards-schema.zip`) the standalone config checker (`lcards-validate.mjs`) and the Claude skill (`lcards-skill.zip`, plus `lcards-plugin.zip` for Claude Code), publish with the page as the body (plus a line linking those schema assets) and GitHub's commit list. A stable release then calls the Docs workflow to archive its docs at `/v/<version>/`. |
| **CodeQL** (`codeql.yml`) | push and PR to `main`/`dev`, Mondays, manual | Code scanning for JavaScript/TypeScript, Python and the workflows (default query suite, no build; `tests/` is skipped, since test code never ships). Results show on the pull request and under Security, Code scanning; the `main` and `dev` rulesets block a pull request with an error or a high/critical security alert. The rule also blocks direct pushes (it wants CodeQL results for a commit before it lands), so `dev`'s ruleset lets repository admins bypass it: the maintainer pushes straight to `dev`, the push is scanned afterwards, and contributors' pull requests are gated. Replaced GitHub's default setup (2026-11-20), which only scanned `main`; default setup must stay off, or the uploads are rejected. |
| **Pull request issue check** (`pr-issue-check.yml`) | pull requests opened, edited, reopened or marked ready (`pull_request_target`: it only reads the description, never checks out the pull request's code) | A pull request whose description links no issue (`#123`, `owner/repo#123` or an issue URL; a linked pull request doesn't count) gets a `needs-issue` label and one comment pointing to CONTRIBUTING.md. Owners, members, collaborators and bots are exempt; it never closes anything, and the label comes off once an issue is linked. |
| **Issue template check** (`issue-template-check.yml`) | issues opened, edited or reopened | Issues that skip the forms get a `needs-template` label and one comment. Owners and collaborators are exempt; it never closes anything. |

**Validate jobs** (all except Hassfest and HACS are skipped on a nightly run with no new commits on `main`):
- What to run (`changes`): whether the nightly run has new commits, and which browser tests (all, some, none).
- Hassfest and HACS validation (the routine HACS check; these run every night).
- CSS variable lint.
- Docs examples (strict), the schema description check, the em-dash check and the "Home Assistant" check: seconds. The docs site build and its tests are in the Docs workflow.
- **Tests and Typecheck:** `npm test`, `typecheck`.
- **Browser tests (1/4 to 4/4):** `build:integration`, then the component project's share of the picked tests (`--shard`); skipped when the picker picks none.
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
| `build` | every build | Doc examples (strict), schema descriptions, docs em dashes and bare "HA", CSS vars, HA compat, version sync, Vite build (minified, `.br`/`.gz`), asset copy, third-party notices. |
| `build:integration` | CI/release | Vite build, asset copy and third-party notices only. Never for dev. |
| `build:notices` | inside build | Writes `custom_components/lcards/THIRD_PARTY_NOTICES.txt` (gitignored like `lcards.js`, so it ships in `lcards.zip`): the `LICENSE` of every npm package in the build's sourcemaps, transitive ones included, plus the hand entries of `THIRD_PARTY_LICENSES` (ha-lcars, lcars, engage). Runs inside `build`, `build:integration` and `docs:bundle`; needs a build. The About page's library tables (`<LibraryTable />`, `doc/credits.md`) come from `scripts/data/third-party.json` with versions and licences from `node_modules`; `tests/docs/third-party.test.js` fails when `src/` imports a package without a row, a dependency is unused, or a licence outside MIT/ISC/BSD/Apache-2.0/0BSD has no override note (ApexCharts). |
| `set-version` | inside build | `package.json` version into `manifest.json` (HA CalVer, no suffix) and `const.py`. |
| `bump-version` | releasing | Strip `-dev.N` (promote), or advance SEQ (reset on a new month). |
| `bump-version:dev` | each dev build | Next `-dev.N`, or `-dev.1` on the next base. `-- 2026.12.0` starts that base's `-dev.1` (after a release, for the next month's). |
| `typecheck` | build, CI | Checks the generated element map is current, then `tsc`: zero errors or it fails. Runs inside `npm run build`. Rules and common fixes: `doc/development/typescript.md`. |
| `types:elements` | as needed | Regenerate `src/types/elements.generated.d.ts` (one `HTMLElementTagNameMap` entry per registered custom element) after adding or renaming one. |

**Validation** (all inside `build`)

| Script | What |
|---|---|
| `validate:doc-examples` / `:strict` | YAML examples in `doc/` against the card, view and MSD schemas (the list is `scripts/lib/card-schemas.js`); strict also fails on unknown keys. |
| `validate:config` | Check any LCARdS YAML (a card, a view, a whole dashboard, HA `.storage/lovelace*` JSON): `npm run validate:config -- <file> [--strict] [--json]`. Errors: schema, unknown keys, MSD without a canvas. Warnings: names that aren't built in (presets, animations, sounds, theme tokens...), legacy chart/data-grid format. Same checker as the doc examples (`scripts/lib/config-validator.js`). |
| `pictures:theme` | Save the dev Home Assistant's current theme (the one picked in its profile, colours only) to `scripts/data/picture-theme.json`. `astro:pictures` and the picker's astrometrics picture render in it, so they look the same on every re-render and don't depend on the harness theme. Pick the theme in the dev Home Assistant, run this, then the picture scripts. Needs the dev Home Assistant and its token (`.ha-token`). |
| `picker:pictures` | Render the pictures Home Assistant's card picker shows for the cards that can't preview live there (astrometrics, MSD, layout card, chart, alert overlay): `src/assets/images/picker/<name>.webp`, 768 x 432, copied into the integration by the build. `npm run picker:pictures [name ...]` (`-- --headed` to watch); the configs are in the script, astrometrics renders a Studio starter in the picture theme (`pictures:theme`). The list is `src/utils/picker-picture-names.js`; `tests/core/picker-pictures.test.js` fails on a missing or left-over picture. Needs a current build; look at every picture before committing it. |
| `astro:pictures` | Render the Astrometrics Studio's starter pictures (`src/assets/images/astro-studio/starter-<id>.webp`, copied into the integration by the build) on the browser harness with a pinned date and seed, in the picture theme (`pictures:theme`; `-- --no-theme` for the harness default): `npm run astro:pictures [id ...]` (`-- --headed` to watch). Run it after adding or changing a starter (`tests/editor/astro-starter-pictures.test.js` fails on a missing or left-over picture); a part's framing comes from its coordinates, or from the scene it is made for (`scene`) and its `picture` (camera, backdrop). Needs a current build; look at every picture before committing it. |
| `gallery:shots` | Record every `doc/gallery/dashboards/*.yaml` on the dev HA into `doc/public/gallery/`: a still (`.webp`, the video's poster) and, with `--video`, a looping `.webm` of the state changes listed in `doc/gallery/motion/<name>.yaml` (`--motion=<file>` for another list; `tests/docs/dashboard-gallery.test.js` keeps them to `lcards_test_*` helpers). Each run checks the file, writes it to the hidden `lcards-gallery` dashboard, sets the `lcards_test_*` helpers to sample values and crops to the view (hiding the HA-LCARS theme's toolbar elbow, whose curve would leave a grey corner top left). Any file: `node scripts/dashboard-shots.mjs <file.yaml> --out=<dir> [--keep]`, the loop for building a dashboard and seeing it. `--action=lcards.red_alert` runs an action before the shot and captures the whole viewport (alert overlay picture: `doc/cards/shots/alert-overlay-dashboard.yaml`), `--name=<out>` names the file, `--mp4` (with `--max-width=<px>`) writes H.264 instead of WebM; motion steps can also fake a state (`state`) and mark caption cues (`mark`, saved as `<name>.marks.json`). Needs `.ha-token` and a current build; look at every image before committing it. |
| `demo:push` | Build the two demo boards on the dev HA from the tracked views: `lcards-demo` (dev: every view, plus checks and benchmarks) and `lcards-demo-public` (the views marked `public: true`). One file per feature in `demo/views/` (content only, LCARdS cards only); `demo/order.yaml` holds the topic tree (topic > named groups > views, the order of the index, the boards' tabs and the docs Live Demo menu) and, by release, each view's summary, description, session, docs path and `public` and `heavy` flags (`heavy`: the docs Live Demo shows a Load button instead of mounting it); an entry `file: gallery/<name>` shows a dashboard gallery file (`doc/gallery/dashboards/<name>.yaml`, its one view, as `dashboard-<name>`) without a copy, with optional `title` and `max_width` (a phone layout at its width), from which `scripts/lib/demo-dashboard.js` generates every view's header (elbow title bar, description, Docs button) and each board's index. The boards accumulate every release (no version in their names; old views stay valid through the test). Every push checks each view and both assembled boards with the config checker (errors stop it, `--force` overrides) and saves each board whole. `--board=dev\|public` pushes one, `--check` opens every view (`--check=<path>` one) logged in with the token and saves `tmp/demo/<board>/<path>.png`, `--dry-run` validates without Home Assistant. The docs page `getting-started/live-demo` (`DemoBoard.vue`, data from `demo.data.js`) shows every release's public views by topic (the `topics` in `order.yaml`, an LCARS side menu) with a **Show** release filter (each release's views; the release the docs build documents, `package.json` without `-dev.N`, is marked New); each `/v/<version>/` keeps the views up to its release on its own bundle; `tests/docs-site/demo-board.spec.js` mounts every one. `tests/docs/demo-dashboard.test.js` runs the offline checks. Every feature session adds or updates its view here. Needs `.ha-token` and a current build. |
| `video:hero` | The docs home page hero (`doc/public/gallery/hero.webm`/`.mp4`/`.webp`, played by `doc/.vitepress/theme/HomeShowcase.vue`): a looping tour of gallery sample screens joined by left wipes, the last wiping back into the first frame. Records each dashboard in `SEGMENTS` (`scripts/hero-video.mjs`) with its own gallery motion file as H.264 into `tmp/hero/`, then cuts and encodes once (VP9 CRF 34, H.264 CRF 24). While recording it sets the token user's profile theme to the gallery's (`THEME`, Picard Blue Accent: samples coloured by theme roles, such as sciences, follow it) and puts the user's own back afterwards. `--record-missing` records only dashboards without a take; `node scripts/hero-video.mjs` alone re-cuts the last takes. Edit `SEGMENTS` (dashboard, start, length) to change the tour. Needs `.ha-token` and a current build; watch the result before committing. |
| `video:showcase` | The showcase video: `doc/gallery/showcase/showcase.yaml` builds itself stage by stage on the dev HA (its cards wait on `input_number.lcards_test_stage` and enter with `on_show`), comes alive, then a red alert, played by `showcase.motion.yaml`. Records a 1920x1080 take into `tmp/marketing/`, then cuts an uncaptioned clip (`doc/public/gallery/showcase.webm`/`.mp4`/`.webp`; the docs hero was this until 2026-11-20, now `video:hero`), a captioned 1080p social cut with LCARS title and end cards (`tmp/marketing/showcase-social.mp4`, add music yourself) and a captioned release clip (`showcase-release.mp4`). Captions come from the motion file's `mark` steps. Reads real dev-HA sensors (only those `tests/docs/showcase.test.js` lists) and changes them only with `state` steps: fake states that never reach a device and are put back afterwards (the recorder keeps them). `node scripts/marketing-video.mjs` without `--record` re-cuts the last take. Needs `.ha-token` and a current build; watch every output before using it. |
| `validate:schema-descriptions` | Fails on schema properties added without a `description`; the known backlog is `scripts/schema-description-baseline.txt`. After filling some: `npm run validate:schema-descriptions:update`. |
| `validate:css-vars` / `:verbose` | Every `--lcars-*`, `--lcards-*` and `theme:` reference is registered. |
| `validate:ha-compat` | No HA elements, attributes, CSS hooks or imports that are dead in the minimum HA. |

**Tests**

| Script | What |
|---|---|
| `test` | Every node:test suite. |
| `test:routing`, `test:data-grid` | One suite. |
| `test:browser` | Layer A, Playwright: fixture cards on the built bundle, fake hass (CI). |
| `test:browser:changed` | Layer A, only what the files changed since `origin/dev` (committed, uncommitted, new) need: each card's own spec files and its `cards.spec.js` tests, plus the size budget. Shared code (`src/base`, `src/core`, `src/utils`, the button, the editor's shared components, the build config, the harness) and any file the map doesn't know run the full suite. The map is `scripts/lib/browser-test-select.js` (guarded by `tests/core/browser-test-select.test.js`). `-- --dry-run` shows the pick, `-- --base <ref>` compares with another ref, `-- --all` runs everything; other arguments go to Playwright (`--workers=2`, `--reporter=dot`). |
| `test:visual` | Layer B: screenshot baselines (local; `-- --update-snapshots` after an intended change). |
| `test:ha` | Layer C: smoke tests on the dev HA (local; `.ha-token`). |
| `test:docs` | Live demos, galleries, playgrounds and labs on the built docs site (after `docs:build`). With `CI` set it skips the `@gpu` tests (the astrometrics pages after the first and the astrometrics demo view: CI has no GPU and draws WebGL on the CPU); run them all locally before a push. The tests ask the preview server for uncompressed files (`vitepress preview` brotli-compresses each response at full quality, about 4 s for the main chunk). |

**Docs**

| Script | What |
|---|---|
| `docs:build` | LLM schema, bundle copy for demos, VitePress build (fails on dead links), anchor check. |
| `docs:serve` / `docs:serve:network` | Regenerate the schemas, then the dev server (`--host` for other devices on the LAN). |
| `docs:preview` | Serve the built site. |
| `docs:bundle` | Build the card bundle and its third-party notices and copy them into `doc/public/lcards/` (inside `docs:build`; the About page links the notices). |
| `docs:llms-txt` | Writes `llms.txt` (links to every page plus the schemas and checker) and `llms-full.txt` (user docs in one file) into the built site under `DOCS_BASE` (inside `docs:build`). A page whose summary reads badly there gets a frontmatter `description:`. |
| `docs:check-anchors` | Links to missing `#anchors` (inside `docs:build`). |
| `docs:routing-diagrams` | Regenerate the MSD routing diagrams. |
| `docs:astro-starters` | Regenerate the starter list on `doc/cards/astrometrics/starters.md` (every astrometrics starter, its settings and default YAML as a live card) from `src/core/astrometrics/starters/`. Run after changing a starter; `--check` exits 1 if stale, and `tests/docs/astro-starters-doc.test.js` fails on drift. |
| `plugin:tree` | Write the unpacked plugin into `plugins/lcards/` (the same files as `lcards-plugin.zip`, built for the stable docs channel, dated from the last commit), the folder the repo-root marketplace serves from `main`. Run it in the release steps after the stable bump, and again after any later change in the release pull request. `tests/docs/user-skill.test.js` fails on a stable version when the folder is stale (dev versions keep the last stable build). Generated: never edit by hand; CodeQL skips it. `claude plugin validate .` checks the marketplace. |
| `build:skill` | Package the user-facing Claude skill: `skills/lcards/SKILL.md` plus generated references (schemas, registries, the user docs as markdown, the gallery, HA-LCARS and UIX from their snapshots, see `sync:ha-lcars`), the checker and the starter tool (`scripts/lcards-starter.mjs`, bundled by `build-validator.js --entry=`: astrometrics starters as card YAML, settings linked to entities), as `doc/public/tools/lcards-skill.zip` (inside `docs:build`). The same tree is packaged as a Claude Code plugin (`doc/public/tools/lcards-plugin.zip`, `.claude-plugin/plugin.json` with the `package.json` version, so users get one update per version) and `doc/public/marketplace.json`, whose `archive` entry points at the channel's own zip: the docs site serves marketplace `lcards` at `/marketplace.json`, `lcards-dev` at `/dev/marketplace.json` and `lcards-<version>` under `/v/<version>/` (named from `DOCS_BASE`). The plugin also carries `skills/lcards/plugin/`: `hooks/` (a PostToolUse hook that runs the checker on any LCARdS YAML file Claude writes; errors block, warnings come back as context) and `commands/` (`/lcards:check`, `/lcards:dashboard`). The Release workflow attaches `lcards-skill.zip` and `lcards-plugin.zip`. To try the plugin locally: `claude plugin validate doc/public/marketplace.json`, then `claude --plugin-dir <unzipped lcards-plugin.zip>`. The repo root is a git marketplace too (`.claude-plugin/marketplace.json`, hand-written, source `./plugins/lcards`): claude.ai (Plugins, Add, Marketplace, Repository) and Claude Code add it as `snootched/lcards`, reading `main`. See `plugin:tree`. Edit the instructions in `skills/lcards/SKILL.md`; `tests/docs/user-skill.test.js` checks every path it mentions exists in the package. |
| `sync:ha-lcars` | Snapshot HA-LCARS into `scripts/data/ha-lcars/` (`snapshot.json`: palette, role variables with defaults and descriptions, themes, every `--lcars-*` name, helper entities; `guide.md`: the README from installation to known issues). Reads `../ha-lcars` (`--repo=<dir>`), else GitHub (`--remote`). The output is committed so builds and tests stay offline; the skill renders `references/ha-lcars/` from it and the checker warns on near-miss `var(--lcars-...)` names from it. Run after HA-LCARS changes; `--check` exits 1 if the snapshot is stale. |
| `sync:satellites` | Snapshot the mean orbital elements of the astrometrics card's built-in Earth satellites (ISS, Tiangong, Hubble, eight geostationary weather satellites, the GPS and Galileo constellations) from CelesTrak into `src/core/astrometrics/satellite-data.json`. Committed: the card never downloads orbital data. One request per data set, and it stops at the first non-200 answer (CelesTrak's usage policy: no retries). Run before a release so low orbits (the ISS) start fresh; `--check` prints the snapshot's age and exits 1 past 120 days. |
| `sync:uix` | Snapshot the UIX styling docs pages the skill ships (`references/uix/`) into `scripts/data/uix/`, MkDocs syntax and images removed. Reads `../uix` (`--repo=<dir>`), else a shallow clone. Committed; run after UIX releases; `--check` exits 1 if stale. Each page keeps a CC BY 4.0 attribution line. |
| `eval:skill` | Run the plugin's eval suite (`skills/lcards/plugin/evals/`, one directory per case: `prompt.md` plus `graders/`) with `claude plugin eval`, each case also run without the plugin so the report shows what the plugin adds (`Δ`). Builds the plugin into a temp dir (the suite is not shipped in the zip), grants Write/Edit and `Bash(node *)` for the checker, 2 runs per arm; extra arguments go to `claude plugin eval` (`--case 'ha-lcars-*'`, `--runs 1`, `--ablation none`). Local only, it costs tokens (about $2 for the whole suite at `--runs 1`); run it after changing `SKILL.md`, the references or the hook. Graders are regex over the YAML file or reply, `tool_used` (skill fired, checker ran) and short LLM rubrics. |
| `build:validator` | Bundle that checker into one standalone file anyone can run with Node 20+ (`doc/public/tools/lcards-validate.mjs`, served at `/tools/`; inside `docs:build`). The Release workflow attaches it as `lcards-validate.mjs`. The licence notices of the packages inlined into it (ajv, js-yaml, yaml and their dependencies) are a comment under its shebang. |
| `generate:llm-schema` | Regenerate the published schemas (gitignored): `doc/public/lcards-schema.json` (everything, MSD included) and `doc/public/schema/` (`index.json`, one file per card/view/strategy, `shared/` for rules, animations, background animations, state colours, filters). Inside `docs:build` and `docs:serve`; the Release workflow attaches them as `lcards-schema.json` and `lcards-schema.zip`. |

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
| A: browser components | `npm run test:browser` (local: `test:browser:changed`) | CI + local | `npm run build` |
| B: visual baselines | `npm run test:visual` | local | `npm run build` |
| C: real HA | `npm run test:ha` | local | `npm run build`, dev HA at `localhost:8123`, `.ha-token` |
| Docs site | `npm run test:docs` | CI (without `@gpu` tests) + local (all) | `npm run docs:build` |

**Editor and studio round trips** (`tests/browser/editor-roundtrip.spec.js`, `studio-roundtrip.spec.js`, helpers in `support-roundtrip.js`; about 9 minutes in all. `test:browser:changed` runs a card's own fixtures here when that card's files change, and all of them when shared code changes): every fixture opens in its card editor (and, for chart, data grid, MSD, layout and a spread of astrometrics fixtures, its studio), every tab and section is visited, and each control is set to the value it shows. No key of the config may vanish or change, and a studio's Save must return it intact. Dropdowns and booleans are skipped (Home Assistant's never fire for their current value); a few equivalent forms are allowed by name in each spec. A failure names the tab and control. Add a fixture to cover a new option.

Run one node test file: `node --no-maglev --import ./tests/setup/browser-shims.js --import ./tests/setup/vite-imports.js --test <file>`. Keep `--no-maglev` on node scripts that run the config checker (tests, `validate-doc-examples`, `validate:config`): V8's Maglev compiler otherwise spends up to 10 GB optimising ajv's generated validators. Every fix gets a test in the right layer.

---

## Docs site

- VitePress in `doc/`, deployed by the Docs workflow. Nav and sidebars are in `doc/.vitepress/config.mts`; the Releases sidebar and the home page's "What's new" button come from the release pages' frontmatter.
- Build gates: no em dashes; "Home Assistant" in full, never bare "HA" (HA-LCARS stays); YAML examples schema-valid (strict); no dead links; no missing `#anchors` (VitePress slugs turn `_` into `-`).
- Live demos (` ```yaml live `) mount the real cards from the last build; see `CLAUDE.md`.

---

## Other maintenance

- **HA compatibility:** after HA releases, run `npm run check:ha-impact:quick -- --pull` (or the full version), work through `reports/ha-impact/`, and delete each report once resolved.
- **anime.js skill:** `.claude/skills/animejs/` is a vendored community skill (upstream, commit and local patches in its `references/UPSTREAM.md`) with an LCARdS rules section on top. After bumping `animejs`, run `tests/core/animejs-skill.test.js` (in `npm test`): it fails if the skill teaches a name the installed version no longer exports, or a removed string ease.
- **HA frontend skills:** the `ha-frontend-*` skills come from `../frontend/.agents/skills/` and load in LCARdS sessions; `.claude/skills/lcards-ha-frontend/` maps each one to follow / translate / ignore. When `check:ha-impact` lists changes under `.agents/skills/`, re-check the matching rows. `tests/core/ha-frontend-skill.test.js` fails when an upstream skill has no row (skipped without the checkout).
- **Built-in models:** ships and starbases are made in code (`scripts/make-starbases.mjs`, `scripts/make-ships.mjs`) and written to `src/assets/models/`; `node scripts/render-model.mjs <glb> <outdir>` renders one from fixed angles for comparison with reference stills. Method and lessons: `.claude/skills/lcards-models/`. `node scripts/make-msd-lineart.mjs` draws the line-art MSD backgrounds (`src/assets/msd/*-lineart.svg`) from those models: outline from a per-part flat render, creases, a cutaway drawn in code, named anchors at the parts.
- **Session handoffs:** `reports/handoffs/index.md` lists planned sessions and the backlog.

---

## Gotchas

- **Hard refresh** HA after every build, or the old stub 404s the deleted chunks.
- **Docs channels:** the root is `main`, `/dev/` is `dev`, `/v/<version>/` is frozen per stable release (switcher next to the site title, banner on non-root channels). A root-absolute path in a docs component or raw HTML link (`/credits`, `/lcards/...`) escapes the channel: use `withBase()` or `import.meta.env.BASE_URL` (`npm run docs:check-base` catches it in built HTML). The card bundle's own `/lcards/` asset paths are expected to escape; the deploy keeps them at the root. Build a channel locally with `DOCS_BASE=/dev/ npm run docs:build && DOCS_BASE=/dev/ npm run test:docs`.
- **Personal data in pictures:** the dev HA's entities and dashboards carry real names. Shots use `lcards_test_*` helpers; check every image before committing.
- **No em dashes** anywhere (docs, UI strings, commit messages).
- **"Home Assistant" in full** in docs, UI strings, schema descriptions and `services.yaml` (`scripts/check-doc-ha-name.js`, `tests/docs/home-assistant-name.test.js`).
- **CI checks out one commit** (shallow) except in Release (`fetch-depth: 0`). Tests that need git history must skip themselves when it's missing (see the `release:commits` test).
- **GitHub Actions versions:** every action runs on Node 24 (checkout v7, setup-node v7, github-script v9, action-gh-release v3, Pages actions v5/v6, upload-artifact v7, download-artifact v8, as of 2026-10). When GitHub warns that an action targets a deprecated Node runtime, move to its next major after reading that major's breaking changes; don't force the old one with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`. Our own code is tested on Node 24 (`node-version: '24'`).
- **`ubuntu-latest`** moves to Ubuntu 26 from 2026-10-19. If Playwright's `install --with-deps` breaks there, pin `runs-on: ubuntu-24.04` until Playwright supports it.
- **`.gitignore`** has Visual Studio boilerplate (`[Rr]elease/`, `[Bb]in/`, ...); new folders with those names need a `!` exception.
