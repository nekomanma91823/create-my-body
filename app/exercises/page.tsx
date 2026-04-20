import { getExercises } from "@/app/_lib/sheets";
import ExerciseManager from "./_components/ExerciseManager";

export default async function ExercisesPage() {
  const exercises = await getExercises();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">種目管理</h1>
        <ExerciseManager initialExercises={exercises} />
      </main>
    </div>
  );
}
