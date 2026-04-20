import { getWorkouts, getMeals, getBodyMetrics, getUserSettings } from "@/app/_lib/sheets";
import { getISOWeek } from "@/app/_lib/calculations";
import WeeklyReportView from "./_components/WeeklyReportView";

export default async function ReportPage() {
  const [workouts, allMeals, bodyMetrics, settings] = await Promise.all([
    getWorkouts(),
    getMeals(),
    getBodyMetrics(),
    getUserSettings(),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const thisWeek = getISOWeek(todayStr);

  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 7);
  const lastWeek = getISOWeek(prevDate.toISOString().slice(0, 10));

  const thisWeekWorkouts = workouts.filter((w) => getISOWeek(w.date) === thisWeek);
  const lastWeekWorkouts = workouts.filter((w) => getISOWeek(w.date) === lastWeek);

  const totalVolume = thisWeekWorkouts.reduce((s, w) => s + w.volume, 0);
  const prevVolume = lastWeekWorkouts.reduce((s, w) => s + w.volume, 0);

  const byMuscle: Record<string, number> = {};
  for (const w of thisWeekWorkouts) {
    byMuscle[w.muscleGroup] = (byMuscle[w.muscleGroup] ?? 0) + w.volume;
  }

  const sessions = new Set(thisWeekWorkouts.map((w) => w.date)).size;

  const thisWeekMeals = allMeals.filter((m) => getISOWeek(m.date) === thisWeek);
  const daysLogged = new Set(thisWeekMeals.map((m) => m.date)).size;
  const avgCalories =
    daysLogged > 0
      ? thisWeekMeals.reduce((s, m) => s + m.calories, 0) / daysLogged
      : null;
  const avgProtein =
    daysLogged > 0
      ? thisWeekMeals.reduce((s, m) => s + m.protein, 0) / daysLogged
      : null;

  const thisWeekMetrics = bodyMetrics
    .filter((m) => getISOWeek(m.date) === thisWeek)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">週次レポート</h1>
        <WeeklyReportView
          week={thisWeek}
          stats={{
            totalVolume,
            prevVolume,
            sessions,
            byMuscle,
            avgCalories,
            avgProtein,
            daysLogged,
            targetCalories: settings?.targetCalories ?? null,
            targetProtein: settings?.targetProtein ?? null,
            weightStart: thisWeekMetrics[0]?.weight ?? null,
            weightEnd: thisWeekMetrics.at(-1)?.weight ?? null,
          }}
        />
      </main>
    </div>
  );
}
