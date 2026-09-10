"use client";

import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet } from "@/lib/api";

/* =============================================
   EARNINGS — day-wise revenue hisab
   Bookings + orders combined, filterable by
   date range, vendor, and free-text search.
============================================= */

type Booking = {
  _id: string;
  bookingId?: string;
  salonName?: string;
  customerName?: string;
  serviceName?: string;
  status?: string;
  finalPrice?: number;
  amount?: number;
  cashAmount?: number;
  bobPaidAmount?: number;
  emiAmount?: number;
  companyCollectedAmount?: number;
  vendorDirectAmount?: number;
  closedAt?: string;
  createdAt?: string;
  date?: string;
  paymentStatus?: string;
};

type Order = {
  _id: string;
  orderId?: string;
  customerName?: string;
  productName?: string;
  totalAmount?: number;
  amount?: number;
  status?: string;
  createdAt?: string;
};

type DayRow = {
  day: string;
  bookingCount: number;
  bookingGross: number;
  bookingCollected: number;
  orderCount: number;
  orderRevenue: number;
  commission: number;
  total: number;
  entries: { label: string; detail: string; amount: number; type: string }[];
};

const COMMISSION_RATE = 0.1;

function dayOf(b: Booking) {
  const d = b.closedAt || b.date || b.createdAt;
  return d ? new Date(d).toISOString().split("T")[0] : "unknown";
}

