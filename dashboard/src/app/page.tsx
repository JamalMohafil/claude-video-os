"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clapperboard,
  RefreshCw,
  Play,
  Download,
  Loader2,
  Film,
  AlertCircle,
  Search,
  ArrowDownUp,
  Images,
  Eye,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import AssetsPanel from "@/components/AssetsPanel";
import { PreviewErrorBoundary } from "@/remotion/PreviewErrorBoundary";

type Tab = "videos" | "assets";
type Aspect = "all" | "portrait" | "landscape" | "square";
type SortKey = "date" | "name" | "duration" | "size";

// Compositions that can be previewed live (instant, scrubbable) — no render
// needed. Keep in sync with the registry in src/remotion/LivePlayer.tsx.
const LIVE_IDS = new Set(["Intro", "BrandCheck"]);

const LivePlayer = dynamic(() => import("@/remotion/LivePlayer"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[40vh] place-items-center text-[var(--muted)]">
      <Loader2 className="size-6 animate-spin" />
    </div>
  ),
});

type Composition = {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  durationInSeconds: number;
  aspect: "portrait" | "landscape" | "square";
  modifiedAt: number;
};

type Manifest = { generatedAt: string; count: number; compositions: Composition[] };

type Job = {
  id: string;
  compositionId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  outputFile?: string;
  error?: string;
};

type Output = { name: string; size: number; mtime: number };

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

