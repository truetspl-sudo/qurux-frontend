"use client";

import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

/* =============================================
   VENDOR PAYMENTS — per-vendor dues ledger
   Company collects → 10% commission → vendor
   gets 90%. Direct/vendor-collected amounts are
   adjusted; remaining = NET PAYABLE to vendor.
============================================= */

type Booking = {
  _id: string;
  bookingId?: string;
  salonId?: string | { _id?: string };
  salonName?: string;
  customerName?: string;
  serviceName?: string;
  status?: string;
  finalPrice?: number;
  amount?: number;
  cashAmount?: number;
  bobPaidAmount?: number;
  emiAmount?: number;
  paymentCollectionMethod?: string;
  companyCollectedAmount?: number;
  vendorDirectAmount?: number;
  closedAt?: string;
  date?: string;
};

type Payout = {
  _id: string;
  bookingId?: string;
  salonId?: string | { _id?: string };
  status?: string;
  paidAmount?: number;
  vendorNetPayout?: number;
  paidVia?: string;
  transactionRef?: string;
};

type VendorRow = {
  salonId: string;
  salonName: string;
  totalClosed: number;
  grossValue: number;
  companyCollected: number;
  vendorCollected: number;
  bobWallet: number;
  emiPending: number;
  commission: number;
  netPayable: number;
  paidAlready: number;
  dueNow: number;
  bookings: Booking[];
};

const COMMISSION_RATE = 0.1;

