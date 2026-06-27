"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
} from "lucide-react";

type AssetKind = "image" | "video" | "audio" | "cast" | "other";
type Asset = { path: string; name: string; kind: AssetKind; size: number; mtime: number };

const KINDS: { key: "all" | AssetKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "audio", label: "Audio" },
  { key: "other", label: "Other" },
];

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

export default function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [kind, setKind] = useState<"all" | AssetKind>("all");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      const data = await res.json();
      setAssets(Array.isArray(data.assets) ? data.assets : []);
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
        await fetch("/api/assets", { method: "POST", body: fd });
        await load();
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [load],
  );

  const remove = useCallback(
    async (asset: Asset) => {
      if (!confirm(`Delete "${asset.path}" from public/? This can't be undone.`)) return;
      await fetch(`/api/assets?path=${encodeURIComponent(asset.path)}`, { method: "DELETE" });
      await load();
    },
    [load],
  );

  const copyPath = useCallback((p: string) => {
    const snippet = `staticFile("${p}")`;
    navigator.clipboard?.writeText(snippet);
    setCopied(p);
    setTimeout(() => setCopied((c) => (c === p ? null : c)), 1500);
  }, []);

  const filtered = (assets ?? [])
    .filter((a) => (kind === "all" ? true : a.kind === kind))
    .filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()));

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
          {uploading ? "Uploading…" : "Upload"}
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
        Files in your Remotion <code className="text-[var(--fg)]">public/</code> folder. Uploads
        are sorted into the right subfolder and ready for{" "}
        <code className="text-[var(--fg)]">staticFile()</code>.
      </p>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
          {KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                kind === k.key ? "bg-[var(--accent)] font-medium" : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets…"
          className="min-w-[180px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
      </div>

      {/* Drop zone + grid */}
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
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-14 text-center text-sm text-[var(--muted)]">
            {assets.length === 0
              ? "No assets yet. Drop files here or click Upload."
              : "No assets match your filters."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((a) => (
              <div
                key={a.path}
                className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="relative grid aspect-video place-items-center bg-black">
                  {a.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/asset?path=${encodeURIComponent(a.path)}`}
                      alt={a.name}
                      loading="lazy"
                      className="size-full object-contain"
                    />
                  ) : a.kind === "video" ? (
                    <video
                      src={`/api/asset?path=${encodeURIComponent(a.path)}`}
                      muted
                      preload="metadata"
                      className="size-full object-contain"
                    />
                  ) : (
                    <KindIcon kind={a.kind} />
                  )}
                  <button
                    onClick={() => remove(a)}
                    title="Delete"
                    className="absolute right-1.5 top-1.5 rounded-md bg-black/70 p-1.5 text-red-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <div className="truncate text-sm font-medium" title={a.name}>
                    {a.name}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {a.kind} · {fmtBytes(a.size)}
                  </div>
                  <button
                    onClick={() => copyPath(a.path)}
                    className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--fg)]"
                    title={`staticFile("${a.path}")`}
                  >
                    {copied === a.path ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copied === a.path ? "Copied" : "Copy path"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
