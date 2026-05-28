import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use "export" for static APK builds (BUILD_TARGET=apk), "standalone" for server
  output: process.env.BUILD_TARGET === "apk" ? "export" : "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Required for static export: use trailing slashes so all routes resolve correctly
  trailingSlash: process.env.BUILD_TARGET === "apk" ? true : undefined,
};

export default nextConfig;
