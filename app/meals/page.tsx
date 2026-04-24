import { getMeals, getUserSettings } from "@/app/_lib/sheets";
import type { Meal } from "@/app/_lib/types";
import MealsClient from "./_components/MealsClient";

function computeFrequentMeals(meals: Meal[], limit = 10): Meal[] {
  const countMap = new Map<string, number>();
  const latestMap = new Map<string, Meal>();
  for (const m of meals) {
    const count = (countMap.get(m.foodName) ?? 0) + 1;
    countMap.set(m.foodName, count);
    const prev = latestMap.get(m.foodName);
    if (!prev || m.date > prev.date) latestMap.set(m.foodName, m);
  }
  return [...latestMap.values()]
    .sort((a, b) => (countMap.get(b.foodName) ?? 0) - (countMap.get(a.foodName) ?? 0))
    .slice(0, limit);
}

export default async function MealsPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [allMeals, settings] = await Promise.all([getMeals(), getUserSettings()]);
  const todayMeals = allMeals.filter((m) => m.date === todayStr);
  const frequentMeals = computeFrequentMeals(allMeals);

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <MealsClient initialMeals={todayMeals} settings={settings} frequentMeals={frequentMeals} />
      </main>
    </div>
  );
}
