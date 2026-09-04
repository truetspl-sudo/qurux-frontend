"use client";

import QuruxLogo from "./QuruxLogo";

export default function WhyChoose() {
  const features = [
    {
      emoji: "👑",
      title: "Certified Bridal Artists",
      text: "Highly trained professionals for luxury bridal and party makeovers.",
      ring: "from-rose-800 via-pink-600 to-amber-400",
      disc: "from-rose-700 via-pink-600 to-rose-500",
      badge: "💍 Bridal & Party Experts",
      glow: "hover:shadow-[0_24px_55px_-15px_rgba(159,18,57,.45)]",
      chip: "bg-rose-50 text-rose-700",
    },
    {
      emoji: "💎",
      title: "Premium Beauty Products",
      text: "We use only trusted international and premium beauty brands.",
      ring: "from-amber-500 via-yellow-400 to-rose-500",
      disc: "from-amber-500 via-yellow-400 to-amber-600",
      badge: "✨ Trusted International Brands",
      glow: "hover:shadow-[0_24px_55px_-15px_rgba(217,119,6,.4)]",
      chip: "bg-amber-50 text-amber-700",
    },
    {
      emoji: "💳",
      title: "No Cost EMI",
      text: "Get Bridal Makeup, Beauty Services, Professional Products and Academy Courses on No Cost EMI without any credit card.",
      ring: "from-pink-700 via-fuchsia-500 to-pink-400",
      disc: "from-fuchsia-600 via-pink-600 to-fuchsia-500",
      badge: "🪪 No Credit Card • No CIBIL Check",
      glow: "hover:shadow-[0_24px_55px_-15px_rgba(219,39,119,.45)]",
      chip: "bg-pink-50 text-pink-700",
    },
    {
      emoji: "🎓",
      title: "Professional Academy",
      text: "Industry-ready makeup courses with certification and practical training.",
      ring: "from-indigo-800 via-violet-600 to-fuchsia-400",
      disc: "from-indigo-600 via-violet-600 to-fuchsia-500",
      badge: "📜 Certified Courses & Training",
      glow: "hover:shadow-[0_24px_55px_-15px_rgba(109,40,217,.45)]",
      chip: "bg-indigo-50 text-indigo-700",
    },
  ];

  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-b from-pink-100 via-pink-50 to-white py-20">
      {/* Decorative soft blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-rose-700 shadow-sm backdrop-blur">
            ✦ The QURUX Promise ✦
          </span>

          <h2 className="mt-6 flex flex-wrap items-end justify-center gap-x-3 text-4xl font-black leading-tight tracking-tight text-gray-900 md:text-5xl">
            <span>Why Choose</span>
            <QuruxLogo heightClass="h-16 w-auto md:h-24" />
            <span>?</span>
          </h2>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700 md:text-base">
              Luxury Beauty ✦ Premium Products ✦ Easy No Cost EMI
            </p>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div
              key={item.title}
              className={`group relative rounded-[26px] bg-gradient-to-br ${item.ring} p-[2px] shadow-lg shadow-pink-900/10 transition-all duration-500 hover:-translate-y-2 ${item.glow}`}
            >
              {/* Inner white card */}
              <div className="relative h-full overflow-hidden rounded-[24px] bg-white p-6 pt-8 text-center">
                {/* Soft sheen on hover */}
                <div className="pointer-events-none absolute -top-20 left-1/2 h-28 w-44 -translate-x-1/2 rounded-full bg-gradient-to-b from-pink-100/90 to-transparent blur-xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60" />
                {/* Floating sparkles */}
                <span className="pointer-events-none absolute right-5 top-4 text-xs text-amber-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  ✦
                </span>
                <span className="pointer-events-none absolute left-5 top-10 text-[10px] text-rose-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  ✧
                </span>

                {/* Icon medallion */}
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
                  <div
                    className={`absolute inset-0 rotate-45 rounded-2xl bg-gradient-to-br ${item.disc} shadow-lg transition-transform duration-500 group-hover:rotate-[135deg]`}
                  />
                  <div className="absolute inset-[5px] rotate-45 rounded-xl bg-white/20 ring-1 ring-white/50 backdrop-blur-sm" />
                  <span className="relative text-4xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                    {item.emoji}
                  </span>
                  {/* Gold stud */}
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[9px] text-white shadow ring-2 ring-white">
                    ✦
                  </span>
                </div>

                <h3 className="text-lg font-black leading-snug text-gray-900">{item.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">{item.text}</p>

                <span
                  className={`mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-bold ${item.chip}`}
                >
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
