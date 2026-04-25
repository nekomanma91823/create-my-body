"use client";

import { useState, useEffect, useRef } from "react";
import type { Food, Meal, NutritionEstimate } from "@/app/_lib/types";
import type { ParsedNutritionLabel, ServingEstimate } from "@/app/_lib/gemini";

const MEAL_TYPES: Meal["mealType"][] = ["朝食", "昼食", "夕食", "間食"];

function calcMacros(per100g: NutritionEstimate, amount: number) {
  const r = amount / 100;
  return {
    calories: Math.round(per100g.caloriesPer100g * r),
    protein: Math.round(per100g.proteinPer100g * r * 10) / 10,
    carbs: Math.round(per100g.carbsPer100g * r * 10) / 10,
    fat: Math.round(per100g.fatPer100g * r * 10) / 10,
    fiber: per100g.fiberPer100g != null ? Math.round(per100g.fiberPer100g * r * 10) / 10 : undefined,
    sugar: per100g.sugarPer100g != null ? Math.round(per100g.sugarPer100g * r * 10) / 10 : undefined,
    sodium: per100g.sodiumPer100g != null ? Math.round(per100g.sodiumPer100g * r * 100) / 100 : undefined,
    alcohol: per100g.alcoholPer100g != null ? Math.round(per100g.alcoholPer100g * r * 10) / 10 : undefined,
  };
}

interface Props {
  onMealAdded?: (meal: Meal) => void;
  frequentMeals?: Meal[];
}

const MANUAL_EMPTY = {
  calories: 0, protein: 0, carbs: 0, fat: 0,
  fiber: "", sugar: "", sodium: "", alcohol: "",
};

