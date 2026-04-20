import { getWorkouts, getMeals, getBodyMetrics } from "@/app/_lib/sheets";
import ActivityCalendar from "./_components/ActivityCalendar";

export default async function CalendarPage() {
  const [workouts, meals, metrics] = await Promise.all([
    getWorkouts(),
    getMeals(),
    getBodyMetrics(),
  ]);

  const workoutDates = Array.from(new Set(workouts.map((w) => w.date)));
  const mealDates = Array.from(new Set(meals.map((m) => m.date)));
  const metricDates = Array.from(new Set(metrics.map((m) => m.date)));

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">カレンダー</h1>
        <ActivityCalendar
          workoutDates={workoutDates}
          mealDates={mealDates}
          metricDates={metricDates}
        />
      </main>
    </div>
  );
}
