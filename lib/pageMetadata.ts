import type { Metadata } from "next";
import { BUSINESS_PROFILE, SITE_URL } from "@/lib/businessProfile";

export function createPageMetadata(
  path: string,
  title: string,
  description: string
): Metadata {
  const fullTitle = `${title} | ${BUSINESS_PROFILE.name}`;
  const url = new URL(path, SITE_URL).toString();

  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: BUSINESS_PROFILE.name,
      title: fullTitle,
      description,
      url,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}
