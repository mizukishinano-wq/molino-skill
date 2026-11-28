"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, errorText, LEVELS, LEVEL_MEANINGS, POSITIONS, formatJapaneseDate, formatJoin, levelClass } from "../../lib/api";
import { ErrorMessage } from "../../components/ui";
import NoteEditor from "../../components/NoteEditor";

const LEGEND = [
  [0, "未経験"],
  [1, "教わった"],
  [2, "1人でできる"],
  [3, "教えられる"],
];
const VIEW_STORAGE_KEY = "skillMapView";

// 表示方法（カード / 表）は端末ごとの好みなので、サーバーではなくブラウザに覚えさせる。
// プライベートブラウズなどで localStorage が使えないこともあるため、失敗しても画面は動かす
function readSavedView() {
  try {
    const value = localStorage.getItem(VIEW_STORAGE_KEY);
    return value === "card" || value === "table" ? value : null;
  } catch {
    return null;
  }
}

function saveView(value) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, value);
  } catch {
    // 覚えられなくても、今の画面の切り替えはできるので何もしない
  }
}

export default function SkillMapPage() {
  const [position, setPosition] = useState("ドリンク");
  const [newcomersOnly, setNewcomersOnly] = useState(false);
  const [view, setView] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // 前に選んだ表示がなければ、スマホ（幅768px未満）はカード、PCは表で始める
    setView(readSavedView() || (window.matchMedia("(max-width: 767px)").matches ? "card" : "table"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ position, newcomersOnly });
    setError("");
    api("/api/skill-map?" + params)
      .then(setData)
      .catch((cause) => setError(errorText(cause)));
  }, [position, newcomersOnly]);

  // セルを探すたびに配列全体を探さないよう、「スタッフID-仕事ID」→ 習熟度 の表を1回だけ作る
  const levelMap = useMemo(() => {
    const map = new Map();
    data?.cells.forEach((cell) => map.set(cell.staffId + "-" + cell.taskId, cell.level));
    return map;
  }, [data]);

  function levelOf(staffId, taskId) {
    return levelMap.get(staffId + "-" + taskId) || 0;
  }

  function chooseView(value) {
    setView(value);
    saveView(value);
  }

  // コメントを保存したら、画面のデータも書き換える（全体を読み直さずに済ませる）
  function updateNote(saved) {
    setData((current) => ({
      ...current,
      staffs: current.staffs.map((item) => (item.id === saved.id ? { ...item, note: saved.note || "" } : item)),
    }));
  }

  const heading = position === "全て" ? "全て" : position;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-bold">ホールスタッフのスキルマップ</h1>
          <div className="text-sm text-stone-500">最終更新：{data?.updatedOn ? formatJapaneseDate(data.updatedOn) : "—"}</div>
        </div>
        {view && <ViewSwitch view={view} onChange={chooseView} />}
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
      {!data || !view ? (
        !error && <p>読み込み中...</p>
      ) : (
        <>
          <Summary heading={heading} data={data} />
          {data.staffs.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white px-4 py-6 text-center text-sm text-stone-500">表示できるスタッフがいません。</p>
          ) : view === "card" ? (
            <div className="space-y-3">
              {data.staffs.map((staff) => (
                <StaffCard key={staff.id} staff={staff} tasks={data.tasks} showAll={position === "全て"} levelOf={levelOf} onSaveNote={updateNote} />
              ))}
            </div>
          ) : (
            <SkillTable data={data} levelOf={levelOf} onSaveNote={updateNote} />
          )}
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-1 py-3 text-xs text-stone-400">
            <span>「新人」は入店3か月以内。「-」は未経験・未登録です。</span>
            <span>スタッフ名・仕事名から詳細を確認できます</span>
          </div>
        </>
      )}
    </div>
  );
}

function ViewSwitch({ view, onChange }) {
  return (
    <div role="group" aria-label="表示の切り替え" className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-sm">
      {[
        ["card", "カード"],
        ["table", "表"],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          className={"rounded-md px-4 py-1.5 " + (view === value ? "bg-[#1f6b4a] text-white" : "text-stone-600")}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Summary({ heading, data }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">
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
  );
}

function LevelBadge({ level, className = "" }) {
  return (
    <span className={"inline-flex justify-center rounded-md px-2 py-1 text-xs " + levelClass(level) + " " + className}>
      {level === 0 ? "-" : LEVELS[level]}
    </span>
  );
}

function StaffHeading({ staff }) {
  return (
    <>
      <Link className="font-bold whitespace-nowrap text-[#1f6b4a]" href={"/staffs/" + staff.id}>
        {staff.name}
      </Link>
      {staff.newcomer && <span className="ml-2 rounded bg-[#e5f5ec] px-1.5 py-0.5 text-xs text-[#1f6b4a]">新人</span>}
      <div className="text-xs whitespace-nowrap text-stone-400">
        {formatJoin(staff.joinDate)} / {staff.position}
      </div>
    </>
  );
}

// スマホ向け。1人分の情報（コメント全文と各仕事の習熟度）を縦に並べる
function StaffCard({ staff, tasks, showAll, levelOf, onSaveNote }) {
  const capable = tasks.filter((task) => levelOf(staff.id, task.id) >= 2).length;
  // 「全て」は仕事が約30件あり縦に長くなるため、最初は閉じておき「できる数」だけ見せる
  const groups = showAll ? POSITIONS.map((item) => [item, tasks.filter((task) => task.position === item)]).filter(([, rows]) => rows.length) : [["", tasks]];

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <StaffHeading staff={staff} />
        </div>
        <span className="shrink-0 text-xs text-stone-500">
          1人でできる {capable}/{tasks.length}
        </span>
      </div>
      <NoteEditor staff={staff} onSaved={onSaveNote} />
      <details className="mt-3" open={!showAll}>
        <summary className="cursor-pointer text-sm text-[#1f6b4a]">仕事ごとの習熟度（{tasks.length}件）</summary>
        {groups.map(([group, rows]) => (
          <div key={group}>
            {group && <h3 className="mt-3 text-xs font-bold text-stone-500">{group}</h3>}
            <ul className="divide-y divide-stone-100">
              {rows.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link className="text-stone-700" href={"/tasks/" + task.id}>
                    {task.name}
                  </Link>
                  <LevelBadge level={levelOf(staff.id, task.id)} className="min-w-24 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </article>
  );
}

// PC 向け。全員と全仕事を一覧で見比べる
function SkillTable({ data, levelOf, onSaveNote }) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      {/* 縦横どちらにスクロールしても、スタッフ名の列と仕事名の行が見えるように固定する */}
      <div className="max-h-[calc(100vh-13rem)] overflow-auto">
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
                <td className="sticky left-0 z-10 w-52 min-w-52 bg-white px-3 py-2 align-top">
                  <StaffHeading staff={staff} />
                  <NoteEditor staff={staff} onSaved={onSaveNote} lines={3} small />
                </td>
                {data.tasks.map((task) => (
                  <td key={task.id} className="p-2 text-center">
                    <LevelBadge level={levelOf(staff.id, task.id)} className="min-w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
