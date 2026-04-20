import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "your-secret-key-change-this",
);

interface AuthUser {
  email: string;
}

// ユーザー認証
export async function validateUser(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const usersJson = process.env.AUTH_USERS;
  if (!usersJson) {
    console.error("AUTH_USERS env var not set");
    return null;
  }

  try {
    const users: Array<{ email: string; password: string }> =
      JSON.parse(usersJson);
    const user = users.find(
      (u) => u.email === email && u.password === password,
    );
    return user ? { email: user.email } : null;
  } catch (e) {
    console.error("Failed to parse AUTH_USERS:", e);
    return null;
  }
}

// Token生成
export async function createToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

// Token検証
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const verified = await jwtVerify(token, secret);
    const email = verified.payload.email as string;
    return email ? { email } : null;
  } catch {
    return null;
  }
}

// セッション設定
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

// セッション削除
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

// 現在のユーザー取得
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
