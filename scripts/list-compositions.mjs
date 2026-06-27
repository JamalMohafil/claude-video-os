// Enumerates every composition in the project and writes a JSON manifest the
// dashboard reads. This is how the Video OS "watches the project": run it again
// after Claude edits a video and the manifest reflects the new reality.
//
//   pnpm compositions          # writes out/compositions.json
//
// Uses Remotion's own getCompositions(), so durations/dimensions are exactly
// what Studio and renders use — no brittle source parsing.

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { getCompositions } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = path.join(root, "src", "index.ts");
const outFile = path.join(root, "out", "compositions.json");

const ASPECT = (w, h) => {
  if (w === h) return "square";
  return w > h ? "landscape" : "portrait";
};

// Per-composition "date" = the most recent mtime of the source that defines it,
// so newly created/edited videos sort to the top. We gather source "units"
// (each composition folder, each component file, and Root.tsx) with their
// mtime + text, then match a composition to the units whose text mentions its
// id (`"<id>"`).
const collectSourceUnits = () => {
  const units = [];
  const addFile = (p) => {
    try {
      units.push({ mtime: fs.statSync(p).mtimeMs, text: fs.readFileSync(p, "utf8") });
    } catch {
      /* ignore */
    }
  };
  const folderUnit = (dir) => {
    let mtime = 0;
    let text = "";
    const walk = (d) => {
      let entries;
      try {
        entries = fs.readdirSync(d, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(tsx?|jsx?)$/.test(e.name)) {
          try {
            mtime = Math.max(mtime, fs.statSync(p).mtimeMs);
            text += fs.readFileSync(p, "utf8");
          } catch {
            /* ignore */
          }
        }
      }
    };
    walk(dir);
    if (mtime) units.push({ mtime, text });
  };

  const compRoot = path.join(root, "src", "compositions");
  try {
    for (const e of fs.readdirSync(compRoot, { withFileTypes: true })) {
      if (e.isDirectory()) folderUnit(path.join(compRoot, e.name));
    }
  } catch {
    /* ignore */
  }
  const componentsDir = path.join(root, "src", "components");
  try {
    for (const e of fs.readdirSync(componentsDir, { withFileTypes: true })) {
      if (e.isFile() && /\.tsx?$/.test(e.name)) addFile(path.join(componentsDir, e.name));
    }
  } catch {
    /* ignore */
  }
  addFile(path.join(root, "src", "Root.tsx"));
  return units;
};

const modifiedAtFor = (units, id, fallback) => {
  const needle = `"${id}"`;
  let best = 0;
  for (const u of units) if (u.text.includes(needle)) best = Math.max(best, u.mtime);
  return Math.round(best || fallback);
};

const main = async () => {
  process.stderr.write("Bundling project to read compositions…\n");
  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: enableTailwind,
    // Quiet, deterministic — we only want the metadata.
    onProgress: () => {},
  });

  const comps = await getCompositions(serveUrl);

  const units = collectSourceUnits();
  const now = Date.now();

  const manifest = {
    generatedAt: new Date().toISOString(),
    count: comps.length,
    compositions: comps.map((c) => ({
      id: c.id,
      width: c.width,
      height: c.height,
      fps: c.fps,
      durationInFrames: c.durationInFrames,
      durationInSeconds: Number((c.durationInFrames / c.fps).toFixed(2)),
      aspect: ASPECT(c.width, c.height),
      modifiedAt: modifiedAtFor(units, c.id, now),
    })),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
  process.stderr.write(`Wrote ${manifest.count} compositions → ${outFile}\n`);
  // Also emit to stdout so callers can pipe it.
  process.stdout.write(JSON.stringify(manifest));
};

main().catch((err) => {
  process.stderr.write(`Failed to list compositions: ${err?.stack || err}\n`);
  process.exit(1);
});
