"use client";

import { useState } from "react";
import type { Meal, UserSettings } from "@/app/_lib/types";
import MealForm from "./MealForm";

interface Props {
  initialMeals: Meal[];
  settings: UserSettings | null;
}

const MEAL_TYPE_ORDER: Meal["mealType"][] = ["朝食", "昼食", "夕食", "間食"];

export default function MealsClient({ initialMeals, settings }: Props) {
  const [todayMeals, setTodayMeals] = useState<Meal[]>(initialMeals);

  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fiber: acc.fiber + (m.fiber ?? 0),
      sugar: acc.sugar + (m.sugar ?? 0),
      sodium: acc.sodium + (m.sodium ?? 0),
      alcohol: acc.alcohol + (m.alcohol ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, alcohol: 0 },
  );

  const grouped = MEAL_TYPE_ORDER.reduce<Record<string, Meal[]>>((acc, type) => {
    const meals = todayMeals.filter((m) => m.mealType === type);
    if (meals.length > 0) acc[type] = meals;
    return acc;
  }, {});

  function handleMealAdded(meal: Meal) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (meal.date === todayStr) {
      setTodayMeals((prev) => [...prev, meal]);
    }
  }

  return (
    <div className="space-y-6">
      {/* PFC 進捗サマリー */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">今日の栄養摂取</h2>
        <div className="grid grid-cols-4 gap-4">
          <NutritionBar
            label="カロリー"
            current={Math.round(totals.calories)}
            target={settings?.targetCalories}
            unit="kcal"
          />
          <NutritionBar
            label="タンパク質"
            current={Math.round(totals.protein * 10) / 10}
            target={settings?.targetProtein}
            unit="g"
            color="text-indigo-600"
            barColor="bg-indigo-500"
          />
          <NutritionBar
            label="炭水化物"
            current={Math.round(totals.carbs * 10) / 10}
            target={settings?.targetCarbs}
            unit="g"
            color="text-amber-600"
            barColor="bg-amber-400"
          />
          <NutritionBar
            label="脂質"
            current={Math.round(totals.fat * 10) / 10}
            target={settings?.targetFat}
            unit="g"
            color="text-red-500"
            barColor="bg-red-400"
          />
        </div>
        {totals.fiber + totals.sugar + totals.sodium + totals.alcohol > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-100">
            {totals.fiber > 0 && (
              <NutritionBar
                label="食物繊維"
                current={Math.round(totals.fiber * 10) / 10}
                unit="g"
                color="text-emerald-600"
                barColor="bg-emerald-400"
              />
            )}
            {totals.sugar > 0 && (
              <NutritionBar
                label="糖質"
                current={Math.round(totals.sugar * 10) / 10}
                unit="g"
                color="text-orange-500"
                barColor="bg-orange-400"
              />
            )}
            {totals.sodium > 0 && (
              <NutritionBar
                label="食塩相当量"
                current={Math.round(totals.sodium * 100) / 100}
                unit="g"
                color="text-cyan-600"
                barColor="bg-cyan-400"
              />
            )}
            {totals.alcohol > 0 && (
              <NutritionBar
                label="アルコール"
                current={Math.round(totals.alcohol * 10) / 10}
                unit="g"
                color="text-purple-600"
                barColor="bg-purple-400"
              />
            )}
          </div>
        )}
        {!settings && (
          <p className="mt-3 text-xs text-zinc-400">
            目標値を設定すると進捗バーが表示されます
          </p>
        )}
      </section>

      {/* 今日の食事一覧 */}
      {todayMeals.length > 0 && (
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">今日の食事</h2>
          <div className="space-y-4">
            {MEAL_TYPE_ORDER.filter((t) => grouped[t]).map((type) => (
              <div key={type}>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  {type}
                </h3>
                <div className="space-y-1">
                  {grouped[type].map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-800 font-medium">{m.foodName}</span>
                        <span className="text-zinc-400 text-xs">{m.amount}g</span>
                        {m.source === "gemini" && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            AI推定
                          </span>
                        )}
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <span className="text-zinc-800 font-medium">
                          {Math.round(m.calories)} kcal
                        </span>
                        <span className="ml-2">
                          P{Math.round(m.protein * 10) / 10} C{Math.round(m.carbs * 10) / 10} F{Math.round(m.fat * 10) / 10}
                        </span>
                        {(m.fiber != null || m.sodium != null || m.alcohol != null) && (
                          <span className="ml-2 text-zinc-400">
                            {m.fiber != null && `繊維${Math.round(m.fiber * 10) / 10}g`}
                            {m.fiber != null && m.sodium != null && " "}
                            {m.sodium != null && `塩${Math.round(m.sodium * 100) / 100}g`}
                            {m.alcohol != null && (m.fiber != null || m.sodium != null) && " "}
                            {m.alcohol != null && `酒${Math.round(m.alcohol * 10) / 10}g`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 記録フォーム */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-6">食事を記録</h2>
        <MealForm onMealAdded={handleMealAdded} />
      </section>
    </div>
  );
}

function NutritionBar({
  label,
  current,
  target,
  unit,
  color = "text-zinc-800",
  barColor = "bg-zinc-400",
}: {
  label: string;
  current: number;
  target?: number;
  unit: string;
  color?: string;
  barColor?: string;
}) {
  const pct = target ? Math.min((current / target) * 100, 100) : null;
  const remaining = target ? Math.max(target - current, 0) : null;
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {current}
        <span className="text-xs font-normal text-zinc-500 ml-0.5">{unit}</span>
      </p>
      {target != null && (
        <>
          <div className="mt-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            あと {remaining}
            {unit}
          </p>
        </>
      )}
    </div>
  );
}
