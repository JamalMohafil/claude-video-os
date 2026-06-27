import React, { useEffect } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { preloadVideo } from "@remotion/preload";
import { z } from "zod";

const zoomSegmentSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  zoomStart: z.number().optional(),
  zoomEnd: z.number().optional(),
});

export const zoomableVideoSchema = z.object({
  src: z.string(),
  zoomSegments: z.array(zoomSegmentSchema),
  transformOrigin: z.string().optional(),
});

export type ZoomSegment = z.infer<typeof zoomSegmentSchema>;
type ZoomableVideoProps = z.infer<typeof zoomableVideoSchema>;

export const ZoomableVideo: React.FC<ZoomableVideoProps> = ({
  src,
  zoomSegments,
  transformOrigin = "center 15%",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const videoSrc = staticFile(src);

  // Preload video for smoother playback in Studio/Player
  useEffect(() => {
    const unpreload = preloadVideo(videoSrc);
    return () => unpreload();
  }, [videoSrc]);

  // Find active zoom segment
  const activeSegment = zoomSegments.find(
    (segment) =>
      currentTime >= segment.startTime && currentTime < segment.endTime
  );

  let scale = 1;

  if (activeSegment) {
    const zoomStart = activeSegment.zoomStart ?? 1;
    const zoomEnd = activeSegment.zoomEnd ?? 1.06;
    const segmentStartFrame = activeSegment.startTime * fps;
    const segmentEndFrame = activeSegment.endTime * fps;

    scale = interpolate(
      frame,
      [segmentStartFrame, segmentEndFrame],
      [zoomStart, zoomEnd],
      {
        easing: Easing.inOut(Easing.ease),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin,
        }}
      >
        <OffthreadVideo src={videoSrc} />
      </div>
    </AbsoluteFill>
  );
};
