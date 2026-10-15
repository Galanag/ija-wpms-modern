import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '4000' }] }
};
export default nextConfig;
