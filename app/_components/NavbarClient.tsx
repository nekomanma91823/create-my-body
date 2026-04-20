"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/history", label: "履歴" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/report", label: "レポート" },
  { href: "/exercises", label: "種目管理" },
  { href: "/settings", label: "設定" },
];

const QUICK_LINKS = [
  { href: "/meals", label: "+ 食事記録", color: "bg-emerald-600 hover:bg-emerald-700" },
  { href: "/body-metrics", label: "+ 体組成", color: "bg-amber-500 hover:bg-amber-600" },
  { href: "/log", label: "+ 記録", color: "bg-indigo-600 hover:bg-indigo-700" },
];

export function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {NAV_LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileMenuPanel({ userEmail }: { userEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="md:hidden p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* モバイルメニュー */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-lg">
          {/* クイックアクション */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-zinc-100">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-center rounded-xl py-2.5 text-white text-sm font-semibold transition-colors ${link.color}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ナビゲーションリンク */}
          <nav className="px-2 py-2">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {link.label}
                  <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </nav>

          {/* ユーザー情報 + ログアウト */}
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            {userEmail && (
              <span className="text-xs text-zinc-400 truncate max-w-[60%]">{userEmail}</span>
            )}
            <LogoutButton />
          </div>
        </div>
      )}
    </>
  );
}
