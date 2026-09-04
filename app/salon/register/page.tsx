"use client";

import { useState } from "react";
import QuruxLogo from "@/components/QuruxLogo";
import { services as bookServices } from "@/components/book/services";

export default function SalonRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcQuery, setSvcQuery] = useState("");

  const [form, setForm] = useState({
    salonName: "",
    ownerName: "",
    email: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    pincode: "",
    salonType: "",
    servicesOffered: [] as string[],
    experience: "",
    teamSize: "",
    gstNumber: "",
    description: "",
    agreeTerms: false,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };
      return next as typeof prev;
    });
  }

  function toggleService(name: string) {
    setForm((prev) => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(name)
        ? prev.servicesOffered.filter((s) => s !== name)
        : [...prev.servicesOffered, name],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    if (!form.salonName.trim() || !form.ownerName.trim() || !form.email.trim() || !form.phone.trim()) {
      setMessage("Please fill all required fields.");
      setBusy(false);
      return;
    }

    if (form.phone.length !== 10) {
      setMessage("Please enter a valid 10 digit mobile number.");
      setBusy(false);
      return;
    }

    if (!form.agreeTerms) {
      setMessage("Please agree to the terms and conditions.");
      setBusy(false);
      return;
    }

    if (form.servicesOffered.length === 0) {
      setMessage("Please select at least one service from the list.");
      setBusy(false);
      return;
    }

    try {
      const typeMap: Record<string, string> = {
        "Unisex Salon": "UNISEX",
        "Women's Salon": "WOMENS",
        "Men's Salon": "MENS",
        "Home Studio": "HOME_STUDIO",
        "Makeup Studio": "MAKEUP_STUDIO",
      };
      const expMap: Record<string, number> = {
        "Less than 1 year": 0,
        "1–3 years": 2,
        "3–5 years": 4,
        "5–10 years": 8,
        "10+ years": 12,
      };
      const teamMap: Record<string, number> = {
        "1–2 staff": 2,
        "3–5 staff": 4,
        "6–10 staff": 8,
        "10+ staff": 12,
      };
      const payload = {
        name: form.salonName,
        type: typeMap[form.salonType] || "UNISEX",
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        gstNumber: form.gstNumber,
        ownerName: form.ownerName,
        ownerEmail: form.email,
        ownerMobile: form.phone,
        alternatePhone: form.altPhone,
        yearsOfExperience: expMap[form.experience] || 0,
        teamSize: teamMap[form.teamSize] || 1,
        servicesOffered: form.servicesOffered,
        about: form.description,
      };
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002") + "/api/salons/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.message || "Registration failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-slate-100 p-5">
        <div className="mx-auto max-w-lg py-16 text-center">
          <section className="rounded-3xl bg-white p-10 shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
              ✓
            </div>
            <h1 className="mt-6 text-3xl font-black text-gray-900">
              Registration Submitted
            </h1>
            <p className="mt-4 text-gray-600">
              Thank you for registering <strong>{form.salonName}</strong> with QURUX.
            </p>
            <div className="mt-5 rounded-2xl bg-pink-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                What happens next?
              </p>
              <ol className="mt-3 space-y-2 text-left text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">1</span>
                  Admin reviews your registration
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">2</span>
                  Verification of salon details
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">3</span>
                  Approval and login credentials sent to your email
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">4</span>
                  Your salon appears in the booking system
                </li>
              </ol>
            </div>
            <a
              href="/"
              className="mt-8 inline-block rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700"
            >
              Back to Home
            </a>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white py-14">
      <div className="mx-auto max-w-3xl px-6">

        {/* Header */}
        <section className="text-center">
          <p className="flex items-center justify-center gap-3">
            <QuruxLogo heightClass="h-12 w-auto md:h-14" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600 md:text-sm">MAKEOVER &amp; ACADEMY</span>
          </p>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Salon / Vendor Registration
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Join the QURUX partner network. Register your salon and start receiving bookings from our customer platform.
          </p>
        </section>

        {/* Registration Form */}
        <section className="mt-10 rounded-[30px] bg-white p-6 shadow-xl md:p-10">

          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              PARTNER REGISTRATION
            </p>
            <h2 className="mt-3 text-2xl font-black text-gray-900">
              Register Your Salon
            </h2>
            <p className="mt-2 text-gray-500">
              Fill in your salon details. Admin will review and approve your registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Salon Details */}
            <div className="rounded-2xl bg-pink-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                Salon Details
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-gray-800">
                Salon Name *
                <input
                  required
                  name="salonName"
                  value={form.salonName}
                  onChange={handleChange}
                  placeholder="e.g. Beauty Palace Salon"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Salon Type
                <select
                  name="salonType"
                  value={form.salonType}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none focus:border-pink-500"
                >
                  <option value="">Select type</option>
                  <option>Unisex Salon</option>
                  <option>Women&apos;s Salon</option>
                  <option>Men&apos;s Salon</option>
                  <option>Home Studio</option>
                  <option>Makeup Studio</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-bold text-gray-800">
              Salon Address *
              <textarea
                required
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="Full salon address with landmark"
                className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-bold text-gray-800">
                City *
                <input
                  required
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Delhi"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Pincode *
                <input
                  required
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 110059"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                GST Number
                <input
                  name="gstNumber"
                  value={form.gstNumber}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>
            </div>

            {/* Owner Details */}
            <div className="rounded-2xl bg-pink-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                Owner / Contact Details
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-gray-800">
                Owner Name *
                <input
                  required
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Full name of salon owner"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Email Address *
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="owner@example.com"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-gray-800">
                Primary Mobile Number *
                <input
                  required
                  type="tel"
                  name="phone"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Alternate Phone
                <input
                  type="tel"
                  name="altPhone"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={form.altPhone}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>
            </div>

            {/* Business Info */}
            <div className="rounded-2xl bg-pink-50 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                Business Information
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-gray-800">
                Years of Experience
                <select
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none focus:border-pink-500"
                >
                  <option value="">Select</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>5–10 years</option>
                  <option>10+ years</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Team Size
                <select
                  name="teamSize"
                  value={form.teamSize}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none focus:border-pink-500"
                >
                  <option value="">Select</option>
                  <option>1–2 staff</option>
                  <option>3–5 staff</option>
                  <option>6–10 staff</option>
                  <option>10+ staff</option>
                </select>
              </label>
            </div>

            {/* Services Offered — Book catalog se select */}
            <div className="block text-sm font-bold text-gray-800">
              Services Offered *
              <div className="relative mt-1.5">
                <button
                  type="button"
                  onClick={() => setSvcOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                >
                  {form.servicesOffered.length > 0 ? (
                    <span className="font-bold text-pink-600">
                      {form.servicesOffered.length} service{form.servicesOffered.length > 1 ? "s" : ""} selected
                    </span>
                  ) : (
                    <span className="text-gray-400">Book se services chunein…</span>
                  )}
                  <span className={`text-gray-400 transition ${svcOpen ? "rotate-180" : ""}`}>▾</span>
                </button>

                {svcOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
                    <input
                      autoFocus
                      type="text"
                      value={svcQuery}
                      onChange={(e) => setSvcQuery(e.target.value)}
                      placeholder="Search service…"
                      className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500"
                    />
                    {(() => {
                      const q = svcQuery.trim().toLowerCase();
                      const filtered = bookServices.filter(
                        (s: any) =>
                          !q ||
                          String(s.name || "").toLowerCase().includes(q) ||
                          String(s.category || "").toLowerCase().includes(q)
                      );
                      const cats: { cat: string; items: any[] }[] = [];
                      const catIdx: Record<string, number> = {};
                      filtered.forEach((s: any) => {
                        const cat = s.category || "Other";
                        if (!(cat in catIdx)) {
                          catIdx[cat] = cats.length;
                          cats.push({ cat, items: [] });
                        }
                        cats[catIdx[cat]].items.push(s);
                      });
                      if (cats.length === 0) {
                        return <p className="px-2 py-4 text-center text-sm text-gray-400">Koi service nahi mili</p>;
                      }
                      return cats.map((g) => (
                        <div key={g.cat} className="mb-2">
                          <p className="px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-pink-500">
                            {g.cat}
                          </p>
                          {g.items.map((s: any) => {
                            const on = form.servicesOffered.includes(s.name);
                            return (
                              <label
                                key={s.name}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-pink-50 ${
                                  on ? "bg-pink-50 text-pink-700" : "text-gray-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggleService(s.name)}
                                  className="h-4 w-4 accent-pink-600"
                                />
                                <span className="font-medium">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {form.servicesOffered.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {form.servicesOffered.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700 hover:bg-pink-200"
                    >
                      {s}
                      <span className="text-pink-400">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="block text-sm font-bold text-gray-800">
              About Your Salon
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Tell us about your salon, specialities, and what makes it unique"
                className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </label>

            {/* Terms */}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-pink-600"
              />
              <span className="text-sm text-gray-600">
                I agree to the QURUX Partner Terms & Conditions and confirm that all information provided is accurate.
              </span>
            </label>

            {message && (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700 disabled:opacity-50"
            >
              {busy ? "SUBMITTING..." : "SUBMIT REGISTRATION"}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              After submission, admin will review and verify your salon details.
              You will receive login credentials at your registered email after approval.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
