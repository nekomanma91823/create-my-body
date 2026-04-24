"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-xs text-zinc-600 hover:text-zinc-900 font-medium"
    >
      ログアウト
    </button>
  );
}
