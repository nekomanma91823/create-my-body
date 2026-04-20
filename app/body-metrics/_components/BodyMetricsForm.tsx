"use client";

import { useState } from "react";
import type { BodyMetric } from "@/app/_lib/types";

const CONDITIONS = [1, 2, 3, 4, 5];
const CONDITION_LABELS: Record<number, string> = {
  1: "最悪",
  2: "悪い",
  3: "普通",
  4: "良い",
  5: "絶好調",
};

interface Props {
  onMetricAdded?: (metric: BodyMetric) => void;
}

export default function BodyMetricsForm({ onMetricAdded }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState<number | "">("");
  const [bodyFat, setBodyFat] = useState<number | "">("");
  const [chest, setChest] = useState<number | "">("");
  const [arm, setArm] = useState<number | "">("");
  const [thigh, setThigh] = useState<number | "">("");
  const [waist, setWaist] = useState<number | "">("");
  const [condition, setCondition] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (weight === "") return;
    setSubmitting(true);
    setMessage(null);
    try {
      const body: BodyMetric = {
        date,
        weight: Number(weight),
        bodyFat: bodyFat !== "" ? Number(bodyFat) : undefined,
        chest: chest !== "" ? Number(chest) : undefined,
        arm: arm !== "" ? Number(arm) : undefined,
        thigh: thigh !== "" ? Number(thigh) : undefined,
        waist: waist !== "" ? Number(waist) : undefined,
        condition,
      };
      const res = await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const saved: BodyMetric = await res.json();
      onMetricAdded?.(saved);
      setMessage("記録しました！");
      setWeight("");
      setBodyFat("");
      setChest("");
      setArm("");
      setThigh("");
      setWaist("");
    } catch (e) {
      setMessage(`エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="体重 (kg)"
          value={weight}
          onChange={setWeight}
          step={0.1}
          required
        />
        <NumberField
          label="体脂肪率 (%)"
          value={bodyFat}
          onChange={setBodyFat}
          step={0.1}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-700 mb-2">周径囲 (cm)（任意）</p>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="胸囲" value={chest} onChange={setChest} step={0.1} />
          <NumberField label="腕囲" value={arm} onChange={setArm} step={0.1} />
          <NumberField label="腿囲" value={thigh} onChange={setThigh} step={0.1} />
          <NumberField label="腹囲" value={waist} onChange={setWaist} step={0.1} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          体調{" "}
          <span className="text-indigo-600 font-bold">
            {condition} — {CONDITION_LABELS[condition]}
          </span>
        </label>
        <div className="flex gap-2">
          {CONDITIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCondition(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                condition === v
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || weight === ""}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "記録中..." : "体組成を記録する"}
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
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  required = false,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : parseFloat(e.target.value))
        }
        required={required}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
