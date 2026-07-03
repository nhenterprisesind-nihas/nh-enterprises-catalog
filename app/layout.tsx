import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIKSHAS Online Shop",
  description: "Premium product catalog with wholesale pricing",
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
