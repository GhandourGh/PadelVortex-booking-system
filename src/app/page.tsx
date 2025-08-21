import Link from "next/link";
import Hero from "@/components/Hero";
import { MapPin } from "lucide-react";
import MapCard from "@/components/MapCard";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div>
      <Hero />
      
      {/* Divider */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="w-full h-1 bg-primary/30"></div>
      </div>

      {/* Booking Preview */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <ScrollReveal staggerChildrenMs={80}>
          <div className="rounded-2xl border border-slate-200 lg:border-none bg-white p-6 lg:p-8 shadow-sm lg:shadow-none">
            {/* Mobile: Centered Layout */}
            <div className="lg:hidden text-center">
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

            {/* Desktop: Split Layout - Image Left, Content Right */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              {/* Left: Booking Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <img
                  src="/vpadel3.webp"
                  alt="Vortex Padel court booking"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Right: Content */}
              <div className="text-center lg:text-left">
                <div className="flex flex-col items-center lg:items-start gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Book a Court</h2>
                    <p className="mt-1 text-sm text-slate-600">Book on the go with our easy-to-use booking system.</p>
                  </div>
                  
                  {/* Desktop Only - Additional Content */}
                  <div className="hidden lg:block space-y-4">
                    <p className="text-base text-slate-700 leading-relaxed">
                      Experience the thrill of padel with our state-of-the-art courts. Our booking system allows you to reserve your preferred time slot in just a few clicks. Whether you're a beginner or a seasoned player, our facilities are designed to provide the perfect environment for your game.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">2 Premium Courts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">Extended Hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">Pro-Grade Equipment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">Instant Booking</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/booking"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    Go to Booking
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
        <div className="hidden md:block w-full h-1 bg-primary/30"></div>

        {/* Location */}
        <ScrollReveal className="mt-6 block" staggerChildrenMs={60}>
          <div id="location" className="scroll-mt-24 rounded-2xl border border-slate-200 lg:border-none bg-white p-6 lg:p-8 shadow-sm lg:shadow-none">
            {/* Mobile: Centered Layout */}
            <div className="lg:hidden text-center">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Location
              </h2>
              <p className="mt-1 text-sm text-slate-600">Kamed El Lawz, Lebanon</p>
              <MapCard />
            </div>

            {/* Desktop: Split Layout - Content Left, Map Right */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 inline-flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Location
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">Kamed El Lawz, Lebanon</p>
                  
                  {/* Desktop Only - Additional Content */}
                  <div className="hidden lg:block space-y-4">
                    <p className="text-base text-slate-700 leading-relaxed">
                      Located in the heart of Kamed El Lawz, our padel club offers easy access with ample parking. Our prime location makes it convenient for players from all over the region to enjoy the best padel experience in Lebanon.
                    </p>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">Central location with easy access</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">Free parking available</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-slate-600">Beautiful mountain views</span>
                      </div>
                    </div>
                    
                    {/* Desktop Only - View Location Button */}
                    <div className="hidden lg:block pt-2">
                      <a
                        href="https://maps.app.goo.gl/zpR172s9Drsx2YdFA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-primary text-white font-medium shadow-sm px-6 py-2.5 text-sm transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        View Location
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right: Map */}
              <div>
                <MapCard />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
      
      {/* Divider */}
  
    </div>
  );
}
