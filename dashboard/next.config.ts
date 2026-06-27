import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.join(process.cwd(), "..");

const nextConfig: NextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: projectRoot,
  turbopack: {
    // Allow compiling the parent Remotion project's source (../src) so the live
    // <Player> can render this project's compositions. A single copy of
    // React/Remotion is guaranteed by the pnpm workspace (see pnpm-workspace.yaml).
    root: projectRoot,
  },
};

export default nextConfig;
