import type { NextConfig } from "next";

const devOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ?? [];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
