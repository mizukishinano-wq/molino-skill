"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../../lib/api";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [fields, setFields] = useState({});

  function set(key, value) {
    setForm({ ...form, [key]: value });
  }

  async function submit(event) {
    event.preventDefault();
    setFields({});
    try {
      const result = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("token", result.token);
      window.location.href = "/skill-map";
    } catch (error) {
      setFields(error.fields || { form: error.message });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-2xl font-bold">社員アカウントを作成</h1>
        <p className="mt-1 text-sm text-stone-500">社員用のアカウントを作成します</p>
        <Field label="名前" required hint="20文字以内" error={fields.name} value={form.name} onChange={(value) => set("name", value)} />
        <Field label="メールアドレス" required error={fields.email} value={form.email} onChange={(value) => set("email", value)} />
        <Field label="パスワード" required hint="8文字以上" type="password" error={fields.password} value={form.password} onChange={(value) => set("password", value)} />
        <Field label="パスワード（確認）" required type="password" error={fields.passwordConfirm} value={form.passwordConfirm} onChange={(value) => set("passwordConfirm", value)} />
        <button className="mt-6 w-full rounded-md bg-[#1f6b4a] py-3 text-white">登録する</button>
        <p className="mt-4 text-center text-sm text-green-800"><Link href="/login">アカウントをお持ちの方はログイン</Link></p>
      </form>
    </main>
  );
}

function Field({ label, required, hint, error, value, onChange, type = "text" }) {
  return (
    <label className="mt-4 block text-sm">
      {label} {required && <span className="text-red-700">必須</span>}
      <input type={type} className={"mt-1 w-full rounded border px-3 py-2 " + (error ? "border-red-400" : "")} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}
