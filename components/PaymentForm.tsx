"use client";

import { useState } from "react";

type Props = {
  amount: number;
  referenceType: string;
  referenceName: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function PaymentForm({
  amount,
  referenceType,
  referenceName,
  onSuccess,
  onCancel,
}: Props) {
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const upiId = "qurux@upi";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setScreenshot(file);
  }

  async function handleSubmit() {
    if (!transactionId.trim()) return;
    setSubmitting(true);

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitting(false);
    setSubmitted(true);

    // Trigger success after brief confirmation
    setTimeout(() => {
      onSuccess();
    }, 1000);
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
          Your UPI transaction is being verified. You will receive confirmation shortly.
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
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-white shadow-inner">
              {/* Simple QR placeholder — in production use a QR library */}
              <div className="text-center">
                <div className="text-6xl">📱</div>
                <p className="mt-2 text-xs font-bold text-gray-600">UPI QR CODE</p>
                <p className="mt-1 text-[10px] text-gray-400">Scan to pay</p>
              </div>
            </div>
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
