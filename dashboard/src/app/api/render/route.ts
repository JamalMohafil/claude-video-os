// POST /api/render  { compositionId }  → starts a render, returns a job id.
// Poll GET /api/render/<jobId> for progress.

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { projectRoot, isSafeId, readManifest } from "@/lib/project";
import { renderJobs, addLog, jobToResponse, RenderJob } from "@/lib/render-jobs";

export const runtime = "nodejs";
export const maxDuration = 600;

let counter = 0;
const newId = () => `job_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const compositionId = body?.compositionId;
  if (typeof compositionId !== "string" || !isSafeId(compositionId)) {
    return NextResponse.json({ error: "invalid compositionId" }, { status: 400 });
  }
  const manifest = readManifest();
  if (manifest && !manifest.compositions.some((c) => c.id === compositionId)) {
    return NextResponse.json({ error: "unknown composition" }, { status: 404 });
  }

  const job: RenderJob = {
    id: newId(),
    compositionId,
    status: "PENDING",
    progress: 0,
    logs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  renderJobs.set(job.id, job);

  const outRel = path.join("out", `${compositionId}.mp4`);
  const outAbs = path.join(projectRoot(), outRel);

  const child = spawn(
    "pnpm",
    ["exec", "remotion", "render", compositionId, outRel, "--overwrite", "--log=info"],
    { cwd: projectRoot(), env: process.env },
  );

  job.status = "PROCESSING";
  job.progress = 1;
  child.stdout.on("data", (d) => addLog(job, d.toString()));
  child.stderr.on("data", (d) => addLog(job, d.toString()));
  child.on("error", (e) => {
    job.status = "FAILED";
    job.error = e.message;
    job.updatedAt = Date.now();
  });
  child.on("close", (code) => {
    if (code === 0 && fs.existsSync(outAbs)) {
      job.status = "COMPLETED";
      job.progress = 100;
      job.outputFile = `${compositionId}.mp4`;
    } else {
      job.status = "FAILED";
      job.error = job.logs.at(-1) || `remotion render exited with code ${code}`;
    }
    job.updatedAt = Date.now();
  });

  return NextResponse.json(jobToResponse(job), { status: 202 });
}
