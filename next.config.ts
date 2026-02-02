import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.heygen.com",
      },
      {
        protocol: "https",
        hostname: "heygen.com",
      },
      {
        protocol: "https",
        hostname: "cdn.heygen.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
