# Docs — Local Development

The LCARdS documentation site is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).
Source files live in `doc/` (the existing docs folder in the repo root).

## Prerequisites

Python 3.x required. Install the docs dependencies:

```bash
pip install mkdocs-material mkdocs-glightbox mkdocs-git-revision-date-localized-plugin
```

Or use a virtual environment (recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install mkdocs-material mkdocs-glightbox mkdocs-git-revision-date-localized-plugin
```

## Preview locally

```bash
cd docs
mkdocs serve
```

The site will be available at **http://localhost:8000** with live reload on file changes.
Edit any file in `doc/` and the browser refreshes automatically.

## Build without serving

```bash
cd docs
mkdocs build
```

Output goes to `docs/site/` (gitignored).

## Deploy

Deployment is automatic via GitHub Actions on push to `msd-globalisation` when files in `doc/` or `docs/` change.
PRs targeting `msd-globalisation` trigger a build-only check (no deployment) to catch errors early.
