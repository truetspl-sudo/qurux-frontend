"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

type Dispatch = {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  service: string;
  date: string;
  timeSlot: string;
  paymentMode: string;
  amount: number;
  salonName: string;
  salonPhone: string;
  status: "PENDING" | "SENT" | "COMPLETED";
  sentAt: string;
  completedAt?: string;
};

const DEMO_DISPATCHES: Dispatch[] = [
  { id: "WD-001", bookingId: "BK-2026-0892", customerName: "Neha Gupta", customerPhone: "9871112233", address: "QURUX Salon — Naraina Vihar", service: "Airbrush Bridal Makeup", date: "2026-09-05", timeSlot: "10:00 AM", paymentMode: "No Cost EMI", amount: 21999, salonName: "QURUX Salon — Naraina Vihar", salonPhone: "9911227916", status: "SENT", sentAt: "2026-08-30T14:00:00Z" },
  { id: "WD-002", bookingId: "BK-2026-0890", customerName: "Deepa Nair", customerPhone: "9112233445", address: "12/B, Janakpuri, Delhi — 110058", service: "Korean Glow Facial", date: "2026-09-01", timeSlot: "2:00 PM", paymentMode: "Full Payment", amount: 2499, salonName: "Home Service Partner", salonPhone: "9911227916", status: "PENDING", sentAt: "" },
  { id: "WD-003", bookingId: "BK-2026-0888", customerName: "Suman Patel", customerPhone: "9001122334", address: "QURUX Salon — Naraina Vihar", service: "Party Makeup", date: "2026-08-30", timeSlot: "4:00 PM", paymentMode: "Full Payment", amount: 4999, salonName: "QURUX Salon — Naraina Vihar", salonPhone: "9911227916", status: "COMPLETED", sentAt: "2026-08-29T10:00:00Z", completedAt: "2026-08-30T16:30:00Z" },
  { id: "WD-004", bookingId: "BK-2026-0889", customerName: "Rina Joshi", customerPhone: "9998887770", address: "QURUX Salon — Uttam Nagar", service: "HD Bridal Makeup + Hair Styling", date: "2026-08-27", timeSlot: "9:00 AM", paymentMode: "Pay from BOB", amount: 24498, salonName: "QURUX Salon — Uttam Nagar", salonPhone: "9911227916", status: "COMPLETED", sentAt: "2026-08-26T08:00:00Z", completedAt: "2026-08-27T18:00:00Z" },
];

function readLocalArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

import { apiGet, apiPatch } from "@/lib/api";

function buildPartnerMessage(d: Dispatch): string {
  return [
    "🎋 QURUX Makeover & Academy",
    "",
    `📋 Booking: ${d.bookingId}`,
    "",
    `👤 Customer: ${d.customerName}`,
    `📱 Phone: ${d.customerPhone}`,
    `💄 Service: ${d.service}`,
    `📅 Date: ${d.date} at ${d.timeSlot}`,
    `📍 Address: ${d.address}`,
    `💳 Payment: ${d.paymentMode} — ₹${d.amount.toLocaleString("en-IN")}`,
    `🏢 Salon: ${d.salonName}`,
    "",
    "Please coordinate with the customer and confirm.",
  ].join("\n");
}

