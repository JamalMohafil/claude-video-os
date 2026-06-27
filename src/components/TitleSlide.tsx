import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

export const titleSlideSchema = z.object({
  title: z.string(),
  className: z.string().optional(),
});

type TitleSlideProps = z.infer<typeof titleSlideSchema>;

export const TitleSlide: React.FC<TitleSlideProps> = ({ title, className }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className={`bg-black flex items-center justify-center ${className ?? ""}`}>
      <div
        className="text-8xl font-bold text-white"
        style={{
          opacity,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
