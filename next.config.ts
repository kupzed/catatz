import type { NextConfig } from "next";
import { environment } from "./src/configs/environment";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: environment.allowedDevOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: environment.allowedDevOrigins,
    },
  },
};

export default nextConfig;
