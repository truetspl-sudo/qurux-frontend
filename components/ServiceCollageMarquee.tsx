"use client";

const IMG = "/service-images";

const rowA = [
  "bridalmakeup-services.jpg.jpg",
  "airbrushbridalmakeup-services.jpg.jpg",
  "engagementmakeup-services.jpg.jpg",
  "hairstyling-services.jpg.jpg",
  "bridalfacial-services.jpg.jpg",
  "advancedfacial-services.jpg.jpg",
  "classicmanicure-services.jpg.jpg",
  "classicpedicure-services.jpg.jpg",
  "goldfacial-services.jpg.jpg",
  "hairspa-services.jpg.jpg",
  "nailart-services.jpg.jpg",
  "globalhaircolour-services.jpg.jpg",
];

const rowB = [
  "partymakeup-services.jpg.jpg",
  "hdbridalmakeup-services.jpg.jpg",
  "luxurybridalmakeup-services.jpg.jpg",
  "haircut-services.jpg.jpg",
  "haircolour-services.jpg.jpg",
  "hairironing-services.jpg.jpg",
  "hairsmoothening-services.jpg.jpg",
  "facebleach-services.jpg.jpg",
  "facedetan-services.jpg.jpg",
  "fruitfacial-services.jpg.jpg",
  "antiageingfacial-services.jpg.jpg",
  "aromamassage-services.jpg.jpg",
];

const styles = `
@keyframes qx-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes qx-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: .55; transform: scale(.985); }
}
@keyframes qx-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes qx-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.qx-marquee-track {
  display: flex;
  width: max-content;
  animation: qx-marquee linear infinite;
}
.qx-marquee-track:hover { animation-play-state: paused; }
.qx-row-a { animation-duration: 70s; }
.qx-row-b { animation-duration: 95s; }
.qx-tile { position: relative; flex: none; overflow: hidden; }
.qx-blink { animation: qx-blink 3.4s ease-in-out infinite; }
.qx-float { animation: qx-float 4.5s ease-in-out infinite; }
.qx-shine { background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); background-size: 200% 100%; animation: qx-shimmer 5.5s linear infinite; }
`;

function Tile({ src, label, tone }: { src: string; label: string; tone: string }) {
  return (
    <div className={`qx-tile mx-2 h-32 w-48 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/50 md:h-36 md:w-56 ${tone}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${IMG}/${src}`} alt={label} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-110" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span className="absolute bottom-2 left-3 text-xs font-bold uppercase tracking-wider text-white drop-shadow">
        {label}
      </span>
      <div className="qx-shine pointer-events-none absolute inset-0" />
    </div>
  );
}

export default function ServiceCollageMarquee() {
  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-r from-rose-950 via-[#5b0e26] to-rose-900 py-10">
      <style>{styles}</style>

      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-7 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-amber-200 backdrop-blur">
            ✦ Live Services Gallery ✦
          </span>
          <h3 className="mt-3 text-2xl font-black text-white md:text-3xl">
            Our Beauty Services — In Motion
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-pink-100/70">
            Bridal, Hair, Skin, Nails &amp; more — deposit karein aur in sabhi services ko BOB se pay karein.
          </p>
        </div>
      </div>

      {/* Marquee rows */}
      <div className="relative space-y-4 py-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="qx-marquee-track qx-row-a">
          {[...rowA, ...rowA].map((src, i) => (
            <Tile key={i} src={src} label={labelFor(src)} tone={i % 3 === 1 ? "qx-blink" : i % 4 === 2 ? "qx-float" : ""} />
          ))}
        </div>
        <div className="qx-marquee-track qx-row-b">
          {[...rowB, ...rowB].map((src, i) => (
            <Tile key={i} src={src} label={labelFor(src)} tone={i % 4 === 0 ? "qx-float" : i % 5 === 3 ? "qx-blink" : ""} />
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200/70">
        ✨ Slide ✦ Blink ✦ Glow — Beauty in Motion ✨
      </p>
    </section>
  );
}

function labelFor(file: string): string {
  const base = file
    .replace(/^hd|luxury/gi, "")
    .replace(/-services\.jpg\.jpg$/i, "")
    .replace(/-/g, " ")
    .trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
