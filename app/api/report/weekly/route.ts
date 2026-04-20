import { getWorkouts, getMeals, getBodyMetrics, getUserSettings } from "@/app/_lib/sheets";
import { getISOWeek } from "@/app/_lib/calculations";
import { generateWeeklyReport } from "@/app/_lib/gemini";

export async function POST() {
  try {
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

    const sessionDates = new Set(thisWeekWorkouts.map((w) => w.date));
    const exercises = Array.from(new Set(thisWeekWorkouts.map((w) => w.exercise)));

    const thisWeekMeals = allMeals.filter((m) => getISOWeek(m.date) === thisWeek);
    const mealDays = new Set(thisWeekMeals.map((m) => m.date));
    const daysLogged = mealDays.size;

    const nutrition =
      daysLogged > 0
        ? {
            avgCalories: thisWeekMeals.reduce((s, m) => s + m.calories, 0) / daysLogged,
            avgProtein: thisWeekMeals.reduce((s, m) => s + m.protein, 0) / daysLogged,
            avgCarbs: thisWeekMeals.reduce((s, m) => s + m.carbs, 0) / daysLogged,
            avgFat: thisWeekMeals.reduce((s, m) => s + m.fat, 0) / daysLogged,
            targetCalories: settings?.targetCalories ?? 2000,
            targetProtein: settings?.targetProtein ?? 150,
            daysLogged,
          }
        : null;

    const thisWeekMetrics = bodyMetrics
      .filter((m) => getISOWeek(m.date) === thisWeek)
      .sort((a, b) => a.date.localeCompare(b.date));
    const body =
      thisWeekMetrics.length > 0
        ? {
            start: thisWeekMetrics[0].weight,
            end: thisWeekMetrics.at(-1)!.weight,
          }
        : null;

    const report = await generateWeeklyReport({
      week: thisWeek,
      training: {
        totalVolume,
        prevVolume,
        byMuscle,
        sessions: sessionDates.size,
        exercises,
      },
      nutrition,
      body,
    });

    return Response.json(report);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
