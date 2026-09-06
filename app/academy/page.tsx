"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QuruxLogo from "@/components/QuruxLogo";
import { apiGet, apiPost, getLoggedInUser } from "@/lib/api";

type CourseItem = {
  _id: string;
  slug: string;
  title: string;
  duration: string;
  hours: string;
  fee: string;
  level: string;
  image: string;
  description: string;
  topics: string[];
};

function levelLabel(l: string): string {
  return l === "PROFESSIONAL"
    ? "Professional"
    : l === "ADVANCED"
      ? "Advanced"
      : "Beginner";
}

function fmtFee(n: any): string {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function AcademyPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Live courses from backend /api/courses (admin /admin/courses se manage hote hain)
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await apiGet<any[]>("/courses");
        if (!alive) return;
        if (res.ok) {
          setCourses(
            (res.data || []).map((c: any) => ({
              _id: c._id,
              slug: c.slug,
              title: c.title,
              duration: c.duration || "",
              hours: c.hours || "",
              fee: fmtFee(c.fee),
              level: levelLabel(c.level),
              image: c.image || "",
              description: c.description || "",
              topics: c.topics || [],
            }))
          );
        } else {
          setLoadError(res.message || "Courses load nahi ho paye.");
        }
      } catch (err: any) {
        if (alive) setLoadError(err?.message || "Courses load nahi ho paye.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollOrderId, setEnrollOrderId] = useState("");

  const loggedInUser = getLoggedInUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    payment: "FULL",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // RULE (master note #8): course order submit → order PENDING, koi payment abhi
  // nahi. Admin WhatsApp pe verify karke /admin/orders me payment update karega
  // (FULL/EMI 25-75/BOB) aur enrollment confirm karega.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!loggedInUser) {
      setEnrollError("Enroll karne ke liye pehle website par login karein (/account).");
      return;
    }
    setSaving(true);
    setEnrollError("");
    try {
      const res = await apiPost<any>("/orders", {
        items: [{ courseId: selectedCourse._id || selectedCourse.slug, quantity: 1 }],
        paymentMethod: formData.payment,
      });
      if (!res.ok) {
        setEnrollError(
          (res as any)?.data?.message || res.message || "Enrollment request submit nahi ho payi."
        );
        return;
      }
      setEnrollOrderId((res.data as any)?.order?.orderId || "");
      setSubmitted(true);
    } catch (err: any) {
      setEnrollError(err?.message || "Enrollment request submit nahi ho payi.");
    } finally {
      setSaving(false);
    }
  }

  function openDetails(course: CourseItem) {
    setSelectedCourse(course);
    setSubmitted(false);
    setEnrollError("");

    setFormData({
      name: loggedInUser?.fullName || "",
      email: loggedInUser?.email || "",
      phone: loggedInUser?.mobile || "",
      payment: "FULL",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function backToCourses() {
    setSelectedCourse(null);
    setSubmitted(false);
    setEnrollError("");
    setEnrollOrderId("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     GET DETAILS / APPLICANT FORM
  ===================================================== */

  if (selectedCourse) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white">

        {/* Back */}
        <div className="mx-auto max-w-6xl px-6 pt-8">

          <button
            type="button"
            onClick={backToCourses}
            className="font-semibold text-pink-600 transition hover:text-pink-700"
          >
            ← Back to Courses
          </button>

        </div>

        <section className="mx-auto max-w-3xl px-6 py-12">

          <div className="overflow-hidden rounded-[32px] bg-white shadow-xl">

            {/* Course Image */}
            {selectedCourse.image ? (
              <div className="relative h-[300px] w-full overflow-hidden md:h-[420px]">

                <img
                  src={selectedCourse.image}
                  alt={selectedCourse.title}
                  className="h-full w-full object-cover"
                />

              </div>
            ) : (
              <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">

                <p className="flex items-center justify-center gap-2">
                  <QuruxLogo heightClass="h-9 w-auto" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600">ACADEMY</span>
                </p>

              </div>
            )}

            <div className="p-8 md:p-12">

              {!submitted ? (
                <>
                  {/* Heading */}
                  <div className="text-center">

                    <p className="flex items-center justify-center gap-3">
                      <QuruxLogo heightClass="h-10 w-auto md:h-11" />
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600 md:text-sm">MAKEOVER &amp; ACADEMY</span>
                    </p>

                    <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
                      Enroll in This Course
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
                      Apni course seat book karein. Payment abhi nahi lena hai —
                      admin aapki enrollment request verify karke payment update
                      karega (Full / No Cost EMI / BOB).
                    </p>

                  </div>

                  {/* Selected Course */}
                  <div className="mt-8 rounded-2xl bg-pink-50 p-6">

                    <p className="text-sm font-medium text-gray-500">
                      Selected Course
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {selectedCourse.title}
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-3">

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700">
                        {selectedCourse.duration}
                      </span>

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-600">
                        {selectedCourse.hours}
                      </span>

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-pink-600">
                        {selectedCourse.fee}
                      </span>

                    </div>

                  </div>

                  {/* Applicant Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-6"
                  >

                    {/* Full Name */}
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
                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      />

                    </div>

                    {/* Email */}
                    <div>

                      <label
                        htmlFor="email"
                        className="mb-2 block font-semibold text-gray-800"
                      >
                        Email Address
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      />

                    </div>

                    {/* Mobile */}
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
                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        Please enter a valid 10 digit mobile number.
                      </p>

                    </div>

                    {/* Payment Mode — RULE: abhi koi payment nahi, sirf mode select */}
                    <div>
                      <p className="mb-3 font-semibold text-gray-800">
                        Payment Option
                      </p>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { value: "FULL", label: "Full Payment", emoji: "💵" },
                          { value: "EMI", label: "No Cost EMI", emoji: "📊" },
                          { value: "BOB", label: "Pay from BOB", emoji: "🏦" },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition ${
                              formData.payment === opt.value
                                ? "border-pink-500 bg-pink-50"
                                : "border-gray-200 bg-white hover:border-pink-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={opt.value}
                              checked={formData.payment === opt.value}
                              onChange={handleChange}
                              className="hidden"
                            />
                            <p className="text-2xl">{opt.emoji}</p>
                            <p className="mt-1 text-sm font-bold text-gray-800">{opt.label}</p>
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Booking/EMI payment service ke baad hota hai — admin verify karke update karega.
                      </p>
                    </div>

                    {/* Login required note */}
                    {!loggedInUser && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <p className="text-sm font-bold text-blue-800">🔐 LOGIN REQUIRED</p>
                        <p className="mt-1 text-sm leading-6 text-blue-700">
                          Enrollment karne ke liye website par login karein
                          (User ID + Password se). Agar User ID nahi hai to pehle sign up karein.
                        </p>
                        <a
                          href="/account"
                          className="mt-3 inline-block rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
                        >
                          Login / Sign Up →
                        </a>
                      </div>
                    )}

                    {/* Error */}
                    {enrollError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                        ❌ {enrollError}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={saving || !loggedInUser}
                      className={`w-full rounded-full px-8 py-4 text-lg font-bold text-white shadow-lg transition ${
                        saving || !loggedInUser
                          ? "cursor-not-allowed bg-gray-300"
                          : "bg-pink-600 hover:bg-pink-700"
                      }`}
                    >
                      {saving ? "SUBMITTING..." : "SUBMIT ENROLLMENT REQUEST"}
                    </button>

                    <p className="text-center text-xs leading-5 text-gray-500">
                      Enrollment request admin ko jayegi — admin WhatsApp pe payment
                      verify karke confirm karega. EMI select kiya to 25% down + 75%
                      EMI balance aapke EMI details me dikhega.
                    </p>

                  </form>
                </>
              ) : (
                /* SUCCESS */
                <div className="text-center">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-600 text-4xl font-bold text-white">
                    ✓
                  </div>

                  <p className="mt-7 flex items-center justify-center gap-3">
                    <QuruxLogo heightClass="h-10 w-auto md:h-11" />
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600 md:text-sm">MAKEOVER &amp; ACADEMY</span>
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-gray-900">
                    Enrollment Request Submitted
                  </h2>

                  <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-600">
                    Aapki course enrollment request bana di gayi hai — abhi koi
                    payment nahi lena hai. Admin aapki request verify karke
                    payment update karega aur course confirm karega.
                  </p>

                  <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50 p-5">
                    <p className="text-sm font-bold text-pink-700">📋 ENROLLMENT REQUEST</p>
                    <p className="mt-1 text-lg font-black text-gray-900">
                      {enrollOrderId || selectedCourse.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{selectedCourse.title}</p>
                    <p className="mt-1 text-sm font-bold text-pink-600">
                      {selectedCourse.fee} • {formData.payment === "EMI" ? "No Cost EMI" : formData.payment === "BOB" ? "Pay from BOB" : "Full Payment"}
                    </p>
                  </div>

                  <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-gray-500">
                    Admin approve hone par aapko WhatsApp pe confirmation milegi.
                    EMI choose kiya hai to 25% abhi + 75% balance EMI repayment
                    me — details aapke account ke EMI section me dikhenge.
                  </p>

                  <button
                    type="button"
                    onClick={backToCourses}
                    className="mt-8 rounded-full bg-pink-600 px-8 py-3.5 font-bold text-white transition hover:bg-pink-700"
                  >
                    BACK TO COURSES
                  </button>

                </div>
              )}

            </div>

          </div>

        </section>

        {/* Bottom */}
        <section className="bg-pink-600 px-6 py-14 text-center text-white">

          <p className="flex items-center justify-center gap-3">
            <QuruxLogo heightClass="h-12 w-auto brightness-0 invert" />
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-pink-100">ACADEMY</span>
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Learn. Practice. Create. Become Professional.
          </h2>

        </section>

      </main>
    );
  }

  /* =====================================================
     COURSES PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white">

      {/* HEADER */}
      <section className="px-6 pb-12 pt-16 text-center">

        <p className="flex items-center justify-center gap-3">
          <QuruxLogo heightClass="h-14 w-auto" />
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">MAKEOVER &amp; ACADEMY</span>
        </p>

        <h1 className="mt-4 text-4xl font-bold text-gray-900 md:text-6xl">
          Professional Beauty Courses
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-600">
          Learn professional beauty skills through structured
          theory, trainer demonstrations and hands-on practical
          training.
        </p>

        {/* HOME BUTTON */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border-2 border-pink-600 bg-white px-7 py-3 font-bold text-pink-600 shadow-sm transition hover:bg-pink-600 hover:text-white"
          >
            ← HOME
          </Link>
        </div>

        {/* TRAINING METHOD */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-5 shadow-md">

            <div className="text-3xl">
              📚
            </div>

            <h3 className="mt-3 font-bold text-gray-900">
              THEORY
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Strong technical foundation
            </p>

          </div>

          <div className="rounded-2xl bg-white p-5 shadow-md">

            <div className="text-3xl">
              🎬
            </div>

            <h3 className="mt-3 font-bold text-gray-900">
              DEMONSTRATION
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Step-by-step trainer guidance
            </p>

          </div>

          <div className="rounded-2xl bg-white p-5 shadow-md">

            <div className="text-3xl">
              💄
            </div>

            <h3 className="mt-3 font-bold text-gray-900">
              PRACTICAL
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Hands-on model practice
            </p>

          </div>

        </div>

      </section>

      {/* COURSES */}
      <section className="mx-auto max-w-7xl px-6 pb-20">

        <div className="mb-10 text-center">

          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            EXPLORE COURSES
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
            Choose Your Learning Path
          </h2>

        </div>

        {loadError ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-4xl">⚠️</p>
            <p className="mt-3 font-bold text-red-700">{loadError}</p>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-gray-500">
            Courses load ho rahe hain...
          </div>
        ) : courses.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-[28px] bg-white p-10 text-center shadow-lg">
            <div className="text-6xl">🎓</div>
            <h3 className="mt-5 text-2xl font-bold text-gray-900">
              Courses Jald Aa Rahe Hain
            </h3>
            <p className="mt-3 leading-7 text-gray-600">
              Academy courses jald hi available honge. Enrollment ke liye
              abhi call karein: 9911227916
            </p>
          </div>
        ) : (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">

          {courses.map((course) => (
            <div
              key={course.title}
              className="group overflow-hidden rounded-[28px] bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >

              {/* COURSE IMAGE */}
              {course.image ? (
                <div className="relative h-[300px] overflow-hidden bg-pink-50">

                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute left-5 top-5 rounded-full bg-pink-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    {course.level}
                  </div>

                </div>
              ) : (
                <div className="relative flex h-[300px] items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-100">

                  <div className="text-center">

                    <p className="flex items-center justify-center gap-2">
                      <QuruxLogo heightClass="h-9 w-auto" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">ACADEMY</span>
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      Course Image Coming Soon
                    </p>

                  </div>

                  <div className="absolute left-5 top-5 rounded-full bg-pink-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    {course.level}
                  </div>

                </div>
              )}

              {/* CONTENT */}
              <div className="p-7">

                <h3 className="text-2xl font-bold leading-tight text-gray-900">
                  {course.title}
                </h3>

                <p className="mt-4 leading-7 text-gray-600">
                  {course.description}
                </p>

                {/* DAYS + HOURS */}
                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-gray-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Duration
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {course.duration}
                    </p>

                  </div>

                  <div className="rounded-2xl bg-pink-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                      Training
                    </p>

                    <p className="mt-1 text-lg font-bold text-pink-600">
                      {course.hours}
                    </p>

                  </div>

                </div>

                {/* FEE */}
                <div className="mt-5 rounded-2xl bg-pink-50 p-5">

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Course Fee
                  </p>

                  <p className="mt-1 text-3xl font-bold text-pink-600">
                    {course.fee}
                  </p>

                </div>

                {/* TOPICS */}
                <div className="mt-6">

                  <p className="font-bold text-gray-900">
                    Training Includes
                  </p>

                  <ul className="mt-4 space-y-2">

                    {course.topics.map((topic) => (
                      <li
                        key={topic}
                        className="flex items-start gap-3 text-sm text-gray-600"
                      >

                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                          ✓
                        </span>

                        <span>
                          {topic}
                        </span>

                      </li>
                    ))}

                  </ul>

                </div>

                {/* TRAINING */}
                <div className="mt-6 rounded-2xl border border-pink-100 bg-white p-4">

                  <p className="font-bold text-gray-900">
                    Theory + Demonstration + Practical
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Learn the concept, watch the trainer
                    demonstration and practice the technique
                    hands-on.
                  </p>

                </div>

                {/* PAYMENT */}
                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-gray-50 p-3 text-center">

                    <p className="text-xs text-gray-500">
                      Payment
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800">
                      Full Payment
                    </p>

                  </div>

                  <div className="rounded-xl bg-pink-50 p-3 text-center">

                    <p className="text-xs text-pink-600">
                      Available
                    </p>

                    <p className="mt-1 text-sm font-bold text-pink-600">
                      No Cost EMI
                    </p>

                  </div>

                </div>

                {/* GET DETAILS */}
                <button
                  type="button"
                  onClick={() => openDetails(course)}
                  className="mt-7 w-full rounded-full bg-pink-600 px-6 py-3.5 text-center font-bold text-white transition hover:bg-pink-700"
                >
                  GET DETAILS →
                </button>

              </div>

            </div>
          ))}

        </div>
        )}

      </section>

      {/* FINAL SECTION */}
      <section className="bg-pink-600 px-6 py-14 text-center text-white">

        <p className="flex items-center justify-center gap-3">
          <QuruxLogo heightClass="h-12 w-auto brightness-0 invert" />
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-pink-100">ACADEMY</span>
        </p>

        <h2 className="mt-4 text-3xl font-bold md:text-4xl">
          Learn. Practice. Create. Become Professional.
        </h2>

        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/90">
          Every course is designed to combine technical knowledge,
          trainer demonstration and practical experience.
        </p>

      </section>

    </main>
  );
}