export default function AdminWhatsAppPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [selected, setSelected] = useState<Dispatch | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDispatches();
  }, []);

  async function loadDispatches() {
    try {
      const res = await apiGet<any[]>("/bookings");
      if (res.ok && res.data.length > 0) {
        const mapped: Dispatch[] = res.data
          .filter((b: any) => b.status !== "CANCELLED")
          .map((b: any) => ({
            id: `WD-${b.bookingId || b._id}`,
            bookingId: b.bookingId || b._id,
            customerName: b.customerName || "Customer",
            customerPhone: b.customerPhone || "",
            address: b.address || b.salonName || "",
            service: b.serviceName || "Service",
            date: b.date || "",
            timeSlot: b.timeSlot || "",
            paymentMode: b.paymentMethod === "BOB" ? "Pay from BOB" : b.paymentMethod === "EMI" ? "No Cost EMI" : "Full Payment",
            amount: Number(b.amount || 0),
            salonName: b.salonName || "QURUX Salon",
            salonPhone: "9911227916",
            status: b.whatsappDispatched ? "SENT" : "PENDING",
            sentAt: b.whatsappSentAt || "",
          }));
        setDispatches(mapped.length > 0 ? mapped : DEMO_DISPATCHES);
      } else {
        setDispatches(DEMO_DISPATCHES);
      }
    } catch {
      setDispatches(DEMO_DISPATCHES);
    }
  }

  function saveDispatches(list: Dispatch[]) {
    localStorage.setItem("whatsappDispatches", JSON.stringify(list));
  }

  const filtered = dispatches.filter((d) => filterStatus === "All" || d.status === filterStatus);

  const stats = {
    total: dispatches.length,
    pending: dispatches.filter((d) => d.status === "PENDING").length,
    sent: dispatches.filter((d) => d.status === "SENT").length,
    completed: dispatches.filter((d) => d.status === "COMPLETED").length,
  };

  function markSent(id: string) {
    const updated = dispatches.map((d) =>
      d.id === id ? { ...d, status: "SENT" as const, sentAt: new Date().toISOString() } : d
    );
    setDispatches(updated);
    saveDispatches(updated);
    setSelected(null);
  }

  function markCompleted(id: string) {
    const updated = dispatches.map((d) =>
      d.id === id ? { ...d, status: "COMPLETED" as const, completedAt: new Date().toISOString() } : d
    );
    setDispatches(updated);
    saveDispatches(updated);
    setSelected(null);
  }

  async function copyMessage(d: Dispatch) {
    const msg = buildPartnerMessage(d);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = msg;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function openWhatsApp(d: Dispatch) {
    const phone = d.salonPhone.replace(/[^0-9]/g, "");
    const msg = buildPartnerMessage(d);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  return (
    <AdminLayout title="WhatsApp Dispatch" subtitle="Booking details padhein, message copy karein, partner ko manually WhatsApp karein.">

      {/* How It Works */}
      <div className="rounded-2xl bg-gradient-to-r from-green-50 to-green-100 p-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-700">
          📱 Manual WhatsApp Dispatch
        </p>
        <p className="mt-2 text-sm text-green-800">
          Jab customer ki booking aaye, admin booking details padhe, message copy kare aur partner ko manually WhatsApp pe bheje.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-green-700">
          <span>① Booking dekhein</span>
          <span>→</span>
          <span>② Message copy karein</span>
          <span>→</span>
          <span>③ WhatsApp pe bhejein</span>
          <span>→</span>
          <span>④ Mark Sent</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500">TOTAL BOOKINGS</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-orange-700">⏳ PENDING DISPATCH</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{stats.pending}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-blue-700">📤 SENT TO PARTNER</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{stats.sent}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-xs font-bold text-green-700">✅ COMPLETED</p>
          <p className="mt-2 text-3xl font-black text-green-700">{stats.completed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["All", "PENDING", "SENT", "COMPLETED"].map((s) => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filterStatus === s ? "bg-pink-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-pink-50"}`}>
            {s === "All" ? "All" : s === "PENDING" ? "⏳ Pending" : s === "SENT" ? "📤 Sent" : "✅ Completed"}
          </button>
        ))}
      </div>

      {/* Dispatch List */}
      <div className="mt-5 space-y-4">
        {filtered.map((d) => (
          <button key={d.id} type="button" onClick={() => setSelected(d)} className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-pink-300 hover:bg-pink-50">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-900">{d.customerName}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{d.bookingId}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{d.service} • {d.date} • {d.timeSlot}</p>
                <p className="mt-1 text-xs text-gray-400">{d.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">₹{d.amount.toLocaleString("en-IN")}</span>
                <span className={`rounded-full px-4 py-2 text-xs font-bold ${d.status === "PENDING" ? "bg-orange-100 text-orange-700" : d.status === "SENT" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{d.status === "PENDING" ? "⏳ Pending" : d.status === "SENT" ? "📤 Sent" : "✅ Completed"}</span>
                {d.status === "PENDING" && (
                  <span className="rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white">📱 WhatsApp</span>
                )}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">No dispatches found.</div>}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600">MANUAL WHATSAPP DISPATCH</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{selected.customerName}</h2>
                <p className="text-sm text-gray-500">{selected.bookingId}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>

            {/* Status */}
            <div className="mt-4">
              <span className={`rounded-full px-4 py-2 text-sm font-bold ${selected.status === "PENDING" ? "bg-orange-100 text-orange-700" : selected.status === "SENT" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{selected.status === "PENDING" ? "⏳ Pending" : selected.status === "SENT" ? "📤 Sent" : "✅ Completed"}</span>
              {selected.sentAt && <span className="ml-3 text-xs text-gray-500">Sent: {new Date(selected.sentAt).toLocaleString("en-IN")}</span>}
              {selected.completedAt && <span className="ml-3 text-xs text-green-600">Completed: {new Date(selected.completedAt).toLocaleString("en-IN")}</span>}
            </div>

            {/* Booking Details */}
            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-3">📋 Booking Details (Read carefully)</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-bold text-gray-900">{selected.customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-bold text-gray-900">{selected.customerPhone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-bold text-pink-600">{selected.service}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date & Time</span><span className="font-bold text-gray-900">{selected.date} at {selected.timeSlot}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-bold text-gray-900 text-right max-w-[250px]">{selected.address}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-bold text-gray-900">{selected.paymentMode} — ₹{selected.amount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Salon/Partner</span><span className="font-bold text-gray-900">{selected.salonName}</span></div>
              </div>
            </div>

            {/* Message to Copy */}
            <div className="mt-4 rounded-2xl bg-green-50 p-5 border border-green-200">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700 mb-3">📱 WhatsApp Message (Copy & Send)</p>
              <div className="rounded-xl bg-white p-4 text-sm text-gray-800 shadow-sm whitespace-pre-line">
                {buildPartnerMessage(selected)}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => copyMessage(selected)}
                  className="flex-1 rounded-full bg-white border-2 border-green-600 px-5 py-3 text-sm font-bold text-green-700 hover:bg-green-50"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Message"}
                </button>
                <button
                  type="button"
                  onClick={() => openWhatsApp(selected)}
                  className="flex-1 rounded-full bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
                >
                  💬 Open WhatsApp
                </button>
              </div>
            </div>

            {/* Partner Contact */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">SALON / PARTNER</p>
                <p className="mt-1 font-bold text-gray-900">{selected.salonName}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">PARTNER PHONE</p>
                <a href={`tel:${selected.salonPhone}`} className="mt-1 block font-bold text-pink-600 hover:underline">{selected.salonPhone}</a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-3">
              {selected.status === "PENDING" && (
                <div className="space-y-2">
                  <p className="text-xs text-center text-gray-500">
                    Message copy karke WhatsApp pe bhejein, phir niche "Mark Sent" dabayein.
                  </p>
                  <button
                    type="button"
                    onClick={() => markSent(selected.id)}
                    className="w-full rounded-full bg-blue-600 px-6 py-3.5 font-bold text-white hover:bg-blue-700"
                  >
                    ✅ Mark as Sent (WhatsApp par bhej diya)
                  </button>
                </div>
              )}

              {selected.status === "SENT" && (
                <div className="space-y-2">
                  <p className="text-xs text-center text-gray-500">
                    Service complete hone ke baad "Mark Completed" dabayein.
                  </p>
                  <button
                    type="button"
                    onClick={() => markCompleted(selected.id)}
                    className="w-full rounded-full bg-green-600 px-6 py-3.5 font-bold text-white hover:bg-green-700"
                  >
                    ✅ Service Completed (Partner ne service de di)
                  </button>
                </div>
              )}

              {selected.status === "COMPLETED" && (
                <div className="rounded-2xl bg-green-50 p-5 text-center">
                  <p className="text-lg font-bold text-green-700">✅ Service Completed</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Booking ko Service Closures me bhejein for admin verification aur customer rating.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
