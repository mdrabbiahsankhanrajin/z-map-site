import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: { cpus: 2 },
  ...(process.env.GITHUB_PAGES === "true" ? {
    output: "export" as const,
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/z-map",
    trailingSlash: true,
  } : {}),
};

export default nextConfig;
