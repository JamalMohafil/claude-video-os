import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // The dashboard reads/writes the parent Remotion project's files.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
