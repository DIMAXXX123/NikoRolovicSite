import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip static generation for pages that need runtime env vars
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
