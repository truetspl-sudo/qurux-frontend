"use client";

import Link from "next/link";

const cards = [
  {
    title: "BOOK",
    subtitle: "Luxury Makeup Services",
    image: "/cards/book.jpg",
    href: "/book",
  },
  {
    title: "BUY",
    subtitle: "Professional Beauty Products",
    image: "/cards/buy.jpg",
    href: "/shop",
  },
  {
    title: "LEARN",
    subtitle: "Professional Makeup Academy",
    image: "/cards/learn.jpg",
    href: "/academy",
  },
  {
    title: "BOB",
    subtitle: "Bank of Beauty",
    image: "/cards/bob.jpg",
    href: "/bob",
  },
];

export default function FeatureCards() {
  return (
    <section
      className="relative z-10 mt-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg,#ffffff 0%,#fff7fb 15%,#fdeaf4 35%,#fbd5e7 60%,#f7bdd8 85%,#f4aacb 100%)",
      }}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 px-2 py-10 md:grid-cols-2 lg:grid-cols-4">

        {cards.map((card) => (
          <div
            key={card.title}
            className="group relative rounded-[38px] bg-gradient-to-br from-rose-900 via-rose-600 to-amber-500 p-[3px] shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_35px_85px_rgba(159,18,57,.45)]"
          >
            {/* Gold sheen ring on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-[38px] bg-gradient-to-tr from-amber-400/0 via-amber-300/60 to-rose-300/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <Link
              href={card.href}
              className="block overflow-hidden rounded-[35px] bg-white"
            >

              {/* IMAGE - 70% */}
              <div className="relative h-[390px] w-full overflow-hidden bg-pink-100">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-fill transition duration-700 group-hover:scale-[1.02]"
                />
              </div>

              {/* TEXT - 30% */}
              <div className="relative h-[180px] bg-gradient-to-b from-gray-700 to-black px-7 py-5">

                <h2 className="text-4xl font-bold tracking-[0.15em] text-white">
                  {card.title}
                </h2>

                <p className="mt-2 text-base leading-6 text-white/90">
                  {card.subtitle}
                </p>

                <div className="mt-4 inline-block rounded-full bg-pink-600 px-7 py-2.5 font-semibold text-white transition duration-300 group-hover:scale-105 group-hover:bg-pink-700">
                  Explore →
                </div>

              </div>
            </Link>
          </div>
        ))}

      </div>
    </section>
  );
}