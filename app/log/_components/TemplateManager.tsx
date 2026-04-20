"use client";

import { useState, useEffect } from "react";
import type { WorkoutTemplate, Exercise } from "@/app/_lib/types";

export default function TemplateManager() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // 新規テンプレート入力
  const [templateName, setTemplateName] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(8);
  const [targetRPE, setTargetRPE] = useState(8);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/workout-templates").then((r) => r.json()),
      fetch("/api/exercises").then((r) => r.json()),
    ])
      .then(([tmpl, exs]: [WorkoutTemplate[], Exercise[]]) => {
        setTemplates(tmpl);
        setExercises(exs);
        if (exs.length > 0) setSelectedExercise(exs[0].exercise);
      })
      .finally(() => setLoading(false));
  }, []);

  const templateNames = Array.from(new Set(templates.map((t) => t.templateName)));
  const grouped = templateNames.reduce<Record<string, WorkoutTemplate[]>>(
    (acc, name) => {
      acc[name] = templates
        .filter((t) => t.templateName === name)
        .sort((a, b) => a.exerciseOrder - b.exerciseOrder);
      return acc;
    },
    {},
  );

  const resolvedTemplateName = templateName === "__new__" ? newTemplateName : templateName;

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedTemplateName.trim() || !selectedExercise) return;
    setSaving(true);
    setMessage(null);
    try {
      const existing = templates.filter(
        (t) => t.templateName === resolvedTemplateName,
      );
      const exerciseOrder = existing.length + 1;
      const body: WorkoutTemplate = {
        templateName: resolvedTemplateName.trim(),
        exerciseOrder,
        exercise: selectedExercise,
        targetSets,
        targetReps,
        targetRPE,
      };
      const res = await fetch("/api/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setTemplates((prev) => [...prev, body]);
      setMessage(`「${resolvedTemplateName}」に ${selectedExercise} を追加しました`);
      if (templateName === "__new__") {
        setTemplateName(resolvedTemplateName.trim());
        setNewTemplateName("");
      }
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 既存テンプレート一覧 */}
      {templateNames.length > 0 && (
        <section className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-zinc-800">テンプレート一覧</h2>
          {templateNames.map((name) => (
            <div key={name}>
              <h3 className="text-sm font-semibold text-zinc-700 mb-2">{name}</h3>
              <div className="space-y-1">
                {grouped[name].map((t) => (
                  <div
                    key={t.exerciseOrder}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 w-4">
                        {t.exerciseOrder}
                      </span>
                      <span className="font-medium text-zinc-800">
                        {t.exercise}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {t.targetSets} セット × {t.targetReps} 回 / RPE {t.targetRPE}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 種目追加フォーム */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-4">
          種目を追加
        </h2>
        <form onSubmit={handleAddExercise} className="space-y-4">
          {/* テンプレート名 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              テンプレート
            </label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {templateNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value="__new__">+ 新しいテンプレートを作成</option>
            </select>
          </div>

          {templateName === "__new__" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                テンプレート名
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="例: 胸・肩・三頭"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          {/* 種目 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              種目
            </label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {exercises.map((ex) => (
                <option key={ex.exercise} value={ex.exercise}>
                  {ex.exercise}（{ex.muscleGroup}）
                </option>
              ))}
            </select>
          </div>

          {/* セット・レップ・RPE */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                目標セット数
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={targetSets}
                onChange={(e) => setTargetSets(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                目標回数
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={targetReps}
                onChange={(e) => setTargetReps(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                目標 RPE
              </label>
              <select
                value={targetRPE}
                onChange={(e) => setTargetRPE(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !templateName || (templateName === "__new__" && !newTemplateName.trim())}
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
