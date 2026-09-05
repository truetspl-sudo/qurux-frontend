"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet, apiPost, getLoggedInUser } from "@/lib/api";
import QuruxLogo from "@/components/QuruxLogo";

type Booking = {
  _id: string;
  bookingId: string;
  serviceName: string;
  serviceCategory: string;
  serviceLocation: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  bobPaidAmount: number;
  cashAmount: number;
  emiAmount: number;
  paidVia: string;
  status: string;
  customerName: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  createdAt: string;
  closedAt?: string;
  rating?: number;
};

type SalonProfile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  address: string;
  image: string;
  servicesCount: number;
  bookingsCount: number;
  completedCount: number;
  totalCollected: number;
  rating: { stars: number; count: number };
};

type EMIDetail = {
  _id: string;
  purchaseType: string;
  purchaseName: string;
  totalAmount: number;
  bobPaidAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  bookingId?: string;
  orderId?: string;
  paymentHistory: Array<{
    amount: number;
    transactionId: string;
    screenshotUrl: string;
    status: string;
  }>;
};

export default function PartnerDashboardPage() {
  const [profile, setProfile] = useState<SalonProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emiPlans, setEmiPlans] = useState<EMIDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"bookings" | "emi">("bookings");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [user, setUser] = useState<any>(null);
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [salonRes, bookingsRes] = await Promise.all([
        apiGet<{ salon: SalonProfile }>("/salons/my-salon"),
        apiGet<Booking[]>("/bookings"),
      ]);
      if (salonRes.ok && salonRes.data) setProfile(salonRes.data.salon);
      if (bookingsRes.ok) setBookings(bookingsRes.data || []);
    } catch (e: any) {
      setErr(e?.message || "Dashboard load fail hua.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = getLoggedInUser() as any | null;
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
    if (res.ok && res.data?.token) {
      localStorage.setItem("qurux_token", res.data.token);
      localStorage.setItem("qurux_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      loadAll();
    } else {
      setLoginError(res.message || "Invalid credentials.");
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [salonRes, bookingsRes] = await Promise.all([
          apiGet<{ salon: SalonProfile }>("/salons/my-salon"),
          apiGet<Booking[]>("/bookings"),
        ]);
        if (salonRes.ok && salonRes.data) {
          setProfile(salonRes.data.salon);
        }
        if (bookingsRes.ok) {
          setBookings(bookingsRes.data || []);
        }
      } catch (e: any) {
        setErr(e?.message || "Dashboard load fail hua.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === "emi") {
      (async () => {
        try {
          const res = await apiGet<EMIDetail[]>("/emi");
          if (res.ok) {
            const ids = new Set(bookings.map((b) => b._id));
            const linked = (res.data || []).filter((p) =>
              p?.bookingId && ids.has(p.bookingId)
            );
            setEmiPlans(linked);
          }
        } catch {}
      })();
    }
  }, [tab, bookings]);

  const filtered =
    filterStatus === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === filterStatus);

  const emiTaken = bookings.filter(
    (b) => b.paymentMethod === "EMI" || b.paymentMethod === "MIXED"
  ).length;

  // ── LOGIN SCREEN ──
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="flex items-center gap-2">
            <QuruxLogo heightClass="h-8 w-auto" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-pink-600">MAKEOVER &amp; ACADEMY</span>
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">Partner Salon Login</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Partner salon login — same User ID + password jo admin ne approve ke waqt diya tha.
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
            Admin se salon account link karwayein. Jab approve ho jaaye, tab login chalega.
          </div>
        </section>
      </main>
    );
  }

  // ── DASHBOARD ──
  if (err && !loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <div className="mx-auto max-w-2xl rounded-3xl bg-red-50 p-8 text-center shadow-sm">
          <p className="text-3xl font-black text-red-600">❌ {err}</p>
          <p className="mt-2 text-sm text-gray-600">Refresh karein ya ADMIN se salon account link karwayein.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                PARTNER SALON DASHBOARD
              </p>
              <h1 className="mt-2 text-2xl font-black text-gray-900">
                {profile?.name || "—"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {profile?.city}, {profile?.address}
              </p>
            </div>
            <div className="rounded-full bg-pink-100 px-4 py-1.5 text-sm font-bold text-pink-600">
              {(profile?.rating?.stars ?? 0) > 0
                ? `⭐ ${(profile?.rating?.stars ?? 0).toFixed(1)} (${(profile?.rating?.count ?? 0)} reviews)`
                : "☆☆☆☆☆ NEW"}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-bold uppercase text-green-700">Total Bookings</p>
              <p className="mt-1 text-2xl font-black text-green-800">{profile?.bookingsCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase text-blue-700">Completed</p>
              <p className="mt-1 text-2xl font-black text-blue-800">{profile?.completedCount ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-pink-50 p-4">
              <p className="text-xs font-bold uppercase text-pink-700">Earned (₹)</p>
              <p className="mt-1 text-2xl font-black text-pink-700">
                ₹{(profile?.totalCollected ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-gray-500">cash collected</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-bold uppercase text-orange-700">EMI Bookings</p>
              <p className="mt-1 text-2xl font-black text-orange-700">{emiTaken}</p>
              <p className="text-[11px] text-gray-500">EMI mode se ki gayi</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("bookings")}
            className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
              tab === "bookings" ? "bg-pink-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            📅 My Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("emi")}
            className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
              tab === "emi" ? "bg-pink-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            💳 EMI Plans ({emiPlans.length})
          </button>
        </div>

        {tab === "bookings" && (
          <div className="mt-5 space-y-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-pink-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
                Booking history load ho rahi hai...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
                <p className="text-lg font-bold text-gray-800">Abhi koi booking nahi mila.</p>
                <p className="mt-1 text-sm text-gray-500">
                  Jab customer aapke salon me booking karega, woh yahan dikhega.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((b) => (
                  <div
                    key={b._id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900">{b.serviceName}</p>
                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                              b.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : b.status === "PENDING"
                                ? "bg-orange-100 text-orange-700"
                                : b.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {b.customerName} • {b.customerPhone} • {b.date}
                          {b.timeSlot ? ` • ${b.timeSlot}` : ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          Booking ID: {b.bookingId} • {b.serviceLocation === "HOME" ? "Home Service" : "Salon Visit"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <p className="text-lg font-black text-gray-900">₹{b.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-500">Total Booking Amount</p>
                        <div className="mt-2 flex flex-wrap gap-1 justify-center">
                          {b.paymentMethod === "BOB" && b.bobPaidAmount > 0 && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                              BOB ₹{b.bobPaidAmount}
                            </span>
                          )}
                          {b.paymentMethod === "EMI" && b.emiAmount > 0 && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                              EMI ₹{b.emiAmount}
                            </span>
                          )}
                          {b.paidVia && b.paidVia !== "CASH" && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                              Paid via {b.paidVia}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          Payment: {b.paymentStatus} • {b.paidVia || "not updated"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "emi" && (
          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
                EMI plans load ho rahe hain...
              </div>
            ) : emiPlans.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
                <p className="text-lg font-bold text-gray-800">Abhi EMI plan nahi mila.</p>
                <p className="mt-1 text-sm text-gray-500">
                  Jab customer EMI mode se booking karega aur payment close hoga,
                  EMI plan yahan dikhega.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emiPlans.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{p.purchaseName}</p>
                        <p className="text-sm text-gray-500">
                          {p.purchaseType === "SERVICE" ? "Beauty Service" : "Order"} • {p.status}
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <p className="text-lg font-black text-gray-900">₹{p.totalAmount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-500">Total Bill</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-green-50 p-3 text-center">
                        <p className="text-lg font-black text-green-700">₹{p.paidAmount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-green-600">Paid</p>
                      </div>
                      <div className="rounded-xl bg-orange-50 p-3 text-center">
                        <p className="text-lg font-black text-orange-700">₹{p.pendingAmount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-orange-600">Balance (EMI)</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-3 text-center">
                        <p className="text-lg font-black text-blue-700">₹{p.bobPaidAmount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-blue-600">BOB Paid</p>
                      </div>
                    </div>
                    {p.paymentHistory.length > 0 && (
                      <div className="mt-3 text-left rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase text-gray-500">Payment History</p>
                        {p.paymentHistory.map((ph, i) => (
                          <div key={i} className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-700">₹{ph.amount} • {ph.status === "APPROVED" ? "✅ Approved" : ph.status === "REJECTED" ? "❌ Rejected" : "⏳ Pending"}</span>
                            {ph.transactionId && (
                              <span className="text-xs text-gray-400">{ph.transactionId}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            💰 BOB Wallet customer ka hai — partner salon is dashboard pe customer ke BOB balance nahi dekh sakta.
          </p>
        </div>
      </div>
    </main>
  );
}
