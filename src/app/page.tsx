import Link from "next/link";
import Hero from "@/components/Hero";
import { MapPin } from "lucide-react";
import MapCard from "@/components/MapCard";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div>
      <Hero />

      {/* Booking Preview */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <ScrollReveal staggerChildrenMs={80}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="flex flex-col items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Book a Court</h2>
                <p className="mt-1 text-sm text-slate-600">Book on the go with our easy-to-use booking system.</p>
              </div>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Go to Booking
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Location */}
        <ScrollReveal className="mt-6 block" staggerChildrenMs={60}>
          <div id="location" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 inline-flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Location
            </h2>
            <p className="mt-1 text-sm text-slate-600">Kamed El Lawz, Lebanon</p>
            <MapCard />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
