"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type BookingClosure = {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  salon: string;
  bookingDate: string;
  serviceDate: string;
  serviceType: "Home Service" | "Salon";
  amount: number;
  paymentMethod: "Full Payment" | "No Cost EMI" | "Pay from BOB" | "Mixed/Split";
  bobUsed: number;
  emiPending: number;
  cashCollected: number;
  status: "PARTNER_COMPLETED" | "ADMIN_VERIFIED" | "CLOSED";
  partnerRemarks: string;
  adminRemarks: string;
  rating: number;
  customerRemarks: string;
  address: string;
  timeSlot: string;
  verificationChecklist: {
    serviceDelivered: boolean;
    customerPresent: boolean;
    qualityConfirmed: boolean;
    paymentConfirmed: boolean;
  };
};

const defaultClosures: BookingClosure[] = [
  {
    id: "cl1",
    bookingId: "BK-2026-0891",
    customerName: "Priya Sharma",
    customerPhone: "9876543210",
    service: "Classic Bridal Makeup",
    salon: "QURUX Salon — Naraina Vihar",
    bookingDate: "2026-08-20",
    serviceDate: "2026-08-28",
    serviceType: "Salon",
    amount: 15999,
    paymentMethod: "Full Payment",
    bobUsed: 0,
    emiPending: 0,
    cashCollected: 15999,
    status: "PARTNER_COMPLETED",
    partnerRemarks: "Service completed successfully. Customer was happy with the bridal look.",
    adminRemarks: "",
    rating: 0,
    customerRemarks: "",
    address: "",
    timeSlot: "10:00 AM",
    verificationChecklist: {
      serviceDelivered: false,
      customerPresent: false,
      qualityConfirmed: false,
      paymentConfirmed: false,
    },
  },
  {
    id: "cl2",
    bookingId: "BK-2026-0887",
    customerName: "Anjali Mehta",
    customerPhone: "9123456789",
    service: "Korean Glow Facial",
    salon: "Home Service",
    bookingDate: "2026-08-18",
    serviceDate: "2026-08-27",
    serviceType: "Home Service",
    amount: 2499,
    paymentMethod: "Pay from BOB",
    bobUsed: 2499,
    emiPending: 0,
    cashCollected: 0,
    status: "PARTNER_COMPLETED",
    partnerRemarks: "Facial completed at customer's home address. Customer satisfied.",
    adminRemarks: "",
    rating: 0,
    customerRemarks: "",
    address: "45/A, Sector 12, Uttam Nagar, Delhi — 110059",
    timeSlot: "2:00 PM",
    verificationChecklist: {
      serviceDelivered: false,
      customerPresent: false,
      qualityConfirmed: false,
      paymentConfirmed: false,
    },
  },
  {
    id: "cl3",
    bookingId: "BK-2026-0876",
    customerName: "Ritu Kapoor",
    customerPhone: "9001234567",
    service: "Party Makeup + Hair Styling",
    salon: "QURUX Salon — Uttam Nagar",
    bookingDate: "2026-08-15",
    serviceDate: "2026-08-25",
    serviceType: "Salon",
    amount: 8498,
    paymentMethod: "No Cost EMI",
    bobUsed: 0,
    emiPending: 5498,
    cashCollected: 3000,
    status: "ADMIN_VERIFIED",
    partnerRemarks: "Party makeup and hair styling done. Customer approved the final look.",
    adminRemarks: "Verified with customer. All good.",
    rating: 5,
    customerRemarks: "Loved the look! Very professional.",
    address: "",
    timeSlot: "4:00 PM",
    verificationChecklist: {
      serviceDelivered: true,
      customerPresent: true,
      qualityConfirmed: true,
      paymentConfirmed: true,
    },
  },
  {
    id: "cl4",
    bookingId: "BK-2026-0865",
    customerName: "Sunita Devi",
    customerPhone: "9988776655",
    service: "Full Body Wax",
    salon: "QURUX Salon — Naraina Vihar",
    bookingDate: "2026-08-10",
    serviceDate: "2026-08-22",
    serviceType: "Salon",
    amount: 1599,
    paymentMethod: "Mixed/Split",
    bobUsed: 800,
    emiPending: 0,
    cashCollected: 799,
    status: "CLOSED",
    partnerRemarks: "Full body wax completed.",
    adminRemarks: "Closed. Payment reconciled — BOB ₹800 + Cash ₹799.",
    rating: 4,
    customerRemarks: "Good service, a bit painful but overall fine.",
    address: "",
    timeSlot: "11:00 AM",
    verificationChecklist: {
      serviceDelivered: true,
      customerPresent: true,
      qualityConfirmed: true,
      paymentConfirmed: true,
    },
  },
];

