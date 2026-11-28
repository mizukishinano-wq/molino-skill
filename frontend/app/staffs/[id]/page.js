"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AI_ENABLED, api, errorText, LEVELS, NOTE_MAX_LENGTH, POSITIONS, formatJapaneseDate, levelClass, saveStaffNote } from "../../../lib/api";
import { ErrorMessage } from "../../../components/ui";
import AdvicePanel from "../../../components/AdvicePanel";

export default function StaffDetailPage() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [skills, setSkills] = useState([]);
  const [note, setNote] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/staffs/" + id), api("/api/staffs/" + id + "/skills")])
      .then(([next, skillRows]) => {
        setStaff(next);
        setNote(next.note || "");
        setSkills(skillRows);
      })
      .catch((cause) => setError(errorText(cause)));
  }, [id]);

  async function saveNote() {
    setNoteMessage("");
    try {
      const saved = await saveStaffNote(staff, note);
      setStaff(saved);
      setNote(saved.note || "");
      setNoteMessage("保存しました");
    } catch (error) {
      setNoteMessage(errorText(error));
    }
  }

  async function remove() {
    try {
      await api("/api/staffs/" + id, { method: "DELETE" });
      window.location.href = "/staffs";
    } catch (cause) {
      setConfirming(false);
      setError(errorText(cause));
    }
  }

  if (!staff) return <ErrorMessage message={error} />;
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">スタッフ詳細</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={"/staffs/" + id + "/skills/edit"} className="rounded-md bg-[#1f6b4a] px-3 py-2 text-sm text-white">
            スキルをまとめて編集
          </Link>
          <Link href={"/staffs/" + id + "/edit"} className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm">
            編集
          </Link>
          <button className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600" onClick={() => setConfirming(true)}>
            削除
          </button>
        </div>
      </div>
      <ErrorMessage message={error} />
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">
          {staff.name}
          {staff.newcomer && <span className="ml-2 rounded bg-[#e5f5ec] px-2 py-0.5 text-xs font-normal text-[#1f6b4a]">新人</span>}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-500 sm:grid-cols-3">
          <div>
            メインポジション<div className="mt-1 text-stone-800">{staff.position}</div>
          </div>
          <div>
            入店日<div className="mt-1 text-stone-800">{formatJapaneseDate(staff.joinDate)}</div>
          </div>
          <div>
            在籍状態<div className="mt-1 text-stone-800">{staff.status}</div>
          </div>
        </div>
        <label className="mt-4 block text-sm text-stone-500">
          コメント
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-stone-300 px-3 py-2 text-stone-800 field-sizing-content"
            rows={4}
            maxLength={NOTE_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className="mt-1 text-xs text-stone-400">改行すると、スキルマップと注意事項で箇条書きで表示されます。{NOTE_MAX_LENGTH}文字まで</p>
        <button type="button" className="mt-2 rounded-md bg-[#1f6b4a] px-3 py-1.5 text-sm text-white" onClick={saveNote}>
          コメントを保存
        </button>
        {noteMessage && <p className="mt-2 text-xs text-stone-500">{noteMessage}</p>}
      </section>
      {AI_ENABLED && staff.active && <AdvicePanel staffId={id} />}
      <h2 className="mb-2 mt-6 font-bold">スキル一覧</h2>
      {POSITIONS.map((position) => {
        const rows = skills.filter((skill) => skill.position === position);
        if (!rows.length) return null;
        return (
          <section key={position} className="mb-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
            <h3 className="bg-stone-50 px-4 py-2 text-sm font-bold">
              {position} <span className="font-normal text-stone-500">{rows.length}仕事</span>
            </h3>
            <div className="hidden grid-cols-3 bg-stone-50 px-4 py-2 text-xs text-stone-500 sm:grid">
              <span>仕事名</span>
              <span>習熟度</span>
              <span>最終更新日</span>
            </div>
            {/* スマホでは仕事名を1行目に、習熟度と更新日を2行目に並べる */}
            {rows.map((skill) => (
              <div key={skill.taskId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t px-4 py-3 text-sm sm:grid-cols-3">
                <span className="col-span-2 text-[#1f6b4a] sm:col-span-1">{skill.taskName}</span>
                <span className={"w-fit rounded-md px-3 py-1 text-xs " + levelClass(skill.level)}>
                  {skill.level} {LEVELS[skill.level]}
                </span>
                <span className="text-right text-xs text-stone-500 sm:text-left sm:text-sm sm:text-stone-800">
                  {skill.updatedOn ? <span className="sm:hidden">更新 </span> : null}
                  {skill.updatedOn}
                </span>
              </div>
            ))}
          </section>
        );
      })}
      {confirming && (
        <div className="fixed inset-0 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold">スタッフを削除</h2>
            <p className="mt-3 text-sm">{staff.name}さんを削除しますか。このスタッフのスキルも一緒に削除されます。</p>
            <p className="mt-2 text-sm">退職にしたい場合は、編集で在籍状態を切り替えてください。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md bg-red-700 px-4 py-2 text-sm text-white" onClick={remove}>
                削除する
              </button>
              <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setConfirming(false)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
