import { validateUser, createToken, setAuthCookie } from "@/app/_lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    const user = await validateUser(email, password);
    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken(user);
    await setAuthCookie(token);

    return Response.json({ success: true, email: user.email });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
