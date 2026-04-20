import type { WorkoutSet, ProgressionSuggestion, ExerciseTrend, WeeklyVolume } from "./types";

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
