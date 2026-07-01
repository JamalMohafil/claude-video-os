"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileTerminal,
  File as FileIcon,
  Check,
  Copy,
  Loader2,
  Search,
  ArrowDownUp,
  Pencil,
  FolderPlus,
  FolderInput,
  Folder as FolderIcon,
} from "lucide-react";

type AssetKind = "image" | "video" | "audio" | "cast" | "other";
type Asset = {
  path: string;
  name: string;
  folder: string;
  kind: AssetKind;
  size: number;
  mtime: number;
};
type SortKey = "newest" | "name" | "size" | "type";

const fmtBytes = (n: number) => {
  if (!n) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
};

const KindIcon = ({ kind }: { kind: AssetKind }) => {
  const cls = "size-5 text-[var(--muted)]";
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "video") return <VideoIcon className={cls} />;
  if (kind === "audio") return <Music className={cls} />;
  if (kind === "cast") return <FileTerminal className={cls} />;
  return <FileIcon className={cls} />;
};

const joinPath = (folder: string, name: string) => (folder ? `${folder}/${name}` : name);

export default function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState<string | null>(null); // null = All
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [moveFor, setMoveFor] = useState<string | null>(null); // asset.path
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      const data = await res.json();
      setAssets(Array.isArray(data.assets) ? data.assets : []);
      setFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch {
      setAssets([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      try {
        const fd = new FormData();
        for (const f of list) fd.append("file", f);
        // Upload into the folder currently being viewed (if any).
        if (folder) fd.append("folder", folder);
        await fetch("/api/assets", { method: "POST", body: fd });
        await load();
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [folder, load],
  );

  const rename = useCallback(
    async (asset: Asset) => {
      const next = window.prompt("Rename asset", asset.name);
      if (!next || next.trim() === asset.name) return;
      const res = await fetch("/api/assets", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: asset.path, to: joinPath(asset.folder, next.trim()) }),
      });
      if (!res.ok) alert((await res.json()).error || "Rename failed");
      await load();
    },
    [load],
  );

  const move = useCallback(
    async (asset: Asset, target: string) => {
      setMoveFor(null);
      if (target === asset.folder) return;
      const res = await fetch("/api/assets", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: asset.path, to: joinPath(target, asset.name) }),
      });
      if (!res.ok) alert((await res.json()).error || "Move failed");
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (asset: Asset) => {
      if (!confirm(`Delete "${asset.path}"? This can't be undone.`)) return;
      await fetch(`/api/assets?path=${encodeURIComponent(asset.path)}`, { method: "DELETE" });
      await load();
    },
    [load],
  );

  const newFolder = useCallback(async () => {
    const name = window.prompt("New folder name (you can nest with a/b)");
    if (!name || !name.trim()) return;
    const res = await fetch("/api/assets/folder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: name.trim() }),
    });
    if (!res.ok) {
      alert((await res.json()).error || "Could not create folder");
      return;
    }
    await load();
    setFolder(name.trim().replace(/^\/+|\/+$/g, ""));
  }, [load]);

  const copyPath = useCallback((p: string) => {
    navigator.clipboard?.writeText(`staticFile("${p}")`);
    setCopied(p);
    setTimeout(() => setCopied((c) => (c === p ? null : c)), 1500);
  }, []);

  const visible = useMemo(() => {
    let list = (assets ?? []).filter((a) =>
      a.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (folder !== null) list = list.filter((a) => a.folder === folder);
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => b.mtime - a.mtime);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "size") sorted.sort((a, b) => b.size - a.size);
    else if (sort === "type")
      sorted.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
    return sorted;
  }, [assets, folder, sort, query]);

  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Assets</h1>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Uploading…" : folder ? `Upload to ${folder}` : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>
      <p className="mb-5 text-sm text-[var(--muted)]">
        Files in your Remotion <code className="text-[var(--fg)]">public/</code> folder. Organize
        them into folders, rename, and copy each one&apos;s{" "}
        <code className="text-[var(--fg)]">staticFile()</code> path.
      </p>

      {/* Folder bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFolder(null)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
            folder === null
              ? "border-[var(--accent)] bg-[var(--accent)]/15 font-medium"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--fg)]"
          }`}
        >
          All
        </button>
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
              folder === f
                ? "border-[var(--accent)] bg-[var(--accent)]/15 font-medium"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            <FolderIcon className="size-3.5" /> {f}
          </button>
        ))}
        <button
          onClick={newFolder}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--fg)]"
        >
          <FolderPlus className="size-3.5" /> New folder
        </button>
      </div>

      {/* Search + sort */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
        </div>
        <div className="relative">
          <ArrowDownUp className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-8 pr-7 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
        }}
      >
        {assets === null ? (
          <div className="grid place-items-center py-20 text-[var(--muted)]">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-14 text-center text-sm text-[var(--muted)]">
            {assets.length === 0
              ? "No assets yet. Drop files here or click Upload."
              : "Nothing here. Try another folder or upload."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((a) => (
              <div
                key={a.path}
                className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <div
                  className="relative grid place-items-center overflow-hidden bg-black"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  {a.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/asset?path=${encodeURIComponent(a.path)}`}
                      alt={a.name}
                      loading="lazy"
                      className="absolute inset-0 size-full object-contain"
                    />
                  ) : a.kind === "video" ? (
                    <video
                      src={`/api/asset?path=${encodeURIComponent(a.path)}`}
                      muted
                      preload="metadata"
                      className="absolute inset-0 size-full object-contain"
                    />
                  ) : (
                    <KindIcon kind={a.kind} />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <div className="truncate text-sm font-medium" title={a.name}>
                    {a.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--muted)]">
                    {a.folder ? `${a.folder} · ` : ""}
                    {a.kind} · {fmtBytes(a.size)}
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    <button
                      onClick={() => copyPath(a.path)}
                      title={`staticFile("${a.path}")`}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--fg)]"
                    >
                      {copied === a.path ? <Check className="size-3" /> : <Copy className="size-3" />}
                      {copied === a.path ? "Copied" : "Path"}
                    </button>
                    <button
                      onClick={() => rename(a)}
                      title="Rename"
                      className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--fg)]"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setMoveFor((m) => (m === a.path ? null : a.path))}
                        title="Move to folder"
                        className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--fg)]"
                      >
                        <FolderInput className="size-3" />
                      </button>
                      {moveFor === a.path && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMoveFor(null)}
                          />
                          <div className="absolute bottom-full left-0 z-20 mb-1 max-h-56 w-44 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xl">
                            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                              Move to
                            </div>
                            {["", ...folders]
                              .filter((f) => f !== a.folder)
                              .map((f) => (
                                <button
                                  key={f || "__root"}
                                  onClick={() => move(a, f)}
                                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs hover:bg-[var(--accent)]/20"
                                >
                                  {f || "Root (public/)"}
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => remove(a)}
                      title="Delete"
                      className="ml-auto rounded-md border border-[var(--border)] p-1.5 text-red-300 transition hover:border-red-500/50 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
