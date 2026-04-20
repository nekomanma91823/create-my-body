import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "your-secret-key-change-this",
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const pathname = request.nextUrl.pathname;

  // ログインページは常にアクセス可能
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // API routes は常にアクセス可能
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // 認証チェック
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Token 検証
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
