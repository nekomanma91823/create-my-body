"use client";

import { useState } from "react";
import type { UserSettings } from "@/app/_lib/types";

interface Props {
  initialSettings: UserSettings | null;
}

export default function SettingsForm({ initialSettings }: Props) {
  const [targetCalories, setTargetCalories] = useState(
    initialSettings?.targetCalories ?? 2000,
  );
  const [targetProtein, setTargetProtein] = useState(
    initialSettings?.targetProtein ?? 150,
  );
  const [targetCarbs, setTargetCarbs] = useState(
    initialSettings?.targetCarbs ?? 200,
  );
  const [targetFat, setTargetFat] = useState(initialSettings?.targetFat ?? 70);
  const [maintenanceCalories, setMaintenanceCalories] = useState(
    initialSettings?.maintenanceCalories ?? 2200,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const totalMacroCalories =
    targetProtein * 4 + targetCarbs * 4 + targetFat * 9;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories,
          targetProtein,
          targetCarbs,
          targetFat,
          maintenanceCalories,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("設定を保存しました");
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* カロリー目標 */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-800">カロリー目標</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="目標摂取カロリー (kcal)"
            value={targetCalories}
            onChange={setTargetCalories}
            min={500}
            max={6000}
          />
          <NumberField
            label="メンテナンスカロリー (kcal)"
            value={maintenanceCalories}
            onChange={setMaintenanceCalories}
            min={500}
            max={6000}
          />
        </div>
        <p className="text-xs text-zinc-400">
          メンテナンスカロリーとの差:{" "}
          <span
            className={
              targetCalories < maintenanceCalories
                ? "text-indigo-600 font-medium"
                : "text-amber-600 font-medium"
            }
          >
            {targetCalories < maintenanceCalories ? "-" : "+"}
            {Math.abs(targetCalories - maintenanceCalories)} kcal (
            {targetCalories < maintenanceCalories ? "減量" : "増量"})
          </span>
        </p>
      </section>

      {/* PFC目標 */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-800">PFC 目標</h2>
        <div className="grid grid-cols-3 gap-4">
          <NumberField
            label="タンパク質 (g)"
            value={targetProtein}
            onChange={setTargetProtein}
            min={0}
            max={500}
          />
          <NumberField
            label="炭水化物 (g)"
            value={targetCarbs}
            onChange={setTargetCarbs}
            min={0}
            max={1000}
          />
          <NumberField
            label="脂質 (g)"
            value={targetFat}
            onChange={setTargetFat}
            min={0}
            max={500}
          />
        </div>

        {/* マクロ比率プレビュー */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>マクロバランス</span>
            <span>合計 {totalMacroCalories} kcal</span>
          </div>
          <MacroBar
            label="P"
            kcal={targetProtein * 4}
            total={totalMacroCalories}
            color="bg-indigo-500"
          />
          <MacroBar
            label="C"
            kcal={targetCarbs * 4}
            total={totalMacroCalories}
            color="bg-amber-400"
          />
          <MacroBar
            label="F"
            kcal={targetFat * 9}
            total={totalMacroCalories}
            color="bg-red-400"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "保存中..." : "設定を保存する"}
      </button>

      {message && (
        <p
          className={`text-sm text-center font-medium ${
            message.startsWith("エラー") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function MacroBar({
  label,
  kcal,
  total,
  color,
}: {
  label: string;
  kcal: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((kcal / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-zinc-500 w-4">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 w-12 text-right">{pct}%</span>
    </div>
  );
}
