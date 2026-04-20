import { getWorkouts } from "@/app/_lib/sheets";
import WorkoutHistory from "./_components/WorkoutHistory";

export default async function HistoryPage() {
  const workouts = await getWorkouts();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">ワークアウト履歴</h1>
        <WorkoutHistory workouts={workouts} />
      </main>
    </div>
  );
}
