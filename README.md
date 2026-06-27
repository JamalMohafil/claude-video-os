# 🎬 Claude Video OS

**Make videos by talking to Claude Code.**

You describe the video you want — Claude builds it as real, rendered video that
matches *your* brand. No timeline scrubbing, no After Effects. Just a
conversation, in VS Code, with Claude Code.

Under the hood it's a [Remotion](https://remotion.dev) video engine plus a
**brand system** and a set of **Claude skills/commands** that teach Claude how
to drive it.

---

## ✨ What you get

- 🗣️ **Talk to make videos** — "make me a 20s vertical reel about X" → a real MP4.
- 🎨 **A brand that sticks** — set your fonts, colors, language, and style once
  with `/system-setup`; every video inherits them automatically.
- 🌍 **Arabic & RTL first-class** — pick Arabic as your language and layouts +
  fonts adapt automatically.
- 🧱 **A component library** — titles, content, code, diagrams, captions, B-roll,
  music — the building blocks Claude assembles.
- 📝 **Captions** — transcribe your audio and burn in subtitles.
- 🤖 **Smart by default** — Claude only reaches for paid tools (like AI image
  generation) when it actually helps, and asks you first.

---

## 🚀 Quick start

> Requirements: [Node 18+](https://nodejs.org), [pnpm](https://pnpm.io)
> (`npm i -g pnpm`), and [Claude Code](https://claude.com/claude-code). FFmpeg is
> recommended for captions (`brew install ffmpeg`).

```bash
git clone <your-fork-url> my-videos
cd my-videos
code .            # open in VS Code
```

Then, inside Claude Code:

```
/system-setup
```

That one command installs everything and **interviews you** about your brand —
your name, language, fonts, colors, and style — then renders a **Brand Check**
card so you can see your identity applied. Takes a couple of minutes.

After that, just talk:

```
make a 15-second vertical video introducing my channel
```

or scaffold one yourself:

```
/new-composition my-first-video
pnpm dev          # open Remotion Studio to preview
```

---

## 🖥️ The Video OS dashboard

A web dashboard that **watches your project** — while Claude does the editing in
VS Code:

- 🎞️ Every composition in one grid with a live thumbnail — **search, filter by
  aspect ratio, and sort** by name / duration / resolution.
- ▶️ One-click **render with a live progress bar**, then play or download the MP4.
- 🗂️ An **assets library** for your Remotion `public/` folder: preview, search,
  **upload** (files land in the right subfolder, ready for `staticFile()`), and
  **delete** — all reflected directly on disk.

```bash
cd dashboard
pnpm install
pnpm dev          # → http://localhost:4030
```

Tell Claude to change a video, hit **Refresh** in the dashboard, and the grid
re-scans the project. Built with Next.js + React; it shells out to your Remotion
project, so it always reflects the real compositions (no duplicated state).

---

## 🧠 The brand system (the important part)

Everything about how your videos look lives in **`src/brand/profile.json`**:

```jsonc
{
  "creator":  { "name": "...", "handle": "@...", "primaryLanguage": "en" },
  "fonts":    { "heading": "Inter", "body": "Inter", "mono": "JetBrains Mono", "arabic": "Cairo" },
  "colors":   { "background": "#0A0A0A", "accent": "#6E56CF", "foreground": "#FFFFFF", ... },
  "style":    { "mood": "bold, cinematic", "motion": "energetic" },
  "video":    { "defaultPreset": "Portrait-1080p" }
}
```

Compositions read it through `src/brand`:

```tsx
import { BRAND, COLORS, fontFor } from "../../brand";

<div style={{ background: COLORS.background, fontFamily: fontFor("heading") }}>
  {BRAND.creator.name}
</div>
```

Change your brand in one place → every video updates. Re-run `/system-setup`
any time to restyle.

---

## 🧰 Commands

| Command | What it does |
| --- | --- |
| `/system-setup` | Onboarding: install + capture your brand. Re-runnable. |
| `/new-composition <name>` | Scaffold a new, on-brand video. |
| `/render <Id>` | Render a composition to `out/`. |
| `/transcribe <file>` | Transcribe media for captions. |
| `/generate-image <prompt>` | AI image (Nano Banana) — opt-in, Claude asks first. |
| `/screenshot <url>` | Capture a webpage for B-roll. |

Useful scripts: `pnpm dev` (Studio) · `pnpm typecheck` · `pnpm exec remotion
render <Id> out/<Id>.mp4`.

---

## 📁 Structure

```
src/
├── brand/          ⭐ your identity — fonts, colors, language, style
├── components/     reusable building blocks
├── compositions/   your videos (brand-check + two reference examples)
├── presets.ts      aspect ratios (Portrait / Landscape / Square, 60fps)
└── Root.tsx        composition registry (Studio sidebar)
.claude/            commands + skills that teach Claude this project
CLAUDE.md           project instructions Claude reads every session
```

---

## 🗺️ Roadmap

- [x] **v0.1 — The engine + brand system + Claude layer**
- [x] **The Video OS dashboard** — watch the project, render with live progress,
  play/export. (`dashboard/`)
- [ ] Captions in the dashboard (transcribe + preview subtitles per video).
- [ ] Local Whisper captions (offline, no API key).
- [ ] Voiceover flow (ElevenLabs) wired into compositions.
- [ ] More brand-aware components and motion presets.

---

## 🙏 Credits

Built on [Remotion](https://remotion.dev). Created for the **AI For Everything**
community to teach video creation with Claude Code.

## License

MIT — see [LICENSE](LICENSE).
