import { suggestFoods } from "@/app/_lib/gemini";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return Response.json({ suggestions: [] });
    const suggestions = await suggestFoods(q);
    return Response.json({ suggestions });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
