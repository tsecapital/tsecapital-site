import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

// Required for output: 'export' — prerender to a static sitemap.xml at build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      lastModified: "2026-06-08",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
