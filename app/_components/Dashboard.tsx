"use client";

import { useState } from "react";
import VolumeChart from "./VolumeChart";
import TrendChart from "./TrendChart";
import type {
  WorkoutSet,
  WeeklyVolume,
  ExerciseTrend,
  Meal,
  UserSettings,
} from "@/app/_lib/types";

interface Props {
  exercises: string[];
  volumeData: WeeklyVolume[];
  muscleGroups: string[];
  recentSets: WorkoutSet[];
  totalVolumeThisWeek: number;
  todayTotals: { calories: number; protein: number; carbs: number; fat: number };
  settings: UserSettings | null;
  trendsByExercise: Record<string, ExerciseTrend[]>;
}

export default function Dashboard({
  exercises,
  volumeData,
  muscleGroups,
  recentSets,
  totalVolumeThisWeek,
  todayTotals,
  settings,
  trendsByExercise,
}: Props) {
  const [selectedExercise, setSelectedExercise] = useState(exercises[0] ?? "");
  const trendData = trendsByExercise[selectedExercise] ?? [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="今週のボリューム"
            value={`${totalVolumeThisWeek.toLocaleString()} kg`}
          />
          <StatCard label="総セット数" value={`${recentSets.length > 0 ? exercises.length : 0} sets`} />
          <StatCard label="種目数" value={`${exercises.length} 種目`} />
        </div>

        {/* Today's nutrition */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">
            今日の栄養摂取
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <NutritionCard
              label="カロリー"
              current={Math.round(todayTotals.calories)}
              target={settings?.targetCalories}
              unit="kcal"
            />
            <NutritionCard
              label="タンパク質"
              current={Math.round(todayTotals.protein * 10) / 10}
              target={settings?.targetProtein}
              unit="g"
              color="text-indigo-600"
              barColor="bg-indigo-500"
            />
            <NutritionCard
              label="炭水化物"
              current={Math.round(todayTotals.carbs * 10) / 10}
              target={settings?.targetCarbs}
              unit="g"
              color="text-amber-600"
              barColor="bg-amber-400"
            />
            <NutritionCard
              label="脂質"
              current={Math.round(todayTotals.fat * 10) / 10}
              target={settings?.targetFat}
              unit="g"
              color="text-red-500"
              barColor="bg-red-400"
            />
          </div>
          {!settings && (
            <p className="mt-3 text-xs text-zinc-400">
              目標値を設定すると進捗バーが表示されます
            </p>
          )}
        </section>

        {/* Weekly volume chart */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">
            週次総ボリューム（部位別）
          </h2>
          <VolumeChart data={volumeData} muscleGroups={muscleGroups} />
        </section>

        {/* Exercise trend chart */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-zinc-800">
              強度トレンド
            </h2>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {exercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
          <TrendChart data={trendData} />
        </section>

        {/* Recent sets */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">
            最近のセット
          </h2>
          {recentSets.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              まだデータがありません。セットを記録してみましょう！
            </p>
          ) : (
            <div className="space-y-2">
              {recentSets.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 text-sm"
                >
                  <div>
                    <span className="font-medium text-zinc-800">
                      {w.exercise}
                    </span>
                    <span className="ml-2 text-zinc-400 text-xs">
                      {w.date} · Set {w.setNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-800 font-medium">
                      {w.weight}kg × {w.reps}回
                    </span>
                    <span className="ml-2 text-indigo-600 text-xs">
                      RPE {w.rpe} · 1RM {w.est1RM}kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function NutritionCard({
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
      {target && (
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
