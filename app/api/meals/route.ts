import { getMeals, addMeal, updateMeal, deleteMeal } from "@/app/_lib/sheets";
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

export async function PUT(request: Request) {
  try {
    const { rowIndex, ...data } = (await request.json()) as Meal & { rowIndex: number };
    if (!rowIndex) return Response.json({ error: "rowIndex required" }, { status: 400 });
    await updateMeal(rowIndex, data);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { rowIndex } = (await request.json()) as { rowIndex: number };
    if (!rowIndex) return Response.json({ error: "rowIndex required" }, { status: 400 });
    await deleteMeal(rowIndex);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
