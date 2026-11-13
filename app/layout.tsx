import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/context/CartContext";
import { WhatsAppProductProvider } from "@/context/WhatsAppProductContext";
import { createThemeBootstrapScript } from "@/lib/festivalThemes";
import BannerBar from "@/components/BannerBar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { BUSINESS_PROFILE, SITE_URL } from "@/lib/businessProfile";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "NH Enterprises | Online Retail",
  description:
    "Discover curated jewellery, sarees, clothing, books, gifts and everyday essentials. Shop with confidence through NH Enterprises.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BUSINESS_PROFILE.name,
    title: "NH Enterprises | Online Retail",
    description:
      "Discover More. Celebrate Every Occasion. Shop with Confidence.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "NH Enterprises | Online Retail",
    description:
      "Discover More. Celebrate Every Occasion. Shop with Confidence.",
  },
};

const themeBootstrapScript = createThemeBootstrapScript(
  process.env.NEXT_PUBLIC_FORCE_THEME
);

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BUSINESS_PROFILE.name,
  url: SITE_URL,
  email: BUSINESS_PROFILE.email,
  telephone: BUSINESS_PROFILE.whatsappDisplay,
  taxID: BUSINESS_PROFILE.gstin,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Mogappair West",
    addressLocality: "Chennai",
    postalCode: "600037",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased bg-surface text-ink">
        <WhatsAppProductProvider>
          <CartProvider>
            <BannerBar />
            {children}
            <WhatsAppButton />
          </CartProvider>
        </WhatsAppProductProvider>
        <Analytics />
      </body>
    </html>
  );
}
