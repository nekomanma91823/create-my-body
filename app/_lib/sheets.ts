import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import type {
  WorkoutSet,
  Exercise,
  WorkoutTemplate,
  Food,
  Meal,
  BodyMetric,
  UserSettings,
} from "./types";
import { calcEst1RM, calcVolume } from "./calculations";

const SHEET_CONFIGS: Record<string, string[]> = {
  Exercises: ["Exercise", "MuscleGroup", "Category"],
  WorkoutTemplates: [
    "TemplateName",
    "ExerciseOrder",
    "Exercise",
    "TargetSets",
    "TargetReps",
    "TargetRPE",
  ],
  Sets: [
    "Date",
    "Exercise",
    "MuscleGroup",
    "SetNumber",
    "Weight",
    "Reps",
    "RPE",
    "Volume",
    "Est1RM",
    "RestTime",
    "Tempo",
    "Notes",
  ],
  Foods: [
    "FoodName",
    "CaloriesPer100g",
    "ProteinPer100g",
    "CarbsPer100g",
    "FatPer100g",
    "FiberPer100g",
    "SugarPer100g",
    "SodiumPer100g",
    "AlcoholPer100g",
    "ServingGrams",
    "ServingLabel",
  ],
  Meals: [
    "Date",
    "MealType",
    "FoodName",
    "Amount",
    "Calories",
    "Protein",
    "Carbs",
    "Fat",
    "Fiber",
    "Sugar",
    "Sodium",
    "Alcohol",
    "Source",
  ],
  BodyMetrics: [
    "Date",
    "Weight",
    "BodyFat",
    "Chest",
    "Arm",
    "Thigh",
    "Waist",
    "Condition",
  ],
  UserSettings: [
    "TargetCalories",
    "TargetProtein",
    "TargetCarbs",
    "TargetFat",
    "MaintenanceCalories",
  ],
};

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key)
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  return new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

let _doc: GoogleSpreadsheet | null = null;
let _docLoaded = false;
const _sheetsLoaded = new Set<string>();

async function getDoc() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SPREADSHEET_ID");
  if (!_doc) {
    _doc = new GoogleSpreadsheet(spreadsheetId, getAuth());
    _docLoaded = false;
  }
  if (!_docLoaded) {
    await _doc.loadInfo();
    _docLoaded = true;
  }
  return _doc;
}

async function getSheet(title: string) {
  const doc = await getDoc();
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues: SHEET_CONFIGS[title] });
    _sheetsLoaded.add(title);
  } else if (!_sheetsLoaded.has(title)) {
    await sheet.loadHeaderRow();
    // SHEET_CONFIGSに定義された列が不足していれば末尾に追加する
    const expected = SHEET_CONFIGS[title] ?? [];
    const existing = new Set(sheet.headerValues);
    const missing = expected.filter((col) => !existing.has(col));
    if (missing.length > 0) {
      await sheet.setHeaderRow([...sheet.headerValues, ...missing]);
    }
    _sheetsLoaded.add(title);
  }
  return sheet;
}

const num = (v: unknown) => parseFloat(String(v)) || 0;
const str = (v: unknown) => String(v ?? "");

// ── Exercises ──────────────────────────────────────────────
export async function getExercises(): Promise<Exercise[]> {
  const sheet = await getSheet("Exercises");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    exercise: str(r.get("Exercise")),
    muscleGroup: str(r.get("MuscleGroup")),
    category: str(r.get("Category")),
  }));
}

export async function addExercise(data: Exercise): Promise<Exercise> {
  const sheet = await getSheet("Exercises");
  await sheet.addRow({
    Exercise: data.exercise,
    MuscleGroup: data.muscleGroup,
    Category: data.category,
  });
  return data;
}

// ── WorkoutTemplates ───────────────────────────────────────
export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const sheet = await getSheet("WorkoutTemplates");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    templateName: str(r.get("TemplateName")),
    exerciseOrder: num(r.get("ExerciseOrder")),
    exercise: str(r.get("Exercise")),
    targetSets: num(r.get("TargetSets")),
    targetReps: num(r.get("TargetReps")),
    targetRPE: num(r.get("TargetRPE")),
  }));
}

export async function addWorkoutTemplate(
  data: WorkoutTemplate
): Promise<WorkoutTemplate> {
  const sheet = await getSheet("WorkoutTemplates");
  await sheet.addRow({
    TemplateName: data.templateName,
    ExerciseOrder: data.exerciseOrder,
    Exercise: data.exercise,
    TargetSets: data.targetSets,
    TargetReps: data.targetReps,
    TargetRPE: data.targetRPE,
  });
  return data;
}

// ── Sets ───────────────────────────────────────────────────
export async function getWorkouts(): Promise<WorkoutSet[]> {
  const sheet = await getSheet("Sets");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    date: str(r.get("Date")),
    exercise: str(r.get("Exercise")),
    muscleGroup: str(r.get("MuscleGroup")),
    setNumber: num(r.get("SetNumber")),
    weight: num(r.get("Weight")),
    reps: num(r.get("Reps")),
    rpe: num(r.get("RPE")),
    volume: num(r.get("Volume")),
    est1RM: num(r.get("Est1RM")),
    restTime: r.get("RestTime") ? num(r.get("RestTime")) : undefined,
    tempo: r.get("Tempo") || undefined,
    notes: r.get("Notes") || undefined,
  }));
}

