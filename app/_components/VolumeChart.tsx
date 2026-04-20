"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyVolume } from "@/app/_lib/types";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#f97316",
];

interface Props {
  data: WeeklyVolume[];
  muscleGroups: string[];
}

export default function VolumeChart({ data, muscleGroups }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400">
        データがありません
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: "kg", angle: -90, position: "insideLeft", offset: 10, fontSize: 12 }}
        />
        <Tooltip
          formatter={(v, name) => [`${v} kg`, name]}
        />
        <Legend />
        {muscleGroups.map((group, i) => (
          <Bar
            key={group}
            dataKey={group}
            stackId="a"
            fill={COLORS[i % COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
