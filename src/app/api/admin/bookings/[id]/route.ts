import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const supabase = createAdminSupabase();

    // Optional: basic overlap check if times provided
    if (body.court && body.start_at && body.end_at) {
      const { data: overlaps, error: overlapErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("court", body.court)
        .neq("id", id)
        .lt("start_at", body.end_at)
        .gt("end_at", body.start_at)
        .limit(1);
      if (overlapErr) return NextResponse.json({ error: overlapErr.message }, { status: 500 });
      if (overlaps && overlaps.length > 0) return NextResponse.json({ error: "Selected time overlaps an existing booking" }, { status: 409 });
    }

    const { data, error } = await supabase.from("bookings").update(body).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ booking: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


