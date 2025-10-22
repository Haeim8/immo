import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.mypinata.cloud",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
    ],
  },
  typescript: {
    // Temporary workaround for Next.js 15 metadata-interface bug
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      crypto: false,
      stream: false,
      process: false,
    };
    return config;
  },
};

export default nextConfig;
