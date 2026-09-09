"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  bookingId: string;
  customer: { name: string; phone: string; email: string };
  service: { name: string; category: string; date: string; timeSlot: string; location: string };
  financial: { basePrice: number; gstSlab: number; gstAmount: number; cgst: number; sgst: number; totalBilled: number };
  payments: { bobWalletUsed: number; cashCollected: number; totalUpfront: number; emiBalance: number; paymentStatus: string; paidVia: string };
  emiTerms: { tenureMonths: number; interestRate: number; lateFeePerDay: number; lateFeeStartDay: number; conditions: string[] } | null;
  company: { name: string; phone: string };
};

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("qurux_token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"}/api/bookings/${id}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setInvoice(d.data);
        else setError(d.message || "Invoice not found");
      })
      .catch(() => setError("Failed to load invoice"));
  }, [id]);

  if (error) return <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8"><p className="text-red-600">{error}</p></div>;
  if (!invoice) return <div className="flex min-h-screen items-center justify-center bg-gray-100"><div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .invoice-box { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print mb-4 flex justify-center">
        <button onClick={() => window.print()} className="rounded-full bg-pink-600 px-6 py-2 text-sm font-bold text-white hover:bg-pink-700">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="invoice-box mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-pink-600" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>QURUX</h1>
            <p className="text-sm text-gray-500">Makeover & Academy</p>
            <p className="mt-1 text-xs text-gray-400">{invoice.company.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-gray-400">TAX INVOICE</p>
            <p className="mt-1 font-mono text-sm font-bold text-gray-800">{invoice.invoiceNumber}</p>
            <p className="mt-0.5 text-xs text-gray-500">{new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        {/* Customer + Service */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400">Bill To</p>
            <p className="mt-1 font-bold text-gray-900">{invoice.customer.name}</p>
            <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
            {invoice.customer.email && <p className="text-sm text-gray-500">{invoice.customer.email}</p>}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400">Service Details</p>
            <p className="mt-1 font-bold text-gray-900">{invoice.service.name}</p>
            <p className="text-sm text-gray-600">{invoice.service.date} • {invoice.service.timeSlot}</p>
            <p className="text-sm text-gray-500">{invoice.service.location}</p>
          </div>
        </div>

        {/* Financial Breakup */}
        <div className="mt-8 rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-bold uppercase text-gray-400">Price Breakup</p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Base Price (excl. GST)</span><span className="font-bold text-gray-900">₹{invoice.financial.basePrice.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">CGST ({invoice.financial.gstSlab / 2}%)</span><span className="font-bold text-gray-900">₹{invoice.financial.cgst.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">SGST ({invoice.financial.gstSlab / 2}%)</span><span className="font-bold text-gray-900">₹{invoice.financial.sgst.toLocaleString("en-IN")}</span></div>
            <div className="border-t border-gray-200 pt-2 flex justify-between"><span className="font-bold text-gray-900">Total Billed (Incl. GST)</span><span className="text-lg font-black text-pink-600">₹{invoice.financial.totalBilled.toLocaleString("en-IN")}</span></div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mt-6 rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-bold uppercase text-gray-400">Payment Summary</p>
          <div className="mt-3 space-y-2">
            {invoice.payments.bobWalletUsed > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">BOB Wallet Used</span><span className="font-bold text-green-700">₹{invoice.payments.bobWalletUsed.toLocaleString("en-IN")}</span></div>}
            {invoice.payments.cashCollected > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Cash / UPI Collected</span><span className="font-bold text-green-700">₹{invoice.payments.cashCollected.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-gray-600">Total Upfront Paid</span><span className="font-bold text-gray-900">₹{invoice.payments.totalUpfront.toLocaleString("en-IN")}</span></div>
            {invoice.payments.emiBalance > 0 && (
              <div className="flex justify-between text-sm"><span className="font-bold text-orange-700">EMI Balance Due</span><span className="font-bold text-orange-700">₹{invoice.payments.emiBalance.toLocaleString("en-IN")}</span></div>
            )}
            {invoice.payments.emiBalance === 0 && (
              <div className="flex justify-between text-sm"><span className="font-bold text-green-700">✅ FULLY PAID</span><span className="font-bold text-green-700">₹0 Due</span></div>
            )}
          </div>
        </div>

        {/* EMI Terms */}
        {invoice.emiTerms && (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-xs font-bold uppercase text-orange-700">📋 EMI Terms & Conditions</p>
            <ul className="mt-2 space-y-1">
              {invoice.emiTerms.conditions.map((c, i) => (
                <li key={i} className="text-xs text-gray-700">• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-400">Thank you for choosing QURUX Makeover & Academy! 🙏</p>
          <p className="mt-1 text-[10px] text-gray-300">This is a system-generated invoice.</p>
        </div>
      </div>
    </div>
  );
}
