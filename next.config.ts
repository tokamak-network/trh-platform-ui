import type { NextConfig } from "next";

// Helper to ensure API URL has protocol
const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) return "http://localhost:8000";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${getApiBaseUrl()}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
