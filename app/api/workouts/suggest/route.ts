import { NextResponse } from "next/server";
import { getWorkouts } from "@/app/_lib/sheets";
import { generateProgressionSuggestion } from "@/app/_lib/gemini";

export async function POST(request: Request) {
  try {
    const { exercise, date } = await request.json();
    if (!exercise) {
      return NextResponse.json({ error: "exercise is required" }, { status: 400 });
    }

    const allWorkouts = await getWorkouts();
    const recentSets = allWorkouts
      .filter((w) => w.exercise === exercise && (!date || w.date < date))
      .sort((a, b) => b.date.localeCompare(a.date) || b.setNumber - a.setNumber);

    if (recentSets.length === 0) {
      return NextResponse.json({ error: "履歴がありません" }, { status: 404 });
    }

    const suggestion = await generateProgressionSuggestion(exercise, recentSets);
    return NextResponse.json(suggestion);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
