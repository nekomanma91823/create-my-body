"use client";

import { useState } from "react";
import type { Meal, UserSettings } from "@/app/_lib/types";
import MealForm from "./MealForm";

interface Props {
  initialMeals: Meal[];
  settings: UserSettings | null;
  frequentMeals: Meal[];
}

const MEAL_TYPE_ORDER: Meal["mealType"][] = ["朝食", "昼食", "夕食", "間食"];

type EditForm = {
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: string;
  sugar: string;
  sodium: string;
  alcohol: string;
};

function mealToEditForm(m: Meal): EditForm {
  return {
    amount: m.amount,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    fiber: m.fiber != null ? String(m.fiber) : "",
    sugar: m.sugar != null ? String(m.sugar) : "",
    sodium: m.sodium != null ? String(m.sodium) : "",
    alcohol: m.alcohol != null ? String(m.alcohol) : "",
  };
}

export default function MealsClient({ initialMeals, settings, frequentMeals }: Props) {
  const [todayMeals, setTodayMeals] = useState<Meal[]>(initialMeals);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);

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
    if (meal.date === todayStr) setTodayMeals((prev) => [...prev, meal]);
  }

  function startEdit(meal: Meal) {
    setEditingRowIndex(meal.rowIndex ?? null);
    setEditForm(mealToEditForm(meal));
  }

  async function handleSaveEdit(meal: Meal) {
    if (!editForm || meal.rowIndex == null) return;
    setSaving(true);
    try {
      const body = {
        rowIndex: meal.rowIndex,
        amount: editForm.amount,
        calories: editForm.calories,
        protein: editForm.protein,
        carbs: editForm.carbs,
        fat: editForm.fat,
        fiber: editForm.fiber !== "" ? Number(editForm.fiber) : undefined,
        sugar: editForm.sugar !== "" ? Number(editForm.sugar) : undefined,
        sodium: editForm.sodium !== "" ? Number(editForm.sodium) : undefined,
        alcohol: editForm.alcohol !== "" ? Number(editForm.alcohol) : undefined,
      };
      const res = await fetch("/api/meals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setTodayMeals((prev) =>
        prev.map((m) =>
          m.rowIndex === meal.rowIndex ? { ...m, ...body } : m
        )
      );
      setEditingRowIndex(null);
      setEditForm(null);
    } catch (e) {
      alert(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(meal: Meal) {
    if (meal.rowIndex == null || !confirm(`「${meal.foodName}」を削除しますか？`)) return;
    setDeletingRowIndex(meal.rowIndex);
    try {
      const res = await fetch("/api/meals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: meal.rowIndex }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setTodayMeals((prev) => prev.filter((m) => m.rowIndex !== meal.rowIndex));
      if (editingRowIndex === meal.rowIndex) setEditingRowIndex(null);
    } catch (e) {
      alert(`削除エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDeletingRowIndex(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* PFC 進捗サマリー */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">今日の栄養摂取</h2>
        <div className="grid grid-cols-4 gap-4">
          <NutritionBar label="カロリー" current={Math.round(totals.calories)} target={settings?.targetCalories} unit="kcal" />
          <NutritionBar label="タンパク質" current={Math.round(totals.protein * 10) / 10} target={settings?.targetProtein} unit="g" color="text-indigo-600" barColor="bg-indigo-500" />
          <NutritionBar label="炭水化物" current={Math.round(totals.carbs * 10) / 10} target={settings?.targetCarbs} unit="g" color="text-amber-600" barColor="bg-amber-400" />
          <NutritionBar label="脂質" current={Math.round(totals.fat * 10) / 10} target={settings?.targetFat} unit="g" color="text-red-500" barColor="bg-red-400" />
        </div>
        {totals.fiber + totals.sugar + totals.sodium + totals.alcohol > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-100">
            {totals.fiber > 0 && <NutritionBar label="食物繊維" current={Math.round(totals.fiber * 10) / 10} unit="g" color="text-emerald-600" barColor="bg-emerald-400" />}
            {totals.sugar > 0 && <NutritionBar label="糖質" current={Math.round(totals.sugar * 10) / 10} unit="g" color="text-orange-500" barColor="bg-orange-400" />}
            {totals.sodium > 0 && <NutritionBar label="食塩相当量" current={Math.round(totals.sodium * 100) / 100} unit="g" color="text-cyan-600" barColor="bg-cyan-400" />}
            {totals.alcohol > 0 && <NutritionBar label="アルコール" current={Math.round(totals.alcohol * 10) / 10} unit="g" color="text-purple-600" barColor="bg-purple-400" />}
          </div>
        )}
        {!settings && <p className="mt-3 text-xs text-zinc-400">目標値を設定すると進捗バーが表示されます</p>}
      </section>

      {/* 今日の食事一覧 */}
      {todayMeals.length > 0 && (
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">今日の食事</h2>
          <div className="space-y-4">
            {MEAL_TYPE_ORDER.filter((t) => grouped[t]).map((type) => (
              <div key={type}>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">{type}</h3>
                <div className="space-y-1">
                  {grouped[type].map((m) => (
                    <div key={m.rowIndex ?? m.foodName}>
                      {/* 通常表示行 */}
                      <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-zinc-800 font-medium truncate">{m.foodName}</span>
                          <span className="text-zinc-400 text-xs shrink-0">{m.amount}g</span>
                          {m.source === "gemini" && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">AI推定</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="text-right text-xs text-zinc-500">
                            <span className="text-zinc-800 font-medium">{Math.round(m.calories)} kcal</span>
                            <span className="ml-1.5">P{Math.round(m.protein * 10) / 10} C{Math.round(m.carbs * 10) / 10} F{Math.round(m.fat * 10) / 10}</span>
                          </div>
                          <button
                            onClick={() => startEdit(m)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 px-1.5 py-0.5 rounded hover:bg-indigo-50"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            disabled={deletingRowIndex === m.rowIndex}
                            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingRowIndex === m.rowIndex ? "..." : "削除"}
                          </button>
                        </div>
                      </div>

                      {/* インライン編集フォーム */}
                      {editingRowIndex === m.rowIndex && editForm && (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-1 space-y-3">
                          <p className="text-xs font-medium text-zinc-600">「{m.foodName}」を編集</p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <MealEditField label="量(g)" value={editForm.amount} onChange={(v) => setEditForm((p) => p && { ...p, amount: Number(v) })} />
                            <MealEditField label="カロリー(kcal)" value={editForm.calories} onChange={(v) => setEditForm((p) => p && { ...p, calories: Number(v) })} />
                            <MealEditField label="タンパク質(g)" value={editForm.protein} step={0.1} onChange={(v) => setEditForm((p) => p && { ...p, protein: Number(v) })} />
                            <MealEditField label="炭水化物(g)" value={editForm.carbs} step={0.1} onChange={(v) => setEditForm((p) => p && { ...p, carbs: Number(v) })} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <MealEditField label="脂質(g)" value={editForm.fat} step={0.1} onChange={(v) => setEditForm((p) => p && { ...p, fat: Number(v) })} />
                            <MealEditField label="食物繊維(g)" value={editForm.fiber} step={0.1} onChange={(v) => setEditForm((p) => p && { ...p, fiber: v })} optional />
                            <MealEditField label="食塩(g)" value={editForm.sodium} step={0.01} onChange={(v) => setEditForm((p) => p && { ...p, sodium: v })} optional />
                            <MealEditField label="アルコール(g)" value={editForm.alcohol} step={0.1} onChange={(v) => setEditForm((p) => p && { ...p, alcohol: v })} optional />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(m)}
                              disabled={saving}
                              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {saving ? "保存中..." : "保存"}
                            </button>
                            <button
                              onClick={() => { setEditingRowIndex(null); setEditForm(null); }}
                              className="rounded-lg bg-zinc-100 px-4 py-1.5 text-zinc-700 text-xs font-semibold hover:bg-zinc-200"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      )}
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
        <MealForm onMealAdded={handleMealAdded} frequentMeals={frequentMeals} />
      </section>
    </div>
  );
}

function MealEditField({
  label, value, onChange, step = 1, optional = false,
}: {
  label: string; value: number | string; onChange: (v: string) => void; step?: number; optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-0.5">
        {label}{optional && <span className="ml-1 text-zinc-400">任意</span>}
      </label>
      <input
        type="number" min={0} step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
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
