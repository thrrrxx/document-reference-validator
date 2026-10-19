import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      frame-src 'self' https://challenges.cloudflare.com;
      connect-src 'self' https://challenges.cloudflare.com;
    `.replace(/\s{2,}/g, ' ').trim(),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Terapkan header keamanan untuk seluruh rute
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