export default function MealForm({ onMealAdded, frequentMeals = [] }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<Meal["mealType"]>("朝食");
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState(100);
  const [foods, setFoods] = useState<Food[]>([]);
  const [matched, setMatched] = useState<Food | null>(null);
  const [estimate, setEstimate] = useState<NutritionEstimate | null>(null);
  const [servingEstimate, setServingEstimate] = useState<ServingEstimate | null>(null);
  const [servings, setServings] = useState(1);
  const [estimating, setEstimating] = useState(false);
  const [showSaveToMaster, setShowSaveToMaster] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState(MANUAL_EMPTY);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedLabel, setParsedLabel] = useState<ParsedNutritionLabel | null>(null);
  const [quickMeal, setQuickMeal] = useState<Meal | null>(null);
  const [savingToMaster, setSavingToMaster] = useState(false);
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
    setQuickMeal(null);

    if (!foodName.trim()) {
      setSuggestions([]);
      setMatched(null);
      setEstimate(null);
      setServingEstimate(null);
      setServings(1);
      setManualMode(false);
      setPasteMode(false);
      setPasteText("");
      setParsedLabel(null);
      return;
    }
    const q = foodName.trim().toLowerCase();
    const hits = foods.filter((f) => f.foodName.toLowerCase().includes(q));
    setSuggestions(hits.slice(0, 6));
    const exact = foods.find((f) => f.foodName === foodName.trim());
    setMatched(exact ?? null);
    if (!exact) setEstimate(null);
  }, [foodName, foods]);

  async function handleParseLabel() {
    setParsing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/nutrition/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data: ParsedNutritionLabel = await res.json();
      setParsedLabel(data);
      // 手動フォームに値をセット
      setManual({
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber != null ? String(data.fiber) : "",
        sugar: data.sugar != null ? String(data.sugar) : "",
        sodium: data.sodium != null ? String(data.sodium) : "",
        alcohol: data.alcohol != null ? String(data.alcohol) : "",
      });
      setManualMode(true);
      setPasteMode(false);
    } catch (e) {
      setMessage(`解析エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setParsing(false);
    }
  }

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
      const data: ServingEstimate = await res.json();
      setServingEstimate(data);
      setEstimate(data);
      setServings(1);
      setShowSaveToMaster(true);
    } catch (e) {
      setMessage(`推定エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEstimating(false);
    }
  }

  async function handleSaveToMaster() {
    if (!estimate) return;
    setSavingToMaster(true);
    setMessage(null);
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: foodName.trim(), ...estimate }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newFood: Food = { foodName: foodName.trim(), ...estimate };
      // matched が設定された後も正しいグラム数で記録できるよう、
      // servingEstimate をクリアして amount に反映する
      const savedGrams = servingEstimate
        ? Math.round(servingEstimate.servingGrams * servings)
        : amount;
      setFoods((prev) => [...prev, newFood]);
      setShowSaveToMaster(false);
      setServingEstimate(null);
      setAmount(savedGrams);
      setMessage("Foodsマスタに追加しました");
    } catch (e) {
      setMessage(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingToMaster(false);
    }
  }

  const source = quickMeal ? quickMeal.source : matched ? "master" : manualMode ? "manual" : estimate ? "gemini" : null;
  const nutrition = matched
    ? {
        caloriesPer100g: matched.caloriesPer100g,
        proteinPer100g: matched.proteinPer100g,
        carbsPer100g: matched.carbsPer100g,
        fatPer100g: matched.fatPer100g,
        fiberPer100g: matched.fiberPer100g,
        sugarPer100g: matched.sugarPer100g,
        sodiumPer100g: matched.sodiumPer100g,
        alcoholPer100g: matched.alcoholPer100g,
      }
    : estimate ?? null;

  const effectiveAmount = servingEstimate && !matched
    ? Math.round(servingEstimate.servingGrams * servings)
    : amount;

  const macros = quickMeal
    ? {
        calories: quickMeal.calories,
        protein: quickMeal.protein,
        carbs: quickMeal.carbs,
        fat: quickMeal.fat,
        fiber: quickMeal.fiber,
        sugar: quickMeal.sugar,
        sodium: quickMeal.sodium,
        alcohol: quickMeal.alcohol,
      }
    : manualMode
      ? {
          calories: manual.calories,
          protein: manual.protein,
          carbs: manual.carbs,
          fat: manual.fat,
          fiber: manual.fiber !== "" ? Number(manual.fiber) : undefined,
          sugar: manual.sugar !== "" ? Number(manual.sugar) : undefined,
          sodium: manual.sodium !== "" ? Number(manual.sodium) : undefined,
          alcohol: manual.alcohol !== "" ? Number(manual.alcohol) : undefined,
        }
      : nutrition
        ? calcMacros(nutrition, effectiveAmount)
        : null;

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
          amount: quickMeal ? quickMeal.amount : manualMode ? 1 : effectiveAmount,
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
      setServingEstimate(null);
      setServings(1);
      setManualMode(false);
      setManual(MANUAL_EMPTY);
      setPasteMode(false);
      setPasteText("");
      setParsedLabel(null);
      setQuickMeal(null);
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickSelect(meal: Meal) {
    if (quickMeal?.foodName === meal.foodName) {
      setQuickMeal(null);
      setFoodName("");
      return;
    }
    setQuickMeal(meal);
    setFoodName(meal.foodName);
    setAmount(meal.amount);
    setManualMode(false);
    setEstimate(null);
    setServingEstimate(null);
    setPasteMode(false);
    setParsedLabel(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* クイック記録 */}
      {frequentMeals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2">よく食べる食事</p>
          <div className="flex gap-2 flex-wrap">
            {frequentMeals.map((meal) => {
              const isSelected = quickMeal?.foodName === meal.foodName;
              return (
                <button
                  key={meal.foodName}
                  type="button"
                  onClick={() => handleQuickSelect(meal)}
                  className={`rounded-xl px-3 py-2 text-left transition-colors border ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-zinc-200 text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <p className="text-xs font-medium leading-tight">{meal.foodName}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? "text-indigo-200" : "text-zinc-400"}`}>
                    {Math.round(meal.calories)} kcal
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          placeholder="例: 鶏胸肉、カツ丼"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoComplete="off"
        />
        {suggestions.length > 0 && !matched && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((f) => (
              <li
                key={f.foodName}
                onClick={() => { setFoodName(f.foodName); setSuggestions([]); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 flex items-center justify-between"
              >
                <span>{f.foodName}</span>
                <span className="text-xs text-zinc-400">{f.caloriesPer100g}kcal/100g</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Gemini estimate / manual input */}
      {foodName.trim() && !matched && !manualMode && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
          <p className="text-sm text-amber-800">
            「{foodName.trim()}」はFoodsマスタに未登録です
          </p>
          {!manualMode && !pasteMode && !servingEstimate && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleEstimate}
                disabled={estimating}
                className="rounded-lg bg-amber-500 px-4 py-2 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {estimating ? "Geminiで推定中..." : "✨ Geminiで栄養を推定"}
              </button>
              <button
                type="button"
                onClick={() => setPasteMode(true)}
                className="rounded-lg bg-white border border-amber-400 px-4 py-2 text-amber-700 text-sm font-medium hover:bg-amber-50"
              >
                📋 成分表を貼り付け
              </button>
              <button
                type="button"
                onClick={() => { setManualMode(true); setEstimate(null); }}
                className="rounded-lg bg-white border border-amber-400 px-4 py-2 text-amber-700 text-sm font-medium hover:bg-amber-50"
              >
                ✏️ 手動で入力
              </button>
            </div>
          )}
          {estimating && (
            <p className="text-sm text-amber-700">Geminiで推定中...</p>
          )}
          {pasteMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-amber-800">成分表のテキストをそのまま貼り付けてください</p>
                <button
                  type="button"
                  onClick={() => { setPasteMode(false); setPasteText(""); }}
                  className="text-xs text-amber-600 hover:text-amber-800"
                >
                  ✕ キャンセル
                </button>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"例:\nエネルギー 342kcal\nたんぱく質 8.2g\n脂質 12.4g\n炭水化物 49.8g\n  糖質 47.1g\n  食物繊維 2.7g\n食塩相当量 0.8g"}
                rows={6}
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
              />
              <button
                type="button"
                onClick={handleParseLabel}
                disabled={parsing || !pasteText.trim()}
                className="w-full rounded-lg bg-amber-500 px-4 py-2 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {parsing ? "解析中..." : "✨ AIで解析して入力"}
              </button>
            </div>
          )}

          {servingEstimate && showSaveToMaster && !manualMode && !pasteMode && (
            <div className="space-y-3">
              <div className="rounded-lg bg-white border border-amber-200 p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">
                  AI推定: {servingEstimate.servingLabel}（約{servingEstimate.servingGrams}g）
                </p>
                <p className="text-xs text-amber-600">
                  {Math.round(servingEstimate.caloriesPer100g * servingEstimate.servingGrams / 100)}kcal /
                  P{Math.round(servingEstimate.proteinPer100g * servingEstimate.servingGrams / 100 * 10) / 10}g /
                  C{Math.round(servingEstimate.carbsPer100g * servingEstimate.servingGrams / 100 * 10) / 10}g /
                  F{Math.round(servingEstimate.fatPer100g * servingEstimate.servingGrams / 100 * 10) / 10}g
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-800 font-medium mb-1.5">何{servingEstimate.servingLabel.replace(/^[0-9]+/, "")}食べましたか？</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[0.5, 1, 1.5, 2, 2.5, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setServings(n)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        servings === n
                          ? "bg-amber-500 text-white"
                          : "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveToMaster}
                  disabled={savingToMaster}
                  className="rounded-lg bg-white border border-amber-400 px-4 py-2 text-amber-700 text-sm font-medium hover:bg-amber-50 disabled:opacity-50 transition-colors"
                >
                  {savingToMaster ? "保存中..." : "📥 Foodsマスタに保存する"}
                </button>
                <button
                  type="button"
                  onClick={() => { setServingEstimate(null); setEstimate(null); setShowSaveToMaster(false); }}
                  className="text-xs text-amber-500 hover:text-amber-700"
                >
                  再推定
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 手動栄養素入力フォーム */}
      {manualMode && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-300 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-700">栄養素を直接入力（摂取量の合計）</p>
              {parsedLabel && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  ✓ 成分表から解析済み
                  {parsedLabel.per === "100g" ? "（100gあたり）" : parsedLabel.servingSize ? `（${parsedLabel.servingSize}あたり）` : "（1食分）"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setManualMode(false); setParsedLabel(null); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 shrink-0"
            >
              ✕ キャンセル
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ManualField label="カロリー (kcal)" value={manual.calories} onChange={(v) => setManual((p) => ({ ...p, calories: Number(v) }))} required />
            <ManualField label="タンパク質 (g)" value={manual.protein} onChange={(v) => setManual((p) => ({ ...p, protein: Number(v) }))} required />
            <ManualField label="炭水化物 (g)" value={manual.carbs} onChange={(v) => setManual((p) => ({ ...p, carbs: Number(v) }))} required />
            <ManualField label="脂質 (g)" value={manual.fat} onChange={(v) => setManual((p) => ({ ...p, fat: Number(v) }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ManualField label="食物繊維 (g)" value={manual.fiber} onChange={(v) => setManual((p) => ({ ...p, fiber: v }))} />
            <ManualField label="糖質 (g)" value={manual.sugar} onChange={(v) => setManual((p) => ({ ...p, sugar: v }))} />
            <ManualField label="食塩相当量 (g)" value={manual.sodium} onChange={(v) => setManual((p) => ({ ...p, sodium: v }))} step={0.01} />
            <ManualField label="アルコール (g)" value={manual.alcohol} onChange={(v) => setManual((p) => ({ ...p, alcohol: v }))} />
          </div>
        </div>
      )}

      {/* Amount (hidden in manual mode and serving estimate mode) */}
      {!manualMode && !servingEstimate && (
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
      )}

      {/* Macros preview */}
      {macros && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 space-y-3 text-sm">
          <div className="grid grid-cols-4 gap-3">
            <MacroCard label="カロリー" value={`${macros.calories} kcal`} />
            <MacroCard label="タンパク質" value={`${macros.protein} g`} color="text-indigo-600" />
            <MacroCard label="炭水化物" value={`${macros.carbs} g`} color="text-amber-600" />
            <MacroCard label="脂質" value={`${macros.fat} g`} color="text-red-500" />
          </div>
          {(macros.fiber != null || macros.sugar != null || macros.sodium != null || macros.alcohol != null) && (
            <div className="grid grid-cols-4 gap-3 pt-2 border-t border-zinc-200">
              {macros.fiber != null && (
                <MacroCard label="食物繊維" value={`${macros.fiber} g`} color="text-emerald-600" />
              )}
              {macros.sugar != null && (
                <MacroCard label="糖質" value={`${macros.sugar} g`} color="text-orange-500" />
              )}
              {macros.sodium != null && (
                <MacroCard label="食塩相当量" value={`${macros.sodium} g`} color="text-cyan-600" />
              )}
              {macros.alcohol != null && (
                <MacroCard label="アルコール" value={`${macros.alcohol} g`} color="text-purple-600" />
              )}
            </div>
          )}
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

function ManualField({
  label,
  value,
  onChange,
  required = false,
  step = 0.1,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  required?: boolean;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1">
        {label}
        {!required && <span className="ml-1 text-zinc-400">（任意）</span>}
      </label>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        required={required}
        className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
