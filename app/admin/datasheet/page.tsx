"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet } from "@/lib/api";

type MonthData = {
  month: string;
  label: string;
  bookings: { total: number; completed: number; cancelled: number; revenue: number };
  orders: { total: number; delivered: number; revenue: number };
  emi: { total: number; active: number; completed: number; collected: number; pending: number };
  wallet: { deposits: number; used: number; balance: number };
  customers: { new: number; total: number };
  services: { name: string; count: number; revenue: number }[];
};

function num(v: any) { return Number(v || 0); }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminDataSheetPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [emiPlans, setEmiPlans] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "orders" | "emi" | "wallet" | "services">("overview");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bRes, oRes, eRes, wRes, cRes, sRes] = await Promise.all([
        apiGet<any[]>("/bookings"),
        apiGet<any[]>("/orders"),
        apiGet<any[]>("/emi"),
        apiGet<any[]>("/wallet/all"),
        apiGet<any[]>("/customers"),
        apiGet<any[]>("/services/all"),
      ]);
      if (bRes.ok) setBookings(bRes.data || []);
      if (oRes.ok) setOrders(oRes.data || []);
      if (eRes.ok) setEmiPlans(eRes.data || []);
      if (wRes.ok) setWallets(wRes.data || []);
      if (cRes.ok) setCustomers(cRes.data || []);
      if (sRes.ok) setServices(sRes.data || []);
    } catch {}
    setLoading(false);
  }

  // ── Build monthly data ──
  function getMonthData(year: number): MonthData[] {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${year}-${String(i + 1).padStart(2, "0")}`;

      const mBookings = bookings.filter((b) => (b.createdAt || "").startsWith(monthStr));
      const mOrders = orders.filter((o) => (o.createdAt || "").startsWith(monthStr));
      const mEmi = emiPlans.filter((e) => (e.createdAt || "").startsWith(monthStr));
      const mCustomers = customers.filter((c) => (c.createdAt || "").startsWith(monthStr));

      const walletDeposits = wallets.reduce((s, w) => {
        return s + (w.deposits || []).filter((d: any) => (d.depositDate || "").startsWith(monthStr) && (d.status === "ACTIVE" || d.status === "USED")).reduce((x: number, d: any) => x + num(d.originalAmount), 0);
      }, 0);
      const walletUsed = wallets.reduce((s, w) => {
        return s + (w.usageHistory || []).filter((h: any) => (h.date || "").startsWith(monthStr)).reduce((x: number, h: any) => x + num(h.amount), 0);
      }, 0);

      // Service breakdown
      const serviceMap: Record<string, { count: number; revenue: number }> = {};
      mBookings.forEach((b) => {
        const name = b.serviceName || "Unknown";
        if (!serviceMap[name]) serviceMap[name] = { count: 0, revenue: 0 };
        serviceMap[name].count++;
        serviceMap[name].revenue += num(b.finalPrice || b.amount);
      });

      return {
        month: MONTHS[i],
        label: `${MONTHS[i]} ${year}`,
        bookings: {
          total: mBookings.length,
          completed: mBookings.filter((b) => b.status === "COMPLETED").length,
          cancelled: mBookings.filter((b) => b.status === "CANCELLED").length,
          revenue: mBookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + num(b.finalPrice || b.amount), 0),
        },
        orders: {
          total: mOrders.length,
          delivered: mOrders.filter((o) => o.status === "DELIVERED").length,
          revenue: mOrders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + num(o.totalAmount), 0),
        },
        emi: {
          total: mEmi.length,
          active: mEmi.filter((e) => e.status === "ACTIVE").length,
          completed: mEmi.filter((e) => e.status === "COMPLETED").length,
          collected: mEmi.reduce((s, e) => s + (e.paymentHistory || []).filter((p: any) => p.status === "APPROVED" && (p.approvedAt || "").startsWith(monthStr)).reduce((x: number, p: any) => x + num(p.amount), 0), 0),
          pending: mEmi.filter((e) => e.status === "ACTIVE").reduce((s, e) => s + num(e.pendingAmount), 0),
        },
        wallet: { deposits: walletDeposits, used: walletUsed, balance: walletDeposits - walletUsed },
        customers: { new: mCustomers.length, total: 0 },
        services: Object.entries(serviceMap).map(([name, data]) => ({ name, ...data })),
      };
    });
  }

  const monthData = getMonthData(selectedYear);

  // Totals
  const totals = monthData.reduce(
    (s, m) => ({
      bookings: s.bookings + m.bookings.total,
      bookingRevenue: s.bookingRevenue + m.bookings.revenue,
      orders: s.orders + m.orders.total,
      orderRevenue: s.orderRevenue + m.orders.revenue,
      emiCollected: s.emiCollected + m.emi.collected,
      walletDeposits: s.walletDeposits + m.wallet.deposits,
      walletUsed: s.walletUsed + m.wallet.used,
      newCustomers: s.newCustomers + m.customers.new,
    }),
    { bookings: 0, bookingRevenue: 0, orders: 0, orderRevenue: 0, emiCollected: 0, walletDeposits: 0, walletUsed: 0, newCustomers: 0 }
  );

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <AdminLayout title="Data Sheet" subtitle="Complete monthly data — bookings, orders, EMI, wallet, services.">
      {/* Year Selector */}
      <div className="flex items-center gap-3">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setSelectedYear(y)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              selectedYear === y ? "bg-pink-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(["overview", "bookings", "orders", "emi", "wallet", "services"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === tab ? "bg-pink-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"
            }`}
          >
            {tab === "overview" ? "📊 Overview" : tab === "bookings" ? "📅 Bookings" : tab === "orders" ? "🛍️ Orders" : tab === "emi" ? "💳 EMI" : tab === "wallet" ? "💰 Wallet" : "💈 Services"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
          <p className="mt-3 text-sm text-gray-500">Loading data...</p>
        </div>
      ) : (
        <>
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === "overview" && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 font-bold text-gray-600">Month</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Bookings</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Completed</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Booking ₹</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Orders</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Order ₹</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">EMI Collected</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Wallet In</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Wallet Out</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">New Customers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthData.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{m.month}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{m.bookings.total}</td>
                        <td className="px-3 py-2.5 text-right text-green-700">{m.bookings.completed}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-pink-700">₹{m.bookings.revenue.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{m.orders.total}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-700">₹{m.orders.revenue.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-green-700">₹{m.emi.collected.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right text-pink-600">₹{m.wallet.deposits.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right text-red-600">₹{m.wallet.used.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{m.customers.new}</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 font-black">
                      <td className="px-3 py-3 text-gray-900">TOTAL</td>
                      <td className="px-3 py-3 text-right text-gray-900">{totals.bookings}</td>
                      <td className="px-3 py-3 text-right text-green-700">{monthData.reduce((s, m) => s + m.bookings.completed, 0)}</td>
                      <td className="px-3 py-3 text-right text-pink-700">₹{totals.bookingRevenue.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3 text-right text-gray-900">{totals.orders}</td>
                      <td className="px-3 py-3 text-right text-blue-700">₹{totals.orderRevenue.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3 text-right text-green-700">₹{totals.emiCollected.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3 text-right text-pink-600">₹{totals.walletDeposits.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3 text-right text-red-600">₹{totals.walletUsed.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3 text-right text-gray-900">{totals.newCustomers}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ BOOKINGS ═══ */}
          {activeTab === "bookings" && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 font-bold text-gray-600">Month</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Total</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Completed</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Cancelled</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Revenue</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthData.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{m.month}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{m.bookings.total}</td>
                        <td className="px-3 py-2.5 text-right text-green-700">{m.bookings.completed}</td>
                        <td className="px-3 py-2.5 text-right text-red-600">{m.bookings.cancelled}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-pink-700">₹{m.bookings.revenue.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{m.bookings.completed > 0 ? `₹${Math.round(m.bookings.revenue / m.bookings.completed).toLocaleString("en-IN")}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ ORDERS ═══ */}
          {activeTab === "orders" && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 font-bold text-gray-600">Month</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Total</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Delivered</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthData.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{m.month}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{m.orders.total}</td>
                        <td className="px-3 py-2.5 text-right text-green-700">{m.orders.delivered}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-700">₹{m.orders.revenue.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ EMI ═══ */}
          {activeTab === "emi" && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 font-bold text-gray-600">Month</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">New Plans</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Active</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Completed</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Collected</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthData.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{m.month}</td>
                        <td className="px-3 py-2.5 text-right text-gray-700">{m.emi.total}</td>
                        <td className="px-3 py-2.5 text-right text-blue-700">{m.emi.active}</td>
                        <td className="px-3 py-2.5 text-right text-green-700">{m.emi.completed}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-green-700">₹{m.emi.collected.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-orange-700">₹{m.emi.pending.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ WALLET ═══ */}
          {activeTab === "wallet" && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 font-bold text-gray-600">Month</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Deposits</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Used</th>
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthData.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{m.month}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-pink-700">₹{m.wallet.deposits.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-red-600">₹{m.wallet.used.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-700">₹{m.wallet.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ SERVICES ═══ */}
          {activeTab === "services" && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 font-bold text-gray-600">Service</th>
                      {MONTHS.slice(0, 12).map((m) => (
                        <th key={m} className="px-2 py-3 text-center font-bold text-gray-600">{m.slice(0, 3)}</th>
                      ))}
                      <th className="px-3 py-3 font-bold text-gray-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(() => {
                      // Collect all service names across all months
                      const allServices = new Set<string>();
                      monthData.forEach((m) => m.services.forEach((s) => allServices.add(s.name)));
                      return Array.from(allServices).map((serviceName) => {
                        const monthCounts = monthData.map((m) => {
                          const svc = m.services.find((s) => s.name === serviceName);
                          return svc ? svc.count : 0;
                        });
                        const total = monthCounts.reduce((a, b) => a + b, 0);
                        return (
                          <tr key={serviceName} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 font-bold text-gray-900">{serviceName}</td>
                            {monthCounts.map((c, i) => (
                              <td key={i} className="px-2 py-2.5 text-center text-gray-700">{c || "—"}</td>
                            ))}
                            <td className="px-3 py-2.5 text-right font-bold text-pink-700">{total}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
