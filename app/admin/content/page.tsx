"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminContentPage() {
  const [saved, setSaved] = useState(false);

  const [hero, setHero] = useState([
    { id: "h1", title: "Luxury Beauty & Makeover Services", subtitle: "Bridal | Party | Engagement Makeup & More", image: "/hero/hero1.jpg", active: true },
    { id: "h2", title: "Professional Makeup Academy", subtitle: "Learn from industry experts and become a certified professional", image: "/hero/hero2.jpg", active: true },
    { id: "h3", title: "ESSN Cosmetics — Premium Beauty Products", subtitle: "Professional beauty products for artists and beauty lovers", image: "/hero/hero3.jpg", active: true },
  ]);

  const [features, setFeatures] = useState([
    { title: "Certified Bridal Artists", text: "Highly trained professionals for luxury bridal and party makeovers." },
    { title: "Premium Beauty Products", text: "We use only trusted international and premium beauty brands." },
    { title: "No Cost EMI – No Credit Card Required", text: "Get Bridal Makeup, Beauty Services, Products and Courses on No Cost EMI without any credit card." },
    { title: "Professional Academy", text: "Industry-ready makeup courses with certification and practical training." },
  ]);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AdminLayout title="Website Content" subtitle="Manage homepage sections, hero slides, and feature highlights.">

      {saved && (
        <div className="mb-6 rounded-2xl bg-green-50 p-4 text-center font-bold text-green-700">
          ✓ Content saved successfully!
        </div>
      )}

      <div className="space-y-6">

        {/* Hero Slides */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">Hero Slider</h2>
          <p className="mt-1 text-sm text-gray-500">Manage the homepage hero carousel slides.</p>

          <div className="mt-5 space-y-4">
            {hero.map((slide, index) => (
              <div key={slide.id} className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex-1 grid gap-3 sm:grid-cols-2">
                  <input
                    value={slide.title}
                    onChange={(e) => {
                      const updated = [...hero];
                      updated[index] = { ...slide, title: e.target.value };
                      setHero(updated);
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500"
                    placeholder="Slide title"
                  />
                  <input
                    value={slide.subtitle}
                    onChange={(e) => {
                      const updated = [...hero];
                      updated[index] = { ...slide, subtitle: e.target.value };
                      setHero(updated);
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500"
                    placeholder="Slide subtitle"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={slide.active}
                    onChange={(e) => {
                      const updated = [...hero];
                      updated[index] = { ...slide, active: e.target.checked };
                      setHero(updated);
                    }}
                    className="h-4 w-4 accent-pink-600"
                  />
                  Active
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose QURUX */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">Why Choose QURUX</h2>
          <p className="mt-1 text-sm text-gray-500">Manage the feature cards on the homepage.</p>

          <div className="mt-5 space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="grid gap-3 rounded-2xl border border-gray-200 p-4 sm:grid-cols-2">
                <input
                  value={feature.title}
                  onChange={(e) => {
                    const updated = [...features];
                    updated[index] = { ...feature, title: e.target.value };
                    setFeatures(updated);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold outline-none focus:border-pink-500"
                  placeholder="Feature title"
                />
                <input
                  value={feature.text}
                  onChange={(e) => {
                    const updated = [...features];
                    updated[index] = { ...feature, text: e.target.value };
                    setFeatures(updated);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500"
                  placeholder="Feature description"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer Content */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">Footer Quick Links</h2>
          <p className="mt-1 text-sm text-gray-500">Quick links and services shown in the website footer.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-gray-700">Quick Links</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li>Home → /</li>
                <li>Book Now → /book</li>
                <li>Buy Products → /shop</li>
                <li>Academy → /academy</li>
                <li>BOB Wallet → /bob</li>
                <li>Contact → /contact</li>
                <li>Become a Partner → /salon/register</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Service Categories in Footer</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li>Makeup</li>
                <li>Hair Styling</li>
                <li>Facial</li>
                <li>Skin Care</li>
                <li>Manicure & Pedicure</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">Footer content is managed via code. Update Footer.tsx for changes.</p>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button type="button" onClick={handleSave} className="rounded-full bg-pink-600 px-8 py-3.5 font-bold text-white hover:bg-pink-700">
            SAVE CONTENT
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
