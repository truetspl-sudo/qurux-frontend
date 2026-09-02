"use client";

import { useState } from "react";
import Link from "next/link";

type Tab =
  | "profile"
  | "bookings"
  | "orders"
  | "payments"
  | "wallet"
  | "emi"
  | "reviews";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "profile", label: "Profile", icon: "👤" },
  { key: "bookings", label: "My Bookings", icon: "📅" },
  { key: "orders", label: "My Orders", icon: "🛍️" },
  { key: "payments", label: "Payment History", icon: "💳" },
  { key: "wallet", label: "BOB Wallet", icon: "🏦" },
  { key: "emi", label: "EMI Details", icon: "📊" },
  { key: "reviews", label: "Reviews", icon: "⭐" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loggedIn, setLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [profileUserId, setProfileUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loginUserId && loginPassword) {
      setCustomerName("Customer");
      setProfileUserId(loginUserId);
      setLoggedIn(true);
    } else {
      setLoginError("Please enter User ID and password.");
    }
  }

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
            QURUX MAKEOVER & ACADEMY
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">
            My Account
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in with your User ID (given by admin) and password.
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <label className="block text-sm font-bold text-gray-800">
              User ID
              <input
                required
                type="text"
                placeholder="e.g. QUR-12345"
                value={loginUserId}
                onChange={(e) => setLoginUserId(e.target.value.toUpperCase())}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Password
              <input
                required
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </label>

            {loginError && (
              <p className="rounded-xl bg-pink-50 p-3 text-sm font-medium text-pink-700">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-pink-600 px-5 py-3.5 font-bold text-white hover:bg-pink-700"
            >
              SIGN IN
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/account"
              className="font-bold text-pink-600 hover:text-pink-700"
            >
              Create Account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
              MY ACCOUNT
            </p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">
              Welcome, {customerName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => setLoggedIn(false)}
              className="rounded-full bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

          {/* Sidebar Tabs */}
          <aside className="rounded-3xl bg-white p-4 shadow-sm">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-pink-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">

            {/* Profile */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  My Profile
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Manage your personal information.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">FULL NAME</p>
                    <p className="mt-1 font-bold text-gray-900">{customerName}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">USER ID</p>
                    <p className="mt-1 font-bold text-gray-900">{profileUserId || loginUserId}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">MOBILE</p>
                    <p className="mt-1 font-bold text-gray-900">Not set</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">MEMBER SINCE</p>
                    <p className="mt-1 font-bold text-gray-900">
                      {new Date().toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings */}
            {activeTab === "bookings" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  My Bookings
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage your service bookings.
                </p>
                <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">📅</div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    No Bookings Yet
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Your bookings will appear here once you book a service.
                  </p>
                  <Link
                    href="/book"
                    className="mt-6 inline-block rounded-full bg-pink-600 px-6 py-3 font-bold text-white hover:bg-pink-700"
                  >
                    Book a Service →
                  </Link>
                </div>
              </div>
            )}

            {/* Orders */}
            {activeTab === "orders" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  My Orders
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Track your product orders from ESSN Cosmetics.
                </p>
                <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">🛍️</div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    No Orders Yet
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Your orders will appear here once you purchase a product.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-6 inline-block rounded-full bg-pink-600 px-6 py-3 font-bold text-white hover:bg-pink-700"
                  >
                    Browse Shop →
                  </Link>
                </div>
              </div>
            )}

            {/* Payment History */}
            {activeTab === "payments" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  Payment History
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  View all your past payments and transactions.
                </p>
                <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">💳</div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    No Payments Yet
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Your payment history will appear here.
                  </p>
                </div>
              </div>
            )}

            {/* BOB Wallet */}
            {activeTab === "wallet" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  BOB Wallet
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Bank of Beauty — Your savings and beauty benefits.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="text-xs font-bold text-green-700">
                      AVAILABLE BALANCE
                    </p>
                    <p className="mt-2 text-3xl font-black text-green-700">
                      ₹0
                    </p>
                  </div>
                  <div className="rounded-2xl bg-pink-50 p-5">
                    <p className="text-xs font-bold text-pink-600">
                      BEAUTY BENEFITS
                    </p>
                    <p className="mt-2 text-3xl font-black text-pink-600">
                      ₹0
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-xs font-bold text-blue-700">
                      TOTAL VALUE
                    </p>
                    <p className="mt-2 text-3xl font-black text-blue-700">
                      ₹0
                    </p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">🏦</div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    No Transactions
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Your wallet transactions will appear here.
                  </p>
                  <Link
                    href="/bob"
                    className="mt-6 inline-block rounded-full bg-pink-600 px-6 py-3 font-bold text-white hover:bg-pink-700"
                  >
                    Go to BOB Dashboard →
                  </Link>
                </div>
              </div>
            )}

            {/* EMI Details */}
            {activeTab === "emi" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  EMI Details
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  View your EMI plans, repayment schedule and payment history.
                </p>
                <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">📊</div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    No Active EMI Plans
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Your EMI details will appear here once you start a plan.
                  </p>
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  My Reviews
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage your service reviews and ratings.
                </p>
                <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">⭐</div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    No Reviews Yet
                  </h3>
                  <p className="mt-2 text-gray-500">
                    After a service is completed, you can leave a review here.
                  </p>
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </main>
  );
}
