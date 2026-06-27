// In-memory render-job registry. Survives Next dev hot-reloads via globalThis.
// A job tracks one `remotion render` child process and its progress.

export type RenderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type RenderJob = {
  id: string;
  compositionId: string;
  status: RenderStatus;
  progress: number; // 0..100
  outputFile?: string; // relative to project out/, e.g. "Intro.mp4"
  error?: string;
  logs: string[];
  createdAt: number;
  updatedAt: number;
};

const g = globalThis as typeof globalThis & {
  __videoOsRenderJobs?: Map<string, RenderJob>;
};

export const renderJobs: Map<string, RenderJob> =
  g.__videoOsRenderJobs ?? new Map();
g.__videoOsRenderJobs = renderJobs;

export const addLog = (job: RenderJob, chunk: string) => {
  const lines = chunk
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length) {
    job.logs.push(...lines);
    job.logs = job.logs.slice(-60);
  }
  // Remotion prints "Rendered 34/360" and percentages — capture both.
  const pct = [...chunk.matchAll(/(\d{1,3}(?:\.\d+)?)%/g)];
  for (const m of pct) {
    const v = Number(m[1]);
    if (Number.isFinite(v)) job.progress = Math.max(job.progress, Math.min(99, v));
  }
  const frac = [...chunk.matchAll(/Rendered\s+(\d+)\/(\d+)/g)];
  for (const m of frac) {
    const done = Number(m[1]);
    const total = Number(m[2]);
    if (total > 0) {
      const v = (done / total) * 100;
      job.progress = Math.max(job.progress, Math.min(99, v));
    }
  }
  job.updatedAt = Date.now();
};

export const jobToResponse = (job: RenderJob) => ({
  id: job.id,
  compositionId: job.compositionId,
  status: job.status,
  progress: Math.round(job.progress),
  outputFile: job.outputFile,
  error: job.error,
  logs: job.logs.slice(-12),
});
