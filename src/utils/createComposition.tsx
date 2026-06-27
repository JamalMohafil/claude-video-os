import { Composition } from "remotion";
import { getDurationInFrames } from "../config";
import { VIDEO_PRESETS, type PresetName } from "../presets";

interface CreateCompositionOptions {
  name: string;
  component: React.ComponentType;
  durationInSeconds: number;
  preset: PresetName;
}

// Metadata attached to every composition so external tools (e.g. the Video OS
// dashboard's live <Player>) can render it without going through Studio.
export interface CompositionMeta {
  id: string;
  component: React.ComponentType;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export type RegisteredComposition = React.FC & { meta: CompositionMeta };

export const createComposition = ({
  name,
  component,
  durationInSeconds,
  preset,
}: CreateCompositionOptions): RegisteredComposition => {
  const presetConfig = VIDEO_PRESETS[preset];
  const durationInFrames = getDurationInFrames(
    durationInSeconds,
    presetConfig.fps,
  );

  const render: React.FC = () => (
    <Composition
      id={name}
      component={component}
      durationInFrames={durationInFrames}
      {...presetConfig}
    />
  );

  const registered = render as RegisteredComposition;
  registered.meta = {
    id: name,
    component,
    durationInFrames,
    fps: presetConfig.fps,
    width: presetConfig.width,
    height: presetConfig.height,
  };

  return registered;
};
