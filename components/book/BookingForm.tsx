"use client";

import { useState } from "react";

type BookingFormProps = {
  serviceName?: string;
  servicePrice?: string;
};

export default function BookingForm({
  serviceName = "",
  servicePrice = "",
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    location: "",
    payment: "",
  });

  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[30px] bg-white p-8 text-center shadow-xl md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-4xl">
          ✓
        </div>

        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          Booking Request Received
        </h2>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
          Thank you for choosing QURUX MAKEOVER & ACADEMY.
          Our team will contact you shortly to confirm your
          booking.
        </p>

        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-8 rounded-full bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700"
        >
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-[30px] bg-white p-6 shadow-xl md:p-10">

      {/* Heading */}
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
          BOOK YOUR SERVICE
        </p>

        <h2 className="mt-3 text-3xl font-bold text-gray-900">
          Booking Details
        </h2>

        <p className="mt-2 text-gray-600">
          Fill in your details and choose your preferred
          location and payment option.
        </p>
      </div>

      {/* Selected Service */}
      {(serviceName || servicePrice) && (
        <div className="mb-8 rounded-2xl bg-pink-50 p-5">
          <p className="text-sm font-medium text-gray-500">
            Selected Service
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-900">
              {serviceName}
            </h3>

            {servicePrice && (
              <span className="font-bold text-pink-600">
                {servicePrice}
              </span>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

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
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="mb-2 block font-semibold text-gray-800"
          >
            Service Location
          </label>

          <select
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          >
            <option value="">
              Select service location
            </option>

            <option value="Naraina Vihar">
              Naraina Vihar
            </option>

            <option value="Uttam Nagar">
              Uttam Nagar
            </option>

            <option value="Home Service">
              Home Service
            </option>
          </select>
        </div>

        {/* Home Service Notice */}
        {formData.location === "Home Service" && (
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-5">
            <p className="font-semibold text-pink-700">
              Home Service Selected
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Our team will contact you for the complete
              service address and availability confirmation.
            </p>
          </div>
        )}

        {/* Payment */}
        <div>
          <p className="mb-3 font-semibold text-gray-800">
            Payment Option
          </p>

          <div className="grid gap-4 md:grid-cols-2">

            {/* Full Payment */}
            <label
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                formData.payment === "Full Payment"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white hover:border-pink-300"
              }`}
            >
              <div className="flex items-start gap-3">

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
                  : "border-gray-200 bg-white hover:border-pink-300"
              }`}
            >
              <div className="flex items-start gap-3">

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

          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-pink-700"
        >
          SUBMIT BOOKING
        </button>

        <p className="text-center text-xs leading-5 text-gray-500">
          Your booking request will be confirmed by the
          QURUX team after checking availability.
        </p>

      </form>
    </section>
  );
}