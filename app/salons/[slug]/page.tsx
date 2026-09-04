"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPost, getLoggedInUser } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import QuruxLogo from "@/components/QuruxLogo";
import { services as catalogServices } from "@/components/book/services";

type ServiceItem = {
  _id: string;
  name: string;
  category?: string;
  price?: number;
  duration?: string;
  description?: string;
  image?: string;
};

type SalonData = {
  _id: string;
  slug?: string;
  name: string;
  image?: string;
  images?: string[];
  workImages?: string[];
  googleMapUrl?: string;
  about?: string;
  address: string;
  city: string;
  pincode?: string;
  type?: string;
  rating?: { stars: number; count: number };
};

type ReviewItem = { _id: string; customerName: string; stars: number; customerRemarks: string; createdAt: string };

function fmtPrice(n?: number) {
  return n ? `₹${Number(n).toLocaleString("en-IN")}` : "";
}

// Service image — DB image, warna static catalog se naam se match, warna emoji tile
const catEmoji: Record<string, string> = {
  Bridal: "👰", Makeup: "💄", Party: "🎉", Facial: "✨", Skin: "✨",
  Manicure: "💅", Pedicure: "💅", Nail: "💅", Hair: "💇", Massage: "🌸", Bleach: "✨", Detan: "✨",
};
function serviceThumb(s: ServiceItem) {
  if (s.image && s.image.trim()) return s.image;
  const hit = catalogServices.find((c) => (c as any).name === s.name);
  if (hit && (hit as any).image) return (hit as any).image;
  return "";
}
function catEmojiFor(s: ServiceItem): string {
  const cat = s.category || "";
  const em = Object.keys(catEmoji).find((k) => cat.toLowerCase().includes(k.toLowerCase()));
  return em ? catEmoji[em] : "💆";
}

