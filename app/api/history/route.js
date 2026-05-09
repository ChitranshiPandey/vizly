import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Get user history
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("search_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ history: [] });
  }

  return NextResponse.json({ history: data });
}

// Save history item
export async function POST(request) {
  const { userId, topic, emoji, scenes, quizScore, starsEarned } =
    await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { error } = await supabase.from("search_history").insert({
    user_id: userId,
    topic,
    emoji,
    scenes,
    quiz_score: quizScore,
    stars_earned: starsEarned,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Delete history item
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("search_history")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}