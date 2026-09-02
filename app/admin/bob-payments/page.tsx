"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import { getBobPaymentProof } from "../../../lib/bob-indexeddb";

type BobPayment = {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  accountNumber?: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  paymentScreenshotId?: string;
  paymentScreenshotName?: string;
  purchaseName?: string;
  paymentDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  _type?: "DEPOSIT" | "EMI";
  _key?: string;
};

function readLocalArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminBobPaymentsPage() {
  const [payments, setPayments] = useState<BobPayment[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEPOSIT" | "EMI">("ALL");
  const [selected, setSelected] = useState<BobPayment | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);

  useEffect(() => {
    loadPayments();
    window.addEventListener("focus", loadPayments);
    window.addEventListener("storage", loadPayments);
    return () => {
      window.removeEventListener("focus", loadPayments);
      window.removeEventListener("storage", loadPayments);
    };
  }, []);

  function loadPayments() {
    const deposits = readLocalArray("bobPayments").map((p: any) => ({
      ...p,
      _type: "DEPOSIT" as const,
      _key: "bobPayments",
    }));
    const emis = readLocalArray("bobEMIPayments").map((p: any) => ({
      ...p,
      _type: "EMI" as const,
      _key: "bobEMIPayments",
    }));
    const all = [...deposits, ...emis].sort(
      (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    );
    setPayments(all);
  }

  const filtered = payments.filter((p) => {
    if (filter !== "ALL" && p.status !== filter) return false;
    if (typeFilter === "DEPOSIT" && p._type !== "DEPOSIT") return false;
    if (typeFilter === "EMI" && p._type !== "EMI") return false;
    return true;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    approved: payments.filter((p) => p.status === "APPROVED").length,
    rejected: payments.filter((p) => p.status === "REJECTED").length,
    pendingAmount: payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + (Number(p.amount) || 0), 0),
  };

  function handleApprove(payment: BobPayment) {
    updatePaymentStatus(payment, "APPROVED");
    setSelected(null);
    setScreenshotUrl(null);
  }

  function handleReject(payment: BobPayment) {
    updatePaymentStatus(payment, "REJECTED");
    setSelected(null);
    setScreenshotUrl(null);
  }

  function updatePaymentStatus(payment: BobPayment, newStatus: "APPROVED" | "REJECTED") {
    const key = (payment as any)._key || "bobPayments";
    const list = readLocalArray(key);
    const updated = list.map((item: any) =>
      item.id === payment.id ? { ...item, status: newStatus } : item
    );
    localStorage.setItem(key, JSON.stringify(updated));

    // If approving a deposit, also mark it in the main bobPayments
    if (newStatus === "APPROVED" && key === "bobPayments") {
      // Already handled above
    }

    loadPayments();
  }

  async function viewScreenshot(payment: BobPayment) {
    if (!payment.paymentScreenshotId) {
      setScreenshotUrl(null);
      return;
    }
    setLoadingScreenshot(true);
    setScreenshotUrl(null);
    try {
      const blob = await getBobPaymentProof(payment.paymentScreenshotId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setScreenshotUrl(url);
      } else {
        setScreenshotUrl(null);
      }
    } catch {
      setScreenshotUrl(null);
    }
    setLoadingScreenshot(false);
  }

  function closeModal() {
    setSelected(null);
    if (screenshotUrl) {
      URL.revokeObjectURL(screenshotUrl);
      setScreenshotUrl(null);
    }
  }

  return (
    <AdminLayout
      title="BOB Payment Verification"
      subtitle="Approve or reject customer BOB payments after UPI verification"
    >
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500">TOTAL PAYMENTS</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-yellow-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-yellow-700">PENDING</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-green-700">APPROVED</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-red-700">REJECTED</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="rounded-2xl bg-pink-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-pink-700">PENDING AMOUNT</p>
          <p className="mt-1 text-2xl font-bold text-pink-600">
            ₹{stats.pendingAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === f
                  ? f === "PENDING"
                    ? "bg-yellow-500 text-white"
                    : f === "APPROVED"
                      ? "bg-green-600 text-white"
                      : f === "REJECTED"
                        ? "bg-red-500 text-white"
                        : "bg-gray-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["ALL", "DEPOSIT", "EMI"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                typeFilter === t
                  ? "bg-slate-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t === "DEPOSIT" ? "💰 Deposits" : t === "EMI" ? "📊 EMI" : "All Types"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-700">DATE</th>
              <th className="px-4 py-3 font-bold text-gray-700">CUSTOMER</th>
              <th className="px-4 py-3 font-bold text-gray-700">TYPE</th>
              <th className="px-4 py-3 font-bold text-gray-700">AMOUNT</th>
              <th className="px-4 py-3 font-bold text-gray-700">UTR / TXN</th>
              <th className="px-4 py-3 font-bold text-gray-700">SCREENSHOT</th>
              <th className="px-4 py-3 font-bold text-gray-700">STATUS</th>
              <th className="px-4 py-3 font-bold text-gray-700">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              filtered.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-t border-gray-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    {new Date(payment.submittedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{payment.customerName}</p>
                    <p className="text-xs text-gray-500">{payment.mobile}</p>
                    {payment.accountNumber && (
                      <p className="text-xs text-gray-400">Acct: {payment.accountNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      (payment as any)._type === "EMI"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {(payment as any)._type === "EMI"
                        ? `EMI - ${payment.purchaseName || "Purchase"}`
                        : "Deposit"
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-gray-700">
                      {payment.transactionId || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {payment.paymentScreenshotId ? (
                      <span className="text-xs font-semibold text-green-600">
                        ✓ Available
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      payment.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : payment.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(payment);
                        viewScreenshot(payment);
                      }}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900"
                    >
                      REVIEW
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">
                  PAYMENT VERIFICATION
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  ₹{Number(selected.amount || 0).toLocaleString("en-IN")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-2xl font-bold text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Customer Info */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500">CUSTOMER NAME</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">MOBILE</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.mobile}</p>
                </div>
                {selected.accountNumber && (
                  <div>
                    <p className="text-xs font-bold text-gray-500">BOB ACCOUNT</p>
                    <p className="text-sm font-semibold text-gray-900">{selected.accountNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-500">PAYMENT TYPE</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {(selected as any)._type === "EMI" ? `EMI - ${selected.purchaseName || "Purchase"}` : "Beauty Saving Deposit"}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-4 rounded-2xl bg-slate-50 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500">AMOUNT</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{Number(selected.amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">METHOD</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.paymentMethod || "UPI"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">TRANSACTION ID / UTR</p>
                  <p className="rounded bg-white px-3 py-2 font-mono text-sm font-bold text-gray-900">
                    {selected.transactionId || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">SUBMITTED</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selected.submittedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Screenshot */}
            <div className="mt-4 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold text-gray-500">PAYMENT SCREENSHOT</p>
              {loadingScreenshot ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-200 border-t-pink-600" />
                  <span className="text-sm text-gray-500">Loading screenshot...</span>
                </div>
              ) : screenshotUrl ? (
                <div className="mt-3">
                  <img
                    src={screenshotUrl}
                    alt="Payment Screenshot"
                    className="max-h-80 rounded-xl border border-gray-200 object-contain"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    {selected.paymentScreenshotName || "payment-proof.jpg"}
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-400">No screenshot available</p>
                </div>
              )}
            </div>

            {/* Verify Note */}
            <div className="mt-4 rounded-2xl bg-yellow-50 p-5">
              <p className="font-bold text-yellow-800">⚠ Verification Checklist</p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                <li>☐ Verify UTR/Transaction ID in your bank/UPI app</li>
                <li>☐ Confirm amount matches the declared amount</li>
                <li>☐ Check screenshot is genuine (not edited)</li>
                <li>☐ Verify payment was made to correct UPI ID</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={() => handleApprove(selected)}
                className="flex-1 rounded-2xl bg-green-600 px-6 py-3.5 font-bold text-white hover:bg-green-700"
              >
                ✓ APPROVE PAYMENT
              </button>
              <button
                type="button"
                onClick={() => handleReject(selected)}
                className="flex-1 rounded-2xl bg-red-500 px-6 py-3.5 font-bold text-white hover:bg-red-600"
              >
                ✗ REJECT PAYMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
