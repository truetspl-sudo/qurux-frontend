"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { services } from "@/components/book/services";
import { apiPost, getLoggedInUser } from "@/lib/api";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import QuruxLogo from "@/components/QuruxLogo";

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
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loggedInUser = getLoggedInUser();

  // Prefill from website login (user id/password wale account se)
  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.fullName || "",
        phone: prev.phone || user.mobile || "",
      }));
    }
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (name === "payment") setError("");
  }

  const paymentMethod = (() => {
    if (formData.payment === "Pay from BOB") return "BOB";
    if (formData.payment === "No Cost EMI") return "EMI";
    return "FULL";
  })();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!selectedService) {
      setError("Pehle ek service select karein.");
      return;
    }

    const priceText = selectedService.price || "0";
    const amount = Number(String(priceText).replace(/[^0-9.]/g, ""));
    const locationType = formData.location === "Home Service" ? "HOME" : "SALON";

    // RULE (master note): booking ke waqt KOI payment step/payment nahi
    // mangte. FULL / EMI / BOB — teeno options me booking PENDING create
    // hoti hai. Payment customer service hone ke BAAD karta hai aur admin
    // booking close karte waqt payment update karta hai (manual fill).
    // BOB ka koi alag login/password nahi — website login hi BOB login hai.
    setSaving(true);
    try {
      const res = await apiPost("/bookings", {
        serviceName: selectedService.name,
        serviceCategory: selectedService.category || "",
        serviceLocation: locationType,
        address: locationType === "HOME" ? address : "",
        salonName: locationType === "SALON" ? selectedSalon : "",
        date: formData.date || "",
        timeSlot: timeSlot || "",
        amount,
        paymentMethod,
      });

      if (!res.ok) {
        const msg =
          res.status === 401 || res.status === 403
            ? "Booking karne ke liye pehle website par login karein (/account). Admin approved customer hi book kar sakta hai."
            : (res as any)?.data?.message || res.message || "Booking create nahi ho payi. Backend offline?";
        setError(msg);
        return;
      }

      const booking = (res.data as any)?.booking;
      setBookingId(booking?.bookingId || booking?._id || "");
      setSubmitted(true);
    } catch (err: any) {
      console.error("Booking API error:", err);
      setError(err?.message || "Booking create nahi ho payi. Backend offline?");
    } finally {
      setSaving(false);
    }
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

          {bookingId && (
            <p className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm font-bold text-gray-700">
              Booking ID: <span className="text-pink-600">{bookingId}</span>
            </p>
          )}

          <p className="mt-4 leading-7 text-gray-600">
            Thank you for choosing QURUX MAKEOVER &amp; ACADEMY.
            Aapki booking <strong>PENDING</strong> hai — QURUX team
            aapko WhatsApp par confirm karega.
          </p>

          <div className="mt-6 rounded-2xl bg-yellow-50 p-5 text-left">
            <p className="text-sm font-bold text-yellow-800">💳 PAYMENT — SERVICE KE BAAD</p>
            <p className="mt-1 text-sm leading-6 text-yellow-700">
              Aapne <strong>{formData.payment}</strong> option chuna hai.
              Booking ke waqt koi payment nahi karni hai — <strong>service
              hone ke baad</strong> payment karein (UPI/Cash).
              Admin service complete karte waqt payment update karega.
              {formData.payment === "Pay from BOB" &&
                " BOB balance se payment bhi service ke baad hogi — alag se BOB login ki zaroorat nahi hai."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setBookingId("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
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
          <p className="flex items-center justify-center gap-3">
            <QuruxLogo heightClass="h-12 w-auto md:h-14" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600 md:text-sm">MAKEOVER &amp; ACADEMY</span>
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
                <div
                  className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
                  style={{
                    backgroundImage: `url("${selectedService.image}")`,
                  }}
                />
                <div className="absolute inset-0 bg-white/30" />
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
                    <p className="mt-2 text-gray-600">{selectedService.duration}</p>
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
          {!loggedInUser && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">🔐 LOGIN REQUIRED</p>
              <p className="mt-1 text-sm leading-6 text-blue-700">
                Booking karne ke liye pehle website par login karein
                (User ID + Password se). Agar aapke paas User ID nahi hai to
                pehle sign up karein — admin approve karke User ID dega.
              </p>
              <a
                href="/account"
                className="mt-3 inline-block rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Login / Sign Up →
              </a>
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900">
            Booking Details
          </h2>

          <p className="mt-2 text-gray-600">
            Please provide the information required for your booking.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-2 block font-semibold text-gray-800">
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
              <label htmlFor="phone" className="mb-2 block font-semibold text-gray-800">
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
              <label htmlFor="date" className="mb-2 block font-semibold text-gray-800">
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
                      checked={formData.payment === "Full Payment"}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-pink-600"
                    />
                    <div>
                      <p className="font-bold text-gray-900">Full Payment</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Pay the complete booking amount
                        <strong> after the service</strong> (UPI/Cash).
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
                      checked={formData.payment === "No Cost EMI"}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-pink-600"
                    />
                    <div>
                      <p className="font-bold text-gray-900">No Cost EMI</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Service hone ke baad bill ka 25% down payment; baaki
                        75% flexible EMI — weekly jab jitna ho bharo. Booking
                        ke waqt koi payment nahi.
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
                      checked={formData.payment === "Pay from BOB"}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-green-600"
                    />
                    <div className="w-full">
                      <p className="font-bold text-gray-900">Pay from BOB</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Use your Bank of Beauty value. BOB ka koi alag login
                        nahi — website login hi BOB login hai. Service ke baad
                        admin BOB balance se payment update karega.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || !selectedService}
              className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? "SUBMITTING..." : "SUBMIT BOOKING"}
            </button>

          </form>
        </section>

      </div>
    </main>
  );
}
