import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Try root level first (Next.js 15.2.3+)
  allowedDevOrigins: ['localhost','172.19.160.1'],
  
  // OR if above fails, use experimental:
  // experimental: {
  //   allowedDevOrigins: ['172.19.160.1', 'localhost:3001']
  // }
}

export default nextConfig