"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BodyMetric } from "@/app/_lib/types";

interface Props {
  metrics: BodyMetric[];
}

export default function BodyMetricsChart({ metrics }: Props) {
  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        データがありません
      </div>
    );
  }

  const hasBodyFat = metrics.some((m) => m.bodyFat != null);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={metrics} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          yAxisId="weight"
          orientation="left"
          tick={{ fontSize: 12 }}
          label={{
            value: "体重 (kg)",
            angle: -90,
            position: "insideLeft",
            offset: 14,
            fontSize: 11,
          }}
          domain={["auto", "auto"]}
        />
        {hasBodyFat && (
          <YAxis
            yAxisId="fat"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{
              value: "体脂肪率 (%)",
              angle: 90,
              position: "insideRight",
              offset: 14,
              fontSize: 11,
            }}
            domain={["auto", "auto"]}
          />
        )}
        <Tooltip />
        <Legend />
        <Line
          yAxisId="weight"
          type="monotone"
          dataKey="weight"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="体重"
          connectNulls
        />
        {hasBodyFat && (
          <Line
            yAxisId="fat"
            type="monotone"
            dataKey="bodyFat"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="体脂肪率"
            connectNulls
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
