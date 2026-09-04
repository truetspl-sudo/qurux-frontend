"use client";

import { useState } from "react";

type Props = {
  amount: number;
  referenceType: string; // "BOOKING" | "ORDER"
  referenceName: string;
  referenceId?: string; // bookingId / orderId string
  onSuccess: () => void;
  onCancel: () => void;
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export default function PaymentForm({
  amount,
  referenceType,
  referenceName,
  referenceId,
  onSuccess,
  onCancel,
}: Props) {
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Company ka asli UPI ID — barcode (public/payment/quruxbarcode.png) pe yahi hai
  const upiId = "8130231520@hdfc";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setScreenshot(file);
  }

  async function uploadScreenshot(file: File): Promise<string> {
    const token = localStorage.getItem("qurux_token") || "";
    const fd = new FormData();
    fd.append("screenshot", file);
    const res = await fetch(`${API_BASE}/payments/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Screenshot upload failed");
    return data.url || "";
  }

  async function handleSubmit() {
    if (!transactionId.trim()) {
      setError("UPI Transaction ID daalna zaroori hai.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // 1) Upload screenshot if chosen
      let screenshotUrl = "";
      if (screenshot) {
        screenshotUrl = await uploadScreenshot(screenshot);
      }

      // 2) Submit real Payment record (status PENDING — admin verifies)
      const token = localStorage.getItem("qurux_token") || "";
      const body: Record<string, unknown> = {
        amount,
        method: "UPI",
        transactionId: transactionId.trim(),
        screenshotUrl,
        referenceType,
        referenceName,
      };
      if (referenceType === "BOOKING") body.bookingId = referenceId;
      if (referenceType === "ORDER") body.orderId = referenceId;

      const res = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Payment submit failed");

      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Payment submit me problem hui. Thodi der baad try karein.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[30px] bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-black text-gray-900">
          Payment Submitted!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Aapki UPI payment detail admin verification ke liye bhej di gayi hai.
          Admin approve karte hi booking/order PAID ho jayegi. Confirmation WhatsApp par milegi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UPI QR Code Section */}
      <section className="rounded-[30px] bg-white p-8 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">💳 Make Payment</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pay ₹{amount.toLocaleString("en-IN")} via UPI
        </p>

        {/* QR Code */}
        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50 p-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/payment/quruxbarcode.png"
              alt="Qurux UPI barcode — scan to pay"
              className="mx-auto h-56 w-56 rounded-2xl bg-white object-contain shadow-inner"
            />
          </div>

          {/* UPI ID */}
          <div className="mt-5 w-full max-w-sm">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-500">
              Or pay to UPI ID
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-5 py-3">
              <span className="font-mono text-lg font-bold text-pink-600">
                {upiId}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(upiId);
                  alert("UPI ID copied!");
                }}
                className="rounded-full bg-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700"
              >
                COPY
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-4 rounded-2xl bg-gray-50 px-6 py-3 text-center">
            <p className="text-xs text-gray-500">Amount to Pay</p>
            <p className="text-3xl font-black text-pink-600">
              ₹{amount.toLocaleString("en-IN")}
            </p>
          </div>

          <p className="mt-3 max-w-sm text-center text-[11px] leading-5 text-gray-400">
            ⚠️ Ye automatic payment gateway nahi hai. UPI app me payment karke
            transaction ID + screenshot submit karein. Admin manually verify karke approve karega.
          </p>
        </div>
      </section>

      {/* Transaction Details */}
      <section className="rounded-[30px] bg-white p-8 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">
          📋 After Payment — Enter Details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Complete the payment above, then enter your transaction details below.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            ❌ {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Transaction ID */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-800">
              UPI Transaction ID / Reference Number *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter 12-digit UPI transaction ID"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
            <p className="mt-1 text-xs text-gray-400">
              Found in your UPI app under transaction details
            </p>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-800">
              Payment Screenshot (optional)
            </label>
            <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 transition hover:border-pink-300 hover:bg-pink-50">
              {screenshot ? (
                <div className="text-center">
                  <span className="text-3xl">✅</span>
                  <p className="mt-2 text-sm font-bold text-green-700">
                    {screenshot.name}
                  </p>
                  <p className="text-xs text-gray-500">Click to change</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-3xl">📷</span>
                  <p className="mt-2 text-sm font-bold text-gray-600">
                    Upload payment screenshot
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG — Max 5MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Reference Info */}
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-700">ℹ️ PAYMENT REFERENCE</p>
            <p className="mt-1 text-xs text-blue-600">
              {referenceType}: {referenceName}
              {referenceId ? ` (${referenceId})` : ""}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Amount: ₹{amount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!transactionId.trim() || submitting}
            className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {submitting ? "SUBMITTING..." : "CONFIRM PAYMENT →"}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-center text-sm font-semibold text-gray-500 hover:text-pink-600"
          >
            ← Go Back to Details
          </button>
        </div>
      </section>
    </div>
  );
}
