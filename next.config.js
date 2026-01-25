/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Environment variables validation happens at build time
  // See src/lib/env/public.ts and src/lib/env/server.ts
}

module.exports = nextConfig
