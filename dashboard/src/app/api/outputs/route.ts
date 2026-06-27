// GET /api/outputs  → rendered files in the project out/ (most recent first).

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { outDir } from "@/lib/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dir = outDir();
  let files: { name: string; size: number; mtime: number }[] = [];
  try {
    files = fs
      .readdirSync(dir)
      .filter((f) => /\.(mp4|webm|gif)$/i.test(f))
      .map((name) => {
        const s = fs.statSync(path.join(dir, name));
        return { name, size: s.size, mtime: s.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    files = [];
  }
  return NextResponse.json({ outputs: files });
}
