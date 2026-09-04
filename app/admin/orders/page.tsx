"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  deliveryAddress: string;
  cashAmount?: number;
  paidVia?: string;
  emiAmount?: number;
  createdAt: string;
};

// Mode ka default order ke option ke hisaab se — EMI order → EMI mode.
function effVia(o: Order): string {
  if (o.paidVia && o.paidVia !== "CASH") return o.paidVia;
  if (o.paymentMethod === "EMI" || o.paymentMethod === "MIXED") return "EMI";
  if (o.paymentMethod === "BOB") return "BOB";
  return "CASH";
}

// RULE (25/75 EMI): EMI mode me minimum 25% down payment abhi, baaki 75%
// EMI balance plan me — customer weekly / jitna bhi ho flexible repayments me dega.
function OrderPayPanel({ order, onSaved }: { order: Order; onSaved: (o: Order) => void }) {
  const billTotal = Math.max(0, Number(order.total) || 0);
  const minDown = Math.ceil(billTotal * 0.25);
  const [via, setVia] = useState(order.paidVia && order.paidVia !== "CASH" ? order.paidVia : effVia(order));
  const [status, setStatus] = useState(order.paymentStatus);
  const [cash, setCash] = useState(String(order.cashAmount || 0));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const invalid = via === "EMI" && (Number(cash) || 0) < minDown;

  async function save() {
    if (invalid) {
      setErr(`EMI close ke liye minimum ₹${minDown.toLocaleString("en-IN")} (bill ka 25%) abhi pay karna hoga.`);
      return;
    }
    setBusy(true);
    setErr("");
    const res = await apiPatch<any>(`/orders/${order._id}/pay`, {
      paymentStatus: status,
      cashAmount: Number(cash) || 0,
      paidVia: via,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.message || "Payment update fail hua.");
      return;
    }
    onSaved(res.data?.order as Order);
  }

  function changeVia(v: string) {
    setVia(v);
    setErr("");
    if (v === "EMI") {
      setCash(String(Math.max(Number(cash) || 0, minDown)));
      setStatus(billTotal - Math.max(Number(cash) || 0, minDown) > 0 ? "PARTIAL" : "PAID");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-green-200 bg-green-50/50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-700">💳 PAYMENT UPDATE (MANUAL)</p>
      <p className="mt-1 text-xs text-gray-600">
        Customer ne payment WhatsApp/UPI pe kar di hai? Yahan status + amount update karein.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-600">PAID VIA (MODE)</label>
          <select
            value={via}
            onChange={(e) => changeVia(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"
          >
            <option value="CASH">💵 Cash</option>
            <option value="UPI">📱 UPI</option>
            <option value="BOB">🏦 BOB Wallet</option>
            <option value="EMI">📊 EMI</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-600">PAYMENT STATUS</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"
          >
            <option value="PENDING">PENDING</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PAID">✓ PAID</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-600">AMOUNT COLLECTED (₹)</label>
          <input
            type="number"
            min={0}
            value={cash}
            onChange={(e) => {
              setCash(e.target.value);
              setErr("");
              if (via === "EMI") {
                const bal = billTotal - (Number(e.target.value) || 0);
                setStatus(bal > 0 ? "PARTIAL" : "PAID");
              }
            }}
            placeholder="Amount collected"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"
          />
        </div>
      </div>

      {via === "EMI" && (() => {
        const collected = Math.max(Number(cash) || 0, 0);
        const balance = Math.max(0, billTotal - collected);
        return (
          <div className={`mt-3 rounded-xl border p-3 text-xs ${invalid ? "border-red-300 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
            <p className={`font-bold ${invalid ? "text-red-800" : "text-blue-800"}`}>
              📊 EMI RULE — MIN 25% DOWN + 75% EMI BALANCE
            </p>
            <p className={`mt-1 ${invalid ? "text-red-700" : "text-blue-700"}`}>
              Bill ₹{billTotal.toLocaleString("en-IN")} pe minimum 25% = <strong>₹{minDown.toLocaleString("en-IN")}</strong> abhi.
              Baaki EMI balance plan me — customer weekly/jitna bhi ho flexible repayments me dega.
            </p>
            {!invalid && (
              <p className="mt-1 text-blue-700">
                EMI plan auto-create hoga: Total ₹{billTotal.toLocaleString("en-IN")} • Down ₹{collected.toLocaleString("en-IN")} •
                Balance ₹{balance.toLocaleString("en-IN")}. Pura pay hone par due ₹0.
              </p>
            )}
            {invalid && (
              <p className="mt-1 font-semibold text-red-700">
                ⚠️ EMI close ke liye minimum ₹{minDown.toLocaleString("en-IN")} (25%) abhi collect karna zaroori hai.
              </p>
            )}
          </div>
        );
      })()}

      {err && <p className="mt-2 text-xs font-semibold text-red-600">⚠️ {err}</p>}

      <button
        type="button"
        onClick={save}
        disabled={busy || invalid}
        className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${
          invalid ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {busy ? "UPDATING..." : invalid ? "MIN 25% DOWN PAYMENT CHAHIYE" : "💾 UPDATE PAYMENT"}
      </button>
    </div>
  );
}

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const payStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  REFUNDED: "bg-red-100 text-red-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await apiGet<Order[]>("/orders");
        if (res.ok && res.data.length > 0) {
          setOrders(res.data);
        }
      } catch {}
      setLoading(false);
    }
    fetchOrders();
  }, []);

  async function updateStatus(id: string, status: string) {
    await apiPatch(`/orders/${id}/status`, { status });
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    if (selected?._id === id) setSelected((prev) => (prev ? { ...prev, status } : null));
  }

  // Manual model: admin WhatsApp pe payment verify karke yahan update karta hai
  // (jaise service bookings closure pe admin payment update karta hai).
  // EMI mode → backend apne aap EMIPlan banata hai (products, total/paid/balance).
  function applyServerOrder(serverOrder: Order) {
    if (!serverOrder?._id) return;
    const merge = (o: Order): Order => ({
      ...o,
      paymentStatus: serverOrder.paymentStatus ?? o.paymentStatus,
      cashAmount: serverOrder.cashAmount ?? o.cashAmount,
      paidVia: serverOrder.paidVia || o.paidVia,
      emiAmount: serverOrder.emiAmount ?? o.emiAmount,
    });
    setOrders((prev) => prev.map((o) => (o._id === serverOrder._id ? merge(o) : o)));
    setSelected((prev) => (prev && prev._id === serverOrder._id ? merge(prev) : prev));
  }

  const filtered = orders.filter((o) => filterStatus === "All" || o.status === filterStatus);
  const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <AdminLayout title="Orders" subtitle="Manage ESSN Cosmetics product orders from MongoDB.">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        {statuses.map((s) => (
          <div key={s} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">{s}</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{orders.filter((o) => o.status === s).length}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["All", ...statuses].map((s) => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filterStatus === s ? "bg-pink-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-pink-50"}`}>
            {s === "All" ? "All" : s}
          </button>
        ))}
      </div>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading orders from database...</p>}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Order ID</th>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">Items</th>
                <th className="px-5 py-3 font-bold text-gray-600">Total</th>
                <th className="px-5 py-3 font-bold text-gray-600">Payment</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">{order.orderId}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</td>
                  <td className="px-5 py-4 font-bold text-pink-600">₹{order.total.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${payStatusColors[order.paymentStatus] || "bg-gray-100"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.status] || "bg-gray-100"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSelected(order)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100">View</button>
                      {order.status === "PENDING" && (
                        <button type="button" onClick={() => updateStatus(order._id, "CONFIRMED")} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">Confirm</button>
                      )}
                      {order.status === "CONFIRMED" && (
                        <button type="button" onClick={() => updateStatus(order._id, "SHIPPED")} className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100">Ship</button>
                      )}
                      {order.status === "SHIPPED" && (
                        <button type="button" onClick={() => updateStatus(order._id, "DELIVERED")} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">Deliver</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-gray-500">{loading ? "Loading..." : "No orders found."}</div>}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-pink-600">{selected.orderId}</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{selected.customerName}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>

            <div className="mt-5 space-y-2">
              {selected.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <span className="text-sm font-semibold text-gray-800">{item.name} × {item.quantity}</span>
                  <span className="text-sm font-bold text-pink-600">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-pink-50 p-4">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-pink-600">₹{selected.total.toLocaleString("en-IN")}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">PAYMENT METHOD</p>
                <p className="mt-1 font-bold text-gray-900">{selected.paymentMethod}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">PAYMENT STATUS</p>
                <p className={`mt-1 font-bold ${selected.paymentStatus === "PAID" ? "text-green-700" : "text-yellow-700"}`}>{selected.paymentStatus}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs font-bold text-gray-400">DELIVERY ADDRESS</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{selected.deliveryAddress || "Not provided"}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">PAID VIA</p>
                <p className="mt-1 font-bold text-gray-900">{selected.paidVia || effVia(selected)}</p>
              </div>
              {Number(selected.emiAmount || 0) > 0 && (
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-bold text-orange-700">EMI BALANCE</p>
                  <p className="mt-1 font-bold text-orange-700">₹{Number(selected.emiAmount || 0).toLocaleString("en-IN")}</p>
                </div>
              )}
            </div>

            {/* Payment update — manual model (admin WhatsApp pe verify karke fill karta hai) */}
            <OrderPayPanel key={selected._id} order={selected} onSaved={applyServerOrder} />

            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusColors[selected.status] || "bg-gray-100"}`}>{selected.status}</span>
              <span className="text-xs text-gray-500">{new Date(selected.createdAt).toLocaleString("en-IN")}</span>
            </div>

            {/* Status update buttons */}
            <div className="mt-5 flex flex-wrap gap-2">
              {statuses.filter((s) => s !== selected.status).map((s) => (
                <button key={s} type="button" onClick={() => updateStatus(selected._id, s)} className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">
                  → {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
