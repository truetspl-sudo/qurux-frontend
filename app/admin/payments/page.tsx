"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet } from "@/lib/api";

type Payment = {
  id: string;
  customerName: string;
  reference: string;
  type: "BOOKING" | "ORDER" | "EMI" | "WALLET";
  purpose: string;
  method: string;
  amount: number;
  status: "APPROVED" | "REJECTED" | "REFUNDED";
  date: string;
  transactionId?: string;
  screenshotUrl?: string;
  _id?: string;
};

type FilterCategory = "ALL" | "SAVING" | "EMI" | "BUY" | "COURSES" | "SERVICES";

const purposeFilters: { id: FilterCategory; label: string; icon: string }[] = [
  { id: "ALL", label: "All", icon: "📋" },
  { id: "SAVING", label: "Saving", icon: "💰" },
  { id: "EMI", label: "EMI", icon: "📊" },
  { id: "BUY", label: "Buy", icon: "🛍️" },
  { id: "COURSES", label: "Courses", icon: "🎓" },
  { id: "SERVICES", label: "Services", icon: "✂️" },
];

function mapToCategory(type: string, referenceName?: string): FilterCategory {
  if (type === "WALLET") return "SAVING";
  if (type === "EMI") return "EMI";
  if (type === "ORDER") return "BUY";
  if (type === "BOOKING") {
    const ref = (referenceName || "").toLowerCase();
    if (ref.includes("course") || ref.includes("academy")) return "COURSES";
    return "SERVICES";
  }
  return "SERVICES";
}

function mapToPurpose(type: string, referenceName?: string): string {
  if (type === "WALLET") return "Saving for Beauty";
  if (type === "EMI") return referenceName ? `EMI — ${referenceName}` : "EMI Payment";
  if (type === "ORDER") return referenceName ? `Buy — ${referenceName}` : "Product Purchase";
  if (type === "BOOKING") {
    const ref = (referenceName || "").toLowerCase();
    if (ref.includes("course") || ref.includes("academy")) {
      return referenceName ? `Course — ${referenceName}` : "Course Enrollment";
    }
    return referenceName ? `Service — ${referenceName}` : "Service Booking";
  }
  return referenceName || "Payment";
}

const typeColors: Record<string, string> = {
  SAVING: "bg-green-100 text-green-700",
  EMI: "bg-amber-100 text-amber-700",
  BUY: "bg-blue-100 text-blue-700",
  COURSES: "bg-purple-100 text-purple-700",
  SERVICES: "bg-pink-100 text-pink-600",
};

const methodLabels: Record<string, string> = {
  UPI: "UPI",
  CASH: "Cash",
  BOB: "BOB",
  CARD: "Card",
  NET_BANKING: "Net Banking",
};

const methodIcons: Record<string, string> = {
  UPI: "📱",
  CASH: "💵",
  BOB: "🏦",
  CARD: "💳",
  NET_BANKING: "🌐",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadError, setLoadError] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function load() {
    try {
      setLoadError("");
      const res = await apiGet<any[]>("/payments");
      if (!res.ok) {
        setLoadError(
          res.status === 401 || res.status === 403
            ? "Login as Admin required."
            : res.message || "Failed to load payments"
        );
        return;
      }
      const mapped: Payment[] = res.data
        .filter((p: any) => p.status !== "PENDING") // Auto-verified: no PENDING
        .map((p: any) => {
          const type = (p.referenceType === "ORDER" || p.referenceType === "EMI" || p.referenceType === "WALLET"
            ? p.referenceType
            : "BOOKING") as Payment["type"];
          const refName = p.referenceName || p.bookingId?.bookingId || p.orderId?.orderId || "";
          return {
            id: p.paymentId || p._id,
            _id: p._id,
            customerName: p.customerId?.fullName || p.customerName || "Customer",
            reference: refName,
            type,
            purpose: mapToPurpose(type, refName),
            method: methodLabels[p.method] || p.method || "UPI",
            amount: p.amount || 0,
            status: p.status || "APPROVED",
            date: p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : "",
            transactionId: p.transactionId || "",
            screenshotUrl: p.screenshotUrl || "",
          };
        });
      setPayments(mapped);
    } catch {
      setLoadError("Failed to load payments");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = payments.filter((p) => {
    const category = mapToCategory(p.type, p.reference);
    const matchCategory = filterCategory === "ALL" || category === filterCategory;
    const matchSearch =
      !searchQuery ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const categoryTotals = purposeFilters.slice(1).map((f) => ({
    ...f,
    count: payments.filter((p) => mapToCategory(p.type, p.reference) === f.id).length,
    amount: payments
      .filter((p) => mapToCategory(p.type, p.reference) === f.id)
      .reduce((sum, p) => sum + p.amount, 0),
  }));

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout
      title="Payments"
      subtitle="Auto-verified payments ka record — kis liye payment hui hai dikhta hai."
    >
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-gray-400">TOTAL</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{payments.length}</p>
          <p className="text-xs font-semibold text-gray-500">
            ₹{payments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}
          </p>
        </div>
        {categoryTotals.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl p-4 shadow-sm ${
              filterCategory === c.id ? "bg-pink-100 ring-2 ring-pink-400" : "bg-white"
            }`}
          >
            <p className="text-[10px] font-bold uppercase text-gray-400">
              {c.icon} {c.label}
            </p>
            <p className="mt-1 text-2xl font-black text-gray-900">{c.count}</p>
            <p className="text-xs font-semibold text-gray-500">
              ₹{c.amount.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      {/* Error */}
      {loadError && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          ❌ {loadError}
        </div>
      )}

      {/* Search bar */}
      <div className="mt-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, purpose, payment ID, or transaction ID..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Purpose filter tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {purposeFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterCategory(f.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              filterCategory === f.id
                ? "bg-pink-600 text-white shadow-md"
                : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Payments table */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Payment</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Customer</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Purpose</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Category</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Method</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Txn ID</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((payment) => {
                const category = mapToCategory(payment.type, payment.reference);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-600">
                      {payment.id}
                      {payment.screenshotUrl && (
                        <a
                          href={payment.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          📷 Screenshot
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{payment.customerName}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="truncate text-xs font-bold text-gray-800">{payment.purpose}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${typeColors[category]}`}>
                        {category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span>{methodIcons[payment.method] || "💳"} </span>
                      {payment.method}
                    </td>
                    <td className="px-4 py-3 font-bold text-pink-600">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-600">
                      {payment.transactionId || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{payment.date}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                        ✅ AUTO-VERIFIED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            {searchQuery ? `No payments match "${searchQuery}"` : "No payments found."}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Showing {filtered.length} of {payments.length} payments
        {filterCategory !== "ALL" && ` • Category: ${filterCategory}`}
        {totalAmount > 0 && ` • Total: ₹${totalAmount.toLocaleString("en-IN")}`}
      </p>
    </AdminLayout>
  );
}