export async function addWorkout(
  data: Omit<WorkoutSet, "volume" | "est1RM">
): Promise<WorkoutSet> {
  const sheet = await getSheet("Sets");
  const volume = calcVolume(data.weight, data.reps);
  const est1RM = calcEst1RM(data.weight, data.reps);
  const row: WorkoutSet = { ...data, volume, est1RM };
  await sheet.addRow({
    Date: row.date,
    Exercise: row.exercise,
    MuscleGroup: row.muscleGroup,
    SetNumber: row.setNumber,
    Weight: row.weight,
    Reps: row.reps,
    RPE: row.rpe,
    Volume: row.volume,
    Est1RM: row.est1RM,
    RestTime: row.restTime ?? "",
    Tempo: row.tempo ?? "",
    Notes: row.notes ?? "",
  });
  return row;
}

// ── Foods ──────────────────────────────────────────────────
export async function getFoods(): Promise<Food[]> {
  const sheet = await getSheet("Foods");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    foodName: str(r.get("FoodName")),
    caloriesPer100g: num(r.get("CaloriesPer100g")),
    proteinPer100g: num(r.get("ProteinPer100g")),
    carbsPer100g: num(r.get("CarbsPer100g")),
    fatPer100g: num(r.get("FatPer100g")),
    fiberPer100g: r.get("FiberPer100g") ? num(r.get("FiberPer100g")) : undefined,
    sugarPer100g: r.get("SugarPer100g") ? num(r.get("SugarPer100g")) : undefined,
    sodiumPer100g: r.get("SodiumPer100g") ? num(r.get("SodiumPer100g")) : undefined,
    alcoholPer100g: r.get("AlcoholPer100g") ? num(r.get("AlcoholPer100g")) : undefined,
    servingGrams: r.get("ServingGrams") ? num(r.get("ServingGrams")) : undefined,
    servingLabel: r.get("ServingLabel") ? str(r.get("ServingLabel")) : undefined,
  }));
}

export async function updateFood(foodName: string, data: Partial<Omit<Food, "foodName">>): Promise<Food> {
  const sheet = await getSheet("Foods");
  const rows = await sheet.getRows();
  const row = rows.find((r) => str(r.get("FoodName")) === foodName);
  if (!row) throw new Error(`Food "${foodName}" not found`);
  if (data.caloriesPer100g !== undefined) row.set("CaloriesPer100g", data.caloriesPer100g);
  if (data.proteinPer100g !== undefined) row.set("ProteinPer100g", data.proteinPer100g);
  if (data.carbsPer100g !== undefined) row.set("CarbsPer100g", data.carbsPer100g);
  if (data.fatPer100g !== undefined) row.set("FatPer100g", data.fatPer100g);
  if (data.fiberPer100g !== undefined) row.set("FiberPer100g", data.fiberPer100g);
  if (data.sugarPer100g !== undefined) row.set("SugarPer100g", data.sugarPer100g);
  if (data.sodiumPer100g !== undefined) row.set("SodiumPer100g", data.sodiumPer100g);
  if (data.alcoholPer100g !== undefined) row.set("AlcoholPer100g", data.alcoholPer100g);
  if (data.servingGrams !== undefined) row.set("ServingGrams", data.servingGrams);
  if (data.servingLabel !== undefined) row.set("ServingLabel", data.servingLabel);
  await row.save();
  return { foodName, ...data } as Food;
}

export async function deleteFood(foodName: string): Promise<void> {
  const sheet = await getSheet("Foods");
  const rows = await sheet.getRows();
  const row = rows.find((r) => str(r.get("FoodName")) === foodName);
  if (!row) throw new Error(`Food "${foodName}" not found`);
  await row.delete();
}

export async function addFood(data: Food): Promise<Food> {
  const sheet = await getSheet("Foods");
  await sheet.addRow({
    FoodName: data.foodName,
    CaloriesPer100g: data.caloriesPer100g,
    ProteinPer100g: data.proteinPer100g,
    CarbsPer100g: data.carbsPer100g,
    FatPer100g: data.fatPer100g,
    FiberPer100g: data.fiberPer100g ?? "",
    SugarPer100g: data.sugarPer100g ?? "",
    SodiumPer100g: data.sodiumPer100g ?? "",
    AlcoholPer100g: data.alcoholPer100g ?? "",
    ServingGrams: data.servingGrams ?? "",
    ServingLabel: data.servingLabel ?? "",
  });
  return data;
}

