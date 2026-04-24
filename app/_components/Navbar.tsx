import Link from "next/link";
import { getCurrentUser } from "@/app/_lib/auth";
import LogoutButton from "./LogoutButton";
import { DesktopNavLinks, MobileMenuPanel } from "./NavbarClient";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
      <div className="relative max-w-4xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* 左：ロゴ + デスクトップナビ */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="text-sm font-bold text-zinc-900 shrink-0 hover:text-indigo-600 transition-colors"
            >
              Create My Body
            </Link>
            <DesktopNavLinks />
          </div>

          {/* 右：クイックアクション（デスクトップ）+ ユーザー + ハンバーガー */}
          <div className="flex items-center gap-2 shrink-0">
            {/* デスクトップ：クイックアクション */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                href="/meals"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                + 食事
              </Link>
              <Link
                href="/body-metrics"
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
              >
                + 体組成
              </Link>
              <Link
                href="/log"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                + 記録
              </Link>
            </div>

            {/* デスクトップ：ユーザー + ログアウト */}
            <div className="hidden md:flex items-center gap-2 border-l border-zinc-200 pl-3">
              {user?.email && (
                <span className="text-xs text-zinc-400 max-w-[10rem] truncate">
                  {user.email}
                </span>
              )}
              <LogoutButton />
            </div>

            {/* モバイル：ハンバーガー + ドロワー */}
            <MobileMenuPanel userEmail={user?.email} />
          </div>
        </div>
      </div>
    </header>
  );
}
