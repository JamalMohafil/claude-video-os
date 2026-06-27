import { Composition } from "remotion";
import { getDurationInFrames } from "../config";
import { VIDEO_PRESETS, type PresetName } from "../presets";

interface CreateCompositionOptions {
  name: string;
  component: React.ComponentType;
  durationInSeconds: number;
  preset: PresetName;
}

export const createComposition = ({
  name,
  component,
  durationInSeconds,
  preset,
}: CreateCompositionOptions) => {
  const presetConfig = VIDEO_PRESETS[preset];
  return () => (
    <Composition
      id={name}
      component={component}
      durationInFrames={getDurationInFrames(durationInSeconds, presetConfig.fps)}
      {...presetConfig}
    />
  );
};
