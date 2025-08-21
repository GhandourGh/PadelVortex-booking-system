import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FACILITY_TZ = "Asia/Beirut";

const BookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  court: z.enum(["Court A", "Court B"]),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().refine((v) => [60, 90, 120].includes(v), "Invalid duration"),
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
});

function toFacilityUtc(dateISO: string, timeHHMM: string): Date {
  // Map operating-day times (00:00–02:00) to the NEXT calendar day
  const [hStr] = timeHHMM.split(":");
  const hour = Number(hStr);
  let effectiveDate = dateISO;
  if (hour < 10) {
    const base = new Date(`${dateISO}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + 1);
    effectiveDate = base.toISOString().slice(0, 10);
  }

  const local = new Date(`${effectiveDate}T${timeHHMM}:00`);
  const tzDate = new Date(local.toLocaleString("en-US", { timeZone: FACILITY_TZ }));
  const diff = local.getTime() - tzDate.getTime();
  return new Date(local.getTime() + diff);
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function withinOperatingWindow(startHHMM: string, duration: number): boolean {
  const [h, m] = startHHMM.split(":").map(Number);
  const s = h * 60 + m;
  const e = s + duration;
  const START = 10 * 60; // 10:00
  const START_MAX = 26 * 60; // 02:00 next day allowed start
  const END_MAX = 28 * 60; // up to 04:00 next day allowed end
  const norm = (x: number) => (x < START ? x + 24 * 60 : x);
  const sN = norm(s);
  let eN = norm(e);
  if (eN < sN) eN += 24 * 60;
  return sN >= START && sN <= START_MAX && eN <= END_MAX;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
    }
    const { date, court, start, duration, name, phone } = parsed.data;

    if (!withinOperatingWindow(start, duration)) {
      return NextResponse.json({ error: "Booking time is outside operating hours (10:00→02:00, end ≤ 04:00)" }, { status: 400 });
    }

    const startUtc = toFacilityUtc(date, start);
    const endUtc = addMinutes(startUtc, duration);

    // Prevent booking past times for today in facility time.
    // Map 00:00–02:00 to the NEXT calendar day of the selected operating day for comparison.
    const beirutNow = new Date(new Date().toLocaleString("en-US", { timeZone: FACILITY_TZ }));
    const todayISO = beirutNow.toISOString().slice(0, 10);
    let compareDateISO = date;
    const startHour = Number(start.split(":")[0]);
    if (startHour < 10) {
      const base = new Date(`${date}T00:00:00.000Z`);
      base.setUTCDate(base.getUTCDate() + 1);
      compareDateISO = base.toISOString().slice(0, 10);
    }
    if (compareDateISO === todayISO && startUtc < beirutNow) {
      return NextResponse.json({ error: "Cannot book past times for today" }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    // Overlap check: (existing.start_at < newEnd) AND (existing.end_at > newStart)
    const { data: overlaps, error: overlapErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("court", court)
      .lt("start_at", endUtc.toISOString())
      .gt("end_at", startUtc.toISOString())
      .limit(1);
    if (overlapErr) {
      return NextResponse.json({ error: "Database error checking overlaps" }, { status: 500 });
    }
    if (overlaps && overlaps.length > 0) {
      return NextResponse.json({ error: "Selected time overlaps an existing booking" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({ court, start_at: startUtc.toISOString(), end_at: endUtc.toISOString(), name, phone, status: "confirmed" })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      booking: { court, start: startUtc.toISOString(), end: endUtc.toISOString(), name, phone },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


