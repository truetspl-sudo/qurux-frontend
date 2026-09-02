export default function WhyChoose() {
  const features = [
    {
      icon: "👰",
      title: "Certified Bridal Artists",
      text: "Highly trained professionals for luxury bridal and party makeovers.",
    },
    {
      icon: "💎",
      title: "Premium Beauty Products",
      text: "We use only trusted international and premium beauty brands.",
    },
    {
      icon: "💳",
      title: "No Cost EMI – No Credit Card Required-No Cibil Check",
      text: "Get Bridal Makeup, Beauty Services, Professional Products and Academy Courses on No Cost EMI without any credit card.",
    },
    {
      icon: "🎓",
      title: "Professional Academy",
      text: "Industry-ready makeup courses with certification and practical training.",
    },
  ];

  return (
    <section className="relative z-10 bg-gradient-to-b from-pink-100 via-pink-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Why Choose <span className="text-pink-600">QURUX</span>?
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Luxury Beauty • Premium Products • Easy No Cost EMI
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-white p-6 text-center shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(236,72,153,.35)]"
            >
              <div className="mb-5 text-5xl">
                {item.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}