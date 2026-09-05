"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import BobBalanceCard from "@/components/BobBalanceCard";
import { apiGet } from "@/lib/api";

type Product = {
  _id?: string;
  id: string;
  slug?: string;
  name: string;
  category: string;
  price: string;
  priceNum?: number;
  image: string;
  description: string;
  stock: number;
};

const products: Product[] = [
  {
    id: "p1",
    slug: "essn-hd-foundation",
    name: "ESSN HD Foundation",
    category: "Makeup",
    price: "₹1,299",
    priceNum: 1299,
    image: "/cards/buy.jpg",
    description:
      "High-definition foundation for a smooth, camera-ready finish.",
    stock: 25,
  },
  {
    id: "p2",
    slug: "essn-matte-lipstick-set",
    name: "ESSN Matte Lipstick Set",
    category: "Makeup",
    price: "₹899",
    priceNum: 899,
    image: "/cards/buy.jpg",
    description:
      "Set of 6 long-lasting matte lipsticks in trending shades.",
    stock: 40,
  },
  {
    id: "p3",
    slug: "essn-glow-serum",
    name: "ESSN Glow Serum",
    category: "Skincare",
    price: "₹1,499",
    priceNum: 1499,
    image: "/cards/buy.jpg",
    description:
      "Vitamin C glow serum for radiant and even-toned skin.",
    stock: 30,
  },
  {
    id: "p4",
    slug: "essn-hydrating-moisturiser",
    name: "ESSN Hydrating Moisturiser",
    category: "Skincare",
    price: "₹799",
    priceNum: 799,
    image: "/cards/buy.jpg",
    description:
      "Lightweight hydrating moisturiser for all skin types.",
    stock: 50,
  },
  {
    id: "p5",
    slug: "essn-hair-repair-mask",
    name: "ESSN Hair Repair Mask",
    category: "Hair Care",
    price: "₹699",
    priceNum: 699,
    image: "/cards/buy.jpg",
    description:
      "Deep-conditioning hair mask for damaged and dry hair.",
    stock: 35,
  },
  {
    id: "p6",
    slug: "essn-professional-brush-kit",
    name: "ESSN Professional Brush Kit",
    category: "Tools & Brushes",
    price: "₹2,499",
    priceNum: 2499,
    image: "/cards/buy.jpg",
    description:
      "12-piece professional makeup brush set with travel pouch.",
    stock: 20,
  },
  {
    id: "p7",
    slug: "essn-sunset-eau-de-parfum",
    name: "ESSN Sunset Eau de Parfum",
    category: "Fragrance",
    price: "₹1,999",
    priceNum: 1999,
    image: "/cards/buy.jpg",
    description:
      "Luxurious evening fragrance with floral and woody notes.",
    stock: 15,
  },
  {
    id: "p8",
    slug: "essn-concealer-palette",
    name: "ESSN Concealer Palette",
    category: "Makeup",
    price: "₹699",
    priceNum: 699,
    image: "/cards/buy.jpg",
    description:
      "Multi-shade concealer palette for colour correction and coverage.",
    stock: 45,
  },
  {
    id: "p9",
    slug: "essn-sunscreen-spf50",
    name: "ESSN Sunscreen SPF 50",
    category: "Skincare",
    price: "₹599",
    priceNum: 599,
    image: "/cards/buy.jpg",
    description:
      "Lightweight broad-spectrum sunscreen for daily protection.",
    stock: 60,
  },
];

