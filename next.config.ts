import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
