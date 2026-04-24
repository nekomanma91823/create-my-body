import { getWorkoutTemplates, addWorkoutTemplate } from "@/app/_lib/sheets";
import type { WorkoutTemplate } from "@/app/_lib/types";

const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  // ── Push（胸・肩・三頭） ──────────────────────────
  { templateName: "Push（胸・肩・三頭）", exerciseOrder: 1, exercise: "ベンチプレス",           targetSets: 4, targetReps: 8,  targetRPE: 8 },
  { templateName: "Push（胸・肩・三頭）", exerciseOrder: 2, exercise: "インクラインベンチプレス", targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Push（胸・肩・三頭）", exerciseOrder: 3, exercise: "ショルダープレス",        targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Push（胸・肩・三頭）", exerciseOrder: 4, exercise: "サイドレイズ",            targetSets: 3, targetReps: 15, targetRPE: 7 },
  { templateName: "Push（胸・肩・三頭）", exerciseOrder: 5, exercise: "トライセプスプレスダウン", targetSets: 3, targetReps: 12, targetRPE: 7 },

  // ── Pull（背中・二頭） ──────────────────────────
  { templateName: "Pull（背中・二頭）", exerciseOrder: 1, exercise: "デッドリフト",       targetSets: 3, targetReps: 5,  targetRPE: 8 },
  { templateName: "Pull（背中・二頭）", exerciseOrder: 2, exercise: "懸垂",               targetSets: 3, targetReps: 8,  targetRPE: 8 },
  { templateName: "Pull（背中・二頭）", exerciseOrder: 3, exercise: "ラットプルダウン",    targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Pull（背中・二頭）", exerciseOrder: 4, exercise: "シーテッドロウ",      targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Pull（背中・二頭）", exerciseOrder: 5, exercise: "バーベルカール",      targetSets: 3, targetReps: 12, targetRPE: 7 },

  // ── Legs（脚） ─────────────────────────────────
  { templateName: "Legs（脚）", exerciseOrder: 1, exercise: "スクワット",             targetSets: 4, targetReps: 8,  targetRPE: 8 },
  { templateName: "Legs（脚）", exerciseOrder: 2, exercise: "レッグプレス",           targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Legs（脚）", exerciseOrder: 3, exercise: "ルーマニアンデッドリフト", targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Legs（脚）", exerciseOrder: 4, exercise: "レッグカール",           targetSets: 3, targetReps: 12, targetRPE: 7 },
  { templateName: "Legs（脚）", exerciseOrder: 5, exercise: "カーフレイズ",           targetSets: 4, targetReps: 15, targetRPE: 7 },

  // ── Upper（上半身） ────────────────────────────
  { templateName: "Upper（上半身）", exerciseOrder: 1, exercise: "ベンチプレス",            targetSets: 4, targetReps: 8,  targetRPE: 8 },
  { templateName: "Upper（上半身）", exerciseOrder: 2, exercise: "ベントオーバーロウ",       targetSets: 4, targetReps: 8,  targetRPE: 8 },
  { templateName: "Upper（上半身）", exerciseOrder: 3, exercise: "ショルダープレス",         targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Upper（上半身）", exerciseOrder: 4, exercise: "懸垂",                    targetSets: 3, targetReps: 8,  targetRPE: 8 },
  { templateName: "Upper（上半身）", exerciseOrder: 5, exercise: "バーベルカール",           targetSets: 2, targetReps: 12, targetRPE: 7 },
  { templateName: "Upper（上半身）", exerciseOrder: 6, exercise: "トライセプスプレスダウン",  targetSets: 2, targetReps: 12, targetRPE: 7 },

  // ── Lower（下半身） ────────────────────────────
  { templateName: "Lower（下半身）", exerciseOrder: 1, exercise: "スクワット",             targetSets: 4, targetReps: 6,  targetRPE: 8 },
  { templateName: "Lower（下半身）", exerciseOrder: 2, exercise: "ルーマニアンデッドリフト", targetSets: 3, targetReps: 8,  targetRPE: 8 },
  { templateName: "Lower（下半身）", exerciseOrder: 3, exercise: "レッグプレス",           targetSets: 3, targetReps: 10, targetRPE: 8 },
  { templateName: "Lower（下半身）", exerciseOrder: 4, exercise: "レッグカール",           targetSets: 3, targetReps: 12, targetRPE: 7 },
  { templateName: "Lower（下半身）", exerciseOrder: 5, exercise: "カーフレイズ",           targetSets: 4, targetReps: 15, targetRPE: 7 },
];

export async function POST() {
  try {
    const existing = await getWorkoutTemplates();
    const existingKeys = new Set(
      existing.map((t) => `${t.templateName}__${t.exercise}`)
    );
    const toAdd = DEFAULT_TEMPLATES.filter(
      (t) => !existingKeys.has(`${t.templateName}__${t.exercise}`)
    );
    for (const tmpl of toAdd) {
      await addWorkoutTemplate(tmpl);
    }
    return Response.json({ added: toAdd.length, skipped: DEFAULT_TEMPLATES.length - toAdd.length });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
