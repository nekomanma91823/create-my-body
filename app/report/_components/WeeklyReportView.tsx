"use client";

import { useState } from "react";
import type { WeeklyReport } from "@/app/_lib/gemini";

interface StatProps {
  label: string;
  value: string;
  sub?: string;
}

interface Props {
  week: string;
  stats: {
    totalVolume: number;
    prevVolume: number;
    sessions: number;
    byMuscle: Record<string, number>;
    avgCalories: number | null;
    avgProtein: number | null;
    daysLogged: number;
    targetCalories: number | null;
    targetProtein: number | null;
    weightStart: number | null;
    weightEnd: number | null;
  };
}

export default function WeeklyReportView({ week, stats }: Props) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const volumeChange =
    stats.prevVolume > 0
      ? Math.round(((stats.totalVolume - stats.prevVolume) / stats.prevVolume) * 100)
      : null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/weekly", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 今週のサマリーカード */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-800">今週のデータ（{week}）</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <StatCard
            label="総ボリューム"
            value={`${stats.totalVolume.toLocaleString()} kg`}
            sub={
              volumeChange != null
                ? `先週比 ${volumeChange >= 0 ? "+" : ""}${volumeChange}%`
                : undefined
            }
          />
          <StatCard label="セッション数" value={`${stats.sessions} 日`} />
          {stats.avgCalories != null && (
            <StatCard
              label="平均カロリー"
              value={`${Math.round(stats.avgCalories)} kcal`}
              sub={
                stats.targetCalories
                  ? `目標 ${stats.targetCalories} kcal`
                  : undefined
              }
            />
          )}
          {stats.avgProtein != null && (
            <StatCard
              label="平均タンパク質"
              value={`${Math.round(stats.avgProtein)} g`}
              sub={
                stats.targetProtein
                  ? `目標 ${stats.targetProtein} g`
                  : undefined
              }
            />
          )}
          {stats.weightStart != null && stats.weightEnd != null && (
            <StatCard
              label="体重変化"
              value={`${stats.weightStart} → ${stats.weightEnd} kg`}
              sub={`${stats.weightEnd - stats.weightStart >= 0 ? "+" : ""}${Math.round((stats.weightEnd - stats.weightStart) * 10) / 10} kg`}
            />
          )}
          <StatCard label="食事記録日数" value={`${stats.daysLogged} 日`} />
        </div>

        {Object.keys(stats.byMuscle).length > 0 && (
          <div className="pt-4 border-t border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 mb-2">部位別ボリューム</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byMuscle)
                .sort(([, a], [, b]) => b - a)
                .map(([muscle, vol]) => (
                  <span
                    key={muscle}
                    className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full"
                  >
                    {muscle} {vol.toLocaleString()} kg
                  </span>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* Gemini レポート */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-800">AI 週次レポート</h2>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "生成中..." : report ? "再生成" : "✨ レポートを生成"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
            Gemini が分析中...
          </div>
        )}

        {report && !loading && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-700 leading-relaxed">{report.summary}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <ReportList
                title="良かった点"
                items={report.highlights}
                color="text-emerald-700"
                bg="bg-emerald-50"
                border="border-emerald-200"
                icon="✓"
              />
              <ReportList
                title="改善点"
                items={report.improvements}
                color="text-amber-700"
                bg="bg-amber-50"
                border="border-amber-200"
                icon="△"
              />
            </div>

            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
              <p className="text-xs font-semibold text-indigo-600 mb-1">来週へのアドバイス</p>
              <p className="text-sm text-indigo-800">{report.nextWeekAdvice}</p>
            </div>
          </div>
        )}

        {!report && !loading && !error && (
          <p className="text-sm text-zinc-400 text-center py-8">
            ボタンを押すと今週のデータを分析してAIがフィードバックを生成します
          </p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: StatProps) {
  return (
    <div className="bg-zinc-50 rounded-xl p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-base font-bold text-zinc-900">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ReportList({
  title,
  items,
  color,
  bg,
  border,
  icon,
}: {
  title: string;
  items: string[];
  color: string;
  bg: string;
  border: string;
  icon: string;
}) {
  return (
    <div className={`rounded-xl ${bg} border ${border} p-4`}>
      <p className={`text-xs font-semibold ${color} mb-2`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={`text-sm ${color} flex gap-2`}>
            <span>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
