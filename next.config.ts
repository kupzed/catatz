import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";
import { environment } from "./src/configs/environment";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  reloadOnOnline: true,
  cacheOnNavigation: true,
  register: false,
  additionalPrecacheEntries: [{ url: "/offline.html", revision: null }],
  globPublicPatterns: ["**/*.{html,ico,json,png,svg,webmanifest}"],
});

const isDevelopment = process.env.NODE_ENV === "development";
const allowedDevOrigins = isDevelopment ? environment.allowedDevOrigins : [];

const nextConfig: NextConfig = {
  // Serwist is used because @serwist/next 9.5.11 peers Next >=14, React >=18, and TS >=5.
  // @ducanh2912/next-pwa also peers Next >=14, but still requires webpack >=5.
  // CatatZ keeps Turbopack config for the app, while the production build script uses
  // `next build --webpack` because @serwist/next emits sw.js through the webpack plugin.
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: allowedDevOrigins,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 390, 414, 640, 768, 1024, 1280],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        sideEffects: true,
        usedExports: true,
      };
    }

    return config;
  },
};

export default withSerwist(withBundleAnalyzer(nextConfig));
