"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPost } from "@/lib/api";

type WalletRow = {
  _id: string;
  accountNumber: string;
  customerId: any;
  deposits: any[];
  usageHistory: any[];
  promotionalBalance: number;
  promotionalHistory: any[];
  createdAt?: string;
};

function num(v: any) { return Number(v || 0); }

export default function AdminBobWalletPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [wallets, setWallets] = useState<WalletRow[]>([]);
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
        setLoadError(res.status === 401 || res.status === 403
          ? "Login as Admin required."
          : res.message || "Failed to load");
        setLoading(false);
        return;
      }
      setWallets(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditTarget) return;
    const amount = Number(creditAmount);
    if (isNaN(amount) || amount <= 0) { setCreditMsg({ ok: false, text: "Valid amount daalein." }); return; }
    const customerId = creditTarget.customerId?._id || creditTarget.customerId;
    if (!customerId) { setCreditMsg({ ok: false, text: "Customer info missing." }); return; }
    setCreditBusy(true);
    setCreditMsg(null);
    try {
      const res = await apiPost("/wallet/promotional", { customerId, amount, description: creditDesc.trim() || "Promotional Credit" });
      if (res.ok) {
        setCreditMsg({ ok: true, text: `✅ ₹${amount.toLocaleString("en-IN")} credited.` });
        setCreditAmount(""); setCreditDesc(""); setCreditTarget(null); load();
      } else {
        setCreditMsg({ ok: false, text: res.message || "Failed" });
      }
    } catch (err: any) { setCreditMsg({ ok: false, text: err?.message || "Error" }); }
    setCreditBusy(false);
  }

  // ── Computed Stats ──
  const totalDeposited = wallets.reduce((s, w) => s + (w.deposits || []).filter((d) => d.status === "ACTIVE" || d.status === "USED").reduce((x, d) => x + num(d.originalAmount), 0), 0);
  const totalUsed = wallets.reduce((s, w) => s + (w.usageHistory || []).reduce((x, h) => x + num(h.amount), 0), 0);
  const totalBalance = wallets.reduce((s, w) => {
    const active = (w.deposits || []).filter((d) => d.status === "ACTIVE");
    return s + active.reduce((x, d) => x + Math.max(0, num(d.originalAmount) - num(d.usedAmount)), 0);
  }, 0);
  const totalIncentive = wallets.reduce((s, w) => s + num(w.promotionalBalance), 0);
  const totalCustomers = wallets.filter((w) => (w.deposits || []).some((d) => d.status === "ACTIVE" || d.status === "USED")).length;

  // ── Filtered List ──
  const filtered = wallets.filter((w) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name = w.customerId?.fullName || "";
    const mobile = w.customerId?.mobile || "";
    return name.toLowerCase().includes(q) || mobile.includes(q) || w.accountNumber.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="BOB Wallet" subtitle="Bank of Beauty — wallet overview and customer balances.">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Total Customers</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{totalCustomers}</p>
        </div>
        <div className="rounded-2xl bg-pink-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-pink-700">Total Deposited</p>
          <p className="mt-1 text-2xl font-black text-pink-700">₹{totalDeposited.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-green-700">Total Used</p>
          <p className="mt-1 text-2xl font-black text-green-700">₹{totalUsed.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-blue-700">Current Balance</p>
          <p className="mt-1 text-2xl font-black text-blue-700">₹{totalBalance.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-purple-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-purple-700">Incentive Balance</p>
          <p className="mt-1 text-2xl font-black text-purple-700">₹{totalIncentive.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search customer by name, mobile number, or account..."
          className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
      </div>

      {/* Error */}
      {loadError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">❌ {loadError}</div>
      )}

      {/* Toast */}
      {creditMsg && (
        <div className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${creditMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {creditMsg.text}
          <button type="button" onClick={() => setCreditMsg(null)} className="ml-3 font-bold">×</button>
        </div>
      )}

      {/* Customer Wallet Table */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
            <p className="mt-3 text-sm text-gray-500">Loading wallets...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-600">#</th>
                  <th className="px-4 py-3 font-bold text-gray-600">Customer Name</th>
                  <th className="px-4 py-3 font-bold text-gray-600">Mobile</th>
                  <th className="px-4 py-3 font-bold text-gray-600">BOB Account</th>
                  <th className="px-4 py-3 font-bold text-gray-600 text-right">Deposited</th>
                  <th className="px-4 py-3 font-bold text-gray-600 text-right">Used</th>
                  <th className="px-4 py-3 font-bold text-gray-600 text-right">Balance</th>
                  <th className="px-4 py-3 font-bold text-gray-600 text-right">Incentive</th>
                  <th className="px-4 py-3 font-bold text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((w, idx) => {
                  const deposited = (w.deposits || []).filter((d) => d.status === "ACTIVE" || d.status === "USED").reduce((x, d) => x + num(d.originalAmount), 0);
                  const used = (w.usageHistory || []).reduce((x, h) => x + num(h.amount), 0);
                  const active = (w.deposits || []).filter((d) => d.status === "ACTIVE");
                  const balance = active.reduce((x, d) => x + Math.max(0, num(d.originalAmount) - num(d.usedAmount)), 0);
                  const incentive = num(w.promotionalBalance);
                  return (
                    <tr key={w._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{w.customerId?.fullName || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{w.customerId?.mobile || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{w.accountNumber}</td>
                      <td className="px-4 py-3 text-right font-bold text-pink-700">₹{deposited.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">₹{used.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700">₹{balance.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-bold text-purple-700">₹{incentive.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelected(selected?._id === w._id ? null : w)}
                            className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
                          >
                            {selected?._id === w._id ? "Close" : "👁 View"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCreditTarget(w); setCreditAmount(""); setCreditDesc(""); setCreditMsg(null); }}
                            className="rounded-lg bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600 hover:bg-pink-100"
                          >
                            🎁 Credit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-gray-500">No wallets found.</div>
        )}
      </div>

      {/* Expanded Detail */}
      {selected && (
        <div className="mt-4 rounded-2xl border-2 border-pink-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-pink-600">Wallet Details</p>
              <h3 className="text-xl font-black text-gray-900">{selected.customerId?.fullName || "Customer"}</h3>
              <p className="text-sm text-gray-500">📱 {selected.customerId?.mobile || "—"} • 💳 {selected.accountNumber}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
          </div>

          {/* Deposit History */}
          <div className="mt-5">
            <p className="text-xs font-bold uppercase text-gray-400">Deposit History</p>
            {(selected.deposits || []).length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No deposits yet.</p>
            ) : (
              <div className="mt-2 overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 font-bold text-gray-500">Date</th>
                      <th className="px-3 py-2 font-bold text-gray-500">Amount</th>
                      <th className="px-3 py-2 font-bold text-gray-500">Used</th>
                      <th className="px-3 py-2 font-bold text-gray-500">Balance</th>
                      <th className="px-3 py-2 font-bold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(selected.deposits || []).map((d: any, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-600">{d.depositDate ? new Date(d.depositDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-3 py-2 font-bold text-pink-700">₹{num(d.originalAmount).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 font-bold text-green-700">₹{num(d.usedAmount).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 font-bold text-blue-700">₹{Math.max(0, num(d.originalAmount) - num(d.usedAmount)).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.status === "ACTIVE" ? "bg-green-100 text-green-700" : d.status === "USED" ? "bg-slate-100 text-slate-600" : "bg-orange-100 text-orange-700"}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Usage History */}
          {(selected.usageHistory || []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-gray-400">Usage History</p>
              <div className="mt-2 space-y-1">
                {(selected.usageHistory || []).slice(-10).reverse().map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-sm">
                    <span className="font-bold text-red-600">-₹{num(h.amount).toLocaleString("en-IN")}</span>
                    <span className="text-gray-500">{h.description || ""}</span>
                    <span className="text-xs text-gray-400">{h.date ? new Date(h.date).toLocaleDateString("en-IN") : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incentive */}
          {num(selected.promotionalBalance) > 0 && (
            <div className="mt-4 rounded-xl bg-purple-50 p-4">
              <p className="text-xs font-bold uppercase text-purple-700">🎁 Incentive Balance</p>
              <p className="mt-1 text-xl font-black text-purple-700">₹{num(selected.promotionalBalance).toLocaleString("en-IN")}</p>
            </div>
          )}
        </div>
      )}

      {/* Promotional Credit Modal */}
      {creditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-pink-600">🎁 PROMOTIONAL CREDIT</p>
                <h3 className="mt-1 text-xl font-black text-gray-900">{creditTarget.customerId?.fullName || "Customer"}</h3>
              </div>
              <button type="button" onClick={() => setCreditTarget(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>
            <form onSubmit={submitCredit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Amount (₹)</label>
                <input type="number" min={1} value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500" placeholder="e.g. 500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">Description</label>
                <input type="text" value={creditDesc} onChange={(e) => setCreditDesc(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500" placeholder="e.g. Festival Bonus" />
              </div>
              {creditMsg && <p className={`rounded-xl p-3 text-sm font-semibold ${creditMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{creditMsg.text}</p>}
              <button type="submit" disabled={creditBusy} className="w-full rounded-full bg-pink-600 px-5 py-3 font-bold text-white hover:bg-pink-700 disabled:opacity-50">
                {creditBusy ? "Processing..." : "🎁 CREDIT NOW"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
