"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { saveOrder } from "@/lib/orders";

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

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

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

  const handleQuantityInput = (productName: string, value: string, priceType: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    const minQty = priceType === "wholesale" ? MOQ_WHOLESALE : 1;
    updateQuantity(productName, Math.max(num, minQty));
  };

  const generateOrderNumber = () => {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    "NH" +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    "0001"
  );
};
  const generateWhatsAppMessage = (orderNo: string) => {
  const now = new Date();

  const pad = (n: number, len = 2) => String(n).padStart(len, "0");

  const orderDate = `${pad(now.getDate())}-${now.toLocaleString("en-IN", {
    month: "short",
  })}-${now.getFullYear()}`;

  const orderTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  let message = "";

  message += "🛍️ *NH ENTERPRISES*\n";
  message += "══════════════════════\n";
  message += "*ORDER REQUEST*\n";
  message += "══════════════════════\n\n";

  message += `*Order No* : ${orderNo}\n`;
  message += `*Order Date* : ${orderDate}\n`;
  message += `*Order Time* : ${orderTime}\n\n`;

  message += "📦 *ITEMS ORDERED*\n";
  message += "-----------------------------------------\n";
  message += "Sl | Product | Qty | Amount\n";
  message += "-----------------------------------------\n";

  items.forEach((item, index) => {
    const price = getItemPrice(item);
    const amount = price * item.quantity;

    message += `${index + 1}. ${item.product.name}\n`;
    message += `    Qty: ${item.quantity}    Amount: ₹${amount.toLocaleString(
      "en-IN"
    )}\n`;
  });

  message += "-----------------------------------------\n";
  message += `*TOTAL BILL VALUE : ₹${totalAmount.toLocaleString("en-IN")}*\n\n`;

  message += "👤 *CUSTOMER DETAILS*\n";
  message += `Name : ${customerName || ""}\n`;
  message += `Mobile : ${customerPhone || ""}\n`;
  message += `Address : ${customerAddress || ""}\n\n`;

  message += "📝 *NOTE*\n";
  message +=
    "• Shipping charges are extra and will be calculated based on delivery location, package size and package weight.\n";
  message +=
    "• Final order value will be confirmed before dispatch.\n\n";

  message += "Thank you for choosing *NH ENTERPRISES* 🙏";

  return encodeURIComponent(message);
};

const handleSubmitOrder = async () => {
  try {
    const orderNo = generateOrderNumber();

    await saveOrder({
      orderNo,
      customerName,
      phone: customerPhone,
      address: customerAddress,
      pincode: "",
      subtotal: totalAmount,
      shipping: 0,
      grandTotal: totalAmount,
      items: items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: getItemPrice(item),
      })),
    });

    const whatsappNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

    const message = generateWhatsAppMessage(orderNo);

    window.open(
      `https://wa.me/${whatsappNumber}?text=${message}`,
      "_blank"
    );

    clearCart();

  } catch (error) {
    console.error(error);
    alert("Unable to save your order. Please try again.");
  }
};

  return (
    <>
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-all hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  <p className="text-gray-400 text-lg">Your cart is empty</p>
                  <p className="text-gray-300 text-sm mt-1">Add some products to get started!</p>
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
                        className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                      >
                        <div className="flex items-start gap-3">
                          {/* Product Image */}
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                            {item.product.images[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-gray-800 font-medium text-sm truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-gray-500 text-xs capitalize">
                              {item.priceType} · ₹{price.toLocaleString("en-IN")}/pc
                            </p>
                            {item.priceType === "wholesale" && (
                              <p className="text-amber-600 text-xs font-medium">MOQ: 10 units</p>
                            )}
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.product.name)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
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
                          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
                            <button
                              onClick={() => updateQuantity(item.product.name, item.quantity - 1)}
                              disabled={item.quantity <= minQty}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm disabled:opacity-30"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={minQty}
                              value={item.quantity}
                              onChange={(e) => handleQuantityInput(item.product.name, e.target.value, item.priceType)}
                              className="w-12 text-center text-sm text-gray-800 border-x border-gray-200 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateQuantity(item.product.name, item.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-gray-900 font-semibold text-sm">
                            ₹{subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-gray-500 text-sm">
                      <span>Items</span>
                      <span>{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-bold text-lg">
                      <span>Total</span>
                      <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Customer Info Form */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-gray-800 font-semibold text-sm mb-3">Delivery Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Customer Name *</label>
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Shipping Address *</label>
                        <textarea
                          placeholder="Full delivery address with pincode"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleSubmitOrder}
                      disabled={!customerName || !customerPhone}
                      className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Submit Order via WhatsApp
                    </button>
                    {(!customerName || !customerPhone) && items.length > 0 && (
                      <p className="text-xs text-amber-600 text-center">Please fill in Name and Phone to place order</p>
                    )}
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-100 text-gray-600 font-medium text-sm py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
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
