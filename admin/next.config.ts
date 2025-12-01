import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Désactiver la télémétrie et optimiser pour un vieux PC
  reactStrictMode: false,

  // Résoudre le warning des lockfiles multiples
  outputFileTracingRoot: path.join(__dirname, "../"),

  // Optimiser les images externes (RainbowKit chain icons)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Ignorer les erreurs ESLint pendant le dev pour aller plus vite
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignorer les erreurs TypeScript pendant le dev
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignorer pino-pretty (dépendance optionnelle de WalletConnect)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals = [...(config.externals || []), "pino-pretty"];
    return config;
  },
};

export default nextConfig;
