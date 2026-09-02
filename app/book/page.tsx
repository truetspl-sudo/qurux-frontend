"use client";

import Image from "next/image";
import Link from "next/link";
import { services as staticServices } from "@/components/book/services";

type ServiceItem = {
  name: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  slug: string;
  image: string;
  includes?: string[];
};

const categories = [
  "All",
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
            Choose a beauty service and view its complete details,
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

        {/* QUICK CATEGORIES */}
        <section className="mt-8 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <a
              key={category}
              href={
                category === "All"
                  ? "#services"
                  : `#${category.toLowerCase().replace(/\s+/g, "-")}`
              }
              className="rounded-full border border-pink-200 bg-white px-5 py-2.5 text-sm font-semibold text-pink-600 shadow-sm transition hover:bg-pink-600 hover:text-white"
            >
              {category}
            </a>
          ))}
        </section>

        {/* SERVICES */}
        <section id="services" className="mt-12">

          {categories
            .filter((category) => category !== "All")
            .map((category) => {
              const categoryServices = services.filter(
                (service) =>
                  service.category.toLowerCase() === category.toLowerCase()
              );

              if (categoryServices.length === 0) {
                return null;
              }

              return (
                <div
                  key={category}
                  id={category.toLowerCase().replace(/\s+/g, "-")}
                  className="mb-14 scroll-mt-24"
                >
                  <div className="mb-6">
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
                      OUR SERVICES
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-gray-900">
                      {category}
                    </h2>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                    {categoryServices.map((service) => (
                      <article
                        key={service.slug}
                        className="overflow-hidden rounded-[25px] bg-white shadow-lg ring-1 ring-pink-100 transition hover:-translate-y-1 hover:shadow-xl"
                      >

                        {/* IMAGE */}
                        <div className="relative h-64 w-full overflow-hidden bg-pink-100">
                          <Image
                            src={service.image}
                            alt={service.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition duration-500 hover:scale-105"
                          />
                        </div>

                        {/* DETAILS */}
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

                            <span className="text-2xl">
                              ✨
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                            {service.description}
                          </p>

                          <div className="mt-5 grid grid-cols-2 gap-3">

                            <div className="rounded-xl bg-pink-50 p-3">
                              <p className="text-xs text-gray-500">
                                Starting Price
                              </p>

                              <p className="mt-1 font-bold text-pink-600">
                                {service.price}
                              </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">
                                Duration
                              </p>

                              <p className="mt-1 font-bold text-gray-900">
                                {service.duration}
                              </p>
                            </div>

                          </div>

                          {/* SERVICE DETAILS */}
                          <Link
                            href={`/makeup/${service.slug}`}
                            className="mt-5 block w-full rounded-full border-2 border-pink-600 px-5 py-3 text-center font-bold text-pink-600 transition hover:bg-pink-600 hover:text-white"
                          >
                            VIEW DETAILS
                          </Link>

                          {/* BOOK NOW */}
                          <Link
                            href={`/booking?service=${service.slug}`}
                            className="mt-3 block w-full rounded-full bg-pink-600 px-5 py-3 text-center font-bold text-white transition hover:bg-pink-700"
                          >
                            BOOK NOW →
                          </Link>

                        </div>
                      </article>
                    ))}

                  </div>
                </div>
              );
            })}

          {/* SERVICES NOT MATCHING THE PRESET CATEGORIES */}
          {services.some(
            (service) =>
              !categories
                .slice(1)
                .some(
                  (category) =>
                    category.toLowerCase() ===
                    service.category.toLowerCase()
                )
          ) && (
            <div className="mb-14 scroll-mt-24">
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
                  MORE SERVICES
                </p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  Other Beauty Services
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services
                  .filter(
                    (service) =>
                      !categories
                        .slice(1)
                        .some(
                          (category) =>
                            category.toLowerCase() ===
                            service.category.toLowerCase()
                        )
                  )
                  .map((service) => (
                    <article
                      key={service.slug}
                      className="overflow-hidden rounded-[25px] bg-white shadow-lg ring-1 ring-pink-100"
                    >
                      <div className="relative h-64 w-full overflow-hidden bg-pink-100">
                        <Image
                          src={service.image}
                          alt={service.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>

                      <div className="p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-pink-600">
                          {service.category}
                        </p>

                        <h3 className="mt-2 text-xl font-bold text-gray-900">
                          {service.name}
                        </h3>

                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {service.description}
                        </p>

                        <Link
                          href={`/makeup/${service.slug}`}
                          className="mt-5 block w-full rounded-full bg-pink-600 px-5 py-3 text-center font-bold text-white transition hover:bg-pink-700"
                        >
                          VIEW SERVICE →
                        </Link>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}

        </section>

        {/* BOTTOM */}
        <section className="mt-12 rounded-[30px] bg-gradient-to-r from-pink-600 to-pink-500 p-10 text-center text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-100">
            READY TO BOOK?
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Choose Your Service
          </h2>

          <p className="mx-auto mt-3 max-w-2xl leading-7 text-white/90">
            Select a service above to see complete details and continue
            to the booking page.
          </p>
        </section>

      </div>
    </main>
  );
}
