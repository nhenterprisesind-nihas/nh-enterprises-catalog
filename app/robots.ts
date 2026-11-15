import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/businessProfile";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
