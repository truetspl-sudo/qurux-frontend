/* =============================================
   UPI INTENT HELPER
   Opens native UPI apps (GPay, PhonePe, Paytm)
   on Android via upi://pay intent URL.
   
   Works on:
   - Android Chrome/Samsung: opens default UPI app ✅
   - iOS Safari: opens UPI apps if installed ✅
   - In-app browsers (Instagram/WhatsApp): shows fallback ⚠️
   - Desktop: shows QR code + UPI ID ✅
============================================= */

const UPI_ID = "8130231520@hdfc";
const MERCHANT_NAME = "QURUX Makeover";

/**
 * Build a UPI intent URL
 * Format: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT&tn=NOTE&cu=INR
 */
export function buildUpiIntentUrl(
  amount: number,
  note: string,
  transactionRef?: string
): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: MERCHANT_NAME,
    am: String(amount),
    tn: note || "QURUX Payment",
    cu: "INR",
  });
  if (transactionRef) {
    params.set("tr", transactionRef);
  }
  return `upi://pay?${params.toString()}`;
}

/**
 * Detect if running inside an in-app browser
 * (Instagram, Facebook, WhatsApp, Twitter in-app browsers block custom URLs)
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("fbav") ||       // Facebook app
    ua.includes("facebook") ||   // Facebook browser
    ua.includes("instagram") ||  // Instagram
    ua.includes("twitter") ||    // Twitter/X
    ua.includes("whatsapp") ||   // WhatsApp in-app
    ua.includes("line/") ||      // LINE
    ua.includes("micromessenger") // WeChat
  );
}

/**
 * Detect if device is Android (supports UPI intent)
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Detect if device is mobile (Android or iOS)
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Open UPI payment intent on mobile, or show fallback on desktop/in-app.
 * Returns: "opened" | "copied" | "fallback"
 */
export function openUpiPayment(
  amount: number,
  note: string,
  transactionRef?: string
): "opened" | "copied" | "fallback" {
  if (amount <= 0) return "fallback";

  const url = buildUpiIntentUrl(amount, note, transactionRef);

  // In-app browsers block upi:// — show fallback (QR + copy UPI ID)
  if (isInAppBrowser()) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID).catch(() => {});
    }
    return "fallback";
  }

  if (isAndroid()) {
    // Android: open UPI intent directly — opens GPay/PhonePe/Paytm
    window.location.href = url;
    return "opened";
  }

  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    // iOS: try UPI intent (works if UPI apps installed)
    window.open(url, "_blank");
    return "opened";
  }

  // Desktop: copy UPI ID to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(UPI_ID).catch(() => {});
  }
  return "copied";
}

/**
 * Get UPI details for display
 */
export function getUpiDetails() {
  return {
    upiId: UPI_ID,
    merchantName: MERCHANT_NAME,
    qrImage: "/payment/quruxbarcode.png",
  };
}

/**
 * Generate a unique transaction reference
 */
export function generateTxnRef(prefix = "QRX"): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${date}-${time}-${rand}`;
}


// ═══ PAYMENT STATE MANAGEMENT ═══
// Save pending payment before UPI redirect, detect on return

type PendingPayment = {
  amount: number;
  type: "deposit" | "emi";
  note: string;
  emiPlanId?: string;
  timestamp: number;
  txnRef: string;
};

const PENDING_KEY = "qurux_pending_upi";

export function savePendingPayment(data: Omit<PendingPayment, "timestamp">) {
  if (typeof window === "undefined") return;
  const pending: PendingPayment = { ...data, timestamp: Date.now() };
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function getPendingPayment(): PendingPayment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data: PendingPayment = JSON.parse(raw);
    // Only valid for 30 minutes
    if (Date.now() - data.timestamp > 30 * 60 * 1000) {
      clearPendingPayment();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_KEY);
}

export function firePaymentUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("payment-updated"));
}

// ═══ AUTO UPI VERIFICATION ═══
// Detect UPI deep link callback and auto-verify payment

/**
 * Build UPI verification URL with callback
 * When user pays, UPI app redirects back with transaction details
 */
export function buildUpiVerifyUrl(
  amount: number,
  note: string,
  callbackUrl: string
): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: MERCHANT_NAME,
    am: String(amount),
    tn: note || "QURUX Payment",
    cu: "INR",
    url: callbackUrl, // UPI app redirects here after payment
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Parse UPI callback URL parameters
 * Returns transaction ID and status from UPI redirect
 */
export function parseUpiCallback(searchParams: URLSearchParams) {
  const txnId = searchParams.get("txnId") || searchParams.get("tr") || "";
  const status = searchParams.get("Status") || searchParams.get("status") || "";
  const amount = searchParams.get("am") || "";
  const ref = searchParams.get("ref") || "";
  
  return {
    txnId,
    status: status.toUpperCase(),
    amount: amount ? Number(amount) : 0,
    ref,
    isSuccess: status.toUpperCase() === "SUCCESS",
  };
}

/**
 * Auto-verify payment by submitting to backend
 * Returns true if backend confirms payment
 */
export async function autoVerifyPayment(
  endpoint: string,
  data: {
    amount: number;
    transactionId: string;
    method: string;
    screenshotUrl?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const token = typeof window !== "undefined" 
      ? localStorage.getItem("qurux_token") || ""
      : "";
    const API_BASE = typeof process !== "undefined" 
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      : "http://localhost:5000";

    const res = await fetch(`${API_BASE}/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const result = await res.json().catch(() => ({}));

    if (res.ok) {
      return { success: true, message: result.message || "Payment verified" };
    }
    return { success: false, message: result.message || "Verification failed" };
  } catch (err) {
    return { 
      success: false, 
      message: err instanceof Error ? err.message : "Network error" 
    };
  }
}
