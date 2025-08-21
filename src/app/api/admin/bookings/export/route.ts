import { NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const vals = headers.map((h) => {
      const v = row[h] ?? "";
      const s = typeof v === "string" ? v : JSON.stringify(v);
      const escaped = s.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    lines.push(vals.join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "all"; // all | today | range
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createAdminSupabase();
  let query = supabase
    .from("bookings")
    .select("id,court,start_at,end_at,name,phone,status,inserted_at")
    .order("start_at", { ascending: false });

  try {
    if (mode === "today") {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      const start = new Date(`${y}-${m}-${d}T00:00:00.000Z`).toISOString();
      const end = new Date(`${y}-${m}-${d}T23:59:59.999Z`).toISOString();
      query = query.gte("start_at", start).lte("start_at", end);
    } else if (mode === "range" && from && to) {
      const start = new Date(`${from}T00:00:00.000Z`).toISOString();
      const end = new Date(`${to}T23:59:59.999Z`).toISOString();
      query = query.gte("start_at", start).lte("start_at", end);
    }

    const { data, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
    }

    const csv = toCsv(data || []);
    const filename = `bookings_${mode}_${Date.now()}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=${filename}`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


