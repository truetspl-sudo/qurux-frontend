"use client";

import { useState } from "react";
import { apiPost } from "../lib/api";

type PaymentFormProps = {
  amount: number;
  referenceType: "BOOKING" | "ORDER" | "EMI" | "WALLET";
  referenceId?: string;
  referenceName?: string;
  onSuccess?: (payment: any) => void;
  onCancel?: () => void;
};

export default function PaymentForm({
  amount,
  referenceType,
  referenceId,
  referenceName,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"qr" | "submit">("qr");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      let screenshotUrl = "";

      // Upload screenshot if selected
      if (screenshot) {
        const formData = new FormData();
        formData.append("screenshot", screenshot);
        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api"}/payments/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("qurux_token") || ""}`,
            },
            body: formData,
          }
        );
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          screenshotUrl = uploadData.url;
        }
      }

      // Submit payment
      const res = await apiPost("/payments", {
        amount,
        method: "UPI",
        transactionId,
        referenceType,
        bookingId: referenceType === "BOOKING" ? referenceId : undefined,
        orderId: referenceType === "ORDER" ? referenceId : undefined,
        referenceName: referenceName || "",
        screenshotUrl,
      });

      if (res.ok) {
        setMessage("Payment submitted! Waiting for admin verification.");
        onSuccess?.(res.data);
      } else {
        setError(res.message || "Payment submission failed.");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 2: Success message
  if (message) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
          ✅
        </div>
        <h3 className="text-lg font-bold text-green-800">Payment Submitted</h3>
        <p className="mt-2 text-sm text-green-700">{message}</p>
        <p className="mt-1 text-xs text-green-600">
          Admin will verify and approve your payment shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-bold text-gray-900">
        💳 Make Payment — ₹{amount.toLocaleString("en-IN")}
      </h3>

      {/* Step 1: UPI QR */}
      {step === "qr" && (
        <div className="text-center">
          {/* UPI QR Code (placeholder) */}
          <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-pink-200 bg-pink-50">
            <div className="text-center">
              <p className="text-4xl">📱</p>
              <p className="mt-2 text-sm font-bold text-pink-600">
                QURUX UPI
              </p>
              <p className="text-xs text-gray-500">
                qurux@upi
              </p>
            </div>
          </div>

          <p className="mb-1 text-sm font-semibold text-gray-700">
            Scan QR or Pay to: <span className="text-pink-600">qurux@upi</span>
          </p>
          <p className="mb-4 text-xs text-gray-400">
            Amount: ₹{amount.toLocaleString("en-IN")}
          </p>

          <button
            onClick={() => setStep("submit")}
            className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700"
          >
            I have paid — Submit Details →
          </button>
        </div>
      )}

      {/* Step 2: Submit transaction details */}
      {step === "submit" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("qr")}
            className="text-sm text-pink-500 hover:underline"
          >
            ← Back to QR
          </button>

          {/* Transaction ID */}
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">
              Transaction ID / UTR Number *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter UPI Transaction ID or UTR"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">
              Payment Screenshot (optional but recommended)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-600 hover:bg-pink-100">
                📷 Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {screenshotPreview && (
                <img
                  src={screenshotPreview}
                  alt="Screenshot"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !transactionId.trim()}
            className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Payment"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </form>
      )}
    </div>
  );
}
