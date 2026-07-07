/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  serverExternalPackages: ['pino', 'pino-pretty'],

  // Webpack config to handle Node.js modules used by Stacks libraries
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Stacks libraries reference Node.js modules that don't exist in the browser
      // We polyfill/ignore them for client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
