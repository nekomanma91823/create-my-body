import { getUserSettings } from "@/app/_lib/sheets";
import SettingsForm from "./_components/SettingsForm";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">設定</h1>
        <SettingsForm initialSettings={settings} />
      </main>
    </div>
  );
}
