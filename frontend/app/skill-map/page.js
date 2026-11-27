"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, LEVELS, LEVEL_MEANINGS, POSITIONS, formatJapaneseDate, formatJoin, levelClass } from "../../lib/api";
import { ErrorMessage } from "../../components/ui";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ position, newcomersOnly });
    setError("");
    api("/api/skill-map?" + params)
      .then((next) => {
        setData(next);
        // コメント欄の入力中の値は、保存済みの値とは別に持つ（保存ボタンを押すまで反映しないため）
        const initial = {};
        next.staffs.forEach((staff) => {
          initial[staff.id] = staff.note || "";
        });
        setNotes(initial);
      })
      .catch((cause) => setError(errorText(cause)));
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
        staffs: current.staffs.map((item) => (item.id === staff.id ? { ...item, note } : item)),
      }));
      setNoteMessage((current) => ({ ...current, [staff.id]: "保存しました" }));
    } catch (error) {
      setNoteMessage((current) => ({ ...current, [staff.id]: errorText(error) }));
    }
  }

  function levelOf(staffId, taskId) {
    return data.cells.find((cell) => cell.staffId === staffId && cell.taskId === taskId)?.level || 0;
  }

  const heading = position === "全て" ? "全て" : position;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-bold">ホールスタッフのスキルマップ</h1>
        <div className="text-sm text-stone-500">最終更新：{data?.updatedOn ? formatJapaneseDate(data.updatedOn) : "—"}</div>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {["全て", ...POSITIONS].map((item) => (
          <button
            key={item}
            className={"shrink-0 rounded-lg px-4 py-2 text-sm " + (position === item ? "bg-[#1f6b4a] text-white" : "border border-stone-300 bg-white")}
            onClick={() => setPosition(item)}
          >
            {item}
          </button>
        ))}
        <label className="ml-1 flex shrink-0 items-center gap-2 text-sm">
          <input type="checkbox" checked={newcomersOnly} onChange={(event) => setNewcomersOnly(event.target.checked)} />
          新人のみ表示
        </label>
      </div>
      <ErrorMessage message={error} />
      {!data ? (
        !error && <p>読み込み中...</p>
      ) : (
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-xs text-stone-600">
            <h2 className="text-base font-bold text-stone-900">
              {heading}{" "}
              <span className="ml-1 text-sm font-normal text-stone-500">
                {data.tasks.length}仕事・スタッフ {data.staffs.length}名
              </span>
            </h2>
            {LEGEND.map(([level, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className={"inline-block h-3 w-3 rounded-sm " + (level === 0 ? "border border-stone-300 bg-white" : levelClass(level))} />
                {label}
              </span>
            ))}
            <details className="w-full sm:w-auto">
              <summary className="cursor-pointer text-[#1f6b4a]">習熟度の意味</summary>
              <div className="mt-2 space-y-1">
                {LEVEL_MEANINGS.map(
                  (meaning, level) =>
                    meaning && (
                      <p key={level}>
                        <span className="font-medium text-stone-700">{LEVELS[level]}</span>　{meaning}
                      </p>
                    ),
                )}
              </div>
            </details>
          </div>
          {/* 縦横どちらにスクロールしても、スタッフ名の列と仕事名の行が見えるように固定する */}
          <div className="max-h-[calc(100vh-13rem)] overflow-auto border-t">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-20 bg-stone-50 text-stone-600">
                <tr>
                  <th className="sticky left-0 z-30 bg-stone-50 p-3 text-left font-normal">スタッフ名</th>
                  {data.tasks.map((task) => (
                    <th key={task.id} className="min-w-28 p-2 text-center font-normal">
                      <Link className="text-[#1f6b4a]" href={"/tasks/" + task.id}>
                        {task.name}
                      </Link>
                      <div className="text-xs text-stone-400">
                        {task.capableCount}人/{data.staffs.length}名
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.staffs.map((staff) => (
                  <tr key={staff.id} className="border-t">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2">
                      <Link className="whitespace-nowrap text-[#1f6b4a]" href={"/staffs/" + staff.id}>
                        {staff.name}
                      </Link>
                      {staff.newcomer && <span className="ml-2 rounded bg-[#e5f5ec] px-1.5 py-0.5 text-xs text-[#1f6b4a]">新人</span>}
                      <div className="whitespace-nowrap text-xs text-stone-400">
                        {formatJoin(staff.joinDate)} / {staff.position}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          className="w-36 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs"
                          maxLength={200}
                          placeholder="コメント"
                          aria-label={staff.name + "さんのコメント"}
                          value={notes[staff.id] ?? ""}
                          onChange={(event) => setNotes({ ...notes, [staff.id]: event.target.value })}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveNote(staff);
                          }}
                        />
                        <button
                          type="button"
                          className="shrink-0 rounded-md bg-[#1f6b4a] px-2 py-1 text-xs font-medium text-white"
                          onClick={() => saveNote(staff)}
                        >
                          保存
                        </button>
                      </div>
                      {noteMessage[staff.id] && <p className="mt-1 text-xs font-medium text-[#1f6b4a]">{noteMessage[staff.id]}</p>}
                    </td>
                    {data.tasks.map((task) => {
                      const level = levelOf(staff.id, task.id);
                      return (
                        <td key={task.id} className="p-2 text-center">
                          <span className={"inline-flex min-w-24 justify-center rounded-md px-2 py-1 text-xs " + levelClass(level)}>
                            {level === 0 ? "-" : LEVELS[level]}
                          </span>
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
