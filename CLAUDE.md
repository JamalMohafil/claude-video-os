# CLAUDE.md

Guidance for Claude Code when working in **Claude Video OS** — a template for
making videos by talking to Claude. The human describes the video they want;
you build it as a Remotion composition that matches their brand.

## What this project is

A standalone Remotion video engine wired so a non-coder can make polished,
on-brand videos through conversation. Three pillars:

1. **Brand system** (`src/brand/`) — the creator's fonts, colors, language, and
   style, captured once by `/system-setup`. Every video reads from it.
2. **Component library** (`src/components/`) — reusable building blocks
   (titles, content, code, diagrams, video, captions, music…).
3. **Claude layer** (`.claude/`, this file) — commands and instructions so you
   know how to drive the engine.

## The golden rule: always use the brand

Before building or editing any video, read `src/brand/profile.json`. Then theme
everything through `src/brand`:

```tsx
import { BRAND, COLORS, fontFor, isRtl } from "../../brand";

// colors
style={{ background: COLORS.background, color: COLORS.foreground }}
// accent
style={{ color: COLORS.accent }}
// fonts — fontFor() auto-picks the Arabic font for RTL languages
style={{ fontFamily: fontFor("heading") }}
```

**Never hardcode a hex color or a font family inside a composition.** If a brand
value is missing for what you need, add it to the profile + `src/brand`, don't
inline it. This is what lets the creator restyle every video at once.

## Package manager

**Always use `pnpm`.** Never `npm`/`npx`/`yarn`.

## Don't run the dev server yourself

Do **not** run `pnpm dev` / `remotion studio` (long-running). The creator runs
it and tells you what they see. To verify your work, use `pnpm typecheck`,
`pnpm lint`, or render a still/short clip with `remotion still` / `remotion render`.

## Common commands

```bash
pnpm install                                  # deps
pnpm typecheck                                # tsc, no emit — your main check
pnpm exec remotion still <Id> out/<Id>.png    # quick visual check (1 frame)
pnpm exec remotion render <Id> out/<Id>.mp4   # full render
```

## Slash commands

- `/system-setup` — onboarding: interview the creator and capture their brand.
  Re-runnable any time they want to restyle.
- `/new-composition <name>` — scaffold a new, on-brand video.
- `/render <Id>` — render a composition to `out/`.
- `/transcribe <file>` — transcribe media for captions.
- `/generate-image <prompt>` — AI image via Nano Banana. **Opt-in only**: don't
  generate on your own. If an image would help a video, propose it, explain why
  it beats a free option, note it's a paid call, and confirm before generating.
- `/screenshot <url>` — capture a webpage for B-roll.

## Architecture

```
src/
├── brand/                 # ⭐ brand identity — read this first, always
│   ├── profile.json       #    creator's fonts/colors/language/style
│   ├── index.ts           #    BRAND, COLORS, fontFor(), isRtl()
│   └── fonts.ts           #    loads the chosen Google Fonts
├── components/            # reusable building blocks (see table below)
├── compositions/          # the actual videos (one folder each)
│   ├── brand-check/       #    renders entirely from the brand — the reference
│   ├── example1/          #    reference slideshow
│   └── example2/          #    reference multi-feature demo
├── utils/createComposition.tsx  # helper that wires name/duration/preset
├── config.ts              # secondsToFrames(), framesToSeconds() — default 60fps
├── presets.ts             # VIDEO_PRESETS (aspect ratios + fps)
├── content.ts             # sample content for component previews
└── Root.tsx               # composition registry (Studio sidebar)
```

### How a composition is built

Use the `createComposition` helper and pull the format from the brand:

```tsx
import { createComposition } from "../../utils/createComposition";
import { BRAND } from "../../brand";
import type { PresetName } from "../../presets";

export const MyVideo = createComposition({
  name: "MyVideo",
  component: MyVideoComposition,
  durationInSeconds: 12,
  preset: BRAND.video.defaultPreset as PresetName, // honor the creator's format
});
```

Then register it in `src/Root.tsx` inside the `Videos` folder.

### Timing

All presets are **60fps**. Use the helpers from `config.ts` — never hardcode
frame counts from seconds by hand:

```tsx
import { secondsToFrames } from "../../config";
<Sequence from={secondsToFrames(5.2)} durationInFrames={secondsToFrames(2.7)} />
```

### Transitions

Use Remotion's `<TransitionSeries>` for fades/wipes, not custom props. For
simple back-to-back segments, `<Series>` is fine.

### Presets (`src/presets.ts`)

`Portrait-1080p` (1080×1920) · `Landscape-1080p` (1920×1080) ·
`Square-1080p` (1080×1080) · `Landscape-720p` (1280×720) · plus half-reel and
30fps variants. All 60fps unless the name says `-30`.

## RTL / Arabic

The brand system handles direction. Set the creator's language in the profile;
`isRtl()` and `fontFor()` then do the right thing. Set `direction: "rtl"` on the
container for RTL languages and prefer logical layout. Fix bidi issues in the
**content**, not with per-element `dir` hacks.

## Component reference

| Component     | Key props                                                            |
| ------------- | -------------------------------------------------------------------- |
| TitleSlide    | `title`, `className?`                                                 |
| ContentSlide  | `header`, `content`, `className?`                                     |
| CodeSlide     | `title?`, `code`, `language`, `highlightLines?`, `animatedHighlights?`|
| DiagramSlide  | `title?`, `type`, `diagram`, `theme?`, `sketch?`                      |
| VideoSlide    | `filename`, `startTime?`                                              |
| BRollVideo    | `filename`, `startTime?`, `endTime?`, `zoomStart?`, `zoomEnd?`        |
| ZoomableVideo | `src`, `zoomSegments`                                                 |
| Screenshot    | `src`, `scrollSpeed?`, `scrollDelaySeconds?`                          |
| Logo          | `src`, `position?`, `size?`                                           |
| Caption       | `transcript`, `className?`                                            |
| AsciiPlayer   | `mode`, `castFile`, `playbackSpeed?`, `theme?`                        |
| Code          | `code`, `language`, `highlightLines?`, `theme?`                       |
| Music         | `src`, `volume?`, `fadeInSeconds?`, `fadeOutSeconds?`, `loop?`        |

Components default to `bg-black text-white` and accept a `className` override —
but prefer driving them with brand colors where you can.

## Remotion knowledge

For anything Remotion-specific, load the **remotion-best-practices** skill
(`.claude/skills/remotion-best-practices/`) and use the `remotion-documentation`
MCP tool. Detailed context lives in `context/remotion*.md`.

## Preloading assets

Prefetch local audio/video for smooth Studio playback:

```tsx
import { prefetch, staticFile } from "remotion";
prefetch(staticFile("audio/music.mp3")); // at module level
```
