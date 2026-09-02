export default function AboutContent() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900">
            About <span className="text-pink-600">QURUX</span>
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Luxury Beauty • Professional Education • Premium Beauty Solutions
          </p>
        </div>

        {/* Company Profile */}
        <div className="mt-14 rounded-3xl border border-pink-100 bg-white p-10 shadow-xl">

          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Company Profile
          </h2>

          <p className="text-lg leading-9 text-gray-700">
            <strong>QURUX Makeover & Academy</strong> is a premium beauty company
            offering luxury salon services, professional makeup education and
            complete beauty solutions under one trusted brand. We are committed
            to delivering excellence through creativity, quality and customer
            satisfaction.
          </p>

          <p className="mt-6 text-lg leading-9 text-gray-700">
            Our services include Luxury Bridal Makeup, Pre-Bridal Packages,
            Party Makeup, Hair Styling, Skin Care, Beauty Treatments and
            Professional Makeup Courses designed to meet modern beauty
            industry standards.
          </p>

          <p className="mt-6 text-lg leading-9 text-gray-700">
            Along with our salon and academy, we proudly present
            <span className="font-semibold text-pink-600">
              {" "}ESSN Cosmetics
            </span>,
            our premium cosmetics brand powered by
            <strong> QURUX Makeover & Academy</strong>, offering high-quality
            beauty products for professionals and everyday users.
          </p>

          <p className="mt-6 text-lg leading-9 text-gray-700">
            At QURUX, we believe beauty is not just about appearance—it is about
            confidence, elegance and self-expression. Every client receives
            personalized attention and premium service to ensure an exceptional
            beauty experience.
          </p>

        </div>

        {/* Business Divisions */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Our Business Divisions
          </h2>

          <div className="grid gap-8 md:grid-cols-3">

            <div className="rounded-3xl bg-pink-50 p-8 shadow-lg">
              <div className="text-5xl">💄</div>

              <h3 className="mt-5 text-2xl font-bold text-pink-600">
                Salon Services
              </h3>

              <p className="mt-4 leading-8 text-gray-700">
                Luxury Bridal Makeup, Party Makeup, Hair Styling,
                Skin Care and Professional Beauty Services.
              </p>
            </div>

            <div className="rounded-3xl bg-pink-50 p-8 shadow-lg">
              <div className="text-5xl">🎓</div>

              <h3 className="mt-5 text-2xl font-bold text-pink-600">
                Makeup Academy
              </h3>

              <p className="mt-4 leading-8 text-gray-700">
                Professional makeup courses with practical training,
                certification and career guidance.
              </p>
            </div>

            <div className="rounded-3xl bg-pink-50 p-8 shadow-lg">
              <div className="text-5xl">🛍️</div>

              <h3 className="mt-5 text-2xl font-bold text-pink-600">
                ESSN Cosmetics
              </h3>

              <p className="mt-4 leading-8 text-gray-700">
                Premium cosmetic products powered by
                QURUX Makeover & Academy for professionals
                and beauty lovers.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}