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

const main = async () => {
  process.stderr.write("Bundling project to read compositions…\n");
  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: enableTailwind,
    // Quiet, deterministic — we only want the metadata.
    onProgress: () => {},
  });

  const comps = await getCompositions(serveUrl);

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
