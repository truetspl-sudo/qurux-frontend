"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BOBApplication = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  dob: string;
  address: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  accountNumber?: string;
};

export default function BOBAdminPage() {
  const [applications, setApplications] =
    useState<BOBApplication[]>([]);

  const [selected, setSelected] =
    useState<BOBApplication | null>(null);

  const [accountNumber, setAccountNumber] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  /* =====================================================
     LOAD APPLICATIONS
  ===================================================== */

  async function loadApplications() {
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const response = await fetch(
        `${apiBaseUrl}/api/bob/applications`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend ne valid response nahi diya."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load BOB applications."
        );
      }

      const mappedApplications:
        BOBApplication[] =
        (data.applications || []).map(
          (item: any) => ({
            id: item.id,

            fullName:
              item.full_name || "",

            mobile:
              item.mobile || "",

            email:
              item.email || "",

            dob:
              item.dob || "",

            address:
              item.address || "",

            status:
              item.status,

            submittedAt:
              item.submitted_at,

            accountNumber:
              item.account_number || "",
          })
        );

      setApplications(
        mappedApplications
      );
    } catch (error) {
      console.error(
        "BOB applications load error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "BOB applications load nahi ho paayi."
      );

      setApplications([]);
    }
  }

  /* =====================================================
     OPEN APPLICATION
  ===================================================== */

  function openApplication(
    application: BOBApplication
  ) {
    setSelected(application);

    setAccountNumber(
      application.accountNumber || ""
    );
  }

  /* =====================================================
     APPROVE APPLICATION
     
     ADMIN ONLY ENTERS ACCOUNT NUMBER.
  ===================================================== */

  async function approveApplication() {
    if (!selected) {
      return;
    }

    if (
      !accountNumber.trim()
    ) {
      alert(
        "BOB Account Number enter karein."
      );

      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const response = await fetch(
        `${apiBaseUrl}/api/bob/applications/${encodeURIComponent(
          selected.id
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "APPROVE",

            accountNumber:
              accountNumber.trim(),
          }),
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend ne valid response nahi diya."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "BOB application approve nahi ho paayi."
        );
      }

      const approvedApplication:
        BOBApplication = {
        ...selected,

        status: "APPROVED",

        accountNumber:
          data.application
            ?.account_number ||
          accountNumber.trim(),
      };

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              selected.id
                ? approvedApplication
                : application
          )
      );

      setSelected(
        approvedApplication
      );

      alert(
        data.message ||
          "BOB account successfully approved."
      );
    } catch (error) {
      console.error(
        "BOB approval error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "BOB application approve nahi ho paayi."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     REJECT APPLICATION
  ===================================================== */

  async function rejectApplication() {
    if (!selected) {
      return;
    }

    const confirmReject =
      window.confirm(
        "Kya aap is application ko reject karna chahte hain?"
      );

    if (!confirmReject) {
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const response = await fetch(
        `${apiBaseUrl}/api/bob/applications/${encodeURIComponent(
          selected.id
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "REJECT",
          }),
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Backend ne valid response nahi diya."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to reject BOB application."
        );
      }

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              selected.id
                ? {
                    ...application,
                    status:
                      "REJECTED",
                  }
                : application
          )
      );

      setSelected(null);

      setAccountNumber("");

      alert(
        data.message ||
          "BOB application rejected."
      );
    } catch (error) {
      console.error(
        "BOB rejection error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "BOB application reject nahi ho paayi."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     COUNTS
  ===================================================== */

  const pendingCount =
    applications.filter(
      (item) =>
        item.status === "PENDING"
    ).length;

  const approvedCount =
    applications.filter(
      (item) =>
        item.status === "APPROVED"
    ).length;

  const rejectedCount =
    applications.filter(
      (item) =>
        item.status === "REJECTED"
    ).length;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <header className="bg-gray-950 px-6 py-5 text-white shadow-lg">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-400">
              QURUX ADMIN PANEL
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              BANK OF BEAUTY
            </h1>

          </div>

          <Link
            href="/"
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold transition hover:bg-white hover:text-gray-950"
          >
            Website
          </Link>

        </div>

      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
            BOB MANAGEMENT
          </p>

          <h2 className="mt-2 text-4xl font-bold text-gray-900">
            Account Applications
          </h2>

          <p className="mt-2 text-gray-500">
            Customer applications yahan se manage karein.
          </p>

        </div>

        {/* STATS */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              PENDING
            </p>

            <p className="mt-2 text-4xl font-bold text-orange-500">
              {pendingCount}
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              APPROVED
            </p>

            <p className="mt-2 text-4xl font-bold text-green-600">
              {approvedCount}
            </p>

          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              REJECTED
            </p>

            <p className="mt-2 text-4xl font-bold text-red-500">
              {rejectedCount}
            </p>

          </div>

        </div>

        {/* APPLICATION LIST */}

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h3 className="text-2xl font-bold text-gray-900">
                BOB Applications
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Latest customer applications.
              </p>

            </div>

            <button
              type="button"
              onClick={
                loadApplications
              }
              className="rounded-full border border-pink-600 px-5 py-2 text-sm font-bold text-pink-600 hover:bg-pink-600 hover:text-white"
            >
              REFRESH
            </button>

          </div>

          <div className="mt-6 space-y-4">

            {applications.length ===
            0 ? (

              <div className="rounded-2xl bg-gray-50 p-8 text-center text-gray-500">
                No BOB applications found.
              </div>

            ) : (

              applications.map(
                (application) => (

                  <button
                    key={
                      application.id
                    }
                    type="button"
                    onClick={() =>
                      openApplication(
                        application
                      )
                    }
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left transition hover:border-pink-300 hover:bg-pink-50"
                  >

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div>

                        <p className="text-lg font-bold text-gray-900">
                          {
                            application.fullName
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            application.mobile
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            application.email
                          }
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          Application ID:{" "}
                          {
                            application.id
                          }
                        </p>

                      </div>

                      <div className="text-left md:text-right">

                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${
                            application.status ===
                            "PENDING"
                              ? "bg-orange-100 text-orange-700"
                              : application.status ===
                                "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {
                            application.status
                          }
                        </span>

                        {application.accountNumber && (
                          <p className="mt-2 text-sm font-bold text-pink-600">
                            Account:{" "}
                            {
                              application.accountNumber
                            }
                          </p>
                        )}

                      </div>

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </div>

      </section>

      {/* APPLICATION MODAL */}

      {selected && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white p-7 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                  BOB APPLICATION
                </p>

                <h3 className="mt-2 text-3xl font-bold text-gray-900">
                  {
                    selected.fullName
                  }
                </h3>

              </div>

              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setAccountNumber("");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>

            </div>

            {/* CUSTOMER DETAILS */}

            <div className="mt-7 grid gap-4 md:grid-cols-2">

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-bold text-gray-400">
                  FULL NAME
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {
                    selected.fullName
                  }
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-bold text-gray-400">
                  MOBILE
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {
                    selected.mobile
                  }
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-bold text-gray-400">
                  EMAIL
                </p>

                <p className="mt-1 break-all font-bold text-gray-900">
                  {
                    selected.email
                  }
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-xs font-bold text-gray-400">
                  DATE OF BIRTH
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {
                    selected.dob ||
                    "-"
                  }
                </p>

              </div>

            </div>

            {/* ADDRESS */}

            <div className="mt-4 rounded-2xl bg-gray-50 p-4">

              <p className="text-xs font-bold text-gray-400">
                ADDRESS
              </p>

              <p className="mt-1 leading-6 text-gray-800">
                {
                  selected.address ||
                  "-"
                }
              </p>

            </div>

            {/* ACCOUNT NUMBER */}

            <div className="mt-6 rounded-3xl bg-pink-50 p-6">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                BOB ACCOUNT
              </p>

              <h4 className="mt-2 text-xl font-bold text-gray-900">
                Account Number
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Admin sirf customer ka BOB Account Number dega.
              </p>

              <input
                type="text"
                value={
                  accountNumber
                }
                onChange={(e) =>
                  setAccountNumber(
                    e.target.value
                  )
                }
                disabled={
                  selected.status !==
                    "PENDING" ||
                  loading
                }
                placeholder="Example: BOB100001"
                className="mt-4 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-gray-100"
              />

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Customer ne application ke time
                jo password banaya tha, wahi uska
                BOB login password rahega.
              </p>

            </div>

            {/* ACTIONS */}

            {selected.status ===
            "PENDING" ? (

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    approveApplication
                  }
                  disabled={
                    loading
                  }
                  className="flex-1 rounded-full bg-green-600 px-6 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "PROCESSING..."
                    : "APPROVE ACCOUNT"}
                </button>

                <button
                  type="button"
                  onClick={
                    rejectApplication
                  }
                  disabled={
                    loading
                  }
                  className="flex-1 rounded-full bg-red-500 px-6 py-3.5 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  REJECT APPLICATION
                </button>

              </div>

            ) : (

              <div
                className={`mt-6 rounded-2xl p-5 text-center font-bold ${
                  selected.status ===
                  "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                Application Status:{" "}
                {
                  selected.status
                }

                {selected.accountNumber && (
                  <p className="mt-2">
                    BOB Account Number:{" "}
                    {
                      selected.accountNumber
                    }
                  </p>
                )}

              </div>

            )}

          </div>

        </div>

      )}

    </main>
  );
}