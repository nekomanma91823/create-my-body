import { getFoods, addFood, updateFood, deleteFood } from "@/app/_lib/sheets";
import type { Food } from "@/app/_lib/types";

export async function GET() {
  try {
    return Response.json(await getFoods());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Food;
    return Response.json(await addFood(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { foodName, ...data } = (await request.json()) as Food;
    return Response.json(await updateFood(foodName, data));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { foodName } = (await request.json()) as { foodName: string };
    await deleteFood(foodName);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
