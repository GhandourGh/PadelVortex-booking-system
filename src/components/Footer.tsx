import Link from "next/link";
import Image from "next/image";
import { Instagram, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Brand */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Image
            src="/logo.svg"
            alt="Vortex Padel Logo"
            width={128}
            height={128}
            className="h-16 md:h-24 lg:h-32 w-auto object-contain mb-4"
            priority={false}
          />
          <p className="mt-2 text-base leading-relaxed text-slate-400 max-w-lg">
            Energetic padel club with two premium courts. Book your next match and experience the vibe.
          </p>
        </div>

        {/* Contact */}
		<div>
  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
    Contact
  </h4>
  <ul className="mt-4 space-y-4 text-sm">
    <li className="flex items-center gap-3">
      <a
        href="tel:03441339"
        className="flex items-center gap-3 text-slate-300 hover:text-white transition"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Phone className="h-4 w-4" />
        </span>
       +961 03 441 339
      </a>
    </li>
    <li className="flex items-center gap-3">
      <a
        href="https://maps.app.goo.gl/zpR172s9Drsx2YdFA"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-slate-300 hover:text-white transition"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-4 w-4" />
        </span>
        Vortex Padel, West beqaa
      </a>
    </li>
  </ul>
</div>

        {/* Social */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Follow
          </h4>
          <div className="mt-4 flex items-center">
            <Link
              href="https://www.instagram.com/padelvortex?utm_source=ig_web_button_share_sheet&igsh=eWpoaXV4Y3FnMDlq"
              target="_blank"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-primary/20 hover:border-primary/30 transition"
            >
              <Instagram className="h-5 w-5 text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Vortex Padel. All rights reserved.
      </div>
    </footer>
  );
}