export default function SalonDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [salon, setSalon] = useState<SalonData | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking
  const [bookOpen, setBookOpen] = useState(false);
  const [selService, setSelService] = useState<ServiceItem | null>(null);
  const [payOption, setPayOption] = useState("Full Payment");
  const [bkDate, setBkDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [bkName, setBkName] = useState("");
  const [bkPhone, setBkPhone] = useState("");
  const [bkError, setBkError] = useState("");
  const [bkSaving, setBkSaving] = useState(false);
  const [done, setDone] = useState<{ bookingId: string; service: string; amount: number; option: string } | null>(null);

  const user = getLoggedInUser() as any;

  async function load() {
    try {
      const res = await apiGet<any>(`/salons/${slug}`);
      if (!res.ok) {
        setError(res.message || "Salon load nahi ho paya");
        setLoading(false);
        return;
      }
      setSalon(res.data.salon);
      setServices(res.data.services || []);
      setReviews(res.data.reviews || []);
    } catch {
      setError("Backend offline?");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (slug) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (user) {
      setBkName((v) => v || user.fullName || "");
      setBkPhone((v) => v || user.mobile || "");
    }
  }, [user]);

  const stars = salon?.rating?.stars || 0;
  const galleryImgs = [salon?.image, ...(salon?.images || [])].filter(
    (x): x is string => !!x && x.trim() !== ""
  );
  const workImgs = (salon?.workImages || []).filter((x) => x && x.trim() !== "");

  function mapEmbedSrc(): string {
    if (salon?.googleMapUrl) {
      if (salon.googleMapUrl.includes("embed")) return salon.googleMapUrl;
      if (/^https?:\/\//.test(salon.googleMapUrl)) return salon.googleMapUrl;
    }
    const q = encodeURIComponent(`${salon?.address || ""} ${salon?.city || ""} ${salon?.pincode || ""}`.trim());
    return `https://maps.google.com/maps?q=${q}&output=embed`;
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setBkError("");
    if (!selService) {
      setBkError("Pehle service select karein.");
      return;
    }
    if (!bkName.trim() || !bkPhone.trim() || !bkDate) {
      setBkError("Naam, mobile aur date bharo.");
      return;
    }
    const method = payOption === "No Cost EMI" ? "EMI" : payOption === "Pay from BOB" ? "BOB" : "FULL";
    setBkSaving(true);
    try {
      const res = await apiPost<any>("/bookings", {
        serviceName: selService.name,
        serviceCategory: selService.category || "",
        serviceLocation: "SALON",
        salonId: salon?._id,
        salonName: salon?.name || "",
        address: salon?.address || "",
        date: bkDate,
        timeSlot,
        amount: Number(selService.price || 0),
        paymentMethod: method,
      });
      if (res.ok) {
        const booking = res.data?.booking;
        setDone({
          bookingId: booking?.bookingId || booking?._id || "",
          service: selService.name,
          amount: Number(selService.price || 0),
          option: payOption,
        });
      } else {
        setBkError(
          res.status === 401 || res.status === 403
            ? "Booking ke liye pehle website par login karein. Admin approved customer hi book kar sakta hai."
            : res.message || "Booking create nahi ho payi."
        );
      }
    } catch (err: any) {
      setBkError(err?.message || "Booking fail hui. Backend offline?");
    }
    setBkSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-gray-500">Loading salon...</div>
        <Footer />
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl">💈</div>
          <h1 className="mt-4 text-3xl font-black text-gray-900">Salon Not Found</h1>
          <p className="mt-2 text-gray-500">{error || "Ye salon available nahi hai."}</p>
          <Link href="/salons" className="mt-6 rounded-full bg-pink-600 px-8 py-3 font-bold text-white hover:bg-pink-700">
            ← All Salons
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-white via-pink-50 to-white px-6 py-16">
          <div className="w-full max-w-xl rounded-[30px] bg-white p-10 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">✓</div>
            <h1 className="mt-6 text-3xl font-bold text-gray-900">Booking Request Received</h1>
            {done.bookingId && (
              <p className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm font-bold text-gray-700">
                Booking ID: <span className="text-pink-600">{done.bookingId}</span>
              </p>
            )}
            <p className="mt-4 leading-7 text-gray-600">
              <strong>{salon.name}</strong> me <strong>{done.service}</strong> ke liye
              aapki booking <strong>PENDING</strong> hai — QURUX team aapko WhatsApp par
              confirm karega. ({done.option})
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-8 rounded-full bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700"
            >
              Make Another Booking
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="bg-gradient-to-b from-white via-pink-50 to-white pb-16">
        {/* Hero */}
        <div className="relative h-[320px] w-full overflow-hidden bg-pink-100 md:h-[420px]">
          {galleryImgs[0] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={galleryImgs[0]} alt={salon.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200">
              <span className="text-9xl">💈</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="mx-auto max-w-6xl">
              <p className="flex items-center gap-3">
                <QuruxLogo heightClass="h-9 w-auto brightness-0 invert" />
                <span className="text-sm font-bold uppercase tracking-[0.25em] text-pink-200">PARTNER SALON</span>
              </p>
              <h1 className="mt-2 text-4xl font-black text-white md:text-5xl">{salon.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-white">
                <span className="text-amber-300 text-xl tracking-tight">
                  {"★".repeat(Math.round(stars))}
                  {"☆".repeat(5 - Math.round(stars))}
                </span>
                <span className="font-bold">
                  {salon.rating?.count ? Number(stars).toFixed(1) : "New"}
                </span>
                {salon.rating?.count ? (
                  <span>({salon.rating.count} reviews)</span>
                ) : (
                  <span>(abhi tak koi review nahi — pehli service ke baad milega)</span>
                )}
                <span>• 📍 {salon.address}, {salon.city}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl px-6">
          <Link href="/salons" className="text-sm font-bold text-pink-600 hover:underline">
            ← All Salons
          </Link>

          {/* Book Now CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-pink-600 p-6 text-white shadow-lg">
            <div>
              <p className="text-lg font-black">Is salon me book karein</p>
              <p className="text-sm text-pink-100">
                {services.length} services available — service choose karke booking request submit karein (manual approval).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookOpen(true);
                document.getElementById("salon-book")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full bg-white px-8 py-3 font-bold text-pink-600 hover:bg-pink-50"
            >
              BOOK NOW →
            </button>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* LEFT: details */}
            <div className="space-y-8">
              {/* Gallery */}
              {galleryImgs.length > 1 && (
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-gray-900">Salon Gallery</h2>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {galleryImgs.slice(1).map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt={`${salon.name} ${i}`} className="h-28 w-full rounded-2xl object-cover" />
                    ))}
                  </div>
                </section>
              )}

              {/* Work images */}
              {workImgs.length > 0 && (
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-gray-900">Our Work</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {workImgs.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt="Our work" className="h-32 w-full rounded-2xl object-cover" />
                    ))}
                  </div>
                </section>
              )}

              {/* About */}
              {salon.about && (
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-gray-900">About Salon</h2>
                  <p className="mt-3 leading-7 text-gray-600">{salon.about}</p>
                </section>
              )}

              {/* Address + Map */}
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">Location & Address</h2>
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-bold text-gray-700">{salon.address}</p>
                  <p className="text-sm text-gray-500">
                    {salon.city} {salon.pincode ? `• ${salon.pincode}` : ""}
                  </p>
                  <a
                    href={mapEmbedSrc()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-bold text-pink-600 hover:underline"
                  >
                    📍 Open in Google Maps →
                  </a>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                  <iframe
                    src={mapEmbedSrc()}
                    title="Google Map"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>

              {/* Reviews */}
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">
                  Customer Reviews{" "}
                  {salon.rating?.count ? (
                    <span className="text-sm font-bold text-pink-600">
                      ({Number(stars).toFixed(1)} ★ • {salon.rating.count})
                    </span>
                  ) : null}
                </h2>
                {reviews.length === 0 ? (
                  <p className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
                    Abhi tak koi review nahi — is salon se service lene ke baad aapka review yahan dikhega.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {reviews.map((r) => (
                      <div key={r._id} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-800">{r.customerName}</p>
                          <span className="text-amber-400">{"★".repeat(Math.round(r.stars))}</span>
                        </div>
                        {r.customerRemarks && <p className="mt-1 text-sm text-gray-600">{r.customerRemarks}</p>}
                        <p className="mt-1 text-xs text-gray-400">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT: services card */}
            <aside className="h-fit rounded-3xl bg-white p-6 shadow-lg lg:sticky lg:top-4">
              <h2 className="text-xl font-black text-gray-900">Available Services</h2>
              <p className="mt-1 text-xs text-gray-500">Is salon me ye services milti hain.</p>
              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                {services.length === 0 ? (
                  <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                    Is salon ki service list admin approval ke waqt assign ki jaati hai — abhi koi service assign nahi hui.
                  </div>
                ) : (
                  services.map((s) => {
                    const thumb = serviceThumb(s);
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setSelService(s);
                          setBookOpen(true);
                          document.getElementById("salon-book")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50"
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={s.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-2xl">
                            {catEmojiFor(s)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-gray-900">{s.name}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {s.category ? `${s.category} • ` : ""}
                            {s.duration || ""}
                          </span>
                          <span className="mt-1 block font-bold text-pink-600">{fmtPrice(s.price)}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-[11px] leading-5 text-yellow-800">
                Service select karke BOOK NOW dabayein — booking request admin approve
                karega (manual WhatsApp process).
              </p>
            </aside>
          </div>

          {/* Booking panel */}
          <div id="salon-book" className="mt-10 scroll-mt-24">
            {bookOpen && (
              <section className="rounded-3xl bg-white p-6 shadow-xl md:p-10">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">BOOK AT {salon.name.toUpperCase()}</p>
                <h2 className="mt-2 text-3xl font-black text-gray-900">Book a Service</h2>

                {/* 1. Service select — pehle service chuno (login ke baad aage badho) */}
                <div className="mt-8">
                  <p className="mb-3 font-semibold text-gray-800">1. Service Choose Karein *</p>
                  {services.length === 0 ? (
                    <p className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
                      Is salon ki service list admin approval ke waqt assign ho rahi hai — abhi koi service available nahi.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {services.map((s) => {
                        const thumb = serviceThumb(s);
                        return (
                          <label
                            key={s._id}
                            className={`cursor-pointer rounded-2xl border p-3 transition ${
                              selService?._id === s._id ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-pink-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt={s.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                              ) : (
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-2xl">
                                  {catEmojiFor(s)}
                                </span>
                              )}
                              <input
                                type="radio"
                                name="service"
                                checked={selService?._id === s._id}
                                onChange={() => setSelService(s)}
                                className="h-4 w-4 shrink-0 accent-pink-600"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block font-bold text-gray-900">{s.name}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">
                                  {s.category ? `${s.category} • ` : ""}
                                  {s.duration || ""}
                                </span>
                                <span className="mt-1 block font-bold text-pink-600">{fmtPrice(s.price)}</span>
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!user && (
                  <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-sm font-bold text-blue-800">🔐 LOGIN REQUIRED</p>
                    <p className="mt-1 text-sm leading-6 text-blue-700">
                      Service select karke booking karne ke liye website par login karein (User ID + Password). Nahi hai to sign up karein.
                    </p>
                    <Link href="/account" className="mt-3 inline-block rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700">
                      Login / Sign Up →
                    </Link>
                  </div>
                )}

                {user && selService && (
                  <form onSubmit={submitBooking} className="mt-8 space-y-7">
                    {/* Payment option */}
                    <div>
                      <p className="mb-3 font-semibold text-gray-800">2. Payment Option *</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {["Full Payment", "No Cost EMI", "Pay from BOB"].map((opt) => (
                          <label
                            key={opt}
                            className={`cursor-pointer rounded-2xl border p-4 transition ${
                              payOption === opt ? "border-pink-500 bg-pink-50" : "border-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name="pay"
                              checked={payOption === opt}
                              onChange={() => setPayOption(opt)}
                              className="mr-2 h-4 w-4 accent-pink-600"
                            />
                            <span className="font-bold text-gray-900">{opt}</span>
                            {opt === "No Cost EMI" && (
                              <p className="mt-1 text-xs text-gray-500">25% down + 75% flexible EMI</p>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="mb-3 font-semibold text-gray-800">3. Aapki Details</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Full Name *"
                          value={bkName}
                          onChange={(e) => setBkName(e.target.value)}
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500"
                        />
                        <input
                          type="tel"
                          placeholder="Mobile Number *"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          value={bkPhone}
                          onChange={(e) => setBkPhone(e.target.value)}
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="mb-3 font-semibold text-gray-800">4. Date & Time Slot</p>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={bkDate}
                        onChange={(e) => setBkDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 md:w-64"
                      />
                      <div className="mt-4">
                        <TimeSlotPicker value={timeSlot} onChange={setTimeSlot} />
                      </div>
                    </div>

                    {bkError && (
                      <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">❌ {bkError}</div>
                    )}

                    <button
                      type="submit"
                      disabled={bkSaving}
                      className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-pink-700 disabled:opacity-50"
                    >
                      {bkSaving ? "SUBMITTING..." : `SUBMIT BOOKING REQUEST — ${fmtPrice(selService.price)}`}
                    </button>
                    <p className="text-center text-xs text-gray-500">
                      Booking request admin WhatsApp pe confirm karega — manual approval process.
                    </p>
                  </form>
                )}
              </section>
            )}
          </div>

          {/* Bottom Book CTA — sabse neeche Book Now option */}
          <div className="mt-8 rounded-3xl bg-gradient-to-r from-rose-900 via-pink-700 to-pink-600 p-7 text-center text-white shadow-xl">
            <p className="text-xl font-black md:text-2xl">Is salon me appointment book karein</p>
            <p className="mt-1 text-sm text-pink-100">
              Neeche diye services me se koi service chuno — booking request admin approve karke vendor ko assign karega.
            </p>
            <button
              type="button"
              onClick={() => {
                setBookOpen(true);
                document.getElementById("salon-book")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-5 rounded-full bg-white px-10 py-3 font-black text-rose-900 shadow-lg hover:bg-pink-50"
            >
              BOOK NOW — {salon.name} →
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
