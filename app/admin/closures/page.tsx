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
  customerId?: string;
  finalPrice?: number;
  listedPrice?: number;
  paymentMethod: "Full Payment" | "No Cost EMI" | "Pay from BOB" | "Mixed/Split";
  bobUsed: number;
  emiPending: number;
  cashCollected: number;
  status: "PARTNER_COMPLETED" | "ADMIN_VERIFIED" | "CLOSED";
  partnerMarkedDone?: boolean;
  paymentStatus?: string;
  paidVia?: string;
  paymentCollectionMethod?: string;
  vendorDirectAmount?: number;
  companyCollectedAmount?: number;
  gstSlab?: number;
  gstAmount?: number;
  cgst?: number;
  sgst?: number;
  basePrice?: number;
  platformCommission?: number;
  vendorGrossPayout?: number;
  vendorNetPayout?: number;
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
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [filterSalon, setFilterSalon] = useState("ALL");
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
            customerId:
              b.customerId && typeof b.customerId === "object"
                ? b.customerId._id || ""
                : b.customerId || "",
            finalPrice: Number(b.finalPrice || b.amount || 0),
            listedPrice: Number(b.listedPrice || b.amount || 0),
            paymentMethod: b.paymentMethod === "BOB" ? "Pay from BOB" : b.paymentMethod === "EMI" ? "No Cost EMI" : b.paymentMethod === "MIXED" ? "Mixed/Split" : "Full Payment",
            bobUsed: Number(b.bobPaidAmount || 0),
            emiPending: Number(b.emiAmount || 0),
            cashCollected: Number(b.cashAmount || 0),
            partnerMarkedDone: b.status === "PARTNER_COMPLETED",
            status: b.status === "COMPLETED" ? "CLOSED" : "PARTNER_COMPLETED",
            paymentStatus: b.paymentStatus || (b.status === "COMPLETED" ? "PAID" : "PENDING"),
            paidVia: b.paidVia || "",
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

  const filtered = closures.filter((c) => {
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    if (filterPayment === "FULL" && c.emiPending > 0) return false;
    if (filterPayment === "EMI" && c.emiPending <= 0) return false;
    if (filterPayment === "PARTIAL" && c.paymentStatus !== "PARTIAL") return false;
    if (filterSalon !== "ALL" && c.salon !== filterSalon) return false;
    return true;
  });
  // Unique salons for filter
  const uniqueSalons = [...new Set(closures.map((c) => c.salon).filter(Boolean))];

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

  async function closeClosure(
    id: string,
    adminRemarks: string,
    payStatus: string,
    cashCollectedAmt: number,
    paidVia: string,
    finalPriceAmt: number,
    walletAmt: number,
    collectionMethod: string,
    vendorDirectAmount: number,
    gstSlab: number
  ) {
    const closure = closures.find((c) => c.id === id) || null;

    setBusy(true);
    const res = await apiPatch(`/bookings/${id}/close`, {
      adminRemarks,
      paymentStatus: payStatus,
      cashAmount: cashCollectedAmt,
      paidVia,
      finalPrice: finalPriceAmt || "",
      walletAmount: walletAmt || 0,
      paymentCollectionMethod: collectionMethod,
      vendorDirectAmount: vendorDirectAmount || 0,
      gstSlab,
    });
    setBusy(false);
    if (!res.ok) {
      alert(res.message || "Failed to close booking. Please try again.");
      return;
    }
    // Local mirror = backend settlement
    const bill = Math.max(0, Number(finalPriceAmt) || closure?.amount || 0);
    const walletUsed = Math.min(bill, Math.max(0, Number(walletAmt) || 0));
    const bobTotal = Math.min(bill, walletUsed);
    const balance = Math.max(0, bill - walletUsed - cashCollectedAmt);
    const donePatch = {
      status: "CLOSED" as const,
      finalPrice: bill,
      paymentStatus: payStatus,
      paidVia,
      bobUsed: bobTotal,
      cashCollected: cashCollectedAmt,
      emiPending: balance,
      adminRemarks,
    };
    setClosures((prev) => prev.map((c) => (c.id === id ? { ...c, ...donePatch } : c)));
    setSelected((prev) => (prev ? { ...prev, ...donePatch } : null));
  }

  const pendingCount = closures.filter((c) => c.status === "PARTNER_COMPLETED").length;
  const verifiedCount = closures.filter((c) => c.status === "ADMIN_VERIFIED").length;
  const closedCount = closures.filter((c) => c.status === "CLOSED").length;
  const partnerDoneCount = closures.filter((c) => c.partnerMarkedDone).length;

  return (
    <AdminLayout
      title="Service Closure"
      subtitle="Verify service completion, reconcile payments and close bookings."
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
            { step: "Booking Closed", icon: "🔒" },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold">
                <span className="mr-2">{item.icon}</span>
                {item.step}
              </div>
              {i < 3 && <span className="text-slate-500">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Partner-marked alert — partner ne service done mark ki, admin verification pending */}
      {partnerDoneCount > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-5">
          <span className="text-2xl">📢</span>
          <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-700">
              {partnerDoneCount} SERVICE{partnerDoneCount > 1 ? "S" : ""} DONE — VERIFICATION PENDING
            </p>
            <p className="mt-1 text-sm text-purple-700">
              Partner salon ne service completed mark ki hai. Neeche purple badge wali bookings check karke
              verify + payment update karke close karein.
            </p>
          </div>
        </div>
      )}

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

      {/* Filter — Status */}
      <div className="mt-6 flex flex-wrap gap-2">
        <p className="w-full text-xs font-bold uppercase text-gray-400">STATUS</p>
        {["All", "PARTNER_COMPLETED", "ADMIN_VERIFIED", "CLOSED"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filterStatus === status
                ? "bg-pink-600 text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-pink-50"
            }`}
          >
            {status === "All" ? "All" : status === "PARTNER_COMPLETED" ? "⏳ Pending Verification" : status === "ADMIN_VERIFIED" ? "🔍 Verified" : "🔒 Closed"}
          </button>
        ))}
      </div>

      {/* Filter — Payment */}
      <div className="mt-3 flex flex-wrap gap-2">
        <p className="w-full text-xs font-bold uppercase text-gray-400">PAYMENT</p>
        {["ALL", "FULL", "EMI", "PARTIAL"].map((pay) => (
          <button
            key={pay}
            type="button"
            onClick={() => setFilterPayment(pay)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filterPayment === pay
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-green-50"
            }`}
          >
            {pay === "ALL" ? "All Payments" : pay === "FULL" ? "✅ Full Payment" : pay === "EMI" ? "📊 EMI Balance" : "⏳ Partial"}
          </button>
        ))}
      </div>

      {/* Filter — Salon/Vendor */}
      {uniqueSalons.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <p className="w-full text-xs font-bold uppercase text-gray-400">VENDOR / SALON</p>
          <button
            type="button"
            onClick={() => setFilterSalon("ALL")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filterSalon === "ALL"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-purple-50"
            }`}
          >
            All Salons
          </button>
          {uniqueSalons.map((salon) => (
            <button
              key={salon}
              type="button"
              onClick={() => setFilterSalon(salon)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filterSalon === salon
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-purple-50"
              }`}
            >
              {salon}
            </button>
          ))}
        </div>
      )}

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

              <div className="flex items-center gap-3 flex-wrap justify-end">
                {closure.partnerMarkedDone && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    🛎 Partner: Service Done
                  </span>
                )}
                {/* Dynamic payment badge */}
                {(() => {
                  const fp = closure.finalPrice || closure.amount;
                  const paid = (closure.cashCollected || 0) + (closure.bobUsed || 0);
                  const balance = closure.emiPending || Math.max(0, fp - paid);
                  if (balance <= 0 && paid >= fp) {
                    return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">✅ Full Payment</span>;
                  }
                  if (balance > 0 && paid > 0) {
                    return <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">📊 EMI Balance ₹{balance.toLocaleString("en-IN")}</span>;
                  }
                  return <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">{closure.paymentMethod}</span>;
                })()}
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
          onClosures={(adminRemarks, payStatus, cashCollectedAmt, paidVia, finalPriceAmt, walletAmt, collectionMethod, vendorDirectAmount, gstSlab) =>
            closeClosure(
              selected.id,
              adminRemarks,
              payStatus,
              cashCollectedAmt,
              paidVia,
              finalPriceAmt,
              walletAmt,
              collectionMethod,
              vendorDirectAmount,
              gstSlab
            )
          }
          onReopen={async () => {
            setBusy(true);
            const res = await apiPatch(`/bookings/${selected.id}/reopen`, {});
            setBusy(false);
            if (res.ok) {
              setClosures((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: "ADMIN_VERIFIED" as const } : c));
              setSelected((prev) => prev ? { ...prev, status: "ADMIN_VERIFIED" } : null);
            } else {
              alert(res.message || "Reopen failed.");
            }
          }}
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
  onClosures: (
    adminRemarks: string,
    payStatus: string,
    cashCollectedAmt: number,
    paidVia: string,
    finalPriceAmt: number,
    walletAmt: number,
    collectionMethod: string,
    vendorDirectAmount: number,
    gstSlab: number
  ) => void;
  onReopen: () => void;
};

