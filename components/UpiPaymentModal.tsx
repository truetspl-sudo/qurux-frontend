"use client";

import { useState, useEffect, useCallback } from "react";
import {
  openUpiPayment,
  getUpiDetails,
  generateTxnRef,
  isAndroid,
  isMobile,
  isInAppBrowser,
  savePendingPayment,
  getPendingPayment,
  clearPendingPayment,
  firePaymentUpdate,
} from "@/lib/upi";

type PaymentType = "deposit" | "emi";

type Props = {
  type: PaymentType;
  amount: number;
  note: string;
  emiPlanId?: string;
  apiEndpoint: string;
  onSuccess?: () => void;
  onClose?: () => void;
};

type SnackbarType = "success" | "error" | "info";

export default function UpiPaymentModal({
  type,
  amount,
  note,
  emiPlanId,
  apiEndpoint,
  onSuccess,
  onClose,
}: Props) {
  const [step, setStep] = useState<"pay" | "confirm" | "done">("pay");
  const [txnRef, setTxnRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: SnackbarType;
  }>({ show: false, message: "", type: "info" });

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = "info") => {
      setSnackbar({ show: true, message, type });
      setTimeout(() => setSnackbar((s) => ({ ...s, show: false })), 5000);
    },
    []
  );

  // On mount: check if user returned from UPI app
  useEffect(() => {
    const pending = getPendingPayment();
    if (
      pending &&
      pending.type === type &&
      (!emiPlanId || pending.emiPlanId === emiPlanId)
    ) {
      setTxnRef(pending.txnRef || "");
      setStep("confirm");
      showSnackbar("Payment kiya? UTR daalein.", "info");
    }
  }, [type, emiPlanId, showSnackbar]);

  // Open UPI app
  function handlePayViaUpi() {
    if (amount <= 0) {
      showSnackbar("Amount kam se kam ₹1 hona chahiye.", "error");
      return;
    }
    const ref = generateTxnRef(type === "emi" ? "EMI" : "QRX");

    savePendingPayment({ amount, type, note, emiPlanId, txnRef: ref });
    setTxnRef(ref);

    const result = openUpiPayment(amount, note, ref);

    if (result === "opened") {
      showSnackbar("UPI app khula hai. Payment karke wapas aayein.", "info");
      setTimeout(() => setStep("confirm"), 2000);
    } else if (result === "copied") {
      showSnackbar("UPI ID copy ho gaya. UPI app me jaake pay karein.", "info");
      setStep("confirm");
    } else {
      showSnackbar(
        "Is browser me UPI open nahi ho sakta. Chrome/Samsung Browser me kholein.",
        "error"
      );
    }
  }

  // Submit payment to backend
  async function handleSubmit() {
    if (!txnRef.trim()) {
      showSnackbar("Transaction ID (UTR) daalna zaroori hai.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { autoVerifyPayment } = await import("@/lib/upi");

      const result = await autoVerifyPayment(apiEndpoint, {
        amount,
        transactionId: txnRef.trim(),
        method: "UPI",
      });

      if (result.success) {
        clearPendingPayment();
        firePaymentUpdate();
        setStep("done");
        showSnackbar(
          type === "deposit"
            ? `✅ ₹${amount.toLocaleString("en-IN")} payment successful! Balance turant update ho gaya.`
            : `✅ ₹${amount.toLocaleString("en-IN")} EMI payment successful!`,
          "success"
        );
        onSuccess?.();
      } else {
        showSnackbar(
          result.message || "Payment submit failed. Thodi der baad try karein.",
          "error"
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Backend offline hai.";
      showSnackbar(`Payment submit me problem: ${errMsg}`, "error");
    }
    setSubmitting(false);
  }

  return (
    <>
      {/* SNACKBAR */}
      <div
        className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300 ${
          snackbar.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl ${
            snackbar.type === "success"
              ? "bg-green-600 text-white"
              : snackbar.type === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white"
          }`}
        >
          <span className="text-xl">
            {snackbar.type === "success" ? "✅" : snackbar.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="max-w-md text-sm font-semibold">{snackbar.message}</span>
          <button
            type="button"
            onClick={() => setSnackbar((s) => ({ ...s, show: false }))}
            className="ml-2 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* MODAL */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-pink-600">
                {type === "deposit" ? "🏦 BOB DEPOSIT" : "💳 EMI PAYMENT"}
              </p>
              <h3 className="mt-1 text-2xl font-black text-gray-900">
                ₹{amount.toLocaleString("en-IN")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
            >
              ×
            </button>
          </div>

          {/* ── STEP 1: PAY ── */}
          {step === "pay" && (
            <div className="mt-6 space-y-4">
              {/* In-app browser warning */}
              {isInAppBrowser() && (
                <div className="rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-700">
                  ⚠️ Instagram/WhatsApp me ho — Chrome ya Samsung Browser me
                  kholein UPI ke liye
                </div>
              )}

              {/* Mobile: Direct UPI button */}
              {isMobile() ? (
                <div className="text-center">
                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="text-3xl">📱</p>
                    <p className="mt-3 text-sm font-bold text-green-800">
                      Pay via UPI App
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      Amount ₹{amount.toLocaleString("en-IN")} pre-fill hoga
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      QURUX ke account me seedha jayega
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePayViaUpi}
                    className="mt-4 w-full rounded-full bg-gradient-to-r from-green-600 to-green-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-green-700 hover:to-green-600 active:scale-95 transition-transform"
                  >
                    📱 PAY ₹{amount.toLocaleString("en-IN")} via UPI
                  </button>
                  <p className="mt-3 text-[11px] text-gray-400">
                    GPay, PhonePe, Paytm — jo bhi app hai
                  </p>
                </div>
              ) : (
                /* Desktop: QR code fallback */
                <div className="text-center">
                  <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50 p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getUpiDetails().qrImage}
                      alt="Qurux UPI QR"
                      className="mx-auto h-48 w-48 rounded-xl bg-white object-contain shadow-sm"
                    />
                    <p className="mt-3 text-xs text-gray-500">
                      UPI ID:{" "}
                      <span className="font-mono font-bold text-pink-600">
                        {getUpiDetails().upiId}
                      </span>
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    Phone pe QR scan karein ya UPI ID copy karke pay karein
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getUpiDetails().upiId);
                      showSnackbar("UPI ID clipboard pe copy ho gaya!", "success");
                    }}
                    className="mt-3 rounded-full bg-pink-100 px-6 py-2 text-sm font-bold text-pink-600 hover:bg-pink-200"
                  >
                    📋 COPY UPI ID
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="w-full text-center text-sm font-semibold text-pink-600 hover:underline"
              >
                Payment ho gaya? UTR daalein →
              </button>
            </div>
          )}

          {/* ── STEP 2: CONFIRM — paste Transaction ID ── */}
          {step === "confirm" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-blue-50 p-4 text-center">
                <p className="text-3xl">💸</p>
                <p className="mt-2 text-sm font-bold text-blue-800">
                  Payment ho gaya?
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Transaction ID (UTR) daalein jo UPI app me dikha
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Transaction ID / UTR *
                </label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="12-digit UPI transaction ID"
                  className="w-full rounded-xl border border-gray-200 px-4 py-4 text-center font-mono text-lg font-bold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
                <p className="mt-1 text-center text-[11px] text-gray-400">
                  UPI app → Transaction Details me dikhta hai
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!txnRef.trim() || submitting}
                className="w-full rounded-full bg-pink-600 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    SUBMITTING...
                  </span>
                ) : (
                  `CONFIRM PAYMENT — ₹${amount.toLocaleString("en-IN")}`
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("pay")}
                className="w-full text-center text-sm text-gray-500 hover:text-pink-600"
              >
                ← Wapas jayein
              </button>
            </div>
          )}

          {/* ── STEP 3: DONE ── */}
          {step === "done" && (
            <div className="mt-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
                ✓
              </div>
              <h3 className="mt-4 text-xl font-black text-green-700">
                Payment Successful! 🎉
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {type === "deposit"
                  ? `₹${amount.toLocaleString("en-IN")} successfully added to your BOB Wallet. Balance turant update ho gaya!`
                  : `₹${amount.toLocaleString("en-IN")} EMI payment successful! Pending amount turant kam ho gaya.`}
              </p>
              <div className="mt-4 rounded-2xl bg-green-50 p-4">
                <p className="text-xs font-bold text-green-700">✅ PAYMENT VERIFIED</p>
                <p className="mt-1 font-mono text-sm text-green-600">UTR: {txnRef}</p>
                <p className="text-xs text-gray-500">Amount: ₹{amount.toLocaleString("en-IN")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-pink-600 px-10 py-3 font-bold text-white hover:bg-pink-700"
              >
                DONE ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
