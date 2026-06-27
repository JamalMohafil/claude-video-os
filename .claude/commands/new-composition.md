---
allowed-tools: Read, Write, Edit, Bash(mkdir*)
argument-hint: [composition-name]
description: Create a new, on-brand video composition with boilerplate
---

## task

Create a new Remotion video composition named "$1" that automatically uses the
creator's brand (fonts + colors + default format) from `src/brand`.

## steps

1. **Read the brand first.** Open `src/brand/profile.json` so you know the
   creator's `video.defaultPreset`, fonts, colors, and primary language. The new
   composition must inherit these — do NOT hardcode colors or fonts.

2. **Normalize the name**:
   - Folder: kebab-case (e.g. "My Video" → `my-video`)
   - Component: PascalCase (e.g. "my-video" → `MyVideo`)

3. **Create the folder structure** under `src/compositions/{folder}/`:
   ```
   Composition.tsx
   config.ts
   content.ts
   segments/
     TitleSegment.tsx
     ContentSegment.tsx
   ```

4. **Generate files** from these templates.

### config.ts
```typescript
// Segment durations in seconds — tweak freely.
export const TITLE_DURATION_SECONDS = 3;
export const CONTENT_DURATION_SECONDS = 5;
```

### content.ts
```typescript
// All copy lives here so it's easy to edit (and translate).
export const CONTENT = {
  title: "{Composition Name}",
  contentHeader: "Your Header",
  contentBody: "Your content goes here.",
};
```

### segments/TitleSegment.tsx
```tsx
import { AbsoluteFill } from "remotion";
import { COLORS, fontFor } from "../../../brand";
import { CONTENT } from "../content";

export const TitleSegment: React.FC = () => (
  <AbsoluteFill
    style={{
      background: COLORS.background,
      color: COLORS.foreground,
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fontFor("heading"),
      fontSize: 96,
      fontWeight: 800,
      textAlign: "center",
      padding: 80,
    }}
  >
    {CONTENT.title}
  </AbsoluteFill>
);
```

### segments/ContentSegment.tsx
```tsx
import { ContentSlide } from "../../../components/ContentSlide";
import { CONTENT } from "../content";

// ContentSlide accepts a className for brand theming via Tailwind, or you can
// build a fully custom segment like TitleSegment above using COLORS/fontFor.
export const ContentSegment: React.FC = () => (
  <ContentSlide header={CONTENT.contentHeader} content={CONTENT.contentBody} />
);
```

### Composition.tsx
```tsx
import { Series, useVideoConfig } from "remotion";
import { TitleSegment } from "./segments/TitleSegment";
import { ContentSegment } from "./segments/ContentSegment";
import { getDurationInFrames } from "../../config";
import { TITLE_DURATION_SECONDS, CONTENT_DURATION_SECONDS } from "./config";
import { createComposition } from "../../utils/createComposition";
import { BRAND } from "../../brand";
import type { PresetName } from "../../presets";

const {ComponentName}Composition: React.FC = () => {
  const { fps } = useVideoConfig();
  const titleDuration = getDurationInFrames(TITLE_DURATION_SECONDS, fps);
  const contentDuration = getDurationInFrames(CONTENT_DURATION_SECONDS, fps);

  return (
    <Series>
      <Series.Sequence durationInFrames={titleDuration}>
        <TitleSegment />
      </Series.Sequence>
      <Series.Sequence durationInFrames={contentDuration}>
        <ContentSegment />
      </Series.Sequence>
    </Series>
  );
};

const TOTAL_DURATION_SECONDS = TITLE_DURATION_SECONDS + CONTENT_DURATION_SECONDS;

export const {ComponentName} = createComposition({
  name: "{ComponentName}",
  component: {ComponentName}Composition,
  durationInSeconds: TOTAL_DURATION_SECONDS,
  // Inherit the creator's default format from their brand profile.
  preset: BRAND.video.defaultPreset as PresetName,
});
```

5. **Register in `src/Root.tsx`**:
   - Add `import { {ComponentName} } from "./compositions/{folder}/Composition";`
   - Add inside the `Videos` folder, with its own `Folder` wrapper:
     ```tsx
     <Folder name="{ComponentName}">
       <{ComponentName} />
     </Folder>
     ```

6. **Report**:
   - List created files.
   - Show how to preview (`pnpm dev`, then open the composition) and render
     (`pnpm exec remotion render {ComponentName}`).
   - Remind them to edit `content.ts` for copy and `config.ts` for timing.
