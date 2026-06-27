// A self-contained card that renders ENTIRELY from your brand profile.
// Run `/system-setup`, then render this still to see your fonts + colors live:
//
//   pnpm exec remotion still BrandCheck out/brand-check.png
//
// It's also the canonical example of reading from `src/brand` — copy these
// patterns into your own compositions instead of hardcoding colors/fonts.

import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { BRAND, COLORS, fontFor, isRtl } from "../../brand";
import { createComposition } from "../../utils/createComposition";
import type { PresetName } from "../../presets";

const Swatch: React.FC<{ name: string; value: string }> = ({ name, value }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: BRAND.style.cornerRadius,
        background: value,
        border: `2px solid ${COLORS.muted}33`,
      }}
    />
    <div style={{ fontFamily: fontFor("mono"), fontSize: 18, color: COLORS.muted }}>{name}</div>
    <div style={{ fontFamily: fontFor("mono"), fontSize: 16, color: COLORS.muted }}>{value}</div>
  </div>
);

const BrandCheckComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rtl = isRtl();

  // Subtle entrance for when this plays as video. Note: it must be fully
  // VISIBLE at frame 0, because `remotion still` (and /system-setup) render
  // frame 0 — never fade the whole card up from opacity 0.
  const rise = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const y = interpolate(rise, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        color: COLORS.foreground,
        padding: 96,
        gap: 56,
        justifyContent: "center",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <div style={{ transform: `translateY(${y}px)`, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: fontFor("mono"), fontSize: 22, letterSpacing: 4, color: COLORS.accent, textTransform: "uppercase" }}>
          Brand check
        </div>
        <div style={{ fontFamily: fontFor("heading"), fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>
          {BRAND.creator.name}
        </div>
        <div style={{ fontFamily: fontFor("body"), fontSize: 34, color: COLORS.muted }}>
          {BRAND.creator.handle} · {BRAND.style.mood}
        </div>
      </div>

      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <Swatch name="background" value={COLORS.background} />
        <Swatch name="surface" value={COLORS.surface} />
        <Swatch name="accent" value={COLORS.accent} />
        <Swatch name="foreground" value={COLORS.foreground} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontFamily: fontFor("heading"), fontSize: 44, fontWeight: 700 }}>
          Heading — {BRAND.fonts.heading}
        </div>
        <div style={{ fontFamily: fontFor("body"), fontSize: 30 }}>
          Body — the quick brown fox jumps over the lazy dog
        </div>
        <div style={{ fontFamily: fontFor("mono"), fontSize: 26, color: COLORS.accent }}>
          mono — const render = await claude.makeVideo()
        </div>
        <div style={{ fontFamily: fontFor("arabic"), fontSize: 40, direction: "rtl" }}>
          عربي — كلود يصنع الفيديو من أجلك
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BrandCheck = createComposition({
  name: "BrandCheck",
  component: BrandCheckComposition,
  durationInSeconds: 5,
  preset: BRAND.video.defaultPreset as PresetName,
});
