import { getFoods, addFood } from "@/app/_lib/sheets";
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
