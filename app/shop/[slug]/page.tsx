"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { findProductBySlug, staticProducts, type ProductDetail } from "@/components/shop/products";
import BobBalanceCard from "@/components/BobBalanceCard";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<"ingredients" | "howto" | "benefits">("ingredients");

  // Try static data first, then API fallback
  let product: ProductDetail | undefined = findProductBySlug(slug);

  if (!product) {
    // Try matching by ID as well
    product = staticProducts.find((p) => p.id === slug);
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white p-6">
        <div className="text-center">
          <div className="text-6xl">📦</div>
          <h1 className="mt-4 text-3xl font-black text-gray-900">Product Not Found</h1>
          <p className="mt-2 text-gray-500">The product you are looking for does not exist.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700"
          >
            ← Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  function handleAddToCart() {
    // Store in localStorage for now — use slug so orders resolve against the catalog
    const cart = JSON.parse(localStorage.getItem("qurux_cart") || "[]");
    const existing = cart.find((c: any) => c.id === product!.slug);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: product!.slug, name: product!.name, price: product!.priceNum, priceLabel: product!.price, image: product!.image, qty });
    }
    localStorage.setItem("qurux_cart", JSON.stringify(cart));
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2500);
  }

  function handleBuyNow() {
    handleAddToCart();
    window.location.href = "/checkout";
  }

  const similarProducts = staticProducts
    .filter((p) => p.category === product!.category && p.id !== product!.id)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white">

      {/* ← Back */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700">
          ← Back to Shop
        </Link>
      </div>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Image */}
          <div className="relative overflow-hidden rounded-[32px] bg-pink-100">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              style={{ minHeight: 360 }}
            />
            {product.stock <= 5 && (
              <span className="absolute left-5 top-5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white">
                Low Stock — Only {product.stock} left
              </span>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">
              {product.category}
            </p>

            <h1 className="mt-3 text-3xl font-black text-gray-900 lg:text-4xl">
              {product.name}
            </h1>

            <p className="mt-1 text-sm text-gray-400">ESSN Cosmetics</p>

            <p className="mt-5 text-base leading-relaxed text-gray-600">
              {product.description}
            </p>

            {/* Price & Stock */}
            <div className="mt-6 flex items-center gap-6">
              <span className="text-4xl font-black text-pink-600">{product.price}</span>
              <span className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600">
                In Stock: {product.stock}
              </span>
            </div>

            {/* BOB Balance */}
            <BobBalanceCard price={product.price} itemName={product.name} />

            {/* Quantity */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700">Quantity:</span>
              <div className="flex items-center rounded-full border border-gray-200">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-4 py-2 text-lg font-bold text-gray-600 hover:text-pink-600"
                >
                  −
                </button>
                <span className="w-12 text-center text-lg font-bold text-gray-900">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="px-4 py-2 text-lg font-bold text-gray-600 hover:text-pink-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* Added to Cart Message */}
            {addedMsg && (
              <div className="mt-4 rounded-2xl bg-green-50 p-4 text-center text-sm font-bold text-green-700">
                ✅ Added to Cart! <Link href="/checkout" className="underline">Go to Checkout →</Link>
              </div>
            )}

            {/* Add to Cart + Buy Now */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="rounded-full border-2 border-pink-600 bg-white py-3.5 text-sm font-bold text-pink-600 transition hover:bg-pink-50"
              >
                🛒 ADD TO CART
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="rounded-full bg-pink-600 py-3.5 text-sm font-bold text-white transition hover:bg-pink-700"
              >
                ⚡ BUY NOW
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-gray-400">
              Secure checkout · UPI / BOB Wallet / EMI options available
            </p>
          </div>
        </div>
      </section>

      {/* ── TABS: Ingredients | How to Use | Benefits ── */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[28px] bg-white p-8 shadow-md">

          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
            {[
              { key: "ingredients" as const, label: "🧪 Ingredients", icon: "🧪" },
              { key: "howto" as const, label: "📋 How to Use", icon: "📋" },
              { key: "benefits" as const, label: "✨ Benefits", icon: "✨" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  activeTab === tab.key
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ingredients Tab */}
          {activeTab === "ingredients" && (
            <div className="pt-6">
              <h3 className="text-xl font-black text-gray-900">Ingredients</h3>
              <p className="mt-2 text-sm text-gray-500">What&apos;s inside this product:</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.ingredients.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-5 py-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to Use Tab */}
          {activeTab === "howto" && (
            <div className="pt-6">
              <h3 className="text-xl font-black text-gray-900">How to Use</h3>
              <p className="mt-2 text-sm text-gray-500">Step-by-step application guide:</p>
              <div className="mt-5 space-y-4">
                {product.howToUse.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-pink-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="flex-1 rounded-2xl bg-gray-50 px-5 py-3">
                      <p className="text-sm font-medium text-gray-700">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === "benefits" && (
            <div className="pt-6">
              <h3 className="text-xl font-black text-gray-900">Benefits</h3>
              <p className="mt-2 text-sm text-gray-500">Why you&apos;ll love this product:</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.benefits.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-green-50 px-5 py-3">
                    <span className="mt-0.5 text-lg text-green-600">✓</span>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── IDEAL FOR & GOOD TO KNOW ── */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] bg-white p-7 shadow-md">
            <h3 className="text-lg font-black text-gray-900">WHO IS THIS FOR?</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.idealFor}</p>
          </div>
          <div className="rounded-[28px] bg-white p-7 shadow-md">
            <h3 className="text-lg font-black text-gray-900">GOOD TO KNOW</h3>
            <ul className="mt-3 space-y-2">
              {product.goodToKnow.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-pink-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PAYMENT OPTIONS ── */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[28px] bg-white p-8 shadow-md">
          <h3 className="text-lg font-black text-gray-900">PAYMENT OPTIONS</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-pink-50 p-5 text-center">
              <div className="text-2xl">💳</div>
              <p className="mt-2 text-sm font-bold text-gray-900">Full Payment</p>
              <p className="mt-1 text-xs text-gray-500">Pay the complete amount at checkout.</p>
            </div>
            <div className="rounded-2xl bg-purple-50 p-5 text-center">
              <div className="text-2xl">🏦</div>
              <p className="mt-2 text-sm font-bold text-gray-900">BOB Wallet</p>
              <p className="mt-1 text-xs text-gray-500">Use your BOB balance for instant payment.</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-5 text-center">
              <div className="text-2xl">📊</div>
              <p className="mt-2 text-sm font-bold text-gray-900">No Cost EMI</p>
              <p className="mt-1 text-xs text-gray-500">Split into easy installments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIMILAR PRODUCTS ── */}
      {similarProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h3 className="text-xl font-black text-gray-900">YOU MAY ALSO LIKE</h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {similarProducts.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className="group overflow-hidden rounded-[24px] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-pink-100">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-pink-600">{p.category}</p>
                  <h4 className="mt-1 font-bold text-gray-900">{p.name}</h4>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-black text-pink-600">{p.price}</span>
                    <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                  </div>
                  <p className="mt-3 rounded-full bg-pink-600 py-2 text-center text-xs font-bold text-white transition group-hover:bg-pink-700">
                    VIEW DETAILS →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-pink-600 py-14 text-center">
        <h2 className="text-2xl font-black text-white">READY TO SHOP MORE?</h2>
        <p className="mt-2 text-sm text-pink-100">Browse our complete ESSN Cosmetics collection.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-white px-8 py-3.5 font-bold text-pink-600 hover:bg-pink-50"
        >
          BROWSE ALL PRODUCTS →
        </Link>
      </section>
    </main>
  );
}
