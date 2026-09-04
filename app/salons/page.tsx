"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Salon = {
  _id: string;
  slug?: string;
  name: string;
  image?: string;
  images?: string[];
  address: string;
  city: string;
  pincode?: string;
  about?: string;
  rating?: { stars: number; count: number };
};

function Stars({ rating }: { rating?: { stars: number; count: number } }) {
  const stars = Math.round((rating?.stars || 0) * 2) / 2;
  return (
    <div className="flex items-center gap-2">
      <span className="text-amber-400 text-lg tracking-tight">
        {"★".repeat(Math.round(stars))}
        {"☆".repeat(5 - Math.round(stars))}
      </span>
      <span className="text-sm font-bold text-gray-800">
        {rating?.count ? Number(rating.stars).toFixed(1) : "New"}
      </span>
      {rating?.count ? (
        <span className="text-xs text-gray-400">({rating.count} reviews)</span>
      ) : (
        <span className="text-xs text-gray-400">(abhi tak koi review nahi)</span>
      )}
    </div>
  );
}

export default function SalonsListPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(cityFilter = "") {
    setLoading(true);
    setError("");
    try {
      const q = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : "";
      const res = await apiGet<Salon[]>(`/salons${q}`);
      if (res.ok) setSalons(res.data || []);
      else setError(res.message || "Salons load nahi ho paye.");
    } catch {
      setError("Backend offline?");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="bg-gradient-to-b from-white via-pink-50 to-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              QURUX PARTNER SALONS
            </p>
            <h1 className="mt-3 text-4xl font-black text-gray-900 md:text-5xl">
              Our Partner Salons
            </h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
              Partner salon chunein — uske reviews, salon ki images, address aur
              Google Map location dekhein. Book Now karke usi salon ki services
              se booking karein.
            </p>
          </div>

          {/* Search by city */}
          <div className="mx-auto mt-8 flex max-w-md gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City search karein (e.g. Delhi)"
              className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:border-pink-500"
            />
            <button
              type="button"
              onClick={() => load(city)}
              className="rounded-full bg-pink-600 px-6 py-3 text-sm font-bold text-white hover:bg-pink-700"
            >
              Search
            </button>
          </div>

          {loading ? (
            <div className="mt-14 text-center text-gray-500">Loading salons...</div>
          ) : error ? (
            <div className="mt-14 rounded-2xl bg-red-50 p-6 text-center text-sm font-semibold text-red-600">
              ❌ {error}
            </div>
          ) : salons.length === 0 ? (
            <div className="mt-14 rounded-2xl bg-white p-14 text-center shadow-sm">
              <div className="text-6xl">💈</div>
              <h2 className="mt-4 text-2xl font-black text-gray-900">
                Abhi koi partner salon nahi
              </h2>
              <p className="mt-2 text-gray-500">
                Jald hi QURUX partner salons yahan list honge. Tab tak Book Now
                se services book karein.
              </p>
              <Link
                href="/book"
                className="mt-6 inline-block rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700"
              >
                Browse Services →
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {salons.map((s) => (
                <Link
                  key={s._id}
                  href={`/salons/${s.slug || s._id}`}
                  className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
                >
                  {s.image || s.images?.[0] ? (
                    <div className="relative h-48 w-full overflow-hidden bg-pink-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image || s.images?.[0]}
                        alt={s.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100">
                      <span className="text-6xl">💈</span>
                    </div>
                  )}
                  <div className="p-5">
                    <Stars rating={s.rating} />
                    <h3 className="mt-2 text-xl font-black text-gray-900">
                      {s.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      📍 {s.address}, {s.city}
                    </p>
                    <p className="mt-3 text-sm font-bold text-pink-600 group-hover:underline">
                      View Salon → Book Now
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
