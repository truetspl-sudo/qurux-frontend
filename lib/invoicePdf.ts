import { jsPDF } from "jspdf";

/* =============================================
   QURUX INVOICE PDF GENERATOR
   Branded tax-inclusive invoice PDF for
   WhatsApp sharing (customer + vendor).
============================================= */

export type InvoiceData = {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  service: string;
  salon: string;
  serviceType: string;
  serviceDate: string;
  timeSlot: string;
  finalPrice: number;
  bobUsed: number;
  cashUpiPaid: number;
  emiBalance: number;
  paymentStatus: string;
  paidVia: string;
  gstSlab: number;
  basePrice?: number;
  gstAmount?: number;
  cgst?: number;
  sgst?: number;
  companyCollected?: number;
  vendorCollected?: number;
  platformCommission?: number;
  vendorNetPayout?: number;
};

const PINK: [number, number, number] = [236, 72, 153];
const DARK: [number, number, number] = [30, 30, 40];
const GRAY: [number, number, number] = [110, 118, 132];

function rupee(n: number) {
  return "Rs. " + Math.round(n).toLocaleString("en-IN");
}

export function generateInvoicePdf(d: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;

  // ── Header band ──
  doc.setFillColor(...PINK);
  doc.rect(0, 0, W, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(34);
  doc.text("QURUX", M, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("MAKEOVER & ACADEMY — Bank of Beauty", M, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TAX INVOICE", W - M, 44, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice: ${d.bookingId}`, W - M, 62, { align: "right" });
  doc.text(`Date: ${d.serviceDate}`, W - M, 76, { align: "right" });

  // ── Bill To / Service block ──
  let y = 128;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILLED TO", M, y);
  doc.text("SERVICE DETAILS", W / 2 + 20, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(d.customerName || "-", M, y + 16);
  doc.setFontSize(10);
  if (d.customerPhone) doc.text(`Mobile: +91 ${d.customerPhone}`, M, y + 32);

  doc.setFontSize(11);
  doc.text(d.service || "-", W / 2 + 20, y + 16);
  doc.setFontSize(10);
  doc.text(`${d.serviceType} — ${d.salon}`, W / 2 + 20, y + 32);
  doc.text(`Slot: ${d.serviceDate} • ${d.timeSlot}`, W / 2 + 20, y + 48);

  // ── Amount table ──
  y = 210;
  doc.setFillColor(...PINK);
  doc.rect(M, y, W - M * 2, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DESCRIPTION", M + 10, y + 16);
  doc.text("AMOUNT", W - M - 10, y + 16, { align: "right" });

  y += 24;
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setDrawColor(230, 232, 238);
  doc.line(M, y, W - M, y);
  y += 22;
  doc.text(`${d.service || "Beauty Service"} (GST inclusive @ ${d.gstSlab}%)`, M + 10, y);
  doc.setFont("helvetica", "bold");
  doc.text(rupee(d.finalPrice), W - M - 10, y, { align: "right" });
  doc.setFont("helvetica", "normal");

  const lines: Array<[string, number, string]> = [
    ["BOB Wallet Paid", -(d.bobUsed || 0), ""],
    ["Cash / UPI Paid", -(d.cashUpiPaid || 0), ""],
  ];
  y += 18;
  for (const [label, val] of lines) {
    if (val !== 0) {
      doc.text(`${label}: ${rupee(-val)}`, M + 10, y);
      y += 18;
    }
  }
  if (d.emiBalance > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 119, 6);
    doc.text(`EMI Balance (flexible, 6 months): ${rupee(d.emiBalance)}`, M + 10, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    y += 18;
  }

  // ── Totals ──
  y += 8;
  const totalPaid = (d.bobUsed || 0) + (d.cashUpiPaid || 0);
  const rows: Array<[string, string, [number, number, number] | null]> = [
    ["Total Paid", rupee(totalPaid), null],
    ["Balance Due", d.emiBalance > 0 ? rupee(d.emiBalance) : "Rs. 0", d.emiBalance > 0 ? [217, 119, 6] : [22, 163, 74]],
  ];
  for (const [label, val, color] of rows) {
    doc.setFillColor(...(color || GRAY));
    // label side
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}`, W - M - 190, y + 2, { align: "left" });
    doc.text(val, W - M - 10, y + 2, { align: "right" });
    y += 22;
  }

  // ── GST bifurcation ──
  if (d.gstSlab > 0 && d.finalPrice > 0) {
    const divisor = 1 + d.gstSlab / 100;
    const base = d.basePrice ?? Math.round((d.finalPrice / divisor) * 100) / 100;
    const gst = d.gstAmount ?? Math.round((d.finalPrice - base) * 100) / 100;
    const half = d.cgst ?? Math.round((gst / 2) * 100) / 100;
    y += 10;
    doc.setFillColor(248, 242, 250);
    doc.roundedRect(M, y - 14, W - M * 2, 64, 6, 6, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PINK);
    doc.text("GST BIFURCATION (TAX-INCLUSIVE)", M + 12, y + 2);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    doc.text(`Taxable Value: ${rupee(base)}`, M + 12, y + 18);
    doc.text(`CGST @ ${d.gstSlab / 2}%: ${rupee(half)}`, M + 12, y + 32);
    doc.text(`SGST @ ${d.gstSlab / 2}%: ${rupee(gst - half)}`, W / 2, y + 18);
    doc.text(`Total GST: ${rupee(gst)}`, W / 2, y + 32);
  }

  // ── Vendor copy footer box (vendor version) ──
  if (d.vendorNetPayout !== undefined) {
    y += 70;
    doc.setFillColor(240, 247, 255);
    doc.roundedRect(M, y - 14, W - M * 2, 64, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text("VENDOR SETTLEMENT (INTERNAL)", M + 12, y + 2);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "normal");
    doc.text(`Company Collected: ${rupee(d.companyCollected || 0)}`, M + 12, y + 18);
    doc.text(`Vendor Direct: ${rupee(d.vendorCollected || 0)}`, M + 12, y + 32);
    doc.text(`Platform Commission (10%): ${rupee(d.platformCommission || 0)}`, W / 2, y + 18);
    doc.text(`Vendor Net Payout: ${rupee(d.vendorNetPayout || 0)}`, W / 2, y + 32);
  }

  // ── Footer ──
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK);
  doc.rect(0, H - 56, W, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Thank you for choosing QURUX!  •  www.qurux.in", M, H - 34);
  doc.setFontSize(8);
  doc.setTextColor(180, 186, 200);
  doc.text("Payments are GST-inclusive. EMI: 6-month flexible repayment, zero interest, Rs.10/day late fee thereafter.", M, H - 20);

  return doc;
}

/** Vendor copy = customer copy + internal settlement box */
export function generateVendorInvoicePdf(d: InvoiceData): jsPDF {
  return generateInvoicePdf({
    ...d,
    platformCommission: d.platformCommission ?? Math.round(d.finalPrice * 0.1),
    vendorNetPayout: d.vendorNetPayout ?? Math.round(d.finalPrice * 0.9),
  });
}

export function invoicePdfBlob(d: InvoiceData): Blob {
  return generateInvoicePdf(d).output("blob");
}
