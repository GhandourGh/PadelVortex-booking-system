"use client";
import { useState } from "react";
import Image from "next/image";
import { MapPin, ExternalLink } from "lucide-react";

type MapCardProps = {
  href?: string;
  imgSrc?: string;
  alt?: string;
  label?: string;
};

export default function MapCard({
  href = "https://maps.app.goo.gl/zpR172s9Drsx2YdFA",
  imgSrc = "/map.webp",
  alt = "Vortex Padel location map",
  label = "Open in Google Maps",
}: MapCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <section aria-labelledby="location-heading" className="mt-6">
      <h2 id="location-heading" className="sr-only">
        Location
      </h2>

      {/* Clickable map */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="group block relative aspect-[16/13] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Skeleton while image loads */}
        {!loaded && !error && (
          <div
            aria-hidden
            className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200"
          />
        )}

        {/* Error fallback */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="text-center text-slate-500">
              <MapPin className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Map preview unavailable</p>
            </div>
          </div>
        )}

        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />

        {/* Soft overlay for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-black/0 to-transparent" />

        {/* Floating pin + CTA pill (shows on hover, always visible on mobile due to touch) */}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <MapPin className="h-4 w-4 text-primary" />
          Vortex Padel
        </div>

       
      </a>

      {/* Accessible text link (kept for clarity + SEO) */}
      <p className="mt-2 text-center text-sm">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-1 underline-offset-4 hover:text-primary/80"
        >
          {label}
        </a>
      </p>
    </section>
  );
}


