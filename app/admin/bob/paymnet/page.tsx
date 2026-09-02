"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type BOBApplication = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  accountNumber?: string;
  userId?: string;
  password?: string;
};

type BOBPayment = {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  accountNumber?: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  paymentScreenshot: string;
  paymentScreenshotName: string;
  paymentDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

export default function BOBPaymentPage() {
  const [customer, setCustomer] =
    useState<BOBApplication | null>(null);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("UPI");

  const [transactionId, setTransactionId] =
    useState("");

  const [paymentScreenshot, setPaymentScreenshot] =
    useState("");

  const [paymentScreenshotName, setPaymentScreenshotName] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const cameraInputRef =
    useRef<HTMLInputElement>(null);

  const UPI_ID = "8130231520@hdfc";

  /* =========================
     LOAD LOGGED-IN CUSTOMER
  ========================= */

  useEffect(() => {
    const loggedInId =
      localStorage.getItem(
        "bobLoggedInCustomer"
      );

    if (!loggedInId) {
      return;
    }

    const savedApplications =
      localStorage.getItem(
        "bobApplications"
      );

    if (!savedApplications) {
      return;
    }

    try {
      const applications: BOBApplication[] =
        JSON.parse(savedApplications);

      const foundCustomer =
        applications.find(
          (item) =>
            item.id === loggedInId &&
            item.status === "APPROVED"
        );

      if (foundCustomer) {
        setCustomer(foundCustomer);
      }
    } catch (err) {
      console.error(
        "Customer loading error:",
        err
      );
    }
  }, []);

  /* =========================
     COPY UPI ID
  ========================= */

  const copyUPI = async () => {
    try {
      await navigator.clipboard.writeText(
        UPI_ID
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert(`UPI ID: ${UPI_ID}`);
    }
  };

  /* =========================
     SCREENSHOT UPLOAD / CAMERA
  ========================= */

  const handleScreenshotChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please upload an image file."
      );
      return;
    }

    setError("");

    setPaymentScreenshotName(
      file.name
    );

    const reader = new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setPaymentScreenshot(
          reader.result
        );
      }
    };

    reader.readAsDataURL(file);
  };

  /* =========================
     REMOVE SCREENSHOT
  ========================= */

  const removeScreenshot = () => {
    setPaymentScreenshot("");
    setPaymentScreenshotName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  /* =========================
     SUBMIT PAYMENT
  ========================= */

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!customer) {
      setError(
        "Please login to your BOB account first."
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !amount ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (!transactionId.trim()) {
      setError(
        "Please enter Transaction ID / UTR."
      );
      return;
    }

    if (!paymentScreenshot) {
      setError(
        "Please upload or capture your payment screenshot."
      );
      return;
    }

    const newPayment: BOBPayment = {
      id: `PAY-${Date.now()}`,

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
        transactionId.trim(),

      paymentMethod,

      paymentScreenshot,

      paymentScreenshotName,

      paymentDate:
        new Date().toLocaleDateString(
          "en-IN"
        ),

      status:
        "PENDING",

      submittedAt:
        new Date().toISOString(),
    };

    try {
      const savedPayments =
        localStorage.getItem(
          "bobPayments"
        );

      const payments: BOBPayment[] =
        savedPayments
          ? JSON.parse(savedPayments)
          : [];

      payments.push(newPayment);

      localStorage.setItem(
        "bobPayments",
        JSON.stringify(payments)
      );

      setSubmitted(true);

      setAmount("");
      setTransactionId("");
      setPaymentScreenshot("");
      setPaymentScreenshotName("");

    } catch (err) {
      console.error(
        "Payment saving error:",
        err
      );

      setError(
        "Payment save nahi ho paaya. Please image size chhoti karke try karein."
      );
    }
  };

  /* =========================
     LOGIN REQUIRED
  ========================= */

  if (!customer) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-pink-100">

        <header className="border-b bg-white">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

            <Link
              href="/"
              className="text-xl font-bold text-pink-600"
            >
              QURUX MAKEOVER & ACADEMY
            </Link>

            <Link
              href="/bob"
              className="rounded-full border border-pink-600 px-5 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-600 hover:text-white"
            >
              BACK TO BOB
            </Link>

          </div>

        </header>

        <section className="flex min-h-[70vh] items-center justify-center px-6">

          <div className="w-full max-w-lg rounded-[30px] bg-white p-8 text-center shadow-xl">

            <div className="text-5xl">
              🔐
            </div>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              BOB Login Required
            </h1>

            <p className="mt-3 leading-7 text-gray-500">
              Payment karne ke liye pehle apne
              Bank of Beauty account me login karein.
            </p>

            <Link
              href="/bob"
              className="mt-7 inline-block rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700"
            >
              GO TO BOB LOGIN
            </Link>

          </div>

        </section>

      </main>
    );
  }

  /* =========================
     PAYMENT SUBMITTED
  ========================= */

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-pink-100">

        <header className="border-b bg-white">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

            <Link
              href="/"
              className="text-xl font-bold text-pink-600"
            >
              QURUX MAKEOVER & ACADEMY
            </Link>

            <Link
              href="/bob"
              className="rounded-full border border-pink-600 px-5 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-600 hover:text-white"
            >
              BOB DASHBOARD
            </Link>

          </div>

        </header>

        <section className="flex min-h-[75vh] items-center justify-center px-6">

          <div className="w-full max-w-xl rounded-[35px] bg-white p-10 text-center shadow-2xl">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl text-green-600">
              ✓
            </div>

            <h1 className="mt-7 text-3xl font-bold text-gray-900">
              Payment Submitted
            </h1>

            <p className="mt-4 leading-7 text-gray-600">
              Aapka payment proof successfully
              submit ho gaya hai.
            </p>

            <div className="mt-6 rounded-2xl bg-yellow-50 p-5 text-left">

              <p className="font-bold text-yellow-800">
                Payment Status: PENDING
              </p>

              <p className="mt-2 text-sm leading-6 text-yellow-700">
                Qurux admin aapke payment ko verify
                karega. Approval ke baad payment
                aapke BOB account me update hoga.
              </p>

            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              <Link
                href="/bob"
                className="rounded-full bg-pink-600 px-6 py-3 font-bold text-white hover:bg-pink-700"
              >
                BOB DASHBOARD
              </Link>

              <Link
                href="/"
                className="rounded-full border border-pink-600 px-6 py-3 font-bold text-pink-600 hover:bg-pink-600 hover:text-white"
              >
                HOME
              </Link>

            </div>

          </div>

        </section>

      </main>
    );
  }

  /* =========================
     PAYMENT FORM
  ========================= */

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-pink-100">

      {/* HEADER */}

      <header className="border-b border-pink-100 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-xl font-bold text-pink-600"
          >
            QURUX MAKEOVER & ACADEMY
          </Link>

          <Link
            href="/bob"
            className="rounded-full border border-pink-600 px-5 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-600 hover:text-white"
          >
            BOB DASHBOARD
          </Link>

        </div>

      </header>

      {/* PAGE TITLE */}

      <section className="px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-[35px] bg-gradient-to-r from-pink-600 to-pink-500 p-10 text-white shadow-2xl md:p-14">

            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-100">
              BANK OF BEAUTY
            </p>

            <h1 className="mt-4 text-5xl font-bold">
              Make a Payment
            </h1>

            <p className="mt-4 text-lg text-white/90">
              Add money to your BOB account using UPI.
            </p>

          </div>

        </div>

      </section>

      <section className="px-6 pb-16">

        <div className="mx-auto max-w-6xl">

          {/* CUSTOMER */}

          <div className="rounded-3xl bg-white p-7 shadow-xl">

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
              CUSTOMER
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {customer.fullName}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-400">
                  MOBILE
                </p>

                <p className="mt-1 font-bold">
                  {customer.mobile}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-400">
                  BOB ACCOUNT
                </p>

                <p className="mt-1 font-bold">
                  {customer.accountNumber ||
                    "Not Available"}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-400">
                  PAYMENT METHOD
                </p>

                <p className="mt-1 font-bold">
                  UPI
                </p>

              </div>

            </div>

          </div>

          {/* AMOUNT */}

          <div className="mt-7 rounded-3xl bg-white p-8 shadow-xl">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              PAYMENT AMOUNT
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Enter Amount
            </h2>

            <div className="mt-6 flex overflow-hidden rounded-2xl border-2 border-pink-100 focus-within:border-pink-500">

              <span className="flex items-center px-5 text-2xl font-bold text-pink-600">
                ₹
              </span>

              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="Enter payment amount"
                className="w-full px-4 py-5 text-xl font-semibold outline-none"
              />

            </div>

          </div>

          {/* =========================
              QURUX BARCODE / UPI
          ========================= */}

          <div className="mt-7 rounded-[35px] bg-white p-8 shadow-xl md:p-10">

            <div className="text-center">

              <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                QURUX PAYMENT
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Scan & Pay with UPI
              </h2>

              <p className="mt-3 text-gray-500">
                QR code scan karke payment karein.
              </p>

            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">

              {/* BARCODE */}

              <div className="rounded-3xl bg-pink-50 p-6">

                <div className="rounded-3xl bg-white p-5 text-center shadow-lg">

                  <p className="text-3xl font-black tracking-[0.25em] text-pink-600">
                    QURUX
                  </p>

                  <img
                    src="/payment/quruxbarcode.png"
                    alt="QURUX UPI Payment QR Code"
                    className="mx-auto mt-5 w-full max-w-[430px] rounded-2xl object-contain"
                  />

                  <p className="mt-5 text-sm font-semibold text-gray-500">
                    Scan this QR code to make payment
                  </p>

                </div>

              </div>

              {/* UPI */}

              <div className="rounded-3xl bg-pink-50 p-7">

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                  UPI ID
                </p>

                <div className="mt-3 flex overflow-hidden rounded-2xl border border-pink-200 bg-white">

                  <div className="flex-1 px-5 py-4 font-bold text-gray-800">
                    {UPI_ID}
                  </div>

                  <button
                    type="button"
                    onClick={copyUPI}
                    className="bg-pink-600 px-5 font-bold text-white hover:bg-pink-700"
                  >
                    {copied ? "COPIED" : "COPY"}
                  </button>

                </div>

                <div className="mt-7 rounded-2xl bg-white p-6">

                  <h3 className="text-xl font-bold text-gray-900">
                    Payment Instructions
                  </h3>

                  <ol className="mt-5 space-y-4 text-sm leading-6 text-gray-600">

                    <li>
                      <strong>1.</strong>{" "}
                      Enter the amount above.
                    </li>

                    <li>
                      <strong>2.</strong>{" "}
                      Scan the QURUX QR code.
                    </li>

                    <li>
                      <strong>3.</strong>{" "}
                      Complete payment through your UPI app.
                    </li>

                    <li>
                      <strong>4.</strong>{" "}
                      Enter Transaction ID / UTR below.
                    </li>

                    <li>
                      <strong>5.</strong>{" "}
                      Upload payment screenshot.
                    </li>

                    <li>
                      <strong>6.</strong>{" "}
                      Submit payment for admin verification.
                    </li>

                  </ol>

                </div>

              </div>

            </div>

          </div>

          {/* TRANSACTION */}

          <div className="mt-7 rounded-3xl bg-white p-8 shadow-xl">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              TRANSACTION DETAILS
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Payment Information
            </h2>

            <div className="mt-6">

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Transaction ID / UTR *
              </label>

              <input
                type="text"
                value={transactionId}
                onChange={(e) =>
                  setTransactionId(
                    e.target.value
                  )
                }
                placeholder="Enter Transaction ID / UTR"
                className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                UPI payment complete hone ke baad
                receipt se Transaction ID / UTR enter karein.
              </p>

            </div>

          </div>

          {/* SCREENSHOT */}

          <div className="mt-7 rounded-3xl bg-white p-8 shadow-xl">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              PAYMENT PROOF
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Upload Payment Screenshot
            </h2>

            <div className="mt-7 grid gap-4 md:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="rounded-3xl border-2 border-dashed border-pink-300 bg-pink-50 p-8 text-center hover:border-pink-500 hover:bg-pink-100"
              >

                <div className="text-5xl">
                  📁
                </div>

                <p className="mt-4 text-lg font-bold text-pink-700">
                  Upload Screenshot
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Choose payment screenshot
                  from your device
                </p>

              </button>

              <button
                type="button"
                onClick={() =>
                  cameraInputRef.current?.click()
                }
                className="rounded-3xl border-2 border-dashed border-pink-300 bg-pink-50 p-8 text-center hover:border-pink-500 hover:bg-pink-100"
              >

                <div className="text-5xl">
                  📷
                </div>

                <p className="mt-4 text-lg font-bold text-pink-700">
                  Capture Screenshot
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Take photo using camera
                </p>

              </button>

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={
                handleScreenshotChange
              }
              className="hidden"
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={
                handleScreenshotChange
              }
              className="hidden"
            />

            {paymentScreenshot && (

              <div className="mt-6 rounded-2xl border border-pink-200 bg-gray-50 p-5">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="font-bold text-gray-800">
                      Screenshot Selected
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {paymentScreenshotName}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      removeScreenshot
                    }
                    className="rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-600"
                  >
                    REMOVE
                  </button>

                </div>

                <img
                  src={paymentScreenshot}
                  alt="Payment Screenshot Preview"
                  className="mt-5 max-h-[450px] w-full rounded-2xl object-contain"
                />

              </div>

            )}

          </div>

          {/* ERROR */}

          {error && (

            <div className="mt-7 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
              {error}
            </div>

          )}

          {/* SUBMIT */}

          <button
            type="button"
            onClick={() => {
              const form =
                document.getElementById(
                  "bob-payment-form"
                ) as HTMLFormElement | null;

              if (form) {
                form.requestSubmit();
              }
            }}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-pink-600 to-pink-500 px-8 py-5 text-lg font-bold text-white shadow-xl hover:from-pink-700 hover:to-pink-600"
          >
            🔒 SUBMIT PAYMENT
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Payment submit hone ke baad admin verification
            ke liye pending rahega.
          </p>

          {/* Hidden form submit handler */}

          <form
            id="bob-payment-form"
            onSubmit={handleSubmit}
            className="hidden"
          />

        </div>

      </section>

      <footer className="bg-gray-950 px-6 py-8 text-center text-sm text-white/60">

        <p>
          © {new Date().getFullYear()} QURUX MAKEOVER & ACADEMY
        </p>

        <p className="mt-2 text-white/40">
          BANK OF BEAUTY • PAYMENT
        </p>

      </footer>

    </main>
  );
}