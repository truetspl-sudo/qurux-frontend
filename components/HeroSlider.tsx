"use client";

import { useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Pagination,
  Autoplay,
} from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/pagination";

type HeroSlide = {
  src: string;
  alt: string;
  href?: string;
};

const slides: HeroSlide[] = [
  {
    src: "/hero/hero1.jpg",
    alt: "QURUX Makeover & Academy — luxury bridal makeup and beauty services",
    href: "/book",
  },
  {
    src: "/hero/hero2.jpg",
    alt: "Certified beauticians, quality products and a beautifully decorated salon — salon in Naraina Vihar & Uttam Nagar, home service available, 70% off on first booking",
    href: "/book",
  },
  {
    src: "/hero/hero3.jpg",
    alt: "Luxury beauty and bridal makeover services — bridal, party and engagement makeup, salon in Naraina Vihar & Uttam Nagar, home service available",
    href: "/book",
  },
  {
    src: "/hero/hero4.jpg",
    alt: "70% off on your first booking — luxury beauty and makeover services",
    href: "/book",
  },
  {
    src: "/hero/hero5.jpg",
    alt: "No cost EMI — 0% interest, no CIBIL check, no credit card needed",
    href: "/book",
  },
];

export default function HeroSlider() {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="relative w-full overflow-hidden bg-pink-100">

      <Swiper
        modules={[
          Pagination,
          Autoplay,
        ]}
        slidesPerView={1}
        spaceBetween={0}
        loop={true}
        autoHeight={true}
        speed={1000}
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="w-full"
      >

        {slides.map((slide) => {
          const img = (
            <div className="relative w-full overflow-hidden bg-pink-100">
              <img
                src={slide.src}
                alt={slide.alt}
                className={`block h-auto w-full ${slide.href ? "cursor-pointer" : ""}`}
                onLoad={() => {
                  setTimeout(() => {
                    swiperRef.current?.updateAutoHeight(0);
                    swiperRef.current?.update();
                  }, 50);
                }}
              />

              {slide.href && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
                  <span className="rounded-full bg-pink-600 px-7 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg ring-2 ring-white/70 transition group-hover:bg-pink-700 sm:text-base">
                    Book Now →
                  </span>
                </div>
              )}
            </div>
          );

          return (
            <SwiperSlide
              key={slide.src}
              className="!h-auto !w-full"
            >
              {slide.href ? (
                <Link
                  href={slide.href}
                  aria-label={slide.alt}
                  className="group block"
                >
                  {img}
                </Link>
              ) : (
                img
              )}
            </SwiperSlide>
          );
        })}

      </Swiper>

      {/* Bottom Shadow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/20 to-transparent" />

    </section>
  );
}
