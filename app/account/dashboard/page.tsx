"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost, getLoggedInUser, logout as apiLogout } from "../../../lib/api";

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

const statusChip: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  PAID: "bg-green-100 text-green-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
};

type AnyUser = {
  _id?: string;
  fullName?: string;
  mobile?: string;
  email?: string;
  userId?: string;
  role?: string;
  status?: string;
  bobStatus?: string;
  createdAt?: string;
  address?: string;
  dob?: string;
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<AnyUser | null>(null);
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  // Live data
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [emiPlans, setEmiPlans] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [dataError, setDataError] = useState("");

  async function loadAll() {
    setDataError("");
    const [bRes, oRes, pRes, eRes, wRes, rRes] = await Promise.all([
      apiGet<any[]>("/bookings"),
      apiGet<any[]>("/orders"),
      apiGet<any[]>("/payments"),
      apiGet<any[]>("/emi"),
      apiGet<any>("/customers/dashboard"),
      apiGet<any[]>("/ratings/my"),
    ]);
    if (bRes.ok) setBookings(bRes.data);
    if (oRes.ok) setOrders(oRes.data);
    if (pRes.ok) setPayments(pRes.data);
    if (eRes.ok) setEmiPlans(eRes.data);
    if (wRes.ok) setWallet(wRes.data.wallet || null);
    if (rRes.ok) setReviews(rRes.data);
    const anyAuthFail = [bRes, oRes, pRes, eRes, wRes, rRes].some(
      (r) => !r.ok && (r.status === 401 || r.status === 403)
    );
    if (anyAuthFail) {
      setLoginError("Session expired. Please login again.");
      handleLogout(false);
    }
  }

  useEffect(() => {
    const stored = getLoggedInUser() as AnyUser | null;
    if (stored && stored.userId) {
      setUser(stored);
      loadAll();
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError("");
    const res = await apiPost<any>("/auth/login", {
      userId: loginUserId.trim().toUpperCase(),
      password: loginPassword,
    });
    setBusy(false);
    if (res.ok && res.data.token) {
      localStorage.setItem("qurux_token", res.data.token);
      localStorage.setItem("qurux_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      loadAll();
    } else {
      setLoginError(res.message || "Invalid credentials.");
    }
  }

  function handleLogout(redirect = true) {
    apiLogout();
    setUser(null);
    setBookings([]);
    setOrders([]);
    setPayments([]);
    setEmiPlans([]);
    setReviews([]);
    setWallet(null);
    if (!redirect) {
      // apiLogout already navigates to /account via window.location
    }
  }

  // ── LOGIN SCREEN ──
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
            QURUX MAKEOVER & ACADEMY
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">My Account</h1>
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
              <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
                ❌ {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-pink-600 px-5 py-3.5 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {busy ? "Signing in..." : "SIGN IN"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/account" className="font-bold text-pink-600 hover:text-pink-700">
              Create Account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── DASHBOARD ──
  const bobBalance = wallet
    ? (wallet.deposits || [])
        .filter((d: any) => d.status === "ACTIVE")
        .reduce((s: number, d: any) => s + (d.originalAmount - d.usedAmount), 0) +
      (wallet.promotionalBalance || 0)
    : 0;
  const walletTotal =
    wallet && wallet.deposits
      ? wallet.deposits.reduce((s: number, d: any) => s + d.originalAmount, 0)
      : 0;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">MY ACCOUNT</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">
              Welcome, {user.fullName || user.userId}
            </h1>
            <p className="text-xs text-gray-500">
              {user.userId} • {user.role || "Customer"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.role === "ADMIN" && (
              <Link href="/admin" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                🛠️ Admin Panel
              </Link>
            )}
            <Link href="/account" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50">
              🔑 Password Reset
            </Link>
            <button
              type="button"
              onClick={() => handleLogout()}
              className="rounded-full bg-pink-600 px-4 py-2 text-sm font-bold text-white hover:bg-pink-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
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

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            {dataError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
                ❌ {dataError}
              </div>
            )}

            {/* PROFILE */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">My Profile</h2>
                <p className="mt-2 text-sm text-gray-500">Your account details.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">FULL NAME</p>
                    <p className="mt-1 font-bold text-gray-900">{user.fullName || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">USER ID</p>
                    <p className="mt-1 font-bold text-pink-600">{user.userId || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">MOBILE</p>
                    <p className="mt-1 font-bold text-gray-900">{user.mobile || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">EMAIL</p>
                    <p className="mt-1 font-bold text-gray-900">{user.email || "Not set"}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">MEMBER SINCE</p>
                    <p className="mt-1 font-bold text-gray-900">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-xs font-bold text-gray-400">STATUS</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        user.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : user.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {user.status || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS */}
            {activeTab === "bookings" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">My Bookings</h2>
                <p className="mt-2 text-sm text-gray-500">All your service bookings.</p>
                {bookings.length === 0 ? (
                  <EmptyState icon="📅" title="No Bookings Yet" cta={{ href: "/book", label: "Book a Service →" }} />
                ) : (
                  <div className="mt-6 space-y-3">
                    {bookings.map((b: any) => (
                      <div key={b._id || b.bookingId} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-xs font-bold text-pink-600">{b.bookingId}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusChip[b.status] || "bg-gray-100 text-gray-600"}`}>
                            {b.status?.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-2 font-bold text-gray-900">{b.serviceName}</p>
                        <p className="text-xs text-gray-500">
                          {b.date} • {b.timeSlot || "—"} • {b.serviceLocation === "HOME" ? "Home Service" : "Salon"}
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-700">
                          ₹{Number(b.amount || 0).toLocaleString("en-IN")}
                          <span className="ml-2 font-medium text-gray-400">
                            {b.paymentMethod} • {b.paymentStatus}
                          </span>
                          {Number(b.emiAmount || 0) > 0 && (
                            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                              EMI Due ₹{Number(b.emiAmount).toLocaleString("en-IN")}
                            </span>
                          )}
                          {b.paymentStatus === "PAID" && Number(b.emiAmount || 0) === 0 && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              Due ₹0 ✓
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS */}
            {activeTab === "orders" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">My Orders</h2>
                <p className="mt-2 text-sm text-gray-500">Your product orders.</p>
                {orders.length === 0 ? (
                  <EmptyState icon="🛍️" title="No Orders Yet" cta={{ href: "/shop", label: "Browse Shop →" }} />
                ) : (
                  <div className="mt-6 space-y-3">
                    {orders.map((o: any) => (
                      <div key={o._id || o.orderId} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-xs font-bold text-pink-600">{o.orderId}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusChip[o.status] || "bg-gray-100 text-gray-600"}`}>
                            {o.status || o.paymentStatus}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          {(o.items || []).map((i: any) => `${i.name} ×${i.quantity}`).join(", ")}
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-900">
                          ₹{Number(o.total || 0).toLocaleString("en-IN")}
                          {Number(o.emiAmount || 0) > 0 && (
                            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                              EMI Due ₹{Number(o.emiAmount).toLocaleString("en-IN")}
                            </span>
                          )}
                          {o.paymentStatus === "PAID" && Number(o.emiAmount || 0) === 0 && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              Due ₹0 ✓
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">Payment History</h2>
                <p className="mt-2 text-sm text-gray-500">All your payment submissions and status.</p>
                {payments.length === 0 ? (
                  <EmptyState icon="💳" title="No Payments Yet" />
                ) : (
                  <div className="mt-6 space-y-3">
                    {payments.map((p: any) => (
                      <div key={p._id || p.paymentId} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-xs font-bold text-pink-600">{p.paymentId}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusChip[p.status] || "bg-gray-100 text-gray-600"}`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {p.referenceName || p.bookingId?.bookingId || p.orderId?.orderId || "Payment"}
                          {p.method ? ` • ${p.method}` : ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : ""}
                          {p.transactionId ? ` • UTR: ${p.transactionId}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-900">₹{Number(p.amount || 0).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WALLET */}
            {activeTab === "wallet" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">BOB Wallet</h2>
                <p className="mt-2 text-sm text-gray-500">Bank of Beauty — savings and beauty benefits.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="text-xs font-bold text-green-700">AVAILABLE BALANCE</p>
                    <p className="mt-2 text-3xl font-black text-green-700">₹{Number(bobBalance).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-xs font-bold text-blue-700">TOTAL DEPOSITED</p>
                    <p className="mt-2 text-3xl font-black text-blue-700">₹{Number(walletTotal).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-2xl bg-pink-50 p-5">
                    <p className="text-xs font-bold text-pink-600">PROMOTIONAL</p>
                    <p className="mt-2 text-3xl font-black text-pink-600">₹{Number(wallet?.promotionalBalance || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                {(wallet?.deposits || []).length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {(wallet.deposits || []).map((d: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-800">
                            Deposit of ₹{Number(d.originalAmount || 0).toLocaleString("en-IN")}
                          </p>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusChip[d.status] || "bg-gray-100 text-gray-600"}`}>
                            {d.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Deposited: {d.depositDate ? new Date(d.depositDate).toLocaleDateString("en-IN") : "—"} • Used: ₹
                          {Number(d.usedAmount || 0).toLocaleString("en-IN")} • Remaining: ₹
                          {Number((d.originalAmount || 0) - (d.usedAmount || 0)).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6">
                    <EmptyState icon="🏦" title="No Transactions" cta={{ href: "/bob", label: "Go to BOB Dashboard →" }} />
                  </div>
                )}
              </div>
            )}

            {/* EMI */}
            {activeTab === "emi" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">EMI Details</h2>
                <p className="mt-2 text-sm text-gray-500">Your EMI plans and repayments.</p>
                {emiPlans.length === 0 ? (
                  <EmptyState icon="📊" title="No Active EMI Plans" />
                ) : (
                  <div className="mt-6 space-y-3">
                    {emiPlans.map((plan: any) => (
                      <div key={plan._id} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-gray-900">{plan.purchaseName}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusChip[plan.status] || "bg-gray-100 text-gray-600"}`}>
                            {plan.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{plan.purchaseType}</p>
                        <p className="mt-2 text-sm font-bold text-gray-800">
                          Total ₹{Number(plan.totalAmount || 0).toLocaleString("en-IN")} • Paid ₹
                          {Number(plan.paidAmount || 0).toLocaleString("en-IN")} • Balance ₹
                          {Number(plan.pendingAmount || 0).toLocaleString("en-IN")}
                        </p>
                        {plan.status === "ACTIVE" && Number(plan.pendingAmount || 0) > 0 && (
                          <Link
                            href="/bob"
                            className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            💳 Pay EMI Balance →
                          </Link>
                        )}
                        {plan.status === "COMPLETED" && (
                          <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                            ✓ Fully Paid — Due ₹0
                          </span>
                        )}
                        {(plan.paymentHistory || []).length > 0 && (
                          <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                            {(plan.paymentHistory || []).map((h: any, idx: number) => (
                              <p key={idx} className="text-xs text-gray-500">
                                ₹{Number(h.amount || 0).toLocaleString("en-IN")} •{" "}
                                <span className={`font-bold ${h.status === "APPROVED" ? "text-green-600" : h.status === "REJECTED" ? "text-red-600" : "text-orange-600"}`}>
                                  {h.status}
                                </span>{" "}
                                {h.submittedAt ? `• ${new Date(h.submittedAt).toLocaleDateString("en-IN")}` : ""}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <div>
                <h2 className="text-2xl font-black text-gray-900">My Reviews</h2>
                <p className="mt-2 text-sm text-gray-500">Reviews you have given after services.</p>
                {reviews.length === 0 ? (
                  <EmptyState icon="⭐" title="No Reviews Yet" />
                ) : (
                  <div className="mt-6 space-y-3">
                    {reviews.map((r: any) => (
                      <div key={r._id || r.id} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">{r.targetName}</p>
                          <span className="text-sm text-yellow-500">{"★".repeat(Math.round(Number(r.stars) || 0))}</span>
                        </div>
                        {r.customerRemarks && <p className="mt-1 text-sm text-gray-600">{r.customerRemarks}</p>}
                        <p className="mt-1 text-xs text-gray-400">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function EmptyState({
  icon,
  title,
  cta,
}: {
  icon: string;
  title: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-xl font-bold text-gray-900">{title}</h3>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-block rounded-full bg-pink-600 px-6 py-3 font-bold text-white hover:bg-pink-700"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
