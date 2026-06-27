// GET /api/asset?path=images/logo.png  → streams an asset from public/.
// Range-aware so audio/video preview can seek.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveAsset, CONTENT_TYPES } from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path") || "";
  const abs = resolveAsset(rel);
  if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const stat = fs.statSync(abs);
  const type = CONTENT_TYPES[path.extname(abs).toLowerCase()] || "application/octet-stream";
  const range = req.headers.get("range");

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    const chunk = fs.readFileSync(abs).subarray(start, end + 1);
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunk.length),
      },
    });
  }

  return new NextResponse(fs.readFileSync(abs), {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