function ClosureModal({
  closure,
  busy,
  onClose,
  onChecklist,
  onVerify,
  onClosures,
  onReopen,
}: ClosureModalProps) {
  const [adminRemarks, setAdminRemarks] = useState(closure.adminRemarks);
  // Final price — listed price default; admin service ke baad final price badal sakta hai
  const initFinal = Math.max(0, Number(closure.finalPrice || closure.amount || 0));

  const [finalPriceAmt, setFinalPriceAmt] = useState(String(initFinal));
  // BOB wallet settlement — admin closure pe wallet se kitna pay hua
  const [walletAmt, setWalletAmt] = useState("0");
  const [bobAvailable, setBobAvailable] = useState<number | null>(null);
  const [cashCollectedAmt, setCashCollectedAmt] = useState(String(closure.cashCollected || 0));
  const [gstSlab, setGstSlab] = useState(closure.gstSlab || 18);
  const [collectionMethod, setCollectionMethod] = useState(closure.paymentCollectionMethod || "COMPANY");
  const [vendorDirectAmt, setVendorDirectAmt] = useState(String(closure.vendorDirectAmount || 0));
  const [companyCollectedAmt, setCompanyCollectedAmt] = useState(String(closure.companyCollectedAmount || 0));

  // Customer ka BOB balance (admin closure modal me dikhane ke liye)
  useEffect(() => {
    if (!closure.customerId) return;
    let alive = true;
    (async () => {
      const res = await apiGet<any>(`/wallet/lookup/${closure.customerId}`);
      if (!alive) return;
      if (res.ok) {
        setBobAvailable(
          Number(res.data?.summary?.availableBalance ?? res.data?.summary?.totalBalance ?? 0)
        );
      } else {
        setBobAvailable(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [closure.customerId]);

  const finalNum = Math.max(0, Number(finalPriceAmt) || 0);
  const walletNum = Math.min(Math.max(0, Number(walletAmt) || 0), finalNum);
  // Existing BOB (booking pe pehle se) + naya closure wallet settlement — EMI sirf bache hue pe
  const existingBob = Math.min(finalNum, Math.max(0, Number(closure.bobUsed || 0)));
  const bobTotal = Math.min(finalNum, existingBob + walletNum);
  const collectedNum = Math.max(0, Number(cashCollectedAmt) || 0);
  const walletOverBalance = bobAvailable !== null && walletNum > bobAvailable;
  const balanceAmt = Math.max(0, finalNum - walletNum - collectedNum);
  const balancePercent = finalNum > 0 ? (balanceAmt / finalNum) * 100 : 0;
  const canCreateEMI = balancePercent <= 75;
  const minDown25 = Math.ceil(finalNum * 0.25);
  const emiDownInvalid = balanceAmt > 0 && collectedNum + walletNum < minDown25;
  const paidStatusInvalid = balanceAmt > 0 && !canCreateEMI;
  const closeInvalid = emiDownInvalid || paidStatusInvalid || walletOverBalance || finalNum <= 0;

  function onCashChange(v: string) { setCashCollectedAmt(v); }
  function onFinalChange(v: string) { setFinalPriceAmt(v); }
  function onWalletChange(v: string) { setWalletAmt(v); }

  const cl = closure.verificationChecklist;
  const allChecked = cl.serviceDelivered && cl.customerPresent && cl.qualityConfirmed && cl.paymentConfirmed;

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

        {/* Payment Summary — sirf CLOSED status pe dikhao (admin ne fill kar diya) */}
        {closure.status === "CLOSED" && closure.paymentStatus && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-700">
              💳 PAYMENT SUMMARY
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-gray-500">FINAL PRICE</p>
                <p className="mt-1 text-xl font-black text-gray-900">₹{(closure.finalPrice || closure.amount).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-gray-500">PAID VIA</p>
                <p className="mt-1 font-bold text-gray-900">{closure.paidVia || "—"}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-gray-500">STATUS</p>
                <p className="mt-1 font-bold text-green-700">{closure.paymentStatus}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs font-bold text-blue-700">BOB WALLET</p>
                <p className="mt-1 font-bold text-blue-700">₹{(closure.bobUsed || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">CASH / UPI</p>
                <p className="mt-1 font-bold text-amber-700">₹{(closure.cashCollected || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-700">EMI PENDING</p>
                <p className="mt-1 font-bold text-orange-700">₹{(closure.emiPending || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Step 2: Payment Reconciliation + Close (shown after verification) */}
        {closure.status === "ADMIN_VERIFIED" && (
          <div className="mt-5 space-y-5">
            {/* Step 2 Header */}
            <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                STEP 2: PAYMENT & CLOSE
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Service price fill karein, final price enter karein, payment details submit karein.
              </p>
            </div>

            {/* Admin Note (optional, internal) */}
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                ADMIN NOTE (OPTIONAL — INTERNAL)
              </p>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Payment reconciliation details, verification notes..."
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* ═══ NEW PAYMENT UPDATE ═══ */}
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-700">
                💳 PAYMENT UPDATE
              </p>

              {/* Row 1: Service Price + Final Price + GST Slab */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-100 p-4">
                  <p className="text-xs font-bold text-gray-500">SERVICE PRICE (LISTED)</p>
                  <p className="mt-1 text-2xl font-black text-gray-800">
                    ₹{Number(closure.amount || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">Booking me listed price</p>
                </div>
                <div className="rounded-xl border-2 border-green-300 bg-white p-4">
                  <p className="text-xs font-bold text-green-700">FINAL PRICE (₹)</p>
                  <input
                    type="number"
                    min={1}
                    value={finalPriceAmt}
                    onChange={(e) => onFinalChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-lg font-black outline-none focus:border-green-500 focus:bg-white"
                  />
                  {Number(closure.amount) !== finalNum && finalNum > 0 && (
                    <p className="mt-1 text-[11px] text-orange-600 font-semibold">
                      ⚠ Listed ₹{Number(closure.amount || 0).toLocaleString("en-IN")} se alag — saari calculation final price se hogi.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <p className="text-xs font-bold text-purple-700">GST SLAB</p>
                  <select
                    value={gstSlab}
                    onChange={(e) => setGstSlab(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-purple-500"
                  >
                    <option value={0}>0% — Exempt</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Default)</option>
                    <option value={28}>28%</option>
                  </select>
                  {finalNum > 0 && gstSlab > 0 && (() => {
                    const divisor = 1 + gstSlab / 100;
                    const base = Math.round(finalNum / divisor * 100) / 100;
                    const gst = Math.round((finalNum - base) * 100) / 100;
                    const half = Math.round(gst / 2 * 100) / 100;
                    return (
                      <div className="mt-2 rounded-lg bg-white p-2 text-[11px]">
                        <p className="font-bold text-gray-500">TAX BIFURCATION (Tax-Inclusive)</p>
                        <p className="text-gray-700">Base: ₹{base.toLocaleString("en-IN")} • GST: ₹{gst.toLocaleString("en-IN")}</p>
                        <p className="text-gray-700">CGST: ₹{half.toLocaleString("en-IN")} • SGST: ₹{(gst - half).toLocaleString("en-IN")}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 1.5: Payment Collection Method */}
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-xs font-bold text-purple-700">📍 PAYMENT COLLECTED BY</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { val: "COMPANY", label: "🏢 Paid to Company (Qurux)", desc: "Customer ne company ko pay kiya" },
                    { val: "VENDOR_DIRECT", label: "💈 Paid to Vendor Direct", desc: "Customer ne vendor ko seedha diya" },
                    { val: "SPLIT", label: "✂️ Partial Payment Split", desc: "Dono ko thoda thoda" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCollectionMethod(opt.val)}
                      className={`flex-1 rounded-xl border-2 p-3 text-left transition ${
                        collectionMethod === opt.val
                          ? "border-purple-500 bg-purple-100"
                          : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <p className={`text-sm font-bold ${collectionMethod === opt.val ? "text-purple-700" : "text-gray-700"}`}>{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {collectionMethod === "VENDOR_DIRECT" && (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <p className="text-xs font-bold text-gray-600">VENDOR DIRECT AMOUNT (₹)</p>
                    <input
                      type="number"
                      min={0}
                      max={finalNum}
                      value={vendorDirectAmt}
                      onChange={(e) => setVendorDirectAmt(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-purple-200 bg-gray-50 px-3 py-2 text-lg font-black outline-none focus:border-purple-500"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">Customer ne vendor ko seedha jo amount diya</p>
                  </div>
                )}
                {collectionMethod === "SPLIT" && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-bold text-gray-600">COMPANY COLLECTED (₹)</p>
                      <input
                        type="number"
                        min={0}
                        max={finalNum}
                        value={companyCollectedAmt}
                        onChange={(e) => setCompanyCollectedAmt(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-green-200 bg-gray-50 px-3 py-2 text-lg font-black outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="rounded-lg bg-white p-3">
<p className="text-xs font-bold text-gray-600">VENDOR COLLECTED (₹)</p>
                      <input
                        type="number"
                        min={0}
                        max={finalNum}
                        value={vendorDirectAmt}
                        onChange={(e) => setVendorDirectAmt(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-purple-200 bg-gray-50 px-3 py-2 text-lg font-black outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: BOB Wallet + Cash/UPI */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold text-blue-700">🏦 BOB WALLET PAID (₹)</p>
                  <input
                    type="number"
                    min={0}
                    max={finalNum}
                    value={walletAmt}
                    onChange={(e) => onWalletChange(e.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-lg font-black outline-none focus:border-blue-500 ${
                      walletOverBalance ? "border-red-400" : "border-blue-200"
                    }`}
                  />
                  {/* Customer BOB balance — prominent display */}
                  <div className="mt-2 rounded-lg bg-blue-100 px-3 py-2">
                    <p className="text-[11px] font-bold text-blue-600">CUSTOMER BOB BALANCE</p>
                    {bobAvailable === null ? (
                      <p className="text-sm font-bold text-gray-400">Loading...</p>
                    ) : (
                      <p className={`text-lg font-black ${bobAvailable > 0 ? "text-blue-700" : "text-gray-400"}`}>
                        ₹{bobAvailable.toLocaleString("en-IN")}
                      </p>
                    )}
                    {walletOverBalance && (
                      <p className="text-[11px] font-bold text-red-600">⚠ Balance se zyada nahi ho sakta!</p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-700">💵 CASH / UPI PAID (₹)</p>
                  <input
                    type="number"
                    min={0}
                    max={finalNum}
                    value={cashCollectedAmt}
                    onChange={(e) => onCashChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-lg font-black outline-none focus:border-amber-500"
                  />
                  <p className="mt-1 text-[11px] text-amber-600">Cash ya UPI — jo bhi customer ne diya</p>
                </div>
              </div>

              {/* Row 3: Auto-calculated balance + EMI logic */}
              {(() => {
                const bobPaid = Math.min(finalNum, Math.max(0, Number(walletAmt) || 0));
                const cashPaid = Math.max(0, Number(cashCollectedAmt) || 0);
                const totalPaidNow = bobPaid + cashPaid;
                const balance = Math.max(0, finalNum - totalPaidNow);
                const balancePercent = finalNum > 0 ? (balance / finalNum) * 100 : 0;
                const canCreateEMI = balancePercent <= 75; // balance ≤ 75% of final → EMI allowed
                const minDown25 = Math.ceil(finalNum * 0.25);

                return (
                  <>
                    {/* Balance row */}
                    <div className="mt-4 rounded-xl bg-slate-100 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-600">BALANCE AMOUNT</span>
                        <span className={`text-2xl font-black ${balance > 0 ? "text-orange-600" : "text-green-600"}`}>
                          ₹{balance.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all ${balance > 0 ? "bg-orange-400" : "bg-green-500"}`}
                            style={{ width: `${Math.min(100, 100 - balancePercent)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          {Math.round(100 - balancePercent)}% paid
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Final ₹{finalNum.toLocaleString("en-IN")} − BOB ₹{bobPaid.toLocaleString("en-IN")} − Cash/UPI ₹{cashPaid.toLocaleString("en-IN")} = Balance ₹{balance.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* EMI logic */}
                    {balance > 0 && (
                      <div className="mt-3">
                        {!canCreateEMI ? (
                          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
                            <p className="text-sm font-bold text-red-800">
                              ⚠️ EMI NAHI BANEGA — Balance ₹{balance.toLocaleString("en-IN")} ({Math.round(balancePercent)}%) final price ka 75% se zyada hai.
                            </p>
                            <p className="mt-1 text-sm text-red-700">
                              Customer se aur ₹{Math.max(0, balance - Math.ceil(finalNum * 0.75)).toLocaleString("en-IN")} collect karein, fir EMI create hoga.
                              Ya poora amount Cash/UPI me le ke CLOSE karein.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm font-bold text-blue-800">
                              📊 EMI PLAN AUTO-CREATE HOGA
                            </p>
                            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                              <div className="rounded-lg bg-white p-2">
                                <p className="font-bold text-gray-400">TOTAL BILL</p>
                                <p className="mt-0.5 font-black text-gray-900">₹{finalNum.toLocaleString("en-IN")}</p>
                              </div>
                              <div className="rounded-lg bg-white p-2">
                                <p className="font-bold text-gray-400">PAID NOW</p>
                                <p className="mt-0.5 font-black text-green-700">₹{totalPaidNow.toLocaleString("en-IN")}</p>
                              </div>
                              <div className="rounded-lg bg-white p-2">
                                <p className="font-bold text-gray-400">EMI BALANCE</p>
                                <p className="mt-0.5 font-black text-orange-700">₹{balance.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-blue-700">
                              Balance ₹{balance.toLocaleString("en-IN")} customer ke <strong>EMI Details</strong> me dikhega — weekly / jab jitna paisa ho flexible repayments me dega.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {balance === 0 && totalPaidNow > 0 && (
                      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="text-sm font-bold text-green-800">
                          ✅ FULLY PAID — Due ₹0. Booking CLOSE ho jayegi.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                const effPayStatus = balanceAmt === 0 ? "PAID" : "PARTIAL";
                const effPaidVia = balanceAmt > 0 ? "EMI" : (collectedNum > 0 ? "CASH" : "UPI");
                onClosures(
                  adminRemarks,
                  effPayStatus,
                  collectedNum,
                  effPaidVia,
                  finalNum,
                  walletNum,
                  collectionMethod,
                  collectionMethod === "VENDOR_DIRECT" ? Number(vendorDirectAmt) || 0 : (collectionMethod === "SPLIT" ? Number(vendorDirectAmt) || 0 : 0),
                  gstSlab
                );
              }}
              disabled={busy || closeInvalid}
              className={`w-full rounded-full px-6 py-3.5 font-bold text-white transition ${
                !closeInvalid
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {busy
                ? "PROCESSING..."
                : emiDownInvalid
                  ? "🔒 MIN 25% DOWN PAYMENT CHAHIYE"
                  : paidStatusInvalid
                    ? "⚠️ PAID KE LIYE PURA AMOUNT CHAHIYE"
                    : "🔒 CLOSE SERVICE & UPDATE PAYMENT"}
            </button>
          </div>
        )}

        {/* Closed Status */}
        {closure.status === "CLOSED" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-green-50 p-6 text-center">
              <div className="text-4xl">🔒</div>
              <p className="mt-3 text-xl font-black text-green-700">SERVICE CLOSED</p>
              <p className="mt-2 text-sm font-bold text-green-700">💳 Payment updated by admin — {closure.paymentStatus === "PAID" ? "PAID" : closure.paymentStatus} via {closure.paidVia || "CASH"}</p>
              {closure.paidVia === "EMI" && (
                <div className="mx-auto mt-3 max-w-sm rounded-xl bg-white p-3 text-left text-xs">
                  <p className="font-bold text-blue-800">📊 EMI PLAN (customer ke EMI Details me)</p>
                  <p className="mt-1 text-gray-700">
                    Total ₹{(closure.finalPrice || closure.amount).toLocaleString("en-IN")} • Abhi paid ₹
                    {closure.cashCollected.toLocaleString("en-IN")} • Balance ₹
                    {closure.emiPending.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-blue-700">
                    {closure.emiPending > 0
                      ? "Customer flexible EMI repayments karega — admin approve karega. Balance 0 hone par due zero."
                      : "Balance ₹0 — due zero ✅"}
                  </p>
                </div>
              )}
              {closure.adminRemarks && (
                <p className="mt-3 text-sm text-gray-600">{closure.adminRemarks}</p>
              )}
            </div>

            {/* WhatsApp Invoice Dispatch */}
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`https://wa.me/${closure.customerPhone.startsWith("+91") ? closure.customerPhone : `91${closure.customerPhone}`}?text=${encodeURIComponent(
                  [`🧾 *QURUX Invoice — ${closure.bookingId}*`, "", `Service: ${closure.service}`, `Date: ${closure.serviceDate}`,"", `*Final Price: ₹${(closure.finalPrice || closure.amount).toLocaleString("en-IN")}*`, "", closure.emiPending > 0 ? `EMI Balance: ₹${closure.emiPending.toLocaleString("en-IN")}` : "Full Payment Received ✅", "", "Terms: 6 months flexible repayment, 0% interest, ₹10/day late fee after 6 months.", "", "Thank you for choosing QURUX! 🙏"].join("\n")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
              >
                📱 Send Invoice to Customer
              </a>
              <a
                href={`https://wa.me/919911227916?text=${encodeURIComponent([
                  `🧾 *QURUX Vendor Invoice — ${closure.bookingId}*`,
                  `Service: ${closure.service}`,
                  `Customer: ${closure.customerName}`,
                  `Final Price: ₹${(closure.finalPrice || closure.amount).toLocaleString("en-IN")}`,
                  `Payment: ${closure.paymentStatus} via ${closure.paidVia || "CASH"}`,
                  ``,
                  `Invoice details customer ko bhej di gayi hai.`,
                ].join("\n"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
              >
                📋 Send Invoice to Vendor
              </a>
            </div>

            {/* Reopen for Edit button */}
            <button
              type="button"
              onClick={() => {
                if (confirm("Booking reopen karni hai? Payment details dobara edit kar sakte hain.")) {
                  onReopen();
                }
              }}
              disabled={busy}
              className="w-full rounded-full border-2 border-dashed border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-600 transition hover:border-pink-400 hover:text-pink-600 disabled:opacity-50"
            >
              {busy ? "Processing..." : "✏️ REOPEN FOR PAYMENT EDIT"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
