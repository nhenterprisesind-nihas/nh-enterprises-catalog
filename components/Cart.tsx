"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAvailableStock, useCart } from "@/context/CartContext";
import { saveOrder } from "@/lib/orders";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { normalizeIndianMobileNumber } from "@/lib/indian-mobile";
import { CONFIRM_WITHIN } from "@/lib/orderMessages";
import { supabase } from "@/lib/supabase";

type OrderConfirmation = {
  orderNo: string;
  phone: string;
  items: { name: string; quantity: number; amount: number }[];
  total: number;
  signedIn: boolean;
  profileSaveError: string;
};

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
    cartNotice,
    dismissCartNotice,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedInName, setSignedInName] = useState("");
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [returnToCartPath, setReturnToCartPath] = useState("/");
  const [phoneError, setPhoneError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const profileFieldsTouched = useRef({
    name: false,
    phone: false,
    address: false,
    pincode: false,
  });

  useEffect(() => {
    let active = true;
    setReturnToCartPath(
      `${window.location.pathname}${window.location.search}`
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSignedIn(false);
        setSignedInName("");
      }
    });

    void supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (!active) return;
        setAuthChecked(true);
        if (error) {
          console.error("Could not check checkout account status.");
          return;
        }
        if (!data.user) return;

        setSignedIn(true);
        const metadataName =
          typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : typeof data.user.user_metadata?.name === "string"
              ? data.user.user_metadata.name
              : "";
        const displayName = metadataName.trim() || "your account";
        setSignedInName(displayName);

        try {
          const response = await fetch("/api/account/profile", {
            cache: "no-store",
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Unable to load saved details.");
          }

          if (!active) return;
          const profile = result.profile;
          const profileName =
            typeof profile.full_name === "string" ? profile.full_name : "";
          if (!profileFieldsTouched.current.name) {
            setCustomerName(profileName);
          }
          if (!profileFieldsTouched.current.phone) {
            setCustomerPhone(profile.phone ?? "");
          }
          if (!profileFieldsTouched.current.address) {
            setCustomerAddress(profile.address ?? "");
          }
          if (!profileFieldsTouched.current.pincode) {
            setCustomerPincode(profile.pincode ?? "");
          }
          setSignedInName(profileName || displayName);
        } catch {
          if (active) {
            setProfileLoadError(
              "Saved details couldn't be loaded. You can enter them below."
            );
          }
        }
      })
      .catch(() => {
        if (active) {
          console.error("Could not check checkout account status.");
          setAuthChecked(true);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const handleQuantityInput = (productName: string, value: string) => {
    if (value.trim() === "") return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    updateQuantity(productName, num);
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

  const handleSubmitOrder = async () => {
    const normalizedPhone = normalizeIndianMobileNumber(customerPhone);
    if (!normalizedPhone) {
      setPhoneError(
        "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
      );
      return;
    }

    setPhoneError("");
    setSubmitError("");
    try {
      const orderNo = generateOrderNumber();

      const savedOrder = await saveOrder({
        orderNo,
        customerName,
        phone: normalizedPhone,
        address: customerAddress,
        pincode: customerPincode,
        subtotal: totalAmount,
        shipping: 0,
        grandTotal: totalAmount,
        items: items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: getItemPrice(item),
        })),
      });

      let profileSaveError = "";
      const accountOrder = savedOrder.accountOrder === true;
      if (accountOrder && saveAddressToAccount) {
        try {
          const response = await fetch("/api/account/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: customerName,
              phone: normalizedPhone,
              address: customerAddress,
              pincode: customerPincode,
            }),
          });
          if (!response.ok) {
            profileSaveError =
              "Your order was placed, but we couldn't save these details to your account.";
          }
        } catch {
          profileSaveError =
            "Your order was placed, but we couldn't save these details to your account.";
        }
      }

      setConfirmation({
        orderNo,
        phone: normalizedPhone,
        items: items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          amount: getItemPrice(item) * item.quantity,
        })),
        total: totalAmount,
        signedIn: accountOrder,
        profileSaveError,
      });
      clearCart();
      setIsCartOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save your order. Please try again."
      );
    }
  };

  return (
    <>
      {confirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-confirmation-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                ✓
              </div>
              <h2
                id="order-confirmation-title"
                className="mt-4 text-2xl font-bold text-gray-900"
              >
                Order placed
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Order number: <span className="font-semibold">{confirmation.orderNo}</span>
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Order summary</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {confirmation.items.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="flex justify-between gap-4"
                  >
                    <span>{item.name} × {item.quantity}</span>
                    <span className="shrink-0 font-medium">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-900">
                <span>Total</span>
                <span>₹{confirmation.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              Confirmation will be sent to <span className="font-semibold">+91 {confirmation.phone}</span>.
            </p>
            <p className="mt-3 text-sm text-gray-700">
              We&apos;ll message you on WhatsApp shortly to confirm your order.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Expected {CONFIRM_WITHIN}.
            </p>
            {confirmation.profileSaveError && (
              <p className="mt-3 text-sm text-amber-800" role="status">
                {confirmation.profileSaveError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={getWhatsAppUrl(`Hi, I placed order ${confirmation.orderNo}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-green-600 px-4 py-2 text-center font-semibold text-green-700 hover:bg-green-50"
              >
                Message us on WhatsApp
              </a>
              {confirmation.signedIn && (
                <Link
                  href={`/account/orders/${encodeURIComponent(confirmation.orderNo)}`}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-brand-dark px-4 py-2 text-center font-semibold text-brand-dark hover:bg-brand-soft"
                >
                  View in my account
                </Link>
              )}
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="min-h-11 flex-1 rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-dark"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-brand text-on-brand w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-brand-dark hover:text-brand-soft transition-all hover:scale-105"
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
                <svg className="w-5 h-5 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {cartNotice && (
                <div
                  className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                  role="status"
                >
                  <p>{cartNotice}</p>
                  <button
                    type="button"
                    onClick={dismissCartNotice}
                    aria-label="Dismiss cart update notice"
                    className="shrink-0 font-semibold text-amber-700 hover:text-amber-900"
                  >
                    ×
                  </button>
                </div>
              )}
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
                    const availableStock = getAvailableStock(item.product.stock);

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
                              disabled={item.quantity <= 1}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm disabled:opacity-30"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={availableStock}
                              value={item.quantity}
                              onChange={(e) => handleQuantityInput(item.product.name, e.target.value)}
                              onBlur={() => updateQuantity(item.product.name, item.quantity)}
                              className="w-12 text-center text-sm text-gray-800 border-x border-gray-200 py-1 focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateQuantity(item.product.name, item.quantity + 1)}
                              disabled={item.quantity >= availableStock}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-sm disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                          {item.quantity >= availableStock && (
                            <p className="text-amber-600 text-xs">
                              Only {availableStock} available
                            </p>
                          )}
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
                    {signedIn ? (
                      <div className="mb-3 rounded-lg bg-brand-soft/40 px-3 py-2 text-xs text-brand-dark">
                        Signed in as{" "}
                        <span className="font-semibold">{signedInName}</span>
                      </div>
                    ) : (
                      authChecked && (
                        <p className="mb-3 text-xs text-gray-600">
                          <Link
                            href={`/account/login?next=${encodeURIComponent(returnToCartPath)}`}
                            className="font-semibold text-brand-dark underline underline-offset-2"
                          >
                            Sign in to track your order
                          </Link>
                        </p>
                      )
                    )}
                    {profileLoadError && signedIn && (
                      <p className="mb-3 text-xs text-amber-800" role="status">
                        {profileLoadError}
                      </p>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="checkout-customer-name" className="block text-xs text-gray-500 mb-1">Customer Name *</label>
                        <input
                          id="checkout-customer-name"
                          type="text"
                          placeholder="Your full name"
                          value={customerName}
                          onChange={(e) => {
                            profileFieldsTouched.current.name = true;
                            setCustomerName(e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-customer-phone" className="block text-xs text-gray-500 mb-1">Phone Number *</label>
                        <input
                          id="checkout-customer-phone"
                          type="tel"
                          placeholder="e.g. +91 9876543210"
                          value={customerPhone}
                          onChange={(e) => {
                            profileFieldsTouched.current.phone = true;
                            setCustomerPhone(e.target.value);
                            if (normalizeIndianMobileNumber(e.target.value)) {
                              setPhoneError("");
                            }
                          }}
                          onBlur={() => {
                            if (
                              customerPhone &&
                              !normalizeIndianMobileNumber(customerPhone)
                            ) {
                              setPhoneError(
                                "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
                              );
                            }
                          }}
                          aria-invalid={Boolean(phoneError)}
                          aria-describedby={
                            phoneError
                              ? "checkout-phone-hint checkout-phone-error"
                              : "checkout-phone-hint"
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                        <p id="checkout-phone-hint" className="mt-1 text-xs text-gray-500">
                          We&apos;ll contact you on WhatsApp on this number about your order.
                        </p>
                        {phoneError && (
                          <p
                            id="checkout-phone-error"
                            className="mt-1 text-xs text-red-600"
                            role="alert"
                          >
                            {phoneError}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="checkout-customer-address" className="block text-xs text-gray-500 mb-1">Shipping Address *</label>
                        <textarea
                          id="checkout-customer-address"
                          placeholder="Full delivery address with pincode"
                          value={customerAddress}
                          onChange={(e) => {
                            profileFieldsTouched.current.address = true;
                            setCustomerAddress(e.target.value);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-customer-pincode" className="block text-xs text-gray-500 mb-1">Pincode</label>
                        <input
                          id="checkout-customer-pincode"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          value={customerPincode}
                          onChange={(e) => {
                            profileFieldsTouched.current.pincode = true;
                            setCustomerPincode(e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      </div>
                      {signedIn && (
                        <label className="flex min-h-11 items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={saveAddressToAccount}
                            onChange={(event) =>
                              setSaveAddressToAccount(event.target.checked)
                            }
                            className="h-4 w-4 accent-brand-dark"
                          />
                          Save this address to my account
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleSubmitOrder}
                      disabled={!customerName || !customerPhone}
                      className="w-full bg-brand text-on-brand font-semibold py-3 rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg aria-hidden="true" className="hidden" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Place Order
                    </button>
                    {submitError && (
                      <p className="text-xs text-red-600" role="alert">
                        {submitError}
                      </p>
                    )}
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
