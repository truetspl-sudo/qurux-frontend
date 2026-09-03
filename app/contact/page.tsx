"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#fff7fb]">

      {/* Header */}
      <section className="bg-white px-6 py-14 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-pink-600">
          GET IN TOUCH
        </p>

        <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Contact Us
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-gray-600">
          Have a question about our makeup services, salon services,
          bookings or home service? We would love to hear from you.
        </p>
      </section>

      {/* Main Contact Section */}
      <section className="mx-auto max-w-7xl px-6 py-14">

        <div className="grid gap-8 lg:grid-cols-2">

          {/* Contact Information */}
          <div className="rounded-[32px] bg-white p-8 shadow-lg md:p-10">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              CONTACT INFORMATION
            </p>

            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              We’re Here For You
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Connect with us for appointments, beauty services,
              makeup bookings and any other information you need.
            </p>

            {/* Phone */}
            <a
              href="tel:9911227916"
              className="mt-8 flex items-center gap-4 rounded-2xl bg-pink-50 p-5 transition hover:bg-pink-100"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xl text-white">
                ☎
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Call Us
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  9911227916
                </p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/919911227916"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-4 rounded-2xl bg-pink-50 p-5 transition hover:bg-pink-100"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xl text-white">
                💬
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  WhatsApp
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  Chat With Us
                </p>
              </div>
            </a>

            {/* Salon Locations */}
            <div className="mt-4 rounded-2xl bg-pink-50 p-5">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xl text-white">
                  📍
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Salon Locations
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    Naraina Vihar
                  </p>

                  <p className="font-bold text-gray-900">
                    Uttam Nagar
                  </p>
                </div>

              </div>

            </div>

            {/* Home Service */}
            <div className="mt-4 rounded-2xl bg-pink-50 p-5">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xl text-white">
                  🏠
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Home Service
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    Home Services Also Available
                  </p>
                </div>

              </div>

            </div>

            {/* Social Media */}
            <div className="mt-4 rounded-2xl bg-pink-50 p-5">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xl text-white">
                  🌐
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-500">
                    Follow Us
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <a
                      href="https://www.instagram.com/quruxmakeover?igsi=YTMzYnN6bndmeHQ1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-pink-700 text-lg text-white transition hover:scale-110"
                      aria-label="Instagram"
                    >
                      📸
                    </a>
                    <a
                      href="https://www.facebook.com/share/1EpLVyWx4a/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg text-white transition hover:scale-110"
                      aria-label="Facebook"
                    >
                      👍
                    </a>
                    <a
                      href="https://wa.me/919911227916"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-lg text-white transition hover:scale-110"
                      aria-label="WhatsApp"
                    >
                      💬
                    </a>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Contact Form */}
          <div className="rounded-[32px] bg-white p-8 shadow-lg md:p-10">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
              SEND A MESSAGE
            </p>

            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Get In Touch
            </h2>

            <p className="mt-4 text-gray-600">
              Fill in your details and our team will get back to you.
            </p>

            {submitted ? (
              <div className="mt-10 rounded-2xl bg-pink-50 p-8 text-center">

                <div className="text-5xl">
                  ✓
                </div>

                <h3 className="mt-4 text-2xl font-bold text-gray-900">
                  Thank You!
                </h3>

                <p className="mt-2 text-gray-600">
                  Your message has been submitted successfully.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
                >
                  Send Another Message
                </button>

              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >

                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your name"
                    className="w-full rounded-2xl border border-pink-200 bg-white px-5 py-4 text-gray-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-pink-200 bg-white px-5 py-4 text-gray-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Enter your phone number"
                    className="w-full rounded-2xl border border-pink-200 bg-white px-5 py-4 text-gray-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Subject
                  </label>

                  <select
                    name="subject"
                    className="w-full rounded-2xl border border-pink-200 bg-white px-5 py-4 text-gray-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  >
                    <option>General Enquiry</option>
                    <option>Makeup Booking</option>
                    <option>Salon Service</option>
                    <option>Home Service</option>
                    <option>Academy Course</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Message
                  </label>

                  <textarea
                    name="message"
                    rows={5}
                    required
                    placeholder="Write your message..."
                    className="w-full resize-none rounded-2xl border border-pink-200 bg-white px-5 py-4 text-gray-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full rounded-full bg-pink-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-pink-700 hover:shadow-lg"
                >
                  Send Message →
                </button>

              </form>
            )}

          </div>

        </div>

      </section>

      {/* Bottom CTA */}
      <section className="bg-pink-600 px-6 py-14 text-center text-white">

        <h2 className="text-3xl font-bold md:text-4xl">
          Ready for Your Beauty Experience?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-white/90">
          Book your preferred service or contact our team for
          personalized assistance.
        </p>

        <a
          href="/book"
          className="mt-7 inline-block rounded-full bg-white px-8 py-3 font-bold text-pink-600 transition hover:bg-pink-50"
        >
          Book Now →
        </a>

      </section>

    </main>
  );
}