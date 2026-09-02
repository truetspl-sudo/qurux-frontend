"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { services } from "./services";

const categories = [
  "All",
  "Bridal Makeup",
  "Party Makeup",
  "Facial",
  "Manicure",
  "Pedicure",
  "Hair Styling",
  "Skin Care",
  "Other Salon Services",
];

export default function BookServices() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        category === "All" || service.category === category;

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        service.name.toLowerCase().includes(searchText) ||
        service.category.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <main className="min-h-screen bg-[#fff7fb]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-pink-600">
            QURUX SERVICES
          </p>

          <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Salon Services
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Choose your preferred beauty service and explore complete
            service details before booking.
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mt-10 max-w-2xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a service..."
            className="w-full rounded-full border border-pink-200 bg-white px-6 py-4 text-gray-800 shadow-md outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </div>

        {/* Categories */}
        <div className="mx-auto mt-8 max-w-3xl">

          {/* First Row */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {categories.slice(0, 4).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2.5 text-xs font-semibold transition sm:px-5 sm:text-sm ${
                  category === item
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-white text-gray-700 shadow-sm hover:bg-pink-50 hover:text-pink-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Second Row */}
          <div className="mt-3 flex justify-center gap-2 sm:gap-3">
            {categories.slice(4).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2.5 text-xs font-semibold transition sm:px-5 sm:text-sm ${
                  category === item
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-white text-gray-700 shadow-sm hover:bg-pink-50 hover:text-pink-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

        </div>

        {/* Service Cards */}
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {filteredServices.map((service) => (
            <div
              key={service.slug}
              className="group overflow-hidden rounded-[28px] bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              {/* Service Image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-6">

                {/* Category */}
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">
                  {service.category}
                </p>

                {/* Service Name */}
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {service.name}
                </h2>

                {/* Description */}
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {service.description}
                </p>

                {/* Price + Duration */}
                <div className="mt-5 flex items-center justify-between gap-4">

                  <div>
                    <p className="text-xs text-gray-500">
                      Starting
                    </p>

                    <p className="font-bold text-pink-600">
                      {service.price}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Duration
                    </p>

                    <p className="font-semibold text-gray-800">
                      {service.duration}
                    </p>
                  </div>

                </div>

                {/* Details */}
                <Link
                  href={`/makeup/${service.slug}`}
                  className="mt-6 block rounded-full bg-pink-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-pink-700"
                >
                  View Details →
                </Link>

              </div>
            </div>
          ))}

        </div>

        {/* No Result */}
        {filteredServices.length === 0 && (
          <div className="mt-12 rounded-3xl bg-white p-12 text-center shadow-md">

            <div className="text-6xl">
              🔍
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              No service found
            </h2>

            <p className="mt-2 text-gray-600">
              Try another service name or choose a different category.
            </p>

          </div>
        )}

      </div>
    </main>
  );
}