import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Top Section */}
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div>
            <h2 className="text-4xl font-bold text-pink-500">
              QURUX
            </h2>

            <p className="mt-2 text-xs uppercase tracking-[0.35em] text-gray-400">
              MAKEOVER & ACADEMY
            </p>

            <p className="mt-6 leading-7 text-gray-300">
              Luxury Bridal Makeup, Beauty Services,
              Professional Makeup Academy &
              Premium Beauty Products.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-xl font-semibold">
              Quick Links
            </h3>

            <ul className="space-y-3 text-gray-300">
              <li className="cursor-pointer hover:text-pink-500"><Link href="/">Home</Link></li>
              <li className="cursor-pointer hover:text-pink-500"><Link href="/book">Book Now</Link></li>
              <li className="cursor-pointer hover:text-pink-500"><Link href="/shop">Buy Products</Link></li>
              <li className="cursor-pointer hover:text-pink-500"><Link href="/academy">Academy</Link></li>
              <li className="cursor-pointer hover:text-pink-500"><Link href="/bob">BOB Wallet</Link></li>
              <li className="cursor-pointer hover:text-pink-500"><Link href="/salon/register">Become a Partner</Link></li>
              <li className="cursor-pointer hover:text-pink-500"><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-5 text-xl font-semibold">
              Services
            </h3>

            <ul className="space-y-3 text-gray-300">
              <li><Link href="/book" className="hover:text-pink-500">Makeup</Link></li>
              <li><Link href="/book" className="hover:text-pink-500">Hair Styling</Link></li>
              <li><Link href="/book" className="hover:text-pink-500">Facial</Link></li>
              <li><Link href="/book" className="hover:text-pink-500">Skin Care</Link></li>
              <li><Link href="/book" className="hover:text-pink-500">Manicure & Pedicure</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-xl font-semibold">
              Contact
            </h3>

            <div className="space-y-4 text-gray-300">

              <div className="flex items-center gap-3">
                <Phone size={18} />
                <span>9911227916</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} />
                <span>info@qurux.in</span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={18} />
                <span>Delhi, India</span>
              </div>

            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="my-10 border-t border-white/10"></div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

          <p className="text-sm text-gray-400">
            © 2026 QURUX Makeover & Academy. All Rights Reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">

            <a
              href="#"
              className="rounded-full bg-gradient-to-r from-pink-500 to-pink-700 p-3 transition hover:scale-110"
            >
              <FaInstagram size={22} />
            </a>

            <a
              href="#"
              className="rounded-full bg-blue-600 p-3 transition hover:scale-110"
            >
              <FaFacebookF size={22} />
            </a>

            <a
              href="#"
              className="rounded-full bg-red-600 p-3 transition hover:scale-110"
            >
              <FaYoutube size={22} />
            </a>

            <a
              href="#"
              className="rounded-full bg-green-600 p-3 transition hover:scale-110"
            >
              <FaWhatsapp size={22} />
            </a>

          </div>

        </div>

      </div>
    </footer>
  );
}