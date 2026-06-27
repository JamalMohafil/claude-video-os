import { Series, useVideoConfig } from "remotion";
import { IntroSegment } from "./segments/IntroSegment";
import { InfoSegment } from "./segments/InfoSegment";
import { getDurationInFrames } from "../../config";
import { INTRO_DURATION_SECONDS, INFO_DURATION_SECONDS } from "./config";
import { createComposition } from "../../utils/createComposition";

const ExampleComposition1: React.FC = () => {
  const { fps } = useVideoConfig();
  const introDuration = getDurationInFrames(INTRO_DURATION_SECONDS, fps);
  const infoDuration = getDurationInFrames(INFO_DURATION_SECONDS, fps);

  return (
    <Series>
      <Series.Sequence durationInFrames={introDuration}>
        <IntroSegment />
      </Series.Sequence>
      <Series.Sequence durationInFrames={infoDuration}>
        <InfoSegment />
      </Series.Sequence>
    </Series>
  );
};

// Calculate total duration once
const TOTAL_DURATION_SECONDS = INTRO_DURATION_SECONDS + INFO_DURATION_SECONDS;

// Export pre-configured wrappers
export const Example1Landscape = createComposition({
  name: "Example1-Landscape",
  component: ExampleComposition1,
  durationInSeconds: TOTAL_DURATION_SECONDS,
  preset: "Landscape-1080p",
});

export const Example1Square = createComposition({
  name: "Example1-Square",
  component: ExampleComposition1,
  durationInSeconds: TOTAL_DURATION_SECONDS,
  preset: "Square-1080p",
});
