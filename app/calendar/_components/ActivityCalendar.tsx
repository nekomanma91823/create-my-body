"use client";

import { useState } from "react";

interface Props {
  workoutDates: string[];
  mealDates: string[];
  metricDates: string[];
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export default function ActivityCalendar({ workoutDates, mealDates, metricDates }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const workoutSet = new Set(workoutDates);
  const mealSet = new Set(mealDates);
  const metricSet = new Set(metricDates);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // 月の1日の曜日（月曜始まり: 0=月, 6=日）
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6行になるよう末尾を埋める
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const totalWorkoutDays = cells.filter(
    (d) => d != null && workoutSet.has(dateStr(d!))
  ).length;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
        >
          ←
        </button>
        <h2 className="text-base font-semibold text-zinc-800">
          {year}年 {month + 1}月
          <span className="ml-2 text-sm font-normal text-zinc-400">
            トレーニング {totalWorkoutDays}日
          </span>
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
          disabled={year === today.getFullYear() && month === today.getMonth()}
        >
          →
        </button>
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
          トレーニング
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          食事
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          体組成
        </span>
      </div>

      {/* グリッド */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-zinc-100">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-medium ${
                i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-zinc-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day == null) {
              return <div key={i} className="aspect-square border-b border-r border-zinc-50" />;
            }
            const ds = dateStr(day);
            const isToday = ds === todayStr;
            const hasWorkout = workoutSet.has(ds);
            const hasMeal = mealSet.has(ds);
            const hasMetric = metricSet.has(ds);
            const col = i % 7;

            return (
              <div
                key={i}
                className={`aspect-square border-b border-r border-zinc-50 flex flex-col items-center justify-start pt-1.5 gap-0.5 ${
                  isToday ? "bg-indigo-50" : ""
                }`}
              >
                <span
                  className={`text-xs leading-none ${
                    isToday
                      ? "font-bold text-indigo-600"
                      : col === 5
                        ? "text-blue-400"
                        : col === 6
                          ? "text-red-400"
                          : "text-zinc-700"
                  }`}
                >
                  {day}
                </span>
                <div className="flex gap-0.5">
                  {hasWorkout && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                  {hasMeal && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                  {hasMetric && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
