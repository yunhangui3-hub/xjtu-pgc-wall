import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages serves static files. All application data access happens
  // in the browser through Supabase, so this app can be safely exported.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
