import { useEffect } from "react";
import {
	AbsoluteFill,
	staticFile,
	OffthreadVideo,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	Easing,
} from "remotion";
import { preloadVideo } from "@remotion/preload";
import { z } from "zod";

export const bRollVideoSchema = z.object({
	filename: z.string(),
	startTime: z.number().optional().default(0),
	endTime: z.number().optional(),
	zoomStart: z.number().optional().default(1),
	zoomEnd: z.number().optional().default(1),
	playbackRate: z.number().optional().default(1),
});

export type BRollVideoProps = z.infer<typeof bRollVideoSchema>;

export const BRollVideo: React.FC<BRollVideoProps> = ({
	filename,
	startTime = 0,
	endTime,
	zoomStart = 1,
	zoomEnd = 1,
	playbackRate = 1,
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const src = staticFile(filename);

	// Preload video for smoother playback in Studio/Player
	useEffect(() => {
		const unpreload = preloadVideo(src);
		return () => unpreload();
	}, [src]);

	// Calculate the effective duration of this sequence (minimum 1 frame to avoid interpolation errors)
	const sequenceDuration = Math.max(durationInFrames, 1);

	// Interpolate zoom from start to end over the duration
	const scale =
		sequenceDuration > 1
			? interpolate(frame, [0, sequenceDuration], [zoomStart, zoomEnd], {
					easing: Easing.inOut(Easing.ease),
					extrapolateRight: "clamp",
				})
			: zoomStart;

	return (
		<AbsoluteFill className="bg-black items-center justify-center">
			<div
				style={{
					width: "100%",
					height: "100%",
					transform: `scale(${scale})`,
					transformOrigin: "center center",
				}}
			>
				<OffthreadVideo
					src={src}
					startFrom={Math.floor(startTime * fps)}
					endAt={endTime ? Math.floor(endTime * fps) : undefined}
					className="w-full h-full object-cover"
					muted
					playbackRate={playbackRate}
				/>
			</div>
		</AbsoluteFill>
	);
};
