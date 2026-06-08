import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to a folder of plain static files (./out) so it can be served by
  // any web server on Hetzner — no Node runtime to keep alive.
  output: "export",
  // next/image optimization needs a server; disable it for static hosting.
  images: { unoptimized: true },
  // Serve clean URLs as directories (e.g. /index.html) behind the proxy.
  trailingSlash: true,
};

export default nextConfig;
