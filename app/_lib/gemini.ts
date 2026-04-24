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

export async function generateWeeklyReport(
  input: WeeklyReportInput,
): Promise<WeeklyReport> {
  const ai = getAI();
  const { training, nutrition, body, week } = input;
  const volumeChange =
    training.prevVolume > 0
      ? Math.round(
          ((training.totalVolume - training.prevVolume) / training.prevVolume) *
            100,
        )
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
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  const text = response.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");
  return JSON.parse(match[0]) as WeeklyReport;
}

export interface ParsedNutritionLabel {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  per: "100g" | "serving";
  servingSize?: string;
}

export async function parseNutritionLabel(text: string): Promise<ParsedNutritionLabel> {
  const ai = getAI();
  const prompt = `以下のテキストは食品の栄養成分表示です。数値を抽出してJSONで返してください。

テキスト:
${text}

注意:
- per は "100g" または "serving"（1食分・1枚など）のどちらを基準にしているか
- servingSize は1食分の場合の量（例: "1枚(60g)"）、100g基準なら null
- sodium は食塩相当量(g)。ナトリウム(mg)が記載されている場合は 食塩相当量 = Na(mg)×2.54÷1000 で変換
- 記載がない項目は null

JSON形式のみで返答（説明不要）:
{"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number|null, "sugar": number|null, "sodium": number|null, "per": "100g"|"serving", "servingSize": string|null}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: prompt,
  });
  const text2 = response.text ?? "";
  const match = text2.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");
  const parsed = JSON.parse(match[0]);
  return {
    calories: Math.round(parsed.calories ?? 0),
    protein: Math.round((parsed.protein ?? 0) * 10) / 10,
    carbs: Math.round((parsed.carbs ?? 0) * 10) / 10,
    fat: Math.round((parsed.fat ?? 0) * 10) / 10,
    fiber: parsed.fiber != null ? Math.round(parsed.fiber * 10) / 10 : undefined,
    sugar: parsed.sugar != null ? Math.round(parsed.sugar * 10) / 10 : undefined,
    sodium: parsed.sodium != null ? Math.round(parsed.sodium * 100) / 100 : undefined,
    per: parsed.per ?? "serving",
    servingSize: parsed.servingSize ?? undefined,
  };
}

export async function generateProgressionSuggestion(
  exercise: string,
  recentSets: WorkoutSet[],
): Promise<AiProgressionSuggestion> {
  const ai = getAI();
  const history = recentSets
    .slice(0, 10)
    .map(
      (s) =>
        `${s.date} セット${s.setNumber}: ${s.weight}kg×${s.reps}回 RPE${s.rpe} 推定1RM${s.est1RM}kg`,
    )
    .join("\n");

  const prompt = `あなたはパーソナルトレーナーです。以下の「${exercise}」の直近セット履歴を分析して、次のセットの最適な提案をしてください。

【履歴（新しい順）】
${history}

プログレッシブオーバーロードの原則に基づき、JSON形式のみで回答してください（説明不要）:
{"targetWeight": number, "targetReps": number, "targetRPE": number, "strategy": "戦略の種類（重量増加/回数増加/同重量維持/重量減少）", "reasoning": "具体的な根拠（2〜3文）"}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  const text = response.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");
  return JSON.parse(match[0]) as AiProgressionSuggestion;
}

export interface ServingEstimate extends NutritionEstimate {
  servingLabel: string;
  servingGrams: number;
}

export async function estimateWithServing(foodName: string): Promise<ServingEstimate> {
  const ai = getAI();
  const prompt = `「${foodName}」について以下を推定してください。

1. 一般的な1食分の目安量（例: 1杯、1個、1人前、1枚）とそのグラム数
2. 100gあたりの栄養成分

JSON形式のみで返答してください（説明不要）:
{"servingLabel":"1杯","servingGrams":350,"caloriesPer100g":number,"proteinPer100g":number,"carbsPer100g":number,"fatPer100g":number,"fiberPer100g":number|null,"sugarPer100g":number|null,"sodiumPer100g":number|null}
※ sodiumPer100g は食塩相当量(g)で返してください。
※ servingLabel は「1杯」「1個」「1人前」「1枚」など具体的な単位で。`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: prompt,
  });

  const text = response.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geminiから有効なJSONを取得できませんでした");

  const parsed = JSON.parse(match[0]);
  return {
    servingLabel: parsed.servingLabel ?? "1食分",
    servingGrams: Math.round(parsed.servingGrams ?? 100),
    caloriesPer100g: Math.round(parsed.caloriesPer100g),
    proteinPer100g: Math.round(parsed.proteinPer100g * 10) / 10,
    carbsPer100g: Math.round(parsed.carbsPer100g * 10) / 10,
    fatPer100g: Math.round(parsed.fatPer100g * 10) / 10,
    fiberPer100g: parsed.fiberPer100g != null ? Math.round(parsed.fiberPer100g * 10) / 10 : undefined,
    sugarPer100g: parsed.sugarPer100g != null ? Math.round(parsed.sugarPer100g * 10) / 10 : undefined,
    sodiumPer100g: parsed.sodiumPer100g != null ? Math.round(parsed.sodiumPer100g * 100) / 100 : undefined,
  };
}

export async function estimateNutrition(foodName: string): Promise<NutritionEstimate> {
  return estimateWithServing(foodName);
}
