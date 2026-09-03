"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  userId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  registeredAt: string;
  bookings: number;
  totalSpent: number;
};

const defaultCustomers: Customer[] = [];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  // Approve modal state
  const [approveModal, setApproveModal] = useState<Customer | null>(null);
  const [approveUserId, setApproveUserId] = useState("");
  const [approveError, setApproveError] = useState("");
  const [approveSuccess, setApproveSuccess] = useState<{ customer: Customer; userId: string } | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await apiGet<any[]>("/admin/customers");
        if (!res.ok) {
          setLoadError(res.status === 401 || res.status === 403
            ? "Login as Admin required. Pehle /account pe ADMIN User ID se login karein."
            : res.message || "Failed to load customers");
          return;
        }
        if (res.data.length > 0) {
          setCustomers(res.data.map((c: any) => ({
            id: c._id, fullName: c.fullName, email: c.email || "", phone: c.mobile,
            userId: c.userId || "",
            status: c.status || "PENDING", registeredAt: c.createdAt?.split("T")[0] || "",
            bookings: 0, totalSpent: 0,
          })));
        }
      } catch {}
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.userId && c.userId.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  async function handleApprove() {
    if (!approveModal) return;
    if (!approveUserId.trim()) {
      setApproveError("User ID dena zaroori hai.");
      return;
    }

    setApproveError("");
    try {
      const res = await apiPatch(`/admin/customers/${approveModal.id}/approve`, {
        userId: approveUserId.trim(),
      });

      if (res.ok) {
        const updatedCustomer = { ...approveModal, status: "APPROVED" as const, userId: approveUserId.trim() };
        setCustomers((prev) => prev.map((c) => c.id === approveModal.id ? updatedCustomer : c));
        setApproveSuccess({ customer: updatedCustomer, userId: approveUserId.trim() });
        setApproveModal(null);
        setApproveUserId("");
      } else {
        setApproveError(res.message || "Approval failed.");
      }
    } catch (err: any) {
      setApproveError(err?.message || "Error occurred.");
    }
  }

  async function handleReject(id: string) {
    await apiPatch(`/admin/customers/${id}/reject`, {});
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, status: "REJECTED" } : c));
    setSelected(null);
  }

  const pendingCount = customers.filter((c) => c.status === "PENDING").length;
  const approvedCount = customers.filter((c) => c.status === "APPROVED").length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <AdminLayout title="Customers" subtitle="Manage customer accounts — approve, reject, view activity.">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">TOTAL CUSTOMERS</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{customers.length}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING APPROVAL</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">APPROVED</p>
          <p className="mt-2 text-3xl font-black text-green-700">{approvedCount}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">TOTAL REVENUE</p>
          <p className="mt-2 text-3xl font-black text-blue-700">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {loadError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          ❌ {loadError}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or User ID..." className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500">
          <option value="All">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-600">User ID</th>
                <th className="px-5 py-3 font-bold text-gray-600">Phone</th>
                <th className="px-5 py-3 font-bold text-gray-600">Bookings</th>
                <th className="px-5 py-3 font-bold text-gray-600">Total Spent</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">{customer.fullName}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{customer.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    {customer.userId ? (
                      <span className="font-mono text-xs font-bold text-pink-600">{customer.userId}</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{customer.phone}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">{customer.bookings}</td>
                  <td className="px-5 py-4 font-bold text-pink-600">₹{customer.totalSpent.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${customer.status === "PENDING" ? "bg-orange-100 text-orange-700" : customer.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSelected(customer)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100">View</button>
                      {customer.status === "PENDING" && (
                        <>
                          <button type="button" onClick={() => { setApproveModal(customer); setApproveUserId(""); setApproveError(""); setApproveSuccess(null); }} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100">Approve</button>
                          <button type="button" onClick={() => handleReject(customer.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-gray-500">No customers found.</div>}
      </div>

      {/* ── APPROVE MODAL — Admin enters userId manually ── */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">Approve Customer</h2>
            <p className="mt-1 text-sm text-gray-500">{approveModal.fullName} — {approveModal.phone}</p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Assign User ID *
              </label>
              <input
                type="text"
                value={approveUserId}
                onChange={(e) => { setApproveUserId(e.target.value.toUpperCase()); setApproveError(""); }}
                placeholder="e.g. QUR-12345"
                className="w-full rounded-xl border-2 border-pink-200 px-4 py-3 text-sm font-bold uppercase focus:border-pink-500 focus:outline-none"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-400">
                Yeh User ID customer ko WhatsApp pe bhejega. Customer isi se login karega.
              </p>
            </div>

            {approveError && (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
                ❌ {approveError}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => { setApproveModal(null); setApproveUserId(""); setApproveError(""); }} className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleApprove} className="flex-1 rounded-full bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700">
                APPROVE & SEND ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS — WhatsApp message template ── */}
      {approveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">✓</div>
              <h2 className="mt-4 text-xl font-black text-gray-900">Customer Approved!</h2>
              <p className="mt-2 text-sm text-gray-500">{approveSuccess.customer.fullName}</p>
            </div>

            <div className="mt-5 rounded-2xl bg-green-50 p-4">
              <p className="text-xs font-bold text-green-700">USER ID ASSIGNED</p>
              <p className="mt-1 text-2xl font-black text-green-700">{approveSuccess.userId}</p>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-600">📱 WHATSAPP MESSAGE (Copy & Send)</p>
              <div className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-gray-700 border border-gray-200" id="wa-message">
{`🎋 QURUX Makeover & Academy

Namaste ${approveSuccess.customer.fullName}!

Aapka account approved ho gaya hai.

🔐 Login Details:
User ID: ${approveSuccess.userId}
Password: [Wahi password jo signup me dala tha]

👉 Login karein: http://localhost:3000/account

Koi sawaal ho toh humein message karein! 🙏`}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("wa-message");
                if (el) navigator.clipboard.writeText(el.innerText);
                setApproveSuccess(null);
              }}
              className="mt-4 w-full rounded-full bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700"
            >
              COPY MESSAGE & CLOSE
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">{selected.fullName}</h2>
              <button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {selected.userId && <div className="rounded-2xl bg-pink-50 p-4"><p className="text-xs font-bold text-pink-600">USER ID</p><p className="mt-1 font-mono font-bold text-pink-600">{selected.userId}</p></div>}
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">PHONE</p><p className="mt-1 font-bold text-gray-900">{selected.phone}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">REGISTERED</p><p className="mt-1 font-bold text-gray-900">{selected.registeredAt}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">BOOKINGS</p><p className="mt-1 font-bold text-gray-900">{selected.bookings}</p></div>
              <div className="rounded-2xl bg-pink-50 p-4"><p className="text-xs font-bold text-pink-600">TOTAL SPENT</p><p className="mt-1 text-xl font-black text-pink-600">₹{selected.totalSpent.toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-400">STATUS</p><p className={`mt-1 font-bold ${selected.status === "APPROVED" ? "text-green-700" : selected.status === "PENDING" ? "text-orange-700" : "text-red-600"}`}>{selected.status}</p></div>
            </div>
            {selected.status === "PENDING" && (
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => { setSelected(null); setApproveModal(selected); setApproveUserId(""); setApproveError(""); setApproveSuccess(null); }} className="flex-1 rounded-full bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">APPROVE</button>
                <button type="button" onClick={() => handleReject(selected.id)} className="flex-1 rounded-full bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600">REJECT</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