export default function AdminEarningsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendorFilter, setVendorFilter] = useState("ALL");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [bRes, oRes] = await Promise.all([
        apiGet<Booking[]>("/bookings"),
        apiGet<Order[]>("/orders").catch(() => ({ ok: false, data: [] }) as any),
      ]);
      if (bRes.ok && Array.isArray(bRes.data)) setBookings(bRes.data);
      if (oRes.ok && Array.isArray(oRes.data)) setOrders(oRes.data);
      setLoading(false);
    })();
  }, []);

  const vendors = useMemo(
    () => [...new Set(bookings.map((b) => b.salonName).filter(Boolean))] as string[],
    [bookings]
  );

  const days: DayRow[] = useMemo(() => {
    const map = new Map<string, DayRow>();

    function ensure(day: string) {
      if (!map.has(day)) {
        map.set(day, {
          day,
          bookingCount: 0,
          bookingGross: 0,
          bookingCollected: 0,
          orderCount: 0,
          orderRevenue: 0,
          commission: 0,
          total: 0,
          entries: [],
        });
      }
      return map.get(day)!;
    }

    for (const b of bookings) {
      const isRevenueDay = b.status === "COMPLETED"; // closed = revenue booked
      if (!isRevenueDay) continue;
      const day = dayOf(b);
      if (vendorFilter !== "ALL" && b.salonName !== vendorFilter) continue;
      const finalPrice = Number(b.finalPrice || b.amount || 0);
      const collected =
        Number(b.companyCollectedAmount || 0) + Number(b.cashAmount || 0) + Number(b.bobPaidAmount || 0);
      const row = ensure(day);
      row.bookingCount += 1;
      row.bookingGross += finalPrice;
      row.bookingCollected += Math.min(collected, finalPrice);
      row.commission += Math.round(finalPrice * COMMISSION_RATE);
      row.total += Math.round(finalPrice * (1 - COMMISSION_RATE));
      row.entries.push({
        label: b.bookingId || b._id.slice(-6),
        detail: `${b.serviceName || "Service"} — ${b.customerName || ""} (${b.salonName || "No vendor"})`,
        amount: finalPrice,
        type: "BOOKING",
      });
    }

    for (const o of orders) {
      if (o.status && !["COMPLETED", "DELIVERED", "PAID"].includes(o.status)) continue;
      const day = o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "unknown";
      if (vendorFilter !== "ALL") continue; // orders have no vendor
      if (search) {
        const hay = `${o.orderId || o._id} ${o.customerName || ""} ${o.productName || ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) continue;
      }
      const amt = Number(o.totalAmount || o.amount || 0);
      const row = ensure(day);
      row.orderCount += 1;
      row.orderRevenue += amt;
      row.total += amt;
      row.entries.push({
        label: o.orderId || o._id.slice(-6),
        detail: `${o.productName || "Product"} — ${o.customerName || ""}`,
        amount: amt,
        type: "ORDER",
      });
    }

    return [...map.values()]
      .filter((r) => {
        if (fromDate && r.day < fromDate) return false;
        if (toDate && r.day > toDate) return false;
        if (search) {
          const hay = JSON.stringify(r.entries).toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [bookings, orders, search, fromDate, toDate, vendorFilter]);

  const totals = days.reduce(
    (a, d) => ({
      gross: a.gross + d.bookingGross,
      collected: a.collected + d.bookingCollected,
      commission: a.commission + d.commission,
      orderRevenue: a.orderRevenue + d.orderRevenue,
      total: a.total + d.total,
    }),
    { gross: 0, collected: 0, commission: 0, orderRevenue: 0, total: 0 }
  );

  const today = new Date().toISOString().split("T")[0];
  const todayRow = days.find((d) => d.day === today);

  return (
    <AdminLayout
      title="Earnings"
      subtitle="Day-wise revenue hisab — bookings + orders, commission ke saath."
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-pink-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-pink-600">TODAY (₹ net)</p>
          <p className="mt-1 text-2xl font-black text-pink-700">
            ₹{(todayRow?.total || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-400">{today}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-green-600">GROSS (filtered)</p>
          <p className="mt-1 text-2xl font-black text-green-700">₹{totals.gross.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-blue-600">COLLECTED</p>
          <p className="mt-1 text-2xl font-black text-blue-700">₹{totals.collected.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-purple-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-600">COMMISSION (10%)</p>
          <p className="mt-1 text-2xl font-black text-purple-700">₹{totals.commission.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-bold text-pink-300">NET EARNINGS</p>
          <p className="mt-1 text-2xl font-black text-white">₹{totals.total.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[11px] font-bold text-gray-400">SEARCH</p>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Booking, customer, service..."
            className="mt-1 w-56 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold outline-none focus:border-pink-500 focus:bg-white"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400">FROM</p>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold outline-none focus:border-pink-500"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400">TO</p>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold outline-none focus:border-pink-500"
          />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400">VENDOR</p>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="mt-1 max-w-[220px] rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold outline-none focus:border-pink-500"
          >
            <option value="ALL">All Vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        {(search || fromDate || toDate || vendorFilter !== "ALL") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFromDate(""); setToDate(""); setVendorFilter("ALL"); }}
            className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Day-wise table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Loading earnings data...</p>
        ) : days.length === 0 ? (
          <p className="p-10 text-center text-gray-500">No earnings for this filter.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Bookings</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Collected</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Order ₹</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Net ₹</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day} className="border-t border-gray-50 hover:bg-pink-50/40">
                  <td className="px-4 py-3 font-bold text-gray-800">{d.day}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{d.bookingCount}</td>
                  <td className="px-4 py-3 text-right text-gray-800">₹{d.bookingGross.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-green-700">₹{d.bookingCollected.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{d.orderCount}</td>
                  <td className="px-4 py-3 text-right text-gray-800">₹{d.orderRevenue.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-purple-700">₹{d.commission.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-black text-pink-700">₹{d.total.toLocaleString("en-IN")}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-pink-100 bg-pink-50/60">
                <td className="px-4 py-3 font-black text-gray-900">TOTAL</td>
                <td className="px-4 py-3 text-center font-bold">
                  {days.reduce((a, d) => a + d.bookingCount, 0)}
                </td>
                <td className="px-4 py-3 text-right font-black text-green-700">₹{totals.gross.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-blue-700">₹{totals.collected.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-center font-bold">
                  {days.reduce((a, d) => a + d.orderCount, 0)}
                </td>
                <td className="px-4 py-3 text-right font-black">₹{totals.orderRevenue.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-purple-700">₹{totals.commission.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right text-xl font-black text-pink-700">₹{totals.total.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Expandable day detail */}
      {days.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">DAY-WISE ENTRIES (click to expand)</p>
          {days.slice(0, 14).map((d) => (
            <details key={d.day} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-bold text-gray-800">
                📅 {d.day} — {d.bookingCount + d.orderCount} entries — Net ₹{d.total.toLocaleString("en-IN")}
              </summary>
              <div className="mt-3 space-y-1.5">
                {d.entries.map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <span className="font-bold text-gray-700">
                      <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-black ${e.type === "ORDER" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                        {e.type}
                      </span>
                      {e.label} — {e.detail}
                    </span>
                    <span className="font-black text-gray-900">₹{e.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
