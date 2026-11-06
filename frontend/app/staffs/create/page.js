"use client";

import { useState } from "react";
import { api, POSITIONS } from "../../../lib/api";
import { Card, Field, GhostButton, PrimaryButton, inputClass } from "../../../components/ui";

export default function StaffCreatePage() {
  const [form, setForm] = useState({ name: "", position: "ドリンク", joinDate: "", note: "" });
  const [fields, setFields] = useState({});

  async function submit(event) {
    event.preventDefault();
    try {
      const staff = await api("/api/staffs", { method: "POST", body: JSON.stringify(form) });
      window.location.href = "/staffs/" + staff.id;
    } catch (error) {
      setFields(error.fields || {});
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">スタッフを登録</h1>
      <Card className="mx-auto max-w-2xl p-8">
        <form onSubmit={submit}>
          <Field label="名前" required error={fields.name}>
            <input className={inputClass + (fields.name ? " border-red-400" : "")} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="メインポジション" required>
            <select className={inputClass} value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
              {POSITIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="入店日" required error={fields.joinDate}>
            <input type="date" className={inputClass + (fields.joinDate ? " border-red-400" : "")} value={form.joinDate} onChange={(event) => setForm({ ...form, joinDate: event.target.value })} />
          </Field>
          <Field label="コメント" hint="スキルマップの名前の下に出ます。200文字まで" error={fields.note}>
            <textarea className={inputClass + (fields.note ? " border-red-400" : "")} rows={3} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>
          <div className="mt-6 flex gap-2">
            <PrimaryButton>登録する</PrimaryButton>
            <GhostButton onClick={() => history.back()}>キャンセル</GhostButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
