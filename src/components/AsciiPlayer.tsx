import { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from "remotion";
import { getStaticFiles, type StaticFile } from "@remotion/studio";
import { create, type Player } from "asciinema-player";
import "asciinema-player/dist/bundle/asciinema-player.css";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

type BaseProps = {
  /**
   * Path to the .cast file relative to the public folder
   * @example "demo.cast"
   */
  castFile: string;
  /**
   * Color theme for the terminal
   * @default "nord"
   */
  theme?:
    | "asciinema"
    | "dracula"
    | "monokai"
    | "nord"
    | "solarized-dark"
    | "solarized-light"
    | "gruvbox-dark"
    | "gruvbox-light";
  /**
   * Terminal font size
   * @default "medium"
   */
  fontSize?: "small" | "medium" | "big";
  /**
   * How the terminal should fit in the container
   * @default "both"
   */
  fit?: "width" | "height" | "both" | "none";
  /**
   * Background color for the container
   * @default "#000"
   */
  backgroundColor?: string;
  /**
   * Number of terminal rows to display (overrides recording's rows)
   * Use this to limit height and make the player appear wider
   */
  rows?: number;
  /**
   * Number of terminal columns to display (overrides recording's cols)
   */
  cols?: number;
};

type StaticProps = BaseProps & {
  /**
   * Display mode: static shows a single frame, animated plays the recording
   */
  mode: "static";
  /**
   * Timestamp in seconds to display (for static mode)
   */
  timestamp: number;
};

type AnimatedProps = BaseProps & {
  /**
   * Display mode: static shows a single frame, animated plays the recording
   */
  mode: "animated";
  /**
   * Playback speed multiplier (1 = normal, 2 = 2x speed, 0.5 = half speed)
   * @default 1
   */
  playbackSpeed?: number;
  /**
   * Start time in seconds (trim beginning of recording)
   * @default 0
   */
  startTime?: number;
  /**
   * End time in seconds (trim end of recording)
   */
  endTime?: number;
};

export type AsciiPlayerProps = StaticProps | AnimatedProps;

export const AsciiPlayer: React.FC<AsciiPlayerProps> = (props) => {
  const {
    castFile,
    theme = "nord",
    fontSize = "medium",
    fit = "both",
    backgroundColor = "#000",
    mode,
    rows,
    cols,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Initialize player
  useEffect(() => {
    if (containerRef.current && !playerRef.current) {
      const handle = delayRender("Waiting for asciinema player to initialize");

      // Create the asciinema player
      const player = create(staticFile(castFile), containerRef.current, {
        autoPlay: true, // Start playing to hide the play button, then we control via seek
        loop: false,
        fit,
        theme,
        terminalFontSize: fontSize,
        pauseOnMarkers: false,
        controls: false,
        ...(rows !== undefined && { rows }),
        ...(cols !== undefined && { cols }),
      });

      playerRef.current = player;

      // Wait for player to be ready by calling any async method
      // seek(0) will wait for internal init to complete
      player
        .seek(0)
        .then(() => {
          continueRender(handle);
        })
        .catch((err) => {
          console.error("Failed to initialize player:", err);
          continueRender(handle);
        });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [castFile, theme, fontSize, fit, rows, cols]);

  // Static mode: seek to the fixed timestamp on every frame (same as animated, but always same time)
  useEffect(() => {
    if (mode !== "static") return;
    if (!playerRef.current) return;

    const timestamp = mode === "static" ? props.timestamp : 0;

    // Just seek - don't pause. Frequent seeking prevents autoplay from advancing.
    playerRef.current.seek(timestamp).catch((err) => {
      console.error("Failed to seek in static mode:", err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, mode]); // Run on every frame, just like the reference implementation

  // Animated mode: sync player time with Remotion frame
  useEffect(() => {
    if (mode !== "animated") return;
    if (!playerRef.current) return;

    const playbackSpeed = props.playbackSpeed ?? 1;
    const startTime = props.startTime ?? 0;
    const endTime = props.endTime;

    // Convert current frame to seconds
    const currentTimeInVideo = frame / fps;

    // Apply playback speed and offset
    let targetTime = startTime + currentTimeInVideo * playbackSpeed;

    // Clamp to endTime if specified
    if (endTime !== undefined && targetTime > endTime) {
      targetTime = endTime;
    }

    playerRef.current.seek(targetTime).catch((err) => {
      console.error("Failed to seek in animated mode:", err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, mode]); // Run on every frame change in animated mode

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Get cast files dynamically from public/casts/ folder.
 * Only works in Remotion Studio - returns empty array during render.
 */
export const getCastFiles = (): string[] => {
  const allFiles: StaticFile[] = getStaticFiles();
  return allFiles
    .filter(
      (file: StaticFile) =>
        file.name.startsWith("casts/") && file.name.endsWith(".cast")
    )
    .map((file: StaticFile) => file.name);
};

/**
 * Creates a Zod schema for the AsciiPlayer with dynamically loaded cast files.
 * Call this function to get a schema with a dropdown of available cast files.
 */
export const createAsciiPlayerSchema = () => {
  const castFiles = getCastFiles();

  // If no cast files found (e.g., during render), fall back to string validation
  const castFileSchema =
    castFiles.length > 0
      ? z.enum(castFiles as [string, ...string[]])
      : z.string().endsWith(".cast");

  return z.object({
    mode: z.enum(["static", "animated"]),
    castFile: castFileSchema,
    // Static mode props
    timestamp: z.number().min(0).optional(),
    // Animated mode props
    playbackSpeed: z.number().min(0.01).optional(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    // Shared appearance props
    theme: z
      .enum([
        "asciinema",
        "dracula",
        "monokai",
        "nord",
        "solarized-dark",
        "solarized-light",
        "gruvbox-dark",
        "gruvbox-light",
      ])
      .optional(),
    fontSize: z.enum(["small", "medium", "big"]).optional(),
    fit: z.enum(["width", "height", "both", "none"]).optional(),
    backgroundColor: zColor().optional(),
    rows: z.number().int().min(1).optional(),
    cols: z.number().int().min(1).optional(),
  });
};

// Default schema instance - will be populated with cast files when imported in Studio
export const asciiPlayerSchema = createAsciiPlayerSchema();
