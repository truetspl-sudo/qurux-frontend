"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Salons", href: "/salons" },
  { label: "Book Now", href: "/book" },
  { label: "Shop", href: "/shop" },
  { label: "Academy", href: "/academy" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo/logo.png?v=2"
            alt="QURUX Logo"
            width={600}
            height={180}
            priority
            unoptimized
            className="h-[90px] w-auto object-contain md:h-[110px]"
          />
        </Link>

        {/* Desktop Navigation */}
        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 2xl:gap-7 2xl:text-[17px] xl:gap-5 xl:text-[15px]">
            {navLinks.map((link) => (
              <li key={link.href} className="whitespace-nowrap">
                <Link
                  href={link.href}
                  className="whitespace-nowrap border-b-2 border-transparent pb-1 transition-all duration-300 hover:border-pink-500 hover:text-pink-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Account Button */}
        <div className="hidden lg:block">
          <Link
            href="/account"
            className="whitespace-nowrap rounded-full bg-pink-600 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-pink-700 2xl:px-6 2xl:py-2.5 2xl:text-sm xl:px-5 xl:text-[13px]"
          >
            My Account
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-300 ${
              mobileOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-gray-800 transition-opacity duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-gray-800 transition-transform duration-300 ${
              mobileOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Bottom Pink Line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-pink-500 via-pink-300 to-pink-500"></div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute left-0 top-full z-50 w-full border-t border-gray-100 bg-white shadow-lg lg:hidden">
          <nav className="mx-auto max-w-7xl px-6 py-4">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-lg font-semibold text-gray-800 transition hover:bg-pink-50 hover:text-pink-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-full bg-pink-600 px-6 py-3 text-center font-bold text-white hover:bg-pink-700"
              >
                My Account
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
