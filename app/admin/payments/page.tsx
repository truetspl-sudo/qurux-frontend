"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type Payment = {
  id: string;
  customerName: string;
  reference: string;
  type: "BOOKING" | "ORDER" | "EMI" | "WALLET";
  method: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
  date: string;
  transactionId?: string;
  screenshotUrl?: string;
  _id?: string;
};

const typeColors: Record<string, string> = { BOOKING: "bg-pink-100 text-pink-600", ORDER: "bg-blue-100 text-blue-700", EMI: "bg-amber-100 text-amber-700", WALLET: "bg-green-100 text-green-700" };
const statusColors: Record<string, string> = { PENDING: "bg-orange-100 text-orange-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-600", REFUNDED: "bg-purple-100 text-purple-700" };

const methodLabels: Record<string, string> = {
  UPI: "UPI",
  CASH: "Cash",
  BOB: "Pay from BOB",
  CARD: "Card",
  NET_BANKING: "Net Banking",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    try {
      setLoadError("");
      const res = await apiGet<any[]>("/payments");
      if (!res.ok) {
        setLoadError(res.status === 401 || res.status === 403
          ? "Login as Admin required. Pehle /account pe ADMIN User ID se login karein."
          : res.message || "Failed to load payments");
        return;
      }
      const mapped: Payment[] = res.data.map((b: any) => ({
        id: b.paymentId || b._id,
        _id: b._id,
        customerName: b.customerId?.fullName || b.customerName || "Customer",
        reference: b.bookingId?.bookingId || b.orderId?.orderId || b.referenceName || b._id,
        type: (b.referenceType === "ORDER" || b.referenceType === "EMI" || b.referenceType === "WALLET" ? b.referenceType : "BOOKING") as Payment["type"],
        method: methodLabels[b.method] || b.method || "UPI",
        amount: b.amount || 0,
        status: b.status || "PENDING",
        date: b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : "",
        transactionId: b.transactionId || "",
        screenshotUrl: b.screenshotUrl || "",
      }));
      setPayments(mapped);
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(`${action}:${id}`);
    setToast(null);
    try {
      const res = await apiPatch(`/payments/${id}/${action}`, {});
      if (res.ok) {
        setToast({
          ok: true,
          text: action === "approve"
            ? "✅ Payment APPROVED — linked booking/order PAID ho gaya. Customer ko WhatsApp par confirm karein."
            : "✅ Payment REJECTED — customer ko inform karein.",
        });
        load();
      } else {
        setToast({ ok: false, text: res.message || "Action failed" });
      }
    } catch (err: any) {
      setToast({ ok: false, text: err?.message || "Error occurred" });
    }
    setBusyId("");
  }

  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = payments.filter((p) => {
    const matchType = filterType === "All" || p.type === filterType;
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchType && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const pendingAmount = payments.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout title="Payments" subtitle="Manual payment verification — customer ka UPI proof check karke approve/reject karein.">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">TOTAL TRANSACTIONS</p><p className="mt-2 text-3xl font-black text-gray-900">{payments.length}</p></div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm"><p className="text-sm font-semibold text-green-700">TOTAL AMOUNT</p><p className="mt-2 text-3xl font-black text-green-700">₹{totalAmount.toLocaleString("en-IN")}</p></div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm"><p className="text-sm font-semibold text-orange-700">PENDING REVIEW</p><p className="mt-2 text-3xl font-black text-orange-700">{pendingCount}</p></div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm"><p className="text-sm font-semibold text-blue-700">PENDING AMOUNT</p><p className="mt-2 text-3xl font-black text-blue-700">₹{pendingAmount.toLocaleString("en-IN")}</p></div>
      </div>

      {toast && (
        <div className={`mt-6 rounded-2xl border p-4 text-sm font-semibold ${toast.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {toast.text}
        </div>
      )}

      {loadError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          ❌ {loadError}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500">
          <option value="All">All Types</option>
          {["BOOKING", "ORDER", "EMI", "WALLET"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500">
          <option value="PENDING">Pending (Review Queue)</option>
          <option value="All">All Status</option>
          {["PENDING", "APPROVED", "REJECTED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">↻ Refresh</button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Payment</th>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">Type</th>
                <th className="px-5 py-3 font-bold text-gray-600">Method</th>
                <th className="px-5 py-3 font-bold text-gray-600">Amount</th>
                <th className="px-5 py-3 font-bold text-gray-600">Txn ID</th>
                <th className="px-5 py-3 font-bold text-gray-600">Date</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">
                    {payment.id}
                    {payment.screenshotUrl && (
                      <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="mt-1 block text-[10px] font-bold text-blue-600 hover:underline">📷 View Screenshot →</a>
                    )}
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">{payment.customerName}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${typeColors[payment.type]}`}>{payment.type}</span></td>
                  <td className="px-5 py-4 text-gray-600">{payment.method}</td>
                  <td className="px-5 py-4 font-bold text-pink-600">₹{payment.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-600">{payment.transactionId || "—"}</td>
                  <td className="px-5 py-4 text-gray-600">{payment.date}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[payment.status]}`}>{payment.status}</span></td>
                  <td className="px-5 py-4">
                    {payment.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => payment._id && act(payment._id, "approve")}
                          disabled={busyId === `approve:${payment._id}`}
                          className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {busyId === `approve:${payment._id}` ? "..." : "✓ APPROVE"}
                        </button>
                        <button
                          onClick={() => payment._id && act(payment._id, "reject")}
                          disabled={busyId === `reject:${payment._id}`}
                          className="rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-200 disabled:opacity-50"
                        >
                          ✕ REJECT
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-gray-500">No payments found.</div>}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        💡 Manual flow: Customer UPI se paise bhejta hai → transaction ID/screenshot submit karta hai → aap bank app me verify karein → APPROVE dabayein. Approve hote hi linked booking/order PAID ho jayega. Manual WhatsApp message customer ko bhejna na bhoolein.
      </p>
    </AdminLayout>
  );
}
