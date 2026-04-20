"use client";

import { useState, useEffect } from "react";
import type { WorkoutSet, Exercise, WorkoutTemplate, ProgressionSuggestion } from "@/app/_lib/types";
import { calcEst1RM, getProgressionSuggestion } from "@/app/_lib/calculations";

const FALLBACK_EXERCISES: Exercise[] = [
  { exercise: "Bench Press", muscleGroup: "胸", category: "胸" },
  { exercise: "Incline Bench Press", muscleGroup: "胸", category: "胸" },
  { exercise: "Dumbbell Fly", muscleGroup: "胸", category: "胸" },
  { exercise: "Squat", muscleGroup: "脚", category: "脚" },
  { exercise: "Leg Press", muscleGroup: "脚", category: "脚" },
  { exercise: "Romanian Deadlift", muscleGroup: "脚", category: "脚" },
  { exercise: "Deadlift", muscleGroup: "背中", category: "背中" },
  { exercise: "Pull-up", muscleGroup: "背中", category: "背中" },
  { exercise: "Barbell Row", muscleGroup: "背中", category: "背中" },
  { exercise: "Lat Pulldown", muscleGroup: "背中", category: "背中" },
  { exercise: "Overhead Press", muscleGroup: "肩", category: "肩" },
  { exercise: "Lateral Raise", muscleGroup: "肩", category: "肩" },
  { exercise: "Barbell Curl", muscleGroup: "腕", category: "腕" },
  { exercise: "Tricep Pushdown", muscleGroup: "腕", category: "腕" },
  { exercise: "Dip", muscleGroup: "腕", category: "腕" },
];

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export default function WorkoutForm() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exercises, setExercises] = useState<Exercise[]>(FALLBACK_EXERCISES);
  const [exercise, setExercise] = useState(FALLBACK_EXERCISES[0].exercise);
  const [muscleGroup, setMuscleGroup] = useState(FALLBACK_EXERCISES[0].muscleGroup);
  const [setNumber, setSetNumber] = useState(1);
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(8);
  const [rpe, setRpe] = useState(8);
  const [restTime, setRestTime] = useState<number | "">("");
  const [tempo, setTempo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [prevSet, setPrevSet] = useState<WorkoutSet | null>(null);
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSet[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");

  // 種目マスタをAPIから取得（シートが空ならフォールバックを維持）
  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data: Exercise[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setExercises(data);
          setExercise(data[0].exercise);
          setMuscleGroup(data[0].muscleGroup);
        }
      })
      .catch(() => {});
  }, []);

  // ワークアウト履歴・テンプレートを初回のみ取得
  useEffect(() => {
    fetch("/api/workouts")
      .then((r) => r.json())
      .then((data: WorkoutSet[]) => setAllWorkouts(data))
      .catch(() => {});
    fetch("/api/workout-templates")
      .then((r) => r.json())
      .then((data: WorkoutTemplate[]) => setTemplates(data))
      .catch(() => {});
  }, []);

  // 種目・日付が変わったときは取得済みデータから計算
  useEffect(() => {
    const ex = exercises.find((e) => e.exercise === exercise);
    if (ex) setMuscleGroup(ex.muscleGroup);

    const sameExercise = allWorkouts
      .filter((w) => w.exercise === exercise && w.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (sameExercise.length > 0) {
      setPrevSet(sameExercise[0]);
      setSuggestion(getProgressionSuggestion(sameExercise[0]));
    } else {
      setPrevSet(null);
      setSuggestion(null);
    }

    const todaySets = allWorkouts.filter(
      (w) => w.exercise === exercise && w.date === date,
    );
    setSetNumber(todaySets.length + 1);
  }, [exercise, date, allWorkouts, exercises]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          exercise,
          muscleGroup,
          setNumber,
          weight,
          reps,
          rpe,
          restTime: restTime !== "" ? Number(restTime) : undefined,
          tempo: tempo || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const saved: WorkoutSet = await res.json();
      setAllWorkouts((prev) => [...prev, saved]);
      setMessage(`セット${setNumber}を記録しました！`);
      setSetNumber((n) => n + 1);
      setNotes("");
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  const previewEst1RM = calcEst1RM(weight, reps);
  const previewVolume = weight * reps;

  const templateNames = Array.from(new Set(templates.map((t) => t.templateName)));
  const currentTemplateExercises = templates
    .filter((t) => t.templateName === selectedTemplateName)
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template selector */}
      {templates.length > 0 && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-800">テンプレート</h3>
            <select
              value={selectedTemplateName}
              onChange={(e) => setSelectedTemplateName(e.target.value)}
              className="rounded-lg border border-indigo-300 px-2 py-1 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {templateNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {selectedTemplateName && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {currentTemplateExercises.map((t) => {
                const doneToday = allWorkouts.filter(
                  (w) => w.exercise === t.exercise && w.date === date,
                ).length;
                const isDone = doneToday >= t.targetSets;
                const isActive = exercise === t.exercise;
                return (
                  <button
                    key={t.exerciseOrder}
                    type="button"
                    onClick={() => {
                      setExercise(t.exercise);
                      setReps(t.targetReps);
                      setRpe(t.targetRPE);
                    }}
                    className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs text-left border transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : isDone
                          ? "bg-zinc-100 text-zinc-400 border-zinc-200 line-through"
                          : "bg-white text-zinc-700 border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="font-medium">{t.exercise}</div>
                    <div className="opacity-75">
                      {t.targetSets}×{t.targetReps} RPE{t.targetRPE}
                      {doneToday > 0 && !isDone && (
                        <span className="ml-1 text-indigo-400">({doneToday}/{t.targetSets})</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Exercise */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">種目</label>
        <select
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {exercises.map((ex) => (
            <option key={ex.exercise} value={ex.exercise}>
              {ex.exercise}（{ex.muscleGroup}）
            </option>
          ))}
        </select>
      </div>

      {/* Previous session */}
      {prevSet && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 text-sm">
          <p className="font-semibold text-indigo-800 mb-1">
            前回（{prevSet.date}）セット{prevSet.setNumber}
          </p>
          <p className="text-indigo-700">
            {prevSet.weight}kg × {prevSet.reps}回 / RPE {prevSet.rpe} / 推定1RM{" "}
            {prevSet.est1RM}kg
          </p>
          {suggestion && (
            <p className="mt-1 text-indigo-600 font-medium">
              💡 {suggestion.reason}
            </p>
          )}
        </div>
      )}

      {/* Set number */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          セット番号
        </label>
        <input
          type="number"
          min={1}
          value={setNumber}
          onChange={(e) => setSetNumber(parseInt(e.target.value))}
          className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Weight & Reps */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            重量 (kg)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">回数</label>
          <input
            type="number"
            min={1}
            step={1}
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* RPE */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          RPE <span className="text-indigo-600 font-bold">{rpe}</span>
        </label>
        <div className="flex gap-1 flex-wrap">
          {RPE_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRpe(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                rpe === v
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {rpe <= 8
            ? "あと2回以上余裕あり"
            : rpe === 9
              ? "あと1回できた"
              : "全力 — 余力なし"}
        </p>
      </div>

      {/* Rest & Tempo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            休憩時間（秒・任意）
          </label>
          <input
            type="number"
            min={0}
            step={5}
            value={restTime}
            onChange={(e) =>
              setRestTime(e.target.value === "" ? "" : parseInt(e.target.value))
            }
            placeholder="例: 90"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            テンポ（任意）
          </label>
          <input
            type="text"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            placeholder="例: 3-0-1-0"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          メモ（任意）
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="フォームの意識など"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Preview */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-zinc-500">総ボリューム</p>
          <p className="text-lg font-bold text-zinc-800">{previewVolume} kg</p>
        </div>
        <div>
          <p className="text-zinc-500">推定1RM</p>
          <p className="text-lg font-bold text-indigo-600">{previewEst1RM} kg</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "記録中..." : `セット${setNumber}を記録する`}
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
  );
}
