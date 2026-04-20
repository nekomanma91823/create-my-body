import { getWorkouts, getMeals, getUserSettings } from "@/app/_lib/sheets";
import { getISOWeek, buildWeeklyVolume, buildExerciseTrend } from "@/app/_lib/calculations";
import Dashboard from "@/app/_components/Dashboard";

export default async function Home() {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const [workouts, allMeals, settings] = await Promise.all([
      getWorkouts(),
      getMeals(),
      getUserSettings(),
    ]);

    const todayMeals = allMeals.filter((m) => m.date === todayStr);

    const exercises = Array.from(new Set(workouts.map((w) => w.exercise)));
    const { data: volumeData, groups: muscleGroups } = buildWeeklyVolume(workouts);
    const recentSets = [...workouts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    const totalVolumeThisWeek = workouts
      .filter((w) => getISOWeek(w.date) === getISOWeek(todayStr))
      .reduce((sum, w) => sum + w.volume, 0);
    const trendsByExercise = Object.fromEntries(
      exercises.map((ex) => [ex, buildExerciseTrend(workouts, ex)])
    );
    const todayTotals = todayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return (
      <Dashboard
        exercises={exercises}
        volumeData={volumeData}
        muscleGroups={muscleGroups}
        recentSets={recentSets}
        totalVolumeThisWeek={totalVolumeThisWeek}
        todayTotals={todayTotals}
        settings={settings}
        trendsByExercise={trendsByExercise}
      />
    );
  } catch (e) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8">
          <h1 className="text-lg font-bold text-red-700 mb-2">設定エラー</h1>
          <p className="text-sm text-zinc-600 mb-4">{String(e)}</p>
          <p className="text-xs text-zinc-500">
            <code>.env.local</code> に Google Sheets の認証情報を設定してください。
          </p>
        </div>
      </div>
    );
  }
}
