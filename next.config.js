/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Next.js 15 compatibility
  experimental: {
    // Enable better debugging
  },
  // Ensure proper client-side rendering for auth components
  reactStrictMode: true,
  // Fix for core-js and other dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Suppress the workspace warning
  outputFileTracingRoot: process.cwd(),
}

module.exports = nextConfig
