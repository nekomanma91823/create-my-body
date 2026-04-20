import { estimateNutrition } from "@/app/_lib/gemini";

export async function POST(request: Request) {
  try {
    const { foodName } = (await request.json()) as { foodName: string };
    if (!foodName) return Response.json({ error: "foodName required" }, { status: 400 });
    const estimate = await estimateNutrition(foodName);
    return Response.json(estimate);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
