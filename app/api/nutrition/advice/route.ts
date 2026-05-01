import { getNutritionAdvice } from "@/app/_lib/gemini";

export async function POST(request: Request) {
  try {
    const { targets, current } = await request.json();
    const advice = await getNutritionAdvice(targets, current);
    return Response.json(advice);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
