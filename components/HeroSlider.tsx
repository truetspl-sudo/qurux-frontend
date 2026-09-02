"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Pagination,
  Autoplay,
} from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/pagination";

const slides = [
  "/hero/hero1.jpg",
  "/hero/hero2.jpg",
  "/hero/hero3.jpg",
  "/hero/hero4.jpg",
  "/hero/hero5.jpg",
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

        {slides.map((image, index) => (
          <SwiperSlide
            key={image}
            className="!h-auto !w-full"
          >

            <div className="relative w-full overflow-hidden bg-pink-100">

              <img
                src={image}
                alt={`QURUX Makeover Hero ${index + 1}`}
                className="block h-auto w-full"
                onLoad={() => {
                  setTimeout(() => {
                    swiperRef.current?.updateAutoHeight(0);
                    swiperRef.current?.update();
                  }, 50);
                }}
              />

            </div>

          </SwiperSlide>
        ))}

      </Swiper>

      {/* Bottom Shadow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/20 to-transparent" />

    </section>
  );
}
