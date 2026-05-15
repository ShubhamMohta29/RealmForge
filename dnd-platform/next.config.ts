import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // next.js dev uses inline scripts; in prod these are hashed automatically
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Supabase realtime + storage + auth
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.groq.com`,
      // Google fonts loaded by next/font
      "font-src 'self' https://fonts.gstatic.com data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? '',
  project: process.env.SENTRY_PROJECT ?? '',
  // Upload source maps in CI only — avoids slow local builds
  silent: !process.env.CI,
  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,
  // Tunnels Sentry requests through your own domain to avoid ad-blocker interference
  tunnelRoute: '/monitoring',
  // Skip source map upload if credentials are not set
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
