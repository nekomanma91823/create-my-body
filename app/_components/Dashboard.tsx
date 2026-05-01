"use client";

import { useState } from "react";
import Link from "next/link";
import VolumeChart from "./VolumeChart";
import TrendChart from "./TrendChart";
import WeightCalorieChart from "./WeightCalorieChart";
import type {
  WorkoutSet,
  WeeklyVolume,
  ExerciseTrend,
  UserSettings,
} from "@/app/_lib/types";
import type { TrendPoint } from "@/app/_lib/calculations";
import type { NutritionAdvice } from "@/app/_lib/gemini";

interface Props {
  exercises: string[];
  volumeData: WeeklyVolume[];
  muscleGroups: string[];
  recentSets: WorkoutSet[];
  totalVolumeThisWeek: number;
  thisWeekSessions: number;
  todayTotals: { calories: number; protein: number; carbs: number; fat: number };
  settings: UserSettings | null;
  trendsByExercise: Record<string, ExerciseTrend[]>;
  latestWeight: number | null;
  trendData: { daily: TrendPoint[]; weekly: TrendPoint[] };
}

export default function Dashboard({
  exercises,
  volumeData,
  muscleGroups,
  recentSets,
  totalVolumeThisWeek,
  thisWeekSessions,
  todayTotals,
  settings,
  trendsByExercise,
  latestWeight,
  trendData,
}: Props) {
  const [selectedExercise, setSelectedExercise] = useState(exercises[0] ?? "");
  const trendChartData = trendsByExercise[selectedExercise] ?? [];
  const [advice, setAdvice] = useState<NutritionAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  async function fetchAdvice() {
    if (!settings) return;
    setLoadingAdvice(true);
    setAdvice(null);
    try {
      const res = await fetch("/api/nutrition/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targets: { calories: settings.targetCalories, protein: settings.targetProtein, carbs: settings.targetCarbs, fat: settings.targetFat },
          current: todayTotals,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setAdvice(await res.json());
    } catch (e) {
      setAdvice({ summary: `エラー: ${e instanceof Error ? e.message : String(e)}`, suggestions: [] });
    } finally {
      setLoadingAdvice(false);
    }
  }

  const calorieRemaining = settings
    ? Math.max(settings.targetCalories - Math.round(todayTotals.calories), 0)
    : null;
  const calorieOver = settings
    ? Math.max(Math.round(todayTotals.calories) - settings.targetCalories, 0)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── クイックステータス ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="今週のトレーニング"
            value={`${thisWeekSessions} 日`}
            sub={`ボリューム ${totalVolumeThisWeek.toLocaleString()} kg`}
            color="text-indigo-600"
            href="/history"
          />
          <StatCard
            label={calorieOver > 0 ? "カロリーオーバー" : "カロリー残り"}
            value={calorieRemaining !== null ? `${calorieOver > 0 ? "+" + calorieOver : calorieRemaining} kcal` : `${Math.round(todayTotals.calories)} kcal`}
            sub={settings ? `目標 ${settings.targetCalories} kcal` : "目標未設定"}
            color={calorieOver > 0 ? "text-red-500" : "text-emerald-600"}
            href="/meals"
          />
          <StatCard
            label="直近の体重"
            value={latestWeight !== null ? `${latestWeight} kg` : "未記録"}
            sub="最新の記録"
            color="text-amber-600"
            href="/body-metrics"
          />
          <StatCard
            label="タンパク質"
            value={`${Math.round(todayTotals.protein * 10) / 10} g`}
            sub={settings ? `目標 ${settings.targetProtein} g` : "今日の摂取"}
            color="text-violet-600"
            href="/meals"
          />
        </div>

        {/* ── 今日の栄養 ── */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-800">今日の栄養摂取</h2>
            <Link href="/meals" className="text-xs text-indigo-600 hover:underline">+ 記録</Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <NutritionBar
              label="カロリー"
              current={Math.round(todayTotals.calories)}
              target={settings?.targetCalories}
              unit="kcal"
            />
            <NutritionBar
              label="タンパク質"
              current={Math.round(todayTotals.protein * 10) / 10}
              target={settings?.targetProtein}
              unit="g"
              color="text-indigo-600"
              barColor="bg-indigo-500"
            />
            <NutritionBar
              label="炭水化物"
              current={Math.round(todayTotals.carbs * 10) / 10}
              target={settings?.targetCarbs}
              unit="g"
              color="text-amber-600"
              barColor="bg-amber-400"
            />
            <NutritionBar
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
              <Link href="/settings" className="underline">設定</Link>から目標値を登録すると進捗バーが表示されます
            </p>
          )}
        </section>

        {/* ── 栄養ギャップ＆AIアドバイス ── */}
        {settings && (
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-800">今日の残り栄養</h2>
              <button
                onClick={fetchAdvice}
                disabled={loadingAdvice}
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loadingAdvice ? "AI分析中..." : "✨ AIにアドバイスをもらう"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "カロリー", current: Math.round(todayTotals.calories), target: settings.targetCalories, unit: "kcal" },
                { label: "タンパク質", current: Math.round(todayTotals.protein * 10) / 10, target: settings.targetProtein, unit: "g" },
                { label: "炭水化物", current: Math.round(todayTotals.carbs * 10) / 10, target: settings.targetCarbs, unit: "g" },
                { label: "脂質", current: Math.round(todayTotals.fat * 10) / 10, target: settings.targetFat, unit: "g" },
              ].map(({ label, current, target, unit }) => {
                const gap = Math.round((target - current) * 10) / 10;
                const pct = Math.min((current / target) * 100, 100);
                const over = current > target;
                const color = over ? "text-red-500" : pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-500" : "text-zinc-500";
                const barColor = over ? "bg-red-400" : pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-zinc-300";
                return (
                  <div key={label} className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>
                      {over ? `+${Math.abs(gap)}` : `あと ${gap}`}
                      <span className="font-normal text-xs ml-0.5">{unit}</span>
                    </p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{Math.round(pct)}% 達成</p>
                  </div>
                );
              })}
            </div>

            {advice && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-3">
                <p className="text-sm font-medium text-indigo-800">{advice.summary}</p>
                {advice.suggestions.length > 0 && (
                  <div className="space-y-2">
                    {advice.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="shrink-0 text-indigo-400 font-bold">{i + 1}.</span>
                        <div>
                          <span className="font-medium text-indigo-900">{s.food}</span>
                          <span className="text-indigo-600 ml-1.5 text-xs">{s.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── 体重・カロリー推移 ── */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-zinc-800">体重・カロリー推移</h2>
            <Link href="/body-metrics" className="text-xs text-indigo-600 hover:underline">+ 体重記録</Link>
          </div>
          <WeightCalorieChart
            daily={trendData.daily}
            weekly={trendData.weekly}
            targetCalories={settings?.targetCalories}
          />
        </section>

        {/* ── 週次ボリューム ── */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">週次総ボリューム（部位別）</h2>
          <VolumeChart data={volumeData} muscleGroups={muscleGroups} />
        </section>

        {/* ── 強度トレンド ── */}
        {exercises.length > 0 && (
          <section className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base font-semibold text-zinc-800">強度トレンド</h2>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {exercises.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            <TrendChart data={trendChartData} />
          </section>
        )}

        {/* ── 最近のセット ── */}
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-800">最近のセット</h2>
            <Link href="/log" className="text-xs text-indigo-600 hover:underline">+ 記録</Link>
          </div>
          {recentSets.length === 0 ? (
            <p className="text-zinc-400 text-sm">まだデータがありません。セットを記録してみましょう！</p>
          ) : (
            <div className="space-y-2">
              {recentSets.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 text-sm"
                >
                  <div>
                    <span className="font-medium text-zinc-800">{w.exercise}</span>
                    <span className="ml-2 text-zinc-400 text-xs">{w.date} · Set {w.setNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-800 font-medium">{w.weight}kg × {w.reps}回</span>
                    <span className="ml-2 text-indigo-600 text-xs">RPE {w.rpe} · 1RM {w.est1RM}kg</span>
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

function StatCard({
  label, value, sub, color = "text-zinc-900", href,
}: {
  label: string; value: string; sub?: string; color?: string; href?: string;
}) {
  const content = (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-300 transition-colors">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function NutritionBar({
  label, current, target, unit,
  color = "text-zinc-800", barColor = "bg-zinc-400",
}: {
  label: string; current: number; target?: number; unit: string;
  color?: string; barColor?: string;
}) {
  const pct = target ? Math.min((current / target) * 100, 100) : null;
  const remaining = target ? Math.max(target - current, 0) : null;
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {current}<span className="text-xs font-normal text-zinc-500 ml-0.5">{unit}</span>
      </p>
      {target != null && (
        <>
          <div className="mt-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">あと {remaining}{unit}</p>
        </>
      )}
    </div>
  );
}
