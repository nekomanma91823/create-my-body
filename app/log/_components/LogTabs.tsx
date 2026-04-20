"use client";

import { useState } from "react";
import WorkoutForm from "./WorkoutForm";
import TemplateManager from "./TemplateManager";

const TABS = [
  { id: "record", label: "セット記録" },
  { id: "templates", label: "テンプレート管理" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LogTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("record");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "record" && <WorkoutForm />}
      {activeTab === "templates" && <TemplateManager />}
    </div>
  );
}
