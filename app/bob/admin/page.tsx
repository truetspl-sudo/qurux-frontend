"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getBobPaymentProof,
} from "../../../lib/bob-indexeddb";

type SavingPayment = {
  id: string;
  customerId?: string;
  customerName: string;
  mobile?: string;
  accountNumber?: string;
  amount: number;
  transactionId?: string;
  paymentMethod?: string;
  paymentScreenshotId?: string;
  paymentScreenshotName?: string;
  paymentDate?: string;
  submittedAt?: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";
};

type EMIPayment = {
  id: string;
  planId: string;
  customerId: string;
  customerName: string;
  mobile?: string;
  accountNumber?: string;
  purchaseName: string;
  amount: number;
  transactionId?: string;
  paymentMethod?: string;
  paymentScreenshotId?: string;
  paymentScreenshotName?: string;
  paymentDate?: string;
  submittedAt?: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";
};

export default function BOBAdminPaymentApproval() {

  const [
    savingPayments,
    setSavingPayments,
  ] = useState<SavingPayment[]>([]);

  const [
    emiPayments,
    setEmiPayments,
  ] = useState<EMIPayment[]>([]);

  const [
    tab,
    setTab,
  ] = useState<
    "SAVING" | "EMI"
  >("SAVING");

  const [
    proofUrls,
    setProofUrls,
  ] = useState<
    Record<string, string>
  >({});

  /* =========================
     LOAD PAYMENTS
  ========================= */

  const loadData = () => {

    try {

      const savingRaw =
        localStorage.getItem(
          "bobPayments"
        );

      const emiRaw =
        localStorage.getItem(
          "bobEMIPayments"
        );

      setSavingPayments(
        savingRaw
          ? JSON.parse(
              savingRaw
            )
          : []
      );

      setEmiPayments(
        emiRaw
          ? JSON.parse(
              emiRaw
            )
          : []
      );

    } catch (error) {

      console.error(
        "Admin payment loading error:",
        error
      );

      setSavingPayments([]);
      setEmiPayments([]);
    }
  };

  useEffect(() => {

    loadData();

    const refresh =
      () => loadData();

    window.addEventListener(
      "focus",
      refresh
    );

    window.addEventListener(
      "storage",
      refresh
    );

    return () => {

      window.removeEventListener(
        "focus",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );

    };

  }, []);

  /* =========================
     LOAD SCREENSHOTS
  ========================= */

  useEffect(() => {

    let cancelled = false;

    const loadProofs =
      async () => {

        const ids = [
          ...savingPayments.map(
            (payment) =>
              payment.paymentScreenshotId
          ),

          ...emiPayments.map(
            (payment) =>
              payment.paymentScreenshotId
          ),

        ].filter(
          Boolean
        ) as string[];

        const uniqueIds =
          Array.from(
            new Set(ids)
          );

        const newUrls:
          Record<string, string> =
          {};

        for (
          const id of uniqueIds
        ) {

          try {

            const blob =
              await getBobPaymentProof(
                id
              );

            if (blob) {

              const url =
                URL.createObjectURL(
                  blob
                );

              newUrls[id] =
                url;

            }

          } catch (error) {

            console.error(
              "Screenshot loading error:",
              error
            );

          }

        }

        if (!cancelled) {

          setProofUrls(
            (oldUrls) => {

              Object.values(
                oldUrls
              ).forEach(
                (url) =>
                  URL.revokeObjectURL(
                    url
                  )
              );

              return newUrls;
            }
          );

        } else {

          Object.values(
            newUrls
          ).forEach(
            (url) =>
              URL.revokeObjectURL(
                url
              )
          );

        }

      };

    loadProofs();

    return () => {
      cancelled = true;
    };

  }, [
    savingPayments,
    emiPayments,
  ]);

  /* =========================
     APPROVE SAVING
  ========================= */

  const approveSaving = (
    payment: SavingPayment
  ) => {

    if (
      payment.status !==
      "PENDING"
    ) {
      return;
    }

    if (
      !payment.customerId
    ) {
      alert(
        "Customer ID missing."
      );
      return;
    }

    const raw =
      localStorage.getItem(
        "bobPayments"
      );

    const payments:
      SavingPayment[] =
      raw
        ? JSON.parse(raw)
        : [];

    const updated =
      payments.map(
        (item) =>
          item.id ===
          payment.id
            ? {
                ...item,
                status:
                  "APPROVED" as const,
              }
            : item
      );

    localStorage.setItem(
      "bobPayments",
      JSON.stringify(
        updated
      )
    );

    /* =========================
       CREDIT BOB BALANCE
    ========================= */

    const balanceRaw =
      localStorage.getItem(
        "bobBalances"
      );

    const balances:
      Record<string, number> =
      balanceRaw
        ? JSON.parse(
            balanceRaw
          )
        : {};

    const creditRaw =
      localStorage.getItem(
        "bobBalanceCredits"
      );

    const credits:
      Record<string, boolean> =
      creditRaw
        ? JSON.parse(
            creditRaw
          )
        : {};

    if (
      !credits[payment.id]
    ) {

      const amount =
        Number(
          payment.amount || 0
        );

      balances[
        payment.customerId
      ] =
        Number(
          balances[
            payment.customerId
          ] || 0
        ) + amount;

      credits[
        payment.id
      ] = true;

      localStorage.setItem(
        "bobBalances",
        JSON.stringify(
          balances
        )
      );

      localStorage.setItem(
        "bobBalanceCredits",
        JSON.stringify(
          credits
        )
      );

    }

    setSavingPayments(
      updated
    );

    alert(
      "Saving payment approved."
    );
  };

  /* =========================
     REJECT SAVING
  ========================= */

  const rejectSaving = (
    payment: SavingPayment
  ) => {

    const raw =
      localStorage.getItem(
        "bobPayments"
      );

    const payments:
      SavingPayment[] =
      raw
        ? JSON.parse(raw)
        : [];

    const updated =
      payments.map(
        (item) =>
          item.id ===
          payment.id
            ? {
                ...item,
                status:
                  "REJECTED" as const,
              }
            : item
      );

    localStorage.setItem(
      "bobPayments",
      JSON.stringify(
        updated
      )
    );

    setSavingPayments(
      updated
    );
  };

  /* =========================
     APPROVE EMI
  ========================= */

  const approveEMI = (
    payment: EMIPayment
  ) => {

    if (
      payment.status !==
      "PENDING"
    ) {
      return;
    }

    const paymentsRaw =
      localStorage.getItem(
        "bobEMIPayments"
      );

    const plansRaw =
      localStorage.getItem(
        "bobEMIPlans"
      );

    const payments:
      EMIPayment[] =
      paymentsRaw
        ? JSON.parse(
            paymentsRaw
          )
        : [];

    const plans =
      plansRaw
        ? JSON.parse(
            plansRaw
          )
        : [];

    const planIndex =
      plans.findIndex(
        (item: any) =>
          item.id ===
          payment.planId
      );

    if (
      planIndex === -1
    ) {

      alert(
        "EMI plan nahi mila."
      );

      return;
    }

    const plan =
      plans[
        planIndex
      ];

    const amount =
      Number(
        payment.amount || 0
      );

    const paid =
      Number(
        plan.paidAmount || 0
      );

    const pending =
      Number(
        plan.pendingAmount || 0
      );

    if (
      amount <= 0 ||
      amount > pending
    ) {

      alert(
        "EMI amount invalid hai."
      );

      return;
    }

    /* =========================
       UPDATE EMI
    ========================= */

    const newPaid =
      paid + amount;

    const newPending =
      Math.max(
        0,
        pending - amount
      );

    plans[
      planIndex
    ] = {

      ...plan,

      paidAmount:
        newPaid,

      pendingAmount:
        newPending,

      status:
        newPending <= 0
          ? "COMPLETED"
          : "ACTIVE",

      paymentHistory: [
        ...(plan.paymentHistory ||
          []),

        {
          paymentId:
            payment.id,

          amount:
            amount,

          transactionId:
            payment.transactionId ||
            "",

          date:
            payment.submittedAt ||
            new Date().toISOString(),

          status:
            "APPROVED",
        },
      ],
    };

    /* =========================
       UPDATE PAYMENT STATUS
    ========================= */

    const updatedPayments =
      payments.map(
        (item) =>
          item.id ===
          payment.id
            ? {
                ...item,
                status:
                  "APPROVED" as const,
              }
            : item
      );

    localStorage.setItem(
      "bobEMIPlans",
      JSON.stringify(
        plans
      )
    );

    localStorage.setItem(
      "bobEMIPayments",
      JSON.stringify(
        updatedPayments
      )
    );

    setEmiPayments(
      updatedPayments
    );

    alert(
      "EMI payment approved."
    );
  };

  /* =========================
     REJECT EMI
  ========================= */

  const rejectEMI = (
    payment: EMIPayment
  ) => {

    const raw =
      localStorage.getItem(
        "bobEMIPayments"
      );

    const payments:
      EMIPayment[] =
      raw
        ? JSON.parse(raw)
        : [];

    const updated =
      payments.map(
        (item) =>
          item.id ===
          payment.id
            ? {
                ...item,
                status:
                  "REJECTED" as const,
              }
            : item
      );

    localStorage.setItem(
      "bobEMIPayments",
      JSON.stringify(
        updated
      )
    );

    setEmiPayments(
      updated
    );

  };

  const savingPending =
    savingPayments.filter(
      (payment) =>
        payment.status ===
        "PENDING"
    ).length;

  const emiPending =
    emiPayments.filter(
      (payment) =>
        payment.status ===
        "PENDING"
    ).length;

  /* =========================
     ADMIN UI
  ========================= */

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-gray-950 px-6 py-6 text-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-400">
              QURUX MAKEOVER & ACADEMY
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              BOB ADMIN
            </h1>

            <p className="mt-1 text-gray-300">
              Payment Approval
            </p>

          </div>

          <Link
            href="/bob"
            className="rounded-full border border-white/30 px-5 py-2 font-bold"
          >
            ← BOB DASHBOARD
          </Link>

        </div>

      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* SUMMARY */}

        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-yellow-50 p-6">

            <p className="font-bold text-yellow-700">
              SAVING PENDING
            </p>

            <p className="mt-2 text-4xl font-bold text-yellow-700">
              {savingPending}
            </p>

          </div>

          <div className="rounded-3xl bg-pink-50 p-6">

            <p className="font-bold text-pink-700">
              EMI PENDING
            </p>

            <p className="mt-2 text-4xl font-bold text-pink-700">
              {emiPending}
            </p>

          </div>

          <div className="rounded-3xl bg-purple-50 p-6">

            <p className="font-bold text-purple-700">
              TOTAL PENDING
            </p>

            <p className="mt-2 text-4xl font-bold text-purple-700">
              {savingPending +
                emiPending}
            </p>

          </div>

        </div>

        {/* TABS */}

        <div className="mt-8 flex flex-wrap gap-3">

          <button
            onClick={() =>
              setTab("SAVING")
            }
            className={`rounded-full px-6 py-3 font-bold ${
              tab === "SAVING"
                ? "bg-pink-600 text-white"
                : "bg-white"
            }`}
          >
            BEAUTY SAVING PAYMENTS
            {savingPending > 0
              ? ` (${savingPending})`
              : ""}
          </button>

          <button
            onClick={() =>
              setTab("EMI")
            }
            className={`rounded-full px-6 py-3 font-bold ${
              tab === "EMI"
                ? "bg-pink-600 text-white"
                : "bg-white"
            }`}
          >
            EMI PAYMENTS
            {emiPending > 0
              ? ` (${emiPending})`
              : ""}
          </button>

        </div>

        {/* =========================
            SAVING PAYMENTS
        ========================= */}

        {tab === "SAVING" && (

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

            <h2 className="text-2xl font-bold">
              Beauty Saving / BOB Deposits
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Customer ke payment requests.
            </p>

            <div className="mt-6 space-y-5">

              {savingPayments.length === 0 && (

                <div className="rounded-2xl bg-gray-50 p-10 text-center">
                  No Saving Payment Requests
                </div>

              )}

              {savingPayments.map(
                (payment) => (

                  <article
                    key={
                      payment.id
                    }
                    className="rounded-2xl border p-5"
                  >

                    <div className="grid gap-4 md:grid-cols-5">

                      <div>

                        <p className="text-xs text-gray-500">
                          CUSTOMER
                        </p>

                        <p className="font-bold">
                          {
                            payment.customerName
                          }
                        </p>

                        <p className="text-sm text-gray-500">
                          {
                            payment.mobile ||
                            "—"
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          AMOUNT
                        </p>

                        <p className="text-xl font-bold text-green-600">
                          ₹{Number(
                            payment.amount ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          LAST 4 DIGITS
                        </p>

                        <p className="font-semibold">
                          {
                            payment.transactionId ||
                            "Not Provided"
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          STATUS
                        </p>

                        <p className="font-bold">
                          {
                            payment.status
                          }
                        </p>

                      </div>

                      <div>

                        {payment.status ===
                          "PENDING" && (

                          <div className="grid gap-2">

                            <button
                              onClick={() =>
                                approveSaving(
                                  payment
                                )
                              }
                              className="rounded-full bg-green-600 px-4 py-2 font-bold text-white"
                            >
                              APPROVE
                            </button>

                            <button
                              onClick={() =>
                                rejectSaving(
                                  payment
                                )
                              }
                              className="rounded-full bg-red-600 px-4 py-2 font-bold text-white"
                            >
                              REJECT
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                    {/* SCREENSHOT */}

                    {payment.paymentScreenshotId &&
                      proofUrls[
                        payment.paymentScreenshotId
                      ] && (

                        <div className="mt-5">

                          <p className="mb-2 text-sm font-bold">
                            PAYMENT PROOF
                          </p>

                          <img
                            src={
                              proofUrls[
                                payment.paymentScreenshotId
                              ]
                            }
                            alt="Saving payment proof"
                            className="max-h-80 rounded-2xl border object-contain"
                          />

                        </div>

                      )}

                  </article>

                )
              )}

            </div>

          </section>

        )}

        {/* =========================
            EMI PAYMENTS
        ========================= */}

        {tab === "EMI" && (

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

            <h2 className="text-2xl font-bold">
              Customer EMI Payment Requests
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Service, product aur course EMI payments.
            </p>

            <div className="mt-6 space-y-5">

              {emiPayments.length === 0 && (

                <div className="rounded-2xl bg-gray-50 p-10 text-center">
                  No EMI Payment Requests
                </div>

              )}

              {emiPayments.map(
                (payment) => (

                  <article
                    key={
                      payment.id
                    }
                    className="rounded-2xl border border-pink-100 bg-pink-50 p-5"
                  >

                    <div className="grid gap-4 md:grid-cols-5">

                      <div>

                        <p className="text-xs text-gray-500">
                          CUSTOMER
                        </p>

                        <p className="font-bold">
                          {
                            payment.customerName
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          PURCHASE
                        </p>

                        <p className="font-bold">
                          {
                            payment.purchaseName
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          AMOUNT
                        </p>

                        <p className="text-xl font-bold text-pink-600">
                          ₹{Number(
                            payment.amount ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          LAST 4 DIGITS
                        </p>

                        <p className="font-semibold">
                          {
                            payment.transactionId ||
                            "Not Provided"
                          }
                        </p>

                      </div>

                      <div>

                        {payment.status ===
                          "PENDING" && (

                          <div className="grid gap-2">

                            <button
                              onClick={() =>
                                approveEMI(
                                  payment
                                )
                              }
                              className="rounded-full bg-green-600 px-4 py-2 font-bold text-white"
                            >
                              APPROVE
                            </button>

                            <button
                              onClick={() =>
                                rejectEMI(
                                  payment
                                )
                              }
                              className="rounded-full bg-red-600 px-4 py-2 font-bold text-white"
                            >
                              REJECT
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                    {/* SCREENSHOT */}

                    {payment.paymentScreenshotId &&
                      proofUrls[
                        payment.paymentScreenshotId
                      ] && (

                        <div className="mt-5">

                          <p className="mb-2 text-sm font-bold">
                            PAYMENT PROOF
                          </p>

                          <img
                            src={
                              proofUrls[
                                payment.paymentScreenshotId
                              ]
                            }
                            alt="EMI payment proof"
                            className="max-h-80 rounded-2xl border object-contain"
                          />

                        </div>

                      )}

                  </article>

                )
              )}

            </div>

          </section>

        )}

      </section>

    </main>
  );
}