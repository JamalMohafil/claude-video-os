// A short, on-brand channel intro — the template's "hello world" in motion.
// Everything (colors, fonts, name, handle) comes from src/brand, so it
// restyles itself the moment you run /system-setup.
//
//   pnpm exec remotion render Intro out/intro.mp4

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, COLORS, fontFor, isRtl } from "../../brand";
import { createComposition } from "../../utils/createComposition";
import type { PresetName } from "../../presets";

const INTRO_SECONDS = 6;

const IntroComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const rtl = isRtl();

  // Accent bar wipes across, then the wordmark springs up.
  const bar = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const barWidth = interpolate(bar, [0, 1], [0, Math.min(width * 0.34, 360)]);

  const nameRise = spring({
    frame: frame - 8,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  const nameY = interpolate(nameRise, [0, 1], [60, 0]);
  const nameOpacity = interpolate(frame, [8, 24], [0, 1], { extrapolateRight: "clamp" });

  const handleOpacity = interpolate(frame, [26, 42], [0, 1], { extrapolateRight: "clamp" });

  // Gentle exit so loops/cuts feel intentional.
  const total = INTRO_SECONDS * fps;
  const exit = interpolate(frame, [total - 18, total], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        color: COLORS.foreground,
        justifyContent: "center",
        padding: Math.round(width * 0.08),
        direction: rtl ? "rtl" : "ltr",
        opacity: exit,
      }}
    >
      <div
        style={{
          height: 12,
          width: barWidth,
          borderRadius: 999,
          background: COLORS.accent,
          marginBottom: 40,
        }}
      />

      <div
        style={{
          transform: `translateY(${nameY}px)`,
          opacity: nameOpacity,
          fontFamily: fontFor("heading"),
          fontWeight: 800,
          fontSize: Math.round(height * 0.072),
          lineHeight: 1.02,
          letterSpacing: -1,
        }}
      >
        {BRAND.creator.name}
      </div>

      <div
        style={{
          opacity: handleOpacity,
          marginTop: 24,
          fontFamily: fontFor("body"),
          fontSize: Math.round(height * 0.026),
          color: COLORS.muted,
        }}
      >
        {BRAND.creator.handle}
      </div>
    </AbsoluteFill>
  );
};

export const Intro = createComposition({
  name: "Intro",
  component: IntroComposition,
  durationInSeconds: INTRO_SECONDS,
  preset: BRAND.video.defaultPreset as PresetName,
});
