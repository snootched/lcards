# Contributing to LCARdS

Thanks for wanting to help. LCARdS is a hobby project, and most people who use it aren't developers. That's fine: you don't need to write code to contribute, and if you do send code, an AI assistant is welcome to help you.

## Ways to help

- **Report a bug:** [open a bug report](https://github.com/snootched/LCARdS/issues/new/choose). The form walks you through it. The LCARdS panel in Home Assistant (Welcome, Support & system info, Report an issue) fills in your versions for you.
- **Suggest a feature or improvement:** open a feature request and describe what you want to do. You don't need to know how it would be built.
- **Ask a question or share a dashboard:** use [Discussions](https://github.com/snootched/LCARdS/discussions).
- **Fix something yourself:** send a pull request (PR), as described below.

## Start with an issue

Every pull request should point to an issue that describes the bug or the feature. The issue is where we agree on what the problem is before anyone looks at code, and it's where users who hit the same problem find the answer later.

- Open the issue first, or find an existing one.
- In your pull request, write `Fixes #123` (the issue's number).
- If you open a pull request without an issue, we'll ask you to open one. Your pull request stays open meanwhile.

## Using AI

AI assistants are welcome, and you don't have to say whether you used one. What we ask is that you can explain, in your own words:

- what the problem is, as you saw it in your Home Assistant, and
- how your change fixes it.

We may ask questions on the pull request. Answer them yourself, even briefly; pasting another long AI answer doesn't help us understand what you saw.

If you use an AI coding assistant, point it at the [instructions for AI assistants](#instructions-for-ai-assistants) below. They tell it what this project needs, so you don't have to.

## What a pull request needs

1. **A linked issue** (see above).
2. **One change.** A fix and an unrelated tidy-up are two pull requests.
3. **The `dev` branch** as its target, never `main`.
4. **A test**, and proof that it fails without your change and passes with it (paste both results).
5. **A screenshot or short video** if the change is something you can see.
6. **The checks passing** before you open it: `npm run build`, `npm test` and `npm run test:browser:changed`. The same checks, with every browser test, run again on the pull request, and their results show at the bottom of it.

Clean, consistent code matters here, so a reviewer may ask for changes. Sometimes it's quicker for the maintainer to make the change directly; your pull request is then closed with credit to you in the commit and the release notes.

## Setting up

You need [Node.js](https://nodejs.org/) 24 and Git.

```bash
git clone https://github.com/<your-account>/LCARdS.git
cd LCARdS
git checkout dev
npm ci
npm run build          # builds custom_components/lcards/lcards.js and runs every validator
npm test               # the fast tests (Node)
```

The browser tests render the cards in a real browser. `npm run test:browser:changed` runs only the ones your change needs (a few minutes for one card; everything when you change shared code), and `npm run test:browser` runs all of them (around 15 minutes). They need Chromium: run `npx playwright install chromium` once, or set `CHROMIUM_PATH` to one you have. Run `npm run build` before them, because they test the built bundle.

To try your build in Home Assistant, copy `custom_components/lcards/` into your Home Assistant `config/custom_components/` folder, restart Home Assistant, and hard-refresh the browser (Ctrl+Shift+R).

## Instructions for AI assistants

If you are an AI coding assistant working on LCARdS for someone, follow these steps. The person you work for may not be a developer, so do the technical work for them and explain it in plain words.

1. **Read the project rules first.** [`CLAUDE.md`](CLAUDE.md) and the files in [`.claude/rules/`](.claude/rules/) describe the architecture and the patterns this codebase requires. They apply to every assistant, not only Claude. Follow them over your general habits; for example, never use `console.log` (use `lcardsLog`), and never use em dashes in text users see.
2. **Make sure there is an issue.** Ask the person for the issue number. If there isn't one, help them write one (what they did, what they expected, what happened, their card YAML) and ask them to open it before you open the pull request.
3. **Branch from `dev`** and keep the change as small as the issue allows. Reuse what the code already has; don't add new options, files or abstractions the issue doesn't need.
4. **Find the cause before you fix it.** Trace the problem in the code and say where it comes from. Don't guess.
5. **Write a test that fails without the fix.** Use the existing suites: a Node test in `tests/` where the logic can be tested on its own, a browser test in `tests/browser/` for rendering and behaviour (run `npm run build` first; browser tests use the built bundle). Run it without your change and confirm it fails *for the reason in the issue*, not because of something the test setup lacks. Then run it with your change.
6. **Run every check locally before you open the pull request:** `npm run build`, `npm test` and `npm run test:browser:changed` (install Chromium with `npx playwright install chromium` if it is missing). It picks the browser tests the change needs, and the whole suite when shared code changed; don't narrow it further by hand. Run it as `npm run test:browser:changed -- --reporter=dot` and read only the summary and any failures (they still print in full); the default prints a line per test. All must pass. Don't rely on the pull request's checks to find failures; they repeat these, they don't replace them. Put the results in the pull request description.
7. **Don't change** GitHub workflows, version numbers, release notes (`doc/releases/`) or generated files (`schema/`, the built bundle). If you change a config option, follow the steps in `.claude/skills/lcards-card-option/SKILL.md` (schema, editor, docs and tests together).
8. **Write the pull request description** with the template. Keep it short and accurate. Claim only what you or the person actually checked: if nobody tested it in a real Home Assistant, say so. Don't fill it with summaries of every file.
9. **Explain the change to the person** in plain words, so they can answer questions about it on the pull request.

## Be kind

Everyone here is a volunteer, and many are new to GitHub. Be patient and friendly, in issues, pull requests and Discussions alike.
