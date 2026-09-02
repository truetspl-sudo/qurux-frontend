"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { services as staticServices } from "@/components/book/services";
import RatingReviewSection from "@/components/RatingReview";
import BobBalanceCard from "@/components/BobBalanceCard";

const extraDetails: Record<
  string,
  {
    about: string;
    suitableFor: string;
    benefits: string[];
    process: string[];
    notes: string[];
  }
> = {
  "bridal-makeup": {
    about:
      "A complete professional bridal makeup experience designed around the bride's outfit, jewellery, skin tone, wedding function and personal preferences.",
    suitableFor:
      "Brides looking for a complete professional wedding-day makeup experience.",
    benefits: [
      "Personalised bridal look",
      "Professional base makeup",
      "Eye and lip detailing",
      "Camera-friendly finish",
      "Long-wear preparation",
      "Final touch-up",
    ],
    process: [
      "Beauty consultation",
      "Skin preparation",
      "Base and complexion makeup",
      "Eye makeup and lashes",
      "Lip makeup",
      "Final detailing and touch-up",
    ],
    notes: [
      "Final package price may vary according to requirements.",
      "Hair styling, draping and additional services can be added separately.",
      "A pre-event consultation is recommended.",
    ],
  },

  "hd-bridal-makeup": {
    about:
      "High-definition bridal makeup designed to provide a refined, camera-ready finish for wedding photography and video.",
    suitableFor:
      "Brides who want a sophisticated HD finish for their wedding photography.",
    benefits: [
      "HD-friendly finish",
      "Refined complexion",
      "Detailed eye makeup",
      "Professional lashes",
      "Camera-ready appearance",
      "Final finishing",
    ],
    process: [
      "Skin preparation",
      "HD base application",
      "Eye makeup",
      "Lashes and lip detailing",
      "Face detailing",
      "Final finishing",
    ],
    notes: [
      "Final price depends on the selected package.",
      "Additional styling services can be booked separately.",
    ],
  },

  "airbrush-bridal-makeup": {
    about:
      "Airbrush bridal makeup uses a professional airbrush application technique to create a lightweight and refined makeup finish.",
    suitableFor:
      "Brides who prefer a lightweight and smooth-looking bridal makeup finish.",
    benefits: [
      "Lightweight feel",
      "Even application",
      "Smooth-looking complexion",
      "Camera-friendly finish",
      "Detailed eye makeup",
      "Professional finishing",
    ],
    process: [
      "Skin preparation",
      "Airbrush base",
      "Face detailing",
      "Eye makeup",
      "Lashes and lips",
      "Final finishing",
    ],
    notes: [
      "Suitability depends on skin type and desired finish.",
      "Final pricing depends on the selected package.",
    ],
  },

  "luxury-bridal-makeup": {
    about:
      "A premium bridal beauty experience designed around the complete bridal look, including personalised makeup and detailed finishing.",
    suitableFor:
      "Brides looking for a premium and highly personalised bridal experience.",
    benefits: [
      "Personalised bridal design",
      "Premium finishing",
      "Detailed eye makeup",
      "Professional complexion work",
      "Complete look coordination",
      "Final styling check",
    ],
    process: [
      "Detailed consultation",
      "Skin preparation",
      "Complexion and base work",
      "Eye and lip detailing",
      "Bridal styling coordination",
      "Final finishing",
    ],
    notes: [
      "Package inclusions can be customised.",
      "Additional services may be added according to requirements.",
    ],
  },

  "engagement-makeup": {
    about:
      "Elegant professional makeup designed especially for engagement ceremonies and special occasions.",
    suitableFor:
      "Customers looking for an elegant and polished engagement look.",
    benefits: [
      "Professional makeup",
      "Base makeup",
      "Eye makeup",
      "Lashes",
      "Lip detailing",
      "Final finishing",
    ],
    process: [
      "Consultation",
      "Skin preparation",
      "Base makeup",
      "Eye and lip makeup",
      "Lashes",
      "Final finishing",
    ],
    notes: [
      "The final look can be customised according to outfit and occasion.",
    ],
  },

  "party-makeup": {
    about:
      "Glamorous makeup for parties, celebrations, family functions and special occasions.",
    suitableFor:
      "Customers looking for a polished party or event makeup look.",
    benefits: [
      "Professional base",
      "Eye makeup",
      "Lashes",
      "Lip makeup",
      "Face detailing",
      "Finishing",
    ],
    process: [
      "Consultation",
      "Skin preparation",
      "Base makeup",
      "Eye makeup",
      "Lip and face detailing",
      "Final finishing",
    ],
    notes: [
      "The makeup style can be customised according to the occasion.",
    ],
  },

  "haircut": {
    about:
      "Professional haircut customised according to hair texture, face shape, preferred length and desired hairstyle.",
    suitableFor:
      "Customers looking for a professional haircut or refreshed hairstyle.",
    benefits: [
      "Professional consultation",
      "Personalised haircut",
      "Shape refinement",
      "Length refinement",
      "Neat finishing",
    ],
    process: [
      "Hair consultation",
      "Hair preparation",
      "Professional cutting",
      "Shape refinement",
      "Finishing and styling",
    ],
    notes: [
      "Final price may vary according to hair length and density.",
      "Additional wash or styling can be added separately.",
    ],
  },

  "hair-colour": {
    about:
      "Professional hair colouring service customised according to the existing hair colour, desired shade and hair condition.",
    suitableFor:
      "Customers looking for a refreshed colour or professional hair colour transformation.",
    benefits: [
      "Professional colour application",
      "Shade consultation",
      "Even colour application",
      "Professional finishing",
      "Colour-care guidance",
    ],
    process: [
      "Hair consultation",
      "Shade selection",
      "Hair preparation",
      "Colour application",
      "Processing",
      "Wash and finishing",
    ],
    notes: [
      "Final pricing may vary according to hair length and density.",
      "Colour correction or specialised colour work may cost extra.",
    ],
  },

  "hair-smoothening": {
    about:
      "Professional smoothening treatment designed to make the hair appear smoother and easier to manage.",
    suitableFor:
      "Customers looking for smoother and more manageable-looking hair.",
    benefits: [
      "Smoother-looking hair",
      "Reduced appearance of frizz",
      "Improved manageability",
      "Professional finishing",
      "Customised treatment",
    ],
    process: [
      "Hair consultation",
      "Hair preparation",
      "Treatment application",
      "Processing",
      "Hair wash",
      "Final styling",
    ],
    notes: [
      "Suitability depends on the current condition of the hair.",
      "Final pricing depends on hair length and density.",
    ],
  },

  "keratin-treatment": {
    about:
      "Professional keratin treatment designed to improve the appearance and manageability of the hair.",
    suitableFor:
      "Customers looking for smoother and easier-to-manage-looking hair.",
    benefits: [
      "Smoother-looking hair",
      "Reduced frizz appearance",
      "Improved manageability",
      "Professional finish",
      "Customised treatment",
    ],
    process: [
      "Hair consultation",
      "Hair preparation",
      "Keratin application",
      "Processing",
      "Hair wash",
      "Professional finishing",
    ],
    notes: [
      "Treatment suitability depends on hair condition.",
      "Final price varies according to hair length and density.",
    ],
  },

  "hair-spa": {
    about:
      "A nourishing hair-care treatment combining cleansing, conditioning and relaxing scalp care.",
    suitableFor:
      "Customers looking for regular hair maintenance and relaxation.",
    benefits: [
      "Hair nourishment",
      "Scalp relaxation",
      "Conditioning",
      "Improved hair feel",
      "Refreshing experience",
    ],
    process: [
      "Hair assessment",
      "Hair cleansing",
      "Treatment application",
      "Scalp massage",
      "Conditioning",
      "Hair wash and finishing",
    ],
    notes: [
      "Product selection may vary according to hair condition.",
      "Additional styling can be added separately.",
    ],
  },

  "korean-glow-facial": {
    about:
      "A Korean-inspired facial focused on cleansing, gentle exfoliation, hydration and skin nourishment for a fresh radiant-looking appearance.",
    suitableFor:
      "Customers looking for hydration, a refreshed appearance and a luminous-looking finish.",
    benefits: [
      "Deep cleansing",
      "Gentle exfoliation",
      "Hydration",
      "Skin nourishment",
      "Refreshing appearance",
      "Radiant-looking finish",
    ],
    process: [
      "Skin consultation",
      "Cleansing",
      "Gentle exfoliation",
      "Hydrating treatment",
      "Mask",
      "Moisturising and finishing",
    ],
    notes: [
      "Treatment steps may be customised according to skin condition.",
    ],
  },

  "korean-glass-skin-treatment": {
    about:
      "A Korean-inspired skincare ritual focused on layered hydration, gentle exfoliation and skin nourishment.",
    suitableFor:
      "Customers seeking hydration and a glass-skin-inspired glow.",
    benefits: [
      "Hydration",
      "Gentle exfoliation",
      "Skin nourishment",
      "Smooth-looking texture",
      "Radiant appearance",
    ],
    process: [
      "Cleansing",
      "Gentle exfoliation",
      "Hydrating preparation",
      "Skin treatment",
      "Mask or serum care",
      "Moisturising",
    ],
    notes: [
      "Treatment steps can be adjusted according to skin condition.",
    ],
  },

  "fruit-facial": {
    about:
      "A refreshing fruit-based facial combining cleansing, exfoliation, massage and nourishing skin care.",
    suitableFor:
      "Customers looking for a refreshing facial and regular skin maintenance.",
    benefits: [
      "Cleansing",
      "Exfoliation",
      "Skin nourishment",
      "Facial massage",
      "Refreshed appearance",
    ],
    process: [
      "Cleansing",
      "Exfoliation",
      "Fruit facial treatment",
      "Face massage",
      "Mask",
      "Moisturising",
    ],
    notes: [
      "Treatment products may be selected according to skin condition.",
    ],
  },

  "gold-facial": {
    about:
      "A premium gold facial experience focused on cleansing, exfoliation, nourishment and a radiant-looking finish.",
    suitableFor:
      "Customers looking for a premium facial before an event or as part of regular beauty care.",
    benefits: [
      "Deep cleansing",
      "Exfoliation",
      "Skin nourishment",
      "Relaxation",
      "Radiant-looking finish",
    ],
    process: [
      "Cleansing",
      "Exfoliation",
      "Facial massage",
      "Gold treatment",
      "Mask",
      "Moisturising",
    ],
    notes: [
      "Customers with known skin sensitivities should inform the professional.",
    ],
  },

  "bridal-facial": {
    about:
      "A premium facial preparation service designed to leave the skin looking fresh, hydrated and prepared for a special occasion.",
    suitableFor:
      "Brides and customers preparing for weddings, engagements or special events.",
    benefits: [
      "Cleansing",
      "Hydration",
      "Exfoliation",
      "Skin nourishment",
      "Relaxation",
      "Fresh-looking complexion",
    ],
    process: [
      "Skin assessment",
      "Cleansing",
      "Exfoliation",
      "Facial treatment",
      "Massage",
      "Mask and hydration",
    ],
    notes: [
      "For brides, scheduling the facial sufficiently before the wedding is recommended.",
      "Treatment should be selected according to skin condition.",
    ],
  },

  "classic-manicure": {
    about:
      "A complete basic manicure for clean, neat and well-groomed hands and nails.",
    suitableFor:
      "Customers looking for regular nail and hand grooming.",
    benefits: [
      "Nail shaping",
      "Cuticle care",
      "Hand care",
      "Clean-looking nails",
      "Relaxation",
    ],
    process: [
      "Nail assessment",
      "Nail shaping",
      "Cuticle care",
      "Hand care",
      "Massage",
      "Finishing",
    ],
    notes: [
      "Nail colour or nail art can be added separately where available.",
    ],
  },

  "spa-manicure": {
    about:
      "A relaxing manicure with additional exfoliation, hand care and moisturising.",
    suitableFor:
      "Customers looking for enhanced hand and nail care.",
    benefits: [
      "Nail shaping",
      "Cuticle care",
      "Exfoliation",
      "Hand massage",
      "Moisturising",
    ],
    process: [
      "Nail shaping",
      "Cuticle care",
      "Exfoliation",
      "Hand massage",
      "Moisturising",
    ],
    notes: [
      "Nail colour and additional nail services may be added separately.",
    ],
  },

  "classic-pedicure": {
    about:
      "A complete pedicure for clean, fresh and well-groomed feet and nails.",
    suitableFor:
      "Customers looking for regular foot and nail grooming.",
    benefits: [
      "Foot cleansing",
      "Nail grooming",
      "Cuticle care",
      "Foot massage",
      "Fresh-looking feet",
    ],
    process: [
      "Foot soak",
      "Nail shaping",
      "Cuticle care",
      "Foot care",
      "Massage",
      "Finishing",
    ],
    notes: [
      "Customers with significant foot or nail conditions should seek appropriate professional advice.",
    ],
  },

  "spa-pedicure": {
    about:
      "A relaxing spa pedicure with additional exfoliation, massage and foot care.",
    suitableFor:
      "Customers looking for enhanced foot care and relaxation.",
    benefits: [
      "Foot soak",
      "Exfoliation",
      "Nail care",
      "Foot massage",
      "Moisturising",
    ],
    process: [
      "Foot soak",
      "Exfoliation",
      "Nail care",
      "Foot massage",
      "Moisturising",
    ],
    notes: [
      "Customers with foot or nail concerns should inform the professional.",
    ],
  },

  "eyebrows": {
    about:
      "Professional eyebrow threading for a neat and defined appearance.",
    suitableFor:
      "Customers looking for regular eyebrow grooming.",
    benefits: [
      "Precise shaping",
      "Clean eyebrow line",
      "Quick grooming",
      "Professional finishing",
    ],
    process: [
      "Shape consultation",
      "Threading",
      "Shape refinement",
      "Finishing",
    ],
    notes: [
      "Customers with irritated or broken skin should inform the professional.",
    ],
  },

  "upper-lips": {
    about:
      "Professional upper-lip threading for quick and precise facial grooming.",
    suitableFor:
      "Customers looking for regular upper-lip grooming.",
    benefits: [
      "Quick hair removal",
      "Precise grooming",
      "Clean-looking finish",
    ],
    process: [
      "Skin preparation",
      "Threading",
      "Finishing",
    ],
    notes: [
      "Temporary redness can occur after threading.",
    ],
  },

  "full-face-threading": {
    about:
      "Complete facial threading designed for professional facial grooming and unwanted facial hair removal.",
    suitableFor:
      "Customers looking for regular facial hair grooming.",
    benefits: [
      "Facial hair removal",
      "Precise grooming",
      "Clean-looking appearance",
      "Professional finishing",
    ],
    process: [
      "Skin preparation",
      "Threading",
      "Shape refinement",
      "Post-service finishing",
    ],
    notes: [
      "Threading may cause temporary redness, especially on sensitive skin.",
    ],
  },

  "full-arms-waxing": {
    about:
      "Professional full-arm waxing with skin preparation, hair removal and post-wax care.",
    suitableFor:
      "Customers looking for professional arm grooming.",
    benefits: [
      "Hair removal",
      "Smooth-looking skin",
      "Professional application",
      "Post-wax care",
    ],
    process: [
      "Skin preparation",
      "Wax application",
      "Hair removal",
      "Skin cleaning",
      "Post-wax care",
    ],
    notes: [
      "Temporary redness may occur after waxing.",
    ],
  },

  "full-legs-waxing": {
    about:
      "Professional full-leg waxing for smooth and well-groomed-looking legs.",
    suitableFor:
      "Customers looking for professional leg grooming.",
    benefits: [
      "Professional hair removal",
      "Smooth-looking skin",
      "Quick grooming",
      "Post-wax care",
    ],
    process: [
      "Skin preparation",
      "Wax application",
      "Hair removal",
      "Skin cleaning",
      "Post-wax care",
    ],
    notes: [
      "Temporary redness can occur after waxing.",
    ],
  },

  "full-body-wax": {
    about:
      "A comprehensive professional body waxing service covering applicable areas selected during booking.",
    suitableFor:
      "Customers looking for comprehensive body grooming.",
    benefits: [
      "Comprehensive grooming",
      "Professional hair removal",
      "Smooth-looking skin",
      "Post-wax care",
    ],
    process: [
      "Service consultation",
      "Skin preparation",
      "Professional waxing",
      "Hair removal",
      "Skin cleaning",
      "Post-wax care",
    ],
    notes: [
      "Exact areas included should be confirmed at booking.",
      "Temporary redness may occur after waxing.",
    ],
  },

  "swedish-massage": {
    about:
      "A relaxing body massage experience using professional massage techniques in a comfortable wellness environment.",
    suitableFor:
      "Adults looking for a relaxing wellness experience.",
    benefits: [
      "Relaxation",
      "General wellness",
      "Calming experience",
      "Body relaxation",
    ],
    process: [
      "Brief consultation",
      "Pressure preference discussion",
      "Massage session",
      "Relaxation",
      "Session completion",
    ],
    notes: [
      "This is a wellness service and not a medical treatment.",
    ],
  },

  "deep-tissue-massage": {
    about:
      "A deeper-pressure massage experience intended for relaxation and general body wellness.",
    suitableFor:
      "Adults seeking a firmer massage experience.",
    benefits: [
      "Relaxation",
      "General body wellness",
      "Firmer massage experience",
      "Personalised pressure",
    ],
    process: [
      "Brief consultation",
      "Pressure preference discussion",
      "Massage session",
      "Relaxation",
      "Session completion",
    ],
    notes: [
      "This is not a medical treatment.",
    ],
  },

  "aroma-massage": {
    about:
      "A relaxing massage experience incorporating an aromatic wellness environment.",
    suitableFor:
      "Adults looking for a calming wellness session.",
    benefits: [
      "Relaxation",
      "Calming experience",
      "General wellness",
      "Personalised pressure",
    ],
    process: [
      "Brief consultation",
      "Aroma massage",
      "Relaxation session",
      "Finishing care",
    ],
    notes: [
      "Customers should inform the professional about allergies or sensitivities.",
    ],
  },
};

