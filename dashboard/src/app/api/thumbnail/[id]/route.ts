// GET /api/thumbnail/<CompositionId>  → PNG still (rendered once, then cached)
//
// Renders a representative frame of the composition via the project's Remotion
// CLI and caches it under out/thumbs/. Add ?refresh to re-render.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  readManifest,
  thumbsDir,
  thumbnailFrame,
  runPnpm,
  isSafeId,
} from "@/lib/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// A clean placeholder served when a still can't be rendered (e.g. the
// composition references an asset that isn't in public/). Never show a broken
// image in the grid.
const placeholder = (id: string) => {
  const label = id.replace(/[<&>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#0d0d0f"/>
  <rect x="0.5" y="0.5" width="639" height="359" fill="none" stroke="#232327"/>
  <text x="320" y="174" fill="#6e56cf" font-family="system-ui,sans-serif" font-size="20" font-weight="700" text-anchor="middle">${label}</text>
  <text x="320" y="202" fill="#8b8b94" font-family="system-ui,sans-serif" font-size="13" text-anchor="middle">preview unavailable</text>
</svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isSafeId(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const file = path.join(thumbsDir(), `${id}.png`);
  const refresh = req.nextUrl.searchParams.has("refresh");

  if (refresh || !fs.existsSync(file)) {
    const manifest = readManifest();
    const comp = manifest?.compositions.find((c) => c.id === id);
    if (!comp) {
      return placeholder(id);
    }
    fs.mkdirSync(thumbsDir(), { recursive: true });
    const rel = path.join("out", "thumbs", `${id}.png`);
    const { code } = await runPnpm([
      "exec",
      "remotion",
      "still",
      id,
      rel,
      `--frame=${thumbnailFrame(comp)}`,
      "--log=error",
    ]);
    if (code !== 0 || !fs.existsSync(file)) {
      return placeholder(id);
    }
  }

  const buf = fs.readFileSync(file);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
