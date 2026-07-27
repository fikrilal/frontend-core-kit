import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // React <ViewTransition> during App Router navigations (login ↔ register, etc.)
    viewTransition: true,
  },
};

export default nextConfig;
