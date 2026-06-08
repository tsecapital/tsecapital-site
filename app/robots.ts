import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

// Required for output: 'export' — prerender to a static robots.txt at build.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
