# Deepgram Pre-Recorded Audio Transcription

**Endpoint:** `POST https://api.deepgram.com/v1/listen`

## Required Headers

- `Authorization: Token YOUR_DEEPGRAM_API_KEY`
- `Content-Type: audio/*` (for local files) or `application/json` (for URLs)

## Sending a Local File

```bash
curl -X POST https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @/path/to/audio.wav
```

## Sending a URL

```bash
curl -X POST https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/audio.wav"}'
```

## Common Query Parameters (Optional)

Add as query string: `?param=value&param2=value2`

- `model=nova-2` - AI model (nova-3, nova-2, enhanced, base)
- `language=en` - BCP-47 language tag (e.g., en-US, es, fr)
- `punctuate=true` - Add punctuation and capitalization
- `diarize=true` - Recognize speaker changes
- `smart_format=true` - Apply formatting for readability
- `paragraphs=true` - Split into paragraphs
- `utterances=true` - Segment into utterances
- `summarize=v2` - Generate summary
- `detect_language=true` - Auto-detect language
- `filler_words=true` - Include "uh", "um", etc.
- `numerals=true` - Convert numbers to digits

## Example with Parameters

```bash
curl -X POST "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&diarize=true" \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @/path/to/audio.wav
```

## Example: Transcribe with Filler Words

```bash
curl -X POST "https://api.deepgram.com/v1/listen?filler_words=true&punctuate=true" \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @/path/to/audio.wav
```

## Response Format

Returns JSON with:

- `results.channels[0].alternatives[0].transcript` - Full transcript text
- `results.channels[0].alternatives[0].words` - Array of word objects with timestamps
- `metadata` - Request info, duration, model used, etc.

## Notes

- **Latest model:** `nova-3` (default is `base` if not specified)
- **Smart Format:** Highly recommended - formats currency, phone numbers, emails, etc.
- **Supported formats:** WAV, MP3, MP4, FLAC, OGG, and more
- **File size:** For large files, consider using a URL instead of uploading directly
