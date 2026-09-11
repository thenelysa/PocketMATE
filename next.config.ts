import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Google account avatars returned by the OAuth credential.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
