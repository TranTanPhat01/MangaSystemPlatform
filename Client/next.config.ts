import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow CI/local builds to use an isolated output directory when the
     default .next folder is locked by a file synchronizer. */
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
