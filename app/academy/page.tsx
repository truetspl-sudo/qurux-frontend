"use client";

import Link from "next/link";
import { useState } from "react";

const courses = [
  {
    title: "Basic Makeup Artist Course",
    duration: "15 Days",
    hours: "45 Hours",
    fee: "₹26,999",
    level: "Beginner",
    image: "/course-images/basic-makeup-artist.jpg",
    description:
      "Build a strong foundation in professional makeup techniques, products, tools and client preparation.",
    topics: [
      "Makeup fundamentals",
      "Skin preparation",
      "Face shapes",
      "Colour theory",
      "Base & complexion",
      "Eye & lip makeup",
      "Product & brush knowledge",
      "Hygiene & sanitation",
    ],
  },

  {
    title: "Professional Makeup Artist Course",
    duration: "30 Days",
    hours: "90 Hours",
    fee: "₹49,999",
    level: "Professional",
    image: "/course-images/professional-makeup-artist.jpg",
    description:
      "A complete professional makeup course combining theory, trainer demonstrations and hands-on model practice.",
    topics: [
      "Professional makeup techniques",
      "Party makeup",
      "Engagement makeup",
      "Reception makeup",
      "Eye makeup",
      "Lashes & lip detailing",
      "Client consultation",
      "Hands-on model practice",
    ],
  },

  {
    title: "Advanced Bridal & HD Makeup Course",
    duration: "45 Days",
    hours: "135 Hours",
    fee: "₹74,999",
    level: "Advanced",
    image: "/course-images/advanced-bridal-hd-makeup.jpg",
    description:
      "Advanced bridal training covering traditional bridal looks, HD techniques, long-wear preparation and professional finishing.",
    topics: [
      "Bridal makeup",
      "HD makeup",
      "Long-wear preparation",
      "Bridal eye makeup",
      "Colour correction",
      "Face detailing",
      "Bridal look planning",
      "Live model practice",
    ],
  },

  {
    title: "Professional Hair Styling Course",
    duration: "30 Days",
    hours: "90 Hours",
    fee: "₹39,999",
    level: "Professional",
    image: "",
    description:
      "Learn professional hair styling techniques for bridal, party and special-event looks.",
    topics: [
      "Hair preparation",
      "Blow-dry techniques",
      "Curls & waves",
      "Straight styling",
      "Bridal hairstyles",
      "Party hairstyles",
      "Hair accessories",
      "Hands-on practice",
    ],
  },

  {
    title: "Skin & Beauty Therapy Course",
    duration: "30 Days",
    hours: "90 Hours",
    fee: "₹34,999",
    level: "Professional",
    image: "",
    description:
      "Learn essential skin-care and beauty-service techniques with theory, demonstrations and practical training.",
    topics: [
      "Skin fundamentals",
      "Skin analysis",
      "Cleansing techniques",
      "Facial procedures",
      "Exfoliation",
      "Massage techniques",
      "Product knowledge",
      "Practical sessions",
    ],
  },

  {
    title: "Complete Beauty Artist Course",
    duration: "3 Months",
    hours: "270 Hours",
    fee: "₹89,999",
    level: "Professional",
    image: "",
    description:
      "A comprehensive beauty training program combining makeup, hair styling and essential beauty services.",
    topics: [
      "Professional makeup",
      "Bridal makeup",
      "HD makeup",
      "Hair styling",
      "Skin care",
      "Facial services",
      "Beauty grooming",
      "Professional practice",
    ],
  },

  {
    title: "Advanced Professional Makeup & Hair",
    duration: "2 Months",
    hours: "180 Hours",
    fee: "₹99,999",
    level: "Advanced",
    image: "",
    description:
      "Advanced professional training for students who want to develop complete makeup and hair styling skills.",
    topics: [
      "Advanced makeup",
      "Bridal looks",
      "HD techniques",
      "Eye artistry",
      "Advanced hair styling",
      "Look coordination",
      "Client handling",
      "Professional model practice",
    ],
  },
];

export default function AcademyPage() {
  const [selectedCourse, setSelectedCourse] = useState<
    (typeof courses)[number] | null
  >(null);

  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function openDetails(course: (typeof courses)[number]) {
    setSelectedCourse(course);
    setSubmitted(false);

    setFormData({
      name: "",
      email: "",
      phone: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function backToCourses() {
    setSelectedCourse(null);
    setSubmitted(false);

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

                <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-600">
                  QURUX ACADEMY
                </p>

              </div>
            )}

            <div className="p-8 md:p-12">

              {!submitted ? (
                <>
                  {/* Heading */}
                  <div className="text-center">

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                      QURUX MAKEOVER & ACADEMY
                    </p>

                    <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
                      Get Course Details
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
                      Fill in your details and our academy team
                      will contact you with complete information
                      about the selected course.
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

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full rounded-full bg-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-pink-700"
                    >
                      SUBMIT APPLICATION
                    </button>

                    <p className="text-center text-xs leading-5 text-gray-500">
                      By submitting this form, you are requesting
                      course information from QURUX MAKEOVER &
                      ACADEMY.
                    </p>

                  </form>
                </>
              ) : (
                /* SUCCESS */
                <div className="text-center">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-600 text-4xl font-bold text-white">
                    ✓
                  </div>

                  <p className="mt-7 text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                    QURUX MAKEOVER & ACADEMY
                  </p>

                  <h2 className="mt-4 text-3xl font-bold text-gray-900">
                    Application Submitted
                  </h2>

                  <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-600">
                    Thank you for your interest in QURUX MAKEOVER &
                    ACADEMY. Our academy team will contact you
                    shortly with complete course information.
                  </p>

                  <div className="mt-7 rounded-2xl bg-pink-50 p-6">

                    <p className="text-sm text-gray-500">
                      Course Applied For
                    </p>

                    <p className="mt-2 text-xl font-bold text-pink-600">
                      {selectedCourse.title}
                    </p>

                  </div>

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

          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-100">
            QURUX ACADEMY
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

        <p className="text-sm font-bold uppercase tracking-[0.35em] text-pink-600">
          QURUX MAKEOVER & ACADEMY
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

                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-500">
                      QURUX ACADEMY
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

      </section>

      {/* FINAL SECTION */}
      <section className="bg-pink-600 px-6 py-14 text-center text-white">

        <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-100">
          QURUX ACADEMY
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
