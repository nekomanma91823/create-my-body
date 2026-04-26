"use client";

import { useState, useMemo } from "react";
import type { Food } from "@/app/_lib/types";

interface Props {
  initialFoods: Food[];
}

const EMPTY_FORM: Omit<Food, "foodName"> = {
  caloriesPer100g: 0,
  proteinPer100g: 0,
  carbsPer100g: 0,
  fatPer100g: 0,
  fiberPer100g: undefined,
  sugarPer100g: undefined,
  sodiumPer100g: undefined,
  alcoholPer100g: undefined,
  servingGrams: undefined,
  servingLabel: undefined,
};

export default function FoodManager({ initialFoods }: Props) {
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Food | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [form, setForm] = useState<Omit<Food, "foodName">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? foods.filter((f) => f.foodName.toLowerCase().includes(q)) : foods;
  }, [foods, search]);

  function startEdit(food: Food) {
    setEditTarget(food);
    setForm({
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
      fiberPer100g: food.fiberPer100g,
      sugarPer100g: food.sugarPer100g,
      sodiumPer100g: food.sodiumPer100g,
      alcoholPer100g: food.alcoholPer100g,
      servingGrams: food.servingGrams,
      servingLabel: food.servingLabel,
    });
    setAddMode(false);
    setMessage(null);
  }

  function startAdd() {
    setEditTarget(null);
    setAddMode(true);
    setNewName("");
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  function cancelEdit() {
    setEditTarget(null);
    setAddMode(false);
    setMessage(null);
  }

  const numField = (key: keyof typeof form, val: string) => {
    const n = parseFloat(val);
    setForm((prev) => ({ ...prev, [key]: isNaN(n) ? undefined : n }));
  };

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      if (addMode) {
        if (!newName.trim()) { setMessage("食品名を入力してください"); return; }
        const body: Food = { foodName: newName.trim(), ...form };
        const res = await fetch("/api/foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setFoods((prev) => [...prev, body]);
        setMessage(`「${newName.trim()}」を追加しました`);
        setAddMode(false);
      } else if (editTarget) {
        const body: Food = { foodName: editTarget.foodName, ...form };
        const res = await fetch("/api/foods", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setFoods((prev) => prev.map((f) => f.foodName === editTarget.foodName ? body : f));
        setMessage(`「${editTarget.foodName}」を更新しました`);
        setEditTarget(null);
      }
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(foodName: string) {
    if (!confirm(`「${foodName}」を削除しますか？`)) return;
    setDeletingName(foodName);
    try {
      const res = await fetch("/api/foods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setFoods((prev) => prev.filter((f) => f.foodName !== foodName));
      if (editTarget?.foodName === foodName) setEditTarget(null);
      setMessage(`「${foodName}」を削除しました`);
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDeletingName(null);
    }
  }

  const isEditing = editTarget !== null || addMode;

  return (
    <div className="space-y-6">
      {/* 検索 + 追加ボタン */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="食品名で検索..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={startAdd}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + 新規追加
        </button>
      </div>

      {/* 編集 / 追加フォーム */}
      {isEditing && (
        <section className="bg-white rounded-2xl border border-indigo-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-zinc-800">
            {addMode ? "新規食品を追加" : `編集: ${editTarget?.foodName}`}
          </h2>

          {addMode && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">食品名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 鶏胸肉"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <p className="text-xs text-zinc-400">以下はすべて 100g あたりの値</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumInput label="カロリー (kcal)" value={form.caloriesPer100g} onChange={(v) => numField("caloriesPer100g", v)} />
            <NumInput label="タンパク質 (g)" value={form.proteinPer100g} onChange={(v) => numField("proteinPer100g", v)} />
            <NumInput label="炭水化物 (g)" value={form.carbsPer100g} onChange={(v) => numField("carbsPer100g", v)} />
            <NumInput label="脂質 (g)" value={form.fatPer100g} onChange={(v) => numField("fatPer100g", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumInput label="食物繊維 (g)" value={form.fiberPer100g} onChange={(v) => numField("fiberPer100g", v)} optional />
            <NumInput label="糖質 (g)" value={form.sugarPer100g} onChange={(v) => numField("sugarPer100g", v)} optional />
            <NumInput label="食塩相当量 (g)" value={form.sodiumPer100g} onChange={(v) => numField("sodiumPer100g", v)} optional />
            <NumInput label="アルコール (g)" value={form.alcoholPer100g} onChange={(v) => numField("alcoholPer100g", v)} optional />
          </div>

          <div className="border-t border-zinc-200 pt-3">
            <p className="text-xs text-zinc-400 mb-2">1食分の目安（設定すると記録時にg換算で選択できます）</p>
            <div className="grid grid-cols-2 gap-3">
              <NumInput label="1食分 (g)" value={form.servingGrams} onChange={(v) => numField("servingGrams", v)} optional />
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  単位ラベル<span className="ml-1 text-zinc-400">（任意）</span>
                </label>
                <input
                  type="text"
                  value={form.servingLabel ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, servingLabel: e.target.value || undefined }))}
                  placeholder="例: 1本、1個、1杯"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-xl bg-zinc-100 px-5 py-2 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              キャンセル
            </button>
          </div>

          {message && (
            <p className={`text-sm font-medium ${message.startsWith("エラー") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </section>
      )}

      {/* 食品一覧 */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            食品一覧
            <span className="ml-2 text-sm font-normal text-zinc-400">
              {filtered.length} / {foods.length} 件
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-10">
            {search ? "該当する食品がありません" : "食品が登録されていません"}
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((food) => (
              <div
                key={food.foodName}
                className={`px-6 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors ${
                  editTarget?.foodName === food.foodName ? "bg-indigo-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{food.foodName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {food.caloriesPer100g}kcal / P{food.proteinPer100g}g / C{food.carbsPer100g}g / F{food.fatPer100g}g
                    {food.fiberPer100g != null && ` / 食物繊維${food.fiberPer100g}g`}
                    {food.sugarPer100g != null && ` / 糖質${food.sugarPer100g}g`}
                    {food.sodiumPer100g != null && ` / 食塩${food.sodiumPer100g}g`}
                    {food.alcoholPer100g != null && ` / アルコール${food.alcoholPer100g}g`}
                    {food.servingGrams != null && (
                      <span className="ml-1 text-indigo-400">
                        {` / ${food.servingLabel ?? "1食分"}=${food.servingGrams}g`}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => startEdit(food)}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(food.foodName)}
                    disabled={deletingName === food.foodName}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 border border-red-200 disabled:opacity-50 transition-colors"
                  >
                    {deletingName === food.foodName ? "..." : "削除"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!isEditing && message && (
        <p className={`text-sm text-center font-medium ${message.startsWith("エラー") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1">
        {label}
        {optional && <span className="ml-1 text-zinc-400">（任意）</span>}
      </label>
      <input
        type="number"
        min={0}
        step={0.1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
