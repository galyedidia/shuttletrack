import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

// Configure next-pwa once, then wrap your Next config with it
const withPWA = withPWAInit({
  dest: 'public',          // service worker + precache manifest output
  register: true,          // auto register SW
  skipWaiting: true,       // activate new SW immediately
  disable: process.env.NODE_ENV === 'development', // SW only in production
});

const nextConfig: NextConfig = {
  // --- your existing options ---
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
    ],
  },
};

export default withPWA(nextConfig);
