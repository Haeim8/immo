/** @type {import('next').NextConfig} */
const nextConfig = {
  // Résoudre le warning des lockfiles multiples
  outputFileTracingRoot: __dirname,

  // Exclude admin folder from the main app build
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Ignorer les modules optionnels de pino (utilisés par WalletConnect)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Ignorer pino-pretty car c'est une dépendance optionnelle
    config.externals = config.externals || [];
    config.externals.push('pino-pretty');

    // Exclude admin folder from compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/admin/**', '**/node_modules/**'],
    };

    return config;
  },
};

module.exports = nextConfig;
