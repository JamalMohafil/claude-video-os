// Asset library helpers — operate on the Remotion project's public/ folder so
// uploads land exactly where staticFile() expects them.

import path from "path";
import fs from "fs";
import { projectRoot } from "./project";

export type AssetKind = "image" | "video" | "audio" | "cast" | "other";

export type Asset = {
  // Path relative to public/, e.g. "images/logo.png" — this is what you pass to
  // staticFile().
  path: string;
  name: string;
  // Folder the asset lives in, relative to public/ ("" = public root).
  folder: string;
  kind: AssetKind;
  size: number;
  mtime: number;
};

export const publicDir = (): string => path.join(projectRoot(), "public");

const EXT_KIND: Record<string, AssetKind> = {
  ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image",
  ".webp": "image", ".svg": "image", ".avif": "image",
  ".mp4": "video", ".mov": "video", ".webm": "video", ".mkv": "video", ".avi": "video",
  ".mp3": "audio", ".wav": "audio", ".m4a": "audio", ".aac": "audio", ".ogg": "audio", ".flac": "audio",
  ".cast": "cast",
};

export const kindForName = (name: string): AssetKind =>
  EXT_KIND[path.extname(name).toLowerCase()] ?? "other";

// Default subfolder per kind, so the library stays organized.
export const folderForKind = (kind: AssetKind): string =>
  ({ image: "images", video: "videos", audio: "audio", cast: "casts", other: "files" })[kind];

const SKIP = new Set([".gitkeep", "README.md", ".DS_Store"]);

export const listAssets = (): Asset[] => {
  const root = publicDir();
  const result: Asset[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || SKIP.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(abs);
      } else if (e.isFile()) {
        const rel = path.relative(root, abs).split(path.sep).join("/");
        const dir = path.dirname(rel);
        const s = fs.statSync(abs);
        result.push({
          path: rel,
          name: e.name,
          folder: dir === "." ? "" : dir,
          kind: kindForName(e.name),
          size: s.size,
          mtime: s.mtimeMs,
        });
      }
    }
  };
  walk(root);
  return result.sort((a, b) => b.mtime - a.mtime);
};

// All folders under public/ (relative paths, recursive) — includes empty ones
// the creator made, so they can move assets into them.
export const listFolders = (): string[] => {
  const root = publicDir();
  const out: string[] = [];
  const walk = (dir: string, rel: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const relPath = rel ? `${rel}/${e.name}` : e.name;
      out.push(relPath);
      walk(path.join(dir, e.name), relPath);
    }
  };
  walk(root, "");
  return out.sort();
};

// Validate/normalize a client-supplied folder path for creating or moving into.
// Returns the absolute dir (may not exist yet) or null if it escapes public/.
export const resolveFolder = (relPath: string): string | null => {
  const clean = relPath.replace(/^\/+|\/+$/g, "").trim();
  if (clean === "") return publicDir();
  if (clean.includes("..") || clean.startsWith("/")) return null;
  const abs = path.resolve(publicDir(), clean);
  const root = path.resolve(publicDir());
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
};

// Resolve a client-supplied relative path safely inside public/. Returns null
// if it would escape the folder.
export const resolveAsset = (relPath: string): string | null => {
  if (!relPath || relPath.includes("..") || relPath.startsWith("/")) return null;
  const abs = path.resolve(publicDir(), relPath);
  const root = path.resolve(publicDir());
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
};

// Sanitize an uploaded filename (no paths, keep extension).
export const safeFileName = (name: string): string => {
  const base = path.basename(name).replace(/[^A-Za-z0-9._-]/g, "_");
  return base || `upload-${Date.now()}`;
};

export const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".avif": "image/avif",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
};
