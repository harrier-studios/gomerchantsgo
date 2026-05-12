# merchants

Foundry VTT **v13** module for actor-based merchant shops. Implementable sources live under **`src/`**; packaging tooling lives at the repo root.

## Repository layout

| Path | Purpose |
|------|---------|
| [`src/`](src/) | **Installable module** — `module.json`, `scripts/`, `templates/`, `styles/`, `lang/`, and [`src/README.md`](src/README.md) (Foundry-focused docs). |
| [`tools/`](tools/) | Build / packaging helpers (not loaded by Foundry). |
| [`dist/`](dist/) | Generated release archives (gitignored). |
| [`project/docs/`](project/docs/) | Planning and other project docs. |

## Developing against Foundry

Point Foundry at this folder:

- **Symlink** (recommended): `Data/modules/merchants` → the **`src`** directory in this repo (not the repo root), so `module.json` lives at `Data/modules/merchants/module.json`.

Module behavior and UI are documented for GMs/players in [`src/README.md`](src/README.md).

## Distribution tarball

Releases should be built from **`src/`** so the archive root matches Foundry’s expected module layout (`module.json` at the top of the extracted folder).

### Scripted pack (Windows, Linux, macOS)

Requires [Node.js](https://nodejs.org/) and `tar` on your `PATH` (included on Windows 10+).

```bash
npm run pack
```

Writes `dist/<id>-v<version>.tar.gz` (values read from `src/module.json`). Equivalent:

```bash
node tools/pack-dist.mjs
```

Extract the archive **into** `Data/modules/merchants/` (folder name must match the module `id`).

### One-liner without Node

From the **repository root**:

```bash
mkdir -p dist
tar -czf dist/merchants-v0.1.0.tar.gz -C src .
```

Replace `0.1.0` with the `version` field in `src/module.json`.

### From git only (tracked `src/` tree)

Creates an archive of the `src` tree at `HEAD` (paths inside the tarball match Foundry’s layout):

```bash
mkdir -p dist
git archive --format=tar.gz -o dist/merchants-from-git.tar.gz HEAD:src
```

Uncommitted files under `src/` are not included until committed.
