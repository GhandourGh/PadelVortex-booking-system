"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import { ChevronLeft, Calendar, Clock, Target, User, CheckCircle, Phone, Trash2, Loader2, Download } from "lucide-react";
import Link from "next/link";

/* ---------- localStorage helpers ---------- */
const STORAGE_KEYS = {
  USER_NAME: 'vortex_booking_user_name',
  USER_PHONE: 'vortex_booking_user_phone',
  PREF_DURATION: 'vortex_booking_pref_duration',
  PREF_COURT: 'vortex_booking_pref_court',
  PREF_TIME: 'vortex_booking_pref_time',
} as const;

function saveToStorage(key: string, value: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }
}

function getFromStorage(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return null;
    }
  }
  return null;
}

function clearStorage() {
  if (typeof window !== 'undefined') {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }
}

/* ---------- debounce utility ---------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/* ---------- helpers ---------- */
function pad(n: number) { return String(n).padStart(2, "0"); }

// Convert "HH:MM" 24h string to minutes since midnight
function timeToMinutes(timeHHMM: string) {
  const [h, m] = timeHHMM.split(":").map(Number);
  return h * 60 + m;
}

// Convert minutes since midnight to "HH:MM" 24h string
function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

// Convert "HH:MM" 24h string to 12h format with AM/PM
function to12HourFormat(timeHHMM: string) {
  const [h24, m] = timeHHMM.split(":").map(Number);
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${ampm}`;
}

function generateSlots() {
  // 10:00 → 01:30 (next day), 30-min steps
  const slots: string[] = [];
  let startMins = 10 * 60; // 10:00
  const endMins = 26 * 60; // 02:00 next day (include 2:00 as a start)
  for (let mins = startMins; mins <= endMins; mins += 30) {
    slots.push(minutesToTime(mins % (24 * 60))); // wrap after midnight
  }
  return slots;
}

function addMinutes(timeHHMM: string, minutes: number) {
  const totalMins = (timeToMinutes(timeHHMM) + minutes) % (24 * 60);
  return minutesToTime(totalMins);
}

function rangeOverlaps(startA: string, endA: string, startB: string, endB: string) {
  const START_MIN = 10 * 60; // normalize timeline anchor
  const normalize = (mins: number) => (mins < START_MIN ? mins + 24 * 60 : mins);
  const sA = normalize(timeToMinutes(startA));
  let eA = normalize(timeToMinutes(endA));
  if (eA < sA) eA += 24 * 60;
  const sB = normalize(timeToMinutes(startB));
  let eB = normalize(timeToMinutes(endB));
  if (eB < sB) eB += 24 * 60;
  return sA < eB && sB < eA;
}

function nextNDates(n = 14) {
  const out: { label: string; full: string; iso: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const wd = d.toLocaleDateString(undefined, { weekday: "short" });
    const day = d.toLocaleDateString(undefined, { day: "2-digit" });
    const mon = d.toLocaleDateString(undefined, { month: "short" });
    out.push({
      label: `${wd} ${day} ${mon}`,
      full: d.toLocaleDateString(),
      iso: d.toISOString().slice(0, 10),
      isToday: i === 0,
    });
  }
  return out;
}

/* ---------- page ---------- */
export default function BookingPage() {
  const [dateIso, setDateIso] = useState<string>(nextNDates()[0].iso);
  const [duration, setDuration] = useState<number>(60); // 60 | 90 | 120
  const [court, setCourt] = useState<"Court A" | "Court B">("Court A");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Phone utilities: enforce Lebanese +961 prefix and at least 8 local digits
  const getPhoneDigits = useCallback((val: string) => val.replace(/\D/g, ""), []);
  const formatLbPhone = useCallback((val: string) => {
    let digits = getPhoneDigits(val);
    if (digits.startsWith("961")) digits = digits.slice(3);
    digits = digits.slice(0, 12); // guard against overlong paste
    return `+961 ${digits}`.trimEnd();
  }, [getPhoneDigits]);
  const isPhoneValid = useCallback((val: string) => {
    const digits = getPhoneDigits(val);
    const local = digits.startsWith("961") ? digits.slice(3) : digits;
    return local.length >= 8;
  }, [getPhoneDigits]);

  // confirmation modal
  const [showModal, setShowModal] = useState(false);

  // live booked intervals fetched from the server for selected date + court
  const [bookedRanges, setBookedRanges] = useState<{ s: string; e: string }[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const allSlots = useMemo(() => generateSlots(), []);
  const booked = bookedRanges;

  // Load saved preferences on component mount
  useEffect(() => {
    const savedName = getFromStorage(STORAGE_KEYS.USER_NAME);
    const savedPhone = getFromStorage(STORAGE_KEYS.USER_PHONE);
    const savedDuration = getFromStorage(STORAGE_KEYS.PREF_DURATION);
    const savedCourt = getFromStorage(STORAGE_KEYS.PREF_COURT);
    const savedTime = getFromStorage(STORAGE_KEYS.PREF_TIME);

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(formatLbPhone(savedPhone));
    if (savedDuration) {
      const durationNum = parseInt(savedDuration, 10);
      if ([60, 90, 120].includes(durationNum)) {
        setDuration(durationNum);
      }
    }
    if (savedCourt && (savedCourt === "Court A" || savedCourt === "Court B")) {
      setCourt(savedCourt);
    }
    if (savedTime) {
      setStartTime(savedTime);
    }
  }, []);

  // Save user details when they change
  useEffect(() => {
    if (name.trim()) {
      saveToStorage(STORAGE_KEYS.USER_NAME, name.trim());
    }
  }, [name]);

  useEffect(() => {
    if (phone.trim()) {
      saveToStorage(STORAGE_KEYS.USER_PHONE, phone.trim());
    }
  }, [phone]);

  // Save preferences when they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PREF_DURATION, duration.toString());
  }, [duration]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PREF_COURT, court);
  }, [court]);

  useEffect(() => {
    if (startTime) {
      saveToStorage(STORAGE_KEYS.PREF_TIME, startTime);
    }
  }, [startTime]);

  // Debounced values for availability fetching
  const debouncedDateIso = useDebounce(dateIso, 300);
  const debouncedCourt = useDebounce(court, 300);

  // Load availability with debouncing
  const loadAvailability = useCallback(async () => {
    setLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      const params = new URLSearchParams({ date: debouncedDateIso, court: debouncedCourt });
      const res = await fetch(`/api/availability?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to load availability (${res.status})`);
      }
      const j = await res.json();
      const ranges = (j.bookings as { start: string; end: string }[]).map(r => ({ s: r.start, e: r.end }));
      setBookedRanges(ranges);
    } catch (e: any) {
      setAvailabilityError(e.message || "Error loading availability");
      setBookedRanges([]);
    } finally {
      setLoadingAvailability(false);
    }
  }, [debouncedDateIso, debouncedCourt]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // compute availability for 10:00 → 02:00
  const timeOptions = useMemo(() => {
    const START_MIN = 10 * 60; // 10:00
    const START_MAX = 26 * 60; // 02:00 next day (last allowed start)
    const END_MAX   = 28 * 60; // 04:00 next day (latest allowed end)

    const normalizeToOperatingDay = (mins: number) => (mins < START_MIN ? mins + 24 * 60 : mins);

    return allSlots.map((s) => {
      const e = addMinutes(s, duration);

      // normalize across midnight
      let sM = normalizeToOperatingDay(timeToMinutes(s));
      let eM = normalizeToOperatingDay(timeToMinutes(e));
      if (eM < sM) eM += 24 * 60;

      // start must be before or at 02:00; end can go up to 04:00
      const withinHours = sM >= START_MIN && sM <= START_MAX && eM <= END_MAX;

      const overlap = booked.some((b) => rangeOverlaps(s, e, b.s, b.e));
      return { start: s, end: e, available: withinHours && !overlap };
    });
  }, [allSlots, duration, booked]);

  const days = useMemo(() => nextNDates(14), []);
  const dateFull = useMemo(() => {
    const d = days.find(d => d.iso === dateIso);
    return d?.full ?? new Date(dateIso).toLocaleDateString();
  }, [days, dateIso]);
  const isToday = useMemo(() => days.find(d => d.iso === dateIso)?.isToday ?? false, [days, dateIso]);
  const nowMins = useMemo(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }, []);

  const resetTime = () => setStartTime(null);

  // real submit with deduplication
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  type Confirmation = {
    date: string;
    court: "Court A" | "Court B";
    start: string; // HH:MM
    end: string;   // HH:MM
    duration: number;
    name: string;
    phone: string;
  };
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  // Cache logo to avoid refetching
  const logoDataUrlRef = useRef<string | null>(null);

  const getLogoDataUrl = useCallback(async (): Promise<string | null> => {
    if (logoDataUrlRef.current) return logoDataUrlRef.current;
    try {
      const res = await fetch("/logo.png");
      if (!res.ok) return null;
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      logoDataUrlRef.current = dataUrl;
      return dataUrl;
    } catch {
      return null;
    }
  }, []);

  const saveBookingPdf = useCallback(async (c: Confirmation) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Brand colors
    const primary = { r: 37, g: 99, b: 235 }; // blue-600
    const ink = { r: 15, g: 23, b: 42 };      // slate-900
    const subtle = { r: 248, g: 250, b: 252 }; // slate-50
    const mid = { r: 100, g: 116, b: 139 };   // slate-500

    // Build a lightweight reference code (not persisted; for receipt readibility)
    const refCode = [
      c.court.replace(/[^A-Z]/gi, "").slice(-1) || "C",
      c.date.replace(/-/g, "").slice(-6),
      c.start.replace(":", ""),
      (c.phone || "").replace(/\D/g, "").slice(-4) || "0000"
    ].join("-").toUpperCase();

    // HEADER
    const headerH = 120;
    doc.setFillColor(primary.r, primary.g, primary.b);
    doc.rect(0, 0, pageW, headerH, "F");

    // Optional centered logo
    try {
      const logo = await getLogoDataUrl();
      if (logo) {
        const logoW = 56, logoH = 56;
        const logoX = (pageW - logoW) / 2;
        const logoY = 20;
        doc.addImage(logo, "PNG", logoX, logoY, logoW, logoH);
      }
    } catch {}

    // Title + subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    const brand = "Vortex Padel";
    const brandW = doc.getTextWidth(brand);
    doc.text(brand, (pageW - brandW) / 2, 92);
    doc.setFontSize(11);
    const subtitle = "Booking Confirmation";
    const subW = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageW - subW) / 2, 110);

    // CARD
    const margin = 32;
    let y = headerH + margin;
    const cardX = margin;
    const cardW = pageW - margin * 2;
    const cardH = 240;
    doc.setFillColor(subtle.r, subtle.g, subtle.b);
    doc.roundedRect(cardX, y, cardW, cardH, 10, 10, "F");

    // Card Title Row
    doc.setTextColor(ink.r, ink.g, ink.b);
    doc.setFontSize(14);
    doc.text("Summary", cardX + 16, y + 26);
    doc.setTextColor(mid.r, mid.g, mid.b);
    doc.setFontSize(10);
    doc.text(`Ref: ${refCode}`, pageW - margin - 16 - doc.getTextWidth(`Ref: ${refCode}`), y + 26);

    // Divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.line(cardX + 16, y + 34, cardX + cardW - 16, y + 34);

    // Details grid (two columns)
    const leftX = cardX + 20;
    const rightX = cardX + cardW / 2 + 10;
    let gy = y + 60;
    const rowGap = 26;

    const label = (txt: string, x: number, yy: number) => {
      doc.setTextColor(mid.r, mid.g, mid.b);
      doc.setFontSize(10);
      doc.text(txt, x, yy);
    };
    const value = (txt: string, x: number, yy: number) => {
      doc.setTextColor(ink.r, ink.g, ink.b);
      doc.setFontSize(12);
      doc.text(txt, x, yy + 14);
    };

    label("Date", leftX, gy);              value(new Date(c.date).toLocaleDateString(), leftX, gy); 
    label("Time", leftX, gy += rowGap);    value(`${to12HourFormat(c.start)} — ${to12HourFormat(c.end)} (${c.duration} min)`, leftX, gy);
    label("Court", leftX, gy += rowGap);   value(c.court, leftX, gy);

    gy = y + 60;
    label("Name", rightX, gy);             value(c.name, rightX, gy);
    label("Phone", rightX, gy += rowGap);  value(c.phone, rightX, gy);

    // FOOTER bar
    const footerH = 56;
    const footerY = pageH - footerH;
    doc.setFillColor(primary.r, primary.g, primary.b);
    doc.rect(0, footerY, pageW, footerH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const phoneDisplay = (process.env.NEXT_PUBLIC_CLUB_PHONE ?? "+961 03 441 339");
    const footerText = `Thank you for booking • Vortex Padel • ${phoneDisplay}`;
    const ftW = doc.getTextWidth(footerText);
    doc.text(footerText, (pageW - ftW) / 2, footerY + footerH / 2 + 3);

    const safeDate = c.date.replace(/-/g, "");
    const safeTime = c.start.replace(":", "");
    const filename = `booking_${safeDate}_${safeTime}_${c.court.replace(/\s+/g, "")}_${refCode}.pdf`;
    doc.save(filename);
  }, [getLogoDataUrl]);

  const handleFinalSubmit = async () => {
    if (!startTime || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateIso,
          court,
          start: startTime,
          duration,
          name,
          phone: formatLbPhone(phone),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) throw new Error("This time slot is no longer available. Please select another time.");
        if (res.status === 400) {
          if (j.details && Array.isArray(j.details)) {
            const errorMessages = j.details.map((d: any) => d.message).join(', ');
            throw new Error(errorMessages);
          }
          throw new Error(j.error || 'Invalid booking request');
        }
        throw new Error(j.error || `Booking failed (${res.status})`);
      }
      const endLocal = addMinutes(startTime, duration);
      setConfirmation({
        date: dateIso,
        court,
        start: startTime,
        end: endLocal,
        duration,
        name,
        phone,
      });
      setSubmitSuccess(null);
      setShowModal(false);
      await loadAvailability();
      clearStorage();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to create booking');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClearSavedInfo = () => {
    clearStorage();
    setName("");
    setPhone("");
    setStartTime(null);
    setDuration(60);
    setCourt("Court A");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-10 mt-20">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">Book a Court</h1>
        <div className="w-20" />
      </div>

      {/* Flow */}
      <div className="space-y-8">
        {/* 1) Date — horizontal */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900"><Calendar className="inline h-4 w-4 mr-1 text-primary" /> 1) Choose date</h2>
          <div className="mt-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {days.map(d => {
                const active = d.iso === dateIso;
                return (
                  <button
                    key={d.iso}
                    onClick={() => { setDateIso(d.iso); resetTime(); }}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm border transition ${
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    aria-pressed={active}
                  >
                    {d.isToday ? "Today" : d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2) Duration */}
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  {/* Header row */}
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-slate-900">
      <Clock className="inline h-4 w-4 mr-2 align-[-2px] text-primary" />
      Duration
    </h2>
    <span className="text-xs leading-5 text-slate-500">
      Pick how long you want to play
    </span>
  </div>

  {/* Segmented control */}
  <div
    role="tablist"
    aria-label="Select duration"
    className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-1"
  >
    {[60, 90, 120].map((min) => {
      const active = duration === min;
      return (
        <button
          key={min}
          role="tab"
          aria-selected={active}
          onClick={() => { setDuration(min); resetTime(); }}
          className={[
            "group relative h-11 rounded-lg px-4 text-sm font-medium transition-all",
            active
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-primary"
              : "text-slate-600 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200",
          ].join(" ")}
        >
          <span className="flex items-center justify-center gap-2">
            <span
              className={[
                "h-2 w-2 rounded-full",
                active ? "bg-primary" : "bg-slate-300 group-hover:bg-slate-400",
              ].join(" ")}
            />
            {min === 60 ? "1h" : min === 90 ? "1h 30m" : "2h"}
          </span>
          {active && (
            <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/20" />
          )}
        </button>
      );
    })}
  </div>

  {/* Helper line (fixed alignment + color) */}
  <p className="mt-4 text-xs leading-5 text-slate-500">
    For more information, contact us at{" "}
    <a
      href={`tel:${(process.env.NEXT_PUBLIC_CLUB_PHONE ?? "+96103441339").replace(/\s+/g, "")}`}
      className="inline-flex items-center gap-1 align-middle text-primary hover:underline"
    >
      <Phone className="h-3 w-3 ml-1" />
      {(process.env.NEXT_PUBLIC_CLUB_PHONE ?? "+961 03 441 339")}
    </a>.
  </p>
</section>

        {/* 3) Court & time */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900"><Target className="inline h-4 w-4 mr-1 text-primary" /> Select court & time</h2>

            {/* Court segmented control (Court A / Court B) */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
              {(["Court A", "Court B"] as const).map(label => {
                const active = court === label;
                return (
                  <button
                    key={label}
                    onClick={() => { setCourt(label); resetTime(); }}
                    className={`h-9 rounded-lg text-sm font-medium transition ${
                      active ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle: show only available */}
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            />
            Show only available times
          </label>

          {/* Time chips split into Today and After-midnight (next day) */}
          {(() => {
            const START_MIN = 10 * 60;
            const normalizeToOperatingDay = (mins: number) => (mins < START_MIN ? mins + 24 * 60 : mins);
            const filtered = timeOptions.filter(({ start, available }) => {
              if (!showOnlyAvailable) return true;
              const startMins = timeToMinutes(start);
              const pastToday = isToday && normalizeToOperatingDay(startMins) < normalizeToOperatingDay(nowMins);
              return available && !pastToday;
            });

            const sameDay = filtered.filter(({ start }) => timeToMinutes(start) >= START_MIN);
            const afterMidnight = filtered.filter(({ start }) => timeToMinutes(start) < START_MIN);

            const renderGrid = (items: typeof filtered) => (
              <div
                className="mt-2 grid grid-template gap-2"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))" }}
              >
                {items.map(({ start, end, available }) => {
                  const active = startTime === start;
                  const startMins = timeToMinutes(start);
                  const pastToday = isToday && normalizeToOperatingDay(startMins) < normalizeToOperatingDay(nowMins);
                  const disabled = !available || pastToday;
                  return (
                    <button
                      key={start}
                      disabled={disabled}
                      onClick={() => setStartTime(active ? null : start)}
                      className={[
                        "relative rounded-lg px-3 py-2 text-sm text-center transition",
                        disabled
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed line-through"
                          : active
                            ? "bg-primary text-white shadow-sm"
                            : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                      ].join(" ")}
                      aria-pressed={active}
                      aria-disabled={disabled}
                      title={`${to12HourFormat(start)} – ${to12HourFormat(end)}`}
                    >
                      <div className="font-semibold">{to12HourFormat(start)}</div>
                      <div className="text-[11px] opacity-70">{to12HourFormat(end)}</div>
                    </button>
                  );
                })}
              </div>
            );

            return (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today (10:00 AM — 11:59 PM)</div>
                  {renderGrid(sameDay)}
                </div>
                <div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">After midnight (next day 12:00 — 3:00 AM)</div>
                  {renderGrid(afterMidnight)}
                </div>
              </div>
            );
          })()}


          <p className="mt-3 text-xs text-slate-500">
            Showing availability for <span className="font-medium">{court}</span> on <span className="font-medium">{dateFull}</span>.
          </p>
        </section>

        {/* 4) Your details / Confirmation */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900"><User className="inline h-4 w-4 mr-1 text-primary" /> Your details</h2>

          {!confirmation ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600">Phone</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatLbPhone(e.target.value))}
                placeholder="+961"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                required
              />
            </div>
          </div>

          ) : (
            <div className="mt-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-700 font-semibold">Booking confirmed</p>
                    <p className="mt-0.5 text-sm text-slate-600">Your reservation has been saved. Download your receipt or keep a screenshot.</p>
                  </div>
                </div>

                {/* Prominent time header */}
                <div className="mt-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Your Booking Time</p>
                  <h3 className="mt-1 text-2xl font-bold text-primary">
                    {to12HourFormat(confirmation.start)} — {to12HourFormat(confirmation.end)}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                      {new Date(confirmation.date).toLocaleDateString()}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                      {confirmation.name}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
                  <div className="text-slate-500">Date</div>
                  <div className="font-semibold text-slate-900">{new Date(confirmation.date).toLocaleDateString()}</div>
                  <div className="text-slate-500">Court</div>
                  <div className="font-medium text-slate-800">{confirmation.court}</div>
                  <div className="text-slate-500">Time</div>
                  <div className="text-slate-700">{to12HourFormat(confirmation.start)} — {to12HourFormat(confirmation.end)}</div>
                  <div className="text-slate-500">Duration</div>
                  <div className="font-medium text-slate-800">{confirmation.duration} min</div>
                  <div className="text-slate-500">Name</div>
                  <div className="font-semibold text-slate-900">{confirmation.name}</div>
                  <div className="text-slate-500">Phone</div>
                  <div className="font-medium text-slate-800">{confirmation.phone}</div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => saveBookingPdf(confirmation)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-[1.05] active:scale-[.99]"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <Link
                    href="/"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!confirmation && (
          <>
            <div className="mt-4 flex flex-col items-center">
              {availabilityError && (
                <p className="text-red-500 text-sm text-center mb-2">{availabilityError}</p>
              )}
              {submitError && (
                <p className="text-red-500 text-sm text-center mb-2">{submitError}</p>
              )}

              {(!startTime) && (
                <p className="text-red-500 text-sm text-center mb-2">Please select a time slot before confirming.</p>
              )}
              <button
                onClick={() => {
                  if (name.trim().length === 0) { setSubmitError("Please enter your name"); return; }
                  setSubmitError(null); setShowModal(true);
                }}
                disabled={!startTime || name.trim().length === 0 || loadingAvailability}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
                  !startTime || name.trim().length === 0 || loadingAvailability
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-primary text-white hover:opacity-95"
                }`}
              >
                {loadingAvailability ? 'Loading…' : 'Confirm Booking'}
              </button>
            </div>
          </>
          )}
        </section>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900"><CheckCircle className="inline h-5 w-5 mr-2 text-primary" />Confirm Booking</h3>
            <p className="mt-2 text-sm text-slate-700">
              You’re booking <span className="font-medium">{court}</span> on {dateFull}, {startTime ? to12HourFormat(startTime) : "--"}
              — {startTime ? to12HourFormat(addMinutes(startTime, duration)) : "--"}.<br />
              <span className="text-slate-500">Name:</span> {name || "—"} &nbsp;·&nbsp; <span className="text-slate-500">Phone:</span> {phone || "—"}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                disabled={submitLoading}
              >
                {submitLoading ? 'Submitting…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}