"use client";

import Link from "next/link";
import { useState } from "react";
import { api, errorText, SIGNUP_ENABLED } from "../../lib/api";

export default function SignupPage() {
  return SIGNUP_ENABLED ? <SignupForm /> : <SignupClosed />;
}

function SignupClosed() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-2xl font-bold">新規登録は停止しています</h1>
        <p className="mt-2 text-sm text-stone-500">アカウントが必要な場合は、管理者に連絡してください。</p>
        <p className="mt-6 text-center text-sm text-green-800">
          <Link href="/login">ログイン画面へ戻る</Link>
        </p>
      </section>
    </main>
  );
}

function SignupForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [fields, setFields] = useState({});
  const [sending, setSending] = useState(false);

  function set(key, value) {
    setForm({ ...form, [key]: value });
  }

  async function submit(event) {
    event.preventDefault();
    setFields({});
    setSending(true);
    try {
      const result = await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ ...form, email: form.email.trim().toLowerCase() }),
      });
      localStorage.setItem("token", result.token);
      window.location.href = "/skill-map";
    } catch (error) {
      setFields({ ...(error.fields || {}), form: errorText(error) });
      setSending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-2xl font-bold">社員アカウントを作成</h1>
        <p className="mt-1 text-sm text-stone-500">社員用のアカウントを作成します</p>
        {fields.form && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{fields.form}</p>}
        <Field label="名前" name="name" hint="20文字以内" autoComplete="name" error={fields.name} value={form.name} onChange={(value) => set("name", value)} />
        <Field
          label="メールアドレス"
          name="email"
          type="email"
          autoComplete="username"
          error={fields.email}
          value={form.email}
          onChange={(value) => set("email", value)}
        />
        <Field
          label="パスワード"
          name="password"
          type="password"
          hint="8文字以上"
          autoComplete="new-password"
          error={fields.password}
          value={form.password}
          onChange={(value) => set("password", value)}
        />
        <Field
          label="パスワード（確認）"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          error={fields.passwordConfirm}
          value={form.passwordConfirm}
          onChange={(value) => set("passwordConfirm", value)}
        />
        <button type="submit" disabled={sending} className="mt-6 w-full rounded-md bg-[#1f6b4a] py-3 text-white disabled:opacity-60">
          {sending ? "登録しています..." : "登録する"}
        </button>
        <p className="mt-4 text-center text-sm text-green-800">
          <Link href="/login">アカウントをお持ちの方はログイン</Link>
        </p>
      </form>
    </main>
  );
}

function Field({ label, name, hint, error, value, onChange, type = "text", autoComplete }) {
  return (
    <label className="mt-4 block text-sm">
      {label} <span className="text-red-700">必須</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        className={"mt-1 w-full rounded border px-3 py-2 " + (error ? "border-red-400" : "")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}
