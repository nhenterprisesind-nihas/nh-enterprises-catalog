import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/context/CartContext";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://nh-enterprises-catalog.vercel.app"
  ),
  title: "NIKSHAS Online Shop",
  description: "Premium Product Catalog with Retail & Wholesale Pricing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased bg-gray-50">
        <CartProvider>
          {children}
          <WhatsAppButton />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
