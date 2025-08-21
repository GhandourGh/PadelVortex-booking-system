"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Phone,
  Menu,
  X,
  ArrowRight,
  Home,
  CalendarRange,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string>("/"); // Track which link is active

  // phone (left button)
  const phone = process.env.NEXT_PUBLIC_CLUB_PHONE ?? "+96103441339";
  const telHref = `tel:${phone.replace(/\s+/g, "")}`;

  // nav items
  const nav = [
    { href: "/", label: "Home", icon: Home },
    { href: "/booking", label: "Booking", icon: CalendarRange },
    { href: "/#location", label: "Location", icon: MapPin }, // always go to location section
  ] as const;

  // active detection based on user interaction
  const isActive = (href: string) => {
    return activeLink === href;
  };

  // handle link click to set active state
  const handleLinkClick = (href: string) => {
    setActiveLink(href);
    setOpen(false); // Close mobile menu
  };

  // close on route change (defensive)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/20 backdrop-blur supports-[backdrop-filter]:bg-white/20 shadow-sm">
      <nav className="mx-auto max-w-6xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Phone (left) */}
        <a
          href={telHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition"
          suppressHydrationWarning
          aria-label="Call"
        >
          <Phone className="h-4 w-4" />
        </a>

        {/* Logo (center) */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Vortex Padel"
              width={150}
              height={150}
              className="h-14 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center justify-center gap-4 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleLinkClick(item.href)}
                className={[
                  "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
                  "text-white/90 hover:bg-white/10 transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0",
                  active ? "bg-primary/20 text-primary" : "",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="hidden lg:block">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Menu"
          aria-expanded={open}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary text-primary hover:bg-primary/10 transition"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown — ALWAYS WHITE */}
      <div
        className={[
          open ? "pointer-events-auto opacity-100 scale-y-100" : "pointer-events-none opacity-0 scale-y-95",
          "absolute left-0 right-0 top-full z-50 w-full bg-white border-t border-black/5 shadow-lg origin-top transform transition-all duration-300 lg:hidden",
        ].join(" ")}
        role="dialog"
        aria-hidden={!open}
      >
        <nav role="menu" aria-label="Site navigation" className="mx-auto max-w-6xl px-4 py-6">
          {/* Primary CTA */}
          <div className="mb-6">
            <Link
              href="/booking"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold bg-primary text-white hover:bg-primary/90 transition"
            >
              Book Now <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Links */}
          <ul className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => handleLinkClick(item.href)}
                    className={[
                      "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium",
                      "text-slate-700 hover:bg-slate-50 transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      active ? "bg-primary/20 text-primary" : "",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}