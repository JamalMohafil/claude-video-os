// Local speech-to-text for understanding & captioning reels — 100% offline.
//
//   pnpm transcribe public/videos/my-reel.mp4
//   WHISPER_MODEL=large-v3-turbo pnpm transcribe path/to/clip.mp4
//
// What it does, in order:
//   1. Checks ffmpeg is available (used to extract audio).
//   2. Installs whisper.cpp locally if it isn't already (./whisper.cpp).
//   3. Downloads the Whisper model if it isn't already.
//   4. Extracts 16kHz mono WAV from the media with ffmpeg.
//   5. Transcribes with word-level timestamps.
//   6. Writes next to the input:
//        <name>.captions.json   word-level captions (for the Caption component)
//        <name>.srt             subtitle file
//        <name>.transcript.txt  the full spoken text (read this to understand the reel)
//
// Steps 2–3 are idempotent: nothing is re-downloaded if it already exists.

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync, execFileSync } from "child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WHISPER_DIR = path.join(root, "whisper.cpp");
const WHISPER_VERSION = "1.5.5";

// Multilingual default so Arabic/other languages work. Override with
// WHISPER_MODEL (e.g. "medium.en" for English-only speed, "large-v3-turbo" for
// best quality). The language is auto-detected, or set WHISPER_LANGUAGE / the
// brand profile's primaryLanguage.
const MODEL = process.env.WHISPER_MODEL || "medium";

const readBrandLanguage = () => {
  try {
    const p = JSON.parse(fs.readFileSync(path.join(root, "src/brand/profile.json"), "utf8"));
    return p?.creator?.primaryLanguage || null;
  } catch {
    return null;
  }
};
const LANGUAGE = process.env.WHISPER_LANGUAGE || readBrandLanguage() || undefined;

const die = (msg) => {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(1);
};

const hasFfmpeg = () => {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// Group word-level captions into readable SRT cues (~42 chars / ~6s each).
const toSrt = (captions) => {
  const cues = [];
  let cur = null;
  for (const c of captions) {
    if (!cur) cur = { start: c.startMs, end: c.endMs, text: c.text.trim() };
    else {
      cur.text = `${cur.text} ${c.text.trim()}`.trim();
      cur.end = c.endMs;
    }
    const long = cur.text.length >= 42 || cur.end - cur.start >= 6000;
    const sentenceEnd = /[.!?؟…]$/.test(cur.text);
    if (long || sentenceEnd) {
      cues.push(cur);
      cur = null;
    }
  }
  if (cur) cues.push(cur);

  const stamp = (ms) => {
    const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    const x = String(Math.floor(ms % 1000)).padStart(3, "0");
    return `${h}:${m}:${s},${x}`;
  };
  return cues
    .map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`)
    .join("\n");
};

const main = async () => {
  const input = process.argv[2];
  if (!input) die("Usage: pnpm transcribe <media-file>");
  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) die(`File not found: ${inputPath}`);
  if (!hasFfmpeg())
    die("ffmpeg is required. Install it: brew install ffmpeg (macOS) or apt install ffmpeg.");

  // 1 & 2 — install whisper.cpp + model only if missing (both are idempotent).
  process.stderr.write(`• Ensuring whisper.cpp (${WHISPER_VERSION})…\n`);
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  process.stderr.write(`• Ensuring model "${MODEL}"…\n`);
  await downloadWhisperModel({ model: MODEL, folder: WHISPER_DIR });

  // 3 — extract 16kHz mono WAV.
  const dir = path.dirname(inputPath);
  const stem = path.basename(inputPath, path.extname(inputPath));
  const wav = path.join(dir, `${stem}.16k.wav`);
  process.stderr.write("• Extracting audio with ffmpeg…\n");
  execFileSync(
    "ffmpeg",
    ["-y", "-i", inputPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav],
    { stdio: "ignore" },
  );

  // 4 — transcribe.
  process.stderr.write(`• Transcribing${LANGUAGE ? ` (language: ${LANGUAGE})` : ""}…\n`);
  const whisperCppOutput = await transcribe({
    model: MODEL,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    inputPath: wav,
    tokenLevelTimestamps: true,
    language: LANGUAGE,
  });

  const { captions } = toCaptions({ whisperCppOutput });
  const fullText = captions.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();

  const base = path.join(dir, stem);
  fs.writeFileSync(`${base}.captions.json`, JSON.stringify(captions, null, 2));
  fs.writeFileSync(`${base}.srt`, toSrt(captions));
  fs.writeFileSync(`${base}.transcript.txt`, fullText + "\n");
  try {
    fs.unlinkSync(wav);
  } catch {
    /* ignore */
  }

  process.stderr.write(
    `✓ ${captions.length} words → ${stem}.captions.json · ${stem}.srt · ${stem}.transcript.txt\n`,
  );
  // Emit the transcript to stdout so the caller (Claude) can read & understand it.
  process.stdout.write(fullText + "\n");
};

main().catch((err) => {
  process.stderr.write(`✗ Transcription failed: ${err?.stack || err}\n`);
  process.exit(1);
});
