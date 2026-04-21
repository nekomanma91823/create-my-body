export interface WorkoutSet {
  date: string;
  exercise: string;
  muscleGroup: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  volume: number;
  est1RM: number;
  restTime?: number;
  tempo?: string;
  notes?: string;
}

export interface Exercise {
  exercise: string;
  muscleGroup: string;
  category: string;
}

export interface WorkoutTemplate {
  templateName: string;
  exerciseOrder: number;
  exercise: string;
  targetSets: number;
  targetReps: number;
  targetRPE: number;
}

export interface Food {
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
}

export interface Meal {
  date: string;
  mealType: "朝食" | "昼食" | "夕食" | "間食";
  foodName: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: "master" | "gemini" | "manual";
}

export interface BodyMetric {
  date: string;
  weight: number;
  bodyFat?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  waist?: number;
  condition: number;
}

export interface UserSettings {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  maintenanceCalories: number;
}

export interface ProgressionSuggestion {
  targetWeight: number;
  targetReps: number;
  reason: string;
}

export interface WeeklyVolume {
  week: string;
  [muscleGroup: string]: number | string;
}

export interface ExerciseTrend {
  date: string;
  est1RM: number;
  volume: number;
}

export interface NutritionEstimate extends Omit<Food, "foodName"> {}
