"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  prepareBobPaymentProof,
  saveBobPaymentProof,
} from "../../../lib/bob-indexeddb";

type Customer = {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  accountNumber?: string;
};

const UPI_ID = "8130231520@hdfc";

const UPI_QR =
  "https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=upi%3A%2F%2Fpay%3Fpa%3D8130231520%2540hdfc%26pn%3DQURUX%2520MAKEOVER%2520%2526%2520ACADEMY%26cu%3DINR";

/*
  IMPORTANT:
  Screenshot kabhi bhi localStorage me save nahi hoga.
  Sirf IndexedDB me save hoga.

  Purane records me agar screenshot/base64 localStorage
  me pada hua hai, save se pehle us heavy data ko remove
  karke record ko compact banaya jayega.
*/

function readLocalArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function compactOldPaymentRecord(record: any) {
  const clean = { ...record };

  const heavyKeys = [
    "screenshot",
    "paymentScreenshot",
    "screenshotData",
    "paymentProof",
    "proof",
    "proofData",
    "image",
    "imageData",
    "base64",
    "fileData",
  ];

  for (const key of heavyKeys) {
    if (
      typeof clean[key] === "string" &&
      clean[key].length > 1000
    ) {
      delete clean[key];
    }
  }

  return clean;
}

function compactPaymentList(list: any[]) {
  return list.map(compactOldPaymentRecord);
}

/*
  localStorage quota safe writer.
  Pehle compact records save karta hai.
  Agar quota fir bhi aaye, existing heavy records ko
  aur aggressively clean karke dobara try karta hai.
*/
function savePaymentListSafely(
  key: string,
  list: any[]
): boolean {
  const compacted = compactPaymentList(list);

  try {
    localStorage.setItem(
      key,
      JSON.stringify(compacted)
    );
    return true;
  } catch (firstError) {
    console.warn(
      `Storage quota issue on ${key}. Cleaning old heavy payment data.`,
      firstError
    );
  }

  /*
    Emergency cleanup:
    Screenshot/base64/file data ke saare common fields
    remove kar do. Payment details safe rahengi.
  */
  const emergencyClean = compacted.map(
    (record: any) => {
      const clean: any = {};

      for (const [keyName, value] of Object.entries(
        record
      )) {
        if (
          typeof value === "string" &&
          value.length > 5000
        ) {
          continue;
        }

        clean[keyName] = value;
      }

      return clean;
    }
  );

  try {
    localStorage.removeItem(key);

    localStorage.setItem(
      key,
      JSON.stringify(emergencyClean)
    );

    return true;
  } catch (secondError) {
    console.error(
      `Could not save ${key} even after cleanup.`,
      secondError
    );
    return false;
  }
}

