declare module "asciinema-player" {
  export interface PlayerOptions {
    autoPlay?: boolean;
    loop?: boolean;
    fit?: "width" | "height" | "both" | "none";
    theme?: string;
    terminalFontSize?: "small" | "medium" | "large" | "big";
    pauseOnMarkers?: boolean;
    controls?: boolean;
    logger?: unknown;
  }

  export interface Player {
    el: HTMLElement;
    dispose: () => void;
    getCurrentTime: () => Promise<number>;
    getDuration: () => Promise<number>;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    seek: (pos: number) => Promise<void>;
    addEventListener: (name: string, callback: () => void) => void;
  }

  export function create(
    src: string,
    elem: HTMLElement,
    opts?: PlayerOptions
  ): Player;
}
