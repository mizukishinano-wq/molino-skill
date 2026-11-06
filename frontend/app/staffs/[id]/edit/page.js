"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, POSITIONS } from "../../../../lib/api";
import { Card, Field, GhostButton, PrimaryButton, inputClass } from "../../../../components/ui";

export default function StaffEditPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState({});

  useEffect(() => {
    api("/api/staffs/" + id).then((staff) => setForm({
      name: staff.name,
      position: staff.position,
      joinDate: staff.joinDate,
      status: staff.status,
      note: staff.note || "",
    }));
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    try {
      await api("/api/staffs/" + id, { method: "PUT", body: JSON.stringify(form) });
      window.location.href = "/staffs/" + id;
    } catch (error) {
      setFields(error.fields || {});
    }
  }

  if (!form) return null;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">スタッフ編集</h1>
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
          <fieldset className="mt-5 text-sm">
            <legend>在籍状態</legend>
            <div className="mt-2 flex gap-6">
              <label><input type="radio" className="mr-2" checked={form.status === "在籍"} onChange={() => setForm({ ...form, status: "在籍" })} />在籍</label>
              <label><input type="radio" className="mr-2" checked={form.status === "退職"} onChange={() => setForm({ ...form, status: "退職" })} />退職</label>
            </div>
            <p className="mt-2 text-xs text-stone-500">退職にすると、スキルマップ、スタッフ一覧、できる人一覧に表示されなくなります。データは残ります</p>
          </fieldset>
          <Field label="コメント" hint="スキルマップの名前の下に出ます。200文字まで" error={fields.note}>
            <textarea className={inputClass + (fields.note ? " border-red-400" : "")} rows={3} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>
          <div className="mt-6 flex gap-2">
            <PrimaryButton>保存する</PrimaryButton>
            <GhostButton onClick={() => history.back()}>キャンセル</GhostButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
