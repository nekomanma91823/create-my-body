"use client";

import { useState, useEffect, useRef } from "react";
import type { Food, Meal, NutritionEstimate } from "@/app/_lib/types";

const MEAL_TYPES: Meal["mealType"][] = ["朝食", "昼食", "夕食", "間食"];

function calcMacros(per100g: NutritionEstimate, amount: number) {
  const r = amount / 100;
  return {
    calories: Math.round(per100g.caloriesPer100g * r),
    protein: Math.round(per100g.proteinPer100g * r * 10) / 10,
    carbs: Math.round(per100g.carbsPer100g * r * 10) / 10,
    fat: Math.round(per100g.fatPer100g * r * 10) / 10,
  };
}

interface Props {
  onMealAdded?: (meal: Meal) => void;
}

export default function MealForm({ onMealAdded }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<Meal["mealType"]>("朝食");
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState(100);
  const [foods, setFoods] = useState<Food[]>([]);
  const [matched, setMatched] = useState<Food | null>(null);
  const [estimate, setEstimate] = useState<NutritionEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [showSaveToMaster, setShowSaveToMaster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then((data: Food[]) => setFoods(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!foodName.trim()) {
      setSuggestions([]);
      setMatched(null);
      setEstimate(null);
      return;
    }
    const q = foodName.trim().toLowerCase();
    const hits = foods.filter((f) => f.foodName.toLowerCase().includes(q));
    setSuggestions(hits.slice(0, 6));
    const exact = foods.find((f) => f.foodName === foodName.trim());
    setMatched(exact ?? null);
    if (!exact) setEstimate(null);
  }, [foodName, foods]);

  async function handleEstimate() {
    setEstimating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/nutrition/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: foodName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data: NutritionEstimate = await res.json();
      setEstimate(data);
      setShowSaveToMaster(true);
    } catch (e) {
      setMessage(`推定エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEstimating(false);
    }
  }

  async function handleSaveToMaster() {
    if (!estimate) return;
    await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodName: foodName.trim(), ...estimate }),
    });
    setFoods((prev) => [...prev, { foodName: foodName.trim(), ...estimate }]);
    setMatched({ foodName: foodName.trim(), ...estimate });
    setShowSaveToMaster(false);
    setMessage("Foodsマスタに追加しました");
  }

  const source = matched ? "master" : estimate ? "gemini" : null;
  const nutrition =
    matched
      ? { caloriesPer100g: matched.caloriesPer100g, proteinPer100g: matched.proteinPer100g, carbsPer100g: matched.carbsPer100g, fatPer100g: matched.fatPer100g }
      : estimate ?? null;
  const macros = nutrition ? calcMacros(nutrition, amount) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!macros || !source) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealType,
          foodName: foodName.trim(),
          amount,
          ...macros,
          source,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const saved: Meal = await res.json();
      onMealAdded?.(saved);
      setMessage("記録しました！");
      setFoodName("");
      setAmount(100);
      setMatched(null);
      setEstimate(null);
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date & MealType */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">食事タイプ</label>
          <div className="flex gap-1 flex-wrap pt-1">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMealType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mealType === t
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Food name with autocomplete */}
      <div className="relative">
        <label className="block text-sm font-medium text-zinc-700 mb-1">食品名</label>
        <input
          ref={inputRef}
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="例: 鶏胸肉、カツ丼"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoComplete="off"
        />
        {suggestions.length > 0 && !matched && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((f) => (
              <li
                key={f.foodName}
                onClick={() => { setFoodName(f.foodName); setSuggestions([]); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50"
              >
                {f.foodName}
                <span className="ml-2 text-xs text-zinc-400">
                  {f.caloriesPer100g}kcal/100g
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Gemini estimate button */}
      {foodName.trim() && !matched && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800 mb-2">
            「{foodName.trim()}」はFoodsマスタに未登録です
          </p>
          <button
            type="button"
            onClick={handleEstimate}
            disabled={estimating}
            className="rounded-lg bg-amber-500 px-4 py-2 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {estimating ? "Geminiで推定中..." : "✨ Geminiで栄養を推定"}
          </button>
          {estimate && showSaveToMaster && (
            <div className="mt-3 flex items-center gap-3">
              <p className="text-xs text-amber-700">
                {estimate.caloriesPer100g}kcal / P{estimate.proteinPer100g}g / C{estimate.carbsPer100g}g / F{estimate.fatPer100g}g（per 100g）
              </p>
              <button
                type="button"
                onClick={handleSaveToMaster}
                className="rounded-lg bg-white border border-amber-400 px-3 py-1 text-amber-700 text-xs font-medium hover:bg-amber-50"
              >
                マスタに保存
              </button>
            </div>
          )}
        </div>
      )}

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">量 (g)</label>
        <input
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value))}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Macros preview */}
      {macros && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 grid grid-cols-4 gap-3 text-sm">
          <MacroCard label="カロリー" value={`${macros.calories} kcal`} />
          <MacroCard label="タンパク質" value={`${macros.protein} g`} color="text-indigo-600" />
          <MacroCard label="炭水化物" value={`${macros.carbs} g`} color="text-amber-600" />
          <MacroCard label="脂質" value={`${macros.fat} g`} color="text-red-500" />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !macros}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "記録中..." : "食事を記録する"}
      </button>

      {message && (
        <p className={`text-sm text-center font-medium ${message.startsWith("エラー") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

function MacroCard({ label, value, color = "text-zinc-800" }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-zinc-500 text-xs mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${color}`}>{value}</p>
    </div>
  );
}
