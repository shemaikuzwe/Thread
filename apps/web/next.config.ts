import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return [];
    }
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
