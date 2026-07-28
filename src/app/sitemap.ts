import type { MetadataRoute } from "next";

import { absoluteUrl, publicRoutes } from "@/app/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    priority: route.priority,
    changeFrequency: "weekly",
  }));
}
