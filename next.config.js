/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Next.js 15 compatibility
  experimental: {
    // Enable better debugging
  },
  // Ensure proper client-side rendering for auth components
  reactStrictMode: true,
}

module.exports = nextConfig
