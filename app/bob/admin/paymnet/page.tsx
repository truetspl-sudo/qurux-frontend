"use client";

import { useEffect, useState } from "react";

type BOBEMIPayment = {
  id: string;
  planId: string;
  customerId: string;
  customerName: string;
  mobile?: string;
  accountNumber?: string;
  purchaseName: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  paymentScreenshot?: string;
  paymentScreenshotName?: string;
  paymentDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

type BOBPayment = {
  id: string;
  customerId?: string;
  customerName: string;
  mobile?: string;
  accountNumber?: string;
  amount: number;
  transactionId: string;
  paymentScreenshot?: string;
  paymentScreenshotName?: string;
  paymentDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

export default function BOBPaymentsAdmin() {
  const [payments, setPayments] = useState<BOBPayment[]>([]);
  const [emiPayments, setEmiPayments] =
    useState<BOBEMIPayment[]>([]);
  const [selectedPayment, setSelectedPayment] =
    useState<BOBPayment | null>(null);

  useEffect(() => {
    loadPayments();
    loadEMIPayments();

    const refresh = () => {
      loadPayments();
      loadEMIPayments();
    };

    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const loadEMIPayments = () => {
    try {
      const saved =
        localStorage.getItem("bobEMIPayments");

      setEmiPayments(
        saved ? JSON.parse(saved) : []
      );
    } catch (error) {
      console.error(
        "Unable to load EMI payments:",
        error
      );
      setEmiPayments([]);
    }
  };

  const loadPayments = () => {
    const saved =
      localStorage.getItem("bobPayments");

    if (!saved) {
      setPayments([]);
      return;
    }

    try {
      const data: BOBPayment[] =
        JSON.parse(saved);

      setPayments(data);
    } catch (error) {
      console.error(
        "Unable to load payments:",
        error
      );

      setPayments([]);
    }
  };

  const updateEMIPaymentStatus = (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      const savedPayments =
        localStorage.getItem("bobEMIPayments");

      const savedPlans =
        localStorage.getItem("bobEMIPlans");

      const payments: BOBEMIPayment[] =
        savedPayments
          ? JSON.parse(savedPayments)
          : [];

      const plans =
        savedPlans
          ? JSON.parse(savedPlans)
          : [];

      const payment = payments.find(
        (item) => item.id === id
      );

      if (!payment) return;

      if (
        status === "APPROVED" &&
        payment.status === "APPROVED"
      ) {
        alert("This EMI payment is already approved.");
        return;
      }

      const updatedPayments = payments.map(
        (item) =>
          item.id === id
            ? { ...item, status }
            : item
      );

      localStorage.setItem(
        "bobEMIPayments",
        JSON.stringify(updatedPayments)
      );

      if (status === "APPROVED") {
        const updatedPlans = plans.map(
          (plan: any) => {
            if (plan.id !== payment.planId) {
              return plan;
            }

            const paid =
              Number(plan.paidAmount || 0) +
              Number(payment.amount || 0);

            const pending = Math.max(
              0,
              Number(plan.totalAmount || 0) -
                Number(plan.bobPaidAmount || 0) -
                paid
            );

            return {
              ...plan,
              paidAmount: paid,
              pendingAmount: pending,
              status:
                pending <= 0
                  ? "COMPLETED"
                  : "ACTIVE",
              paymentHistory: [
                ...(plan.paymentHistory || []),
                {
                  paymentId: payment.id,
                  amount: Number(payment.amount) || 0,
                  date: payment.submittedAt,
                  transactionId:
                    payment.transactionId,
                },
              ],
              updatedAt:
                new Date().toISOString(),
            };
          }
        );

        localStorage.setItem(
          "bobEMIPlans",
          JSON.stringify(updatedPlans)
        );
      }

      setEmiPayments(updatedPayments);

      alert(
        status === "APPROVED"
          ? `EMI payment approved. ₹${Number(
              payment.amount
            ).toLocaleString("en-IN")} customer ke pending amount me adjust ho gaya.`
          : "EMI payment rejected."
      );
    } catch (error) {
      console.error(
        "EMI payment approval error:",
        error
      );
      alert("EMI payment update nahi ho paaya.");
    }
  };

  const updatePaymentStatus = (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const saved =
      localStorage.getItem("bobPayments");

    if (!saved) return;

    try {
      const data: BOBPayment[] =
        JSON.parse(saved);

      const payment = data.find(
        (item) => item.id === id
      );

      if (!payment) return;

      // Prevent the same approved payment
      // from being added to the balance twice.
      if (
        status === "APPROVED" &&
        payment.status === "APPROVED"
      ) {
        alert("This payment is already approved.");
        return;
      }

      const updated = data.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item
      );

      localStorage.setItem(
        "bobPayments",
        JSON.stringify(updated)
      );

      // =========================
      // ADD APPROVED PAYMENT
      // TO CUSTOMER BOB BALANCE
      // =========================

      if (
        status === "APPROVED" &&
        payment.customerId
      ) {
        const savedBalances =
          localStorage.getItem("bobBalances");

        const balances: Record<string, number> =
          savedBalances
            ? JSON.parse(savedBalances)
            : {};

        const savedCredits =
          localStorage.getItem("bobBalanceCredits");

        const credits: Record<string, boolean> =
          savedCredits
            ? JSON.parse(savedCredits)
            : {};

        if (!credits[payment.id]) {
          const currentBalance =
            Number(
              balances[payment.customerId] || 0
            );

          balances[payment.customerId] =
            currentBalance +
            Number(payment.amount);

          credits[payment.id] = true;

          localStorage.setItem(
            "bobBalances",
            JSON.stringify(balances)
          );

          localStorage.setItem(
            "bobBalanceCredits",
            JSON.stringify(credits)
          );
        }
      }

      setPayments(updated);
      setSelectedPayment(null);

      alert(
        status === "APPROVED"
          ? `Payment Approved Successfully. ₹${Number(
              payment.amount
            ).toLocaleString("en-IN")} added to customer's BOB balance.`
          : "Payment Rejected"
      );
    } catch (error) {
      console.error(
        "Payment update error:",
        error
      );
    }
  };

  /* =========================
     CHECK / SYNC APPROVED PAYMENTS
     This safely adds only approved payments
     that have not already been credited.
  ========================= */

  const syncApprovedPayments = () => {
    try {
      const savedPayments =
        localStorage.getItem("bobPayments");

      if (!savedPayments) {
        alert("No payments found.");
        return;
      }

      const allPayments: BOBPayment[] =
        JSON.parse(savedPayments);

      const savedBalances =
        localStorage.getItem("bobBalances");

      const balances: Record<string, number> =
        savedBalances
          ? JSON.parse(savedBalances)
          : {};

      const savedCredits =
        localStorage.getItem("bobBalanceCredits");

      const credits: Record<string, boolean> =
        savedCredits
          ? JSON.parse(savedCredits)
          : {};

      let addedTotal = 0;
      let addedCount = 0;

      allPayments.forEach((payment) => {
        if (
          payment.status === "APPROVED" &&
          payment.customerId &&
          !credits[payment.id]
        ) {
          const amount = Number(payment.amount) || 0;

          balances[payment.customerId] =
            Number(balances[payment.customerId] || 0) +
            amount;

          credits[payment.id] = true;
          addedTotal += amount;
          addedCount += 1;
        }
      });

      localStorage.setItem(
        "bobBalances",
        JSON.stringify(balances)
      );

      localStorage.setItem(
        "bobBalanceCredits",
        JSON.stringify(credits)
      );

      if (addedCount === 0) {
        alert(
          "Balance check complete. Koi naya approved payment balance me add nahi hua."
        );
      } else {
        alert(
          `${addedCount} approved payment(s) sync ho gaye. Total ₹${addedTotal.toLocaleString("en-IN")} balance me add hua.`
        );
      }
    } catch (error) {
      console.error(
        "Balance sync error:",
        error
      );

      alert(
        "Balance check/sync nahi ho paaya."
      );
    }
  };

  const pendingCount = payments.filter(
    (payment) =>
      payment.status === "PENDING"
  ).length;

  const approvedCount = payments.filter(
    (payment) =>
      payment.status === "APPROVED"
  ).length;

  const rejectedCount = payments.filter(
    (payment) =>
      payment.status === "REJECTED"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <header className="bg-gray-950 px-6 py-5 text-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
              QURUX MAKEOVER & ACADEMY
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              BOB Payment Approval
            </h1>

          </div>

          <a
            href="/bob/admin"
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold transition hover:bg-white hover:text-gray-950"
          >
            ← BOB ADMIN
          </a>

        </div>

      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* STATS */}

        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-yellow-50 p-6 shadow-sm ring-1 ring-yellow-100">

            <p className="text-sm font-semibold text-yellow-700">
              PENDING PAYMENTS
            </p>

            <p className="mt-2 text-4xl font-bold text-yellow-700">
              {pendingCount}
            </p>

          </div>

          <div className="rounded-3xl bg-green-50 p-6 shadow-sm ring-1 ring-green-100">

            <p className="text-sm font-semibold text-green-700">
              APPROVED PAYMENTS
            </p>

            <p className="mt-2 text-4xl font-bold text-green-700">
              {approvedCount}
            </p>

          </div>

          <div className="rounded-3xl bg-red-50 p-6 shadow-sm ring-1 ring-red-100">

            <p className="text-sm font-semibold text-red-700">
              REJECTED PAYMENTS
            </p>

            <p className="mt-2 text-4xl font-bold text-red-700">
              {rejectedCount}
            </p>

          </div>

        </div>

        {/* EMI PAYMENT LIST */}

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
              EMI PAYMENTS
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Customer EMI Payment Requests
            </h2>
          </div>

          {emiPayments.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-gray-50 p-8 text-center">
              <p className="font-bold text-gray-700">
                No EMI payment requests
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {emiPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-pink-100 bg-pink-50 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-xs text-gray-500">CUSTOMER</p>
                      <p className="font-bold">{payment.customerName}</p>
                      <p className="text-xs text-gray-500">
                        {payment.mobile || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">PURCHASE</p>
                      <p className="font-bold">{payment.purchaseName}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">AMOUNT</p>
                      <p className="text-xl font-bold text-pink-600">
                        ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">TRANSACTION ID</p>
                      <p className="break-all font-semibold">
                        {payment.transactionId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">STATUS</p>
                      <p className="font-bold">{payment.status}</p>
                    </div>
                  </div>

                  {payment.paymentScreenshot && (
                    <div className="mt-4">
                      <img
                        src={payment.paymentScreenshot}
                        alt="EMI payment proof"
                        className="max-h-64 rounded-xl object-contain"
                      />
                    </div>
                  )}

                  {payment.status === "PENDING" && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateEMIPaymentStatus(
                            payment.id,
                            "APPROVED"
                          )
                        }
                        className="rounded-full bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
                      >
                        ✓ APPROVE EMI PAYMENT
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateEMIPaymentStatus(
                            payment.id,
                            "REJECTED"
                          )
                        }
                        className="rounded-full bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
                      >
                        ✕ REJECT EMI PAYMENT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* PAYMENT LIST */}

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                PAYMENT REQUESTS
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Customer Payments
              </h2>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() => {
                  loadPayments();
                  loadEMIPayments();
                }}
                className="rounded-full border border-pink-600 px-5 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-600 hover:text-white"
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                onClick={syncApprovedPayments}
                className="rounded-full bg-pink-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
              >
                ✓ CHECK / SYNC BALANCE
              </button>

            </div>

          </div>

          {payments.length === 0 ? (

            <div className="mt-8 rounded-2xl bg-gray-50 p-10 text-center">

              <div className="text-5xl">
                💳
              </div>

              <h3 className="mt-4 text-xl font-bold text-gray-700">
                No Payment Requests
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Customer payment requests will appear here.
              </p>

            </div>

          ) : (

            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[900px] border-collapse">

                <thead>

                  <tr className="border-b bg-gray-50 text-left">

                    <th className="px-4 py-4 text-sm font-bold">
                      CUSTOMER
                    </th>

                    <th className="px-4 py-4 text-sm font-bold">
                      ACCOUNT
                    </th>

                    <th className="px-4 py-4 text-sm font-bold">
                      AMOUNT
                    </th>

                    <th className="px-4 py-4 text-sm font-bold">
                      TRANSACTION ID
                    </th>

                    <th className="px-4 py-4 text-sm font-bold">
                      STATUS
                    </th>

                    <th className="px-4 py-4 text-sm font-bold">
                      ACTION
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {payments.map((payment) => (

                    <tr
                      key={payment.id}
                      className="border-b last:border-b-0"
                    >

                      <td className="px-4 py-5">

                        <p className="font-bold text-gray-800">
                          {payment.customerName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {payment.mobile || "—"}
                        </p>

                      </td>

                      <td className="px-4 py-5 text-sm font-semibold">
                        {payment.accountNumber || "—"}
                      </td>

                      <td className="px-4 py-5">

                        <p className="font-bold text-pink-600">
                          ₹
                          {Number(
                            payment.amount
                          ).toLocaleString("en-IN")}
                        </p>

                      </td>

                      <td className="px-4 py-5">

                        <p className="text-sm font-semibold text-gray-700">
                          {payment.transactionId}
                        </p>

                      </td>

                      <td className="px-4 py-5">

                        {payment.status ===
                          "PENDING" && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                            PENDING
                          </span>
                        )}

                        {payment.status ===
                          "APPROVED" && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            APPROVED
                          </span>
                        )}

                        {payment.status ===
                          "REJECTED" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            REJECTED
                          </span>
                        )}

                      </td>

                      <td className="px-4 py-5">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPayment(
                              payment
                            )
                          }
                          className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-600"
                        >
                          VIEW
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

      {/* PAYMENT DETAILS MODAL */}

      {selectedPayment && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                  PAYMENT DETAILS
                </p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {selectedPayment.customerName}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>

            </div>

            {/* DETAILS */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-400">
                  CUSTOMER
                </p>

                <p className="mt-1 font-bold text-gray-800">
                  {selectedPayment.customerName}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-400">
                  MOBILE
                </p>

                <p className="mt-1 font-bold text-gray-800">
                  {selectedPayment.mobile || "—"}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-semibold text-gray-400">
                  BOB ACCOUNT
                </p>

                <p className="mt-1 font-bold text-gray-800">
                  {selectedPayment.accountNumber || "—"}
                </p>

              </div>

              <div className="rounded-2xl bg-pink-50 p-4">

                <p className="text-xs font-semibold text-pink-500">
                  AMOUNT
                </p>

                <p className="mt-1 text-2xl font-bold text-pink-600">
                  ₹
                  {Number(
                    selectedPayment.amount
                  ).toLocaleString("en-IN")}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">

                <p className="text-xs font-semibold text-gray-400">
                  TRANSACTION ID / UTR
                </p>

                <p className="mt-1 font-bold text-gray-800">
                  {selectedPayment.transactionId}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">

                <p className="text-xs font-semibold text-gray-400">
                  PAYMENT DATE
                </p>

                <p className="mt-1 font-bold text-gray-800">
                  {selectedPayment.paymentDate}
                </p>

              </div>

            </div>

            {/* SCREENSHOT */}

            <div className="mt-6">

              <p className="text-sm font-bold text-gray-700">
                PAYMENT SCREENSHOT
              </p>

              {selectedPayment.paymentScreenshot ? (

                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">

                  <img
                    src={
                      selectedPayment.paymentScreenshot
                    }
                    alt="Payment proof"
                    className="max-h-[500px] w-full object-contain"
                  />

                </div>

              ) : (

                <div className="mt-3 rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No payment screenshot uploaded.
                </div>

              )}

              {selectedPayment.paymentScreenshotName && (

                <p className="mt-2 text-xs text-gray-500">
                  File:{" "}
                  {selectedPayment.paymentScreenshotName}
                </p>

              )}

            </div>

            {/* ACTIONS */}

            {selectedPayment.status ===
              "PENDING" && (

              <div className="mt-8 grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    updatePaymentStatus(
                      selectedPayment.id,
                      "APPROVED"
                    )
                  }
                  className="rounded-full bg-green-600 px-6 py-3.5 font-bold text-white transition hover:bg-green-700"
                >
                  ✓ APPROVE PAYMENT
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updatePaymentStatus(
                      selectedPayment.id,
                      "REJECTED"
                    )
                  }
                  className="rounded-full bg-red-600 px-6 py-3.5 font-bold text-white transition hover:bg-red-700"
                >
                  ✕ REJECT PAYMENT
                </button>

              </div>

            )}

            {selectedPayment.status !==
              "PENDING" && (

              <div className="mt-8 rounded-2xl bg-gray-50 p-5 text-center">

                <p className="font-bold text-gray-700">
                  Payment Status:
                </p>

                <p className="mt-1 font-bold">
                  {selectedPayment.status}
                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </main>
  );
}
