"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet } from "@/lib/api";

type Booking = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  userId: string;
  service: string;
  date: string;
  timeSlot: string;
  location: string;
  locationType: "Home Service" | "Salon";
  paymentMethod: string;
  amount: number;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

const defaultBookings: Booking[] = [];

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState(defaultBookings);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await apiGet<any[]>("/bookings");
        if (!res.ok) {
          setLoadError(res.status === 401 || res.status === 403
            ? "Login as Admin required. Pehle /account pe ADMIN User ID se login karein."
            : res.message || "Failed to load bookings");
          return;
        }
        setBookings(res.data.map((b: any) => {
          const cust = b.customerId && typeof b.customerId === "object" ? b.customerId : {};
          return {
          id: b.bookingId, customerName: b.customerName || cust.fullName || "", phone: b.customerPhone || cust.mobile || "",
          email: b.customerEmail || cust.email || "", userId: cust.userId || "",
          service: b.serviceName, date: b.date, timeSlot: b.timeSlot || "",
          location: b.serviceLocation === "HOME" ? `Home — ${b.address}` : (b.salonName || "QURUX Salon"),
          locationType: b.serviceLocation === "HOME" ? "Home Service" : "Salon",
          paymentMethod: b.paymentMethod, amount: b.amount, status: b.status,
          };
        }));
      } catch {}
      setLoading(false);
    }
    fetchBookings();
  }, []);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "All" || b.status === filterStatus;
    const matchSearch =
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.service.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <AdminLayout title="Bookings" subtitle="View and manage all customer bookings.">
      <div className="grid gap-4 sm:grid-cols-5">
        {["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
          <div key={status} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">{status.replace("_", " ")}</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{bookings.filter((b) => b.status === status).length}</p>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          ❌ {loadError}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, or service..." className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["All", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${filterStatus === s ? "bg-pink-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"}`}>
            {s === "All" ? "All" : s === "PENDING" ? "⏳ Pending" : s === "CONFIRMED" ? "✅ Confirmed" : s === "IN_PROGRESS" ? "🔄 In Progress" : s === "COMPLETED" ? "🔒 Completed" : "❌ Cancelled"}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Booking ID</th>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">Service</th>
                <th className="px-5 py-3 font-bold text-gray-600">Date & Time</th>
                <th className="px-5 py-3 font-bold text-gray-600">Amount</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">{booking.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">{booking.customerName}</p>
                    <p className="text-xs text-gray-500">{booking.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{booking.service}</td>
                  <td className="px-5 py-4 text-gray-600">{booking.date} • {booking.timeSlot}</td>
                  <td className="px-5 py-4 font-bold text-pink-600">₹{booking.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[booking.status]}`}>{booking.status.replace("_", " ")}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setSelected(booking)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100">View</button>
                      {booking.status === "COMPLETED" ? (
                        <Link href="/admin/closures" className="rounded-lg bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-600 hover:bg-pink-100">Edit</Link>
                      ) : (
                        <Link href="/admin/closures" className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600 hover:bg-purple-100">Close</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-gray-500">No bookings found.</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-pink-600">{selected.id}</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{selected.customerName}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>
            {/* Customer Details */}
            <div className="mt-4 rounded-2xl border-2 border-pink-200 bg-pink-50 p-4">
              <p className="text-xs font-bold uppercase text-pink-600">👤 CUSTOMER DETAILS</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] text-gray-500">Name</p>
                  <p className="font-bold text-gray-900">{selected.customerName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Mobile</p>
                  <p className="font-bold text-gray-900">{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Email</p>
                  <p className="font-bold text-gray-900">{selected.email || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">User ID</p>
                  <p className="font-bold text-gray-900">{selected.userId || "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">SERVICE</p><p className="mt-1 font-bold text-gray-900">{selected.service}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">DATE & TIME</p><p className="mt-1 font-bold text-gray-900">{selected.date} • {selected.timeSlot}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">LOCATION TYPE</p><p className="mt-1 font-bold text-gray-900">{selected.locationType}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">LOCATION</p><p className="mt-1 text-sm font-bold text-gray-900">{selected.location}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">PAYMENT</p><p className="mt-1 font-bold text-gray-900">{selected.paymentMethod}</p></div>
              <div className="rounded-2xl bg-pink-50 p-4"><p className="text-xs font-bold text-pink-600">AMOUNT</p><p className="mt-1 text-xl font-black text-pink-600">₹{selected.amount.toLocaleString("en-IN")}</p></div>
            </div>
            <div className="mt-4"><span className={`rounded-full px-4 py-2 text-sm font-bold ${statusColors[selected.status]}`}>{selected.status.replace("_", " ")}</span></div>

            {/* Service Closure — admin yahan close/rating nahi kar sakta; proper page se hota hai */}
            {selected.status !== "COMPLETED" && selected.status !== "CANCELLED" ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-bold text-green-700">SERVICE CLOSURE</p>
                <p className="mt-1 text-xs text-gray-600">
                  Booking close + payment update Service Closure page se hote hain.
                </p>
                <Link
                  href="/admin/closures"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  🔒 OPEN SERVICE CLOSURE →
                </Link>
              </div>
            ) : selected.status === "COMPLETED" ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-green-100 p-5 text-center text-sm font-bold text-green-700">
                  ✅ Booking closed — payment reconciled by admin.
                </div>
                <Link
                  href="/admin/closures"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:border-pink-400 hover:text-pink-600"
                >
                  ✏️ EDIT PAYMENT DETAILS →
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-red-100 p-5 text-center text-sm font-bold text-red-600">
                Booking cancelled.
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
