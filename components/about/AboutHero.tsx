export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-pink-500 to-pink-400 py-28">

      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">

        <p className="mb-5 text-lg font-semibold uppercase tracking-[0.35em] text-pink-100">
          Welcome To
        </p>

        <h1 className="text-6xl font-extrabold text-white">
          QURUX
        </h1>

        <h2 className="mt-2 text-3xl font-semibold tracking-[0.25em] text-pink-100">
          MAKEOVER & ACADEMY
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-white/90">
          Luxury Bridal Makeup, Premium Beauty Services,
          Professional Makeup Academy and Beauty Products —
          all under one trusted destination.
        </p>

        <div className="mt-12 flex justify-center gap-6">

          <button className="rounded-full bg-white px-10 py-4 text-lg font-bold text-pink-600 shadow-xl transition hover:scale-105">
            Book Appointment
          </button>

          <button className="rounded-full border-2 border-white px-10 py-4 text-lg font-bold text-white transition hover:bg-white hover:text-pink-600">
            Explore Academy
          </button>

        </div>

      </div>

    </section>
  );
}