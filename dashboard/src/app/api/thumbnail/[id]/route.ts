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
      return NextResponse.json({ error: "unknown composition" }, { status: 404 });
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
      return NextResponse.json(
        { error: "thumbnail render failed" },
        { status: 500 },
      );
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
