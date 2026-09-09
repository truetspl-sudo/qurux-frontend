"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import QuruxLogo from "../QuruxLogo";
import { apiGet } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Customers", href: "/admin/customers", icon: "👤" },
  { label: "Password Resets", href: "/admin/password-resets", icon: "🔑" },
  { label: "Salons / Vendors", href: "/admin/salons", icon: "💈" },
  { label: "Services", href: "/admin/services", icon: "💄" },
  { label: "Bookings", href: "/admin/bookings", icon: "📅" },
  { label: "Products", href: "/admin/products", icon: "🛍️" },
  { label: "Courses", href: "/admin/courses", icon: "🎓" },
  { label: "Orders", href: "/admin/orders", icon: "📦" },
  { label: "Payments", href: "/admin/payments", icon: "💳" },
  { label: "EMI", href: "/admin/emi", icon: "📊" },
  { label: "BOB Wallet", href: "/admin/bob", icon: "💰" },
  { label: "Ratings & Reviews", href: "/admin/ratings", icon: "⭐" },
  { label: "Service Closures", href: "/admin/closures", icon: "🔒" },
  { label: "Website Content", href: "/admin/content", icon: "🌐" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
];

type AdminLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export default function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  const pathname = usePathname();

  // Services awaiting admin closure verification (partner ne service done mark ki)
  const [awaitingClosure, setAwaitingClosure] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<any[]>("/bookings");
        if (cancelled || !res.ok || !Array.isArray(res.data)) return;
        setAwaitingClosure(
          res.data.filter(
            (b) => b.status === "PARTNER_COMPLETED"
          ).length
        );
      } catch {
        // silent — badge optional hai
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] flex-shrink-0 overflow-y-auto bg-slate-950 p-4 lg:block">

        {/* Brand */}
        <Link
          href="/admin"
          className="block rounded-2xl px-4 py-3"
        >
          <p className="flex items-center gap-2">
            <QuruxLogo heightClass="h-7 w-auto brightness-0 invert" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-400">ADMIN</span>
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            Control Panel
          </h2>
        </Link>

        {/* Nav */}
        <nav className="mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-pink-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.href === "/admin/closures" && awaitingClosure > 0 && (
                  <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-black text-white">
                    {awaitingClosure}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 p-5 md:p-8">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-pink-600"
            >
              <QuruxLogo heightClass="h-6 w-auto" />
              ADMIN
            </Link>
            <h1 className="mt-1 text-3xl font-black text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            View Website
          </Link>
        </header>

        {children}
      </div>
    </div>
  );
}
