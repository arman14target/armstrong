import type { NextConfig } from "next";

// Static export, same as the main frontend. Served by Vercel (root = admin/).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
