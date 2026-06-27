import { useEffect } from 'react';
import { AbsoluteFill, staticFile, Video, useVideoConfig } from 'remotion';
import { preloadVideo } from '@remotion/preload';
import { z } from 'zod';

export const videoSlideSchema = z.object({
	filename: z.string(),
	startTime: z.number().optional(),
	endTime: z.number().optional(),
});

export type VideoSlideProps = z.infer<typeof videoSlideSchema>;

export const VideoSlide: React.FC<VideoSlideProps> = ({
	filename,
	startTime = 0,
	endTime,
}) => {
	const { fps } = useVideoConfig();
	const src = staticFile(filename);

	// Preload video for smoother playback in Studio/Player
	useEffect(() => {
		const unpreload = preloadVideo(src);
		return () => unpreload();
	}, [src]);

	return (
		<AbsoluteFill className="bg-black items-center justify-center">
			<Video
				src={src}
				startFrom={Math.floor(startTime * fps)}
				endAt={endTime ? Math.floor(endTime * fps) : undefined}
				className="w-full h-full object-contain"
			/>
		</AbsoluteFill>
	);
};
