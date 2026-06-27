// GET /api/render/<jobId>  → current progress/status of a render job.

import { NextResponse } from "next/server";
import { renderJobs, jobToResponse } from "@/lib/render-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const job = renderJobs.get(id);
  if (!job) {
    return NextResponse.json({ error: "unknown job" }, { status: 404 });
  }
  return NextResponse.json(jobToResponse(job));
}
