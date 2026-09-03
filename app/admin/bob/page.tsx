"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPost } from "@/lib/api";

type WalletRow = {
  _id: string;
  accountNumber: string;
  customerId: any;
  deposits: any[];
  promotionalBalance: number;
  promotionalHistory: any[];
  usageHistory: any[];
  createdAt?: string;
};

function num(v: any) {
  return Number(v || 0);
}

export default function AdminBobWalletPage() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WalletRow | null>(null);
  const [creditTarget, setCreditTarget] = useState<WalletRow | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [creditMsg, setCreditMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [creditBusy, setCreditBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await apiGet<any[]>("/wallet/all");
      if (!res.ok) {
        setLoadError(
          res.status === 401 || res.status === 403
            ? "Login as Admin required. Pehle /account pe ADMIN User ID se login karein."
            : res.message || "Failed to load wallets"
        );
        return;
      }
      setWallets(res.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function activePrincipal(w: WalletRow) {
    return (w.deposits || [])
      .filter((d) => d.status === "ACTIVE")
      .reduce((s, d) => s + Math.max(0, num(d.originalAmount) - num(d.usedAmount)), 0);
  }

  function pendingCount(w: WalletRow) {
    return (w.deposits || []).filter((d) => d.status === "PENDING").length;
  }

  const filtered = wallets.filter((w) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name = w.customerId?.fullName || "";
    const mobile = w.customerId?.mobile || "";
    return (
      name.toLowerCase().includes(q) ||
      mobile.includes(q) ||
      w.accountNumber.toLowerCase().includes(q)
    );
  });

  const totalDeposited = wallets.reduce(
    (s, w) =>
      s +
      (w.deposits || [])
        .filter((d) => d.status === "ACTIVE" || d.status === "USED")
        .reduce((x, d) => x + num(d.originalAmount), 0),
    0
  );
  const totalPromo = wallets.reduce((s, w) => s + num(w.promotionalBalance), 0);
  const totalPendingAmount = wallets.reduce(
    (s, w) =>
      s +
      (w.deposits || [])
        .filter((d) => d.status === "PENDING")
        .reduce((x, d) => x + num(d.originalAmount), 0),
    0
  );

  async function submitCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditTarget) return;
    const amount = Number(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      setCreditMsg({ ok: false, text: "Valid amount daalein." });
      return;
    }
    const customerId = creditTarget.customerId?._id || creditTarget.customerId;
    if (!customerId) {
      setCreditMsg({ ok: false, text: "Customer info missing." });
      return;
    }
    setCreditBusy(true);
    setCreditMsg(null);
    try {
      const res = await apiPost("/wallet/promotional", {
        customerId,
        amount,
        description: creditDesc.trim() || "Promotional Credit",
      });
      if (res.ok) {
        setCreditMsg({ ok: true, text: `✅ ₹${amount.toLocaleString("en-IN")} promotional balance credited.` });
        setCreditAmount("");
        setCreditDesc("");
        setCreditTarget(null);
        load();
      } else {
        setCreditMsg({ ok: false, text: res.message || "Credit failed" });
      }
    } catch (err: any) {
      setCreditMsg({ ok: false, text: err?.message || "Error occurred" });
    }
    setCreditBusy(false);
  }

  return (
    <AdminLayout
      title="BOB Wallet"
      subtitle="Manage customer BOB accounts — deposits, balances aur promotional credit."
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">TOTAL WALLETS</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{wallets.length}</p>
        </div>
        <div className="rounded-2xl bg-pink-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-pink-700">TOTAL DEPOSITED</p>
          <p className="mt-2 text-3xl font-black text-pink-700">₹{totalDeposited.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING APPROVAL</p>
          <p className="mt-2 text-3xl font-black text-orange-700">₹{totalPendingAmount.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">PROMOTIONAL</p>
          <p className="mt-2 text-3xl font-black text-green-700">₹{totalPromo.toLocaleString("en-IN")}</p>
        </div>
      </div>

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
          placeholder="Search customer, mobile, account..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
        <button
          onClick={load}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
        <span className="text-xs text-gray-400">Deposit approvals admin/bob-payments page pe karein.</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">BOB Account</th>
                <th className="px-5 py-3 font-bold text-gray-600">Active Balance</th>
                <th className="px-5 py-3 font-bold text-gray-600">Promo</th>
                <th className="px-5 py-3 font-bold text-gray-600">Deposits</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    {loading ? "Loading..." : "No wallets found."}
                  </td>
                </tr>
              )}
              {filtered.map((w) => (
                <tr key={w._id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{w.customerId?.fullName || "Customer"}</p>
                    <p className="text-xs text-gray-500">{w.customerId?.mobile || ""}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-600">{w.accountNumber}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">₹{activePrincipal(w).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 font-semibold text-green-600">₹{num(w.promotionalBalance).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-xs text-gray-600">
                    {(w.deposits || []).length} total
                    {pendingCount(w) > 0 && (
                      <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                        {pendingCount(w)} PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelected(w)}
                        className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                      >
                        👁 View
                      </button>
                      <button
                        onClick={() => {
                          setCreditTarget(w);
                          setCreditMsg(null);
                          setCreditAmount("");
                          setCreditDesc("");
                        }}
                        className="rounded-full bg-pink-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-700"
                      >
                        🎁 Credit Promo
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">BANK OF BEAUTY — BOB</p>
                <h3 className="mt-1 text-2xl font-black text-gray-900">{selected.customerId?.fullName || "Customer"}</h3>
                <p className="text-sm text-gray-500">{selected.customerId?.mobile || ""} · Account: <span className="font-mono">{selected.accountNumber}</span></p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200">✕</button>
            </div>

            <div className="mt-5 rounded-2xl bg-pink-50 p-5">
              <p className="text-sm text-gray-600">Active Balance (principal) · Promo</p>
              <p className="mt-1 text-3xl font-black text-gray-900">
                ₹{activePrincipal(selected).toLocaleString("en-IN")}
                <span className="ml-3 text-lg font-bold text-green-600">+ ₹{num(selected.promotionalBalance).toLocaleString("en-IN")}</span>
              </p>
            </div>

            <h4 className="mt-6 font-bold text-gray-800">Deposits ({selected.deposits?.length || 0})</h4>
            <div className="mt-2 space-y-2">
              {selected.deposits?.length === 0 && <p className="text-sm text-gray-400">No deposits.</p>}
              {selected.deposits?.map((d: any) => (
                <div key={d._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 p-4">
                  <div>
                    <p className="font-bold text-gray-900">₹{num(d.originalAmount).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-500">
                      {d.submittedAt ? new Date(d.submittedAt).toLocaleString("en-IN") : new Date(d.depositDate).toLocaleString("en-IN")}
                      {d.reference ? ` · Ref: ${d.reference}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${d.status === "ACTIVE" ? "bg-green-100 text-green-700" : d.status === "PENDING" ? "bg-orange-100 text-orange-700" : d.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                      {d.status}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">Used: ₹{num(d.usedAmount).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>

            {selected.usageHistory?.length > 0 && (
              <>
                <h4 className="mt-6 font-bold text-gray-800">BOB Usage (FIFO)</h4>
                <div className="mt-2 space-y-2">
                  {selected.usageHistory.map((u: any, i: number) => (
                    <div key={i} className="flex justify-between rounded-xl border border-gray-100 p-3 text-sm">
                      <span className="text-gray-700">{u.description || "Qurux Purchase"}</span>
                      <span className="font-bold text-red-500">−₹{num(u.amount).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selected.promotionalHistory?.length > 0 && (
              <>
                <h4 className="mt-6 font-bold text-gray-800">Promotional History</h4>
                <div className="mt-2 space-y-2">
                  {selected.promotionalHistory.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between rounded-xl border border-gray-100 p-3 text-sm">
                      <span className="text-gray-700">{p.description || "Promotional Credit"}</span>
                      <span className="font-bold text-green-600">+₹{num(p.amount).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Promo credit modal */}
      {creditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCreditTarget(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">PROMOTIONAL CREDIT</p>
            <h3 className="mt-1 text-xl font-black text-gray-900">{creditTarget.customerId?.fullName || "Customer"}</h3>
            <p className="text-xs text-gray-500">{creditTarget.accountNumber}</p>
            <form onSubmit={submitCredit} className="mt-5 space-y-4">
              <input
                type="number"
                min={1}
                required
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
              />
              <input
                type="text"
                value={creditDesc}
                onChange={(e) => setCreditDesc(e.target.value)}
                placeholder="Description (e.g. Birthday gift ₹500)"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-500"
              />
              {creditMsg && (
                <p className={`text-sm font-semibold ${creditMsg.ok ? "text-green-600" : "text-red-600"}`}>{creditMsg.text}</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setCreditTarget(null)} className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creditBusy} className="flex-1 rounded-full bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50">
                  {creditBusy ? "Crediting..." : "CREDIT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
