"use client";

import { useState } from "react";
import { api, POSITIONS } from "../../../lib/api";
import { Card, Field, GhostButton, PrimaryButton, inputClass } from "../../../components/ui";

export default function TaskCreatePage() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("ドリンク");
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setFields({});
    setMessage("");
    try {
      await api("/api/tasks", { method: "POST", body: JSON.stringify({ name, position }) });
      window.location.href = "/tasks";
    } catch (error) {
      setFields(error.fields || {});
      setMessage(error.message);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">仕事を登録</h1>
      <Card className="mx-auto max-w-2xl p-8">
        <form onSubmit={submit}>
          <Field label="仕事名" required error={fields.name || (!fields.name && message)}>
            <input className={inputClass + (fields.name ? " border-red-400" : "")} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="ポジション" required>
            <select className={inputClass} value={position} onChange={(event) => setPosition(event.target.value)}>
              {POSITIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <div className="mt-6 flex gap-2">
            <PrimaryButton>登録する</PrimaryButton>
            <GhostButton onClick={() => history.back()}>キャンセル</GhostButton>
          </div>
          <p className="mt-4 text-xs text-stone-500">同じポジションに同じ仕事名は登録できません</p>
        </form>
      </Card>
    </div>
  );
}
