import type { Metadata } from "next";
import CatalogClient from "@/components/CatalogClient";
import JsonLd from "@/components/JsonLd";
import {
  BUSINESS_PROFILE,
  BUSINESS_SOCIAL_LINKS,
  SITE_URL,
} from "@/lib/businessProfile";
import { getProducts } from "@/lib/products";
import type { Product } from "@/context/CartContext";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "NH Enterprises | Online Retail",
  description:
    "Discover curated jewellery, sarees, clothing, books, gifts and everyday essentials. Shop with confidence through NH Enterprises.",
  alternates: { canonical: "/" },
};

const logoUrl = new URL("/icon.png", SITE_URL).toString();

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: BUSINESS_PROFILE.name,
      url: SITE_URL,
      logo: logoUrl,
      sameAs: BUSINESS_SOCIAL_LINKS,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: BUSINESS_PROFILE.email,
      },
    },
    {
      "@type": "WebSite",
      name: BUSINESS_PROFILE.name,
      url: SITE_URL,
    },
  ],
};

export default async function HomePage() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return (
    <>
      <JsonLd data={homeStructuredData} />
      <CatalogClient initialProducts={products} />
    </>
  );
}