export default function AdminVendorPaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDue, setFilterDue] = useState<"ALL" | "DUE" | "SETTLED">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [bRes, pRes] = await Promise.all([
        apiGet<Booking[]>("/bookings"),
        apiGet<Payout[]>("/payouts").catch(() => ({ ok: false, data: [] }) as any),
      ]);
      if (bRes.ok && Array.isArray(bRes.data)) setBookings(bRes.data);
      if (pRes.ok && Array.isArray(pRes.data)) setPayouts(pRes.data);
      setLoading(false);
    })();
  }, []);

  const rows: VendorRow[] = useMemo(() => {
    const map = new Map<string, VendorRow>();

    for (const b of bookings) {
      const isClosed = b.status === "COMPLETED" || b.status === "PARTNER_COMPLETED";
      if (!isClosed) continue;

      const salonId =
        typeof b.salonId === "object" && b.salonId ? (b.salonId._id || "") : (b.salonId || "");
      const salonName = b.salonName || "Unknown Vendor";
      const key = salonId || salonName;

      const finalPrice = Number(b.finalPrice || b.amount || 0);
      const vendorCollected = Number(b.vendorDirectAmount || 0);
      const companyCollected = Number(b.companyCollectedAmount || 0);
      const bobWallet = Number(b.bobPaidAmount || 0);
      const emiPending = Number(b.emiAmount || 0);

      // Vendor earns 90% of final price (10% platform commission)
      const grossEarning = Math.round(finalPrice * (1 - COMMISSION_RATE));
      // What vendor already received directly from customer
      const alreadyWithVendor = vendorCollected;
      // Company-held portion = company collected cash + BOB wallet (EMI not yet received)
      const companyHeld = companyCollected + bobWallet;
      // Net payable to vendor = gross earning − already with vendor
      const netPayable = Math.max(0, grossEarning - alreadyWithVendor);
      // Due now = net payable − what's still pending collection (EMI)
      const collectableNow = companyHeld; // money currently in company hands for this booking
      const dueNow = Math.max(0, Math.min(netPayable, collectableNow));

      if (!map.has(key)) {
        map.set(key, {
          salonId: key,
          salonName,
          totalClosed: 0,
          grossValue: 0,
          companyCollected: 0,
          vendorCollected: 0,
          bobWallet: 0,
          emiPending: 0,
          commission: 0,
          netPayable: 0,
          paidAlready: 0,
          dueNow: 0,
          bookings: [],
        });
      }
      const r = map.get(key)!;
      r.totalClosed += 1;
      r.grossValue += finalPrice;
      r.companyCollected += companyCollected;
      r.vendorCollected += vendorCollected;
      r.bobWallet += bobWallet;
      r.emiPending += emiPending;
      r.commission += finalPrice - grossEarning;
      r.netPayable += netPayable;
      r.dueNow += dueNow;
      r.bookings.push(b);
    }

    // Subtract already-paid payouts (if payouts API works)
    for (const p of payouts) {
      if (!p.salonId || p.status === "PENDING") continue;
      const pid = typeof p.salonId === "object" ? p.salonId?._id || "" : p.salonId;
      const row = map.get(pid);
      if (row) row.paidAlready += Number(p.paidAmount || 0);
    }
    for (const r of map.values()) {
      r.dueNow = Math.max(0, r.dueNow - r.paidAlready);
    }

    return [...map.values()].sort((a, b) => b.dueNow - a.dueNow);
  }, [bookings, payouts]);

  const filtered = rows.filter((r) => {
    if (filterDue === "DUE" && r.dueNow <= 0) return false;
    if (filterDue === "SETTLED" && r.dueNow > 0) return false;
    if (search && !(`${r.salonName} ${r.salonId}`.toLowerCase().includes(search.toLowerCase())))
      return false;
    return true;
  });

  const totals = filtered.reduce(
    (acc, r) => ({
      gross: acc.gross + r.grossValue,
      commission: acc.commission + r.commission,
      net: acc.net + r.netPayable,
      due: acc.due + r.dueNow,
    }),
    { gross: 0, commission: 0, net: 0, due: 0 }
  );

  async function markPaid(row: VendorRow) {
    if (!confirm(`Mark ₹${row.dueNow.toLocaleString("en-IN")} as PAID to ${row.salonName}?`)) return;
    setBusyId(row.salonId);
    // Best-effort: record payout against the vendor's latest closed bookings
    const openBookings = row.bookings.filter((b) => b.status === "COMPLETED");
    for (const b of openBookings) {
      await apiPatch(`/payouts/${b._id}/pay`, {
        paidAmount: row.dueNow,
        paidVia: "MANUAL",
        paidAt: new Date().toISOString(),
      }).catch(() => null);
    }
    setBusyId(null);
    alert(`✅ ${row.salonName} — ₹${row.dueNow.toLocaleString("en-IN")} marked paid.`);
    // Refresh
    const pRes = await apiGet<Payout[]>("/payouts").catch(() => ({ ok: false, data: [] }) as any);
    if (pRes.ok && Array.isArray(pRes.data)) setPayouts(pRes.data);
  }

  return (
    <AdminLayout
      title="Vendor Payments"
      subtitle="Har vendor ki due payment ka pura hisab — company collect, vendor direct, commission aur net payable."
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400">VENDORS</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{rows.length}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-green-600">GROSS VALUE (closed)</p>
          <p className="mt-1 text-2xl font-black text-green-700">₹{totals.gross.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-purple-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-600">PLATFORM COMMISSION</p>
          <p className="mt-1 text-2xl font-black text-purple-700">₹{totals.commission.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-orange-600">TOTAL DUE TO VENDORS</p>
          <p className="mt-1 text-2xl font-black text-orange-700">₹{totals.due.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search vendor..."
          className="w-full max-w-xs rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
        {(["ALL", "DUE", "SETTLED"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilterDue(f)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              filterDue === f
                ? f === "DUE" ? "bg-orange-600 text-white" : f === "SETTLED" ? "bg-green-600 text-white" : "bg-pink-600 text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"
            }`}
          >
            {f === "ALL" ? "All Vendors" : f === "DUE" ? "⚠ Payment Due" : "✅ Settled"}
          </button>
        ))}
      </div>

      {/* Vendor rows */}
      <div className="mt-5 space-y-4">
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">Loading vendor data...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No vendors match this filter.
          </div>
        )}

        {filtered.map((r) => (
          <div key={r.salonId} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-black text-gray-900">💈 {r.salonName}</p>
                <p className="mt-0.5 text-xs text-gray-400">{r.totalClosed} closed bookings</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-gray-400">NET PAYABLE</p>
                  <p className="text-lg font-black text-gray-900">₹{r.netPayable.toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl bg-orange-50 px-4 py-2 text-right">
                  <p className="text-[11px] font-bold text-orange-600">DUE NOW</p>
                  <p className={`text-xl font-black ${r.dueNow > 0 ? "text-orange-700" : "text-green-700"}`}>
                    ₹{r.dueNow.toLocaleString("en-IN")}
                  </p>
                </div>
                {r.dueNow > 0 ? (
                  <button
                    type="button"
                    disabled={busyId === r.salonId}
                    onClick={() => markPaid(r)}
                    className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {busyId === r.salonId ? "Processing..." : "💰 Mark Paid"}
                  </button>
                ) : (
                  <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">✅ Settled</span>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === r.salonId ? null : r.salonId)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:border-pink-400 hover:text-pink-600"
                >
                  {expanded === r.salonId ? "Hide ▲" : "Details ▼"}
                </button>
              </div>
            </div>

            {/* Full hisab breakdown */}
            {expanded === r.salonId && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500">FULL HISAB — {r.salonName}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ["Gross closed value", r.grossValue, "text-gray-900"],
                        ["Platform commission (10%)", -r.commission, "text-purple-700"],
                        ["Vendor already collected (direct)", -r.vendorCollected, "text-blue-700"],
                        ["Company collected (cash/UPI)", r.companyCollected, "text-green-700"],
                        ["BOB wallet used", r.bobWallet, "text-blue-700"],
                        ["EMI pending (not yet received)", r.emiPending, "text-orange-600"],
                        ["Payouts already marked paid", -r.paidAlready, "text-gray-600"],
                      ].map(([label, val, cls]) => (
                        <tr key={label as string} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 text-gray-600">{label as string}</td>
                          <td className={`py-2 text-right font-bold ${cls as string}`}>
                            ₹{(val as number).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200">
                        <td className="py-3 font-black text-gray-900">NET DUE TO VENDOR</td>
                        <td className={`py-3 text-right text-xl font-black ${r.dueNow > 0 ? "text-orange-700" : "text-green-700"}`}>
                          ₹{r.dueNow.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Booking-level detail */}
                <p className="mt-4 text-xs font-black uppercase tracking-wider text-gray-500">BOOKING-WISE</p>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-xs">
                    <thead>
                      <tr className="text-left text-gray-400">
                        <th className="py-1.5">Booking</th>
                        <th className="py-1.5">Customer</th>
                        <th className="py-1.5">Service</th>
                        <th className="py-1.5 text-right">Final</th>
                        <th className="py-1.5 text-right">Company</th>
                        <th className="py-1.5 text-right">Vendor Direct</th>
                        <th className="py-1.5 text-right">BOB</th>
                        <th className="py-1.5 text-right">EMI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.bookings.map((b) => (
                        <tr key={b._id} className="border-t border-gray-100">
                          <td className="py-1.5 font-bold text-gray-700">{b.bookingId || b._id.slice(-6)}</td>
                          <td className="py-1.5 text-gray-600">{b.customerName}</td>
                          <td className="py-1.5 text-gray-600">{b.serviceName}</td>
                          <td className="py-1.5 text-right font-bold text-gray-800">₹{Number(b.finalPrice || b.amount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-1.5 text-right text-green-700">₹{Number(b.companyCollectedAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-1.5 text-right text-blue-700">₹{Number(b.vendorDirectAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-1.5 text-right text-blue-700">₹{Number(b.bobPaidAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="py-1.5 text-right text-orange-600">₹{Number(b.emiAmount || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
