---
allowed-tools: Read, Bash(pnpm transcribe*), Bash(ffmpeg*), Bash(which*)
argument-hint: [media-filename]
description: Transcribe a video/audio file locally with Whisper (offline, no API key)
---

## task

Transcribe the media at **$1** using the project's **local** speech-to-text
(Whisper, via `@remotion/install-whisper-cpp`). No API keys, fully offline.

## steps

1. **Run the local transcriber**:
   ```bash
   pnpm transcribe "$1"
   ```
   This script (`scripts/transcribe.mjs`) handles everything:
   - Checks `ffmpeg` is installed (tell the user `brew install ffmpeg` if not).
   - **Installs whisper.cpp + the model only if they're missing** — the first run
     downloads them (can take a few minutes + a few GB); later runs are instant.
   - Extracts 16kHz audio, transcribes with word-level timestamps.

2. **Model & language**:
   - Default model is `medium` (multilingual — works for Arabic and others).
   - The language is taken from the brand profile's `primaryLanguage`, or auto-
     detected. Override with `WHISPER_LANGUAGE=ar` or a different model:
     `WHISPER_MODEL=large-v3-turbo pnpm transcribe "$1"` (best quality, slower).

3. **Outputs** (written next to the input file):
   - `<name>.captions.json` — word-level captions for the `Caption` component.
   - `<name>.srt` — subtitle file.
   - `<name>.transcript.txt` — the full spoken text.

4. **Report**: the output paths and a short snippet of the transcript. If the
   user is captioning a composition, point them at the `.captions.json` and the
   `Caption` component / the `transcribe-captions` rule in the
   `remotion-best-practices` skill.
