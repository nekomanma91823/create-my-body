import Link from "next/link";
import { getCurrentUser } from "@/app/_lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 shrink-0">
          <Link href="/" className="text-base font-bold text-zinc-900">
            Create My Body
          </Link>
          <nav className="hidden sm:flex items-center gap-0.5 text-sm">
            <NavLink href="/history">履歴</NavLink>
            <NavLink href="/calendar">カレンダー</NavLink>
            <NavLink href="/report">レポート</NavLink>
            <NavLink href="/exercises">種目</NavLink>
            <NavLink href="/settings">設定</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex gap-1.5">
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
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-2">
            {user?.email && (
              <span className="hidden lg:block text-xs text-zinc-400 max-w-32 truncate">
                {user.email}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
    >
      {children}
    </Link>
  );
}
