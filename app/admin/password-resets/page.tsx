"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type ResetReq = {
  _id: string;
  userIdRef?: { fullName?: string; mobile?: string; userId?: string } | string;
  userId: string;
  fullName: string;
  mobile: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminRemarks?: string;
  createdAt: string;
  approvedAt?: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function AdminPasswordResetsPage() {
  const [requests, setRequests] = useState<ResetReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [busyId, setBusyId] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<ResetReq[]>("/password-resets");
      if (res.ok) setRequests(res.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(r: ResetReq) {
    setBusyId(r._id);
    const res = await apiPatch(`/password-resets/${r._id}/approve`, {});
    setBusyId("");
    if (res.ok) {
      await load();
    } else {
      alert(res.message || "Approve fail hua.");
    }
  }

  async function reject(r: ResetReq) {
    setBusyId(r._id);
    const res = await apiPatch(`/password-resets/${r._id}/reject`, {});
    setBusyId("");
    if (res.ok) {
      await load();
    } else {
      alert(res.message || "Reject fail hua.");
    }
  }

  function copyTemplate(r: ResetReq, approved: boolean) {
    const name = r.fullName || (typeof r.userIdRef === "object" && r.userIdRef?.fullName) || r.userId || "Customer";
    const msg = approved
      ? `Namaste ${name}! 🙏\nQURUX MAKEOVER & ACADEMY me aapka password reset request APPROVE ho gaya hai ✅\nAapka naya password ab active hai — ab isi se login karein.\nAgar aapne ye request khud nahi bheji thi to turant humein batayein (WhatsApp: 9911227916).`
      : `Namaste ${name}! 🙏\nAapka password reset request REJECT kar diya gaya hai ❌\nKripya dobara try karein ya humse WhatsApp pe baat karein (9911227916).`;
    navigator.clipboard.writeText(msg).then(() => setCopied(r._id + (approved ? "-a" : "-r")));
  }

  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };
  const filtered = requests.filter((r) => filter === "All" || r.status === filter);

  return (
    <AdminLayout
      title="Password Reset Requests"
      subtitle="Customers sirf naya password daalte hain (current password nahi). Yahan verify karke approve karein — approve hone par naya password active ho jata hai."
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING REQUESTS</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{counts.PENDING}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">APPROVED</p>
          <p className="mt-2 text-3xl font-black text-green-700">{counts.APPROVED}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-700">REJECTED</p>
          <p className="mt-2 text-3xl font-black text-red-700">{counts.REJECTED}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", "All"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === s ? "bg-pink-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-pink-50"
            }`}
          >
            {s === "PENDING" ? "Pending" : s === "All" ? "All" : s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            {filter === "PENDING" ? "🎉 Koi pending password reset request nahi hai." : "No requests found."}
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-gray-900">
                      {r.fullName || (typeof r.userIdRef === "object" && r.userIdRef?.fullName) || "Customer"}
                    </p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    User ID: <span className="font-bold text-pink-600">{r.userId}</span>
                    {" • "}
                    Mobile: <span className="font-bold">{r.mobile || (typeof r.userIdRef === "object" && r.userIdRef?.mobile) || "—"}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Requested: {r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "—"}
                  </p>
                </div>

                {r.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === r._id}
                      onClick={() => approve(r)}
                      className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {busyId === r._id ? "..." : "✓ APPROVE"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r._id}
                      onClick={() => reject(r)}
                      className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {busyId === r._id ? "..." : "✗ REJECT"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTemplate(r, true)}
                      className="rounded-full border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100"
                    >
                      {copied === r._id + "-a" ? "✅ Copied!" : "📋 Copy Approve Msg"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTemplate(r, false)}
                      className="rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                    >
                      {copied === r._id + "-r" ? "✅ Copied!" : "📋 Copy Reject Msg"}
                    </button>
                  </div>
                ) : (
                  <div className="text-right text-xs text-gray-400">
                    {r.approvedAt ? `Processed: ${new Date(r.approvedAt).toLocaleString("en-IN")}` : ""}
                  </div>
                )}
              </div>
              {r.adminRemarks && <p className="mt-2 text-xs italic text-gray-500">Remarks: {r.adminRemarks}</p>}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
