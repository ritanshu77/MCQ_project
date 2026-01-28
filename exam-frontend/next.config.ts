import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Try root level first (Next.js 15.2.3+)
  allowedDevOrigins: ['localhost','172.19.160.1'],
  
  // OR if above fails, use experimental:
  // experimental: {
  //   allowedDevOrigins: ['172.19.160.1', 'localhost:3001']
  // }
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${process.env.BACKEND_PORT || 3001}/:path*`,
      },
      // Auth routes direct mapping if they are not under /api (e.g. /auth/...)
      // But in your code they seem to be under /api/auth or accessed via full URL.
      // Based on code search, you use full URL in some places, but we should encourage /api usage.
      // For now, let's also map /auth if it exists at root, but your structure has src/app/api/auth.
      // So /api proxy covers it.
    ]
  },
}

export default nextConfig
