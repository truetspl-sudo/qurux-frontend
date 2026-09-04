"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import ServiceCollageMarquee from "@/components/ServiceCollageMarquee";
import QuruxLogo from "@/components/QuruxLogo";

type DashboardTab = "SAVING" | "PURCHASES" | "PAYMENT" | "STATEMENT" | "PROFILE";

type EMIPayment = {
  _id: string;
  amount: number;
  transactionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  screenshotUrl?: string;
};
type EMIPlan = {
  _id: string;
  purchaseType: string;
  purchaseName: string;
  totalAmount: number;
  bobPaidAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentHistory: EMIPayment[];
  status: string;
};

type DepositDetail = {
  deposit: {
    _id: string;
    originalAmount: number;
    depositDate: string;
    usedAmount: number;
    benefitEnabled: boolean;
    status: string;
    reference: string;
  };
  benefit: {
    milestonePercent: number;
    benefitAmount: number;
    totalValue: number;
    monthsCompleted: number;
  };
};

type StatementRow = {
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
};

type WalletSummary = {
  totalDeposited: number;
  totalUsed: number;
  totalBenefit: number;
  availableBalance: number;
  eligibleSaving: number;
  promotionalBalance: number;
  totalBalance: number;
  depositDetails: DepositDetail[];
  pendingDeposits?: Array<{
    deposit: {
      _id: string;
      originalAmount: number;
      depositDate: string;
      submittedAt?: string;
      status: string;
      reference?: string;
    };
    benefit: any;
  }>;
};

