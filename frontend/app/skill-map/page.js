"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, LEVELS, LEVEL_MEANINGS, POSITIONS, formatJapaneseDate, formatJoin, levelClass } from "../../lib/api";

const LEGEND = [
  [0, "未経験"],
  [1, "教わった"],
  [2, "1人でできる"],
  [3, "教えられる"],
];

export default function SkillMapPage() {
  const [position, setPosition] = useState("ドリンク");
  const [newcomersOnly, setNewcomersOnly] = useState(false);
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});
  const [noteMessage, setNoteMessage] = useState({});

  useEffect(() => {
    const params = new URLSearchParams({ position, newcomersOnly });
    api("/api/skill-map?" + params).then((next) => {
      setData(next);
      const initial = {};
      next.staffs.forEach((staff) => { initial[staff.id] = staff.note || ""; });
      setNotes(initial);
    });
  }, [position, newcomersOnly]);

  async function saveNote(staff) {
    const note = notes[staff.id] ?? "";
    if (note === (staff.note || "")) return;
    setNoteMessage((current) => ({ ...current, [staff.id]: "" }));
    try {
      await api("/api/staffs/" + staff.id, {
        method: "PUT",
        body: JSON.stringify({
          name: staff.name,
          position: staff.position,
          joinDate: staff.joinDate,
          status: staff.status,
          note,
        }),
      });
      setData((current) => ({
        ...current,
        staffs: current.staffs.map((item) => item.id === staff.id ? { ...item, note } : item),
      }));
      setNoteMessage((current) => ({ ...current, [staff.id]: "保存しました" }));
    } catch (error) {
      setNoteMessage((current) => ({ ...current, [staff.id]: error.message || "保存できませんでした" }));
    }
  }

  function levelOf(staffId, taskId) {
    return data.cells.find((cell) => cell.staffId === staffId && cell.taskId === taskId)?.level || 0;
  }

  const heading = position === "全て" ? "全て" : position;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">ホールスタッフのスキルマップ</h1>
          <p className="mt-1 text-sm text-stone-500">できる仕事を、ひと目で。配置や教える人を決めるときに確認しましょう。</p>
        </div>
        <div className="text-sm text-stone-500">
          最終更新：{data?.updatedOn ? formatJapaneseDate(data.updatedOn) : "—"}
        </div>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["全て", ...POSITIONS].map((item) => (
          <button key={item} className={"shrink-0 rounded-lg px-4 py-2 text-sm " + (position === item ? "bg-[#1f6b4a] text-white" : "border border-stone-300 bg-white")} onClick={() => setPosition(item)}>{item}</button>
        ))}
        <label className="ml-1 flex shrink-0 items-center gap-2 text-sm">
          <input type="checkbox" checked={newcomersOnly} onChange={(event) => setNewcomersOnly(event.target.checked)} />
          新人のみ表示
        </label>
      </div>
      {!data ? <p>読み込み中...</p> : (
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="font-bold">{heading} <span className="ml-2 text-sm font-normal text-stone-500">{data.tasks.length}仕事</span></h2>
            <span className="text-sm text-stone-500">スタッフ {data.staffs.length}名</span>
          </div>
          <div className="flex gap-4 px-4 pb-3 text-xs text-stone-600">
            {LEGEND.map(([level, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className={"inline-block h-3 w-3 rounded-sm " + (level === 0 ? "border border-stone-300 bg-white" : levelClass(level))} />
                {label}
              </span>
            ))}
          </div>
          <div className="space-y-1 px-4 pb-3 text-xs text-stone-600">
            {LEVEL_MEANINGS.map((meaning, level) => meaning && (
              <p key={level}><span className="font-medium text-stone-700">{LEVELS[level]}</span>　{meaning}</p>
            ))}
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-stone-600">
                <tr>
                  <th className="p-3 text-left font-normal">スタッフ名</th>
                  {data.tasks.map((task) => (
                    <th key={task.id} className="p-3 text-center font-normal">
                      <Link className="text-[#1f6b4a]" href={"/tasks/" + task.id}>{task.name}</Link>
                      <div className="text-xs text-stone-400">{task.capableCount}人/{data.staffs.length}名</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.staffs.map((staff) => (
                  <tr key={staff.id} className="border-t">
                    <td className="p-3">
                      <Link className="text-[#1f6b4a]" href={"/staffs/" + staff.id}>{staff.name}</Link>
                      {staff.newcomer && <span className="ml-2 rounded bg-[#e5f5ec] px-1.5 py-0.5 text-xs text-[#1f6b4a]">新人</span>}
                      <div className="text-xs text-stone-400">{formatJoin(staff.joinDate)} / {staff.position}</div>
                      <div className="mt-2 flex items-end gap-2">
                        <textarea
                          className="w-52 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs"
                          rows={2}
                          maxLength={200}
                          placeholder="コメント"
                          value={notes[staff.id] ?? ""}
                          onChange={(event) => setNotes({ ...notes, [staff.id]: event.target.value })}
                        />
                        <button type="button" className="shrink-0 rounded-md bg-[#1f6b4a] px-3 py-2 text-xs font-medium text-white" onClick={() => saveNote(staff)}>保存</button>
                      </div>
                      {noteMessage[staff.id] && <p className="mt-1 text-xs font-medium text-[#1f6b4a]">{noteMessage[staff.id]}</p>}
                    </td>
                    {data.tasks.map((task) => {
                      const level = levelOf(staff.id, task.id);
                      return (
                        <td key={task.id} className="p-2 text-center">
                          <span className={"inline-flex min-w-24 justify-center rounded-md px-2 py-1 text-xs " + levelClass(level)}>{level === 0 ? "-" : LEVELS[level]}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between px-4 py-3 text-xs text-stone-400">
            <span>「新人」は入店3か月以内。「-」は未経験・未登録です。</span>
            <span>スタッフ名・仕事名から詳細を確認できます</span>
          </div>
        </section>
      )}
    </div>
  );
}
