"use client";

// Live, scrubbable preview of a composition — no render required. This imports
// the parent project's actual composition components and plays them with
// @remotion/player. It is loaded lazily (next/dynamic, ssr:false) and wrapped in
// an error boundary by the caller, so any runtime issue falls back to the
// render-and-play flow.
//
// Only compositions listed here are live-previewable; keep this list to comps
// with light dependencies (inline styles, no heavy async deps).

import { Player } from "@remotion/player";
import { Intro } from "../../../src/compositions/intro/Composition";
import { BrandCheck } from "../../../src/compositions/brand-check/Composition";
import type { CompositionMeta } from "../../../src/utils/createComposition";

const META: Record<string, CompositionMeta> = {
  Intro: Intro.meta,
  BrandCheck: BrandCheck.meta,
};

export const LIVE_PREVIEW_IDS = Object.keys(META);

export default function LivePlayer({ id }: { id: string }) {
  const meta = META[id];
  if (!meta) return null;
  return (
    <Player
      component={meta.component as React.ComponentType<Record<string, unknown>>}
      inputProps={{}}
      durationInFrames={meta.durationInFrames}
      fps={meta.fps}
      compositionWidth={meta.width}
      compositionHeight={meta.height}
      controls
      autoPlay
      loop
      style={{
        width: "100%",
        maxHeight: "64vh",
        aspectRatio: `${meta.width} / ${meta.height}`,
      }}
    />
  );
}
