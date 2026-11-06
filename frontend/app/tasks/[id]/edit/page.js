"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, POSITIONS } from "../../../../lib/api";
import { Card, Field, GhostButton, PrimaryButton, inputClass } from "../../../../components/ui";

export default function TaskEditPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/tasks/" + id + "?minLevel=0").then((data) => setForm({ name: data.task.name, position: data.task.position }));
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    try {
      await api("/api/tasks/" + id, { method: "PUT", body: JSON.stringify(form) });
      window.location.href = "/tasks/" + id;
    } catch (error) {
      setFields(error.fields || {});
      setMessage(error.message);
    }
  }

  if (!form) return null;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">仕事を編集</h1>
      <Card className="mx-auto max-w-2xl p-8">
        <form onSubmit={submit}>
          <Field label="仕事名" required error={fields.name}>
            <input className={inputClass + (fields.name ? " border-red-400" : "")} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="ポジション" required>
            <select className={inputClass} value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
              {POSITIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <div className="mt-6 flex gap-2">
            <PrimaryButton>保存する</PrimaryButton>
            <GhostButton onClick={() => history.back()}>キャンセル</GhostButton>
          </div>
        </form>
      </Card>
      {message && !fields.name && <p className="mx-auto mt-3 max-w-2xl text-sm text-red-600">{message}</p>}
      <p className="mx-auto mt-3 max-w-2xl text-xs text-stone-500">同じポジションに同じ仕事名は登録できません</p>
    </div>
  );
}
