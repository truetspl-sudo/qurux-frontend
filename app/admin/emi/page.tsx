"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet } from "@/lib/api";

type EMIPayment = {
  _id: string;
  amount: number;
  transactionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  approvedAt?: string;
  screenshotUrl?: string;
};

type EMIPlan = {
  _id: string;
  customerId: { fullName?: string; mobile?: string; userId?: string } | string;
  purchaseType: "SERVICE" | "PRODUCT" | "COURSE";
  purchaseName: string;
  totalAmount: number;
  bobPaidAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentHistory: EMIPayment[];
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};
const typeColors: Record<string, string> = {
  SERVICE: "bg-pink-100 text-pink-600",
  PRODUCT: "bg-blue-100 text-blue-700",
  COURSE: "bg-amber-100 text-amber-700",
};
const payStatusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function AdminEMIPage() {
  const [plans, setPlans] = useState<EMIPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EMIPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await apiGet<EMIPlan[]>("/emi");
      if (res.ok) setPlans(res.data || []);
    } catch {}
    setLoading(false);
  }

  async function approvePayment(planId: string, paymentId: string) {
    setActionLoading(paymentId);
    try {
      const token = localStorage.getItem("qurux_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"}/api/emi/${planId}/approve/${paymentId}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        await loadPlans();
        // Refresh selected plan
        const updated = plans.find((p) => p._id === planId);
        if (updated) {
          const newRes = await apiGet<EMIPlan>(`/emi/${planId}`);
          if (newRes.ok) setSelected(newRes.data);
        }
      }
    } catch {}
    setActionLoading("");
  }

  async function rejectPayment(planId: string, paymentId: string) {
    setActionLoading(paymentId);
    try {
      const token = localStorage.getItem("qurux_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"}/api/emi/${planId}/reject/${paymentId}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        await loadPlans();
        const newRes = await apiGet<EMIPlan>(`/emi/${planId}`);
        if (newRes.ok) setSelected(newRes.data);
      }
    } catch {}
    setActionLoading("");
  }

  const filtered = plans.filter((p) => filterStatus === "All" || p.status === filterStatus);
  const activePlans = plans.filter((p) => p.status === "ACTIVE");
  const totalPending = activePlans.reduce((s, p) => s + p.pendingAmount, 0);
  const pendingPayments = plans.reduce(
    (acc, p) => acc + p.paymentHistory.filter((ph) => ph.status === "PENDING").length,
    0
  );

  function getCustomerName(c: EMIPlan["customerId"]): string {
    if (typeof c === "object" && c?.fullName) return c.fullName;
    return "Customer";
  }

  return (
    <AdminLayout title="EMI Management" subtitle="Manage EMI plans — approve/reject payments, track balances.">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">TOTAL PLANS</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{plans.length}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">ACTIVE PLANS</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{activePlans.length}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING PAYMENTS</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{pendingPayments}</p>
        </div>
        <div className="rounded-2xl bg-pink-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-pink-700">TOTAL PENDING</p>
          <p className="mt-2 text-3xl font-black text-pink-700">₹{totalPending.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {["All", "ACTIVE", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filterStatus === s ? "bg-pink-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-pink-50"
            }`}
          >
            {s === "All" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Plans Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
            <p className="mt-3 text-sm text-gray-500">Loading EMI plans...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-bold text-gray-600">Plan ID</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Purchase</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Total</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Paid</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Pending</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Payments</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                  <th className="px-5 py-3 font-bold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((plan) => {
                  const pendingPayCount = plan.paymentHistory.filter((p) => p.status === "PENDING").length;
                  return (
                    <tr key={plan._id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">
                        {plan._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">{getCustomerName(plan.customerId)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeColors[plan.purchaseType]}`}>
                            {plan.purchaseType}
                          </span>
                          <span className="text-gray-700">{plan.purchaseName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">₹{plan.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 font-bold text-green-700">
                        ₹{(plan.bobPaidAmount + plan.paidAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 font-bold text-orange-700">
                        ₹{plan.pendingAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        {pendingPayCount > 0 ? (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                            {pendingPayCount} pending
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[plan.status]}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelected(plan)}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && <div className="p-10 text-center text-gray-500">No EMI plans found.</div>}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-pink-600">PLAN {selected._id.slice(-8).toUpperCase()}</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{getCustomerName(selected.customerId)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* Plan Info */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">PURCHASE</p>
                <p className="mt-1 font-bold text-gray-900">{selected.purchaseName}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">TYPE</p>
                <p className="mt-1 font-bold text-gray-900">{selected.purchaseType}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">TOTAL AMOUNT</p>
                <p className="mt-1 text-xl font-black text-gray-900">₹{selected.totalAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-xs font-bold text-green-700">BOB PAID</p>
                <p className="mt-1 text-xl font-black text-green-700">₹{selected.bobPaidAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-700">EMI PAID</p>
                <p className="mt-1 text-xl font-black text-blue-700">₹{selected.paidAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs font-bold text-orange-700">PENDING</p>
                <p className="mt-1 text-xl font-black text-orange-700">₹{selected.pendingAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>Paid: ₹{(selected.bobPaidAmount + selected.paidAmount).toLocaleString("en-IN")}</span>
                <span>Total: ₹{selected.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.min(100, ((selected.bobPaidAmount + selected.paidAmount) / selected.totalAmount) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-center text-xs font-bold text-gray-600">
                {Math.round(((selected.bobPaidAmount + selected.paidAmount) / selected.totalAmount) * 100)}% completed
              </p>
            </div>

            {/* Payment History */}
            <div className="mt-6">
              <h4 className="font-bold text-gray-800">Payment History</h4>
              {selected.paymentHistory.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {selected.paymentHistory.map((pay) => (
                    <div key={pay._id} className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold text-gray-900">₹{pay.amount.toLocaleString("en-IN")}</p>
                          <p className="text-xs text-gray-500">
                            {pay.transactionId && `UTR: ${pay.transactionId} • `}
                            {new Date(pay.submittedAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${payStatusColors[pay.status]}`}>
                            {pay.status}
                          </span>
                          {pay.status === "PENDING" && (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={actionLoading === pay._id}
                                onClick={() => approvePayment(selected._id, pay._id)}
                                className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50"
                              >
                                {actionLoading === pay._id ? "..." : "✓ APPROVE"}
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === pay._id}
                                onClick={() => rejectPayment(selected._id, pay._id)}
                                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                {actionLoading === pay._id ? "..." : "✗ REJECT"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {pay.screenshotUrl && (
                        <a
                          href={pay.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                        >
                          📷 View Screenshot
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">No payments submitted yet.</p>
              )}
            </div>

            <div className="mt-5">
              <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusColors[selected.status]}`}>
                {selected.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
