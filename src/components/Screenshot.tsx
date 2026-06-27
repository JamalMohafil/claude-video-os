import { useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { preloadImage } from '@remotion/preload';
import { z } from 'zod';

export const screenshotSchema = z.object({
  src: z.string(),
  scrollSpeed: z.number(),
  scrollDelaySeconds: z.number().optional(),
});

export const Screenshot: React.FC<z.infer<typeof screenshotSchema>> = ({
  src,
  scrollSpeed,
  scrollDelaySeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgSrc = staticFile(src);

  // Preload image for smoother playback in Studio/Player
  useEffect(() => {
    const unpreload = preloadImage(imgSrc);
    return () => unpreload();
  }, [imgSrc]);

  // Calculate scroll position based on frame and scroll speed, with delay
  const scrollDelayFrames = scrollDelaySeconds * fps;
  const scrollFrame = Math.max(0, frame - scrollDelayFrames);
  const scrollY = (scrollFrame / fps) * scrollSpeed;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <Img
        src={imgSrc}
        className="absolute left-0 w-full h-auto"
        style={{
          top: -scrollY,
        }}
      />
    </div>
  );
};
