import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const court = searchParams.get("court");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const supabase = createAdminSupabase();
    let query = supabase.from("bookings").select("*", { count: "exact" }).order("start_at", { ascending: false });
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`).toISOString();
      const end = new Date(`${date}T23:59:59.999Z`).toISOString();
      query = query.gte("start_at", start).lte("start_at", end);
    }
    if (court) query = query.eq("court", court);

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      bookings: data,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("bookings").delete().neq("id", "");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


