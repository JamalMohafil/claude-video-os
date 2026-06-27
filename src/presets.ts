export const VIDEO_PRESETS = {
	'Landscape-720p': {
		width: 1280,
		height: 720,
		fps: 60,
	},
	'Landscape-1080p': {
		width: 1920,
		height: 1080,
		fps: 60,
	},
	'Square-1080p': {
		width: 1080,
		height: 1080,
		fps: 60,
	},
	'Portrait-1080p': {
		width: 1080,
		height: 1920,
		fps: 60,
	},
	// Top/bottom half of a 1080×1920 reel — overlay on part of a tall video.
	'Portrait-Half-1080p': {
		width: 1080,
		height: 960,
		fps: 60,
	},
	// Half-reel overlay matching a 30fps source video.
	'Portrait-Half-1080p-30': {
		width: 1080,
		height: 960,
		fps: 30,
	},
	// Matches my-image.png exactly (Codex course thumbnail).
	'Landscape-1672x941': {
		width: 1672,
		height: 941,
		fps: 60,
	},
	// Full reel at 30fps — for comps that embed a 30fps source video
	// (avoids frame resampling of the embedded clip).
	'Portrait-1080p-30': {
		width: 1080,
		height: 1920,
		fps: 30,
	},
} as const;

export type PresetName = keyof typeof VIDEO_PRESETS;