export default function BOBPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [issueDate, setIssueDate] = useState(""); // Card issue date = signup day
  const [availableValue, setAvailableValue] = useState(0);

  const [activeTab, setActiveTab] = useState<DashboardTab>("SAVING");
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [emiPlans, setEmiPlans] = useState<EMIPlan[]>([]);
  const [emiPayPlan, setEmiPayPlan] = useState<EMIPlan | null>(null);
  const [emiPayAmount, setEmiPayAmount] = useState("");
  const [emiPayTxn, setEmiPayTxn] = useState("");
  const [emiPayScreenshot, setEmiPayScreenshot] = useState("");
  const [emiPayLoading, setEmiPayLoading] = useState(false);
  const [emiPaySuccess, setEmiPaySuccess] = useState("");

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  const [depositUpiRef, setDepositUpiRef] = useState("");
  const [depositShot, setDepositShot] = useState<File | null>(null);
  const [depositShotUrl, setDepositShotUrl] = useState("");
  const [depositSuccess, setDepositSuccess] = useState("");
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("qurux_user");
    const token = localStorage.getItem("qurux_token");
    if (raw && token) {
      try {
        const user = JSON.parse(raw);
        setUserName(user.fullName || "Customer");
        const joined = user.createdAt || user.approvedAt || "";
        if (joined) {
          setIssueDate(new Date(joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
        }
        setLoggedIn(true);
        loadWallet();
      } catch {}
    } else {
      setLoading(false);
    }
  }, []);

  async function loadWallet() {
    setLoading(true);
    try {
      const res = await apiGet<any>("/wallet/me");
      if (res.ok && res.data) {
        setSummary(res.data.summary);
        setStatement(res.data.statement || []);
        setAccountNumber(res.data.wallet?.accountNumber || "");
        setAvailableValue(Number(res.data.summary?.totalBalance || 0));
        if (!issueDate && res.data.wallet?.createdAt) {
          setIssueDate(new Date(res.data.wallet.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
        }
      }
    } catch {}
    // Load EMI plans
    try {
      const emiRes = await apiGet<any[]>("/emi");
      if (emiRes.ok) setEmiPlans(emiRes.data || []);
    } catch {}
    setLoading(false);
  }

  // Upload deposit payment screenshot (proof) -> returns URL
  async function uploadDepositShot(file: File): Promise<string> {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("qurux_token") || "";
    const fd = new FormData();
    fd.append("screenshot", file);
    const r = await fetch(`${base}/api/payments/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || "Screenshot upload failed");
    return data.url || "";
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount < 10) {
      alert("Minimum deposit ₹10 hai.");
      return;
    }
    if (!depositUpiRef.trim()) {
      alert("UPI Transaction ID / UTR daalna zaroori hai (payment ke baad milta hai).");
      return;
    }
    setDepositing(true);
    try {
      // Upload screenshot proof first if selected
      let shotUrl = depositShotUrl;
      if (depositShot && !shotUrl) {
        shotUrl = await uploadDepositShot(depositShot);
        setDepositShotUrl(shotUrl);
      }

      const res = await apiPost<any>("/wallet/deposit", {
        amount,
        reference: depositUpiRef.trim(),
        screenshotUrl: shotUrl,
      });
      if (res.ok) {
        setDepositAmount("");
        setDepositUpiRef("");
        setDepositShot(null);
        setDepositShotUrl("");
        setDepositSuccess(`₹${amount.toLocaleString("en-IN")} deposit request bheja gaya. Admin proof verify karke approve karega — phir balance credit hoga (benefit 30 din baad start).`);
        setTimeout(() => setDepositSuccess(""), 8000);
        loadWallet();
      } else {
        alert(res.message || "Deposit failed.");
      }
    } catch (err: any) {
      alert(err?.message || "Deposit failed. Backend offline.");
    }
    setDepositing(false);
  }

  function downloadStatement() {
    const lines = [
      ["QURUX MAKEOVER & ACADEMY"],
      ["BANK OF BEAUTY (BOB) - ACCOUNT STATEMENT"],
      [],
      ["Customer", userName],
      ["Account", accountNumber],
      [],
      ["DATE", "DESCRIPTION", "CREDIT", "DEBIT", "BALANCE"],
    ];
    statement.forEach((r) => {
      lines.push([r.date, r.description, String(r.credit), String(r.debit), String(r.balance)]);
    });
    lines.push([]);
    lines.push(["AVAILABLE BOB VALUE", "", "", "", String(summary?.totalBalance || 0)]);
    const csv = lines.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `BOB-Statement-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ── Loading ──
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50 to-pink-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
          <p className="mt-4 text-gray-600">Loading BOB Wallet...</p>
        </div>
      </main>
    );
  }

  // ── Not logged in ──
  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-pink-50 to-pink-100 p-6">
        <div className="w-full max-w-lg rounded-[30px] bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-4xl text-pink-600">₹</div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-pink-600">BANK OF BEAUTY</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Login Required</h1>
          <p className="mt-4 text-gray-600 leading-7">
            BOB Dashboard access karne ke liye pehle website pe login karein. Website login hi aapka BOB login hai.
          </p>
          <Link href="/account" className="mt-8 inline-block rounded-full bg-pink-600 px-10 py-4 text-lg font-bold text-white hover:bg-pink-700">
            LOGIN / SIGN UP
          </Link>
        </div>
      </main>
    );
  }

  const tabs: { id: DashboardTab; label: string; icon: string }[] = [
    { id: "SAVING", label: "Saving for Beauty", icon: "💰" },
    { id: "PURCHASES", label: "My Purchases / EMI", icon: "🛒" },
    { id: "PAYMENT", label: "Payment", icon: "💳" },
    { id: "STATEMENT", label: "Statement", icon: "📄" },
    { id: "PROFILE", label: "Profile", icon: "👤" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-pink-100">
      {/* Header */}
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <QuruxLogo heightClass="h-10 w-auto" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-600 md:text-xs">MAKEOVER &amp; ACADEMY</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-gray-600 md:block">Welcome, {userName}</span>
            <Link href="/" className="rounded-full border border-pink-500 px-5 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-600 hover:text-white">HOME</Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[35px] bg-gradient-to-r from-rose-900 via-pink-700 to-pink-500 shadow-2xl">
          <div className="grid items-center md:grid-cols-2">
            {/* Left copy */}
            <div className="px-8 py-14 text-white md:px-14">
              <p className="flex items-center gap-3">
                <QuruxLogo heightClass="h-9 w-auto brightness-0 invert" />
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">MAKEOVER &amp; ACADEMY</span>
              </p>
              <h1 className="mt-4 text-5xl font-bold md:text-6xl">BANK OF BEAUTY</h1>
              <p className="mt-3 text-3xl font-bold tracking-widest text-amber-300">BOB</p>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">Your Beauty Saving account for Qurux services, products and courses.</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-bold backdrop-blur">
                💳 <span>Available BOB Value: ₹{availableValue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Right: premium BOB bank card */}
            <div className="flex justify-center px-6 py-12 md:px-10">
              <div className="relative w-full max-w-[440px]">
                {/* Soft glow */}
                <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-br from-amber-300/60 via-pink-300/50 to-rose-400/60 blur-2xl" />

                {/* Rose-gold gradient frame */}
                <div className="relative rounded-[30px] bg-gradient-to-br from-amber-200 via-rose-300 to-rose-600 p-[2px] shadow-2xl">
                  <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#fff9f2] via-[#ffeef1] to-[#ffdde4] px-6 py-7 md:px-8 md:py-8">
                    {/* decorative circles */}
                    <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border-[12px] border-rose-200/70" />
                    <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full border-[16px] border-amber-200/60" />
                    <div className="pointer-events-none absolute bottom-6 right-8 text-6xl opacity-[0.07]">₹</div>

                    {/* Top row: brand + chip */}
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <QuruxLogo heightClass="h-9 w-auto" />
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-rose-700/80">Makeover &amp; Academy</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-[3px] shadow-inner">
                          <div className="h-full w-full rounded-sm bg-gradient-to-br from-amber-200 to-amber-400">
                            <div className="mx-auto mt-1 h-px w-9 bg-amber-700/40" />
                            <div className="mx-auto mt-1 h-px w-9 bg-amber-700/40" />
                            <div className="mx-auto mt-1 h-px w-9 bg-amber-700/40" />
                          </div>
                        </div>
                        <p className="mt-1.5 text-[9px] font-black tracking-widest text-rose-800">BANK OF BEAUTY</p>
                      </div>
                    </div>

                    {/* Account number */}
                    <p className="relative mt-5 font-mono text-lg font-bold tracking-[0.16em] text-rose-950 md:text-xl">
                      {accountNumber ? accountNumber.replace(/(.{4})/g, "$1 ").trim() : "BOB-•••• •••• ••••"}
                    </p>

                    {/* Bottom row: holder + issue date */}
                    <div className="relative mt-6 flex items-end justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-400">Card Holder</p>
                        <p className="mt-1 break-words text-lg font-black uppercase leading-snug tracking-wide text-rose-950 md:text-xl">
                          {userName || "QURUX CUSTOMER"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-400">Issue Date</p>
                        <p className="mt-1 text-base font-black text-amber-600 md:text-lg">{issueDate || "Member since signup"}</p>
                      </div>
                    </div>

                    {/* Bottom brand strip */}
                    <div className="relative mt-6 flex items-center justify-between gap-3 border-t border-rose-200/70 pt-4">
                      <p className="text-[9px] font-black uppercase leading-relaxed tracking-[0.16em] text-rose-700">
                        Save Today for Future Occasion
                        <span className="mx-1 text-amber-600">✦</span>Festive
                        <span className="mx-1 text-amber-600">✦</span>Event
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-black text-white shadow">₹</span>
                        <span className="text-xs font-black tracking-[0.18em] text-rose-800">BOB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated services collage marquee */}
      <ServiceCollageMarquee />

      {/* Summary Cards */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-6xl rounded-[30px] bg-white p-7 shadow-xl ring-1 ring-pink-100">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">BANK OF BEAUTY</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Welcome, {userName}</h2>
          <p className="mt-1 text-gray-500">Account: {accountNumber || "Auto-creating..."}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-pink-50 p-5">
              <p className="text-xs font-semibold text-gray-500">TOTAL BEAUTY SAVING</p>
              <p className="mt-1 text-2xl font-bold text-pink-600">₹{(summary?.eligibleSaving || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-xs font-semibold text-gray-500">BEAUTY BENEFIT</p>
              <p className="mt-1 text-2xl font-bold text-green-600">₹{(summary?.totalBenefit || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold text-gray-500">AVAILABLE BOB VALUE</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">₹{(summary?.totalBalance || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold transition ${
                  activeTab === tab.id ? "bg-pink-600 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-600 ring-1 ring-pink-100"
                }`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-6xl rounded-[30px] bg-white p-8 shadow-xl ring-1 ring-pink-100">

          {/* ── SAVING TAB ── */}
          {activeTab === "SAVING" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Saving for Beauty</h3>
              <p className="mt-2 text-gray-500">Deposit amount aur apni Beauty Saving grow karein.</p>

              {/* How Benefit Works */}
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-pink-50 to-pink-100 p-6">
                <h4 className="font-bold text-gray-800">How Beauty Benefit Works</h4>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>• Deposit karne ke baad <strong>30 days</strong> par <strong>20% extra</strong> benefit milega</li>
                  <li>• Uske baad har month <strong>additional 10%</strong> milega</li>
                  <li>• Maximum <strong>100% extra</strong> tak benefit milega</li>
                  <li>• 30 days se pehle use karne par benefit nahi milega (30-day rule)</li>
                  <li>• FIFO rule: Sabse pehle jo deposit hua, wo pehle use hoga</li>
                </ul>
              </div>

              {/* Deposit Form — company UPI barcode scan karke pay, proof: txn ID + screenshot */}
              <div className="mt-6 rounded-2xl border border-pink-100 p-6">
                <h4 className="font-bold text-gray-800">Make a Deposit</h4>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                  <li>Neeche <strong>company ka UPI barcode</strong> scan karke (ya UPI ID par) payment karein</li>
                  <li>Payment ke baad <strong>Transaction ID / UTR</strong> daalein</li>
                  <li><strong>Payment screenshot</strong> upload karein (proof)</li>
                  <li>Submit karein — admin verify karke approve karega</li>
                </ol>

                <form onSubmit={handleDeposit} className="mt-5 flex flex-col gap-4">
                  {/* Company UPI Barcode */}
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">SCAN & PAY — QURUX UPI</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/payment/quruxbarcode.png"
                      alt="Qurux UPI barcode"
                      className="mx-auto mt-3 h-48 w-48 rounded-xl bg-white object-contain shadow-sm ring-1 ring-pink-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">UPI ID: <span className="font-mono font-bold text-pink-600">8130231520@hdfc</span></p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <input type="number" min={10} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount (min ₹10)" required
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500" />
                    <button type="submit" disabled={depositing}
                      className="rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700 disabled:opacity-50">
                      {depositing ? "Submitting..." : "SUBMIT DEPOSIT REQUEST"}
                    </button>
                  </div>

                  {/* Transaction ID */}
                  <input type="text" value={depositUpiRef} onChange={(e) => setDepositUpiRef(e.target.value)}
                    placeholder="UPI Transaction ID / UTR * (payment ke baad milta hai)" required
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-500" />

                  {/* Screenshot proof upload */}
                  <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 transition hover:border-pink-300 hover:bg-pink-50">
                    {depositShot ? (
                      <div className="text-center">
                        <span className="text-3xl">✅</span>
                        <p className="mt-2 text-sm font-bold text-green-700">{depositShot.name}</p>
                        <p className="text-xs text-gray-500">Payment screenshot — click to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl">📷</span>
                        <p className="mt-2 text-sm font-bold text-gray-600">Upload Payment Screenshot (proof)</p>
                        <p className="text-xs text-gray-400">JPG / PNG — max 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setDepositShot(f || null);
                        if (f) setDepositShotUrl("");
                      }}
                    />
                  </label>
                </form>
                {depositSuccess && <p className="mt-3 text-sm font-semibold text-green-600">{depositSuccess}</p>}
              </div>

              {/* Pending Deposits (awaiting admin approval) */}
              {summary?.pendingDeposits && summary.pendingDeposits.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-gray-800">⏳ Pending Approval</h4>
                  <p className="mt-1 text-sm text-gray-500">Ye deposit requests admin verification ka wait kar rahe hain.</p>
                  <div className="mt-3 space-y-3">
                    {summary.pendingDeposits.map((pd: any) => (
                      <div key={pd.deposit._id} className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold text-gray-900">₹{pd.deposit.originalAmount.toLocaleString("en-IN")} Deposit Request</p>
                          <p className="text-sm text-amber-700">
                            Status: <span className="font-bold">PENDING</span>
                            {pd.deposit.reference ? ` • Ref: ${pd.deposit.reference}` : ""}
                          </p>
                          {pd.deposit.screenshotUrl && (
                            <a href={pd.deposit.screenshotUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-bold text-blue-600 hover:underline">📷 View proof screenshot</a>
                          )}
                        </div>
                        <span className="rounded-full bg-amber-200 px-4 py-1.5 text-xs font-bold text-amber-800">⏳ AWAITING ADMIN APPROVAL</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Deposits */}
              <div className="mt-6">
                <h4 className="font-bold text-gray-800">Your Deposits</h4>
                {(!summary?.depositDetails || summary.depositDetails.length === 0) ? (
                  <p className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">No deposits yet. Start saving for beauty!</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {summary.depositDetails.map((dd) => {
                      const dep = dd.deposit;
                      const ben = dd.benefit;
                      const remaining = Math.max(0, dep.originalAmount - dep.usedAmount);
                      return (
                        <div key={dep._id} className="rounded-2xl border border-gray-100 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold text-gray-900">₹{dep.originalAmount.toLocaleString("en-IN")} Deposit</p>
                              <p className="text-sm text-gray-500">
                                {new Date(dep.depositDate).toLocaleDateString("en-IN")} • Age: {ben.monthsCompleted} month(s) • Status: {dep.status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Benefit: {ben.milestonePercent}%</p>
                              <p className="font-bold text-green-600">+₹{ben.benefitAmount.toLocaleString("en-IN")}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-4 text-sm">
                            <span className="text-gray-500">Remaining: ₹{remaining.toLocaleString("en-IN")}</span>
                            <span className="font-semibold text-pink-600">BOB Value: ₹{ben.totalValue.toLocaleString("en-IN")}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                            <div className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 transition-all"
                              style={{ width: `${Math.min(100, ben.milestonePercent)}%` }} />
                          </div>
                          {/* Benefit table */}
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs text-gray-500">
                              <thead><tr className="border-b border-gray-100">
                                <th className="py-1 text-left">Age</th><th className="py-1 text-left">Total Extra</th><th className="py-1 text-left">This Month</th><th className="py-1 text-left">BOB Value</th>
                              </tr></thead>
                              <tbody>
                                {[0, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(m => m <= ben.milestonePercent).map((m, i) => {
                                  const prev = m === 20 ? 0 : m - 10;
                                  const added = m === 0 ? 0 : Math.round(dep.originalAmount * (m - prev) / 100);
                                  const totalVal = dep.originalAmount + Math.round(dep.originalAmount * m / 100);
                                  return (
                                    <tr key={m} className="border-b border-gray-50">
                                      <td className="py-1">{m === 0 ? "Deposit" : `${Math.floor(m/10)} month(s)`}</td>
                                      <td className="py-1">{m}%</td>
                                      <td className="py-1 text-green-600">{m === 0 ? "—" : `+₹${added}`}</td>
                                      <td className="py-1 font-semibold">₹{totalVal.toLocaleString("en-IN")}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PURCHASES TAB ── */}
          {activeTab === "PURCHASES" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900">My Purchases / EMI</h3>
              <p className="mt-2 text-gray-500">Aapki purchases aur active EMI plans.</p>

              <div className="mt-6">
                <h4 className="font-bold text-gray-800">Active EMI Plans</h4>
                {emiPlans.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {emiPlans.map((plan) => (
                      <div key={plan._id} className="rounded-2xl border border-gray-100 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{plan.purchaseName || "Qurux Purchase"}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              Total: ₹{plan.totalAmount.toLocaleString("en-IN")} •
                              Paid: ₹{plan.paidAmount.toLocaleString("en-IN")} •
                              Pending: ₹{plan.pendingAmount.toLocaleString("en-IN")}
                            </p>
                          </div>
                          {plan.status === "ACTIVE" && plan.pendingAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => { setEmiPayPlan(plan); setEmiPayAmount(""); setEmiPayTxn(""); setEmiPayScreenshot(""); setEmiPaySuccess(""); }}
                              className="rounded-full bg-pink-600 px-5 py-2 text-sm font-bold text-white hover:bg-pink-700"
                            >
                              PAY EMI
                            </button>
                          )}
                          {plan.status === "COMPLETED" && (
                            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">✓ PAID</span>
                          )}
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${plan.totalAmount > 0 ? Math.min(100, Math.round(((plan.bobPaidAmount + plan.paidAmount) / plan.totalAmount) * 100)) : 0}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {Math.round(((plan.bobPaidAmount + plan.paidAmount) / plan.totalAmount) * 100)}% completed
                        </p>
                        {/* Payment history */}
                        {plan.paymentHistory.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {plan.paymentHistory.map((pay) => (
                              <div key={pay._id} className="flex items-center gap-2 text-xs">
                                <span className={`rounded-full px-2 py-0.5 font-bold ${pay.status === "APPROVED" ? "bg-green-100 text-green-700" : pay.status === "REJECTED" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"}`}>
                                  {pay.status}
                                </span>
                                <span className="font-semibold text-gray-700">₹{pay.amount.toLocaleString("en-IN")}</span>
                                <span className="text-gray-400">{pay.transactionId && `UTR: ${pay.transactionId} • `}{new Date(pay.submittedAt).toLocaleDateString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">No active EMI plans.</p>
                )}
              </div>

              <div className="mt-6">
                <h4 className="font-bold text-gray-800">Purchase History</h4>
                <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
                  Purchase history will appear here after your first BOB checkout.
                </div>
              </div>

              {/* EMI Payment Modal */}
              {emiPayPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-pink-600">EMI PAYMENT</p>
                        <h3 className="mt-1 text-xl font-black text-gray-900">{emiPayPlan.purchaseName}</h3>
                      </div>
                      <button type="button" onClick={() => setEmiPayPlan(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
                    </div>

                    {emiPaySuccess ? (
                      <div className="mt-6 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">✓</div>
                        <p className="mt-4 text-lg font-bold text-green-700">{emiPaySuccess}</p>
                        <p className="mt-2 text-sm text-gray-500">Admin verification ke baad aapka pending amount update ho jayega.</p>
                        <button type="button" onClick={() => { setEmiPayPlan(null); loadWallet(); }} className="mt-6 rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700">CLOSE</button>
                      </div>
                    ) : (
                      <>
                        {/* Summary */}
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-gray-50 p-3 text-center">
                            <p className="text-[10px] font-bold text-gray-400">TOTAL</p>
                            <p className="text-lg font-black text-gray-900">₹{emiPayPlan.totalAmount.toLocaleString("en-IN")}</p>
                          </div>
                          <div className="rounded-2xl bg-green-50 p-3 text-center">
                            <p className="text-[10px] font-bold text-green-700">PAID</p>
                            <p className="text-lg font-black text-green-700">₹{(emiPayPlan.bobPaidAmount + emiPayPlan.paidAmount).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="rounded-2xl bg-orange-50 p-3 text-center">
                            <p className="text-[10px] font-bold text-orange-700">PENDING</p>
                            <p className="text-lg font-black text-orange-700">₹{emiPayPlan.pendingAmount.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="mt-5 rounded-2xl bg-pink-50 p-4">
                          <p className="text-sm font-bold text-gray-700">Pay Amount — weekly jab jitna ho bharo (₹1 se ₹{emiPayPlan.pendingAmount.toLocaleString("en-IN")} tak)</p>
                          <input type="number" min={1} max={emiPayPlan.pendingAmount} value={emiPayAmount} onChange={(e) => setEmiPayAmount(e.target.value)}
                            placeholder={`Jitna bhi paisa ho (₹1 se ₹${emiPayPlan.pendingAmount.toLocaleString("en-IN")})`}
                            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-bold outline-none focus:border-pink-500" />
                        </div>

                        {/* UPI QR */}
                        {emiPayAmount && Number(emiPayAmount) >= 1 && (
                          <div className="mt-4 rounded-2xl border border-gray-100 p-5 text-center">
                            <p className="text-sm font-bold text-gray-700">Scan & Pay — ₹{Number(emiPayAmount).toLocaleString("en-IN")}</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/payment/quruxbarcode.png"
                              alt="Qurux UPI barcode"
                              className="mx-auto mt-3 h-48 w-48 rounded-xl bg-white object-contain shadow-sm ring-1 ring-pink-100"
                            />
                            <p className="mt-2 text-xs text-gray-400">UPI ID: 8130231520@hdfc</p>
                          </div>
                        )}

                        {/* Transaction ID */}
                        <div className="mt-4">
                          <label className="text-sm font-bold text-gray-700">Transaction ID / UTR</label>
                          <input type="text" value={emiPayTxn} onChange={(e) => setEmiPayTxn(e.target.value)}
                            placeholder="Enter UPI transaction ID"
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500" />
                        </div>

                        {/* Screenshot */}
                        <div className="mt-4">
                          <label className="text-sm font-bold text-gray-700">Payment Screenshot (Optional)</label>
                          <input type="text" value={emiPayScreenshot} onChange={(e) => setEmiPayScreenshot(e.target.value)}
                            placeholder="Paste image URL or upload link"
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500" />
                        </div>

                        {/* Submit */}
                        <button
                          type="button"
                          disabled={!emiPayAmount || Number(emiPayAmount) < 1 || !emiPayTxn || emiPayLoading}
                          onClick={async () => {
                            setEmiPayLoading(true);
                            try {
                              const token = localStorage.getItem("qurux_token");
                              const res = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002"}/api/emi/${emiPayPlan._id}/pay`,
                                {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({
                                    amount: Number(emiPayAmount),
                                    transactionId: emiPayTxn,
                                    screenshotUrl: emiPayScreenshot || undefined,
                                  }),
                                }
                              );
                              if (res.ok) {
                                setEmiPaySuccess("Payment submitted! Waiting for admin verification.");
                              } else {
                                const err = await res.json();
                                alert(err.message || "Payment failed.");
                              }
                            } catch {
                              alert("Payment failed. Backend offline.");
                            }
                            setEmiPayLoading(false);
                          }}
                          className="mt-5 w-full rounded-full bg-pink-600 py-4 text-lg font-bold text-white hover:bg-pink-700 disabled:opacity-50"
                        >
                          {emiPayLoading ? "Submitting..." : `SUBMIT PAYMENT — ₹${Number(emiPayAmount || 0).toLocaleString("en-IN")}`}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── PAYMENT TAB ── */}
          {activeTab === "PAYMENT" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Payment</h3>
              <p className="mt-2 text-gray-500">EMI balance weekly pay karein — jab jitna paisa ho, ₹1 se pending tak koi bhi amount (25% down payment ke baad balance 75% EMI pe hota hai).</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-pink-100 p-6 text-center">
                  <div className="text-3xl">🏦</div>
                  <h4 className="mt-3 font-bold text-gray-900">Add Money to BOB</h4>
                  <p className="mt-1 text-sm text-gray-500">Deposit amount for Beauty Saving</p>
                  <button onClick={() => setActiveTab("SAVING")}
                    className="mt-4 rounded-full bg-pink-600 px-6 py-2 text-sm font-bold text-white hover:bg-pink-700">
                    GO TO SAVING →
                  </button>
                </div>
                <div className="rounded-2xl border border-pink-100 p-6 text-center">
                  <div className="text-3xl">💳</div>
                  <h4 className="mt-3 font-bold text-gray-900">Pay EMI / Pending Amount</h4>
                  <p className="mt-1 text-sm text-gray-500">Flexible amount, no fixed EMI</p>
                  <button onClick={() => setActiveTab("PURCHASES")}
                    className="mt-4 rounded-full bg-pink-600 px-6 py-2 text-sm font-bold text-white hover:bg-pink-700">
                    VIEW EMI →
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-yellow-50 p-5">
                <p className="font-bold text-yellow-800">📱 Manual Payment System</p>
                <p className="mt-2 text-sm text-yellow-700">
                  Website par UPI QR code dikh jayega. UPI se payment karein, Transaction ID / UTR enter karein,
                  screenshot upload karein aur submit karein. Payment admin verification ke baad approve hoga.
                </p>
              </div>
            </div>
          )}

          {/* ── STATEMENT TAB ── */}
          {activeTab === "STATEMENT" && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Statement</h3>
                  <p className="mt-2 text-gray-500">Bank-style complete statement.</p>
                </div>
                <button type="button" onClick={downloadStatement}
                  className="rounded-full bg-pink-600 px-5 py-2 text-sm font-bold text-white hover:bg-pink-700">
                  DOWNLOAD CSV
                </button>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-pink-50">
                    <tr>
                      <th className="px-4 py-3 font-bold">DATE</th>
                      <th className="px-4 py-3 font-bold">DESCRIPTION</th>
                      <th className="px-4 py-3 font-bold">CREDIT</th>
                      <th className="px-4 py-3 font-bold">DEBIT</th>
                      <th className="px-4 py-3 font-bold">BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No transactions yet.</td></tr>
                    ) : statement.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3">{row.description}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          {row.credit > 0 ? `₹${row.credit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-red-500">
                          {row.debit > 0 ? `₹${row.debit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-3 font-bold">₹{row.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {statement.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-sm font-semibold text-gray-500">Available BOB Value</p>
                    <p className="mt-1 text-xl font-bold text-green-600">₹{(summary?.totalBalance || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-2xl bg-pink-50 p-4">
                    <p className="text-sm font-semibold text-gray-500">Total Beauty Benefit Earned</p>
                    <p className="mt-1 text-xl font-bold text-pink-600">₹{(summary?.totalBenefit || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === "PROFILE" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Profile</h3>
              <p className="mt-2 text-gray-500">Your BOB account details.</p>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-pink-600 to-pink-500 p-7 text-white shadow-xl">
                <p className="text-sm text-white/80">BOB ACCOUNT NUMBER</p>
                <p className="mt-2 text-3xl font-bold tracking-wider">{accountNumber || "Not Available"}</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-white/70">CUSTOMER NAME</p>
                    <p className="mt-1 font-semibold">{userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">TOTAL DEPOSITS</p>
                    <p className="mt-1 font-semibold">{summary?.depositDetails?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">TOTAL SAVING</p>
                    <p className="mt-1 font-semibold">₹{(summary?.eligibleSaving || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">TOTAL BENEFIT</p>
                    <p className="mt-1 font-semibold">₹{(summary?.totalBenefit || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 p-6">
                <h4 className="font-bold text-gray-800">Account Summary</h4>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deposits</span>
                    <span className="font-bold">{summary?.totalDeposited?.toLocaleString("en-IN") || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Used</span>
                    <span className="font-bold">₹{(summary?.totalUsed || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Eligible Saving</span>
                    <span className="font-bold">₹{(summary?.eligibleSaving || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Beauty Benefit</span>
                    <span className="font-bold text-green-600">₹{(summary?.totalBenefit || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Promotional Balance</span>
                    <span className="font-bold">₹{(summary?.promotionalBalance || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-bold text-gray-800">Available BOB Value</span>
                    <span className="font-bold text-pink-600">₹{(summary?.totalBalance || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <Link href="/account" className="mt-6 inline-block rounded-full border border-gray-300 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">
                Manage Website Account
              </Link>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
