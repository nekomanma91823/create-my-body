"use client";

import { useState } from "react";
import type { Exercise } from "@/app/_lib/types";

interface Props {
  initialExercises: Exercise[];
}

const MUSCLE_GROUPS = ["胸", "背中", "脚", "肩", "腕", "腹", "その他"];

export default function ExerciseManager({ initialExercises }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState("すべて");

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const key = ex.muscleGroup || "その他";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  const musclesWithData = ["すべて", ...Object.keys(grouped).sort()];
  const filtered =
    filter === "すべて"
      ? exercises
      : exercises.filter((ex) => ex.muscleGroup === filter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const body: Exercise = {
        exercise: name.trim(),
        muscleGroup,
        category: category.trim() || muscleGroup,
      };
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setExercises((prev) => [...prev, body]);
      setMessage(`「${name.trim()}」を追加しました`);
      setName("");
      setCategory("");
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 種目一覧 */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-800">
            種目一覧 <span className="text-sm font-normal text-zinc-400">（{exercises.length}件）</span>
          </h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {musclesWithData.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-6">
            種目がまだ登録されていません
          </p>
        ) : (
          <div className="space-y-1">
            {filtered
              .sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup) || a.exercise.localeCompare(b.exercise))
              .map((ex) => (
                <div
                  key={ex.exercise}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 text-sm"
                >
                  <span className="font-medium text-zinc-800">{ex.exercise}</span>
                  <div className="flex gap-2">
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {ex.muscleGroup}
                    </span>
                    {ex.category && ex.category !== ex.muscleGroup && (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                        {ex.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* 追加フォーム */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">種目を追加</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              種目名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: Incline Dumbbell Press"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                部位
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                カテゴリ（任意）
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例: コンパウンド"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "追加中..." : "種目を追加する"}
          </button>

          {message && (
            <p
              className={`text-sm text-center font-medium ${
                message.startsWith("エラー") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
