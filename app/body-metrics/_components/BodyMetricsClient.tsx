"use client";

import { useState } from "react";
import type { BodyMetric } from "@/app/_lib/types";
import BodyMetricsChart from "@/app/_components/BodyMetricsChart";
import BodyMetricsForm from "./BodyMetricsForm";

interface Props {
  initialMetrics: BodyMetric[];
}

export default function BodyMetricsClient({ initialMetrics }: Props) {
  const [metrics, setMetrics] = useState<BodyMetric[]>(initialMetrics);

  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  const prev = sorted.at(-2);

  function handleMetricAdded(metric: BodyMetric) {
    setMetrics((prev) => [...prev, metric]);
  }

  return (
    <div className="space-y-6">
      {/* 最新値サマリー */}
      {latest && (
        <section className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-4">最新の記録</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard
              label="体重"
              value={`${latest.weight} kg`}
              diff={prev ? latest.weight - prev.weight : undefined}
              unit="kg"
            />
            {latest.bodyFat != null && (
              <MetricCard
                label="体脂肪率"
                value={`${latest.bodyFat} %`}
                diff={
                  prev?.bodyFat != null ? latest.bodyFat - prev.bodyFat : undefined
                }
                unit="%"
              />
            )}
            {latest.waist != null && (
              <MetricCard label="腹囲" value={`${latest.waist} cm`} />
            )}
            {latest.arm != null && (
              <MetricCard label="腕囲" value={`${latest.arm} cm`} />
            )}
          </div>
          <p className="mt-3 text-xs text-zinc-400">{latest.date} 時点</p>
        </section>
      )}

      {/* トレンドチャート */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">
          体重・体脂肪率トレンド
        </h2>
        <BodyMetricsChart metrics={sorted} />
      </section>

      {/* 記録フォーム */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-6">体組成を記録</h2>
        <BodyMetricsForm onMetricAdded={handleMetricAdded} />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  diff,
  unit,
}: {
  label: string;
  value: string;
  diff?: number;
  unit?: string;
}) {
  const isPositive = diff != null && diff > 0;
  const isNegative = diff != null && diff < 0;
  return (
    <div className="bg-zinc-50 rounded-xl p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-zinc-900">{value}</p>
      {diff != null && diff !== 0 && (
        <p
          className={`text-xs mt-0.5 ${
            isNegative ? "text-indigo-500" : isPositive ? "text-red-400" : "text-zinc-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {Math.round(diff * 10) / 10}
          {unit} 前回比
        </p>
      )}
    </div>
  );
}
