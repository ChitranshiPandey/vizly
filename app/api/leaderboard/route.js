import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .order("total_stars", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ leaderboard: [] });
  }

  return NextResponse.json({ leaderboard: data });
}