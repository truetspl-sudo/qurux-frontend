"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";

type CartItem = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  qty: number;
};

type CheckoutStep = "cart" | "details" | "payment" | "confirmation";

type CheckoutMethod = "full" | "emi" | "bob" | "mixed";

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>("details");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<CheckoutMethod>("full");

  // Contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Order confirmation
  const [orderId, setOrderId] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("qurux_cart") || "[]");
    setCart(stored);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  function removeItem(id: string) {
    const updated = cart.filter((c) => c.id !== id);
    setCart(updated);
    localStorage.setItem("qurux_cart", JSON.stringify(updated));
  }

  function updateQty(id: string, delta: number) {
    const updated = cart.map((c) =>
      c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c
    );
    setCart(updated);
    localStorage.setItem("qurux_cart", JSON.stringify(updated));
  }

  // Step 1 → create order FIRST (paymentStatus PENDING — no auto-PAID),
  // then the real PaymentForm submits the UPI proof against that orderId.
  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setOrderSaving(true);
    setSaveError("");
    try {
      const methodMap: Record<string, string> = {
        full: "FULL",
        emi: "EMI",
        bob: "BOB",
        mixed: "MIXED",
      };

      const res = await apiPost<any>("/orders", {
        items: cart.map((c) => ({
          productId: c.id,
          quantity: c.qty,
        })),
        deliveryAddress: address,
        paymentMethod: methodMap[method] || "FULL",
        customerName: name,
        customerPhone: phone,
      });

      if (res.ok && res.data?.order?.orderId) {
        setOrderId(res.data.order.orderId);
        // RULE: koi payment gateway nahi — order submit hote hi PENDING.
        // Payment/dispatch admin WhatsApp pe manually confirm karta hai,
        // bilkul jaise admin service bookings closure pe update karta hai.
        setPaymentDone(true);
        setStep("confirmation");
        localStorage.removeItem("qurux_cart");
      } else {
        setSaveError(
          res.status === 401 || res.status === 403
            ? "Order banane ke liye login zaroori hai. Pehle /account pe login karein."
            : res.message || "Order create nahi ho paya. Backend offline?"
        );
      }
    } catch {
      setSaveError("Order create nahi ho paya. Backend offline?");
    }
    setOrderSaving(false);
  }

  // (Manual model) Payment proof is not collected at order time — admin
  // confirms payment on WhatsApp and updates the order paymentStatus.

  // ── Empty Cart ──
  if (cart.length === 0 && !paymentDone) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl text-center">
          <div className="text-6xl">🛒</div>
          <h1 className="mt-6 text-3xl font-black text-gray-900">
            Your Cart is Empty
          </h1>
          <p className="mt-4 text-gray-500">
            Add some products from the ESSN Shop first.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700"
          >
            Browse Shop →
          </Link>
        </section>
      </main>
    );
  }

  // ── Confirmation ──
  if (step === "confirmation") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <section className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-black text-gray-900">
            Order Confirmed! 🎉
          </h1>
          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase text-gray-500">Order ID</p>
            <p className="mt-1 text-xl font-black text-pink-600">{orderId}</p>
          </div>
          {saveError && (
            <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-xs text-yellow-700">
              ⚠️ {saveError}
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Thank you, <strong>{name}</strong>! Your order request is submitted.
            Payment &amp; delivery ko admin WhatsApp pe manually confirm karega.
          </p>
          <div className="mt-4 rounded-2xl bg-green-50 p-4">
            <p className="text-xs font-bold text-green-700">📱 WHATSAPP DISPATCH</p>
            <p className="mt-1 text-sm text-green-700">
              Admin aapko WhatsApp pe payment &amp; delivery ke liye contact karega.
            </p>
          </div>
          <div className="mt-4 rounded-2xl bg-yellow-50 p-4">
            <p className="text-xs font-bold text-yellow-700">⏳ ORDER STATUS</p>
            <p className="mt-1 text-sm text-yellow-700">
              PENDING — Payment verify hone ke baad admin order status update karega.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href="/shop"
              className="rounded-full border border-pink-600 py-3 text-center text-sm font-bold text-pink-600 hover:bg-pink-50"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="rounded-full bg-pink-600 py-3 text-center text-sm font-bold text-white hover:bg-pink-700"
            >
              My Account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white py-14">
      <div className="mx-auto max-w-5xl px-6">

        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            CHECKOUT
          </p>
          <h1 className="mt-4 text-4xl font-black text-gray-900">
            Complete Your Order
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT: Form Area ── */}
          <div>
            {/* Step 1: Contact + Address + Payment Method */}
            {step === "details" && (
              <form onSubmit={handleDetailsSubmit} className="space-y-6">

                {/* Contact */}
                <section className="rounded-[30px] bg-white p-6 shadow-xl md:p-8">
                  <h2 className="text-xl font-black text-gray-900">Contact Details</h2>
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-800">Full Name *</label>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-800">Mobile Number *</label>
                      <input
                        required
                        type="tel"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10 digit mobile number"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      />
                    </div>
                  </div>
                </section>

                {/* Address */}
                <section className="rounded-[30px] bg-white p-6 shadow-xl md:p-8">
                  <h2 className="text-xl font-black text-gray-900">Delivery Address</h2>
                  <p className="mt-1 text-sm text-gray-500">Required for product delivery.</p>
                  <div className="mt-5">
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House No, Street, Landmark, City, Pincode"
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </section>

                {/* Payment Method */}
                <section className="rounded-[30px] bg-white p-6 shadow-xl md:p-8">
                  <h2 className="text-xl font-black text-gray-900">Payment Method</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "full" as const, label: "Full Payment", desc: "Pay complete amount now", icon: "💳" },
                      { key: "emi" as const, label: "No Cost EMI", desc: "25% down + 75% flexible EMI (weekly jitna ho)", icon: "📊" },
                      { key: "bob" as const, label: "Pay from BOB", desc: "Use your BOB wallet", icon: "🏦" },
                      { key: "mixed" as const, label: "Mixed / Split", desc: "Combine multiple methods", icon: "🔀" },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          method === opt.key
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-200 hover:border-pink-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payment"
                            value={opt.key}
                            checked={method === opt.key}
                            onChange={() => setMethod(opt.key)}
                            className="mt-1 h-4 w-4 accent-pink-600"
                          />
                          <div>
                            <span className="mr-2">{opt.icon}</span>
                            <span className="font-bold text-gray-900">{opt.label}</span>
                            <p className="mt-0.5 text-xs text-gray-600">{opt.desc}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Mixed Payment Inputs */}
                  {method === "mixed" && (
                    <div className="mt-5 rounded-2xl bg-gray-50 p-5 space-y-3">
                      <p className="text-sm font-bold text-gray-800">Split your payment:</p>
                      <div className="flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="text-sm text-gray-600">BOB Wallet</span>
                        <span className="text-sm font-bold text-green-700">₹0 available</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="text-sm text-gray-600">EMI Amount</span>
                        <input type="number" placeholder="₹0" className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-right outline-none focus:border-pink-500" />
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white p-3">
                        <span className="text-sm text-gray-600">Cash / UPI</span>
                        <input type="number" placeholder="₹0" className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-right outline-none focus:border-pink-500" />
                      </div>
                    </div>
                  )}
                </section>

                {/* Submit */}
                {saveError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    ❌ {saveError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={cart.length === 0 || orderSaving}
                  className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {orderSaving ? "CREATING ORDER..." : "SUBMIT ORDER →"}
                </button>
              </form>
            )}

          </div>

          {/* ── RIGHT: Order Summary ── */}
          <aside className="rounded-[30px] bg-white p-6 shadow-xl h-fit lg:sticky lg:top-24">
            <h2 className="text-xl font-black text-gray-900">
              Order Summary ({cart.length} {cart.length === 1 ? "item" : "items"})
            </h2>

            <div className="mt-5 max-h-64 space-y-3 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.priceLabel}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs font-bold hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs font-bold hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-600">
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="mt-1 text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="font-black text-pink-600 text-xl">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className="mt-4 rounded-2xl bg-pink-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-pink-600">PAYMENT</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {method === "full" && "💳 Full Payment"}
                {method === "emi" && "📊 No Cost EMI"}
                {method === "bob" && "🏦 BOB Wallet"}
                {method === "mixed" && "🔀 Mixed / Split"}
              </p>
            </div>

            {/* WhatsApp Note */}
            <div className="mt-4 rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-700">📱 WHATSAPP</p>
              <p className="mt-1 text-xs text-gray-600">
                After payment verification, your order will be dispatched via WhatsApp to the fulfillment team.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
