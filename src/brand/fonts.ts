// ─────────────────────────────────────────────────────────────────────────
// FONTS — loads your brand fonts so Remotion can render them deterministically.
//
// `/system-setup` REWRITES this file to match the fonts you pick. The shape
// never changes: import each font's `loadFont`, call it, and map the four
// roles (heading / body / mono / arabic) to the returned `fontFamily`.
//
// Every Google Font ships as its own module:  @remotion/google-fonts/<Name>
// where <Name> is the font name with spaces removed, e.g.
//   "JetBrains Mono" → @remotion/google-fonts/JetBrainsMono
//   "Noto Sans Arabic" → @remotion/google-fonts/NotoSansArabic
//
// Browse names: https://remotion.dev/docs/google-fonts/get-available-fonts
// ─────────────────────────────────────────────────────────────────────────

import { loadFont as loadHeading } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadArabic } from "@remotion/google-fonts/Cairo";

// Load only the weights/subsets you actually use — keeps renders fast and
// offline-friendly (loading every weight fires dozens of network requests).
const heading = loadHeading("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const arabic = loadArabic("normal", {
  weights: ["400", "700"],
  subsets: ["arabic", "latin"],
});

// Body reuses the heading family by default. Point `loadBody` at a separate
// import if your brand uses a distinct body face.
const body = heading;

export const FONTS = {
  heading: heading.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
  arabic: arabic.fontFamily,
} as const;
