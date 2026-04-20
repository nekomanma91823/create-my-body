import { getExercises, addExercise } from "@/app/_lib/sheets";
import type { Exercise } from "@/app/_lib/types";

export async function GET() {
  try {
    return Response.json(await getExercises());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Exercise;
    return Response.json(await addExercise(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
