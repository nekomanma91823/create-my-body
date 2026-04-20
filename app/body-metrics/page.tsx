import { getBodyMetrics } from "@/app/_lib/sheets";
import BodyMetricsClient from "./_components/BodyMetricsClient";

export default async function BodyMetricsPage() {
  const metrics = await getBodyMetrics();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <BodyMetricsClient initialMetrics={metrics} />
      </main>
    </div>
  );
}
