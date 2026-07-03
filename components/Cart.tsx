"use client";

import React from "react";
import { useCart } from "@/context/CartContext";

export default function Cart() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const MOQ_WHOLESALE = 10;

  const getItemPrice = (item: (typeof items)[0]) => {
    switch (item.priceType) {
      case "wholesale":
        return item.product.wholesale_price;
      case "retail":
        return item.product.retail_price;
      default:
        return item.product.mrp;
    }
  };

  const generateWhatsAppMessage = () => {
    let message = "🛒 *New Order*\n\n";
    message += "━━━━━━━━━━━━━━━━━━\n";

    items.forEach((item, index) => {
      const price = getItemPrice(item);
      const subtotal = price * item.quantity;
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   Qty: ${item.quantity} × ₹${price.toLocaleString("en-IN")} (${item.priceType})\n`;
      message += `   Subtotal: ₹${subtotal.toLocaleString("en-IN")}\n\n`;
    });

    message += "━━━━━━━━━━━━━━━━━━\n";
    message += `*Total Items:* ${totalItems}\n`;
    message += `*Grand Total:* ₹${totalAmount.toLocaleString("en-IN")}\n\n`;
    message += "Please confirm availability and delivery details. 🙏";

    return encodeURIComponent(message);
  };

  const handleSubmitOrder = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
    const message = generateWhatsAppMessage();
    const url = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gold-400 text-maroon-900 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-gold-300 transition-all hover:scale-110"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-gradient-to-b from-maroon-900 to-maroon-950 h-full overflow-y-auto shadow-2xl border-l border-gold-400/20">
            {/* Header */}
            <div className="sticky top-0 bg-maroon-900/95 backdrop-blur-sm p-4 border-b border-gold-400/20 flex items-center justify-between">
              <h2 className="text-gold-400 font-serif text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                  />
                </svg>
                Your Cart ({totalItems})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-maroon-300 hover:text-gold-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-maroon-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  <p className="text-maroon-400 text-lg">Your cart is empty</p>
                  <p className="text-maroon-500 text-sm mt-1">Add some premium products!</p>
                </div>
              ) : (
                <>
                  {items.map((item) => {
                    const price = getItemPrice(item);
                    const subtotal = price * item.quantity;
                    const minQty = item.priceType === "wholesale" ? MOQ_WHOLESALE : 1;

                    return (
                      <div
                        key={item.product.name}
                        className="bg-maroon-800/50 rounded-lg p-3 border border-gold-400/10"
                      >
                        <div className="flex items-start gap-3">
                          {/* Product Image */}
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-maroon-700 flex-shrink-0">
                            {item.product.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gold-400/30">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-gold-300 font-medium text-sm truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-maroon-300 text-xs capitalize">
                              {item.priceType} · ₹{price.toLocaleString("en-IN")}/pc
                            </p>
                            {item.priceType === "wholesale" && (
                              <p className="text-yellow-500 text-xs">MOQ: {MOQ_WHOLESALE}</p>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.product.name)}
                            className="text-maroon-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gold-400/20 rounded-md overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.name, item.quantity - 1)}
                              disabled={item.quantity <= minQty}
                              className="px-2 py-1 text-gold-400 hover:bg-maroon-700 transition-colors text-sm disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="px-2 py-1 text-gold-300 text-sm min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.name, item.quantity + 1)}
                              className="px-2 py-1 text-gold-400 hover:bg-maroon-700 transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-gold-400 font-semibold text-sm">
                            ₹{subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div className="border-t border-gold-400/20 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between text-maroon-200">
                      <span>Items</span>
                      <span>{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-gold-400 font-bold text-lg">
                      <span>Total</span>
                      <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleSubmitOrder}
                      className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Submit Order via WhatsApp
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full btn-maroon text-sm py-2"
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
