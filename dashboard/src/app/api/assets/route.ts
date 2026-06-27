// GET    /api/assets            → list everything in the project's public/
// POST   /api/assets   (form)   → upload file(s) into public/<kind-folder>/
// DELETE /api/assets?path=...    → remove a file from public/
//
// Uploads land where staticFile() expects them, so a composition can reference
// the returned path immediately (e.g. staticFile("images/logo.png")).

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  listAssets,
  publicDir,
  kindForName,
  folderForKind,
  safeFileName,
  resolveAsset,
} from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ assets: listAssets() });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "no files" }, { status: 400 });
  }

  const saved: string[] = [];
  for (const file of files) {
    const name = safeFileName(file.name);
    const kind = kindForName(name);
    const folder = folderForKind(kind);
    const destDir = path.join(publicDir(), folder);
    fs.mkdirSync(destDir, { recursive: true });

    // Avoid clobbering: append a counter if the name already exists.
    let finalName = name;
    let i = 1;
    while (fs.existsSync(path.join(destDir, finalName))) {
      const ext = path.extname(name);
      finalName = `${path.basename(name, ext)}-${i++}${ext}`;
    }

    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(destDir, finalName), buf);
    saved.push(`${folder}/${finalName}`);
  }

  return NextResponse.json({ ok: true, saved });
}

export async function DELETE(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path") || "";
  const abs = resolveAsset(rel);
  if (!abs) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  try {
    fs.unlinkSync(abs);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
