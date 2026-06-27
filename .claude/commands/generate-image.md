---
allowed-tools: mcp__replicate__*, AskUserQuestion, Bash(curl*)
argument-hint: [prompt]
description: Generate an image with Nano Banana Pro (Replicate) — only when it genuinely helps
---

## When to use this (READ FIRST — be smart, don't auto-generate)

Generating an image **costs money** (paid Replicate call, needs
`REPLICATE_API_TOKEN`) and adds time. So Nano Banana is **opt-in**: never fire
it off on your own.

- If the creator explicitly runs `/generate-image <prompt>`, that's a clear go —
  generate it.
- If you're building a video and think an AI image would help, **don't generate
  it silently.** First tell the creator: what image you'd make, exactly where it
  goes in the video, *why* it beats the alternatives (an existing asset in
  `public/`, a free stock photo, a pure-CSS/Remotion graphic, an emoji/icon, or
  a screenshot), and that it's a paid call. Then ask with AskUserQuestion:
  **"Want me to generate this with Nano Banana, or use a free option?"** Only
  generate after a yes.
- Prefer the cheaper/free path when it's just as good. Reach for generation when
  the shot is specific, photoreal, or on-brand in a way nothing on hand matches.

If `REPLICATE_API_TOKEN` isn't set, say so and point them to `/system-setup` or
`.env` instead of failing silently.

## task

Once the creator has confirmed, generate an image with Nano Banana Pro using the
prompt in $1 (or the prompt you proposed and they approved):

1. **Pick the aspect ratio from the brand** unless told otherwise. Read
   `src/brand/profile.json` → `video.defaultPreset`:
   - `Portrait-1080p` → `9:16`
   - `Landscape-1080p` / `Landscape-720p` → `16:9`
   - `Square-1080p` → `1:1`

2. **Create the prediction**:
   ```
   mcp__replicate__create_predictions with:
   - version: google/nano-banana-pro:944891d151f5463d9e6eca5a6942f04053e664853dca30c21864021b046fea1d
   - input: {"prompt": "{prompt}", "aspect_ratio": "{from brand}", "resolution": "2K", "output_format": "png", "safety_filter_level": "block_only_high"}
   - Prefer: wait
   - jq_filter: {id, status, output, error}
   ```

3. **Show the result** — the image URL and a one-line summary.

4. **Download into the project**: save to `public/images/{descriptive-name}.png`
   via `curl -o`, so a composition can reference it with
   `staticFile("images/{name}.png")`. Confirm the path.

## notes

- Write descriptive prompts: subject, style, lighting, composition. For talking
  heads use "centered frame, medium close-up"; for realism say "photorealistic".
- Match the creator's brand mood (read `style.mood` in the profile) so generated
  images sit naturally next to the rest of the video.
