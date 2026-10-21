import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets the e2e smoke test run its own dev server without colliding with a
  // dev server already running in this directory (Next 16 locks per distDir).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
