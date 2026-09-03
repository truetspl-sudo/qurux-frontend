"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type DepositRow = {
  requestId: string;
  walletId: string;
  customerId: any;
  customerName: string;
  mobile: string;
  accountNumber: string;
  amount: number;
  reference: string;
  submittedAt: string;
  status: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  USED: "bg-slate-100 text-slate-600",
};

export default function AdminBobPaymentsPage() {
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await apiGet<any[]>("/wallet/all");
      if (!res.ok) {
        setLoadError(
          res.status === 401 || res.status === 403
            ? "Login as Admin required. Pehle /account pe ADMIN User ID se login karein."
            : res.message || "Failed to load BOB payments"
        );
        return;
      }
      const flattened: DepositRow[] = [];
      (res.data || []).forEach((w: any) => {
        (w.deposits || []).forEach((dep: any) => {
          flattened.push({
            requestId: dep._id,
            walletId: w._id,
            customerId: w.customerId?._id || w.customerId,
            customerName: w.customerId?.fullName || "Customer",
            mobile: w.customerId?.mobile || "",
            accountNumber: w.accountNumber,
            amount: dep.originalAmount || 0,
            reference: dep.reference || "",
            submittedAt: dep.submittedAt || dep.depositDate || "",
            status: dep.status || "PENDING",
          });
        });
      });
      flattened.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setRows(flattened);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(row: DepositRow, action: "approve" | "reject") {
    setActionBusy(`${action}:${row.requestId}`);
    setToast(null);
    try {
      const res = await apiPatch(
        `/wallet/${row.walletId}/deposits/${row.requestId}/${action}`,
        {}
      );
      if (res.ok) {
        setToast({
          ok: true,
          text:
            action === "approve"
              ? `✅ ₹${row.amount.toLocaleString("en-IN")} deposit APPROVED — BOB balance credit ho gaya. Customer ko WhatsApp par confirm karein.`
              : `❌ Deposit request REJECTED. Customer ko WhatsApp par inform karein.`,
        });
        load();
      } else {
        setToast({ ok: false, text: res.message || "Action failed" });
      }
    } catch (err: any) {
      setToast({ ok: false, text: err?.message || "Error occurred" });
    }
    setActionBusy(null);
  }

  function copyMsg(row: DepositRow) {
    const lines = [
      "🌟 *QURUX MAKEOVER & ACADEMY* 🌟",
      "",
      `Dear *${row.customerName}*,`,
      "",
      actionCopy(row),
      "",
      `💰 Amount: ₹${row.amount.toLocaleString("en-IN")}`,
      row.reference ? `🧾 Ref: ${row.reference}` : "",
      `💳 BOB Account: ${row.accountNumber}`,
      "",
      "Thank you for choosing Qurux! ✨",
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n"));
    setToast({ ok: true, text: "WhatsApp message copy ho gaya — customer ko bhejein." });
  }

  function actionCopy(row: DepositRow) {
    return row.status === "ACTIVE"
      ? "Aapki BOB deposit APPROVE ho gayi hai aur balance credit ho gaya hai ✅"
      : row.status === "REJECTED"
        ? "Aapki BOB deposit request REJECT ho gayi hai. Kripya WhatsApp par sampark karein."
        : "Aapka BOB deposit request aa gaya hai — verification ke liye kuch der intazaar karein.";
  }

  const pending = rows.filter((r) => r.status === "PENDING");
  const pendingTotal = pending.reduce((s, r) => s + r.amount, 0);

  const filtered = rows.filter((r) => {
    const matchStatus = filter === "ALL" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.customerName.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.accountNumber.toLowerCase().includes(q) ||
      (r.reference || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <AdminLayout
      title="BOB Payments"
      subtitle="Manual deposit approval — customer ka UPI payment verify karke approve/reject karein."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">PENDING REQUESTS</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{pending.length}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING AMOUNT</p>
          <p className="mt-2 text-3xl font-black text-orange-700">₹{pendingTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">TOTAL DEPOSIT REQUESTS</p>
          <p className="mt-2 text-3xl font-black text-green-700">{rows.length}</p>
        </div>
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, mobile, account, ref..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500"
        >
          <option value="PENDING">Pending (Review Queue)</option>
          <option value="ALL">All</option>
          <option value="ACTIVE">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="USED">Used</option>
        </select>
        <button
          onClick={load}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">BOB Account</th>
                <th className="px-5 py-3 font-bold text-gray-600">Amount</th>
                <th className="px-5 py-3 font-bold text-gray-600">UPI Ref</th>
                <th className="px-5 py-3 font-bold text-gray-600">Requested</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    {loading ? "Loading..." : "No deposit requests found."}
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.requestId} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{row.customerName}</p>
                    <p className="text-xs text-gray-500">{row.mobile}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-600">{row.accountNumber}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">₹{row.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-600">{row.reference || "—"}</td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-IN") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[row.status] || "bg-gray-100 text-gray-600"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => act(row, "approve")}
                            disabled={actionBusy === `approve:${row.requestId}`}
                            className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionBusy === `approve:${row.requestId}` ? "..." : "✓ APPROVE"}
                          </button>
                          <button
                            onClick={() => act(row, "reject")}
                            disabled={actionBusy === `reject:${row.requestId}`}
                            className="rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-200 disabled:opacity-50"
                          >
                            ✕ REJECT
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => copyMsg(row)}
                        className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100"
                      >
                        📋 WhatsApp Msg
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        💡 Rule: Customer UPI se paise bhejta hai → aap verify karein (bank app / WhatsApp) → APPROVE dabayein. Approve hote hi deposit ACTIVE hota hai aur 30-din beauty benefit clock start hota hai. Manual WhatsApp message customer ko bhejna na bhoolein.
      </p>
    </AdminLayout>
  );
}
