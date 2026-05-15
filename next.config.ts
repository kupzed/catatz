import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { environment } from "./src/configs/environment";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  cacheOnNavigation: true,
  register: false,
  additionalPrecacheEntries: [{ url: "/offline.html", revision: null }],
  globPublicPatterns: ["**/*.{html,ico,json,png,svg,webmanifest}"],
});

const nextConfig: NextConfig = {
  // Serwist is used because @serwist/next 9.5.11 peers Next >=14, React >=18, and TS >=5.
  // @ducanh2912/next-pwa also peers Next >=14, but still requires webpack >=5.
  // CatatZ keeps Turbopack config for the app, while the production build script uses
  // `next build --webpack` because @serwist/next emits sw.js through the webpack plugin.
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

export default withSerwist(nextConfig);
