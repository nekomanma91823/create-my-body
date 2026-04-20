import { getWorkouts, addWorkout } from "@/app/_lib/sheets";
import type { WorkoutSet } from "@/app/_lib/types";

export async function GET() {
  try {
    const workouts = await getWorkouts();
    return Response.json(workouts);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<WorkoutSet, "volume" | "est1RM">;
    const row = await addWorkout(body);
    return Response.json(row, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
