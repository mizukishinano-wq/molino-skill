"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", result.token);
      window.location.href = "/skill-map";
    } catch (error) {
      setMessage(error.message === "Failed to fetch" || error.message === "Load failed" ? "接続できませんでした。ページを開き直してください。" : error.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="mt-1 text-sm text-stone-500">社員用のログインです</p>
        {message && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
        <label className="mt-6 block text-sm">メールアドレス
          <input name="email" type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm">パスワード
          <input name="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="mt-6 w-full rounded-md bg-[#1f6b4a] py-3 text-white">ログイン</button>
      </form>
    </main>
  );
}
