import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Get user stats
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ stars: 0, quizzes: 0 });
  }

  return NextResponse.json({
    stars: data.total_stars,
    quizzes: data.total_quizzes,
  });
}

// Update user stats
export async function POST(request) {
  const { userId, name, stars, quizzes } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("user_stats")
      .update({
        total_stars: Math.max(0, existing.total_stars + stars),
        total_quizzes: existing.total_quizzes + quizzes,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("user_stats")
      .insert({
        user_id: userId,
        name,
        total_stars: Math.max(0, stars),
        total_quizzes: quizzes,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}