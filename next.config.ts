import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  ...(process.env.LAMARA_NEXT_DIST_DIR ? { devIndicators: false } : {}),
  ...(process.env.LAMARA_NEXT_DIST_DIR
    ? { distDir: process.env.LAMARA_NEXT_DIST_DIR }
    : {}),
};

export default nextConfig;