export default function AdminClosuresPage() {
  const [closures, setClosures] = useState<BookingClosure[]>([]);
  const [selected, setSelected] = useState<BookingClosure | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadClosures() {
      try {
        const res = await apiGet<any[]>("/bookings");
        if (!res.ok) {
          setClosures([]);
          return;
        }
        const items: BookingClosure[] = res.data
          .filter((b: any) => b.status !== "CANCELLED")
          .map((b: any) => ({
            id: b._id,
            bookingId: b.bookingId || b._id,
            customerName: b.customerName || "",
            customerPhone: b.customerPhone || "",
            service: b.serviceName || "",
            salon: b.salonName || (b.serviceLocation === "HOME" ? "Home Service" : "QURUX Salon"),
            bookingDate: b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : "",
            serviceDate: b.date || "",
            serviceType: b.serviceLocation === "HOME" ? "Home Service" : "Salon",
            amount: Number(b.amount || 0),
            paymentMethod: b.paymentMethod === "BOB" ? "Pay from BOB" : b.paymentMethod === "EMI" ? "No Cost EMI" : b.paymentMethod === "MIXED" ? "Mixed/Split" : "Full Payment",
            bobUsed: Number(b.bobPaidAmount || 0),
            emiPending: Number(b.emiAmount || 0),
            cashCollected: Number(b.cashAmount || 0),
            status: b.status === "COMPLETED" ? "CLOSED" : "PARTNER_COMPLETED",
            partnerRemarks: "",
            adminRemarks: b.adminRemarks || "",
            rating: Number(b.rating || 0),
            customerRemarks: b.customerRemarks || "",
            address: b.address || "",
            timeSlot: b.timeSlot || "",
            verificationChecklist: {
              serviceDelivered: false,
              customerPresent: false,
              qualityConfirmed: false,
              paymentConfirmed: false,
            },
          }));
        setClosures(items);
      } catch {
        setClosures([]);
      }
    }
    loadClosures();
  }, []);

  const filtered = closures.filter((c) =>
    filterStatus === "All" || c.status === filterStatus
  );

  function updateChecklist(
    id: string,
    key: keyof BookingClosure["verificationChecklist"]
  ) {
    setClosures((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              verificationChecklist: {
                ...c.verificationChecklist,
                [key]: !c.verificationChecklist[key],
              },
            }
          : c
      )
    );
    if (selected && selected.id === id) {
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              verificationChecklist: {
                ...prev.verificationChecklist,
                [key]: !prev.verificationChecklist[key],
              },
            }
          : null
      );
    }
  }

  function verifyClosure(id: string) {
    const closure = closures.find((c) => c.id === id);
    if (!closure) return;

    const cl = closure.verificationChecklist;
    if (!cl.serviceDelivered || !cl.customerPresent || !cl.qualityConfirmed || !cl.paymentConfirmed) {
      alert("Please complete all verification checklist items before verifying.");
      return;
    }

    setBusy(true);
    setTimeout(() => {
      setClosures((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "ADMIN_VERIFIED" as const } : c
        )
      );
      setSelected((prev) =>
        prev ? { ...prev, status: "ADMIN_VERIFIED" } : null
      );
      setBusy(false);
    }, 500);
  }

  async function closeClosure(id: string, adminRemarks: string, customerRemarks: string, rating: number) {
    if (!adminRemarks.trim()) {
      alert("Admin remarks are required to close the service.");
      return;
    }
    if (rating === 0) {
      alert("Please capture a star rating before closing.");
      return;
    }

    setBusy(true);
    const res = await apiPatch(`/bookings/${id}/close`, {
      adminRemarks,
      customerRemarks,
      rating,
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.message || "Failed to close booking. Please try again.");
      return;
    }
    setClosures((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "CLOSED" as const,
              adminRemarks,
              customerRemarks,
              rating,
            }
          : c
      )
    );
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            status: "CLOSED",
            adminRemarks,
            customerRemarks,
            rating,
          }
        : null
    );
  }

  const pendingCount = closures.filter((c) => c.status === "PARTNER_COMPLETED").length;
  const verifiedCount = closures.filter((c) => c.status === "ADMIN_VERIFIED").length;
  const closedCount = closures.filter((c) => c.status === "CLOSED").length;

  return (
    <AdminLayout
      title="Service Closure"
      subtitle="Verify service completion, reconcile payments, capture remarks and ratings, then close bookings."
    >

      {/* Workflow Steps */}
      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-300">
          CLOSURE WORKFLOW
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {[
            { step: "Partner Completes Service", icon: "✅" },
            { step: "Admin Verification", icon: "🔍" },
            { step: "Payment Reconciliation", icon: "💳" },
            { step: "Customer Remarks + Rating", icon: "⭐" },
            { step: "Booking Closed", icon: "🔒" },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold">
                <span className="mr-2">{item.icon}</span>
                {item.step}
              </div>
              {i < 4 && <span className="text-slate-500">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">AWAITING VERIFICATION</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">VERIFIED — PENDING CLOSURE</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{verifiedCount}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">CLOSED</p>
          <p className="mt-2 text-3xl font-black text-green-700">{closedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex gap-3">
        {["All", "PARTNER_COMPLETED", "ADMIN_VERIFIED", "CLOSED"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filterStatus === status
                ? "bg-pink-600 text-white"
                : "bg-white text-gray-700 shadow-sm hover:bg-pink-50"
            }`}
          >
            {status === "All"
              ? "All"
              : status === "PARTNER_COMPLETED"
                ? "Pending Verification"
                : status === "ADMIN_VERIFIED"
                  ? "Verified"
                  : "Closed"}
          </button>
        ))}
      </div>

      {/* Booking List */}
      <div className="mt-5 space-y-4">
        {filtered.map((closure) => (
          <button
            key={closure.id}
            type="button"
            onClick={() => setSelected(closure)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-pink-300 hover:bg-pink-50"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-gray-900">
                    {closure.customerName}
                  </p>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {closure.bookingId}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {closure.service} • {closure.serviceType} • ₹{closure.amount.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Service Date: {closure.serviceDate} • {closure.timeSlot} • {closure.salon}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                  {closure.paymentMethod}
                </span>
                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    closure.status === "PARTNER_COMPLETED"
                      ? "bg-orange-100 text-orange-700"
                      : closure.status === "ADMIN_VERIFIED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {closure.status === "PARTNER_COMPLETED"
                    ? "AWAITING VERIFICATION"
                    : closure.status === "ADMIN_VERIFIED"
                      ? "VERIFIED"
                      : "CLOSED"}
                </span>
                {closure.rating > 0 && (
                  <span className="text-lg">{"⭐".repeat(closure.rating)}</span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No bookings found for this filter.
          </div>
        )}
      </div>

      {/* Closure Detail Modal */}
      {selected && (
        <ClosureModal
          closure={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onChecklist={(key) => updateChecklist(selected.id, key)}
          onVerify={() => verifyClosure(selected.id)}
          onClosures={(adminRemarks, customerRemarks, rating) =>
            closeClosure(selected.id, adminRemarks, customerRemarks, rating)
          }
        />
      )}
    </AdminLayout>
  );
}

/* =============================================
   CLOSURE MODAL
============================================= */

type ClosureModalProps = {
  closure: BookingClosure;
  busy: boolean;
  onClose: () => void;
  onChecklist: (key: keyof BookingClosure["verificationChecklist"]) => void;
  onVerify: () => void;
  onClosures: (adminRemarks: string, customerRemarks: string, rating: number) => void;
};

function ClosureModal({
  closure,
  busy,
  onClose,
  onChecklist,
  onVerify,
  onClosures,
}: ClosureModalProps) {
  const [adminRemarks, setAdminRemarks] = useState(closure.adminRemarks);
  const [customerRemarks, setCustomerRemarks] = useState(closure.customerRemarks);
  const [rating, setRating] = useState(closure.rating);
  const [hover, setHover] = useState(0);

  const cl = closure.verificationChecklist;
  const allChecked = cl.serviceDelivered && cl.customerPresent && cl.qualityConfirmed && cl.paymentConfirmed;
  const totalPaid = closure.bobUsed + closure.emiPending + closure.cashCollected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
              SERVICE CLOSURE — {closure.bookingId}
            </p>
            <h3 className="mt-2 text-2xl font-black text-gray-900">
              {closure.customerName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
          >
            ×
          </button>
        </div>

        {/* Service Info */}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-400">SERVICE</p>
            <p className="mt-1 font-bold text-gray-900">{closure.service}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-400">TYPE</p>
            <p className="mt-1 font-bold text-gray-900">{closure.serviceType}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-400">SERVICE DATE</p>
            <p className="mt-1 font-bold text-gray-900">{closure.serviceDate} at {closure.timeSlot}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-400">SALON / LOCATION</p>
            <p className="mt-1 font-bold text-gray-900">{closure.salon}</p>
          </div>
        </div>

        {closure.serviceType === "Home Service" && closure.address && (
          <div className="mt-3 rounded-2xl bg-pink-50 p-4">
            <p className="text-xs font-bold text-pink-600">HOME SERVICE ADDRESS</p>
            <p className="mt-1 text-sm text-gray-800">{closure.address}</p>
          </div>
        )}

        {/* Partner Remarks */}
        {closure.partnerRemarks && (
          <div className="mt-4 rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-700">PARTNER REMARKS</p>
            <p className="mt-1 text-sm leading-6 text-gray-800">{closure.partnerRemarks}</p>
          </div>
        )}

        {/* Payment Reconciliation */}
        <div className="mt-5 rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
            PAYMENT RECONCILIATION
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-400">TOTAL AMOUNT</p>
              <p className="mt-1 text-2xl font-black text-gray-900">
                ₹{closure.amount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-400">PAYMENT METHOD</p>
              <p className="mt-1 font-bold text-gray-900">{closure.paymentMethod}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-xs font-bold text-green-700">BOB WALLET USED</p>
              <p className="mt-1 font-bold text-green-700">₹{closure.bobUsed.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-700">CASH COLLECTED</p>
              <p className="mt-1 font-bold text-amber-700">₹{closure.cashCollected.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-xs font-bold text-blue-700">EMI PENDING</p>
              <p className="mt-1 font-bold text-blue-700">₹{closure.emiPending.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Total Paid/Collected</span>
              <span className="text-lg font-black text-gray-900">₹{totalPaid.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Step 1: Verification Checklist */}
        {closure.status === "PARTNER_COMPLETED" && (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-700">
              STEP 1: SERVICE VERIFICATION
            </p>

            <div className="mt-4 space-y-3">
              {[
                { key: "serviceDelivered" as const, label: "Service was delivered to the customer" },
                { key: "customerPresent" as const, label: "Customer was present during service" },
                { key: "qualityConfirmed" as const, label: "Service quality confirmed with customer" },
                { key: "paymentConfirmed" as const, label: "Payment status confirmed" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 transition hover:bg-pink-50"
                >
                  <input
                    type="checkbox"
                    checked={cl[item.key]}
                    onChange={() => onChecklist(item.key)}
                    className="h-5 w-5 accent-pink-600"
                  />
                  <span className={`text-sm font-semibold ${cl[item.key] ? "text-green-700" : "text-gray-700"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={onVerify}
              disabled={busy || !allChecked}
              className={`mt-5 w-full rounded-full px-6 py-3.5 font-bold text-white transition ${
                allChecked
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {busy ? "PROCESSING..." : "✓ VERIFY SERVICE COMPLETION"}
            </button>
          </div>
        )}

        {/* Step 2: Admin Remarks + Rating (shown after verification) */}
        {closure.status === "ADMIN_VERIFIED" && (
          <div className="mt-5 space-y-5">
            {/* Rating */}
            <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                STEP 2: CUSTOMER RATING
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Capture the customer&apos;s star rating for this service.
              </p>

              <div className="mt-4 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className={`text-4xl transition ${
                      star <= (hover || rating) ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm font-bold text-gray-700">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Below Average"}
                  {rating === 3 && "Average"}
                  {rating === 4 && "Good"}
                  {rating === 5 && "Excellent"} — {rating}/5 stars
                </p>
              )}
            </div>

            {/* Admin Remarks */}
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                ADMIN REMARKS *
              </p>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter admin verification notes, payment reconciliation details, any observations..."
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Customer Remarks */}
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                CUSTOMER REMARKS
              </p>
              <textarea
                rows={3}
                value={customerRemarks}
                onChange={(e) => setCustomerRemarks(e.target.value)}
                placeholder="Customer feedback / remarks (captured from customer)"
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => onClosures(adminRemarks, customerRemarks, rating)}
              disabled={busy || !adminRemarks.trim() || rating === 0}
              className={`w-full rounded-full px-6 py-3.5 font-bold text-white transition ${
                adminRemarks.trim() && rating > 0
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {busy ? "PROCESSING..." : "🔒 CLOSE SERVICE & SUBMIT RATING"}
            </button>
          </div>
        )}

        {/* Closed Status */}
        {closure.status === "CLOSED" && (
          <div className="mt-5 rounded-2xl bg-green-50 p-6 text-center">
            <div className="text-4xl">🔒</div>
            <p className="mt-3 text-xl font-black text-green-700">SERVICE CLOSED</p>
            {closure.rating > 0 && (
              <p className="mt-2 text-2xl">{"⭐".repeat(closure.rating)}</p>
            )}
            {closure.adminRemarks && (
              <p className="mt-3 text-sm text-gray-600">{closure.adminRemarks}</p>
            )}
            {closure.customerRemarks && (
              <p className="mt-2 text-sm italic text-gray-500">
                &quot;{closure.customerRemarks}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
