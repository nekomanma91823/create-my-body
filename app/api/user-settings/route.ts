import { getUserSettings, setUserSettings } from "@/app/_lib/sheets";
import type { UserSettings } from "@/app/_lib/types";

export async function GET() {
  try {
    return Response.json(await getUserSettings());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UserSettings;
    return Response.json(await setUserSettings(body));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
