import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { Diagram } from "./Diagram";

export const diagramSlideSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["mermaid", "d2"]),
  diagram: z.string(),
  theme: z.enum(["default", "dark", "forest", "neutral"]).optional(),
  sketch: z.boolean().optional(),
  className: z.string().optional(),
});

type DiagramSlideProps = z.infer<typeof diagramSlideSchema>;

export const DiagramSlide: React.FC<DiagramSlideProps> = ({
  title,
  type,
  diagram,
  theme,
  sketch,
  className,
}) => {
  return (
    <AbsoluteFill className={`bg-black flex items-center justify-center pb-32 px-16 ${className ?? ""}`}>
      <div className="w-full max-w-6xl -mt-24">
        {title && (
          <h2 className="text-4xl font-bold text-white mb-8">{title}</h2>
        )}
        <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{ minHeight: '600px' }}>
          <Diagram
            key={`${type}-${diagram.slice(0, 50)}`}
            type={type}
            diagram={diagram}
            theme={theme}
            sketch={sketch}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
