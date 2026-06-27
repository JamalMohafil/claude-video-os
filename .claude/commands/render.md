---
allowed-tools: Read, Bash(pnpm exec remotion*), Bash(ls*), Bash(open*)
argument-hint: [CompositionId]
description: Render a composition to a video file (or a still image)
---

## task

Render the composition with id "$1" to the `out/` folder.

## steps

1. **Confirm the id exists.** If "$1" is empty or you're unsure of the exact id,
   read `src/Root.tsx` and list the available composition ids, then ask which to
   render (or proceed if obvious).

2. **Render to MP4**:
   ```bash
   pnpm exec remotion render "$1" "out/$1.mp4" --overwrite
   ```
   - Stream progress to the user as it renders.
   - For a single frame instead, use:
     `pnpm exec remotion still "$1" "out/$1.png"`

3. **On success**:
   - Report the output path and file size (`ls -lh out/$1.mp4`).
   - Offer to open it (`open out/$1.mp4` on macOS).

4. **On failure**:
   - Surface the Remotion error. Common causes: a referenced asset missing from
     `public/`, a font module name typo in `src/brand/fonts.ts`, or a TypeScript
     error — run `pnpm typecheck` to pinpoint it.
