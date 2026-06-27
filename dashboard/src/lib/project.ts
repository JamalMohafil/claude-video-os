// Bridges the dashboard to the parent Remotion project. The dashboard lives at
// <project>/dashboard, so the project root is one level up (override with
// VIDEO_OS_PROJECT_ROOT). Everything here runs server-side only.

import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export type Composition = {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  durationInSeconds: number;
  aspect: "portrait" | "landscape" | "square";
};

export type Manifest = {
  generatedAt: string;
  count: number;
  compositions: Composition[];
};

export const projectRoot = (): string =>
  process.env.VIDEO_OS_PROJECT_ROOT
    ? path.resolve(process.env.VIDEO_OS_PROJECT_ROOT)
    : path.resolve(process.cwd(), "..");

export const outDir = () => path.join(projectRoot(), "out");
export const thumbsDir = () => path.join(outDir(), "thumbs");
export const manifestPath = () => path.join(outDir(), "compositions.json");

export const readManifest = (): Manifest | null => {
  try {
    const raw = fs.readFileSync(manifestPath(), "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
};

// Run a pnpm script in the project root and resolve with {code, out, err}.
export const runPnpm = (
  args: string[],
  onChunk?: (chunk: string) => void,
): Promise<{ code: number | null; out: string; err: string }> =>
  new Promise((resolve) => {
    const child = spawn("pnpm", args, {
      cwd: projectRoot(),
      env: process.env,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      const s = d.toString();
      out += s;
      onChunk?.(s);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString();
      err += s;
      onChunk?.(s);
    });
    child.on("close", (code) => resolve({ code, out, err }));
    child.on("error", (e) => resolve({ code: 1, out, err: String(e) }));
  });

// (Re)build the composition manifest by running `pnpm compositions`.
export const regenerateManifest = async (): Promise<Manifest | null> => {
  await runPnpm(["compositions"]);
  return readManifest();
};

// A representative frame for a thumbnail — a third of the way in, so we skip
// fade-ins but stay before any outro.
export const thumbnailFrame = (c: Composition): number =>
  Math.max(0, Math.floor(c.durationInFrames / 3));

// Guard against path traversal in ids/filenames coming from the client.
export const isSafeId = (id: string): boolean =>
  /^[A-Za-z0-9_-]+$/.test(id);
