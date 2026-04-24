import type { WorkoutSet, ProgressionSuggestion, ExerciseTrend, WeeklyVolume, BodyMetric, Meal } from "./types";

export interface TrendPoint {
  label: string;
  weight?: number;
  calories?: number;
}

export function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function buildWeeklyVolume(workouts: WorkoutSet[]): { data: WeeklyVolume[]; groups: string[] } {
  const map = new Map<string, Record<string, number>>();
  const groupSet = new Set<string>();
  for (const w of workouts) {
    const week = getISOWeek(w.date);
    if (!map.has(week)) map.set(week, {});
    const entry = map.get(week)!;
    entry[w.muscleGroup] = (entry[w.muscleGroup] || 0) + w.volume;
    groupSet.add(w.muscleGroup);
  }
  const data: WeeklyVolume[] = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, volumes]) => ({ week, ...volumes }));
  return { data, groups: Array.from(groupSet) };
}

export function buildExerciseTrend(workouts: WorkoutSet[], exercise: string): ExerciseTrend[] {
  return workouts
    .filter((w) => w.exercise === exercise)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({ date: w.date, est1RM: w.est1RM, volume: w.volume }));
}

export function calcEst1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function calcVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function buildWeightCalorieTrend(
  metrics: BodyMetric[],
  meals: Meal[],
): { daily: TrendPoint[]; weekly: TrendPoint[] } {
  // 直近30日の日次データ
  const today = new Date();
  const dailyPoints: TrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const metric = metrics.find((m) => m.date === dateStr);
    const dayMeals = meals.filter((m) => m.date === dateStr);
    const calories = dayMeals.length > 0
      ? Math.round(dayMeals.reduce((s, m) => s + m.calories, 0))
      : undefined;
    dailyPoints.push({ label, weight: metric?.weight, calories });
  }

  // 直近12週の週次データ
  const weekMap = new Map<string, { weights: number[]; calories: number[] }>();
  for (const m of metrics) {
    const w = getISOWeek(m.date);
    if (!weekMap.has(w)) weekMap.set(w, { weights: [], calories: [] });
    weekMap.get(w)!.weights.push(m.weight);
  }
  for (const m of meals) {
    const w = getISOWeek(m.date);
    if (!weekMap.has(w)) weekMap.set(w, { weights: [], calories: [] });
    weekMap.get(w)!.calories.push(m.calories);
  }
  const weeklyPoints: TrendPoint[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, { weights, calories }]) => ({
      label: week.replace(/^\d{4}-/, ""),
      weight: weights.length > 0 ? Math.round((weights.reduce((s, v) => s + v, 0) / weights.length) * 10) / 10 : undefined,
      calories: calories.length > 0 ? Math.round(calories.reduce((s, v) => s + v, 0) / calories.length) : undefined,
    }));

  return { daily: dailyPoints, weekly: weeklyPoints };
}

export function getProgressionSuggestion(
  prev: WorkoutSet
): ProgressionSuggestion {
  if (prev.rpe <= 8) {
    return {
      targetWeight: prev.weight + 2.5,
      targetReps: prev.reps,
      reason: `前回RPE ${prev.rpe} → 重量+2.5kg を目標`,
    };
  } else if (prev.rpe === 9) {
    return {
      targetWeight: prev.weight,
      targetReps: prev.reps + 1,
      reason: `前回RPE ${prev.rpe} → 回数+1 を目標`,
    };
  } else {
    return {
      targetWeight: prev.weight,
      targetReps: prev.reps,
      reason: `前回RPE ${prev.rpe}（限界）→ 重量据え置き・フォーム安定を狙う`,
    };
  }
}
