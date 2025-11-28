import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure jsreport and its dependencies are only used on server side
  // This works with both Turbopack and webpack in Next.js 16
  serverExternalPackages: [
    '@jsreport/jsreport-core',
    '@jsreport/jsreport-chrome-pdf',
    '@jsreport/jsreport-handlebars',
    'emitter',
    'batch',
    'pdf-parse',
  ],
  
  // Suppress Turbopack performance measurement warnings in development
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
