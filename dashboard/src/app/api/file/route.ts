// GET /api/file?name=Intro.mp4  → streams a rendered file from the project out/.
// Supports HTTP range requests so <video> can seek.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { outDir } from "@/lib/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";
  // Only a bare filename inside out/ — no traversal.
  if (!name || name.includes("/") || name.includes("..") || name.startsWith(".")) {
    return NextResponse.json({ error: "bad name" }, { status: 400 });
  }
  const file = path.join(outDir(), name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const stat = fs.statSync(file);
  const type = CONTENT_TYPES[path.extname(name).toLowerCase()] || "application/octet-stream";
  const range = req.headers.get("range");

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    const chunk = fs.readFileSync(file).subarray(start, end + 1);
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

  const buf = fs.readFileSync(file);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    },
  });
}
