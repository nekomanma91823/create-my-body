import { getExercises, addExercise } from "@/app/_lib/sheets";
import type { Exercise } from "@/app/_lib/types";

const DEFAULT_EXERCISES: Exercise[] = [
  // 胸
  { exercise: "ベンチプレス", muscleGroup: "胸", category: "コンパウンド" },
  { exercise: "インクラインベンチプレス", muscleGroup: "胸", category: "コンパウンド" },
  { exercise: "デクラインベンチプレス", muscleGroup: "胸", category: "コンパウンド" },
  { exercise: "ダンベルフライ", muscleGroup: "胸", category: "アイソレーション" },
  { exercise: "ケーブルクロスオーバー", muscleGroup: "胸", category: "アイソレーション" },
  { exercise: "ディップス", muscleGroup: "胸", category: "コンパウンド" },
  // 背中
  { exercise: "デッドリフト", muscleGroup: "背中", category: "コンパウンド" },
  { exercise: "懸垂", muscleGroup: "背中", category: "コンパウンド" },
  { exercise: "ラットプルダウン", muscleGroup: "背中", category: "コンパウンド" },
  { exercise: "ベントオーバーロウ", muscleGroup: "背中", category: "コンパウンド" },
  { exercise: "シーテッドロウ", muscleGroup: "背中", category: "コンパウンド" },
  { exercise: "ワンハンドロウ", muscleGroup: "背中", category: "コンパウンド" },
  { exercise: "フェイスプル", muscleGroup: "背中", category: "アイソレーション" },
  // 脚
  { exercise: "スクワット", muscleGroup: "脚", category: "コンパウンド" },
  { exercise: "レッグプレス", muscleGroup: "脚", category: "コンパウンド" },
  { exercise: "ルーマニアンデッドリフト", muscleGroup: "脚", category: "コンパウンド" },
  { exercise: "ブルガリアンスクワット", muscleGroup: "脚", category: "コンパウンド" },
  { exercise: "レッグカール", muscleGroup: "脚", category: "アイソレーション" },
  { exercise: "レッグエクステンション", muscleGroup: "脚", category: "アイソレーション" },
  { exercise: "カーフレイズ", muscleGroup: "脚", category: "アイソレーション" },
  // 肩
  { exercise: "ショルダープレス", muscleGroup: "肩", category: "コンパウンド" },
  { exercise: "サイドレイズ", muscleGroup: "肩", category: "アイソレーション" },
  { exercise: "フロントレイズ", muscleGroup: "肩", category: "アイソレーション" },
  { exercise: "リアデルトフライ", muscleGroup: "肩", category: "アイソレーション" },
  // 腕
  { exercise: "バーベルカール", muscleGroup: "腕", category: "アイソレーション" },
  { exercise: "ダンベルカール", muscleGroup: "腕", category: "アイソレーション" },
  { exercise: "ハンマーカール", muscleGroup: "腕", category: "アイソレーション" },
  { exercise: "トライセプスプレスダウン", muscleGroup: "腕", category: "アイソレーション" },
  { exercise: "スカルクラッシャー", muscleGroup: "腕", category: "アイソレーション" },
  { exercise: "ディップス（腕）", muscleGroup: "腕", category: "コンパウンド" },
  // 腹
  { exercise: "クランチ", muscleGroup: "腹", category: "アイソレーション" },
  { exercise: "レッグレイズ", muscleGroup: "腹", category: "アイソレーション" },
  { exercise: "プランク", muscleGroup: "腹", category: "コンパウンド" },
];

export async function POST() {
  try {
    const existing = await getExercises();
    const existingNames = new Set(existing.map((e) => e.exercise));
    const toAdd = DEFAULT_EXERCISES.filter((e) => !existingNames.has(e.exercise));
    for (const ex of toAdd) {
      await addExercise(ex);
    }
    return Response.json({ added: toAdd.length, skipped: DEFAULT_EXERCISES.length - toAdd.length });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
