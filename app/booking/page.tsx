"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { services } from "@/components/book/services";
import { apiPost, getLoggedInUser } from "@/lib/api";
import { createBOBEMIPlan } from "@/lib/bob-emi";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import PaymentForm from "@/components/PaymentForm";

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" /></div>}>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("service");
  const paymentParam = searchParams.get("payment");

  const selectedService = services.find(
    (service) => service.slug === slug
  );

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    location: "",
    payment:
      paymentParam === "bob"
        ? "Pay from BOB"
        : paymentParam === "emi"
          ? "No Cost EMI"
          : paymentParam === "full"
            ? "Full Payment"
            : "",
  });

  const [timeSlot, setTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [selectedSalon, setSelectedSalon] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ bookingId: string; amount: number; serviceName: string } | null>(null);
  const [bobBalance, setBobBalance] = useState(0);
  const [bobSavingBalance, setBobSavingBalance] = useState(0);
  const [beautyBenefitBalance, setBeautyBenefitBalance] = useState(0);
  const [bobError, setBobError] = useState("");
  const [bobRemainingPayment, setBobRemainingPayment] =
    useState("Full Payment");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "payment") {
      setBobError("");
    }
  }


  const getBobCustomer = () => {
    // Use website login (qurux_user) to identify the customer
    const websiteUserRaw = localStorage.getItem("qurux_user");
    const savedApplications = localStorage.getItem("bobApplications");

    if (!websiteUserRaw || !savedApplications) return null;

    try {
      const websiteUser = JSON.parse(websiteUserRaw);
      if (!websiteUser || !websiteUser.id) return null;

      const applications = JSON.parse(savedApplications);
      const bobApp = applications.find(
        (item: any) =>
          String(item.customerId) === String(websiteUser.id) &&
          item.status === "APPROVED"
      );

      if (bobApp) {
        // Return customer info merged from website login + BOB app
        return {
          id: websiteUser.id,
          fullName: websiteUser.fullName,
          mobile: websiteUser.mobile,
          email: websiteUser.email,
          accountNumber: bobApp.accountNumber,
        };
      }

      return null;
    } catch {
      return null;
    }
  };

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
    if (!deposit.benefitEnabled) {
      return 0;
    }

    const ageDays =
      daysBetween(
        deposit.depositDate
      );

    if (ageDays < 30) {
      return 0;
    }

    const completedMonths =
      Math.floor(
        ageDays / 30
      );

    const milestone =
      Math.min(
        100,
        20 +
          Math.max(
            0,
            completedMonths - 1
          ) *
            10
      );

    return Math.round(
      Number(
        deposit.originalAmount || 0
      ) *
        milestone /
        100
    );
  };

  const getBOBValueBreakdown = (
    customerId: string
  ) => {
    try {
      const paymentsData =
        localStorage.getItem(
          "bobPayments"
        );

      const depositsData =
        localStorage.getItem(
          "bobDeposits"
        );

      const payments =
        paymentsData
          ? JSON.parse(
              paymentsData
            )
          : [];

      const deposits =
        depositsData
          ? JSON.parse(
              depositsData
            )
          : [];

      const customerPayments =
        payments.filter(
          (payment: any) =>
            payment.customerId ===
              customerId &&
            payment.status ===
              "APPROVED"
        );

      let changed = false;

      customerPayments.forEach(
        (payment: any) => {
          const exists =
            deposits.some(
              (deposit: any) =>
                deposit.sourcePaymentId ===
                payment.id
            );

          if (!exists) {
            deposits.push({
              id:
                `DEP-${payment.id}`,

              customerId,

              sourcePaymentId:
                payment.id,

              originalAmount:
                Number(
                  payment.amount
                ) || 0,

              depositDate:
                payment.submittedAt ||
                new Date().toISOString(),

              usedAmount: 0,

              usedBenefitAmount: 0,

              benefitEnabled:
                true,
            });

            changed = true;
          }
        }
      );

      if (changed) {
        localStorage.setItem(
          "bobDeposits",
          JSON.stringify(
            deposits
          )
        );
      }

      const customerDeposits =
        deposits
          .filter(
            (deposit: any) =>
              deposit.customerId ===
              customerId
          )
          .sort(
            (a: any, b: any) =>
              new Date(
                a.depositDate
              ).getTime() -
              new Date(
                b.depositDate
              ).getTime()
          );

      const saving =
        customerDeposits.reduce(
          (
            total: number,
            deposit: any
          ) => {
            return (
              total +
              Math.max(
                0,
                Number(
                  deposit.originalAmount ||
                  0
                ) -
                  Number(
                    deposit.usedAmount ||
                    0
                  )
              )
            );
          },
          0
        );

      const benefit =
        customerDeposits.reduce(
          (
            total: number,
            deposit: any
          ) => {
            const earned =
              getDepositBenefit(
                deposit
              );

            const used =
              Number(
                deposit.usedBenefitAmount ||
                0
              );

            return (
              total +
              Math.max(
                0,
                earned - used
              )
            );
          },
          0
        );

      return {
        saving,
        benefit,
        total:
          saving + benefit,
        deposits,
      };
    } catch (error) {
      console.error(
        "BOB balance breakdown error:",
        error
      );

      return {
        saving: 0,
        benefit: 0,
        total: 0,
        deposits: [],
      };
    }
  };

  const getBobBalance = (
    customerId: string
  ) => {
    return getBOBValueBreakdown(
      customerId
    ).total;
  };

  useEffect(() => {
    const customer =
      getBobCustomer();

    if (!customer) {
      setBobBalance(0);
      setBobSavingBalance(0);
      setBeautyBenefitBalance(0);
      return;
    }

    const breakdown =
      getBOBValueBreakdown(
        customer.id
      );

    setBobSavingBalance(
      breakdown.saving
    );

    setBeautyBenefitBalance(
      breakdown.benefit
    );

    setBobBalance(
      breakdown.total
    );
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBobError("");

    if (
      !selectedService &&
      formData.payment === "Pay from BOB"
    ) {
      setBobError("Please select a service before paying from BOB.");
      return;
    }

    /* =========================
       FULL NO COST EMI
       BOB customer EMI plan
    ========================= */

    if (formData.payment === "No Cost EMI") {
      const customer = getBobCustomer();

      if (customer && selectedService) {
        const amount = Number(
          String(selectedService.price).replace(
            /[^0-9.]/g,
            ""
          )
        );

        if (amount > 0) {
          createBOBEMIPlan({
            customerId: customer.id,
            purchaseType: "SERVICE",
            purchaseName: selectedService.name,
            totalAmount: amount,
            bobPaidAmount: 0,
            paidAmount: 0,
            pendingAmount: amount,
            serviceSlug: selectedService.slug,
          });
        }
      }

      setSubmitted(true);
      return;
    }

    if (formData.payment === "Pay from BOB") {
      const customer =
        getBobCustomer();

      if (!customer) {
        setBobError(
          "Pay from BOB use karne ke liye pehle BOB account me login karein."
        );
        return;
      }

      const priceText =
        selectedService?.price ||
        "0";

      const amount =
        Number(
          String(
            priceText
          ).replace(
            /[^0-9.]/g,
            ""
          )
        );

      if (
        !amount ||
        amount <= 0
      ) {
        setBobError(
          "Is service ka valid payable amount available nahi hai."
        );
        return;
      }

      const breakdown =
        getBOBValueBreakdown(
          customer.id
        );

      setBobSavingBalance(
        breakdown.saving
      );

      setBeautyBenefitBalance(
        breakdown.benefit
      );

      setBobBalance(
        breakdown.total
      );

      // BOB balance kam hone par booking ko block nahi karna hai.
      // Available BOB value pehle use hogi aur baaki amount
      // customer Full Payment ya No Cost EMI se complete karega.
      const bobPayableAmount = Math.min(
        amount,
        breakdown.total
      );

      const remainingAmount = Math.max(
        0,
        amount - breakdown.total
      );

      try {
        const depositsData =
          localStorage.getItem(
            "bobDeposits"
          );

        const deposits =
          depositsData
            ? JSON.parse(
                depositsData
              )
            : [];

        const customerDeposits =
          deposits
            .filter(
              (deposit: any) =>
                deposit.customerId ===
                customer.id
            )
            .sort(
              (a: any, b: any) =>
                new Date(
                  a.depositDate
                ).getTime() -
                new Date(
                  b.depositDate
                ).getTime()
            );

        /*
         * FIFO:
         * Pehle actual Saving use hogi.
         * Agar Saving khatam hone ke baad amount bacha,
         * tab Beauty Benefit use hoga.
         */

        let remaining =
          bobPayableAmount;

        const allocation: any[] =
          [];

        let actualSavingUsed =
          0;

        let benefitUsed =
          0;

        const updatedDeposits =
          customerDeposits.map(
            (deposit: any) => {
              if (
                remaining <= 0
              ) {
                return deposit;
              }

              const savingAvailable =
                Math.max(
                  0,
                  Number(
                    deposit.originalAmount ||
                    0
                  ) -
                    Number(
                      deposit.usedAmount ||
                      0
                    )
                );

              const useFromSaving =
                Math.min(
                  remaining,
                  savingAvailable
                );

              if (
                useFromSaving > 0
              ) {
                remaining -=
                  useFromSaving;

                actualSavingUsed +=
                  useFromSaving;

                allocation.push({
                  depositId:
                    deposit.id,

                  source:
                    "SAVING",

                  amount:
                    useFromSaving,
                });

                deposit = {
                  ...deposit,

                  usedAmount:
                    Number(
                      deposit.usedAmount ||
                      0
                    ) +
                    useFromSaving,
                };
              }

              if (
                remaining <= 0
              ) {
                return deposit;
              }

              const earnedBenefit =
                getDepositBenefit(
                  deposit
                );

              const alreadyUsedBenefit =
                Number(
                  deposit.usedBenefitAmount ||
                  0
                );

              const benefitAvailable =
                Math.max(
                  0,
                  earnedBenefit -
                    alreadyUsedBenefit
                );

              const useFromBenefit =
                Math.min(
                  remaining,
                  benefitAvailable
                );

              if (
                useFromBenefit > 0
              ) {
                remaining -=
                  useFromBenefit;

                benefitUsed +=
                  useFromBenefit;

                allocation.push({
                  depositId:
                    deposit.id,

                  source:
                    "BEAUTY_BENEFIT",

                  amount:
                    useFromBenefit,
                });

                return {
                  ...deposit,

                  usedBenefitAmount:
                    alreadyUsedBenefit +
                    useFromBenefit,
                };
              }

              return deposit;
            }
          );

        if (
          remaining > 0
        ) {
          setBobError(
            "BOB payment complete nahi ho paaya."
          );
          return;
        }

        const updatedMap =
          new Map(
            updatedDeposits.map(
              (deposit: any) => [
                deposit.id,
                deposit,
              ]
            )
          );

        const finalDeposits =
          deposits.map(
            (deposit: any) =>
              updatedMap.get(
                deposit.id
              ) ||
              deposit
          );

        localStorage.setItem(
          "bobDeposits",
          JSON.stringify(
            finalDeposits
          )
        );

        /*
         * Statement me sirf actual Saving use DEBIT hoga.
         * Beauty Benefit use statement me nahi aayega.
         */

        const usageData =
          localStorage.getItem(
            "bobUsage"
          );

        const usage =
          usageData
            ? JSON.parse(
                usageData
              )
            : [];

        usage.push({
          id:
            `BOB-USE-${Date.now()}`,

          customerId:
            customer.id,

          description:
            selectedService?.name ||
            "Qurux Service",

          amount:
            actualSavingUsed +
            benefitUsed,

          savingUsedAmount:
            actualSavingUsed,

          benefitUsedAmount:
            benefitUsed,

          date:
            new Date().toISOString(),

          allocation,

          serviceSlug:
            selectedService?.slug ||
            "",

          type:
            "SERVICE",
        });

        localStorage.setItem(
          "bobUsage",
          JSON.stringify(
            usage
          )
        );

        const after =
          getBOBValueBreakdown(
            customer.id
          );

        setBobSavingBalance(
          after.saving
        );

        setBeautyBenefitBalance(
          after.benefit
        );

        setBobBalance(
          after.total
        );

        if (
          remainingAmount > 0 &&
          bobRemainingPayment === "No Cost EMI"
        ) {
          createBOBEMIPlan({
            customerId: customer.id,
            purchaseType: "SERVICE",
            purchaseName:
              selectedService?.name ||
              "Qurux Service",
            totalAmount: amount,
            bobPaidAmount: bobPayableAmount,
            paidAmount: 0,
            pendingAmount: remainingAmount,
            serviceSlug:
              selectedService?.slug ||
              "",
          });
        }
      } catch (error) {
        console.error(
          "BOB booking payment error:",
          error
        );

        setBobError(
          "BOB payment process nahi ho paaya."
        );
        return;
      }
    }

    // Save booking to backend API
    let createdBookingId = "";
    try {
      const priceText = selectedService?.price || "0";
      const amount = Number(String(priceText).replace(/[^0-9.]/g, ""));
      const locationType = formData.location === "Home Service" ? "HOME" : "SALON";
      const paymentMethod = formData.payment === "Pay from BOB" ? "BOB" : formData.payment === "No Cost EMI" ? "EMI" : "FULL";

      const res = await apiPost("/bookings", {
        serviceName: selectedService?.name || "",
        serviceCategory: selectedService?.category || "",
        serviceLocation: locationType,
        address: locationType === "HOME" ? address : "",
        salonName: locationType === "SALON" ? selectedSalon : "",
        date: formData.date || "",
        timeSlot: timeSlot || "",
        amount: amount,
        paymentMethod: paymentMethod,
      });
      createdBookingId = (res.data as any)?.booking?.bookingId || (res.data as any)?.booking?._id || "";
    } catch (err) {
      console.error("Booking API error:", err);
    }

    // Manual payment flow: FULL/UPI bookings need a payment proof step
    if (formData.payment === "Full Payment" && createdBookingId) {
      const priceText = selectedService?.price || "0";
      const amount = Number(String(priceText).replace(/[^0-9.]/g, ""));
      setPendingPayment({ bookingId: createdBookingId, amount, serviceName: selectedService?.name || "" });
      return;
    }

    setSubmitted(true);
  }

  if (pendingPayment) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 rounded-[30px] bg-white p-7 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">✓</div>
            <h1 className="mt-4 text-2xl font-black text-gray-900">Booking Created — Payment Pending</h1>
            <p className="mt-2 text-sm text-gray-600">
              Aapki booking request bana di gayi hai.
              UPI se payment karke transaction details submit karein — admin verify karke approve karega.
            </p>
            <div className="mt-4 inline-block rounded-2xl bg-gray-50 px-5 py-3">
              <p className="text-xs font-bold uppercase text-gray-500">Booking ID</p>
              <p className="text-lg font-black text-pink-600">{pendingPayment.bookingId}</p>
            </div>
          </div>
          <PaymentForm
            amount={pendingPayment.amount}
            referenceType="BOOKING"
            referenceName={pendingPayment.serviceName || "Qurux Service"}
            referenceId={pendingPayment.bookingId}
            onSuccess={() => {
              setPendingPayment(null);
              setSubmitted(true);
            }}
            onCancel={() => {
              setPendingPayment(null);
              setSubmitted(true);
            }}
          />
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[30px] bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-4xl text-pink-600">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Booking Request Received
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            Thank you for choosing QURUX MAKEOVER & ACADEMY.
            Our team will contact you shortly to confirm your booking.
          </p>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-8 rounded-full bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700"
          >
            Make Another Booking
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white py-14">
      <div className="mx-auto max-w-4xl px-6">

        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            QURUX MAKEOVER & ACADEMY
          </p>

          <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Book Your Service
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            Fill in your details below and choose your preferred
            location and payment option.
          </p>
        </div>

        {/* Selected Service */}
        <div className="mb-8 overflow-hidden rounded-[25px] bg-white shadow-lg">
          {selectedService ? (
            <>
              {/* SERVICE IMAGE */}
              <div className="relative h-[220px] w-full overflow-hidden bg-pink-100">

                {/* Background image - fills the complete area */}
                <div
                  className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
                  style={{
                    backgroundImage: `url("${selectedService.image}")`,
                  }}
                />

                {/* Background overlay */}
                <div className="absolute inset-0 bg-white/30" />

                {/* Original image */}
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <img
                    src={selectedService.image}
                    alt={selectedService.name}
                    className="h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Service Information */}
              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-pink-600">
                  Selected Service
                </p>

                <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedService.name}
                    </h2>

                    <p className="mt-2 text-gray-600">
                      {selectedService.duration}
                    </p>
                  </div>

                  <div className="text-xl font-bold text-pink-600">
                    {selectedService.price}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-pink-600">
                Selected Service
              </p>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Service Selection
              </h2>

              <p className="mt-2 text-gray-600">
                Please select a service before booking.
              </p>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <section className="rounded-[30px] bg-white p-6 shadow-xl md:p-10">

          <h2 className="text-3xl font-bold text-gray-900">
            Booking Details
          </h2>

          <p className="mt-2 text-gray-600">
            Please provide the information required for your booking.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block font-semibold text-gray-800"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block font-semibold text-gray-800"
              >
                Mobile Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10 digit mobile number"
                className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Please enter a valid 10 digit mobile number.
              </p>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="mb-2 block font-semibold text-gray-800"
              >
                Preferred Date
              </label>

              <input
                id="date"
                name="date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.date}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Location Type */}
            <div>
              <p className="mb-3 font-semibold text-gray-800">
                Choose Service Location
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-2xl border p-5 transition ${
                    formData.location === "Home Service"
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-pink-300"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      name="location"
                      value="Home Service"
                      checked={formData.location === "Home Service"}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-pink-600"
                    />
                    <div>
                      <p className="font-bold text-gray-900">🏠 Home Service</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Service at your doorstep. Min cart ₹2,500 required.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-2xl border p-5 transition ${
                    formData.location === "Salon"
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-pink-300"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      name="location"
                      value="Salon"
                      checked={formData.location === "Salon"}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-pink-600"
                    />
                    <div>
                      <p className="font-bold text-gray-900">💈 Available Salon</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Visit our salon for the service.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Home Service - Address */}
            {formData.location === "Home Service" && (
              <div className="space-y-4 rounded-2xl bg-pink-50 p-5">
                <p className="font-semibold text-pink-700">
                  Home Service Details
                </p>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    Full Address
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No, Street, Landmark, City, Pincode"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>
                <TimeSlotPicker value={timeSlot} onChange={setTimeSlot} />
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-sm font-bold text-amber-700">
                    ₹2,500 Minimum Cart Required for Home Service
                  </p>
                </div>
              </div>
            )}

            {/* Available Salon - Select Salon */}
            {formData.location === "Salon" && (
              <div className="space-y-4 rounded-2xl bg-pink-50 p-5">
                <p className="font-semibold text-pink-700">
                  Available Salons
                </p>
                <select
                  required
                  value={selectedSalon}
                  onChange={(e) => setSelectedSalon(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="">Select a salon</option>
                  <option value="Naraina Vihar">QURUX Salon — Naraina Vihar</option>
                  <option value="Uttam Nagar">QURUX Salon — Uttam Nagar</option>
                </select>
                <TimeSlotPicker value={timeSlot} onChange={setTimeSlot} />
              </div>
            )}

            {/* Payment */}
            <div>
              <p className="mb-3 font-semibold text-gray-800">
                Payment Option
              </p>

              <div className="grid gap-4 md:grid-cols-3">

                {/* Full Payment */}
                <label
                  className={`cursor-pointer rounded-2xl border p-5 transition ${
                    formData.payment === "Full Payment"
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="Full Payment"
                      required
                      checked={
                        formData.payment === "Full Payment"
                      }
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-pink-600"
                    />

                    <div>
                      <p className="font-bold text-gray-900">
                        Full Payment
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Pay the complete booking amount.
                      </p>
                    </div>
                  </div>
                </label>

                {/* No Cost EMI */}
                <label
                  className={`cursor-pointer rounded-2xl border p-5 transition ${
                    formData.payment === "No Cost EMI"
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="No Cost EMI"
                      required
                      checked={
                        formData.payment === "No Cost EMI"
                      }
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-pink-600"
                    />

                    <div>
                      <p className="font-bold text-gray-900">
                        No Cost EMI
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Available subject to applicable terms
                        and eligibility.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Pay from BOB */}
                <label
                  className={`cursor-pointer rounded-2xl border p-5 transition ${
                    formData.payment === "Pay from BOB"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="Pay from BOB"
                      required
                      checked={
                        formData.payment === "Pay from BOB"
                      }
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-green-600"
                    />

                    <div className="w-full">
                      <p className="font-bold text-gray-900">
                        Pay from BOB
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Use your Bank of Beauty value.
                      </p>

                      {formData.payment === "Pay from BOB" && (
                        <div className="mt-3 space-y-3 rounded-xl bg-white p-3">

                          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                            <span className="text-xs font-semibold text-gray-500">
                              SAVING AVAILABLE
                            </span>

                            <span className="font-bold text-gray-900">
                              ₹{bobSavingBalance.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-xl bg-pink-50 p-3">
                            <span className="text-xs font-semibold text-pink-600">
                              BEAUTY BENEFITS AVAILABLE
                            </span>

                            <span className="font-bold text-pink-600">
                              ₹{beautyBenefitBalance.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-xl bg-green-50 p-3">
                            <span className="text-xs font-bold text-green-700">
                              TOTAL BOB VALUE
                            </span>

                            <span className="text-xl font-bold text-green-700">
                              ₹{bobBalance.toLocaleString("en-IN")}
                            </span>
                          </div>

                          {selectedService && (
                            <>
                              <p className="pt-1 text-xs font-semibold text-gray-500">
                                REGULAR SERVICE PRICE
                              </p>

                              <p className="font-bold text-gray-900">
                                {selectedService.price}
                              </p>

                              <p className="pt-2 text-xs font-semibold text-gray-500">
                                AMOUNT PAYABLE FROM BOB
                              </p>

                              <p className="text-lg font-bold text-green-700">
                                ₹{Math.min(
                                  bobBalance,
                                  Number(
                                    String(selectedService.price).replace(
                                      /[^0-9.]/g,
                                      ""
                                    )
                                  )
                                ).toLocaleString("en-IN")}
                              </p>
                            </>
                          )}

                        </div>
                      )}
                    </div>
                  </div>
                </label>

              </div>

              {bobError && (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {bobError}
                </div>
              )}

              {formData.payment === "Pay from BOB" &&
                selectedService && (
                  <div className="mt-4 rounded-2xl bg-green-50 p-4">
                    <p className="text-sm text-gray-600">
                      After Purchase Balance
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-700">
                      ₹
                      {Math.max(
                        0,
                        bobBalance -
                          Math.min(
                            bobBalance,
                            Number(
                              String(
                                selectedService.price
                              ).replace(
                                /[^0-9.]/g,
                                ""
                              )
                            )
                          )
                      ).toLocaleString("en-IN")}
                    </p>

                    {(() => {
                      const serviceAmount = Number(
                        String(selectedService.price).replace(
                          /[^0-9.]/g,
                          ""
                        )
                      );

                      const availableBOB = Math.max(0, bobBalance);
                      const bobPayable = Math.min(serviceAmount, availableBOB);
                      const remaining = Math.max(0, serviceAmount - availableBOB);

                      return remaining > 0 ? (
                        <div className="mt-4 rounded-2xl bg-amber-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
                            REMAINING AMOUNT
                          </p>

                          <p className="mt-1 text-xl font-bold text-gray-900">
                            ₹{remaining.toLocaleString("en-IN")}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            BOB balance ₹{bobPayable.toLocaleString("en-IN")} pehle use hoga.
                            Baaki amount ke liye payment option choose karein.
                          </p>

                          <div className="mt-4 grid gap-2">
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                              <input
                                type="radio"
                                name="bobRemainingPayment"
                                value="Full Payment"
                                checked={bobRemainingPayment === "Full Payment"}
                                onChange={(e) => setBobRemainingPayment(e.target.value)}
                                className="h-4 w-4 accent-pink-600"
                              />
                              <span className="font-semibold text-gray-900">
                                Full Payment — ₹{remaining.toLocaleString("en-IN")}
                              </span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                              <input
                                type="radio"
                                name="bobRemainingPayment"
                                value="No Cost EMI"
                                checked={bobRemainingPayment === "No Cost EMI"}
                                onChange={(e) => setBobRemainingPayment(e.target.value)}
                                className="h-4 w-4 accent-pink-600"
                              />
                              <span className="font-semibold text-gray-900">
                                No Cost EMI — ₹{remaining.toLocaleString("en-IN")}
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <p className="mt-2 text-xs text-gray-500">
                      FIFO: oldest Saving is used first. Beauty Benefit is used only when required.
                      Statement me Beauty Benefit credit/debit nahi dikhega.
                    </p>
                  </div>
                )}

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700"
            >
              SUBMIT BOOKING
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              Your booking request will be confirmed by the
              QURUX team after checking availability.
            </p>

          </form>
        </section>

      </div>
    </main>
  );
}
