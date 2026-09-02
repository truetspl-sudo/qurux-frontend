"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet } from "@/lib/api";

type Payment = {
  id: string;
  customerName: string;
  reference: string;
  type: "BOOKING" | "ORDER" | "EMI" | "WALLET";
  method: "Full Payment" | "No Cost EMI" | "Pay from BOB" | "Mixed/Split" | "Cash";
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
  date: string;
  transactionId?: string;
};

const defaultPayments: Payment[] = [
  { id: "PAY-001", customerName: "Priya Sharma", reference: "BK-2026-0891", type: "BOOKING", method: "Full Payment", amount: 15999, status: "APPROVED", date: "2026-08-20", transactionId: "TXN-9876543210" },
  { id: "PAY-002", customerName: "Anjali Mehta", reference: "BK-2026-0887", type: "BOOKING", method: "Pay from BOB", amount: 2499, status: "APPROVED", date: "2026-08-18" },
  { id: "PAY-003", customerName: "Ritu Kapoor", reference: "BK-2026-0876", type: "BOOKING", method: "No Cost EMI", amount: 3000, status: "APPROVED", date: "2026-08-15", transactionId: "TXN-1122334455" },
  { id: "PAY-004", customerName: "Priya Sharma", reference: "ORD-2026-0123", type: "ORDER", method: "Full Payment", amount: 4097, status: "APPROVED", date: "2026-08-20", transactionId: "TXN-5566778899" },
  { id: "PAY-005", customerName: "Ritu Kapoor", reference: "EMI-PAY-003", type: "EMI", method: "Cash", amount: 2000, status: "PENDING", date: "2026-08-28" },
  { id: "PAY-006", customerName: "Sunita Devi", reference: "ORD-2026-0126", type: "ORDER", method: "No Cost EMI", amount: 2397, status: "PENDING", date: "2026-08-29" },
];

const typeColors: Record<string, string> = { BOOKING: "bg-pink-100 text-pink-600", ORDER: "bg-blue-100 text-blue-700", EMI: "bg-amber-100 text-amber-700", WALLET: "bg-green-100 text-green-700" };
const statusColors: Record<string, string> = { PENDING: "bg-orange-100 text-orange-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-600", REFUNDED: "bg-purple-100 text-purple-700" };

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(defaultPayments);
  useEffect(() => {
    async function load() {
      try {
        const bookings = await apiGet<any[]>("/bookings");
        if (bookings.ok && bookings.data.length > 0) {
          const mapped: Payment[] = bookings.data.map((b: any) => ({
            id: b.bookingId || b._id,
            customerName: b.customerName || "Unknown",
            reference: b.bookingId || b._id,
            type: "BOOKING" as const,
            method: b.paymentMethod === "BOB" ? "Pay from BOB" : b.paymentMethod === "EMI" ? "No Cost EMI" : b.paymentMethod === "MIXED" ? "Mixed/Split" : "Full Payment",
            amount: b.amount || 0,
            status: b.paymentStatus || "PENDING",
            date: b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : "",
          }));
          setPayments(mapped);
        }
      } catch {}
    }
    load();
  }, []);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = payments.filter((p) => {
    const matchType = filterType === "All" || p.type === filterType;
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchType && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filtered.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0);

  return (
    <AdminLayout title="Payments" subtitle="View all payment transactions — bookings, orders, EMI, wallet.">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">TOTAL TRANSACTIONS</p><p className="mt-2 text-3xl font-black text-gray-900">{payments.length}</p></div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm"><p className="text-sm font-semibold text-green-700">TOTAL AMOUNT</p><p className="mt-2 text-3xl font-black text-green-700">₹{totalAmount.toLocaleString("en-IN")}</p></div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm"><p className="text-sm font-semibold text-orange-700">PENDING</p><p className="mt-2 text-3xl font-black text-orange-700">₹{pendingAmount.toLocaleString("en-IN")}</p></div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm"><p className="text-sm font-semibold text-blue-700">APPROVED</p><p className="mt-2 text-3xl font-black text-blue-700">₹{payments.filter((p) => p.status === "APPROVED").reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}</p></div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500">
          <option value="All">All Types</option>
          {["BOOKING", "ORDER", "EMI", "WALLET"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500">
          <option value="All">All Status</option>
          {["PENDING", "APPROVED", "REJECTED", "REFUNDED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Payment ID</th>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">Type</th>
                <th className="px-5 py-3 font-bold text-gray-600">Method</th>
                <th className="px-5 py-3 font-bold text-gray-600">Amount</th>
                <th className="px-5 py-3 font-bold text-gray-600">Date</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">{payment.id}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">{payment.customerName}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${typeColors[payment.type]}`}>{payment.type}</span></td>
                  <td className="px-5 py-4 text-gray-600">{payment.method}</td>
                  <td className="px-5 py-4 font-bold text-pink-600">₹{payment.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-gray-600">{payment.date}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[payment.status]}`}>{payment.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-gray-500">No payments found.</div>}
      </div>
    </AdminLayout>
  );
}
