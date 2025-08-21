import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero" className="min-h-screen">
      {/* Desktop: Split Layout */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* Left Side: Content */}
        <div className="bg-white flex items-center justify-center px-12 lg:px-16 xl:px-20">
          <div className="max-w-lg">
            {/* Heading */}
            <h1 className="text-4xl lg:text-5xl xl:text-5xl font-bold text-black leading-tight mb-6">
              Lebanon's Premium Padel Club
            </h1>

            {/* Subtitle */}
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-700 leading-relaxed mb-10">
              Book your match on pro‑grade turf with spotless facilities and an energetic vibe.
            </p>

            {/* Buttons - Original styling */}
            <div className="flex flex-col sm:flex-row gap-6">
  {/* Primary CTA */}
  <Link
    href="/booking"
    aria-label="Book a court now"
    className="group inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-primary px-8 py-3.5 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-[1.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 active:scale-[.98]"
  >
    Book Now
    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
  </Link>

  {/* Secondary CTA */}
  <a
    href="#location"
    aria-label="View club location"
    className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-gray-300 bg-white/90 text-gray-800 font-medium shadow-sm px-8 py-3.5 transition-all duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 active:scale-[.98]"
  >
    <MapPin className="mr-2 h-5 w-5 text-primary" />
    View Location
  </a>
</div>

            {/* Credit */}
            <p className="text-sm text-gray-500 mt-12">By Padel Vortex</p>
          </div>
        </div>

        {/* Right Side: Two Images Side by Side - Full Screen */}
        <div className="grid grid-cols-2 gap-2 h-full items-center justify-center p-8">
          {/* First Image - Full Height */}
          <div className="relative h-4/5">
            <img
              src="/vpadel.webp"
              alt="Vortex Padel court showcase"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          
          {/* Second Image - Full Height */}
          <div className="relative h-4/5">
            <img
              src="/vpadel2.webp"
              alt="Vortex Padel court showcase"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Mobile: Centered Layout */}
      <div className="lg:hidden relative min-h-screen flex items-center justify-center px-6">
        {/* Background image for mobile */}
        <div className="absolute inset-0">
          <img
            src="/vpadel.webp"
            alt="Vortex Padel court background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay for mobile */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content for mobile */}
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.08] mb-4">
            Lebanon's Premium Padel Club
          </h1>

          <p className="text-base md:text-lg text-white/85 leading-relaxed mb-8">
            Book your match on pro‑grade turf with spotless facilities and an energetic vibe.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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