// ── Meals ──────────────────────────────────────────────────
export async function getMeals(): Promise<Meal[]> {
  const sheet = await getSheet("Meals");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    date: str(r.get("Date")),
    mealType: str(r.get("MealType")) as Meal["mealType"],
    foodName: str(r.get("FoodName")),
    amount: num(r.get("Amount")),
    calories: num(r.get("Calories")),
    protein: num(r.get("Protein")),
    carbs: num(r.get("Carbs")),
    fat: num(r.get("Fat")),
    fiber: r.get("Fiber") ? num(r.get("Fiber")) : undefined,
    sugar: r.get("Sugar") ? num(r.get("Sugar")) : undefined,
    sodium: r.get("Sodium") ? num(r.get("Sodium")) : undefined,
    alcohol: r.get("Alcohol") ? num(r.get("Alcohol")) : undefined,
    source: str(r.get("Source")) as Meal["source"],
    rowIndex: r.rowNumber,
  }));
}

export async function updateMeal(rowIndex: number, data: Partial<Omit<Meal, "rowIndex">>): Promise<void> {
  const sheet = await getSheet("Meals");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.rowNumber === rowIndex);
  if (!row) throw new Error("Meal row not found");
  if (data.amount !== undefined) row.set("Amount", data.amount);
  if (data.calories !== undefined) row.set("Calories", data.calories);
  if (data.protein !== undefined) row.set("Protein", data.protein);
  if (data.carbs !== undefined) row.set("Carbs", data.carbs);
  if (data.fat !== undefined) row.set("Fat", data.fat);
  if (data.fiber !== undefined) row.set("Fiber", data.fiber);
  if (data.sugar !== undefined) row.set("Sugar", data.sugar);
  if (data.sodium !== undefined) row.set("Sodium", data.sodium);
  if (data.alcohol !== undefined) row.set("Alcohol", data.alcohol);
  await row.save();
}

export async function deleteMeal(rowIndex: number): Promise<void> {
  const sheet = await getSheet("Meals");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.rowNumber === rowIndex);
  if (!row) throw new Error("Meal row not found");
  await row.delete();
}

export async function addMeal(data: Meal): Promise<Meal> {
  const sheet = await getSheet("Meals");
  await sheet.addRow({
    Date: data.date,
    MealType: data.mealType,
    FoodName: data.foodName,
    Amount: data.amount,
    Calories: data.calories,
    Protein: data.protein,
    Carbs: data.carbs,
    Fat: data.fat,
    Fiber: data.fiber ?? "",
    Sugar: data.sugar ?? "",
    Sodium: data.sodium ?? "",
    Alcohol: data.alcohol ?? "",
    Source: data.source,
  });
  return data;
}

// ── BodyMetrics ────────────────────────────────────────────
export async function getBodyMetrics(): Promise<BodyMetric[]> {
  const sheet = await getSheet("BodyMetrics");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    date: str(r.get("Date")),
    weight: num(r.get("Weight")),
    bodyFat: r.get("BodyFat") ? num(r.get("BodyFat")) : undefined,
    chest: r.get("Chest") ? num(r.get("Chest")) : undefined,
    arm: r.get("Arm") ? num(r.get("Arm")) : undefined,
    thigh: r.get("Thigh") ? num(r.get("Thigh")) : undefined,
    waist: r.get("Waist") ? num(r.get("Waist")) : undefined,
    condition: num(r.get("Condition")),
  }));
}

export async function addBodyMetric(data: BodyMetric): Promise<BodyMetric> {
  const sheet = await getSheet("BodyMetrics");
  await sheet.addRow({
    Date: data.date,
    Weight: data.weight,
    BodyFat: data.bodyFat ?? "",
    Chest: data.chest ?? "",
    Arm: data.arm ?? "",
    Thigh: data.thigh ?? "",
    Waist: data.waist ?? "",
    Condition: data.condition,
  });
  return data;
}

// ── UserSettings ───────────────────────────────────────────
export async function getUserSettings(): Promise<UserSettings | null> {
  const sheet = await getSheet("UserSettings");
  const rows = await sheet.getRows();
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    targetCalories: num(r.get("TargetCalories")),
    targetProtein: num(r.get("TargetProtein")),
    targetCarbs: num(r.get("TargetCarbs")),
    targetFat: num(r.get("TargetFat")),
    maintenanceCalories: num(r.get("MaintenanceCalories")),
  };
}

export async function setUserSettings(data: UserSettings): Promise<UserSettings> {
  const sheet = await getSheet("UserSettings");
  const rows = await sheet.getRows();
  if (rows.length > 0) {
    const r = rows[0];
    r.set("TargetCalories", data.targetCalories);
    r.set("TargetProtein", data.targetProtein);
    r.set("TargetCarbs", data.targetCarbs);
    r.set("TargetFat", data.targetFat);
    r.set("MaintenanceCalories", data.maintenanceCalories);
    await r.save();
  } else {
    await sheet.addRow({
      TargetCalories: data.targetCalories,
      TargetProtein: data.targetProtein,
      TargetCarbs: data.targetCarbs,
      TargetFat: data.targetFat,
      MaintenanceCalories: data.maintenanceCalories,
    });
  }
  return data;
}
