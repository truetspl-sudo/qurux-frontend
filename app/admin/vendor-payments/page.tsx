"use client";

import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

/* =============================================
   VENDOR PAYMENTS — per-vendor dues ledger
   Rule:
   Final Service Price − Vendor Collected Direct − 10% Commission − GST = Balance Due
   
   If vendor collected full amount → QURUX demands 10% commission + GST
   
   Billing:
   - Bill generated on 1st of each month
   - Due date: 5th of each month
   - Late fee: ₹10/day after due date
============================================= */

const COMMISSION_RATE = 0.10; // 10%
const GST_RATE = 0.18; // 18% default, will use slab if available
const LATE_FEE_PER_DAY = 10; // ₹10/day after due date

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
  gstSlab?: number;
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
  createdAt?: string;
};

type MonthlyBill = {
  month: string; // "2026-09"
  label: string; // "September 2026"
  generatedOn: string; // "2026-10-01"
  dueDate: string; // "2026-10-05"
  totalGross: number;
  totalCommission: number;
  totalGst: number;
  totalVendorCollected: number;
  totalQuruxOwes: number;
  lateFee: number;
  totalPayable: number;
  status: "GENERATED" | "PAID" | "OVERDUE" | "PARTIAL";
  bookings: Booking[];
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
  gst: number;
  netPayable: number;
  paidAlready: number;
  dueNow: number;
  lateFee: number;
  bookings: Booking[];
  monthlyBills: MonthlyBill[];
};

