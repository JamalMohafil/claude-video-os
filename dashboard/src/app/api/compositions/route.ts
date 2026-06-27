// GET /api/compositions        → cached manifest (regenerates if missing)
// GET /api/compositions?refresh → force a re-scan of the project
//
// This is the dashboard "watching the project": after Claude edits a video,
// hit refresh and the grid reflects the new compositions/durations.

import { NextRequest, NextResponse } from "next/server";
import { readManifest, regenerateManifest } from "@/lib/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.has("refresh");
  let manifest = refresh ? null : readManifest();
  if (!manifest) {
    manifest = await regenerateManifest();
  }
  if (!manifest) {
    return NextResponse.json(
      { error: "Could not read compositions. Is the project set up (pnpm install)?" },
      { status: 500 },
    );
  }
  return NextResponse.json(manifest);
}