export default function Home() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Record<string, Job>>({}); // by compositionId
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [preview, setPreview] = useState<Composition | null>(null);
  const [tab, setTab] = useState<Tab>("videos");
  const [query, setQuery] = useState("");
  const [aspect, setAspect] = useState<Aspect>("all");
  const [sort, setSort] = useState<SortKey>("date");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compositions${refresh ? "?refresh=1" : ""}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load compositions");
      setManifest(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadOutputs = useCallback(async () => {
    try {
      const res = await fetch("/api/outputs", { cache: "no-store" });
      const data = await res.json();
      setOutputs(Array.isArray(data.outputs) ? data.outputs : []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    void loadOutputs();
  }, [load, loadOutputs]);

  const pollJob = useCallback(
    (compositionId: string, jobId: string) => {
      const tick = async () => {
        try {
          const res = await fetch(`/api/render/${jobId}`, { cache: "no-store" });
          const job: Job = await res.json();
          setJobs((prev) => ({ ...prev, [compositionId]: job }));
          if (job.status === "PROCESSING" || job.status === "PENDING") {
            setTimeout(tick, 1000);
          } else if (job.status === "COMPLETED") {
            void loadOutputs();
          }
        } catch {
          setTimeout(tick, 2000);
        }
      };
      void tick();
    },
    [loadOutputs],
  );

  const render = useCallback(
    async (compositionId: string) => {
      setJobs((prev) => ({
        ...prev,
        [compositionId]: { id: "", compositionId, status: "PENDING", progress: 0 },
      }));
      try {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ compositionId }),
        });
        const job: Job = await res.json();
        if (!res.ok) throw new Error((job as { error?: string }).error || "render failed");
        setJobs((prev) => ({ ...prev, [compositionId]: job }));
        pollJob(compositionId, job.id);
      } catch (e) {
        setJobs((prev) => ({
          ...prev,
          [compositionId]: {
            id: "",
            compositionId,
            status: "FAILED",
            progress: 0,
            error: e instanceof Error ? e.message : "render failed",
          },
        }));
      }
    },
    [pollJob],
  );

  const visibleComps = useMemo(() => {
    const list = (manifest?.compositions ?? [])
      .filter((c) => (aspect === "all" ? true : c.aspect === aspect))
      .filter((c) => c.id.toLowerCase().includes(query.trim().toLowerCase()));
    const sorted = [...list];
    if (sort === "date") sorted.sort((a, b) => b.modifiedAt - a.modifiedAt);
    else if (sort === "name") sorted.sort((a, b) => a.id.localeCompare(b.id));
    else if (sort === "duration")
      sorted.sort((a, b) => b.durationInSeconds - a.durationInSeconds);
    else if (sort === "size")
      sorted.sort((a, b) => b.width * b.height - a.width * a.height);
    return sorted;
  }, [manifest, aspect, query, sort]);

  const ASPECTS: Aspect[] = ["all", "portrait", "landscape", "square"];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--accent)]">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <div className="text-lg font-bold leading-none">Video OS</div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">
                {manifest ? `${manifest.count} compositions` : "watching your project"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
              <button
                onClick={() => setTab("videos")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                  tab === "videos" ? "bg-[var(--accent)] font-medium" : "text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                <Film className="size-4" /> Videos
              </button>
              <button
                onClick={() => setTab("assets")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                  tab === "assets" ? "bg-[var(--accent)] font-medium" : "text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                <Images className="size-4" /> Assets
              </button>
            </div>
            {tab === "videos" && (
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium transition hover:border-[var(--accent)] disabled:opacity-60"
              >
                <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Scanning…" : "Refresh"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "assets" ? (
          <AssetsPanel />
        ) : loading ? (
          <div className="grid place-items-center py-32 text-[var(--muted)]">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 size-6 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
            <button
              onClick={() => load(true)}
              className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <section>
              <h1 className="mb-1 text-2xl font-bold">Your videos</h1>
              <p className="mb-5 text-sm text-[var(--muted)]">
                Every composition in your project. Tell Claude to edit them in VS Code —
                hit Refresh to see changes, then render and export from here.
              </p>

              {/* Toolbar: search · aspect filter · sort */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search compositions…"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                  />
                </div>
                <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
                  {ASPECTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAspect(a)}
                      className={`rounded-md px-2.5 py-1.5 text-xs capitalize transition ${
                        aspect === a ? "bg-[var(--accent)] font-medium" : "text-[var(--muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <ArrowDownUp className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-8 pr-7 text-sm outline-none focus:border-[var(--accent)]"
                  >
                    <option value="date">Newest</option>
                    <option value="name">Name</option>
                    <option value="duration">Duration</option>
                    <option value="size">Resolution</option>
                  </select>
                </div>
              </div>

              {visibleComps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-14 text-center text-sm text-[var(--muted)]">
                  No compositions match your search.
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleComps.map((c) => {
                  const job = jobs[c.id];
                  const rendering =
                    job && (job.status === "PENDING" || job.status === "PROCESSING");
                  const done = job?.status === "COMPLETED";
                  const failed = job?.status === "FAILED";
                  const outputName = `${c.id}.mp4`;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent)]/60"
                    >
                      <button
                        onClick={() => setPreview(c)}
                        className="group/thumb relative block w-full overflow-hidden bg-black"
                        style={{ aspectRatio: "16 / 9" }}
                        title="Preview"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/thumbnail/${c.id}`}
                          alt={c.id}
                          loading="lazy"
                          className="absolute inset-0 size-full object-contain"
                        />
                        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                          {c.aspect}
                        </span>
                        <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover/thumb:bg-black/40 group-hover/thumb:opacity-100">
                          <Eye className="size-7" />
                        </span>
                      </button>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="truncate font-semibold">{c.id}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {c.width}×{c.height} · {c.fps}fps · {c.durationInSeconds}s
                        </div>

                        <div className="mt-4 flex-1" />

                        {rendering ? (
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--muted)]">
                              <span className="inline-flex items-center gap-1.5">
                                <Loader2 className="size-3.5 animate-spin" /> Rendering…
                              </span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-black">
                              <div
                                className="h-full rounded-full bg-[var(--accent)] transition-all"
                                style={{ width: `${Math.max(2, job.progress)}%` }}
                              />
                            </div>
                          </div>
                        ) : done ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPlaying(outputName)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium"
                            >
                              <Play className="size-4" /> Play
                            </button>
                            <a
                              href={`/api/file?name=${encodeURIComponent(outputName)}`}
                              download
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:border-[var(--accent)]"
                            >
                              <Download className="size-4" />
                            </a>
                            <button
                              onClick={() => render(c.id)}
                              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:border-[var(--accent)]"
                              title="Re-render"
                            >
                              <RefreshCw className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => render(c.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold transition hover:opacity-90"
                          >
                            <Film className="size-4" /> Render
                          </button>
                        )}
                        {failed && (
                          <p className="mt-2 line-clamp-2 text-xs text-red-400">{job?.error}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </section>

            {outputs.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-lg font-bold">Recent exports</h2>
                <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  {outputs.map((o) => (
                    <div key={o.name} className="flex items-center gap-3 px-4 py-3">
                      <Film className="size-4 flex-none text-[var(--muted)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{o.name}</div>
                        <div className="text-xs text-[var(--muted)]">{fmtBytes(o.size)}</div>
                      </div>
                      <button
                        onClick={() => setPlaying(o.name)}
                        className="rounded-md border border-[var(--border)] p-1.5 hover:border-[var(--accent)]"
                        title="Play"
                      >
                        <Play className="size-4" />
                      </button>
                      <a
                        href={`/api/file?name=${encodeURIComponent(o.name)}`}
                        download
                        className="rounded-md border border-[var(--border)] p-1.5 hover:border-[var(--accent)]"
                        title="Download"
                      >
                        <Download className="size-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {preview &&
        (() => {
          const out = `${preview.id}.mp4`;
          const job = jobs[preview.id];
          const rendering = !!job && (job.status === "PENDING" || job.status === "PROCESSING");
          const rendered =
            !rendering &&
            (job?.status === "COMPLETED" || outputs.some((o) => o.name === out));
          return (
            <div
              className="fixed inset-0 z-40 grid place-items-center bg-black/85 p-4 sm:p-8"
              onClick={() => setPreview(null)}
            >
              <div
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{preview.id}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {preview.width}×{preview.height} · {preview.fps}fps ·{" "}
                      {preview.durationInSeconds}s · {preview.aspect}
                      {rendered ? " · rendered" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => setPreview(null)}
                    className="rounded-md p-1.5 text-[var(--muted)] transition hover:bg-black/40 hover:text-[var(--fg)]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="grid min-h-0 flex-1 place-items-center overflow-auto bg-black p-4">
                  {(() => {
                    const still = (
                      <div className="relative grid place-items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/thumbnail/${preview.id}`}
                          alt={preview.id}
                          className={`max-h-[64vh] w-auto rounded-lg object-contain ${
                            rendering ? "opacity-30" : ""
                          }`}
                        />
                        {rendering && (
                          <div className="absolute inset-0 grid place-items-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="size-7 animate-spin" />
                              <div className="text-sm text-[var(--muted)]">
                                Rendering… {job!.progress}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                    const renderedVideo = (
                      <video
                        key={out}
                        src={`/api/file?name=${encodeURIComponent(out)}`}
                        controls
                        autoPlay
                        loop
                        className="max-h-[64vh] w-auto rounded-lg"
                      />
                    );
                    // Live, instant, scrubbable preview when available — fall
                    // back to the rendered video or the still if it can't run.
                    if (LIVE_IDS.has(preview.id) && !rendering) {
                      return (
                        <PreviewErrorBoundary fallback={rendered ? renderedVideo : still}>
                          <LivePlayer id={preview.id} />
                        </PreviewErrorBoundary>
                      );
                    }
                    return rendered ? renderedVideo : still;
                  })()}
                </div>

                <div className="flex items-center gap-2 border-t border-[var(--border)] p-4">
                  {rendered ? (
                    <>
                      <a
                        href={`/api/file?name=${encodeURIComponent(out)}`}
                        download
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)]"
                      >
                        <Download className="size-4" /> Download
                      </a>
                      <button
                        onClick={() => render(preview.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                      >
                        <RefreshCw className="size-4" /> Re-render
                      </button>
                    </>
                  ) : rendering ? (
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>Rendering…</span>
                        <span>{job!.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-black">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all"
                          style={{ width: `${Math.max(2, job!.progress)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => render(preview.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                    >
                      <Play className="size-4" /> Render &amp; play
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {playing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6"
          onClick={() => setPlaying(null)}
        >
          <video
            src={`/api/file?name=${encodeURIComponent(playing)}`}
            controls
            autoPlay
            className="max-h-[88vh] max-w-full rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