export default function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const service = staticServices.find((item: any) => item.slug === slug) || null;

  if (!service) {
    return (
      <main className="min-h-screen bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-7xl">🔍</div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">Service Not Found</h1>
          <p className="mt-4 text-gray-600">The service you are looking for could not be found.</p>
          <Link href="/book" className="mt-8 inline-block rounded-full bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700">← Back to Services</Link>
        </div>
      </main>
    );
  }

  const details = extraDetails[slug] ?? {
    about: service.description,
    suitableFor:
      `Customers looking for professional ${service.name} services.`,
    benefits: service.includes,
    process: [
      "Service consultation",
      "Preparation",
      "Professional service",
      "Finishing",
    ],
    notes: [
      "Final service requirements will be confirmed during booking.",
      "Pricing may vary according to selected service requirements.",
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-white py-14">

      <div className="mx-auto max-w-7xl px-6">

        <Link
          href="/book"
          className="inline-flex items-center gap-2 font-semibold text-pink-600 hover:text-pink-700"
        >
          ← Back to Services
        </Link>

        {/* HERO */}
        <section className="mt-8 overflow-hidden rounded-[35px] bg-white shadow-xl">

          <div className="grid lg:grid-cols-2">

            <div className="flex min-h-[500px] items-center justify-center bg-gradient-to-br from-pink-100 via-white to-pink-50">

              <div className="w-full px-6 py-8">

                <div className="relative mx-auto h-[420px] w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-md">

                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />

                </div>

                <div className="text-center">

                  <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                    {service.category}
                  </p>

                  <h1 className="mt-3 px-8 text-4xl font-bold text-gray-900 md:text-5xl">
                    {service.name}
                  </h1>

                </div>

              </div>

            </div>

            <div className="flex flex-col justify-center p-8 md:p-12">

              <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                QURUX MAKEOVER & ACADEMY
              </p>

              <h2 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
                {service.name}
              </h2>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                {service.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl bg-pink-50 p-5">
                  <p className="text-sm text-gray-500">
                    Starting Price
                  </p>

                  <p className="mt-2 text-2xl font-bold text-pink-600">
                    {service.price}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">
                    Duration
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {service.duration}
                  </p>
                </div>

              </div>

              {/* BOB BALANCE */}
              <BobBalanceCard price={service.price} itemName={service.name} />

              {/* BOOK NOW - NEXT PAGE */}
              <Link
                href={`/booking?service=${service.slug}`}
                className="mt-8 rounded-full bg-pink-600 px-8 py-4 text-center text-lg font-bold text-white shadow-lg hover:bg-pink-700"
              >
                BOOK NOW →
              </Link>

            </div>

          </div>

        </section>

        {/* ABOUT */}
        <section className="mt-10 rounded-[30px] bg-white p-8 shadow-lg md:p-12">

          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            ABOUT THE SERVICE
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            About {service.name}
          </h2>

          <p className="mt-6 max-w-5xl text-lg leading-8 text-gray-600">
            {details.about}
          </p>

        </section>

        {/* BENEFITS */}
        <section className="mt-10">

          <div className="text-center">

            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              BENEFITS
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Why Choose This Service?
            </h2>

          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {details.benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl bg-white p-6 shadow-md"
              >

                <div className="flex items-center gap-4">

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                    ✓
                  </span>

                  <span className="font-semibold text-gray-800">
                    {benefit}
                  </span>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* PROCESS */}
        <section className="mt-10 rounded-[30px] bg-white p-8 shadow-lg md:p-12">

          <div className="text-center">

            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              SERVICE EXPERIENCE
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Treatment Process
            </h2>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {details.process.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl bg-pink-50 p-6"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 font-bold text-white">
                  {index + 1}
                </div>

                <h3 className="mt-5 font-bold text-gray-900">
                  {step}
                </h3>

              </div>
            ))}

          </div>

        </section>

        {/* INCLUDED */}
        <section className="mt-8 rounded-[30px] bg-white p-8 shadow-lg md:p-12">

          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            SERVICE INCLUSIONS
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            What's Included
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {service.includes.map((item: string) => (
              <div
                key={item}
                className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"
              >

                <div className="flex items-center gap-3">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-sm text-white">
                    ✓
                  </span>

                  <span className="font-semibold text-gray-800">
                    {item}
                  </span>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* SUITABLE + NOTES */}
        <section className="mt-8 grid gap-8 lg:grid-cols-2">

          <div className="rounded-[30px] bg-pink-600 p-8 text-white shadow-lg md:p-10">

            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-100">
              IDEAL FOR
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Who Is This Service For?
            </h2>

            <p className="mt-6 leading-8 text-white/90">
              {details.suitableFor}
            </p>

          </div>

          <div className="rounded-[30px] bg-white p-8 shadow-lg md:p-10">

            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              GOOD TO KNOW
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Before You Book
            </h2>

            <ul className="mt-6 space-y-4">

              {details.notes.map((note) => (
                <li
                  key={note}
                  className="flex gap-3 leading-7 text-gray-600"
                >
                  <span className="text-pink-600">
                    •
                  </span>

                  <span>
                    {note}
                  </span>
                </li>
              ))}

            </ul>

          </div>

        </section>

        {/* PAYMENT */}
        <section className="mt-8 rounded-[30px] border border-pink-100 bg-white p-8 shadow-lg md:p-12">

          <div className="text-center">

            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
              PAYMENT
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Payment Options
            </h2>

          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            <div className="rounded-2xl border border-gray-200 p-6">

              <div className="flex items-center gap-3">

                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                  💳
                </span>

                <h3 className="text-xl font-bold text-gray-900">
                  Full Payment
                </h3>

              </div>

              <p className="mt-4 leading-7 text-gray-600">
                Pay the complete service amount according to the final
                booking price.
              </p>

            </div>

            <div className="rounded-2xl border border-pink-200 bg-pink-50 p-6">

              <div className="flex items-center gap-3">

                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                  ✨
                </span>

                <h3 className="text-xl font-bold text-pink-600">
                  No Cost EMI
                </h3>

              </div>

              <p className="mt-4 leading-7 text-gray-600">
                Select No Cost EMI during booking, subject to applicable
                terms and eligibility.
              </p>

            </div>

          </div>

        </section>

        {/* REVIEWS */}
        <section className="mt-10 rounded-[30px] bg-white p-8 shadow-lg md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
            CUSTOMER REVIEWS
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            What Our Customers Say
          </h2>
          <div className="mt-8">
            <RatingReviewSection serviceSlug={service.slug} showSubmitForm />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-10 rounded-[35px] bg-gradient-to-r from-pink-600 to-pink-500 p-10 text-center text-white shadow-xl md:p-14">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-100">
            READY TO BOOK?
          </p>

          <h2 className="mt-4 text-4xl font-bold">
            Book Your {service.name}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/90">
            Select your preferred date and location and continue to booking.
          </p>

          {/* SECOND BOOK NOW - NEXT PAGE */}
          <Link
            href={`/booking?service=${service.slug}`}
            className="mt-8 inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-pink-600 shadow-lg hover:bg-pink-50"
          >
            BOOK NOW →
          </Link>

        </section>

      </div>

    </main>
  );
}
