import { GoogleGenAI } from "@google/genai";
import type { NutritionEstimate, WorkoutSet } from "./types";

export interface AiProgressionSuggestion {
  targetWeight: number;
  targetReps: number;
  targetRPE: number;
  strategy: string;
  reasoning: string;
}

export interface WeeklyReportInput {
  week: string;
  training: {
    totalVolume: number;
    prevVolume: number;
    byMuscle: Record<string, number>;
    sessions: number;
    exercises: string[];
  };
  nutrition: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    targetCalories: number;
    targetProtein: number;
    daysLogged: number;
  } | null;
  body: { start: number | null; end: number | null } | null;
}

export interface WeeklyReport {
  summary: string;
  highlights: string[];
  improvements: string[];
  nextWeekAdvice: string;
}

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

export async function generateWeeklyReport(input: WeeklyReportInput): Promise<WeeklyReport> {
  const ai = getAI();
  const { training, nutrition, body, week } = input;
  const volumeChange =
    training.prevVolume > 0
      ? Math.round(((training.totalVolume - training.prevVolume) / training.prevVolume) * 100)
      : null;
  const byMuscleStr = Object.entries(training.byMuscle)
    .map(([g, v]) => `${g} ${v.toLocaleString()}kg`)
    .join(" / ");

  const prompt = `以下のデータをもとに、今週（${week}）のトレーニング・栄養レポートを日本語で作成してください。

【トレーニング】
- セッション数: ${training.sessions}日
- 総ボリューム: ${training.totalVolume.toLocaleString()}kg${volumeChange != null ? `（先週比 ${volumeChange >= 0 ? "+" : ""}${volumeChange}%）` : ""}
- 部位別: ${byMuscleStr || "データなし"}
- 種目: ${training.exercises.slice(0, 8).join(", ")}${training.exercises.length > 8 ? "…" : ""}

【栄養】${
    nutrition
      ? `
- 記録日数: ${nutrition.daysLogged}日
- 平均カロリー: ${Math.round(nutrition.avgCalories)}kcal（目標 ${nutrition.targetCalories}kcal）
- 平均タンパク質: ${Math.round(nutrition.avgProtein)}g（目標 ${nutrition.targetProtein}g）
- 平均炭水化物: ${Math.round(nutrition.avgCarbs)}g
- 平均脂質: ${Math.round(nutrition.avgFat)}g`
      : "\n- 記録なし"
  }

【体重変化】${
    body?.start != null && body?.end != null
      ? `\n- ${body.start}kg → ${body.end}kg（${body.end - body.start >= 0 ? "+" : ""}${Math.round((body.end - body.start) * 10) / 10}kg）`
      : "\n- データなし"
  }

以下のJSON形式のみで回答してください（説明不要）:
{"summary":"今週全体の簡潔なまとめ（2〜3文）","highlights":["良かった点1","良かった点2"],"improvements":["改善点1","改善点2"],"nextWeekAdvice":"来週へのアドバイス（1〜2文）"}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: prompt,
  });
  const text = response.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");
  return JSON.parse(match[0]) as WeeklyReport;
}

export async function generateProgressionSuggestion(
  exercise: string,
  recentSets: WorkoutSet[]
): Promise<AiProgressionSuggestion> {
  const ai = getAI();
  const history = recentSets
    .slice(0, 10)
    .map((s) => `${s.date} セット${s.setNumber}: ${s.weight}kg×${s.reps}回 RPE${s.rpe} 推定1RM${s.est1RM}kg`)
    .join("\n");

  const prompt = `あなたはパーソナルトレーナーです。以下の「${exercise}」の直近セット履歴を分析して、次のセットの最適な提案をしてください。

【履歴（新しい順）】
${history}

プログレッシブオーバーロードの原則に基づき、JSON形式のみで回答してください（説明不要）:
{"targetWeight": number, "targetReps": number, "targetRPE": number, "strategy": "戦略の種類（重量増加/回数増加/同重量維持/重量減少）", "reasoning": "具体的な根拠（2〜3文）"}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: prompt,
  });
  const text = response.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");
  return JSON.parse(match[0]) as AiProgressionSuggestion;
}

export async function estimateNutrition(
  foodName: string
): Promise<NutritionEstimate> {
  const ai = getAI();
  const prompt = `「${foodName}」の栄養成分を100gあたりで推定してください。
JSON形式のみで返答してください（説明不要）:
{"caloriesPer100g": number, "proteinPer100g": number, "carbsPer100g": number, "fatPer100g": number}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: prompt,
  });

  const text = response.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");

  const parsed = JSON.parse(match[0]) as NutritionEstimate;
  return {
    caloriesPer100g: Math.round(parsed.caloriesPer100g),
    proteinPer100g: Math.round(parsed.proteinPer100g * 10) / 10,
    carbsPer100g: Math.round(parsed.carbsPer100g * 10) / 10,
    fatPer100g: Math.round(parsed.fatPer100g * 10) / 10,
  };
}
