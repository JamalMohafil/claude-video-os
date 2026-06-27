---
allowed-tools: Read, Bash(curl*, ffmpeg*)
argument-hint: [media-filename]
description: Transcribe audio from video/audio files using Deepgram API
---

## context

The DEEPGRAM_API_KEY environment variable is already set.

For advanced settings (diarization, language detection, etc.), read @context/deepgram.md

## task

Transcribe the audio from the media file at $1:

1. **For video files** (mp4, mov, avi, mkv, etc.):
   - Extract audio to MP3 using ffmpeg: `ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3`
   - Use the original filename stem (e.g., video.mp4 → video.mp3)
   - Transcribe the extracted audio file

2. **For audio files** (mp3, wav, etc.):
   - Transcribe directly

3. **Default transcription settings**:
   - Use `nova-3` model (most accurate)
   - Enable `smart_format=true` for formatting
   - Enable `punctuate=true` for punctuation
   - Enable `filler_words=true` to keep "uh", "um", etc.
   - Enable `paragraphs=true` for structure

4. **API call**:
   ```bash
   curl -X POST "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&filler_words=true&paragraphs=true" \
     -H "Authorization: Token $DEEPGRAM_API_KEY" \
     -H "Content-Type: audio/mpeg" \
     --data-binary @audio_file.mp3
   ```

5. **Save output**:
   - Save JSON response to `{original_filename_stem}_transcript.json`
   - Example: `interview.mp4` → `interview_transcript.json`
   - Report transcript location and show a snippet of the text
