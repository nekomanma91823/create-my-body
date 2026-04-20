"use client";

import { useState, useMemo } from "react";
import type { WorkoutSet } from "@/app/_lib/types";

interface Props {
  workouts: WorkoutSet[];
}

export default function WorkoutHistory({ workouts }: Props) {
  const exercises = useMemo(
    () => ["すべて", ...Array.from(new Set(workouts.map((w) => w.exercise)))],
    [workouts],
  );
  const [filterExercise, setFilterExercise] = useState("すべて");
  const [filterMuscle, setFilterMuscle] = useState("すべて");

  const muscleGroups = useMemo(
    () => ["すべて", ...Array.from(new Set(workouts.map((w) => w.muscleGroup)))],
    [workouts],
  );

  const filtered = useMemo(() => {
    return workouts.filter((w) => {
      if (filterExercise !== "すべて" && w.exercise !== filterExercise) return false;
      if (filterMuscle !== "すべて" && w.muscleGroup !== filterMuscle) return false;
      return true;
    });
  }, [workouts, filterExercise, filterMuscle]);

  const byDate = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    for (const w of filtered) {
      if (!map.has(w.date)) map.set(w.date, []);
      map.get(w.date)!.push(w);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const totalSets = filtered.length;
  const totalVolume = filtered.reduce((s, w) => s + w.volume, 0);

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              部位
            </label>
            <select
              value={filterMuscle}
              onChange={(e) => {
                setFilterMuscle(e.target.value);
                setFilterExercise("すべて");
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {muscleGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              種目
            </label>
            <select
              value={filterExercise}
              onChange={(e) => setFilterExercise(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(filterMuscle === "すべて"
                ? exercises
                : [
                    "すべて",
                    ...Array.from(
                      new Set(
                        workouts
                          .filter((w) => w.muscleGroup === filterMuscle)
                          .map((w) => w.exercise),
                      ),
                    ),
                  ]
              ).map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
          <span>{totalSets} セット</span>
          <span>総ボリューム {totalVolume.toLocaleString()} kg</span>
        </div>
      </section>

      {/* 日付別一覧 */}
      {byDate.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">
          記録がありません
        </div>
      ) : (
        byDate.map(([date, sets]) => {
          const dayVolume = sets.reduce((s, w) => s + w.volume, 0);
          const exerciseNames = Array.from(new Set(sets.map((w) => w.exercise)));
          return (
            <section
              key={date}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-200">
                <div>
                  <span className="text-sm font-semibold text-zinc-800">
                    {date}
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    {exerciseNames.join(" · ")}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {dayVolume.toLocaleString()} kg
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                {sets
                  .sort((a, b) => a.exercise.localeCompare(b.exercise) || a.setNumber - b.setNumber)
                  .map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-6 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 w-16">
                          {w.exercise === sets[i - 1]?.exercise ? "" : w.exercise}
                        </span>
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                          Set {w.setNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-semibold text-zinc-800">
                          {w.weight} kg × {w.reps} 回
                        </span>
                        <span className="text-zinc-400">RPE {w.rpe}</span>
                        <span className="text-indigo-600">
                          1RM {w.est1RM} kg
                        </span>
                        <span className="text-zinc-400">
                          {w.volume} kg
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
