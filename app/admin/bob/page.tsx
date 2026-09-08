"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

// ── Types ──
type DepositRow = {
  requestId: string;
  walletId: string;
  customerId: any;
  customerName: string;
  mobile: string;
  accountNumber: string;
  amount: number;
  reference: string;
  screenshotUrl?: string;
  submittedAt: string;
  status: string;
};

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

function num(v: any) { return Number(v || 0); }

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  USED: "bg-slate-100 text-slate-600",
};

export default function AdminBobWalletPage() {
  const [tab, setTab] = useState<"deposits" | "wallets">("deposits");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Deposits state
  const [deposits, setDeposits] = useState<DepositRow[]>([]);

  // Wallets state
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
      const data = res.data || [];
      setWallets(data);

      // Flatten deposits
      const flat: DepositRow[] = [];
      data.forEach((w: any) => {
        (w.deposits || []).forEach((dep: any) => {
          flat.push({
            requestId: dep._id,
            walletId: w._id,
            customerId: w.customerId?._id || w.customerId,
            customerName: w.customerId?.fullName || "Customer",
            mobile: w.customerId?.mobile || "",
            accountNumber: w.accountNumber,
            amount: dep.originalAmount || 0,
            reference: dep.reference || "",
            screenshotUrl: dep.screenshotUrl || "",
            submittedAt: dep.submittedAt || dep.depositDate || "",
            status: dep.status || "PENDING",
          });
        });
      });
      flat.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setDeposits(flat);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Deposit Actions ──
  async function actDep(row: DepositRow, action: "approve" | "reject") {
    setActionBusy(`${action}:${row.requestId}`);
    setToast(null);
    try {
      const res = await apiPatch(`/wallet/${row.walletId}/deposits/${row.requestId}/${action}`, {});
      if (res.ok) {
        setToast({ ok: true, text: action === "approve"
          ? `✅ ₹${row.amount.toLocaleString("en-IN")} deposit APPROVED`
          : `❌ Deposit REJECTED` });
        load();
      } else {
        setToast({ ok: false, text: res.message || "Action failed" });
      }
    } catch (err: any) {
      setToast({ ok: false, text: err?.message || "Error" });
    }
    setActionBusy(null);
  }

  function copyMsg(row: DepositRow) {
    const status = row.status === "ACTIVE" ? "APPROVED ✅" : row.status === "REJECTED" ? "REJECTED ❌" : "PENDING ⏳";
    const lines = [
      `🌟 *QURUX MAKEOVER & ACADEMY* 🌟`, "",
      `Dear *${row.customerName}*,`, "",
      `Aapka BOB deposit ${status}`, "",
      `💰 Amount: ₹${row.amount.toLocaleString("en-IN")}`,
      row.reference ? `🧾 Ref: ${row.reference}` : "",
      `💳 BOB Account: ${row.accountNumber}`, "",
      "Thank you for choosing Qurux! ✨",
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n"));
    setToast({ ok: true, text: "WhatsApp message copied!" });
  }

  // ── Wallet Credit ──
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

  // ── Computed ──
  const pending = deposits.filter((r) => r.status === "PENDING");
  const pendingTotal = pending.reduce((s, r) => s + r.amount, 0);
  const filtered = deposits.filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    const q = search.toLowerCase();
    return !q || r.customerName.toLowerCase().includes(q) || r.mobile.includes(q) || r.accountNumber.toLowerCase().includes(q);
  });
  const totalDeposited = wallets.reduce((s, w) => s + (w.deposits || []).filter((d) => d.status === "ACTIVE" || d.status === "USED").reduce((x, d) => x + num(d.originalAmount), 0), 0);
  const totalPromo = wallets.reduce((s, w) => s + num(w.promotionalBalance), 0);
  const totalPendingAmt = wallets.reduce((s, w) => s + (w.deposits || []).filter((d) => d.status === "PENDING").reduce((x, d) => x + num(d.originalAmount), 0), 0);
  const wFiltered = wallets.filter((w) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name = w.customerId?.fullName || "";
    const mobile = w.customerId?.mobile || "";
    return name.toLowerCase().includes(q) || mobile.includes(q) || w.accountNumber.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="BOB Wallet" subtitle="Manage deposits, wallets and promotional credit.">
      {/* Stats */}
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
          <p className="mt-2 text-3xl font-black text-orange-700">₹{totalPendingAmt.toLocaleString("en-IN")}</p>
          <p className="text-xs text-orange-600">{pending.length} requests</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">PROMOTIONAL BALANCE</p>
          <p className="mt-2 text-3xl font-black text-blue-700">₹{totalPromo.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => setTab("deposits")} className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${tab === "deposits" ? "bg-pink-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          💳 Deposit Approvals ({pending.length})
        </button>
        <button type="button" onClick={() => setTab("wallets")} className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${tab === "wallets" ? "bg-pink-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          🏦 All Wallets ({wallets.length})
        </button>
      </div>

      {/* Search */}
      <div className="mt-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or account..." className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mt-4 rounded-2xl p-4 text-sm font-semibold ${toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.text}
          <button type="button" onClick={() => setToast(null)} className="ml-3 font-bold">×</button>
        </div>
      )}

      {/* ── TAB: Deposit Approvals ── */}
      {tab === "deposits" && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <p className="w-full text-xs font-bold uppercase text-gray-400">STATUS</p>
            {["PENDING", "ALL", "ACTIVE", "REJECTED"].map((s) => (
              <button key={s} type="button" onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${filter === s ? "bg-pink-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"}`}>
                {s === "ALL" ? "All" : s === "PENDING" ? "⏳ Pending" : s === "ACTIVE" ? "✅ Active" : "❌ Rejected"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center text-gray-500">No deposits found.</div>
          ) : (
            <div className="mt-5 space-y-3">
              {filtered.map((row) => (
                <div key={row.requestId} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{row.customerName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColors[row.status] || "bg-gray-100"}`}>{row.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">📱 {row.mobile} • 💳 {row.accountNumber}</p>
                      <p className="text-sm text-gray-500">💰 ₹{row.amount.toLocaleString("en-IN")} • {row.reference || "No ref"}</p>
                      <p className="text-xs text-gray-400">{row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-IN") : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      {row.status === "PENDING" && (
                        <>
                          <button type="button" onClick={() => actDep(row, "approve")} disabled={actionBusy !== null} className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">
                            {actionBusy === `approve:${row.requestId}` ? "..." : "✅ Approve"}
                          </button>
                          <button type="button" onClick={() => actDep(row, "reject")} disabled={actionBusy !== null} className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-200 disabled:opacity-50">
                            {actionBusy === `reject:${row.requestId}` ? "..." : "❌ Reject"}
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => copyMsg(row)} className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-100">
                        📱 Copy WA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: All Wallets ── */}
      {tab === "wallets" && (
        <>
          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center text-gray-500">Loading...</div>
          ) : wFiltered.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center text-gray-500">No wallets found.</div>
          ) : (
            <div className="mt-5 space-y-3">
              {wFiltered.map((w) => {
                const active = (w.deposits || []).filter((d) => d.status === "ACTIVE");
                const balance = active.reduce((s, d) => s + Math.max(0, num(d.originalAmount) - num(d.usedAmount)), 0);
                const pendDep = (w.deposits || []).filter((d) => d.status === "PENDING").length;
                return (
                  <div key={w._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{w.customerId?.fullName || "Customer"}</p>
                        <p className="text-sm text-gray-500">📱 {w.customerId?.mobile || ""} • 💳 {w.accountNumber}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Balance: ₹{balance.toLocaleString("en-IN")}</span>
                          {pendDep > 0 && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">⏳ {pendDep} pending</span>}
                          {num(w.promotionalBalance) > 0 && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">🎁 ₹{num(w.promotionalBalance).toLocaleString("en-IN")} promo</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSelected(selected?._id === w._id ? null : w)} className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200">
                          {selected?._id === w._id ? "Close" : "👁 View"}
                        </button>
                        <button type="button" onClick={() => { setCreditTarget(w); setCreditAmount(""); setCreditDesc(""); setCreditMsg(null); }} className="rounded-full bg-pink-100 px-4 py-2 text-xs font-bold text-pink-700 hover:bg-pink-200">
                          🎁 Credit
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {selected?._id === w._id && (
                      <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                        <p className="font-bold text-gray-700">DEPOSITS ({(w.deposits || []).length})</p>
                        {(w.deposits || []).length === 0 ? (
                          <p className="mt-1 text-gray-400">No deposits yet.</p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {(w.deposits || []).map((d: any, i: number) => (
                              <div key={i} className="flex items-center justify-between rounded-lg bg-white p-2">
                                <span>₹{num(d.originalAmount).toLocaleString("en-IN")} — {d.status}</span>
                                <span className="text-xs text-gray-400">{d.depositDate ? new Date(d.depositDate).toLocaleDateString("en-IN") : ""}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {(w.usageHistory || []).length > 0 && (
                          <>
                            <p className="mt-3 font-bold text-gray-700">USAGE HISTORY</p>
                            {(w.usageHistory || []).slice(-5).reverse().map((h: any, i: number) => (
                              <div key={i} className="flex items-center justify-between rounded-lg bg-white p-2 mt-1">
                                <span className="text-red-600">-₹{num(h.amount).toLocaleString("en-IN")}</span>
                                <span className="text-xs text-gray-500">{h.description || ""}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
        </>
      )}
    </AdminLayout>
  );
}
