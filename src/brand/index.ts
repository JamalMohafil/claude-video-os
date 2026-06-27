// ─────────────────────────────────────────────────────────────────────────
// BRAND — the single source of truth for how every video looks & feels.
//
// `profile.json` is written by the `/system-setup` command after it
// interviews you (fonts, colors, language, mood). Every component and
// composition reads from `BRAND` below, so when you change your brand in
// one place, all of your videos follow.
//
//   import { BRAND, fontFor, isRtl } from "../../brand";
//
// Edit `profile.json` (or re-run `/system-setup`) — never hardcode brand
// colors or fonts inside a composition.
// ─────────────────────────────────────────────────────────────────────────

import profile from "./profile.json";
import { FONTS } from "./fonts";

export type FontRole = "heading" | "body" | "mono" | "arabic";

export type LanguageCode = string; // ISO-ish, e.g. "en", "ar", "fr"

export interface BrandProfile {
  creator: {
    name: string;
    handle: string;
    primaryLanguage: LanguageCode;
    secondaryLanguage: LanguageCode | null;
  };
  fonts: Record<FontRole, string>;
  colors: {
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    accent: string;
    accentForeground: string;
  };
  style: {
    mood: string;
    cornerRadius: number;
    motion: "calm" | "energetic" | string;
  };
  video: {
    defaultPreset: string;
    logo: string | null;
    safeArea: boolean;
  };
  captions: {
    enabled: boolean;
    position: "top" | "bottom" | "center" | string;
    style: string;
  };
  voiceover: {
    provider: string;
    voiceId: string;
  };
}

export const BRAND = profile as BrandProfile;

// Languages that read right-to-left. Used to flip layouts/icons and pick
// the Arabic font automatically. Extend as needed (Hebrew, Farsi, Urdu…).
const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);

export const isRtl = (language: LanguageCode = BRAND.creator.primaryLanguage) =>
  RTL_LANGUAGES.has(language.toLowerCase().split("-")[0]);

// Resolve a usable CSS `font-family` string for a role. When the active
// language is RTL, body/heading text automatically falls back to the
// configured Arabic font so glyphs render correctly.
export const fontFor = (
  role: FontRole = "body",
  language: LanguageCode = BRAND.creator.primaryLanguage,
): string => {
  if (isRtl(language) && (role === "heading" || role === "body")) {
    return FONTS.arabic;
  }
  return FONTS[role];
};

// Convenience: the color palette, ready to spread into inline styles.
export const COLORS = BRAND.colors;
