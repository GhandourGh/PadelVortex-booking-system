import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      {/* Background image */}
      <div aria-hidden="true" className="absolute inset-0 bg-[url('/vpadel.webp')] bg-cover bg-center " />

      {/* Cinematic overlays: vertical gradient + vignette */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/40" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_15%,transparent_0%,transparent_58%,rgba(0,0,0,0.35)_100%)]"
      />

      {/* Content: vertically centered, responsive spacing */}
      <div className="relative mx-auto max-w6xl px-5 sm:px-6 lg:px-8 min-h-[100vh] md:min-h-[102vh] flex items-center">
        <div className="mx-auto max-w-2xl text-center">
          {/* Eyebrow brand line (keeps brand presence without repeating as title) */}
         

          {/* Value proposition (not the brand name) */}
          <h1 className=" text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
            Lebanon’s Premium Padel Club
          </h1>

          <p className="mt-4 text-base md:text-lg text-white/85 leading-relaxed">
            Book your match on pro‑grade turf with spotless facilities and an energetic vibe.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/booking"
              aria-label="Book a court now"
              className="group inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-primary px-7 py-3 text-white font-semibold shadow-md transition-all hover:shadow-lg hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[.99]"
            >
              Book Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#location"
              aria-label="View club location"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-white/35 bg-white/10 px-7 py-3 text-white font-medium shadow-sm backdrop-blur-sm transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <MapPin className="mr-2 h-4 w-4" />
              View Location
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}