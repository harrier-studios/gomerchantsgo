/**
 * Build distributable artifacts for Foundry from `src/`:
 * - .zip  — required for `module.json` → `download` (in-app install / updates).
 * - .tar.gz — optional mirror for manual / non-Foundry distribution.
 * - `dist/module.json` — release manifest (same JSON that should live inside the zip).
 *
 * Optional URLs (for published releases):
 *   node tools/pack-dist.mjs --manifest https://.../module.json --download https://.../merchants-v0.1.0.zip
 *   FVTT_PACKAGE_MANIFEST / FVTT_PACKAGE_DOWNLOAD env vars work the same way.
 *
 * Zip is built with `archiver` (see package.json devDependencies). Tarball uses `tar` on PATH.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import archiver from "archiver";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src");

function parseReleaseUrls() {
  const out = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--manifest") out.manifest = args[++i];
    else if (args[i] === "--download") out.download = args[++i];
  }
  if (process.env.FVTT_PACKAGE_MANIFEST) out.manifest = process.env.FVTT_PACKAGE_MANIFEST;
  if (process.env.FVTT_PACKAGE_DOWNLOAD) out.download = process.env.FVTT_PACKAGE_DOWNLOAD;
  return out;
}

/**
 * @param {object} base from src/module.json
 * @param {{ manifest?: string, download?: string }} release
 */
function mergeReleaseManifest(base, release) {
  const m = structuredClone(base);
  if (release.manifest) m.manifest = release.manifest;
  if (release.download) m.download = release.download;
  return m;
}

/**
 * @param {string} srcDir absolute path to folder whose contents become zip root
 * @param {string} outPath absolute path to .zip file
 */
async function zipDirectory(srcDir, outPath) {
  const output = createWriteStream(outPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    throw err;
  });
  archive.pipe(output);
  archive.directory(srcDir, false);
  await archive.finalize();
  await finished(output);
}

async function main() {
  const manifest = JSON.parse(readFileSync(join(srcRoot, "module.json"), "utf8"));
  const { id, version } = manifest;
  const releaseUrls = parseReleaseUrls();
  const releaseManifest = mergeReleaseManifest(manifest, releaseUrls);

  const outDir = join(root, "dist");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const staging = join(outDir, `.pack-staging-${version}`);
  try {
    rmSync(staging, { recursive: true, force: true });
    cpSync(srcRoot, staging, { recursive: true });
    writeFileSync(join(staging, "module.json"), `${JSON.stringify(releaseManifest, null, 2)}\n`, "utf8");

    const zipFile = join(outDir, `${id}-v${version}.zip`);
    const tarFile = join(outDir, `${id}-v${version}.tar.gz`);

    await zipDirectory(staging, zipFile);
    console.log(`Wrote ${zipFile}`);

    const tar = spawnSync("tar", ["-czf", tarFile, "."], {
      cwd: staging,
      stdio: "inherit",
    });
    if (tar.error) {
      console.error(tar.error.message);
      process.exit(1);
    }
    if (tar.status !== 0) {
      process.exit(tar.status ?? 1);
    }
    console.log(`Wrote ${tarFile}`);

    const distManifestPath = join(outDir, "module.json");
    writeFileSync(distManifestPath, `${JSON.stringify(releaseManifest, null, 2)}\n`, "utf8");
    console.log(`Wrote ${distManifestPath} (attach this + the zip to your release host)`);

    if (!releaseManifest.manifest || !releaseManifest.download) {
      console.log(
        "\nFoundry publishing: set `manifest` (URL to this JSON) and `download` (URL to the .zip) for each release.",
      );
      console.log(
        "  Pass --manifest / --download or FVTT_PACKAGE_MANIFEST / FVTT_PACKAGE_DOWNLOAD so the zip and dist/module.json include them.",
      );
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  console.log(
    "\nInstall: Foundry installs from the manifest’s `download` zip into Data/modules/<id>/. Manual install: unzip into Data/modules/merchants/ (folder name must match module id).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
