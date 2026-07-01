// POST   /api/assets/folder  { path }  → create a folder under public/
// DELETE /api/assets/folder?path=...    → remove an EMPTY folder

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resolveFolder, publicDir } from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rel = typeof body?.path === "string" ? body.path : "";
  const abs = resolveFolder(rel);
  if (!abs || abs === publicDir()) {
    return NextResponse.json({ error: "bad folder name" }, { status: 400 });
  }
  fs.mkdirSync(abs, { recursive: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path") || "";
  const abs = resolveFolder(rel);
  if (!abs || abs === publicDir()) {
    return NextResponse.json({ error: "bad folder" }, { status: 400 });
  }
  try {
    fs.rmdirSync(abs); // fails if not empty — intentional
  } catch {
    return NextResponse.json(
      { error: "folder not empty or not found" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
