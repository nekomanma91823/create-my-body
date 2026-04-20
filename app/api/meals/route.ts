import { getMeals, addMeal } from "@/app/_lib/sheets";
import type { Meal } from "@/app/_lib/types";

export async function GET() {
  try {
    return Response.json(await getMeals());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Meal;
    return Response.json(await addMeal(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
