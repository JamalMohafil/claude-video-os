// GET    /api/assets                 → { assets, folders } from public/
// POST   /api/assets   (form)         → upload file(s); optional `folder` field
// PATCH  /api/assets   { from, to }   → rename / move a file within public/
// DELETE /api/assets?path=...         → remove a file from public/
//
// Uploads land where staticFile() expects them, so a composition can reference
// the returned path immediately (e.g. staticFile("images/logo.png")).

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  listAssets,
  listFolders,
  publicDir,
  kindForName,
  folderForKind,
  safeFileName,
  resolveAsset,
  resolveFolder,
} from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ assets: listAssets(), folders: listFolders() });
}

// Add a counter suffix if the name is already taken in destDir.
const uniqueName = (destDir: string, name: string) => {
  let finalName = name;
  let i = 1;
  while (fs.existsSync(path.join(destDir, finalName))) {
    const ext = path.extname(name);
    finalName = `${path.basename(name, ext)}-${i++}${ext}`;
  }
  return finalName;
};

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "expected multipart form data" }, { status: 400 });
  }
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "no files" }, { status: 400 });
  }

  // Optional target folder; otherwise route by kind (images/videos/audio/…).
  const folderField = form.get("folder");
  const targetDir =
    typeof folderField === "string" && folderField.trim()
      ? resolveFolder(folderField)
      : null;
  if (typeof folderField === "string" && folderField.trim() && !targetDir) {
    return NextResponse.json({ error: "bad folder" }, { status: 400 });
  }

  const saved: string[] = [];
  for (const file of files) {
    const name = safeFileName(file.name);
    const destDir = targetDir ?? path.join(publicDir(), folderForKind(kindForName(name)));
    fs.mkdirSync(destDir, { recursive: true });
    const finalName = uniqueName(destDir, name);
    fs.writeFileSync(
      path.join(destDir, finalName),
      Buffer.from(await file.arrayBuffer()),
    );
    saved.push(path.relative(publicDir(), path.join(destDir, finalName)).split(path.sep).join("/"));
  }

  return NextResponse.json({ ok: true, saved });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const from = typeof body?.from === "string" ? body.from : "";
  const to = typeof body?.to === "string" ? body.to : "";
  const fromAbs = resolveAsset(from);
  const toAbs = resolveAsset(to);
  if (!fromAbs || !toAbs) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  if (!fs.existsSync(fromAbs) || !fs.statSync(fromAbs).isFile()) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }
  if (fs.existsSync(toAbs)) {
    return NextResponse.json({ error: "a file with that name already exists" }, { status: 409 });
  }
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  fs.renameSync(fromAbs, toAbs);
  return NextResponse.json({
    ok: true,
    path: path.relative(publicDir(), toAbs).split(path.sep).join("/"),
  });
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
