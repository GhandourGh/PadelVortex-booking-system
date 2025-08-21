import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FACILITY_TZ = "Asia/Beirut";

const AvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  court: z.enum(["Court A", "Court B"]),
});

function toFacilityUtc(dateISO: string, timeHHMM: string): Date {
  // Convert a wall-clock time in FACILITY_TZ to a UTC Date
  const local = new Date(`${dateISO}T${timeHHMM}:00`);
  const tzDate = new Date(local.toLocaleString("en-US", { timeZone: FACILITY_TZ }));
  const diff = local.getTime() - tzDate.getTime();
  return new Date(local.getTime() + diff);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const court = searchParams.get("court");

    const parsed = AvailabilitySchema.safeParse({ date, court });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
    }

    const { date: validDate, court: validCourt } = parsed.data;

    // Operating window: 10:00 of selected day to 04:00 next day (facility time)
    const startUtc = toFacilityUtc(validDate, "10:00");
    // 04:00 next day → add 18 hours from 10:00 same day
    const endUtc = new Date(startUtc.getTime() + 18 * 60 * 60 * 1000);

    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select("start_at,end_at")
      .eq("court", validCourt)
      .gt("end_at", startUtc.toISOString())
      .lt("start_at", endUtc.toISOString());

    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Format into HH:MM in facility timezone
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: FACILITY_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const bookings = (data ?? []).map((r) => ({
      start: fmt.format(new Date(r.start_at as string)),
      end: fmt.format(new Date(r.end_at as string)),
    }));

    return NextResponse.json({
      bookings,
      date: validDate,
      court: validCourt,
      operatingHours: { start: "10:00", end: "04:00" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


