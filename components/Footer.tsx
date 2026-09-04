import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import QuruxLogo from "./QuruxLogo";

export default function Footer() {
  return (
    <footer className="mt-20">
      {/* Rose-gold top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-800 via-pink-600 to-amber-500" />

      <div className="bg-gradient-to-b from-[#fff6fa] via-[#fdeef4] to-[#fbdcEC] text-gray-800">
        <div className="mx-auto max-w-7xl px-6 py-16">

          {/* Top Section */}
          <div className="grid gap-10 md:grid-cols-4">

            {/* Brand */}
            <div>
              <QuruxLogo heightClass="h-16 w-auto" />

              <p className="mt-2 text-xs uppercase tracking-[0.35em] text-rose-700">
                MAKEOVER &amp; ACADEMY
              </p>

              <p className="mt-6 leading-7 text-gray-600">
                Luxury Bridal Makeup, Beauty Services,
                Professional Makeup Academy &amp;
                Premium Beauty Products.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-gray-900">
                Quick Links
              </h3>

              <ul className="space-y-3 text-gray-600">
                <li className="cursor-pointer hover:text-pink-600"><Link href="/">Home</Link></li>
                <li className="cursor-pointer hover:text-pink-600"><Link href="/book">Book Now</Link></li>
                <li className="cursor-pointer hover:text-pink-600"><Link href="/shop">Buy Products</Link></li>
                <li className="cursor-pointer hover:text-pink-600"><Link href="/academy">Academy</Link></li>
                <li className="cursor-pointer hover:text-pink-600"><Link href="/bob">BOB Wallet</Link></li>
                <li className="cursor-pointer hover:text-pink-600"><Link href="/salon/register">Become a Partner</Link></li>
                <li className="cursor-pointer hover:text-pink-600"><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-gray-900">
                Services
              </h3>

              <ul className="space-y-3 text-gray-600">
                <li><Link href="/book" className="hover:text-pink-600">Makeup</Link></li>
                <li><Link href="/book" className="hover:text-pink-600">Hair Styling</Link></li>
                <li><Link href="/book" className="hover:text-pink-600">Facial</Link></li>
                <li><Link href="/book" className="hover:text-pink-600">Skin Care</Link></li>
                <li><Link href="/book" className="hover:text-pink-600">Manicure &amp; Pedicure</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-gray-900">
                Contact
              </h3>

              <div className="space-y-4 text-gray-600">

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-pink-600" />
                  <span>9911227916</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-pink-600" />
                  <span>info@qurux.in</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-pink-600" />
                  <span>Delhi, India</span>
                </div>

              </div>
            </div>

          </div>

          {/* Divider */}
          <div className="my-10 border-t border-rose-200"></div>

          {/* Bottom */}
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

            <p className="text-sm text-gray-500">
              © 2026 QURUX Makeover &amp; Academy. All Rights Reserved.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">

              <a
                href="https://www.instagram.com/quruxmakeover?igsi=YTMzYnN6bndmeHQ1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full bg-gradient-to-r from-pink-500 to-pink-700 p-3 text-white shadow-md transition hover:scale-110"
              >
                <FaInstagram size={22} />
              </a>

              <a
                href="https://www.facebook.com/share/1EpLVyWx4a/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-3 text-white shadow-md transition hover:scale-110"
              >
                <FaFacebookF size={22} />
              </a>

              <a
                href="https://www.youtube.com/@quruxmakeover"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="rounded-full bg-gradient-to-br from-red-500 to-red-700 p-3 text-white shadow-md transition hover:scale-110"
              >
                <FaYoutube size={22} />
              </a>

              <a
                href="https://wa.me/919911227916"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-full bg-gradient-to-br from-green-500 to-green-700 p-3 text-white shadow-md transition hover:scale-110"
              >
                <FaWhatsapp size={22} />
              </a>

            </div>

          </div>

        </div>
      </div>
    </footer>
  );
}
