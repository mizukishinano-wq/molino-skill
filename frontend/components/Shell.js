"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const LINKS = [
  ["/skill-map", "スキルマップ"],
  ["/staffs", "スタッフ一覧"],
  ["/tasks", "仕事一覧"],
];

export default function Shell({ children }) {
  const path = usePathname();
  const publicPage = path === "/login" || path === "/signup";
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (publicPage) return;
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    api("/api/auth/me").then(setMe).catch(() => {
      window.location.href = "/login";
    });
  }, [publicPage, path]);

  if (publicPage) return children;
  if (!me) return <main className="p-8 text-stone-500">読み込み中...</main>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8">
          <div className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e5f5ec] text-[#1f6b4a]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 2.5v7.2a2.2 2.2 0 1 0 1.4 2.05V2.5H4Zm6.6 0v7.2a2.2 2.2 0 1 0 1.4 2.05V2.5h-1.4Z" fill="currentColor" />
              </svg>
            </span>
            ホテルモリノ
          </div>
          <nav className="hidden gap-8 text-sm md:flex">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} className={path.startsWith(href) ? "underline decoration-2 underline-offset-8" : "text-stone-500"}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="text-sm md:justify-self-end">
            <span className="mr-3">{me.name}</span>
            <button
              className="text-[#1f6b4a]"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
            >
              ログアウト
            </button>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm md:hidden">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={"shrink-0 " + (path.startsWith(href) ? "underline decoration-2 underline-offset-8" : "text-stone-500")}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
    </div>
  );
}