export default function ShopPage() {
  const [cart, setCart] = useState<
    { product: Product; qty: number }[]
  >([]);
  const [showCart, setShowCart] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>(products);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");

  const menuResults = allProducts.filter((p) =>
    p.name.toLowerCase().includes(menuQuery.toLowerCase())
  );

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await apiGet<any[]>("/products");
        if (res.ok && res.data.length > 0) {
          const apiProducts: Product[] = res.data.map((p: any) => ({
            id: p._id || p.slug,
            slug: p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: p.name,
            category: p.category,
            price: `\u20B9${(p.price || 0).toLocaleString("en-IN")}`,
            priceNum: p.price || 0,
            image: p.image || "/cards/buy.jpg",
            description: p.description || "",
            stock: p.stock || 0,
          }));
          setAllProducts(apiProducts);
        }
      } catch {
        // Keep static data
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  function addToCart(product: Product) {
    // Save to localStorage cart (used by checkout page)
    const storedCart = JSON.parse(localStorage.getItem("qurux_cart") || "[]");
    const existing = storedCart.find((c: any) => c.id === (product._id || product.id));
    if (existing) {
      existing.qty += 1;
    } else {
      storedCart.push({
        id: product._id || product.id,
        name: product.name,
        price: product.priceNum || parseInt(product.price.replace(/[^0-9]/g, "")) || 0,
        priceLabel: product.price,
        image: product.image,
        qty: 1,
      });
    }
    localStorage.setItem("qurux_cart", JSON.stringify(storedCart));
    // Also update local state
    setCart((prev) => {
      const exists = prev.find((c) => c.product.id === product.id);
      if (exists) {
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, qty: c.qty + 1 }
            : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) =>
      prev.filter((c) => c.product.id !== productId)
    );
  }

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white">

      {/* Header */}
      <header className="border-b border-pink-100 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
              ESSN COSMETICS
            </p>
            <h1 className="text-xl font-black text-gray-900">
              Shop
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCart(!showCart)}
              className="relative rounded-full bg-pink-600 px-5 py-2.5 font-bold text-white hover:bg-pink-700"
            >
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              href="/"
              className="rounded-full border border-pink-600 px-5 py-2 font-semibold text-pink-600 hover:bg-pink-600 hover:text-white"
            >
              HOME
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Cart Drawer */}
        {showCart && (
          <section className="mb-8 rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-gray-900">
              Your Cart ({cartCount})
            </h2>

            {cart.length === 0 ? (
              <p className="mt-4 text-gray-500">
                Your cart is empty.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.product.price} × {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-pink-600">
                        {item.product.price}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.product.id)
                        }
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-3 text-right">
                  <Link
                    href="/checkout"
                    className="inline-block rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700"
                  >
                    CHECKOUT →
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Product Menu — pick a product to open it directly */}
        <div className="mx-auto max-w-xl">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex w-full items-center justify-between rounded-full border-2 border-pink-600 bg-white px-6 py-4 font-bold text-pink-600 shadow-md transition hover:bg-pink-50"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">🛍️</span>
                <span>{menuOpen ? "Choose a Product" : "Browse All Products"}</span>
              </span>
              <span className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

            {menuOpen && (
              <div className="absolute left-0 right-0 z-50 mt-2 max-h-[420px] overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl">
                <div className="border-b border-pink-50 p-3">
                  <input
                    type="text"
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Type to filter products..."
                    autoFocus
                    className="w-full rounded-full border border-pink-200 bg-pink-50 px-5 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                <div className="max-h-[360px] overflow-y-auto p-2">
                  <div className="space-y-1">
                    {menuResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/shop/${product.slug || product.id}`}
                        onClick={() => {
                          setMenuOpen(false);
                          setMenuQuery("");
                        }}
                        className="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-pink-50"
                      >
                        <span className="font-semibold text-gray-800">{product.name}</span>
                        <span className="text-xs font-bold text-pink-600">{product.price}</span>
                      </Link>
                    ))}
                    {menuResults.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-gray-500">No product found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid — Coming Soon banner when catalog empty */}
        {allProducts.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-pink-200 bg-pink-50/40 px-6 py-16 text-center">
            <div className="text-6xl">🕊️</div>
            <h2 className="mt-4 text-2xl font-black text-gray-900">
              Coming Soon
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
              Our shop is being set up. New beauty products will appear here soon — watch this space.
            </p>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="mt-6 rounded-full border-2 border-pink-600 bg-white px-6 py-3 font-bold text-pink-600 transition hover:bg-pink-50"
            >
              {menuOpen ? "Close" : "Browse All Products"}
            </button>

            {/* Keep product menu reachable */}
            {menuOpen && (
              <div className="mt-6 w-full max-w-xl">
                <div className="relative">
                  <div className="absolute left-0 right-0 z-50 mt-2 max-h-[420px] overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl">
                    <div className="border-b border-pink-50 p-3">
                      <input
                        type="text"
                        value={menuQuery}
                        onChange={(e) => setMenuQuery(e.target.value)}
                        placeholder="Type to filter products..."
                        autoFocus
                        className="w-full rounded-full border border-pink-200 bg-pink-50 px-5 py-3 text-sm outline-none focus:border-pink-500"
                      />
                    </div>
                    <div className="max-h-[360px] overflow-y-auto p-2">
                      <div className="space-y-1">
                        {menuResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/shop/${product.slug || product.id}`}
                            onClick={() => {
                              setMenuOpen(false);
                              setMenuQuery("");
                            }}
                            className="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-pink-50"
                          >
                            <span className="font-semibold text-gray-800">{product.name}</span>
                            <span className="text-xs font-bold text-pink-600">{product.price}</span>
                          </Link>
                        ))}
                        {menuResults.length === 0 && (
                          <p className="px-4 py-6 text-center text-sm text-gray-500">
                            No product found
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allProducts.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-[28px] bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-pink-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {product.stock <= 5 && (
                    <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">
                    {product.category}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-gray-900">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {product.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-pink-600">
                      {product.price}
                    </span>
                    <span className="text-xs text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* BOB Balance for logged-in customers */}
                  <BobBalanceCard price={product.price} itemName={product.name} />

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="rounded-full border-2 border-pink-600 bg-white px-4 py-2.5 text-xs font-bold text-pink-600 transition hover:bg-pink-50"
                    >
                      🛒 ADD TO CART
                    </button>
                    <Link
                      href={`/shop/${product.slug || product.id}`}
                      className="rounded-full bg-pink-600 px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-pink-700"
                    >
                      VIEW DETAILS →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