export default function BOBPaymentPage() {
  const params = useSearchParams();

  const isEMI =
    params.get("type") === "emi";

  const planId =
    params.get("planId");

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [plan, setPlan] =
    useState<any>(null);

  const [amount, setAmount] =
    useState("");

  const [utr, setUtr] =
    useState("");

  const [proofFile, setProofFile] =
    useState<File | null>(null);

  const [proofPreview, setProofPreview] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [bobSavingBalance, setBobSavingBalance] =
    useState(0);

  const [beautyBenefitBalance, setBeautyBenefitBalance] =
    useState(0);

  const [bobTotalValue, setBobTotalValue] =
    useState(0);

  const fileRef =
    useRef<HTMLInputElement>(null);

  const cameraRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loggedInId =
      localStorage.getItem(
        "bobLoggedInCustomer"
      );

    const raw =
      localStorage.getItem(
        "bobApplications"
      );

    if (!loggedInId || !raw) return;

    try {
      const applications =
        JSON.parse(raw);

      const found =
        applications.find(
          (item: Customer) =>
            item.id === loggedInId &&
            item.status === "APPROVED"
        );

      if (found) {
        setCustomer(found);
        loadBOBBalances(found.id);
      }
    } catch (error) {
      console.error(
        "Customer loading error:",
        error
      );
    }
  }, []);

  useEffect(() => {
    if (!isEMI || !planId) {
      setPlan(null);
      return;
    }

    try {
      const plans =
        readLocalArray("bobEMIPlans");

      const found =
        plans.find(
          (item: any) =>
            item.id === planId
        );

      setPlan(found || null);
    } catch (error) {
      console.error(
        "EMI plan loading error:",
        error
      );

      setPlan(null);
    }
  }, [isEMI, planId]);

  const daysBetween = (from: string) => {
    const start = new Date(from).getTime();
    const end = Date.now();

    if (!Number.isFinite(start)) return 0;

    return Math.max(
      0,
      Math.floor(
        (end - start) / (1000 * 60 * 60 * 24)
      )
    );
  };

  const getDepositBenefit = (deposit: any) => {
    if (!deposit.benefitEnabled) return 0;

    const ageDays = daysBetween(deposit.depositDate);

    if (ageDays < 30) return 0;

    const completedMonths = Math.floor(ageDays / 30);

    const milestone = Math.min(
      100,
      20 + Math.max(0, completedMonths - 1) * 10
    );

    return Math.round(
      Number(deposit.originalAmount || 0) *
        milestone /
        100
    );
  };

  const loadBOBBalances = (customerId: string) => {
    try {
      const payments = readLocalArray("bobPayments");
      const savedDeposits = readLocalArray("bobDeposits");

      const deposits = [...savedDeposits];

      payments
        .filter(
          (payment: any) =>
            payment.customerId === customerId &&
            payment.status === "APPROVED"
        )
        .forEach((payment: any) => {
          const exists = deposits.some(
            (deposit: any) =>
              deposit.sourcePaymentId === payment.id
          );

          if (!exists) {
            deposits.push({
              id: `DEP-${payment.id}`,
              customerId,
              sourcePaymentId: payment.id,
              originalAmount: Number(payment.amount) || 0,
              depositDate:
                payment.submittedAt ||
                new Date().toISOString(),
              usedAmount: 0,
              usedBenefitAmount: 0,
              benefitEnabled: true,
            });
          }
        });

      const customerDeposits = deposits.filter(
        (deposit: any) =>
          deposit.customerId === customerId
      );

      const saving = customerDeposits.reduce(
        (sum: number, deposit: any) =>
          sum +
          Math.max(
            0,
            Number(deposit.originalAmount || 0) -
              Number(deposit.usedAmount || 0)
          ),
        0
      );

      const benefit = customerDeposits.reduce(
        (sum: number, deposit: any) =>
          sum +
          Math.max(
            0,
            getDepositBenefit(deposit) -
              Number(deposit.usedBenefitAmount || 0)
          ),
        0
      );

      setBobSavingBalance(saving);
      setBeautyBenefitBalance(benefit);
      setBobTotalValue(saving + benefit);
    } catch (error) {
      console.error("BOB balance loading error:", error);
      setBobSavingBalance(0);
      setBeautyBenefitBalance(0);
      setBobTotalValue(0);
    }
  };

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Sirf image screenshot upload karein."
      );
      return;
    }

    setError("");

    if (proofPreview) {
      URL.revokeObjectURL(
        proofPreview
      );
    }

    setProofFile(file);

    setProofPreview(
      URL.createObjectURL(file)
    );
  };

  const removeFile = () => {
    if (proofPreview) {
      URL.revokeObjectURL(
        proofPreview
      );
    }

    setProofFile(null);
    setProofPreview("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    if (cameraRef.current) {
      cameraRef.current.value = "";
    }
  };

  const submitPayment = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!customer) {
      setError(
        "BOB customer login nahi mila."
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setError(
        "Valid payment amount enter karein."
      );
      return;
    }

    /*
      Transaction ID optional hai.
      Agar dala hai to maximum 4 digits.
    */
    if (utr.length > 4) {
      setError(
        "Transaction ID ke sirf last 4 digits enter karein."
      );
      return;
    }

    if (!proofFile) {
      setError(
        "Payment screenshot upload karein."
      );
      return;
    }

    if (isEMI) {
      if (!plan) {
        setError(
          "EMI purchase nahi mili."
        );
        return;
      }

      const pendingAmount =
        Number(
          plan.pendingAmount || 0
        );

      if (
        numericAmount < 10 ||
        numericAmount > pendingAmount
      ) {
        setError(
          `EMI payment ₹10 se ₹${pendingAmount.toLocaleString(
            "en-IN"
          )} ke beech honi chahiye.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      /*
        STEP 1:
        Screenshot ko compress karke IndexedDB me save karo.
      */
      const proofId =
        `${
          isEMI
            ? "EMIPROOF"
            : "BOBPROOF"
        }-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const proofBlob =
        await prepareBobPaymentProof(
          proofFile
        );

      await saveBobPaymentProof(
        proofId,
        proofBlob
      );

      /*
        STEP 2:
        Optional transaction ID ke sirf last 4 digits.
      */
      const lastFourDigits =
        utr.trim()
          ? utr.trim().slice(-4)
          : "";

      /*
        STEP 3:
        EMI payment.
        IMPORTANT:
        Purane bobEMIPayments ko read karke compact karo.
        Screenshot ka base64 localStorage me nahi rahega.
      */
      if (isEMI) {
        const payments =
          readLocalArray(
            "bobEMIPayments"
          );

        const newPayment = {
          id:
            `EMIPAY-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,

          planId:
            plan.id,

          customerId:
            customer.id,

          customerName:
            customer.fullName,

          mobile:
            customer.mobile,

          accountNumber:
            customer.accountNumber,

          purchaseName:
            plan.purchaseName ||
            "Qurux Purchase",

          amount:
            numericAmount,

          transactionId:
            lastFourDigits,

          paymentMethod:
            "UPI",

          /*
            Yahan sirf ID hai.
            Actual image IndexedDB me hai.
          */
          paymentScreenshotId:
            proofId,

          paymentScreenshotName:
            proofFile.name,

          paymentDate:
            new Date().toLocaleDateString(
              "en-IN"
            ),

          status:
            "PENDING",

          submittedAt:
            new Date().toISOString(),
        };

        const success =
          savePaymentListSafely(
            "bobEMIPayments",
            [
              ...payments,
              newPayment,
            ]
          );

        if (!success) {
          setError(
            "EMI payment save nahi ho paaya. Purana storage data bahut zyada hai."
          );
          return;
        }
      }

      /*
        STEP 4:
        Beauty Saving / Add Money.
      */
      else {
        const payments =
          readLocalArray(
            "bobPayments"
          );

        const newPayment = {
          id:
            `PAY-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,

          customerId:
            customer.id,

          customerName:
            customer.fullName,

          mobile:
            customer.mobile,

          accountNumber:
            customer.accountNumber,

          amount:
            numericAmount,

          transactionId:
            lastFourDigits,

          paymentMethod:
            "UPI",

          paymentScreenshotId:
            proofId,

          paymentScreenshotName:
            proofFile.name,

          paymentDate:
            new Date().toLocaleDateString(
              "en-IN"
            ),

          status:
            "PENDING",

          submittedAt:
            new Date().toISOString(),
        };

        const success =
          savePaymentListSafely(
            "bobPayments",
            [
              ...payments,
              newPayment,
            ]
          );

        if (!success) {
          setError(
            "Payment save nahi ho paaya. Purana storage data bahut zyada hai."
          );
          return;
        }
      }

      /*
        SUCCESS
      */
      setSubmitted(true);

    } catch (error: any) {
      console.error(
        "Payment submit error:",
        error
      );

      setError(
        error?.message ||
          "Payment save nahi ho paaya."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pink-50 p-6">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            BOB Login Required
          </h1>

          <p className="mt-3 text-gray-500">
            Payment ke liye BOB account me login karein.
          </p>

          <Link
            href="/bob"
            className="mt-6 inline-block rounded-full bg-pink-600 px-7 py-3 font-bold text-white"
          >
            GO TO BOB
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-pink-50 p-6">
        <div className="w-full max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="text-6xl text-green-600">
            ✓
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            Payment Submitted
          </h1>

          <p className="mt-4 text-gray-600">
            Aapka payment proof successfully submit ho gaya hai.
          </p>

          <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-left">
            <p className="font-bold text-yellow-700">
              PAYMENT STATUS: PENDING
            </p>

            <p className="mt-2 text-sm leading-6 text-yellow-700">
              Admin payment screenshot verify karega.
              Approval ke baad payment BOB account / EMI plan me update hoga.
            </p>
          </div>

          <Link
            href="/bob"
            className="mt-7 block rounded-full bg-pink-600 px-6 py-3 font-bold text-white"
          >
            BACK TO BOB DASHBOARD
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-pink-100">

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-bold text-pink-600"
          >
            QURUX MAKEOVER & ACADEMY
          </Link>

          <Link
            href="/bob"
            className="rounded-full border border-pink-600 px-5 py-2 font-semibold text-pink-600"
          >
            BOB DASHBOARD
          </Link>
        </div>
      </header>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-4xl">

          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              BANK OF BEAUTY
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              {isEMI
                ? "Make EMI Payment"
                : "Make a Payment"}
            </h1>

            <p className="mt-3 text-gray-500">
              {isEMI
                ? "Pay any amount from ₹10 up to your pending EMI amount."
                : "Add money to your BOB account using UPI."}
            </p>
          </div>

          <div className="mt-8 rounded-3xl bg-gradient-to-r from-pink-600 to-pink-500 p-6 text-white shadow-xl">
            <p className="text-xs text-white/70">
              CUSTOMER
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {customer.fullName}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/70">
                  MOBILE
                </p>
                <p className="font-semibold">
                  {customer.mobile}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/70">
                  BOB ACCOUNT
                </p>
                <p className="font-semibold">
                  {customer.accountNumber || "—"}
                </p>
              </div>
            </div>
          </div>

          {isEMI && plan && (
            <div className="mt-7 rounded-3xl bg-pink-50 p-6 ring-1 ring-pink-100">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">
                EMI PURCHASE
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {plan.purchaseName}
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-gray-500">
                    TOTAL
                  </p>
                  <p className="font-bold">
                    ₹{Number(
                      plan.totalAmount || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-gray-500">
                    PAID
                  </p>
                  <p className="font-bold text-green-600">
                    ₹{Number(
                      plan.paidAmount || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-gray-500">
                    PENDING
                  </p>
                  <p className="font-bold text-pink-600">
                    ₹{Number(
                      plan.pendingAmount || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

              </div>
            </div>
          )}

          <form
            onSubmit={submitPayment}
            className="mt-7 rounded-3xl bg-white p-8 shadow-xl"
          >

            {/* BOB BALANCE / BEAUTY BENEFITS SUMMARY
                Existing QR/payment flow intentionally unchanged. */}
            <div className="mb-7 rounded-3xl bg-pink-50 p-5 ring-1 ring-pink-100">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                BOB AVAILABLE VALUE
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-gray-500">
                    SAVING AVAILABLE
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    ₹{bobSavingBalance.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-pink-600">
                    BEAUTY BENEFITS AVAILABLE
                  </p>
                  <p className="mt-1 text-2xl font-bold text-pink-600">
                    ₹{beautyBenefitBalance.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-green-700">
                    TOTAL BOB VALUE
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-700">
                    ₹{bobTotalValue.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                Beauty Benefits Saving Statement ka hissa nahi hain.
                Ye sirf BOB payment eligibility/value ke liye alag se maintain hote hain.
              </p>
            </div>

            <label className="block text-sm font-bold">
              {isEMI
                ? "EMI Payment Amount"
                : "Payment Amount"}
            </label>

            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-pink-600">
                ₹
              </span>

              <input
                type="number"
                min={isEMI ? 10 : 1}
                max={
                  isEMI && plan
                    ? Number(plan.pendingAmount)
                    : undefined
                }
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                required
                placeholder="Enter amount"
                className="w-full rounded-2xl border px-4 py-4 pl-10 text-lg outline-none focus:border-pink-500"
              />
            </div>

            <div className="mt-8">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                UPI PAYMENT
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Scan & Pay with UPI
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                QR code scan karke payment karein.
              </p>

              <div className="mt-5 grid gap-6 md:grid-cols-2">

                <div className="rounded-3xl bg-pink-50 p-6 text-center">

                  <p className="font-bold">
                    QURUX
                  </p>

                  <img
                    src={UPI_QR}
                    alt="QURUX UPI QR Code"
                    className="mx-auto mt-4 w-64 rounded-2xl bg-white p-4"
                  />

                  <p className="mt-4 font-bold text-pink-600">
                    {UPI_ID}
                  </p>

                </div>

                <div className="rounded-3xl border p-6">

                  <p className="text-sm font-bold">
                    UPI ID
                  </p>

                  <div className="mt-3 flex gap-3 rounded-2xl bg-pink-50 p-4">

                    <span className="break-all font-bold">
                      {UPI_ID}
                    </span>

                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          UPI_ID
                        );

                        alert(
                          "UPI ID copied."
                        );
                      }}
                      className="rounded-full bg-pink-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      COPY
                    </button>

                  </div>

                  <ol className="mt-5 space-y-2 text-sm text-gray-600">
                    <li>
                      1. Amount enter karein.
                    </li>

                    <li>
                      2. QR scan karein.
                    </li>

                    <li>
                      3. UPI payment complete karein.
                    </li>

                    <li>
                      4. Transaction ID available ho to sirf last 4 digits enter karein.
                    </li>

                    <li>
                      5. Transaction ID nahi hai to blank chhod sakte hain.
                    </li>

                    <li>
                      6. Payment screenshot upload karein.
                    </li>
                  </ol>

                </div>

              </div>
            </div>

            <div className="mt-8">

              <label className="block text-sm font-bold">
                Transaction ID – Last 4 Digits
                <span className="ml-2 font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={utr}
                onChange={(e) => {
                  const value =
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 4);

                  setUtr(value);
                }}
                placeholder="Enter last 4 digits only"
                className="mt-2 w-full rounded-2xl border px-4 py-4 outline-none focus:border-pink-500"
              />

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Transaction ID available ho to sirf uske last 4 digits enter karein.
                Ye field blank bhi chhod sakte hain.
              </p>

            </div>

            <div className="mt-8">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                PAYMENT PROOF
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    fileRef.current?.click()
                  }
                  className="rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-6"
                >
                  <div className="text-4xl">
                    📁
                  </div>

                  <p className="mt-2 font-bold">
                    Upload Screenshot
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    cameraRef.current?.click()
                  }
                  className="rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-6"
                >
                  <div className="text-4xl">
                    📷
                  </div>

                  <p className="mt-2 font-bold">
                    Capture Screenshot
                  </p>
                </button>

              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />

              {proofPreview && (
                <div className="mt-5 rounded-2xl border p-4">

                  <div className="flex items-center justify-between">

                    <p className="font-bold">
                      Payment Proof
                    </p>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-600"
                    >
                      REMOVE
                    </button>

                  </div>

                  <img
                    src={proofPreview}
                    alt="Payment proof preview"
                    className="mt-4 max-h-96 w-full rounded-xl object-contain"
                  />

                </div>
              )}

            </div>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-7 w-full rounded-full bg-pink-600 px-6 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "SAVING PAYMENT..."
                : "🔒 SUBMIT PAYMENT"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-gray-400">
              Payment submit hone ke baad Admin verification ke liye PENDING rahega.
            </p>

          </form>
        </div>
      </section>
    </main>
  );
}
