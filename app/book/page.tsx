"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { services as staticServices } from "@/components/book/services";

type ServiceItem = {
  name: string;
  category: string;
  description: string;
  price: string;
  regularPrice?: string;
  duration: string;
  slug: string;
  image: string;
  includes?: string[];
  save?: string;
};

const categoryOrder = [
  "Packages",
  "Bridal Makeup",
  "Pre Bridal Makeup",
  "Party Makeup",
  "Engagement Makeup",
  "Facial",
  "Skin Care",
  "Manicure",
  "Pedicure",
  "Hair Styling",
  "Other Salon Services",
];

export default function BookPage() {
  const services = staticServices as ServiceItem[];
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");

  // Group services by category for the dropdown menu
  const groupedByCategory = services.reduce<Record<string, ServiceItem[]>>(
    (acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    },
    {}
  );

  const menuResults = services.filter((s) =>
    s.name.toLowerCase().includes(menuQuery.toLowerCase())
  );

  // Ordered categories for display
  const displayCategories = [
    ...categoryOrder.filter((c) => groupedByCategory[c]),
    ...Object.keys(groupedByCategory).filter(
      (c) => !categoryOrder.includes(c)
    ),
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white py-14">
      <div className="mx-auto max-w-7xl px-6">

        {/* HEADER */}
        <section className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            QURUX MAKEOVER & ACADEMY
          </p>

          <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Book Your Service
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Choose a beauty service or package and view its complete details,
            price, duration and booking options.
          </p>
        </section>

        {/* BACK BUTTON */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border-2 border-pink-600 bg-white px-6 py-3 font-bold text-pink-600 shadow-sm transition hover:bg-pink-600 hover:text-white"
          >
            ← BACK
          </Link>
        </div>

        {/* SERVICE MENU — select a service to open it directly */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex w-full items-center justify-between rounded-full border-2 border-pink-600 bg-white px-6 py-4 font-bold text-pink-600 shadow-md transition hover:bg-pink-50"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <span>{menuOpen ? "Choose a Service" : "Browse All Services"}</span>
              </span>
              <span className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

            {menuOpen && (
              <div className="absolute left-0 right-0 z-50 mt-2 max-h-[420px] overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl">
                {/* Search inside menu */}
                <div className="border-b border-pink-50 p-3">
                  <input
                    type="text"
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Search services..."
                    autoFocus
                    className="w-full rounded-full border border-pink-200 bg-pink-50 px-5 py-3 text-sm outline-none focus:border-pink-500"
                  />
                </div>

                <div className="max-h-[360px] overflow-y-auto p-2">
                  {menuQuery ? (
                    /* Filtered flat list */
                    <div className="space-y-1">
                      {menuResults.map((service) => (
                        <Link
                          key={service.slug}
                          href={`/makeup/${service.slug}`}
                          onClick={() => {
                            setMenuOpen(false);
                            setMenuQuery("");
                          }}
                          className="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-pink-50"
                        >
                          <span className="font-semibold text-gray-800">{service.name}</span>
                          <span className="text-xs font-bold text-pink-600">{service.price}</span>
                        </Link>
                      ))}
                      {menuResults.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-gray-500">No service found</p>
                      )}
                    </div>
                  ) : (
                    /* Grouped by category */
                    <div>
                      {displayCategories.map((category) => (
                        <div key={category} className="mb-1">
                          <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-pink-600">
                            {category}
                          </p>
                          {groupedByCategory[category].map((service) => (
                            <Link
                              key={service.slug}
                              href={`/makeup/${service.slug}`}
                              onClick={() => {
                                setMenuOpen(false);
                                setMenuQuery("");
                              }}
                              className="flex items-center justify-between rounded-2xl px-4 py-2.5 transition hover:bg-pink-50"
                            >
                              <span className="font-medium text-gray-800">{service.name}</span>
                              <span className="text-xs font-bold text-pink-600">{service.price}</span>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SERVICES GRID — grouped by category */}
        <section id="services" className="mt-12">
          {displayCategories.map((category) => {
            const categoryServices = groupedByCategory[category];
            if (categoryServices.length === 0) return null;
            const isPackages = category === "Packages";
            return (
              <div
                key={category}
                id={category.toLowerCase().replace(/\s+/g, "-")}
                className="mb-14 scroll-mt-24"
              >
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
                    {isPackages ? "SPECIAL OFFERS" : "OUR SERVICES"}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">
                    {category}
                  </h2>
                  {isPackages && (
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                      🎁 Bundle multiple services at special discounted prices — save more when you book together.
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {categoryServices.length} option{categoryServices.length !== 1 ? "s" : ""} available
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map(renderServiceCard)}
                </div>
              </div>
            );
          })}
        </section>

        {/* BOTTOM CTA */}
        <section className="mt-12 rounded-[30px] bg-gradient-to-r from-pink-600 to-pink-500 p-10 text-center text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-100">
            READY TO BOOK?
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Choose Your Service
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-white/90">
            Select a service above to see complete details and continue to the booking page.
          </p>
        </section>

      </div>
    </main>
  );
}

function renderServiceCard(service: ServiceItem) {
  const isPackage = service.category === "Packages";
  return (
    <article
      key={service.slug}
      className={`overflow-hidden rounded-[25px] bg-white shadow-lg ring-1 ring-pink-100 transition hover:-translate-y-1 hover:shadow-xl ${
        isPackage ? "ring-2 ring-pink-500" : ""
      }`}
    >
      <div className="relative h-64 w-full overflow-hidden bg-pink-100">
        <Image
          src={service.image}
          alt={service.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
        {isPackage && (
          <span className="absolute left-4 top-4 rounded-full bg-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
            🎁 PACKAGE
          </span>
        )}
        {service.save && (
          <span className="absolute bottom-4 right-4 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
            {service.save}
          </span>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-pink-600">
              {service.category}
            </p>
            <h3 className="mt-2 text-xl font-bold text-gray-900">
              {service.name}
            </h3>
          </div>
          <span className="text-2xl">{isPackage ? "🎁" : "✨"}</span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
          {service.description}
        </p>

        {/* Included services for packages */}
        {isPackage && service.includes && (
          <ul className="mt-4 space-y-1.5 rounded-2xl bg-pink-50 p-4">
            {service.includes.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-pink-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-pink-50 p-3">
            <p className="text-xs text-gray-500">{isPackage ? "Package Price" : "Starting Price"}</p>
            <p className="mt-1 font-bold text-pink-600">{service.price}</p>
            {service.regularPrice && (
              <p className="text-xs text-gray-400 line-through">{service.regularPrice}</p>
            )}
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Duration</p>
            <p className="mt-1 font-bold text-gray-900">{service.duration}</p>
          </div>
        </div>
        <Link
          href={`/makeup/${service.slug}`}
          className="mt-5 block w-full rounded-full border-2 border-pink-600 px-5 py-3 text-center font-bold text-pink-600 transition hover:bg-pink-600 hover:text-white"
        >
          VIEW DETAILS
        </Link>
        <Link
          href={`/booking?service=${service.slug}`}
          className="mt-3 block w-full rounded-full bg-pink-600 px-5 py-3 text-center font-bold text-white transition hover:bg-pink-700"
        >
          BOOK NOW →
        </Link>
      </div>
    </article>
  );
}