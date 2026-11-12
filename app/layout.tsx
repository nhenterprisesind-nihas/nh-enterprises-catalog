import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/context/CartContext";
import { WhatsAppProductProvider } from "@/context/WhatsAppProductContext";
import { createThemeBootstrapScript } from "@/lib/festivalThemes";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://nh-enterprises-catalog.vercel.app"
  ),
  title: "NIKSHAS Online Shop",
  description: "Premium Product Catalog with Retail & Wholesale Pricing",
};

const themeBootstrapScript = createThemeBootstrapScript(
  process.env.NEXT_PUBLIC_FORCE_THEME
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased bg-surface text-ink">
        <WhatsAppProductProvider>
          <CartProvider>
            {children}
            <WhatsAppButton />
          </CartProvider>
        </WhatsAppProductProvider>
        <Analytics />
      </body>
    </html>
  );
}
