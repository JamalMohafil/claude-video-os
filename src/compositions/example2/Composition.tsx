import { Series, useVideoConfig } from "remotion";
import { TitleSegment } from "./segments/TitleSegment";
import { Feature1Segment } from "./segments/Feature1Segment";
import { Feature2Segment } from "./segments/Feature2Segment";
import { getDurationInFrames } from "../../config";
import { TITLE_DURATION_SECONDS, FEATURE_DURATION_SECONDS } from "./config";
import { createComposition } from "../../utils/createComposition";

const ExampleComposition2: React.FC = () => {
  const { fps } = useVideoConfig();
  const titleDuration = getDurationInFrames(TITLE_DURATION_SECONDS, fps);
  const featureDuration = getDurationInFrames(FEATURE_DURATION_SECONDS, fps);

  return (
    <Series>
      <Series.Sequence durationInFrames={titleDuration}>
        <TitleSegment />
      </Series.Sequence>
      <Series.Sequence durationInFrames={featureDuration}>
        <Feature1Segment />
      </Series.Sequence>
      <Series.Sequence durationInFrames={featureDuration}>
        <Feature2Segment />
      </Series.Sequence>
    </Series>
  );
};

// Calculate total duration once
const TOTAL_DURATION_SECONDS = TITLE_DURATION_SECONDS + FEATURE_DURATION_SECONDS * 2;

// Export pre-configured wrapper
export const Example2Square = createComposition({
  name: "Example2-Square",
  component: ExampleComposition2,
  durationInSeconds: TOTAL_DURATION_SECONDS,
  preset: "Square-1080p",
});
