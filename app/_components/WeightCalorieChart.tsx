"use client";

import { useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TrendPoint } from "@/app/_lib/calculations";

interface Props {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  targetCalories?: number;
}

export default function WeightCalorieChart({ daily, weekly, targetCalories }: Props) {
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const data = view === "daily" ? daily : weekly;

  const hasWeight = data.some((d) => d.weight != null);
  const hasCalories = data.some((d) => d.calories != null);

  if (!hasWeight && !hasCalories) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        データがありません
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(["daily", "weekly"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              view === v
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {v === "daily" ? "30日" : "12週"}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          {hasWeight && (
            <YAxis
              yAxisId="weight"
              orientation="left"
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              label={{ value: "kg", angle: -90, position: "insideLeft", offset: 12, fontSize: 11 }}
            />
          )}
          {hasCalories && (
            <YAxis
              yAxisId="cal"
              orientation="right"
              tick={{ fontSize: 11 }}
              domain={[0, "auto"]}
              label={{ value: "kcal", angle: 90, position: "insideRight", offset: 12, fontSize: 11 }}
            />
          )}
          <Tooltip
            formatter={(value, name) =>
              name === "体重" ? [`${value} kg`, name] : [`${value} kcal`, name]
            }
          />
          <Legend />
          {hasCalories && (
            <Bar
              yAxisId="cal"
              dataKey="calories"
              name="カロリー"
              fill="#fbbf24"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            />
          )}
          {hasCalories && targetCalories && (
            <ReferenceLine
              yAxisId="cal"
              y={targetCalories}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              label={{ value: "目標", fontSize: 10, fill: "#f59e0b" }}
            />
          )}
          {hasWeight && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              name="体重"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
