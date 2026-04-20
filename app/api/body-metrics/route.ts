import { getBodyMetrics, addBodyMetric } from "@/app/_lib/sheets";
import type { BodyMetric } from "@/app/_lib/types";

export async function GET() {
  try {
    return Response.json(await getBodyMetrics());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BodyMetric;
    return Response.json(await addBodyMetric(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
