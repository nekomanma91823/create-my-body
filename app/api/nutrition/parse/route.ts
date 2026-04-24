import { NextResponse } from "next/server";
import { parseNutritionLabel } from "@/app/_lib/gemini";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "テキストが空です" }, { status: 400 });
    }
    const result = await parseNutritionLabel(text);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