export default function AdminVendorPaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDue, setFilterDue] = useState<"ALL" | "DUE" | "SETTLED">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showBilling, setShowBilling] = useState(false);

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
      const gstSlab = Number(b.gstSlab || GST_RATE * 100); // default 18%

      // Commission = 10% of final price
      const commission = Math.round(finalPrice * COMMISSION_RATE);
      // GST on commission amount
      const gstAmount = Math.round(commission * (gstSlab / 100));
      // QURUX owes vendor = Final Price − Vendor Collected − Commission − GST
      const quruxOwes = Math.max(0, finalPrice - vendorCollected - commission - gstAmount);

      // If vendor collected full amount → QURUX demands commission + GST
      const quruxDemands = vendorCollected >= finalPrice ? commission + gstAmount : 0;

      // Net payable = what QURUX owes vendor (or what vendor owes QURUX if negative)
      const netPayable = quruxOwes > 0 ? quruxOwes : 0;

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
          gst: 0,
          netPayable: 0,
          paidAlready: 0,
          dueNow: 0,
          lateFee: 0,
          bookings: [],
          monthlyBills: [],
        });
      }
      const r = map.get(key)!;
      r.totalClosed += 1;
      r.grossValue += finalPrice;
      r.companyCollected += companyCollected;
      r.vendorCollected += vendorCollected;
      r.bobWallet += bobWallet;
      r.emiPending += emiPending;
      r.commission += commission;
      r.gst += gstAmount;
      r.netPayable += netPayable;
      r.bookings.push(b);
    }

    // Subtract already-paid payouts
    for (const p of payouts) {
      if (!p.salonId || p.status === "PENDING") continue;
      const pid = typeof p.salonId === "object" ? p.salonId?._id || "" : p.salonId;
      const row = map.get(pid);
      if (row) row.paidAlready += Number(p.paidAmount || 0);
    }

    // Calculate due and late fees
    const now = new Date();
    for (const r of map.values()) {
      r.dueNow = Math.max(0, r.netPayable - r.paidAlready);
      
      // Generate monthly bills
      const closedDates = r.bookings
        .filter(b => b.closedAt)
        .map(b => new Date(b.closedAt!));
      
      if (closedDates.length > 0) {
        const monthMap = new Map<string, Booking[]>();
        for (const b of r.bookings) {
          if (!b.closedAt) continue;
          const d = new Date(b.closedAt);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
          monthMap.get(monthKey)!.push(b);
        }

        for (const [monthKey, monthBookings] of monthMap) {
          const [year, month] = monthKey.split("-").map(Number);
          const billDate = new Date(year, month, 1); // 1st of next month
          const dueDate = new Date(year, month, 5); // 5th of next month
          
          let totalGross = 0, totalComm = 0, totalGst = 0, totalVendorCol = 0;
          for (const mb of monthBookings) {
            const fp = Number(mb.finalPrice || mb.amount || 0);
            const vd = Number(mb.vendorDirectAmount || 0);
            const comm = Math.round(fp * COMMISSION_RATE);
            const gst = Math.round(comm * (Number(mb.gstSlab || 18) / 100));
            totalGross += fp;
            totalComm += comm;
            totalGst += gst;
            totalVendorCol += vd;
          }
          const quruxOwesMonth = Math.max(0, totalGross - totalVendorCol - totalComm - totalGst);
          
          // Late fee if past due date
          let lateFee = 0;
          if (now > dueDate && quruxOwesMonth > 0) {
            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            lateFee = daysOverdue * LATE_FEE_PER_DAY;
          }

          const bill: MonthlyBill = {
            month: monthKey,
            label: new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" }),
            generatedOn: billDate.toISOString().slice(0, 10),
            dueDate: dueDate.toISOString().slice(0, 10),
            totalGross,
            totalCommission: totalComm,
            totalGst: totalGst,
            totalVendorCollected: totalVendorCol,
            totalQuruxOwes: quruxOwesMonth,
            lateFee,
            totalPayable: quruxOwesMonth + lateFee,
            status: now > dueDate ? "OVERDUE" : "GENERATED",
            bookings: monthBookings,
          };
          r.monthlyBills.push(bill);
        }
        r.monthlyBills.sort((a, b) => b.month.localeCompare(a.month));
      }

      r.lateFee = r.monthlyBills.reduce((sum, b) => sum + b.lateFee, 0);
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
      gst: acc.gst + r.gst,
      net: acc.net + r.netPayable,
      due: acc.due + r.dueNow,
      lateFee: acc.lateFee + r.lateFee,
    }),
    { gross: 0, commission: 0, gst: 0, net: 0, due: 0, lateFee: 0 }
  );

  async function markPaid(row: VendorRow) {
    if (!confirm(`Mark ₹${row.dueNow.toLocaleString("en-IN")} as PAID to ${row.salonName}?`)) return;
    setBusyId(row.salonId);
    const now = new Date().toISOString();
    const closedBookings = row.bookings.filter((b) => b.status === "COMPLETED" || b.status === "PARTNER_COMPLETED");
    for (const b of closedBookings) {
      const fp = Number(b.finalPrice || b.amount || 0);
      const vendorPayout = Math.round(fp * (1 - COMMISSION_RATE));
      const existing = payouts.find((p) => {
        const pid = typeof p.salonId === "object" ? p.salonId?._id || "" : p.salonId;
        return pid === row.salonId && p.bookingId === (b.bookingId || b._id) && p.status !== "PENDING";
      });
      if (existing) {
        if (existing.status !== "PAID") {
          await apiPatch(`/payouts/${existing._id}/pay`, {
            paidAmount: existing.vendorNetPayout || vendorPayout,
            paidVia: "MANUAL",
            paidAt: now,
          }).catch(() => null);
        }
      } else {
        await apiPost<any>("/payouts", {
          salonId: row.salonId,
          salonName: row.salonName,
          bookingId: b.bookingId || b._id,
          customerId: b._id,
          customerName: b.customerName || "",
          serviceName: b.serviceName || "",
          finalPrice: fp,
          listedPrice: fp,
          paymentCollectionMethod: b.paymentCollectionMethod || "COMPANY",
          companyCollectedAmount: b.companyCollectedAmount || 0,
          vendorDirectAmount: b.vendorDirectAmount || 0,
          gstSlab: Number(b.gstSlab || 18),
          commissionRate: COMMISSION_RATE,
          platformCommission: Math.round(fp * COMMISSION_RATE),
          vendorGrossPayout: vendorPayout,
          vendorNetPayout: vendorPayout,
          status: "PAID",
          paidAmount: vendorPayout,
          paidAt: now,
          paidVia: "MANUAL",
        }).catch(() => null);
      }
    }
    setBusyId(null);
    alert(`✅ ${row.salonName} — ₹${row.dueNow.toLocaleString("en-IN")} marked paid.`);
    const pRes = await apiGet<Payout[]>("/payouts").catch(() => ({ ok: false, data: [] }) as any);
    if (pRes.ok && Array.isArray(pRes.data)) setPayouts(pRes.data);
  }

  return (
    <AdminLayout
      title="Vendor Payments"
      subtitle="Har vendor ki due payment ka pura hisab — Final Price − Vendor Collected − 10% Commission − GST = Balance Due. Bill 1st ko, due 5th."
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400">VENDORS</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{rows.length}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-green-600">GROSS VALUE</p>
          <p className="mt-1 text-2xl font-black text-green-700">₹{totals.gross.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-purple-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-600">COMMISSION + GST</p>
          <p className="mt-1 text-2xl font-black text-purple-700">₹{(totals.commission + totals.gst).toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-orange-600">TOTAL DUE</p>
          <p className="mt-1 text-2xl font-black text-orange-700">₹{totals.due.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-red-600">LATE FEES</p>
          <p className="mt-1 text-2xl font-black text-red-700">₹{totals.lateFee.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Billing info */}
      <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-800">📅 Monthly Billing Cycle</p>
            <p className="mt-1 text-xs text-blue-600">
              Bill generated on <strong>1st</strong> of each month • Due date: <strong>5th</strong> • Late fee: <strong>₹10/day</strong> after due
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBilling(!showBilling)}
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            {showBilling ? "Hide Bills" : "View Monthly Bills"}
          </button>
        </div>
      </div>

      {/* Monthly Bills */}
      {showBilling && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-800">📊 Monthly Bills Overview</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="py-2 text-left">Vendor</th>
                  <th className="py-2 text-left">Month</th>
                  <th className="py-2 text-right">Gross</th>
                  <th className="py-2 text-right">Commission</th>
                  <th className="py-2 text-right">GST</th>
                  <th className="py-2 text-right">Vendor Collected</th>
                  <th className="py-2 text-right">QURUX Owes</th>
                  <th className="py-2 text-right">Late Fee</th>
                  <th className="py-2 text-right">Total Payable</th>
                  <th className="py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.flatMap((r) =>
                  r.monthlyBills.map((bill) => (
                    <tr key={`${r.salonId}-${bill.month}`} className="border-b border-gray-50">
                      <td className="py-2 font-bold text-gray-800">{r.salonName}</td>
                      <td className="py-2 text-gray-600">{bill.label}</td>
                      <td className="py-2 text-right text-gray-800">₹{bill.totalGross.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right text-purple-700">₹{bill.totalCommission.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right text-purple-600">₹{bill.totalGst.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right text-blue-700">₹{bill.totalVendorCollected.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right font-bold text-orange-700">₹{bill.totalQuruxOwes.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right text-red-600">
                        {bill.lateFee > 0 ? `₹${bill.lateFee.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-2 text-right font-black text-gray-900">₹{bill.totalPayable.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          bill.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {bill.status === "OVERDUE" ? "⚠ OVERDUE" : "✓ GENERATED"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <p className="mt-0.5 text-xs text-gray-400">
                  {r.totalClosed} closed bookings • Commission: ₹{r.commission.toLocaleString("en-IN")} • GST: ₹{r.gst.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-gray-400">NET PAYABLE</p>
                  <p className="text-lg font-black text-gray-900">₹{r.netPayable.toLocaleString("en-IN")}</p>
                </div>
                {r.lateFee > 0 && (
                  <div className="rounded-xl bg-red-50 px-4 py-2 text-right">
                    <p className="text-[11px] font-bold text-red-600">LATE FEE</p>
                    <p className="text-lg font-black text-red-700">₹{r.lateFee.toLocaleString("en-IN")}</p>
                  </div>
                )}
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
                        ["GST on commission", -r.gst, "text-purple-600"],
                        ["Vendor already collected (direct)", -r.vendorCollected, "text-blue-700"],
                        ["Company collected (cash/UPI)", r.companyCollected, "text-green-700"],
                        ["BOB wallet used", r.bobWallet, "text-blue-700"],
                        ["EMI pending (not yet received)", r.emiPending, "text-orange-600"],
                        ["Payouts already paid", -r.paidAlready, "text-gray-600"],
                        ["Late fees accrued", r.lateFee, "text-red-600"],
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
                  <table className="w-full min-w-[700px] text-xs">
                    <thead>
                      <tr className="text-left text-gray-400">
                        <th className="py-1.5">Booking</th>
                        <th className="py-1.5">Customer</th>
                        <th className="py-1.5">Service</th>
                        <th className="py-1.5 text-right">Final</th>
                        <th className="py-1.5 text-right">Vendor Direct</th>
                        <th className="py-1.5 text-right">10% Comm</th>
                        <th className="py-1.5 text-right">GST</th>
                        <th className="py-1.5 text-right">QURUX Owes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.bookings.map((b) => {
                        const fp = Number(b.finalPrice || b.amount || 0);
                        const vd = Number(b.vendorDirectAmount || 0);
                        const comm = Math.round(fp * COMMISSION_RATE);
                        const gst = Math.round(comm * (Number(b.gstSlab || 18) / 100));
                        const owes = Math.max(0, fp - vd - comm - gst);
                        return (
                          <tr key={b._id} className="border-t border-gray-100">
                            <td className="py-1.5 font-bold text-gray-700">{b.bookingId || b._id.slice(-6)}</td>
                            <td className="py-1.5 text-gray-600">{b.customerName}</td>
                            <td className="py-1.5 text-gray-600">{b.serviceName}</td>
                            <td className="py-1.5 text-right font-bold text-gray-800">₹{fp.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 text-right text-blue-700">₹{vd.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 text-right text-purple-700">₹{comm.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 text-right text-purple-600">₹{gst.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 text-right font-bold text-orange-700">₹{owes.toLocaleString("en-IN")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Monthly bills for this vendor */}
                {r.monthlyBills.length > 0 && (
                  <>
                    <p className="mt-4 text-xs font-black uppercase tracking-wider text-gray-500">📅 MONTHLY BILLS</p>
                    <div className="mt-2 space-y-2">
                      {r.monthlyBills.map((bill) => (
                        <div key={bill.month} className={`rounded-xl border p-3 ${
                          bill.status === "OVERDUE" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{bill.label}</p>
                              <p className="text-[10px] text-gray-500">
                                Generated: {bill.generatedOn} • Due: {bill.dueDate}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-gray-900">₹{bill.totalPayable.toLocaleString("en-IN")}</p>
                              {bill.lateFee > 0 && (
                                <p className="text-[10px] text-red-600">+₹{bill.lateFee} late fee</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
