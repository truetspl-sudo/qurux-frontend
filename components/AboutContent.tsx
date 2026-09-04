import QuruxLogo from "./QuruxLogo";

export default function AboutContent() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-pink-600">
            ABOUT US
          </p>

          <h2 className="mt-4 flex flex-wrap items-center justify-center gap-x-3 text-5xl font-bold text-gray-900">
            <span>Welcome to</span>
            <QuruxLogo heightClass="h-16 w-auto md:h-20" />
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
            QURUX Makeover & Academy is your destination for Luxury Bridal
            Makeup, Beauty Services, Professional Makeup Courses and Premium
            Beauty Products.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Placeholder Box */}
          <div className="flex h-[520px] items-center justify-center rounded-[35px] border-2 border-dashed border-pink-300 bg-pink-50">
            <div className="text-center">
              <div className="text-7xl">👑</div>

              <h3 className="mt-4 text-3xl font-bold text-pink-600">
                QURUX
              </h3>

              <p className="mt-2 text-gray-500">
                Founder / Studio Image
              </p>
            </div>
          </div>

          {/* Content */}
          <div>

            <h3 className="text-4xl font-bold text-gray-900">
              Luxury Beauty Experience
            </h3>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              We provide premium bridal makeup, party makeup, beauty services,
              makeup education and professional beauty products with a luxury
              experience.
            </p>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              We also provide
              <span className="font-semibold text-pink-600">
                {" "}No Cost EMI without Credit Card & No CIBIL Check
              </span>
              {" "}for our services, products and academy courses.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-5">

              <div className="rounded-3xl bg-white p-6 text-center shadow-lg">
                <h3 className="text-4xl font-bold text-pink-600">1000+</h3>
                <p className="mt-2 text-gray-600">Happy Clients</p>
              </div>

              <div className="rounded-3xl bg-white p-6 text-center shadow-lg">
                <h3 className="text-4xl font-bold text-pink-600">500+</h3>
                <p className="mt-2 text-gray-600">Bridal Makeovers</p>
              </div>

              <div className="rounded-3xl bg-white p-6 text-center shadow-lg">
                <h3 className="text-4xl font-bold text-pink-600">8+</h3>
                <p className="mt-2 text-gray-600">Years Experience</p>
              </div>

              <div className="rounded-3xl bg-white p-6 text-center shadow-lg">
                <h3 className="text-4xl font-bold text-pink-600">100%</h3>
                <p className="mt-2 text-gray-600">Customer Satisfaction</p>
              </div>

            </div>

            <button className="mt-10 rounded-full bg-pink-600 px-10 py-4 text-lg font-semibold text-white transition hover:bg-pink-700">
              Learn More →
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}