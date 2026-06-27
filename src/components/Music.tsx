import React, { useCallback, useEffect } from "react";
import { Audio, interpolate, useVideoConfig, staticFile } from "remotion";
import { preloadAudio } from "@remotion/preload";
import { z } from "zod";

export const musicSchema = z.object({
	/** Path to audio file relative to public folder */
	src: z.string(),
	/** Volume level (0-1), default 0.5 */
	volume: z.number().min(0).max(1).optional().default(0.5),
	/** Whether to loop the audio */
	loop: z.boolean().optional().default(false),
	/** Fade in duration in seconds */
	fadeInSeconds: z.number().optional().default(0),
	/** Fade out duration in seconds (from end of video) */
	fadeOutSeconds: z.number().optional().default(0),
});

type MusicProps = z.input<typeof musicSchema>;

/**
 * Music component for background audio with optional fade in/out.
 *
 * Uses Remotion's Audio component with frame-based volume control
 * for smooth fades that render correctly in final video.
 */
export const Music: React.FC<MusicProps> = ({
	src,
	volume = 0.5,
	loop = false,
	fadeInSeconds = 0,
	fadeOutSeconds = 0,
}) => {
	const { fps, durationInFrames } = useVideoConfig();
	const audioSrc = staticFile(src);

	// Preload audio for smoother playback in Studio/Player
	useEffect(() => {
		const unpreload = preloadAudio(audioSrc);
		return () => unpreload();
	}, [audioSrc]);

	const fadeInFrames = fadeInSeconds * fps;
	const fadeOutStartFrame = durationInFrames - fadeOutSeconds * fps;

	// Volume callback for Remotion's recommended pattern
	const getVolume = useCallback(
		(frame: number) => {
			// Handle case where no fades are configured
			if (fadeInFrames === 0 && fadeOutSeconds === 0) {
				return volume;
			}

			// Build interpolation ranges
			const inputRange: number[] = [];
			const outputRange: number[] = [];

			if (fadeInFrames > 0) {
				inputRange.push(0, fadeInFrames);
				outputRange.push(0, 1);
			} else {
				inputRange.push(0);
				outputRange.push(1);
			}

			if (fadeOutSeconds > 0) {
				// Ensure fadeOutStartFrame is after the last input range value
				if (fadeOutStartFrame > inputRange[inputRange.length - 1]) {
					inputRange.push(fadeOutStartFrame, durationInFrames);
					outputRange.push(1, 0);
				}
			}

			const multiplier = interpolate(frame, inputRange, outputRange, {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			});
			return volume * multiplier;
		},
		[fadeInFrames, fadeOutSeconds, fadeOutStartFrame, durationInFrames, volume]
	);

	return <Audio src={audioSrc} volume={getVolume} loop={loop} />;
};
