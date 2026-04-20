import { getWorkoutTemplates, addWorkoutTemplate } from "@/app/_lib/sheets";
import type { WorkoutTemplate } from "@/app/_lib/types";

export async function GET() {
  try {
    return Response.json(await getWorkoutTemplates());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WorkoutTemplate;
    return Response.json(await addWorkoutTemplate(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
