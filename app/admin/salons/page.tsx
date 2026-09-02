"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type Salon = {
  id: string;
  salonName: string;
  ownerName: string;
  email: string;
  phone: string;
  altPhone: string;
  address: string;
  city: string;
  pincode: string;
  salonType: string;
  servicesOffered: string;
  experience: string;
  teamSize: string;
  gstNumber: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

const defaultSalons: Salon[] = [
  {
    id: "sal1",
    salonName: "Glow Beauty Studio",
    ownerName: "Neha Sharma",
    email: "neha@glowbeauty.in",
    phone: "9876543210",
    altPhone: "",
    address: "45, Main Market, Naraina Vihar",
    city: "Delhi",
    pincode: "110028",
    salonType: "Unisex Salon",
    servicesOffered: "Bridal Makeup, Hair Styling, Facial, Waxing",
    experience: "5–10 years",
    teamSize: "6–10 staff",
    gstNumber: "07AABCU9603R1ZM",
    description: "Premium unisex salon in Naraina Vihar with 8 years of experience in bridal and party makeup.",
    status: "PENDING",
    submittedAt: "2026-08-28T10:30:00Z",
  },
  {
    id: "sal2",
    salonName: "Royal Touch Salon",
    ownerName: "Vikram Singh",
    email: "vikram@royaltouch.in",
    phone: "9123456789",
    altPhone: "9988776655",
    address: "12, GTB Nagar, Uttam Nagar",
    city: "Delhi",
    pincode: "110059",
    salonType: "Women's Salon",
    servicesOffered: "Makeup, Hair Styling, Manicure, Pedicure",
    experience: "3–5 years",
    teamSize: "3–5 staff",
    gstNumber: "",
    description: "Women-only salon specialising in bridal packages and skincare treatments.",
    status: "APPROVED",
    submittedAt: "2026-08-20T09:00:00Z",
  },
  {
    id: "sal3",
    salonName: "Style Hub Studio",
    ownerName: "Ritu Verma",
    email: "ritu@stylehub.in",
    phone: "9001234567",
    altPhone: "",
    address: "78, Vikas Puri",
    city: "Delhi",
    pincode: "110018",
    salonType: "Makeup Studio",
    servicesOffered: "Bridal Makeup, HD Makeup, Party Makeup",
    experience: "1–3 years",
    teamSize: "1–2 staff",
    gstNumber: "",
    description: "Home-based makeup studio focused on bridal and HD makeup.",
    status: "REJECTED",
    submittedAt: "2026-08-15T14:00:00Z",
  },
];

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState(defaultSalons);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSalons() {
      setLoading(true);
      try {
        const res = await apiGet<any[]>("/salons/all");
        if (res.ok && res.data.length > 0) {
          setSalons(res.data.map((s: any) => ({
            id: s._id, salonName: s.name, ownerName: s.ownerName, email: s.ownerEmail,
            phone: s.ownerMobile, altPhone: s.alternatePhone || "", address: s.address,
            city: s.city, pincode: s.pincode, salonType: s.type || "Unisex",
            servicesOffered: (s.servicesOffered || []).join(", "), experience: `${s.yearsOfExperience || 0} years`,
            teamSize: `${s.teamSize || 1} staff`, gstNumber: s.gstNumber || "",
            description: s.about || "", status: s.status || "PENDING",
            submittedAt: s.createdAt?.split("T")[0] || "",
          })));
        }
      } catch {}
      setLoading(false);
    }
    fetchSalons();
  }, []);
  const [selected, setSelected] = useState<Salon | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = salons.filter((s) => {
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    const matchSearch =
      s.salonName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const [approvedSalon, setApprovedSalon] = useState<Salon | null>(null);

  async function approveSalon(id: string) {
    setBusy(true);
    await apiPatch(`/salons/${id}/approve`, {});
    const salon = salons.find(s => s.id === id);
    setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "APPROVED" as const } : s)));
    if (salon) setApprovedSalon({ ...salon, status: "APPROVED" });
    setSelected(null);
    setBusy(false);
  }

  async function rejectSalon(id: string) {
    if (!confirm("Reject this salon?")) return;
    setBusy(true);
    await apiPatch(`/salons/${id}/reject`, { reason: "Not approved" });
    setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "REJECTED" as const } : s)));
    setSelected(null);
    setBusy(false);
  }

  const pendingCount = salons.filter((s) => s.status === "PENDING").length;
  const approvedCount = salons.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = salons.filter((s) => s.status === "REJECTED").length;

  const approvedMsg = approvedSalon
    ? `🎋 QURUX Makeover & Academy\n\nNamaste ${approvedSalon.ownerName}!\n\nCongratulations! Your salon \"${approvedSalon.salonName}\" has been approved as a QURUX Partner Salon.\n\n✅ Your salon is now live in the QURUX booking system.\n\n📍 Location: ${approvedSalon.address}, ${approvedSalon.city}\n📞 Contact: ${approvedSalon.phone}\n\nYou will start receiving bookings from customers through the QURUX platform.\n\nFor any queries, contact the QURUX admin team.\n\nBest Regards,\nQURUX Makeover & Academy`
    : "";

  return (
    <AdminLayout
      title="Salons / Vendors"
      subtitle="Manage salon registrations — review, approve, or reject partner applications."
    >

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">APPROVED</p>
          <p className="mt-2 text-3xl font-black text-green-700">{approvedCount}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">REJECTED</p>
          <p className="mt-2 text-3xl font-black text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by salon name, owner, or city..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500"
        >
          <option value="All">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Salon List */}
      <div className="mt-5 space-y-4">
        {filtered.map((salon) => (
          <button
            key={salon.id}
            type="button"
            onClick={() => setSelected(salon)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-pink-300 hover:bg-pink-50"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-gray-900">{salon.salonName}</p>
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                    {salon.salonType || "Salon"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {salon.ownerName} • {salon.phone} • {salon.city}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Registered: {new Date(salon.submittedAt).toLocaleDateString("en-IN")}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${
                  salon.status === "PENDING"
                    ? "bg-orange-100 text-orange-700"
                    : salon.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {salon.status}
              </span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No salon registrations found.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                  SALON REGISTRATION
                </p>
                <h3 className="mt-2 text-3xl font-black text-gray-900">
                  {selected.salonName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* Info Grid */}
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                { label: "OWNER", value: selected.ownerName },
                { label: "EMAIL", value: selected.email },
                { label: "PHONE", value: selected.phone },
                { label: "ALT PHONE", value: selected.altPhone || "—" },
                { label: "SALON TYPE", value: selected.salonType || "—" },
                { label: "EXPERIENCE", value: selected.experience || "—" },
                { label: "TEAM SIZE", value: selected.teamSize || "—" },
                { label: "GST", value: selected.gstNumber || "Not provided" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold text-gray-400">{item.label}</p>
                  <p className="mt-1 font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-400">ADDRESS</p>
              <p className="mt-1 leading-6 text-gray-800">
                {selected.address}, {selected.city} — {selected.pincode}
              </p>
            </div>

            {/* Services */}
            {selected.servicesOffered && (
              <div className="mt-4 rounded-2xl bg-pink-50 p-4">
                <p className="text-xs font-bold text-pink-600">SERVICES OFFERED</p>
                <p className="mt-1 text-sm leading-6 text-gray-800">
                  {selected.servicesOffered}
                </p>
              </div>
            )}

            {/* Description */}
            {selected.description && (
              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">ABOUT</p>
                <p className="mt-1 leading-6 text-gray-800">
                  {selected.description}
                </p>
              </div>
            )}

            {/* Status + Actions */}
            <div className="mt-6">
              {selected.status === "PENDING" ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => approveSalon(selected.id)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-green-600 px-6 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                  >
                    {busy ? "PROCESSING..." : "✓ APPROVE SALON"}
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectSalon(selected.id)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-red-500 px-6 py-3.5 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                  >
                    ✗ REJECT REGISTRATION
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-2xl p-5 text-center font-bold ${
                    selected.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  Status: {selected.status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approved Salon WhatsApp Message */}
      {approvedSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-green-700">✅ Salon Approved</h3>
              <button type="button" onClick={() => setApprovedSalon(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>
            <p className="mt-3 text-sm text-gray-600">Copy this message and send to the salon owner via WhatsApp:</p>
            <div className="mt-3 rounded-2xl bg-green-50 p-4">
              <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{`🎋 QURUX Makeover & Academy\n\nNamaste ${approvedSalon.ownerName}!\n\nCongratulations! Your salon "${approvedSalon.salonName}" has been approved as a QURUX Partner Salon.\n\n✅ Your salon is now live in the QURUX booking system.\n\n📍 Location: ${approvedSalon.address}, ${approvedSalon.city}\n📞 Contact: ${approvedSalon.phone}\n\nYou will start receiving bookings from customers through the QURUX platform.\n\nFor any queries, contact the QURUX admin team.\n\nBest Regards,\nQURUX Makeover & Academy`}</pre>
            </div>
            <button
              type="button"
              onClick={() => {
                const msg = `🎋 QURUX Makeover & Academy\n\nNamaste ${approvedSalon.ownerName}!\n\nCongratulations! Your salon "${approvedSalon.salonName}" has been approved as a QURUX Partner Salon.\n\n✅ Your salon is now live in the QURUX booking system.\n\n📍 Location: ${approvedSalon.address}, ${approvedSalon.city}\n📞 Contact: ${approvedSalon.phone}\n\nYou will start receiving bookings from customers through the QURUX platform.\n\nFor any queries, contact the QURUX admin team.\n\nBest Regards,\nQURUX Makeover & Academy`;
                navigator.clipboard.writeText(msg);
                setApprovedSalon(null);
              }}
              className="mt-4 w-full rounded-full bg-green-600 py-3 font-bold text-white hover:bg-green-700"
            >
              📋 COPY MESSAGE & CLOSE
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
