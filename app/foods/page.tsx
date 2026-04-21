import { getFoods } from "@/app/_lib/sheets";
import FoodManager from "./_components/FoodManager";

export default async function FoodsPage() {
  const foods = await getFoods();
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">食品マスタ</h1>
        <FoodManager initialFoods={foods} />
      </main>
    </div>
  );
}
