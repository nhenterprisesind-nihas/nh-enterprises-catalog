"use client";

import { trackEvent } from "@/lib/trackEvent";
import { useWhatsAppProduct } from "@/context/WhatsAppProductContext";
import { buildProductMessage, getWhatsAppUrl } from "@/lib/whatsapp";

export default function WhatsAppButton() {
  const { product } = useWhatsAppProduct();
  const message = product
    ? buildProductMessage(product)
    : "Hi, I'm interested in your products.";

  return (
    <a
      href={getWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onClick={() => trackEvent("wa-floating-click")}
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-105 hover:bg-[#20BD5A]"
    >
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.55 0 .22 5.32.22 11.87c0 2.1.55 4.15 1.6 5.96L.12 24l6.31-1.66a11.9 11.9 0 0 0 5.67 1.44h.01c6.55 0 11.88-5.33 11.89-11.88a11.8 11.8 0 0 0-3.48-8.42ZM12.1 21.76a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.52-5.26c0-5.46 4.45-9.9 9.92-9.9a9.84 9.84 0 0 1 7.01 2.9 9.84 9.84 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.92 9.91Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.48.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
