---
allowed-tools: Read, Write, Edit, AskUserQuestion, Bash(pnpm*), Bash(node*), Bash(which*), Bash(ffmpeg*), Bash(cp*), Bash(mkdir*)
argument-hint: (no arguments)
description: One-time onboarding — set up the project and learn the user's brand so every video matches them
---

## Goal

Get a freshly-cloned **Claude Video OS** ready to make videos, and capture the
creator's **brand** (fonts, colors, language, style) so every composition you
build automatically looks like *theirs*. End by rendering the `BrandCheck`
still so they can SEE their brand applied.

This command is conversational. Use the **AskUserQuestion** tool for every
choice below — never assume. Offer a sensible recommendation as the first
option, but let the creator pick. Keep it friendly and fast.

## Steps

### 1. Check the toolchain (quietly)

Run these and report a one-line status for each. Do not stop on a missing
optional tool — just note it.

- `node --version` (need ≥ 18)
- `pnpm --version` (required — this project is pnpm-only)
- `which ffmpeg` (optional — needed for captions/audio extraction; if missing,
  tell them `brew install ffmpeg` and continue)

### 2. Install dependencies

Run `pnpm install`. If it fails, surface the error and help fix it before
continuing.

### 3. Interview the creator (AskUserQuestion)

Ask these as a small number of grouped questions. Group related ones into a
single AskUserQuestion call (it supports up to 4 questions at once).

**a. Identity & language**
- Their display name and social handle (free text is fine — ask in one message).
- Primary content language. Options: English, Arabic, French, Spanish, Other.
- If Arabic (or another RTL language) is primary or secondary, note it — you'll
  pick an Arabic font and the brand system will handle RTL automatically.

**b. Default format**
- Default aspect ratio / preset. Map their answer to a `PresetName` from
  `src/presets.ts`:
  - "Vertical / Reels / TikTok / Shorts" → `Portrait-1080p`
  - "Widescreen / YouTube" → `Landscape-1080p`
  - "Square / Feed" → `Square-1080p`

**c. Fonts**
- Heading font, body font, mono (code) font, and — if they use Arabic — an
  Arabic font.
- Offer curated, known-good Google Fonts as options. Good defaults:
  - Heading: Inter (recommended), Montserrat, Poppins, Sora, Space Grotesk
  - Body: Inter (recommended), Roboto, Open Sans, Work Sans
  - Mono: JetBrains Mono (recommended), Fira Code, IBM Plex Mono
  - Arabic: Cairo (recommended), Tajawal, Almarai, IBM Plex Sans Arabic
- IMPORTANT: every Google Font ships as `@remotion/google-fonts/<Name>` where
  `<Name>` is the font name with spaces removed (e.g. "JetBrains Mono" →
  `JetBrainsMono`). Before writing a font into the config, sanity-check the
  module name. If unsure a font exists, use the `remotion-documentation` MCP
  tool or fall back to a known default and tell the creator.

**d. Color palette**
- Ask for a vibe ("dark & cinematic", "clean & light", "bold & colorful") OR a
  specific accent color / hex codes if they have brand colors.
- Translate their answer into the six brand colors (background, surface,
  foreground, muted, accent, accentForeground). Ensure foreground/background
  contrast is strong enough to read.

**e. Motion & captions**
- Motion feel: Energetic (snappy, springy) or Calm (smooth, slow).
- Captions on by default? Position (bottom recommended).
- Voiceover provider they plan to use (ElevenLabs / none for now).

### 4. Write the brand profile

Overwrite `src/brand/profile.json` with their answers, matching the schema in
`src/brand/profile.schema.json`. Fill every field; keep their exact name,
handle, hex colors, and font names.

### 5. Wire up the fonts

Edit `src/brand/fonts.ts` so the three `loadFont` imports point at the chosen
fonts' modules and the `FONTS` map returns the right families. Pattern:

```ts
import { loadFont as loadHeading } from "@remotion/google-fonts/<Heading>";
import { loadFont as loadBody    } from "@remotion/google-fonts/<Body>";
import { loadFont as loadMono    } from "@remotion/google-fonts/<Mono>";
import { loadFont as loadArabic  } from "@remotion/google-fonts/<Arabic>";

const heading = loadHeading();
const body    = loadBody();
const mono    = loadMono();
const arabic  = loadArabic();

export const FONTS = {
  heading: heading.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
  arabic: arabic.fontFamily,
} as const;
```

If heading and body are the same font, you may reuse one import (as the shipped
default does).

### 6. Environment & secrets (optional)

- If `.env` doesn't exist, `cp .env.example .env`.
- Ask which optional integrations they want now (ElevenLabs voiceover,
  Replicate images, Deepgram captions). For each chosen one, ask for the key and
  write it into `.env`. NEVER print keys back or commit `.env`.
- If they want local, offline captions instead of Deepgram, tell them captions
  can run via local Whisper later — don't block setup on it.

### 7. Verify the brand

- Type-check: `pnpm typecheck` (alias for `tsc`). Fix any error you introduced
  in the brand files before continuing.
- Render the brand card to a still so they can see it:
  `pnpm exec remotion still BrandCheck out/brand-check.png`
- If the still renders, point them to `out/brand-check.png`. If it fails,
  diagnose (most often a wrong font module name) and fix.

### 8. Wrap up

Print a short summary:
- Their brand (name, fonts, accent color, default format) in 3–4 lines.
- What to do next:
  - `pnpm dev` → open Remotion Studio to preview videos.
  - `/new-composition my-first-video` → make a new video; it inherits the brand.
  - "Just tell me what video you want and I'll build it."
- Remind them they can re-run `/system-setup` any time to change their brand.
