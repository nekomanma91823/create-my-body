import { getMeals, getUserSettings } from "@/app/_lib/sheets";
import MealsClient from "./_components/MealsClient";

export default async function MealsPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [allMeals, settings] = await Promise.all([getMeals(), getUserSettings()]);
  const todayMeals = allMeals.filter((m) => m.date === todayStr);

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <MealsClient initialMeals={todayMeals} settings={settings} />
      </main>
    </div>
  );
}
