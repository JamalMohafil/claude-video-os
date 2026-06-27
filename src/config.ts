import { VideoConfig } from "./types";

export const VIDEO_CONFIG: VideoConfig = {
  width: 1280,
  height: 720,
  fps: 60,
};

// Default FPS for all presets
export const DEFAULT_FPS = 60;

// Convert seconds to frames (defaults to 60fps, usable anywhere)
export const secondsToFrames = (seconds: number, fps: number = DEFAULT_FPS): number => {
  return Math.round(seconds * fps);
};

// Convert frames to seconds (defaults to 60fps, usable anywhere)
export const framesToSeconds = (frames: number, fps: number = DEFAULT_FPS): number => {
  return frames / fps;
};

// Legacy alias for getDurationInFrames (use secondsToFrames instead)
export const getDurationInFrames = secondsToFrames;
