"use client";

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
} from "recharts";
import type { ExerciseTrend } from "@/app/_lib/types";

interface Props {
  data: ExerciseTrend[];
}

export default function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400">
        データがありません
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          yAxisId="left"
          orientation="left"
          tick={{ fontSize: 12 }}
          label={{ value: "Est 1RM (kg)", angle: -90, position: "insideLeft", offset: 14, fontSize: 11 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          label={{ value: "Volume (kg)", angle: 90, position: "insideRight", offset: 14, fontSize: 11 }}
        />
        <Tooltip />
        <Legend />
        <Bar yAxisId="right" dataKey="volume" fill="#e0e7ff" name="ボリューム" />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="est1RM"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="推定1RM"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
